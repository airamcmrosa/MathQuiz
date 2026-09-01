# Flow Definition — Main Loop do Orquestrador

> Este documento define as etapas obrigatórias do pipeline multi-agente.
> O orquestrador DEVE seguir estas etapas em ordem para cada task.
> Desvios requerem registro explícito em `active-context.md`.

---

## Gate 0 — Pré-condições do Sistema

**O orquestrador DEVE verificar estas condições ANTES de iniciar qualquer stage.**
Se qualquer condição falhar, o pipeline PARA e instrui o usuário.

```
[ ] gh repo view retorna sucesso (repositório GitHub existe)
[ ] gh api .../branches/main/protection retorna sucesso (branch protection ativa)
[ ] .kiro/steering/*.md existe no repositório remoto (governança commitada)
[ ] .kiro/agents/*.json existe no repositório remoto (agentes commitados)
```

**SE qualquer condição falhar:**
1. PARE o pipeline imediatamente
2. Identifique qual condição falhou
3. Instrua o usuário com o comando exato para corrigi-la (ver `docs/bootstrapping.md`)
4. Aguarde confirmação do usuário antes de continuar

> Motivação: sem repositório versionado e branch protection ativa, qualquer código
> produzido pelos agentes não tem auditabilidade, proteção nem histórico de decisões.
> Ver `docs/aprendizagem-agentiva/001-gap-de-governanca-na-implementacao-inicial.md`.

---

## Pipeline por Task

```
GATE_0 → SPEC → PLAN → IMPLEMENT → REVIEW → TEST → HIL_REVIEW → DONE
```

### Etapa 1: SPEC

**Responsável:** Orquestrador
**Ação:** Receber o prompt do usuário, ler `active-context.md`, identificar o número da task atual, e atualizar `active-context.md` com o estado `SPEC`.

**Output esperado:** `active-context.md` atualizado com task atual e stage = SPEC

---

### Etapa 2: PLAN

**Responsável:** `pm-agent`
**Ação:** Ler `gdd-template.md` e `active-context.md`, fazer perguntas de GDD ao orquestrador para identificar gaps, classificar gaps como `CRITICAL` ou `ADVISORY`, e produzir User Stories no template Standard.

**HIL Gate 1 — Gaps CRITICAL:**
```
SE task-NNN.md contiver gaps com severity: CRITICAL e status: OPEN:
  1. Orquestrador para o pipeline
  2. Apresenta ao usuário cada gap CRITICAL com sua pergunta
  3. Aguarda resposta do usuário
  4. Atualiza active-context.md com as respostas registradas em "Decisões HIL"
  5. Usa inject_context para re-injetar contexto no pm-agent com as respostas
  6. pm-agent re-executa produção das User Stories com gaps resolvidos
  7. Verifica novamente — só avança quando nenhum gap CRITICAL estiver OPEN
```

**Output esperado:** Arquivo `task-history/task-NNN.md` com 6 User Stories completas, sem gaps CRITICAL em aberto.

---

### Etapa 3: IMPLEMENT

**Responsável:** `frontend-agent`, `backend-agent`, `devops-agent` (paralelos)
**Ação:** Os 3 agentes são spawados simultaneamente via `subagent`. Cada um recebe o contexto de `active-context.md` e as User Stories relevantes para seu escopo.

**Dependência:** Só começa após HIL Gate 1 ser resolvido (Etapa 2 completa).

**Paralelismo:**
```json
[
  { "name": "frontend", "role": "frontend-agent", "depends_on": ["pm"] },
  { "name": "backend",  "role": "backend-agent",  "depends_on": ["pm"] },
  { "name": "devops",   "role": "devops-agent",   "depends_on": ["pm"] }
]
```

**Output esperado:** Código implementado em `frontend/`, `backend/`, `infra/` com testes unitários correspondentes.

---

### Etapa 4: REVIEW

**Responsável:** `reviewer-agent`
**Ação:** Analisar todo o código produzido na Etapa 3. Executar checklist de segurança (OWASP + AWS) e qualidade técnica. Gerar relatório em `logs/reviews/review-NNN.md` com findings classificados como `CRITICAL | WARNING | INFO`.

**Dependência:** Só começa após os 3 agentes da Etapa 3 finalizarem.

**HIL Gate 2 — Review BLOCKED:**
```
SE review-NNN.md contiver Status: BLOCKED (qualquer finding CRITICAL):
  1. Orquestrador para o pipeline
  2. Exibe ao usuário a lista de findings CRITICAL do review-NNN.md
  3. Pergunta: "Deseja (C) Corrigir ou (A) Aceitar o risco para cada finding?"
  4. SE usuário escolhe C para algum finding:
     a. Orquestrador identifica qual agente é responsável (frontend/backend/devops)
     b. Usa revive_session ou spawn_session para re-executar o agente com instrução de correção
     c. Reviewer re-executa após correção
  5. SE usuário escolhe A para todos os findings:
     a. Registra decisão em active-context.md como "risco aceito conscientemente"
     b. Pipeline avança para Etapa 5
  6. Só avança quando Status: APPROVED ou todos os CRITICAL aceitos pelo usuário
```

