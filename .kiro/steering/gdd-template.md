# GDD Template — User Story (Standard)

> Template obrigatório para todas as User Stories produzidas pelo agente PM.
> Preencher todos os campos antes de entregar ao orquestrador.
> Campos marcados com `*` são obrigatórios. Campos `[PENDING]` indicam gaps não resolvidos.

---

## Template

```markdown
# US-NNN: [Título da User Story]

**Como** [persona/papel do usuário]
**Quero** [ação ou funcionalidade]
**Para** [benefício ou objetivo]

---

## Descrição

[Descrição detalhada do que deve ser implementado, incluindo contexto de negócio.]

---

## Critérios de Aceite *

- [ ] CA-01: [Critério verificável e testável]
- [ ] CA-02: [Critério verificável e testável]
- [ ] CA-03: [Critério verificável e testável]

---

## Regras de Negócio *

- RN-01: [Regra de negócio específica com valores concretos quando aplicável]
- RN-02: [Regra de negócio específica]

---

## Dependências

- Depende de: [US-NNN] ou [nenhuma]
- Bloqueada por: [US-NNN] ou [nenhuma]

---

## Gaps

| ID | Pergunta | Severity | Status |
|----|----------|----------|--------|
| GAP-001 | [Pergunta de negócio sem resposta] | CRITICAL \| ADVISORY | OPEN \| RESOLVED |

> **CRITICAL**: bloqueia implementação — o flow não avança sem resposta
> **ADVISORY**: não bloqueia — agentes podem assumir um default razoável e documentar

---

## Notas Técnicas (opcional)

[Observações para os agentes de desenvolvimento — não são regras de negócio.]

---

## Histórico de Resoluções HIL

| Timestamp | Gap ID | Pergunta | Resposta do Usuário |
|-----------|--------|----------|---------------------|
| YYYY-MM-DDTHH:MM | GAP-001 | ... | ... |
```

---

## Exemplos de Preenchimento

### Exemplo — US com gap CRITICAL resolvido

```markdown
# US-001: Exibir Tela Inicial do Quiz

**Como** aluno
**Quero** ver a tela inicial do quiz com campos de identificação
**Para** iniciar o quiz informando meu nome e email para receber o resultado

## Critérios de Aceite

- [ ] CA-01: A tela exibe campos obrigatórios: Nome Completo e Email
- [ ] CA-02: O botão "Iniciar Quiz" fica desabilitado enquanto nome ou email estiverem vazios
- [ ] CA-03: O email é validado no formato correto antes de habilitar o botão

## Regras de Negócio

- RN-01: Email deve ser válido (formato RFC 5321)
- RN-02: Nome deve ter entre 2 e 100 caracteres

## Gaps

| ID | Pergunta | Severity | Status |
|----|----------|----------|--------|
| GAP-001 | De onde vem o email do aluno para envio da nota? | CRITICAL | RESOLVED |

## Histórico de Resoluções HIL

| Timestamp | Gap ID | Pergunta | Resposta do Usuário |
|-----------|--------|----------|---------------------|
| 2026-08-31T18:00 | GAP-001 | De onde vem o email do aluno? | Campo preenchido pelo aluno na tela inicial do quiz |
```

---

## Checklist do PM antes de entregar ao Orquestrador

- [ ] Todos os campos `*` estão preenchidos
- [ ] Nenhum gap com `severity: CRITICAL` está com `status: OPEN`
- [ ] Critérios de aceite são verificáveis (podem ser transformados em testes)
- [ ] Regras de negócio têm valores concretos (não vagos como "o suficiente")
- [ ] Dependências entre stories estão mapeadas
- [ ] Artefato gravado em `.kiro/context/task-history/task-NNN.md`
