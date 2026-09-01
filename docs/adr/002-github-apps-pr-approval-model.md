# 002. GitHub Apps por agente com modelo de aprovação dupla de PRs

## Status

Accepted

Decided by: airamcmrosa — 2026-09-01 (HIL Gate — decisão de arquitetura, task-001)

---

## Context and Problem Statement

O sistema MathQuiz é desenvolvido por um pipeline multi-agente (frontend-agent,
backend-agent, devops-agent, qa-agent, reviewer-agent). Cada agente produz código
e precisa abrir Pull Requests no repositório `airamcmrosa/MathQuiz`.

Como representar a identidade de cada agente no GitHub e como estruturar o modelo
de aprovação de PRs de forma que o HIL Gate 3 (aprovação humana do incremento)
seja preservado obrigatoriamente antes de qualquer merge em `main`?

---

## Decision Drivers

- Identidade auditável por agente no histórico do GitHub
- Sem violação dos Termos de Uso do GitHub
- Branch protection que impeça merge sem aprovação humana
- Tokens de curta duração para reduzir superfície de ataque
- HIL Gate 3 do flow-definition.md deve ser inviolável

---

## Considered Options

- **A** — Tudo na conta `airamcmrosa` (token único compartilhado)
- **B** — Contas GitHub secundárias por agente
- **C** — Um único GitHub App `mathquiz-agents` compartilhado
- **D** — GitHub App por agente + reviewer aprova + usuária tem veto final

---

## Decision Outcome

Chosen option: **D — GitHub App por agente + modelo de aprovação dupla**, because
é o único que combina identidade auditável por agente, conformidade com os ToS do
GitHub, tokens efêmeros (segurança) e preservação do HIL Gate 3 com duas camadas
de aprovação independentes: técnica (bot) e de negócio (humana).

### Positive Consequences

- Histórico do GitHub identifica claramente qual agente abriu cada PR e commit
- Tokens de instalação expiram em 1h — janela de exposição mínima em caso de vazamento
- `mathquiz-reviewer[bot]` faz a primeira barreira técnica automatizada
- `airamcmrosa` tem aprovação final obrigatória — HIL Gate 3 inviolável
- Modelo escalável: mesmo padrão usado por Dependabot, Renovate e ferramentas de mercado
- Permissões granulares por App — cada bot acessa apenas o que precisa

### Negative Consequences

- Setup manual dos 5 Apps na UI do GitHub (~20 min por App) antes da primeira automação
- 10 secrets para gerenciar no repositório (App ID + Private Key por agente)
- Lógica de autenticação via JWT em todos os workflows que precisam agir como bot

---

## Pros and Cons of the Options

### A — Tudo na conta `airamcmrosa`

- Bad, because autor e aprovador seriam a mesma conta — GitHub bloqueia self-approval
- Bad, because histórico sem distinção de autoria por agente
- Bad, because token único é ponto único de falha
- Good, because zero configuração adicional

### B — Contas secundárias por agente

- Bad, because viola os Termos de Uso do GitHub (uma pessoa = uma conta pessoal)
- Bad, because risco de ban de todas as contas envolvidas
- Bad, because N tokens permanentes para gerenciar
- Good, because identidade separada por agente (mas o risco jurídico supera o benefício)

### C — Um único GitHub App `mathquiz-agents`

- Good, because sem violação de ToS — mecanismo oficial
- Good, because setup mais simples (1 App, 2 secrets)
- Bad, because histórico não distingue qual agente específico fez o quê
- Bad, because permissões não são granulares por papel de agente

### D — GitHub App por agente + aprovação dupla

- Good, because identidade clara por agente no histórico (`mathquiz-frontend[bot]`, etc.)
- Good, because sem violação de ToS
- Good, because tokens efêmeros (1h) — mais seguro que PATs permanentes
- Good, because dupla camada: revisão técnica automatizada + aprovação humana de negócio
- Good, because permissões mínimas por App (princípio do menor privilégio)
- Bad, because setup manual inicial obrigatório
- Bad, because 10 secrets para provisionar e rotacionar

---

## Implementation Notes

### GitHub Apps definidos

| App Name | Agente | Responsabilidade no GitHub |
|---|---|---|
| `mathquiz-frontend` | frontend-agent | Commits em `frontend/`, abre PRs de feature |
| `mathquiz-backend` | backend-agent | Commits em `backend/`, abre PRs de feature |
| `mathquiz-infra` | devops-agent | Commits em `infra/`, abre PRs de infra |
| `mathquiz-qa` | qa-agent | Posta relatórios de teste como comentários no PR |
| `mathquiz-reviewer` | reviewer-agent | Posta review + aprova o PR quando `Status: APPROVED` |

### Permissões por App

| Permissão | frontend | backend | infra | qa | reviewer |
|---|---|---|---|---|---|
| Contents (read/write) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Pull Requests (write) | ✅ | ✅ | ✅ | ✅ (comment) | ✅ (approve) |
| Workflows (write) | ❌ | ❌ | ✅ | ❌ | ❌ |
| Checks (write) | ❌ | ❌ | ❌ | ✅ | ✅ |

### Secrets a provisionar

```
FRONTEND_APP_ID   FRONTEND_PRIVATE_KEY
BACKEND_APP_ID    BACKEND_PRIVATE_KEY
INFRA_APP_ID      INFRA_PRIVATE_KEY
QA_APP_ID         QA_PRIVATE_KEY
REVIEWER_APP_ID   REVIEWER_PRIVATE_KEY
```

### Branch protection configurada

```json
{
  "required_approving_review_count": 2,
  "dismiss_stale_reviews": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
```

> O GitHub no plano free não permite restringir *quais* identidades específicas
> devem aprovar — apenas o número mínimo. A convenção (bot + humana) é enforced
> pelo processo definido no flow-definition.md, não pela API.

### Diagrama do flow de aprovação

```
feature/task-NNN
      │
      │ git push
      ▼
CI roda (testes automáticos)
      │
      ▼ testes OK
{agente}[bot] abre PR
      │
      ▼
mathquiz-qa[bot] posta summary de testes como comentário
      │
      ▼
mathquiz-reviewer[bot] analisa código (OWASP + qualidade)
      │
      ├── BLOCKED ──► HIL Gate 2: airamcmrosa decide Corrigir ou Aceitar risco
      │               └── Corrigir → agente corrige → novo commit → reviewer re-analisa
      │
      ▼ APPROVED
mathquiz-reviewer[bot] aprova PR  ← 1ª approval (técnica)
      │
      ▼
GitHub notifica airamcmrosa
      │
      ├── Rejeita ──► HIL Gate 3: feedback → agente corrige → novo commit
      │               (dismiss stale → reviewer re-aprova → volta aqui)
      │
      ▼ Aprova
airamcmrosa aprova PR  ← 2ª approval (negócio)
      │
      ▼
merge em main → deploy pipeline
```

### Padrão de autenticação nos workflows

```yaml
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
      --base main \
      --head feature/task-004
```

---

## Links

- `docs/bootstrapping.md` — passo a passo para criar os 5 Apps na UI do GitHub
- `.docs/learnings/002-github-apps-identidade-bots-aprovacao-prs.md` — explicação técnica
- `flow-definition.md` — definição dos HIL Gates que esta decisão preserva