**Output esperado:** `logs/reviews/review-NNN.md` com `Status: APPROVED` ou registro de risco aceito em `active-context.md`.

---

### Etapa 5: TEST

**Responsável:** `qa-agent`
**Ação:** Rodar suite completa de testes (frontend + backend + E2E). Redirecionar todo output para `logs/test-run-NNN.md`. Reportar apenas summary ao orquestrador.

**Dependência:** Só começa após Reviewer retornar `Status: APPROVED` (ou risco aceito na Etapa 4).

**Tentativas autônomas:**
```
SE algum teste falhar:
  1. qa-agent tenta diagnosticar e corrigir autonomamente (máx. 2 tentativas)
  2. SE corrigiu → re-roda os testes
  3. SE não conseguiu corrigir após 2 tentativas → reporta ao orquestrador como "falha irresolvível"
  4. Orquestrador aciona HIL Gate 3 antecipado com contexto do erro
```

**Output esperado:** `logs/test-run-NNN.md` com `Summary: ✓ X passed | ✗ 0 failed`, e artefato consolidado em `task-history/task-NNN.md`.

---

### Etapa 6: HIL_REVIEW

**HIL Gate 3 — Aprovação do Incremento:**
```
SE test-run-NNN.md contiver ✗ 0 failed:
  1. Orquestrador apresenta ao usuário:
     - Resumo das User Stories implementadas
     - Link do PR aberto no GitHub
     - Summary dos testes: "✓ X passed"
     - Link do review: logs/reviews/review-NNN.md
  2. Pergunta: "Aprovar este incremento e avançar para a próxima task? (y/n)"
  3. SE y → merge do PR, avança para próxima task (volta ao SPEC)
  4. SE n → usuário descreve o que está errado, orquestrador volta para IMPLEMENT com feedback
```

---

### Etapa 7: DONE

**Condição:** Todas as tasks do backlog foram completadas e aprovadas via HIL Gate 3.

**Ação do Orquestrador:**
1. Gerar `task-history/task-FINAL.md` com resumo de todas as tasks
2. Confirmar que todos os PRs foram mergeados em `main`
3. Confirmar que CI está verde na branch `main`
4. Confirmar que o deploy no Railway está healthy
5. Reportar ao usuário: "Sistema completo. URL de produção: [URL]"

---

## Atualização Obrigatória do active-context.md

O orquestrador DEVE atualizar `active-context.md` ao entrar em cada etapa:

```markdown
# Active Context
## Task Atual: task-NNN
## Stage: SPEC | PLAN | IMPLEMENT | REVIEW | TEST | HIL_REVIEW | DONE
## Agentes Ativos: [lista dos agentes rodando neste momento]
## Última Atualização: YYYY-MM-DDTHH:MM
## Decisões HIL Registradas:
- [timestamp] Gate N: [pergunta] → [resposta do usuário]
## Artefatos Gerados nesta Task:
- .kiro/context/task-history/task-NNN.md
- logs/reviews/review-NNN.md
- logs/test-run-NNN.md
## Status dos Agentes:
- pm-agent: DONE | RUNNING | WAITING
- frontend-agent: DONE | RUNNING | WAITING
- backend-agent: DONE | RUNNING | WAITING
- devops-agent: DONE | RUNNING | WAITING
- reviewer-agent: DONE | RUNNING | WAITING
- qa-agent: DONE | RUNNING | WAITING
```

---

## Diagrama do Pipeline

```
User prompt
    │
    ▼
[SPEC] Orquestrador lê context, define task-NNN
    │
    ▼
[PLAN] pm-agent produz User Stories
    │
    ├── gaps CRITICAL? ──► HIL Gate 1 ──► User responde ──► pm-agent re-executa
    │   (loop até limpo)
    ▼
[IMPLEMENT] frontend + backend + devops (paralelo)
    │
    ▼
[REVIEW] reviewer-agent analisa código
    │
    ├── BLOCKED? ──► HIL Gate 2 ──► User: Corrigir ou Aceitar?
    │   (loop se Corrigir)          └── Corrigir ──► agente responsável ──► reviewer re-executa
    ▼
[TEST] qa-agent roda suite completa
    │
    ├── falha irresolvível? ──► HIL Gate 3 antecipado ──► User decide
    ▼
[HIL_REVIEW] Orquestrador apresenta incremento ──► HIL Gate 3 ──► User aprova
    │
    ├── n ──► volta para IMPLEMENT com feedback
    ▼
[DONE task-NNN] merge PR, avança para próxima task
    │
    ▼ (todas as tasks done)
[DONE FINAL] sistema deployado, email funcionando
```
