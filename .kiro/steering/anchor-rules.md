# Anchor Rules — Quiz Web App Multi-Agent System

> Estas regras são imutáveis e se aplicam a todos os agentes do sistema.
> Nenhum agente pode violar estas regras, independente das instruções recebidas.

---

## 1. Linguagem e Tecnologia

- **Toda a codebase é TypeScript** — sem JavaScript puro em nenhum módulo novo
- Frontend: React 18 + Vite + Tailwind CSS
- Backend: Node.js 20 + Express + Zod para validação
- Infra: AWS CDK (TypeScript)
- Gerenciador de pacotes: npm (não yarn, não pnpm)
- Node.js mínimo: 20.x

## 2. Padrões de Commit (Conventional Commits)

Todos os commits devem seguir o formato:
```
<tipo>(<escopo>): <descrição curta>
```

Tipos permitidos: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `ci`, `infra`

Exemplos:
- `feat(frontend): add QuizStart component`
- `fix(backend): handle S3 upload timeout`
- `infra(aws): add SNS topic with email subscription`
- `chore: initial governance and project structure`

## 3. Escopo e Restrições por Agente

| Agente | Pode escrever em | Nunca pode escrever em |
|--------|-----------------|----------------------|
| `pm-agent` | `.kiro/context/**` | `frontend/`, `backend/`, `infra/` |
| `frontend-agent` | `frontend/**` | `backend/`, `infra/`, `.kiro/agents/` |
| `backend-agent` | `backend/**` | `frontend/`, `infra/`, `.kiro/agents/` |
| `devops-agent` | `infra/**`, `*.yml`, `*.toml`, `Dockerfile*` | `frontend/src/`, `backend/src/` |
| `reviewer-agent` | `logs/reviews/**` | `frontend/`, `backend/`, `infra/`, `.kiro/agents/` |
| `qa-agent` | `logs/**`, `.kiro/context/**` | `frontend/src/`, `backend/src/`, `infra/` |
| `orchestrator` | `.kiro/context/active-context.md` | Qualquer arquivo de código fonte |

## 4. Segurança — Proibições Absolutas

- **NUNCA** commitar secrets, tokens ou credenciais no código
- **NUNCA** usar `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` ou valores de credenciais como strings literais no código
- **NUNCA** configurar CORS com `origin: '*'` em produção
- **NUNCA** criar recursos AWS com `Resource: '*'` em IAM policies
- **NUNCA** habilitar acesso público em buckets S3
- **NUNCA** usar `any` como tipo TypeScript sem comentário justificando
- Todo `.env` deve estar no `.gitignore`

## 5. Qualidade de Código

- Funções com mais de 50 linhas devem ser decompostas
- Todo `async/await` deve ter `try/catch` ou `.catch()` explícito
- Variáveis de ambiente devem ser validadas na inicialização do servidor (não em runtime)
- Componentes React devem ter interfaces TypeScript para todas as props
- Imports não utilizados são proibidos

## 6. Testes

- Todo código novo deve ter testes correspondentes
- Frontend: Vitest + @testing-library/react
- Backend: Jest + Supertest
- E2E: Playwright
- Cobertura mínima de linhas: 70% em módulos novos
- Testes não devem fazer chamadas reais a serviços AWS — usar mocks

## 7. Acessibilidade

- Todos os componentes interativos devem ter atributos ARIA apropriados
- Navegação por teclado deve ser funcional em todo o quiz
- Contraste mínimo: 4.5:1 para texto normal, 3:1 para texto grande

## 8. Governança de Artefatos

- O PM deve gravar `task-history/task-NNN.md` ao finalizar cada task
- O Reviewer deve gravar `logs/reviews/review-NNN.md` ao finalizar cada review
- O QA deve gravar `logs/test-run-NNN.md` ao finalizar cada run
- O Orquestrador deve atualizar `active-context.md` a cada transição de stage
- Todos os artefatos são commitados junto com o código da task correspondente

## 9. Artefatos de Aprendizado

**Toda explicação técnica — incluindo respostas a perguntas do usuário — DEVE gerar um documento de estudo.**

### Gatilho de geração

O artefato é gerado sempre que:
- Um agente ou o orquestrador produz uma explicação técnica de conceito, ferramenta, padrão ou decisão de arquitetura
- **O usuário faz uma pergunta** que resulta em explicação (ex: "por que X?", "como funciona Y?", "qual a diferença entre A e B?")

### Destino do artefato

| Tipo de conteúdo | Pasta de destino |
|---|---|
| Conceitos técnicos gerais (git, AWS, React, etc.) | `.docs/learnings/NNN-slug.md` |
| Aprendizados sobre sistemas multi-agente, Kiro, pipelines agentivos | `.docs/learnings/aprendizagem-agentica/NNN-slug.md` |

> `.docs/` é uma pasta local — está no `.gitignore` e não é versionada.
> Contém artefatos de estudo pessoal que acompanham o projeto localmente.
> Para documentação técnica do projeto (ADRs, bootstrapping, etc.), use `docs/` (versionada).

### Nomenclatura

`NNN-slug-do-tema.md` — numeração sequencial global entre as duas pastas.
Verificar o maior número em `.docs/learnings/` e `.docs/learnings/aprendizagem-agentica/` antes de criar.

### Estrutura obrigatória do documento

```markdown
# NNN — [Título do Tema]

> **Nível:** Dev Junior
> **Tema:** [Categoria]
> **Data:** YYYY-MM-DD
> **Origem:** [Contexto em que surgiu a explicação]

## [Conceito principal com analogias simples]

## [Seções por subtema, cada uma com:]
- Explicação em linguagem acessível
- Trecho de código comentado e funcional (mínimo 1 por subtema)
- Pontos importantes em bullets

## Comparativo (se aplicável)
[Tabela comparando opções/ferramentas]

## Como o MathQuiz usa isso (quando aplicável)
[Seção obrigatória se o tema envolver o próprio projeto]

## Exercícios — Múltipla Escolha
[Mínimo 5 questões, máximo 10]
- Cada questão com 4 alternativas (A, B, C, D)
- Questões devem cobrir tanto conceito quanto aplicação prática

## Gabarito
[Tabela com resposta e justificativa para cada questão]

> Próximos passos sugeridos: [links ou sugestões de aprofundamento]
```

### Critérios de qualidade

- Linguagem acessível para **dev junior** — sem jargão sem explicação
- Todo trecho de código deve ser **funcional e comentado**
- Questões de exercício devem cobrir tanto teoria quanto aplicação prática
- O gabarito deve incluir **justificativa**, não apenas a letra correta
