# 003 — Git Hooks e por que um script de instalação é necessário

> **Nível:** Dev Junior
> **Tema:** Git, Automação Local, Governança de Repositório
> **Data:** 2026-09-01
> **Origem:** Pergunta da usuária sobre o propósito do `install-hooks.ps1` e como os hooks `pre-commit` e `pre-push` funcionam no MathQuiz

---

## O que são Git Hooks?

Pense no git como um processo com várias etapas: você edita um arquivo, faz
`git add`, depois `git commit`, depois `git push`. Em cada uma dessas etapas,
o git permite que você "pendurar um gancho" — um script que roda automaticamente
antes ou depois da ação acontecer.

```
Você digita: git commit -m "feat: algo"
                    │
                    ▼
         Git verifica: existe .git/hooks/pre-commit ?
                    │
          SIM ──────┴────── NÃO
           │                 │
     Roda o script        Commit direto
           │
    script retorna 0?
           │
    SIM ───┴─── NÃO
     │            │
  Commit      Commit
  acontece    BLOQUEADO
```

Se o script retorna exit code `0` → git continua.
Se retorna qualquer outro número → git para e mostra a mensagem do script.

**Pontos importantes:**
- Hooks ficam em `.git/hooks/` — uma pasta que o git cria localmente
- São scripts shell simples (ou qualquer executável)
- `pre-commit` roda antes do commit ser gravado
- `pre-push` roda antes do push ser enviado ao remoto
- Hooks são **locais** — não existem no repositório remoto

---

## Por que `.git/hooks/` não é versionado?

Aqui está o ponto central que explica o `install-hooks.ps1`.

A pasta `.git/` inteira é ignorada pelo git. Ela é local para cada máquina.
Isso existe por design: hooks podem executar código arbitrário na sua máquina,
então o git nunca os sincroniza automaticamente para proteger quem clona um repo
de rodar scripts maliciosos sem saber.

```
Repositório remoto (GitHub)
└── frontend/
└── backend/
└── .github/
    └── hooks/       ← você versiona AQUI (convenção)
        ├── pre-commit
        └── pre-push

Máquina local após git clone
└── .git/
    └── hooks/       ← git LÊ daqui (não sincroniza com o remoto)
        ├── pre-commit   ← VAZIO por padrão após o clone
        └── pre-push     ← VAZIO por padrão após o clone
```

A convenção estabelecida é guardar os hooks em `.github/hooks/` (versionado)
e ter um script que **copia** esses arquivos para `.git/hooks/` (local).
Esse script é o `install-hooks.ps1`.

```powershell
# O que install-hooks.ps1 faz em essência:
Copy-Item ".github/hooks/pre-commit" ".git/hooks/pre-commit"
Copy-Item ".github/hooks/pre-push"   ".git/hooks/pre-push"
# + garante que os arquivos têm LF (não CRLF) para funcionar no Git Bash
```

---

## Por que não era necessário no Claude?

Boa observação. No Claude Code (o produto da Anthropic), o agente opera via
**MCP (Model Context Protocol)** e usa ferramentas nativas para escrever arquivos
e executar comandos. Ele não passa pelo processo de commit/push do git da mesma
forma — ele chama as ferramentas diretamente, sem passar pelos hooks locais.

No MathQuiz com Kiro, os agentes eventualmente vão rodar `git commit` e
`git push` via shell. Os hooks interceptam exatamente essas chamadas de terminal.
Como os agentes Kiro rodam no seu ambiente local (não em um container isolado),
os hooks funcionam e são necessários.

**Resumindo a diferença:**

| | Claude Code | Kiro CLI |
|---|---|---|
| Como escreve arquivos | Ferramenta `write_file` via MCP | Ferramenta `write` + shell local |
| Como commita | Ferramenta `bash` com git | shell com git na sua máquina |
| Hooks locais interceptam? | Depende do setup do MCP | Sim — roda no seu ambiente |
| Necessidade de install-hooks | Geralmente não | Sim |

---

## Como o fluxo funciona no MathQuiz

O script `commit-push.ps1` usa uma variável de ambiente como "senha secreta"
para dizer ao hook: "sou eu, pode deixar passar".

```
Você (ou agente) roda:
.\scripts\commit-push.ps1 -Message "feat(frontend): ..." -Path arquivo.tsx
                    │
                    ▼
  Script seta: $env:MATHQUIZ_SCRIPT_COMMIT = "1"
                    │
                    ▼
  Script chama: git commit -m "feat(frontend): ..."
                    │
                    ▼
  Git roda .git/hooks/pre-commit
                    │
  Hook verifica: $MATHQUIZ_SCRIPT_COMMIT == "1" ?
                    │
          SIM ──────┴────── NÃO
           │                 │
    exit 0 (passa)     exit 1 (bloqueia)
    commit acontece    mensagem de erro
```

```sh
# .github/hooks/pre-commit — lógica central
if [ "$MATHQUIZ_SCRIPT_COMMIT" = "1" ]; then
    exit 0   # veio do script autorizado, deixa passar
fi

# chegou aqui = git commit direto no terminal
echo "🛑 Commit direto bloqueado. Use .\scripts\commit-push.ps1"
exit 1
```

**Por que variável de ambiente e não um arquivo flag?**
Variável de ambiente existe apenas durante o processo atual e seus filhos.
Quando o script termina, ela some. Não há risco de "esquecer" o flag ligado.
Um arquivo flag poderia ficar esquecido em disco e bypassar os hooks para sempre.

---

## Isso cria ruído na sessão do agente?

