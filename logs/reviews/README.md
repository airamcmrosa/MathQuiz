# Review Reports

Esta pasta contém os relatórios gerados pelo `reviewer-agent` após cada ciclo de revisão.

Formato dos arquivos: `review-NNN.md` onde NNN é o número da task.

Cada relatório contém:
- **Status**: `APPROVED` ou `BLOCKED`
- **Findings CRITICAL**: bloqueiam o pipeline
- **Findings WARNING**: devem ser corrigidos antes do próximo ciclo
- **Findings INFO**: sugestões de melhoria
