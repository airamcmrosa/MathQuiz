# Active Context

> Arquivo mantido pelo orquestrador. Atualizado a cada transição de stage.
> Lido por todos os agentes para entender o estado atual do sistema.

---

## Task Atual
task-000 (aguardando primeiro prompt do usuário)

## Stage
IDLE

## Agentes Ativos
nenhum

## Última Atualização
2026-08-31T18:00:00

## Backlog de Tasks

| Task | Descrição | Status |
|------|-----------|--------|
| task-001 | Provisionar repositório GitHub e subir governança | PENDING |
| task-002 | Configurar agentes Kiro (JSONs) | PENDING |
| task-003 | PM — User Stories do Quiz | PENDING |
| task-004 | Frontend — Quiz React + Vite | PENDING |
| task-005 | Backend — API + Integração AWS | PENDING |
| task-006 | DevOps — Infra AWS + Deploy Railway | PENDING |
| task-007 | Reviewer — Segurança e Qualidade Técnica | PENDING |
| task-008 | QA — Suite de Testes | PENDING |
| task-009 | Wiring — Integração end-to-end | PENDING |

## Decisões HIL Registradas
(nenhuma ainda)

## Artefatos Gerados
(nenhum ainda)

## Status dos Agentes

| Agente | Status |
|--------|--------|
| pm-agent | IDLE |
| frontend-agent | IDLE |
| backend-agent | IDLE |
| devops-agent | IDLE |
| reviewer-agent | IDLE |
| qa-agent | IDLE |

## Contexto do Projeto

**Path local:** `C:\Users\MariaRosa\MathQuiz`
**Nome:** Quiz Web App Game
**Descrição:** Web app de quiz educacional com 10 perguntas e 1 opção correta por pergunta.
**Pipeline de Resultado:** Aluno submete quiz → JSON salvo no S3 → Lambda trigger → SNS topic → email ao aluno com score.
**Stack Definida:**
- Frontend: React 18 + Vite + TypeScript + Tailwind CSS
- Backend: Node.js 20 + Express + TypeScript
- Infra: AWS CDK (S3 + Lambda + SNS)
- Deploy: Railway (backend), Vercel ou Railway estático (frontend)
- Versionamento: GitHub com branch protection em `main`
- CI/CD: GitHub Actions

## Variáveis de Ambiente Necessárias (a provisionar pelo DevOps)

```
# Backend
S3_BUCKET=<nome-do-bucket>
AWS_REGION=<região>
PORT=3000
FRONTEND_URL=<url-do-frontend>

# GitHub Actions Secrets
RAILWAY_TOKEN=<token>
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
SNS_TOPIC_ARN=<arn>
```
