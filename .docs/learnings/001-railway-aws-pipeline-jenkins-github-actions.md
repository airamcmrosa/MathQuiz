# 001 — Railway, AWS Pipelines, Jenkins e GitHub Actions

> **Nível:** Dev Junior  
> **Tema:** Ferramentas de CI/CD e Deploy  
> **Data:** 2026-09-01  
> **Origem:** Explicação técnica gerada durante o desenvolvimento do MathQuiz

---

## O que é CI/CD?

Antes de comparar as ferramentas, é importante entender o conceito:

- **CI (Continuous Integration):** toda vez que alguém envia código, ele é automaticamente compilado e testado. O objetivo é detectar erros cedo.
- **CD (Continuous Delivery/Deployment):** depois que o código passa nos testes, ele é automaticamente empacotado e/ou colocado em produção.

```
Desenvolvedor faz push
        │
        ▼
  Testes rodam automaticamente  ← CI
        │
        ▼
  Código vai para produção      ← CD
```

Se você já usou `git push` e viu o site atualizar sozinho, você experimentou CI/CD.

---

## 1. Railway

Railway é uma plataforma que cuida de **tudo para você**: build, deploy, banco de dados, domínio e SSL. É o mais simples dos quatro.

### Como funciona na prática

1. Você conecta seu repositório GitHub ao Railway
2. Railway detecta automaticamente que é um projeto Node.js (ou outro runtime)
3. Toda vez que você faz `git push`, o Railway:
   - Baixa o código
   - Roda `npm install` e `npm run build`
   - Sobe a nova versão do servidor

### Exemplo de configuração mínima

```toml
# railway.toml — arquivo na raiz do projeto
[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
```

Só isso. Não tem mais nada para configurar.

### Pontos importantes

- Você **não** controla os passos do pipeline — o Railway decide como fazer o build
- Ótimo para protótipos e MVPs
- Tem painel web onde você vê logs em tempo real
- Recursos como banco PostgreSQL são provisionados com um clique

---

## 2. AWS CodePipeline + CodeBuild + CodeDeploy

A AWS não tem uma ferramenta única. Um "pipeline" na AWS é montado com **três peças separadas**:

| Serviço | O que faz |
|---------|-----------|
| **CodePipeline** | Orquestra — define os stages e a ordem |
| **CodeBuild** | Executa os comandos (build, testes) |
| **CodeDeploy** | Faz o deploy para EC2, ECS, Lambda, etc. |

### Fluxo visual

```
GitHub (push)
      │
      ▼
CodePipeline
      │
      ├── Stage: Source  → pega o código do GitHub
      │
      ├── Stage: Build   → CodeBuild roda buildspec.yml
      │       └── npm ci && npm test && npm run build
      │
      ├── Stage: Test    → CodeBuild roda testes de integração
      │
      └── Stage: Deploy  → CodeDeploy sobe para ECS/Lambda/EC2
```

### Exemplo de buildspec.yml

```yaml
# buildspec.yml — fica na raiz do projeto
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 20
    commands:
      - npm ci

  build:
    commands:
      - npm run build
      - npm test

  post_build:
    commands:
      - echo "Build concluído em $(date)"

artifacts:
  files:
    - '**/*'
  base-directory: dist
```

### Pontos importantes

- Integração **nativa** com todos os serviços AWS (IAM, CloudWatch, S3, SNS...)
- Você tem controle total sobre cada etapa
- Suporta **aprovações manuais** entre stages — útil para exigir que alguém aprove antes de ir para produção
- Mais complexo e mais caro para projetos pequenos
- Tudo fica registrado no CloudTrail — ótimo para auditoria

---

## 3. Jenkins

Jenkins é um servidor de CI/CD que **você instala e mantém** na sua própria máquina ou VM. É open source e gratuito, mas tem custo operacional.

### Como funciona na prática

1. Você instala o Jenkins em um servidor
2. Cria um arquivo `Jenkinsfile` no repositório
3. Jenkins monitora o repositório e executa o pipeline quando há mudanças

### Exemplo de Jenkinsfile

```groovy
// Jenkinsfile — fica na raiz do projeto
pipeline {
  agent any  // usa qualquer máquina disponível

  stages {
    stage('Instalar dependências') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Testes') {
      steps {
        sh 'npm test'
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }

    stage('Deploy') {
      // só executa se estiver na branch main
      when {
        branch 'main'
      }
      steps {
        sh './scripts/deploy.sh'
      }
    }
  }

  post {
    failure {
      // envia email se o pipeline falhar
      mail to: 'time@empresa.com',
           subject: "Pipeline falhou: ${currentBuild.fullDisplayName}"
    }
  }
}
```

### Pontos importantes

- Mais de 1800 plugins disponíveis para integrar com qualquer coisa
- Você é responsável por manter o servidor atualizado e seguro
- Muito usado em empresas que não podem usar cloud por política interna
- Suporta máquinas agentes distribuídas para paralelismo

---

## 4. GitHub Actions

CI/CD integrado diretamente ao GitHub. Definido por arquivos YAML dentro do repositório, na pasta `.github/workflows/`.

### Como funciona na prática

1. Você cria um arquivo `.yml` dentro de `.github/workflows/`
2. Configura em que eventos o workflow deve rodar (`push`, `pull_request`, etc.)
3. GitHub executa automaticamente em máquinas virtuais gerenciadas por eles

### Exemplo de workflow completo

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # Job 1: testes
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Baixar o código
        uses: actions/checkout@v4

      - name: Configurar Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Instalar dependências
        run: npm ci

      - name: Rodar testes
        run: npm test

  # Job 2: deploy (só roda se 'test' passou, e só na branch main)
  deploy:
    needs: test                          # depende do job 'test'
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'  # só na branch main

    steps:
      - uses: actions/checkout@v4

      - name: Deploy para Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}  # segredo do repositório
        run: |
          npm install -g @railway/cli
          railway up --detach
