# ADR-002 — GitHub Apps por Agente + Modelo de Aprovação Dupla de PRs

> **Status:** ACCEPTED  
> **Data:** 2026-09-01  
> **Decidido por:** airamcmrosa (HIL Gate — decisão de arquitetura)  
> **Contexto:** task-001 — Provisionamento de repositório e governança

---

## Contexto

O sistema MathQuiz é desenvolvido por um pipeline multi-agente (frontend-agent,
backend-agent, devops-agent, qa-agent, reviewer-agent). Cada agente produz código
e abre Pull Requests no repositório `airamcmrosa/MathQuiz`.

Precisávamos decidir como representar a identidade de cada agente no GitHub e
como estruturar o modelo de aprovação de PRs para preservar o HIL Gate 3
(aprovação humana do incremento).

---

## Opções Consideradas

### Opção A — Tudo na conta `airamcmrosa`
Todos os agentes usam o mesmo token da conta da usuária.

- ❌ Autor e aprovador são a mesma conta — branch protection bloqueia self-approval
- ❌ Histórico sem distinção de autoria por agente
- ❌ Token único = ponto único de falha

### Opção B — Contas secundárias por agente
Criar contas GitHub separadas para cada agente.

- ❌ Viola os Termos de Uso do GitHub (uma pessoa = uma conta)
- ❌ Risco de ban das contas
- ✅ Identidade separada por agente (mas não vale o risco)

### Opção C — Um único GitHub App `mathquiz-agents`
Um App compartilhado para todos os agentes.

- ✅ Sem violação de ToS
- ❌ Histórico não distingue qual agente fez o quê
- ✅ Setup mais simples

### Opção D — GitHub App por agente + reviewer aprova + usuária tem veto ✅ ESCOLHIDA
5 Apps independentes, um por agente. `reviewer-agent[bot]` faz a primeira
aprovação técnica. `airamcmrosa` faz a aprovação final de negócio.

- ✅ Identidade clara por agente no histórico do GitHub
- ✅ Sem violação de ToS — mecanismo oficial para automação
- ✅ Dupla camada de aprovação: técnica (bot) + negócio (humana)
- ✅ HIL Gate 3 preservado — merge nunca acontece sem aprovação humana
- ✅ Permissões granulares por App
- ⚠️ Setup manual inicial (~20 min por App na UI do GitHub)
- ⚠️ 5 Private Keys para gerenciar como secrets do repositório

---

## Decisão

Adotar a **Opção D**: 5 GitHub Apps independentes com modelo de aprovação dupla.

---

## GitHub Apps Definidos

| App Name | Agente | Responsabilidade no GitHub |
|---|---|---|
| `mathquiz-frontend` | frontend-agent | Commits em `frontend/`, abre PRs de feature |
| `mathquiz-backend` | backend-agent | Commits em `backend/`, abre PRs de feature |
| `mathquiz-infra` | devops-agent | Commits em `infra/`, abre PRs de infra |
| `mathquiz-qa` | qa-agent | Posta relatórios de teste como comentários no PR |
| `mathquiz-reviewer` | reviewer-agent | Posta review como comentário + **aprova o PR** quando `Status: APPROVED` |

---

## Modelo de Aprovação de PRs

```
Branch feature/task-NNN
        │
        ▼
  PR aberto por agente[bot]
  (frontend / backend / infra)
        │
        ▼
  mathquiz-qa[bot] posta summary de testes no PR
        │
        ▼
  mathquiz-reviewer[bot] posta relatório de review
        │
        ├── Status: BLOCKED ──► HIL Gate 2: usuária decide Corrigir ou Aceitar
        │
        ▼ Status: APPROVED
  mathquiz-reviewer[bot] aprova o PR (1ª aprovação)
        │
        ▼
  airamcmrosa recebe notificação para revisão final
        │
        ├── Rejeita ──► HIL Gate 3: feedback → agente corrige → novo commit
        │
        ▼ Aprova
  airamcmrosa aprova (2ª aprovação) → merge em main
```

### Regra de branch protection configurada

```json
{
  "required_approving_review_count": 2,
  "required_reviewers": [
    "mathquiz-reviewer[bot]",
    "airamcmrosa"
  ],
  "dismiss_stale_reviews": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
```

> **Nota:** O GitHub não permite restringir *quais* contas específicas devem
> aprovar no plano free — apenas o número mínimo de approvals. A convenção
> de 2 approvals (bot + humana) é enforced pelo processo, não pela API.

---

## Permissões Necessárias por App

| Permissão | frontend | backend | infra | qa | reviewer |
|---|---|---|---|---|---|
| Contents (read/write) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Pull Requests (write) | ✅ | ✅ | ✅ | ✅ (comment) | ✅ (approve) |
| Issues (write) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Workflows (write) | ❌ | ❌ | ✅ | ❌ | ❌ |
| Checks (write) | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## Secrets a Provisionar no Repositório

Cada App gera um `App ID` e uma `Private Key` (arquivo `.pem`).
Ambos devem ser armazenados como GitHub Actions Secrets:

```
FRONTEND_APP_ID
FRONTEND_PRIVATE_KEY

BACKEND_APP_ID
BACKEND_PRIVATE_KEY

INFRA_APP_ID
INFRA_PRIVATE_KEY

QA_APP_ID
QA_PRIVATE_KEY

REVIEWER_APP_ID
REVIEWER_PRIVATE_KEY
```

O script de autenticação usa a action `tibdex/github-app-token` para gerar
um token de instalação efêmero antes de cada operação `gh`.

---

## Script de Autenticação (padrão para todos os agentes)

```yaml
# Exemplo de uso em GitHub Actions — frontend-agent
- name: Authenticate as mathquiz-frontend[bot]
  id: auth
  uses: tibdex/github-app-token@v2
  with:
    app_id: ${{ secrets.FRONTEND_APP_ID }}
    private_key: ${{ secrets.FRONTEND_PRIVATE_KEY }}

- name: Open PR
  env:
    GH_TOKEN: ${{ steps.auth.outputs.token }}
  run: |
    gh pr create \
      --title "feat(frontend): add QuizStart component" \
      --body "..." \
      --base main \
      --head feature/task-004
```

---

## Consequências

- **Positivas:** auditabilidade completa, identidade clara, HIL Gate 3 preservado,
  modelo escalável e alinhado com práticas de times de engenharia reais.
- **Negativas:** setup manual dos 5 Apps na UI do GitHub é necessário antes de
  qualquer automação funcionar. Documentado em `docs/bootstrapping.md`.
- **Neutras:** tokens são efêmeros (expiram em 1h) — mais seguro que Personal
  Access Tokens permanentes.

---

## Próximos Passos

1. Criar os 5 GitHub Apps manualmente na UI: Settings → Developer settings → GitHub Apps
2. Instalar cada App no repositório `airamcmrosa/MathQuiz`
3. Adicionar os 10 secrets ao repositório
4. Atualizar `docs/bootstrapping.md` com o passo-a-passo de criação dos Apps
5. Atualizar branch protection para exigir 2 approvals
