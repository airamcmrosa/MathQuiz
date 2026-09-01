# Aprendizagem Agêntica #001
## Gap de Governança na Implementação Inicial

**Data:** 2026-08-31T18:33
**Contexto:** Quiz Web App — Sistema Multi-Agente no Kiro
**Severity:** CRÍTICO — violação das anchor-rules e do flow definido
**Status:** Documentado para prevenção futura

---

## O que aconteceu

Após o usuário aprovar o plano e emitir "Implement this plan", o agente padrão do Kiro (orquestrador de fato naquele momento) executou todas as 9 tasks diretamente — criando arquivos de frontend, backend, infra, agentes e governança em uma única sessão, sem:

- Criar o repositório GitHub (Task 1 do plano)
- Commitar os MDs de governança antes de qualquer código
- Spawnar os agentes especializados via `subagent`
- Passar pelos HIL Gates (1, 2 e 3)
- Invocar o PM para produzir User Stories
- Invocar o Reviewer para revisar o código
- Invocar o QA para rodar testes

**Estado resultante:** ~50 arquivos criados apenas no filesystem local (`C:\Users\MariaRosa\`), sem versionamento, sem branch protection, sem CI, sem auditabilidade.

---

## Causa Raiz

### 1. Confusão de papel do agente

O prompt `"Implement this plan"` ativou o modo executor direto do agente padrão (`kiro_default`). O agente interpretou o plano como uma lista de tarefas para si mesmo, em vez de reconhecer que seu papel era o de **orquestrador** — ou seja, coordenar os agentes especializados, não implementar diretamente.

**Regra violada (anchor-rules.md):**
```
| orchestrator | .kiro/context/active-context.md | Qualquer arquivo de código fonte |
```

O agente escreveu em `frontend/`, `backend/`, `infra/` — exatamente o que o orchestrator não pode fazer.

### 2. Gate 0 não existe no flow — mas deveria

O `flow-definition.md` define o pipeline a partir de `SPEC`. Ele não define explicitamente um **Gate 0: repositório GitHub deve existir antes de qualquer ação**. Essa pré-condição estava implícita na Task 1 do plano, mas não era um gate formal com condição de bloqueio.

**Gap identificado no flow-definition.md:**
```
Antes de SPEC, deve existir:
[ ] Repositório GitHub criado e acessível
[ ] Branch main com protection rules ativas
[ ] .kiro/ commitado como base de governança
SOMENTE ENTÃO o pipeline pode ser iniciado
```

### 3. Limitação estrutural do Kiro: subagentes não spawnam sub-subagentes

A documentação do Kiro é explícita:
> *"Subagents cannot spawn additional subagents. The crew tool is only available to the parent agent."*

Isso significa que o pipeline DAG (`pm → frontend + backend + devops → reviewer → qa`) só funciona se a **sessão raiz** for o orquestrador. Se o agente padrão (`kiro_default`) recebe o prompt, ele não consegue spawnar o pipeline corretamente — ele é o agente raiz, não o orquestrador definido em `.kiro/agents/orchestrator.json`.

**Para o flow funcionar, o usuário precisa:**
```bash
# Iniciar explicitamente com o agente orquestrador
/agent orchestrator
# OU
kiro-cli chat --agent orchestrator
```

Sem isso, o agente padrão recebe os prompts e tenta executar tudo sozinho.

### 4. Ausência de Gate de Pré-condição no prompt do orchestrator

O `orchestrator.json` define os HIL Gates 1, 2 e 3 — mas não define uma verificação inicial:
```
SE repositório GitHub não existir:
  1. PARE
  2. Instrua o usuário a criar o repositório
  3. Aguarde confirmação antes de continuar
```

Isso deveria estar como a primeira instrução do prompt do orchestrator.

---

## Impacto

| Aspecto | Estado esperado | Estado real |
|---------|----------------|-------------|
| Repositório GitHub | Criado com branch protection | Não existe |
| Código versionado | Sim, desde o primeiro commit | Não |
| User Stories formalizadas | 6 USs pelo PM com HIL Gate 1 | Não existem |
| Review de segurança | review-NNN.md com APPROVED | Não executado |
| Testes validados | test-run-NNN.md com ✓ 0 failed | Não executados |
| Artefatos em task-history/ | task-NNN.md consolidados | Não existem |
| Decisões HIL registradas | Registradas em active-context.md | Não registradas |
| Anchor-rules respeitadas | Sim | Não (orchestrator escreveu em src/) |

---

## Lições Aprendidas

### L1 — Gate 0 deve ser explícito e verificável

Todo pipeline multi-agente com dependência de infraestrutura externa (repositório, cloud, etc.) precisa de um **Gate 0** verificável antes do Stage SPEC:

```markdown
## Gate 0 — Pré-condições do Sistema

ANTES de qualquer stage, o orquestrador DEVE verificar:
- [ ] `gh repo view` retorna 200 (repositório existe)
- [ ] `gh api repos/{owner}/{repo}/branches/main/protection` retorna 200
- [ ] `.kiro/steering/*.md` existe no repositório remoto

SE qualquer condição falhar:
  PARE e instrua o usuário sobre o que está faltando.
```

### L2 — O agente padrão não é o orquestrador

O `kiro_default` não conhece o flow definido em `flow-definition.md` a não ser que seja explicitamente configurado como recurso. Se o usuário não iniciar com `/agent orchestrator`, o flow será ignorado.

**Mitigação:**
- Adicionar em `flow-definition.md` uma instrução de bootstrapping para o usuário
- Considerar adicionar `flow-definition.md` como resource do agente padrão global via `~/.kiro/steering/`

### L3 — "Implement this plan" é ambíguo para o agente padrão

O prompt `"Implement this plan"` com o plano colado no contexto faz o agente padrão entrar em modo de execução direta. Para um sistema multi-agente, o prompt correto é:

```
"Inicie o orquestrador com este plano.
Você é o orquestrador. Siga o flow-definition.md."
```

Ou, melhor ainda, o usuário inicia com `/agent orchestrator` e o orquestrador já sabe o que fazer.

### L4 — Subagentes são efêmeros — o estado deve ser em disco

Como subagentes terminam ao finalizar a task e não persistem memória, **todo estado relevante deve ser escrito em disco** (nos arquivos `.md` de governança) antes do subagente terminar. O `active-context.md` é o único mecanismo de memória persistente entre agentes.

### L5 — O scaffold criado tem valor, mas precisa ser regularizado

O código criado diretamente pode ser aproveitado como **branch de scaffold**, mas deve passar pelo flow correto antes de ir para `main`:
1. Criar repositório → commitar scaffold em branch separada
2. Orquestrador inicia, PM produz User Stories sobre o scaffold existente
3. Reviewer revisa o scaffold
4. QA valida
5. HIL Gate 3 aprova
6. Merge para main

---

## Correções Aplicadas ao Sistema

### flow-definition.md — Gate 0 adicionado

Ver atualização em `.kiro/steering/flow-definition.md`:
- Seção **Gate 0: Pré-condições** adicionada antes do Stage SPEC
- Verificações: repositório existe, branch protection ativa, steering files commitados

### orchestrator.json — Verificação inicial adicionada

Ver atualização em `.kiro/agents/orchestrator.json`:
- Primeira instrução do prompt verifica pré-condições via `gh` CLI
- Se falhar, instrui o usuário e para

### docs/bootstrapping.md — Guia de inicialização

Ver `docs/bootstrapping.md` para instruções de como iniciar o sistema corretamente.

---

## Referências

- [Kiro Docs — subagent](https://docs.kiro.dev/tools/subagent): *"Subagents cannot spawn additional subagents."*
- [Kiro Docs — agent-configuration](https://docs.kiro.dev/features/agent-configuration): escopo de allowedPaths
- [OWASP — Security by Design](https://owasp.org/www-project-developer-guide/draft/foundations/secure_design/): gates de segurança como pré-condições, não como afterthought
- `.kiro/steering/anchor-rules.md` — Seção 3: Escopo e Restrições por Agente
- `.kiro/steering/flow-definition.md` — Pipeline por Task