```

### Conceitos-chave do GitHub Actions

| Conceito | O que é |
|----------|---------|
| **workflow** | O arquivo `.yml` inteiro |
| **job** | Um grupo de steps que roda em uma máquina |
| **step** | Um comando ou action dentro de um job |
| **action** | Um bloco reutilizável do Marketplace (ex: `actions/checkout`) |
| **runner** | A máquina virtual que executa o job |
| **secret** | Variável segura armazenada no GitHub, não aparece nos logs |

### Pontos importantes

- Sem nada para instalar ou manter
- Integrado diretamente com Pull Requests — você vê o status do CI no próprio PR
- Marketplace enorme de actions prontas
- Jobs paralelos nativos — use `needs` para definir dependências entre eles

---

## Comparativo Rápido

| Critério | Railway | AWS Pipeline | Jenkins | GitHub Actions |
|---|---|---|---|---|
| Configuração | Mínima | Alta | Alta | Baixa |
| Infraestrutura para manter | Não | Não | **Sim** | Não |
| Controle do pipeline | Baixo | Muito alto | Muito alto | Alto |
| Custo projetos pequenos | Barato | Caro | Grátis* | Grátis até limite |
| Integração AWS | Fraca | **Nativa** | Via plugins | Via actions |
| Aprovações manuais | Não | Sim | Sim | Sim |
| Curva de aprendizado | Muito baixa | Alta | Alta | Baixa |

_*Grátis em software, mas tem custo do servidor._

---

## Como o MathQuiz usa essas ferramentas

```
Developer faz push para branch feature
          │
          ▼
    GitHub Actions (ci.yml)
          │
          ├── npm ci
          ├── npm test
          └── npm run build
          │
          ▼ (se passou + merge na main)
    GitHub Actions (deploy.yml)
          │
          └── Railway CLI → deploy automático
```

O backend e frontend são deployados no **Railway**, enquanto os recursos AWS (S3, SNS) são provisionados separadamente via **AWS CDK**.

---

## Exercícios — Múltipla Escolha

**Questão 1.** Qual é a principal diferença entre CI e CD?

- A) CI é para frontend e CD é para backend
- B) CI integra e testa o código automaticamente; CD entrega/deploya o código após os testes
- C) CI é manual e CD é automático
- D) CI e CD são nomes diferentes para a mesma coisa

---

**Questão 2.** Você está começando um projeto solo, quer simplicidade máxima e zero configuração de infraestrutura. Qual ferramenta é a mais indicada?

- A) Jenkins
- B) AWS CodePipeline
- C) Railway
- D) GitHub Actions com self-hosted runner

---

**Questão 3.** No GitHub Actions, o que faz a propriedade `needs` em um job?

- A) Define o ambiente de variáveis do job
- B) Instala dependências automaticamente com npm
- C) Define que o job só começa após outro job específico terminar com sucesso
- D) Indica que o job precisa de aprovação manual

---

**Questão 4.** Qual serviço AWS é responsável por **executar os comandos** de build e teste?

- A) CodePipeline
- B) CodeDeploy
- C) CodeCommit
- D) CodeBuild

---

**Questão 5.** Um arquivo `buildspec.yml` pertence a qual serviço AWS?

- A) CodePipeline
- B) CodeBuild
- C) CodeDeploy
- D) CloudFormation

---

**Questão 6.** Por que o Jenkins tem "custo operacional" mesmo sendo gratuito?

- A) Cobra por número de pipelines criados
- B) Requer licença paga para uso em produção
- C) Você precisa manter, atualizar e garantir a segurança do servidor onde ele roda
- D) Os plugins são pagos

---

**Questão 7.** Como você deve armazenar um token de API no GitHub Actions?

- A) Diretamente no arquivo `.yml` entre aspas
- B) Em um arquivo `.env` commitado no repositório
- C) Como um **secret** nas Settings do repositório, referenciado via `${{ secrets.NOME }}`
- D) Em um comentário no código para não esquecer

---

**Questão 8.** Sua empresa tem política de que nenhum dado pode sair para nuvens externas. Qual ferramenta se encaixa melhor?

- A) Railway
- B) GitHub Actions
- C) AWS CodePipeline
- D) Jenkins (self-hosted na infraestrutura da empresa)

---

## Gabarito

| Questão | Resposta | Justificativa |
|---------|----------|---------------|
| 1 | **B** | CI = integra e testa continuamente. CD = entrega/deploya após os testes passarem. |
| 2 | **C** | Railway é zero-config — conecta o repo e ele cuida do resto. |
| 3 | **C** | `needs: [outro-job]` cria dependência entre jobs, garantindo ordem de execução. |
| 4 | **D** | CodeBuild executa os comandos definidos no `buildspec.yml`. |
| 5 | **B** | `buildspec.yml` é o arquivo de configuração do CodeBuild. |
| 6 | **C** | Jenkins é open source mas você arca com manutenção do servidor (updates, segurança, disponibilidade). |
| 7 | **C** | Secrets são criptografados e nunca aparecem nos logs. Jamais colocar tokens no código. |
| 8 | **D** | Jenkins self-hosted roda inteiramente dentro da infraestrutura da empresa. |

---

> **Próximos passos sugeridos:**
> - Leia o arquivo `.github/workflows/ci.yml` deste projeto para ver um exemplo real
> - Tente adicionar um step que imprime a versão do Node.js no workflow
> - Pesquise sobre "matrix strategy" no GitHub Actions para rodar testes em múltiplas versões do Node
