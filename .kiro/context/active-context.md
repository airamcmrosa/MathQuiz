# Active Context

> Arquivo mantido pelo orquestrador. Atualizado a cada transição de stage.
> Lido por todos os agentes para entender o estado atual do sistema.

---

## Task Atual
task-002 (próxima: configurar agentes Kiro)

## Stage
IDLE

## Agentes Ativos
nenhum

## Última Atualização
2026-09-01T11:22:00

## Backlog de Tasks

| Task | Descrição | Status |
|------|-----------|--------|
| task-001 | Provisionar repositório GitHub e subir governança | DONE ✓ |
| task-002 | Configurar agentes Kiro (JSONs) | PENDING |
| task-003 | PM — User Stories do Quiz | PENDING |
| task-004 | Frontend — Quiz React + Vite | PENDING |
| task-005 | Backend — API + Integração AWS | PENDING |
| task-006 | DevOps — Infra AWS + Deploy Railway | PENDING |
| task-007 | Reviewer — Segurança e Qualidade Técnica | PENDING |
| task-008 | QA — Suite de Testes | PENDING |
| task-009 | Wiring — Integração end-to-end | PENDING |

---

## Gate 0 — Verificado em 2026-09-01T10:46:00

| Condição | Status |
|----------|--------|
| gh repo view retorna sucesso | ✓ https://github.com/airamcmrosa/MathQuiz |
| branch protection em main ativa | ✓ 2 reviews obrigatórios, dismiss stale, no force push |
| .kiro/steering/*.md no remoto | ✓ commitado |
| .kiro/agents/*.json no remoto | ✓ commitado |

---

## Decisões de Arquitetura Registradas

| Timestamp | Decisão | Referência |
|-----------|---------|------------|
| 2026-09-01T10:46:00 | Repo público (plano free não suporta branch protection em privado) | — |
| 2026-09-01T10:50:00 | 5 GitHub Apps por agente + modelo de aprovação dupla (reviewer-bot + airamcmrosa) | `docs/adr/002-github-apps-pr-approval-model.md` |
| 2026-09-01T11:10:00 | scripts/ gitignored; commit/push apenas via commit-push.ps1 / commit-push.sh | `scripts/commit-push.ps1`, `scripts/commit-push.sh` |
| 2026-09-01T11:15:00 | .docs/ gitignored (artefatos de estudo pessoal); docs/ versionado (documentação do projeto) | `.gitignore` |

---

## Decisões HIL Registradas

| Timestamp | Gate | Pergunta | Resposta |
|-----------|------|----------|----------|
| 2026-09-01T10:46:00 | Gate 0 | Repo privado ou público? | Público (limitação plano free) |
| 2026-09-01T10:50:00 | Arq. | PRs por bot separado? | Sim — 5 GitHub Apps, um por agente |
| 2026-09-01T10:53:00 | Arq. | Reviewer aprova PRs? | Sim — Opção 2: reviewer-bot aprova (1ª approval técnica) + airamcmrosa aprova (2ª approval negócio) |
| 2026-09-01T11:10:00 | Arq. | Forçar uso de script para commit/push? | Sim — git hooks bloqueiam direto, script é único caminho |

---

## Estado do Repositório

**URL:** https://github.com/airamcmrosa/MathQuiz
**Visibilidade:** público
**Branch protection (main):** 2 approvals obrigatórios, dismiss stale reviews, no force push, no delete
**Último commit:** `chore: untrack .docs/ from git, add to .gitignore as local study artifacts`
**gh CLI:** autenticado como `airamcmrosa`

---

## Artefatos Gerados nesta Sessão (task-001)

### Versionados em docs/
- `docs/adr/README.md` — índice de ADRs com template MADR
- `docs/adr/template.md` — template MADR vazio para ADRs futuros
- `docs/adr/002-github-apps-pr-approval-model.md` — ADR em formato MADR: 5 GitHub Apps por agente, dupla aprovação
- `docs/bootstrapping.md` — atualizado com passo a passo de criação dos 5 GitHub Apps

### Versionados em .github/
- `.github/hooks/pre-commit` — bloqueia `git commit` direto
- `.github/hooks/pre-push` — bloqueia `git push` direto (exceto em GitHub Actions)

### Versionados em scripts/
- `scripts/install-hooks.ps1` — copia hooks de `.github/hooks/` para `.git/hooks/`

### Locais apenas (gitignored)
- `scripts/commit-push.ps1` — único caminho autorizado para commit/push no Windows
- `scripts/commit-push.sh` — versão bash para macOS/Linux
- `.docs/learnings/001-railway-aws-pipeline-jenkins-github-actions.md`
- `.docs/learnings/002-github-apps-identidade-bots-aprovacao-prs.md`
- `.docs/learnings/003-git-hooks-install-script.md`
- `.docs/learnings/004-powershell-execution-policy-install-hooks.md`
- `.docs/learnings/005-commit-push-script-powershell-bash.md`
- `.docs/learnings/aprendizagem-agentica/001-gap-de-governanca-na-implementacao-inicial.md`

---

## Pendências Antes de Iniciar task-002

> ⚠️ BLOQUEANTE: os 5 GitHub Apps precisam ser criados manualmente antes que
> qualquer agente possa abrir PRs como bot. Seguir `docs/bootstrapping.md`.

| Item | Responsável | Status |
|------|-------------|--------|
| Criar `mathquiz-frontend` GitHub App | airamcmrosa (manual na UI) | PENDING |
| Criar `mathquiz-backend` GitHub App | airamcmrosa (manual na UI) | PENDING |
| Criar `mathquiz-infra` GitHub App | airamcmrosa (manual na UI) | PENDING |
| Criar `mathquiz-qa` GitHub App | airamcmrosa (manual na UI) | PENDING |
| Criar `mathquiz-reviewer` GitHub App | airamcmrosa (manual na UI) | PENDING |
| Adicionar 10 secrets ao repositório | airamcmrosa (manual na UI) | PENDING |
| Rodar `.\scripts\install-hooks.ps1` localmente | airamcmrosa | PENDING |

---

## Status dos Agentes

| Agente | Status |
|--------|--------|
| pm-agent | IDLE |
| frontend-agent | IDLE |
| backend-agent | IDLE |
| devops-agent | IDLE |
| reviewer-agent | IDLE |
| qa-agent | IDLE |

---

## Contexto do Projeto

**Path local:** `C:\Users\MariaRosa\MathQuiz`
**Nome:** Quiz Web App Game
**Descrição:** Web app de quiz educacional com 10 perguntas e 1 opção correta por pergunta.
**Pipeline de Resultado:** Aluno submete quiz → JSON salvo no S3 → Lambda trigger → SNS topic → email ao aluno com score.

**Stack Definida:**
- Frontend: React 18 + Vite + TypeScript + Tailwind CSS
- Backend: Node.js 20 + Express + TypeScript
- Infra: AWS CDK (S3 + Lambda + SNS)
- Deploy: Railway (backend + frontend estático)
- Versionamento: GitHub público com branch protection em `main`
- CI/CD: GitHub Actions
- Bots: 5 GitHub Apps (um por agente) — ver ADR-002

**Modelo de Aprovação de PRs:**
1. Agente abre PR (mathquiz-{frontend|backend|infra}[bot])
2. mathquiz-qa[bot] posta summary de testes como comentário
3. mathquiz-reviewer[bot] analisa e aprova (1ª approval — técnica)
4. airamcmrosa aprova (2ª approval — negócio) → merge

**Convenção de commits:** Conventional Commits
`tipo(escopo): descrição` — tipos: feat, fix, chore, docs, test, refactor, ci, infra

**Estrutura de pastas:**
```
MathQuiz/
├── frontend/          — React + Vite + TypeScript (frontend-agent)
├── backend/           — Node.js + Express + TypeScript (backend-agent)
├── infra/             — AWS CDK TypeScript (devops-agent)
├── docs/              — Documentação técnica versionada (ADRs, bootstrapping)
│   └── adr/           — Architecture Decision Records (formato MADR)
├── logs/              — Relatórios de review e testes (reviewer-agent, qa-agent)
│   └── reviews/
├── scripts/           — Gitignored (exceto install-hooks.ps1)
├── .github/
│   ├── hooks/         — Hooks versionados (pre-commit, pre-push)
│   └── workflows/     — CI/CD GitHub Actions
├── .kiro/
│   ├── steering/      — anchor-rules.md, flow-definition.md, gdd-template.md
│   ├── agents/        — JSONs de configuração dos agentes
│   └── context/       — active-context.md, task-history/
└── .docs/             — Gitignored — artefatos de estudo pessoal (learnings)
    └── learnings/
        └── aprendizagem-agentica/
```

## Variáveis de Ambiente Necessárias (a provisionar pelo DevOps)

```
# Backend
S3_BUCKET=<nome-do-bucket>
AWS_REGION=<região>
PORT=3000
FRONTEND_URL=<url-do-frontend>

# GitHub Actions Secrets — agentes
FRONTEND_APP_ID + FRONTEND_PRIVATE_KEY
BACKEND_APP_ID  + BACKEND_PRIVATE_KEY
INFRA_APP_ID    + INFRA_PRIVATE_KEY
QA_APP_ID       + QA_PRIVATE_KEY
REVIEWER_APP_ID + REVIEWER_PRIVATE_KEY

# GitHub Actions Secrets — deploy
RAILWAY_TOKEN=<token>
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
SNS_TOPIC_ARN=<arn>
```