Não cria ruído visível para o agente. O hook roda como subprocesso do `git`,
que por sua vez foi chamado pelo shell do agente. O agente vê apenas o resultado
final: commit bem-sucedido ou mensagem de erro.

O único "ruído" possível seria se um agente tentasse rodar `git commit` diretamente
(sem passar pelo `commit-push.ps1`) — aí o hook bloquearia e o agente veria a
mensagem de erro. Mas os agentes do MathQuiz estão configurados para usar o script.

---

## Como o MathQuiz usa isso

```
Quem aciona        Caminho                          Resultado
──────────────     ──────────────────────────────   ──────────────────
Você no terminal   .\scripts\commit-push.ps1        ✅ commit + push
Agente Kiro        shell → commit-push.ps1          ✅ commit + push
git commit direto  .git/hooks/pre-commit bloqueia   🛑 erro explicativo
git push direto    .git/hooks/pre-push bloqueia     🛑 erro explicativo
GitHub Actions     GITHUB_ACTIONS=true → passa      ✅ CI/CD funciona
```

---

## Exercícios — Múltipla Escolha

**1.** Por que a pasta `.git/hooks/` não é sincronizada com o repositório remoto?

- A) Porque o GitHub não suporta hooks
- B) Por design de segurança — hooks executam código arbitrário e não devem ser distribuídos automaticamente
- C) Porque hooks só funcionam em Linux
- D) Porque a pasta `.git/` é criada pelo GitHub e não pode ser modificada

**2.** O que acontece quando um hook `pre-commit` retorna exit code `1`?

- A) O commit é feito com um aviso
- B) O commit é agendado para depois
- C) O commit é bloqueado e a mensagem do script é exibida
- D) O git reinicia automaticamente

**3.** Qual é o propósito do `install-hooks.ps1` no MathQuiz?

- A) Instalar o Node.js e as dependências do projeto
- B) Copiar os hooks de `.github/hooks/` para `.git/hooks/`, tornando-os ativos localmente
- C) Criar o repositório GitHub
- D) Configurar as variáveis de ambiente do projeto

**4.** Por que o `commit-push.ps1` usa uma variável de ambiente (`MATHQUIZ_SCRIPT_COMMIT=1`) em vez de um arquivo flag para bypassar os hooks?

- A) Variáveis de ambiente são mais rápidas de verificar
- B) Arquivos flag não funcionam em PowerShell
- C) A variável existe apenas durante o processo atual — não há risco de ficar "esquecida" habilitando o bypass permanentemente
- D) O git não consegue ler arquivos durante a execução de hooks

**5.** O que o hook `pre-push` do MathQuiz faz quando detecta que está rodando em GitHub Actions (`GITHUB_ACTIONS=true`)?

- A) Bloqueia o push para proteger o ambiente de CI
- B) Pede confirmação ao usuário antes de continuar
- C) Deixa o push passar, pois CI/CD precisa fazer push sem interação humana
- D) Envia uma notificação ao Slack

**6.** Por que os hooks precisam ter line endings LF (não CRLF) no Windows?

- A) LF usa menos espaço em disco
- B) O git no Windows usa Git Bash (MSYS2) para executar hooks — que é um ambiente Unix e requer LF
- C) CRLF é proibido pelo GitHub
- D) PowerShell não aceita arquivos com CRLF

**7.** Se um desenvolvedor clonar o repositório MathQuiz e rodar `git commit` sem rodar `install-hooks.ps1` antes, o que acontece?

- A) O commit é bloqueado automaticamente pelo GitHub
- B) O commit funciona normalmente — hooks em `.git/hooks/` não existem ainda
- C) O git exibe um erro de configuração
- D) O commit vai para uma branch de quarentena

---

## Gabarito

| Questão | Resposta | Justificativa |
|---|---|---|
| 1 | B | A pasta `.git/` é local por design. Distribuir hooks automaticamente permitiria que um repositório malicioso executasse código na máquina de qualquer pessoa que o clonasse. |
| 2 | C | Exit code diferente de 0 é o sinal universal de erro em Unix/Windows. O git interpreta isso como "o hook rejeitou a operação" e aborta o commit. |
| 3 | B | O script faz exatamente a cópia de `.github/hooks/` (versionado, na convenção do projeto) para `.git/hooks/` (local, lido pelo git). |
| 4 | C | Variável de ambiente é process-scoped — existe apenas enquanto o processo pai (o script) está rodando. Um arquivo flag em disco persistiria entre execuções e poderia ser esquecido habilitado. |
| 5 | C | O hook verifica `[ -n "$GITHUB_ACTIONS" ]` e faz exit 0. Sem isso, o CI rodando `git push` seria bloqueado pelo próprio hook de proteção. |
| 6 | B | Git Bash no Windows usa o subsistema MSYS2 para interpretar scripts shell. Arquivos com CRLF causam erros como `'\r': command not found` porque o `\r` é tratado como parte do comando. |
| 7 | B | Sem o `install-hooks.ps1`, a pasta `.git/hooks/` tem apenas os hooks de exemplo (`.sample`) que o git não executa. O commit passa sem restrição — por isso o install é obrigatório após clonar. |

> Próximos passos sugeridos:
> - [Documentação oficial — Git Hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
> - [Husky](https://typicode.github.io/husky/) — alternativa popular para projetos Node.js que gerencia hooks automaticamente via `package.json`
> - `scripts/install-hooks.ps1` — script de instalação deste projeto
> - `scripts/commit-push.ps1` — script de commit autorizado deste projeto
