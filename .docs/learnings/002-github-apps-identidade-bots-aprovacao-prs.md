# 002 — GitHub Apps: Identidade de Bots e Automação de PRs

> **Nível:** Dev Junior  
> **Tema:** GitHub, Automação, CI/CD, Segurança  
> **Data:** 2026-09-01  
> **Origem:** Decisão de arquitetura ADR-002 — modelo de aprovação de PRs no MathQuiz

---

## O que é um GitHub App e por que não usar conta pessoal para bots?

Imagine que você trabalha em um escritório e precisa que um robô entregue
documentos por você. Você tem duas opções:

1. Dar o seu crachá pessoal para o robô usar
2. Criar um crachá específico para o robô, com acesso só às salas que ele precisa

A opção 1 parece mais fácil, mas se o robô perder o crachá, qualquer pessoa
pode entrar em qualquer sala com a sua identidade. A opção 2 é mais segura:
o crachá do robô tem nome diferente, acesso limitado, e você pode cancelar
só o crachá dele sem afetar o seu.

**GitHub Apps são os crachás específicos para robôs.**

---

## Como um GitHub App funciona

Um GitHub App tem três partes:

```
App ID        → identificador único do App (número, ex: 123456)
Private Key   → arquivo .pem que prova que você é dono do App
Installation  → permissão do App para agir em um repositório específico
```

Quando o App quer fazer algo (abrir PR, comentar, aprovar), ele:

1. Assina uma requisição com a Private Key → gera um JWT (token temporário)
2. Usa o JWT para pedir um "Installation Token" à API do GitHub
3. Usa o Installation Token para executar a ação (dura no máximo 1 hora)

```typescript
// Exemplo simplificado de como gerar um Installation Token
import { App } from "@octokit/app";

const app = new App({
  appId: process.env.APP_ID!,           // número do App
  privateKey: process.env.PRIVATE_KEY!, // conteúdo do arquivo .pem
});

// Gera token efêmero para o repositório
const octokit = await app.getInstallationOctokit(INSTALLATION_ID);

// Agora pode fazer chamadas como o App
await octokit.rest.pulls.create({
  owner: "airamcmrosa",
  repo: "MathQuiz",
  title: "feat(frontend): add QuizStart component",
  head: "feature/task-004",
  base: "main",
});
```

**Pontos importantes:**
- O token expira em 1 hora — muito mais seguro que um token permanente
- Se a Private Key vazar, você pode revogá-la sem afetar sua conta pessoal
- O App aparece como `nome-do-app[bot]` no GitHub — identidade clara

---

## Personal Access Token vs GitHub App

| Característica | Personal Access Token (PAT) | GitHub App |
|---|---|---|
| Identidade | Sua conta pessoal | `nome[bot]` separado |
| Expiração | Nunca (ou configurável) | Token de instalação: 1h |
| Escopo | Todos os seus repos | Só os repos instalados |
| Revogar | Afeta tudo que usa o token | Só afeta o App |
| Violação de ToS | ❌ Se criada conta extra | ✅ Mecanismo oficial |
| Aprovação de PR | Não pode aprovar o próprio PR | Pode aprovar PRs de outros Apps |

---

## Branch Protection e o modelo de dupla aprovação

Branch protection é uma regra que impede commits diretos em uma branch
importante (como `main`). Para um código entrar em `main`, ele precisa
passar por um Pull Request com um número mínimo de aprovações.

```
main (protegida)
  │
  └── Ninguém pode fazer push direto
  └── PRs precisam de N aprovações antes do merge
  └── Reviews stale são descartados se novos commits chegarem
```

No MathQuiz, usamos **2 aprovações**:

```
PR aberto por agente[bot]
        │
        ▼
mathquiz-reviewer[bot] → 1ª aprovação (técnica: segurança + qualidade)
        │
        ▼
airamcmrosa → 2ª aprovação (negócio: "isso é o que eu queria?")
        │
        ▼
merge em main ✓
```

```typescript
// Como o reviewer-agent aprova um PR via API
await octokit.rest.pulls.createReview({
  owner: "airamcmrosa",
  repo: "MathQuiz",
  pull_number: 42,
  event: "APPROVE",           // ou "REQUEST_CHANGES" ou "COMMENT"
  body: "✅ Status: APPROVED\n\nNenhum finding CRITICAL encontrado.",
});
```

**Por que duas aprovações e não uma?**
- O bot faz a revisão técnica automatizada (segurança, padrões, cobertura)
- Você faz a revisão de negócio ("isso resolve minha necessidade?")
- Sem aprovação humana, o merge nunca acontece — é o HIL Gate 3

---

## Como o MathQuiz usa isso

O MathQuiz tem 5 GitHub Apps, um por agente:

```
mathquiz-frontend[bot]  → abre PRs com código React/Vite
mathquiz-backend[bot]   → abre PRs com código Node.js/Express
mathquiz-infra[bot]     → abre PRs com AWS CDK
mathquiz-qa[bot]        → posta relatórios de teste como comentário no PR
mathquiz-reviewer[bot]  → posta review de segurança + aprova quando APPROVED
```

Cada App tem sua própria `Private Key` guardada como GitHub Secret:

```
FRONTEND_APP_ID + FRONTEND_PRIVATE_KEY
BACKEND_APP_ID  + BACKEND_PRIVATE_KEY
INFRA_APP_ID    + INFRA_PRIVATE_KEY
QA_APP_ID       + QA_PRIVATE_KEY
REVIEWER_APP_ID + REVIEWER_PRIVATE_KEY
```

No GitHub Actions, a autenticação usa a action `tibdex/github-app-token`
para gerar o token efêmero antes de cada operação:

```yaml
# .github/workflows/ci.yml — trecho de autenticação
- name: Authenticate as mathquiz-frontend[bot]
  id: auth
  uses: tibdex/github-app-token@v2
  with:
    app_id: ${{ secrets.FRONTEND_APP_ID }}
    private_key: ${{ secrets.FRONTEND_PRIVATE_KEY }}

- name: Create Pull Request
  env:
    GH_TOKEN: ${{ steps.auth.outputs.token }}
  run: |
    gh pr create \
      --title "feat(frontend): add QuizStart component" \
      --base main \
      --head feature/task-004
```

---

## Diagrama completo do flow de PR no MathQuiz

```
feature/task-NNN
      │
      │ git push
      ▼
GitHub Actions CI roda
      │
      ├── testes passam? ──► ❌ falha: qa-agent tenta corrigir (max 2x)
      │
      ▼ ✅ testes OK
mathquiz-{agente}[bot] abre PR
      │
      ▼
mathquiz-qa[bot] posta summary de testes como comentário
      │
      ▼
mathquiz-reviewer[bot] analisa código
      │
      ├── BLOCKED ──► HIL Gate 2: airamcmrosa decide Corrigir ou Aceitar risco
      │
      ▼ APPROVED
mathquiz-reviewer[bot] aprova PR (1ª approval)
      │
      ▼
GitHub notifica airamcmrosa para revisão final
      │
      ├── ❌ Rejeita ──► HIL Gate 3: feedback → agente corrige → novo commit
      │                  (reviews stale descartados → reviewer re-aprova)
      │
      ▼ ✅ Aprova
airamcmrosa aprova PR (2ª approval)
      │
      ▼
merge em main → CI/CD deploy pipeline roda
```

---

## Exercícios — Múltipla Escolha

**1.** Qual é a principal vantagem de um GitHub App sobre um Personal Access Token para automação?

- A) GitHub Apps são gratuitos e PATs têm custo
- B) GitHub Apps têm identidade própria e tokens efêmeros, reduzindo o risco de vazamento
- C) GitHub Apps podem escrever em qualquer repositório do GitHub
- D) GitHub Apps não precisam de autenticação

**2.** Um token de instalação de GitHub App expira em:

- A) 24 horas
- B) 7 dias
- C) 1 hora
- D) Nunca expira

**3.** O que acontece se a Private Key de um GitHub App vazar?

- A) Toda a conta GitHub do dono é comprometida
- B) Todos os repositórios do GitHub ficam acessíveis
- C) Apenas o App específico é afetado — pode ser revogado sem impactar a conta pessoal
- D) Nada, pois a Private Key não dá acesso direto ao GitHub

**4.** Por que criar contas GitHub separadas para cada bot é problemático?

- A) Contas extras custam dinheiro no GitHub
- B) Viola os Termos de Uso do GitHub, que proíbe múltiplas contas pessoais para automação
- C) Contas extras não conseguem abrir Pull Requests
- D) O GitHub limita a 2 contas por email

**5.** No modelo de dupla aprovação do MathQuiz, qual é o papel de `mathquiz-reviewer[bot]`?

- A) Fazer o merge do PR em main
- B) Escrever o código de revisão e abrir o PR
- C) Fazer a aprovação técnica (segurança e qualidade) como primeira barreira
- D) Criar os GitHub Secrets no repositório

**6.** O que é branch protection?

- A) Uma forma de criptografar o código no repositório
- B) Uma regra que impede commits diretos em branches importantes, exigindo PRs com aprovações
- C) Um sistema de backup automático das branches
- D) Uma configuração que bloqueia forks do repositório

**7.** O que acontece com o review do `mathquiz-reviewer[bot]` se o agente de implementação fizer um novo commit no PR após a aprovação?

- A) O review permanece válido
- B) O review é descartado automaticamente (dismiss stale reviews) e o reviewer precisa re-aprovar
- C) O PR é fechado automaticamente
- D) O merge é bloqueado permanentemente

---

## Gabarito

| Questão | Resposta | Justificativa |
|---|---|---|
| 1 | B | Apps têm identidade `nome[bot]` separada da conta pessoal, e os tokens duram apenas 1 hora, limitando a janela de exposição em caso de vazamento. |
| 2 | C | Installation tokens do GitHub App expiram em 1 hora por design — são tokens de curta duração (short-lived), ao contrário de PATs que podem ser permanentes. |
| 3 | C | A Private Key compromete apenas aquele App específico. Revogar a chave no painel de Developer Settings cancela o acesso sem afetar a conta pessoal ou outros Apps. |
| 4 | B | Os ToS do GitHub proíbem explicitamente múltiplas contas pessoais para automação. O mecanismo oficial para bots é o GitHub App. Contas extras arriscam ban. |
| 5 | C | O reviewer-agent faz a revisão técnica automatizada (OWASP, qualidade, cobertura) e emite a primeira aprovação. A segunda aprovação — de negócio — é sempre humana (airamcmrosa). |
| 6 | B | Branch protection define regras para branches importantes: impede push direto, exige PRs, define número mínimo de approvals e pode exigir CI verde antes do merge. |
| 7 | B | `dismiss_stale_reviews: true` descarta automaticamente reviews aprovados quando novos commits chegam. Garante que o reviewer sempre analisa o código mais recente, não uma versão anterior. |

> Próximos passos sugeridos:
> - [Documentação oficial de GitHub Apps](https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/about-creating-github-apps)
> - [tibdex/github-app-token — action usada no MathQuiz](https://github.com/tibdex/github-app-token)
> - [Branch protection rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
> - ADR-002 deste projeto: `docs/adr/002-github-apps-pr-approval-model.md`
