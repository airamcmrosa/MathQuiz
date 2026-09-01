# Architecture Decision Records (ADRs)

> Este diretório contém as decisões de arquitetura do projeto MathQuiz.
> Formato: [MADR](https://adr.github.io/madr/) — Markdown Architectural Decision Records.

---

## Como usar

Para criar um novo ADR:

1. Copie `template.md` com o próximo número sequencial:
   ```
   cp docs/adr/template.md docs/adr/003-nome-da-decisao.md
   ```
2. Preencha todos os campos do template
3. Status inicial: `Proposed`
4. Após decisão aprovada: mude para `Accepted`
5. Se uma ADR substituir outra: mude a antiga para `Superseded by ADR-NNN`

---

## Índice

| ADR | Título | Status |
|---|---|---|
| [001](./001-placeholder.md) | *(reservado — nenhuma ADR formal para task-000)* | — |
| [002](./002-github-apps-pr-approval-model.md) | GitHub Apps por agente com modelo de aprovação dupla de PRs | Accepted |

---

## Referências

- [MADR — especificação oficial](https://adr.github.io/madr/)
- [Documentando decisões de arquitetura — Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
