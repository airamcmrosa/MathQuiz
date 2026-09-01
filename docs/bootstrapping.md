# Bootstrapping — Como Iniciar o Sistema Multi-Agente

> Leia este guia antes de qualquer outra ação.
> Ignorar esta sequência causa o gap documentado em
> `docs/aprendizagem-agentiva/001-gap-de-governanca-na-implementacao-inicial.md`

---

## Gate 0 — Pré-condições obrigatórias

Antes de iniciar o orquestrador, confirme:

```bash
# 1. GitHub CLI autenticado
gh auth status

# 2. Criar repositório (primeira vez)
gh repo create quiz-web-app --private --clone
cd quiz-web-app

# 3. Commitar os arquivos de governança PRIMEIRO
git add .kiro/steering/ .kiro/context/ .kiro/agents/ .github/
git commit -m "chore: initial governance and project structure"
git push -u origin main

# 4. Ativar branch protection em main
gh api repos/{owner}/quiz-web-app/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test-frontend","test-backend"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null
```

---

## Iniciar o Orquestrador

```bash
# CORRETO — inicia com o agente orquestrador
kiro-cli chat --agent orchestrator

# ou dentro do chat
/agent orchestrator
```

**NUNCA** use o agente padrão (`kiro_default`) para iniciar o pipeline.
O agente padrão não conhece o flow e tentará executar tudo sozinho.

---

## Sequência correta após bootstrap

```
1. /agent orchestrator
2. "Inicie o pipeline para o Quiz Web App"
3. Orquestrador lê flow-definition.md e active-context.md
4. Orquestrador verifica Gate 0 (repositório, branch protection)
5. Pipeline inicia: SPEC → PLAN → pm-agent (HIL Gate 1) → ...
```

---

## Se o scaffold já foi criado sem o flow

Siga a Opção B documentada em `001-gap-de-governanca-na-implementacao-inicial.md`:

```bash
# 1. Criar repositório
gh repo create quiz-web-app --private

# 2. Commitar scaffold em branch separada
git checkout -b scaffold/initial
git add .
git commit -m "chore: scaffold criado fora do flow — pendente revisão"
git push -u origin scaffold/initial

# 3. Iniciar orquestrador no modo "regularização"
/agent orchestrator
"Regularize o scaffold da branch scaffold/initial seguindo o flow completo."
```


---

## GitHub Apps — Criação Manual (obrigatório antes de qualquer PR de agente)

> Referência completa: `docs/adr/002-github-apps-pr-approval-model.md`

Os 5 Apps abaixo devem ser criados **na ordem listada** antes de iniciar
o pipeline de implementação (task-004 em diante).

### Passo a passo por App

Para **cada** App, repita os passos abaixo. Os valores específicos
(nome, permissões) estão na tabela logo após.

```
1. Acesse: https://github.com/settings/apps/new
2. GitHub App name: [ver tabela abaixo]
3. Homepage URL: https://github.com/airamcmrosa/MathQuiz
4. Webhook: desmarcar "Active"
5. Permissions: [ver tabela abaixo]
6. Where can this GitHub App be installed? → "Only on this account"
7. Clique em "Create GitHub App"
8. Na página seguinte, clique em "Generate a private key" → baixa arquivo .pem
9. Anote o "App ID" exibido no topo da página
10. Clique em "Install App" → selecione o repositório MathQuiz
```

### Apps a criar

| App Name | App ID Secret | Private Key Secret | Permissions |
|---|---|---|---|
| `mathquiz-frontend` | `FRONTEND_APP_ID` | `FRONTEND_PRIVATE_KEY` | Contents: RW, Pull Requests: W |
| `mathquiz-backend` | `BACKEND_APP_ID` | `BACKEND_PRIVATE_KEY` | Contents: RW, Pull Requests: W |
| `mathquiz-infra` | `INFRA_APP_ID` | `INFRA_PRIVATE_KEY` | Contents: RW, Pull Requests: W, Workflows: W |
| `mathquiz-qa` | `QA_APP_ID` | `QA_PRIVATE_KEY` | Pull Requests: W, Checks: W |
| `mathquiz-reviewer` | `REVIEWER_APP_ID` | `REVIEWER_PRIVATE_KEY` | Pull Requests: W, Checks: W |

### Adicionar secrets ao repositório

Após criar os 5 Apps, adicione os 10 secrets em:
`https://github.com/airamcmrosa/MathQuiz/settings/secrets/actions`

```bash
# Para cada App, adicione dois secrets:
# 1. O App ID (número inteiro da página do App)
# 2. O conteúdo completo do arquivo .pem (incluindo as linhas -----BEGIN/END-----)
```

### Atualizar branch protection para 2 approvals

Após criar e instalar os Apps, atualize a branch protection:

```bash
# Crie um arquivo bp-2approvals.json com:
# { "required_approving_review_count": 2, ... }
# e rode:
gh api repos/airamcmrosa/MathQuiz/branches/main/protection \
  --method PUT \
  --input bp-2approvals.json
```

### Verificar se está tudo certo

```bash
# Confirmar branch protection
gh api repos/airamcmrosa/MathQuiz/branches/main/protection \
  --jq '.required_pull_request_reviews.required_approving_review_count'
# deve retornar: 2

# Confirmar Apps instalados
gh api /app/installations --jq '.[].app_slug'
# deve listar os 5 Apps
```
