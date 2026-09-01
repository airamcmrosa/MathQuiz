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
