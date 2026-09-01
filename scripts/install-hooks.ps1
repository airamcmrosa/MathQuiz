<#
.SYNOPSIS
    Instala os git hooks do MathQuiz localmente em .git/hooks/.

.DESCRIPTION
    Este script copia os hooks de .github/hooks/ para .git/hooks/ e
    configura as permissões de execução necessárias.

    Execute uma vez após clonar o repositório ou sempre que os hooks
    forem atualizados em .github/hooks/.

    Os hooks instalados bloqueiam:
      - `git commit` direto — use scripts/commit-push.ps1
      - `git push` direto   — use scripts/commit-push.ps1

.EXAMPLE
    .\scripts\install-hooks.ps1
#>

$ErrorActionPreference = 'Stop'

$repoRoot = & git rev-parse --show-toplevel 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Não foi possível encontrar o repositório git." -ForegroundColor Red
    exit 1
}

$sourceDir = Join-Path $repoRoot ".github\hooks"
$targetDir = Join-Path $repoRoot ".git\hooks"

if (-not (Test-Path $sourceDir)) {
    Write-Host "❌ Diretório .github/hooks não encontrado em: $sourceDir" -ForegroundColor Red
    exit 1
}

$hooks = @("pre-commit", "pre-push")
$installed = 0

foreach ($hook in $hooks) {
    $src = Join-Path $sourceDir $hook
    $dst = Join-Path $targetDir $hook

    if (-not (Test-Path $src)) {
        Write-Host "⚠️  Hook não encontrado, pulando: $hook" -ForegroundColor Yellow
        continue
    }

    # Backup se já existe um hook customizado
    if (Test-Path $dst) {
        $backup = "$dst.bak"
        Write-Host "  ⚠️  Hook existente em $dst — backup salvo em $backup" -ForegroundColor Yellow
        Copy-Item $dst $backup -Force
    }

    Copy-Item $src $dst -Force

    # No Windows, Git usa o hook como shell script via Git Bash/MSYS2.
    # Garantir que o arquivo não tem BOM e tem LF (não CRLF).
    $content = [System.IO.File]::ReadAllText($dst) -replace "`r`n", "`n"
    [System.IO.File]::WriteAllText($dst, $content, [System.Text.UTF8Encoding]::new($false))

    Write-Host "  ✅ $hook instalado" -ForegroundColor Green
    $installed++
}

if ($installed -eq $hooks.Count) {
    Write-Host "`n✅ Todos os hooks instalados com sucesso em .git/hooks/" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  $installed de $($hooks.Count) hooks instalados." -ForegroundColor Yellow
}

Write-Host "`n📋 A partir de agora:" -ForegroundColor Cyan
Write-Host "   git commit e git push diretos serão bloqueados." -ForegroundColor Gray
Write-Host "   Use: .\scripts\commit-push.ps1 -Message 'tipo(escopo): descrição' -Path arquivo" -ForegroundColor Gray
Write-Host "   Preview: .\scripts\commit-push.ps1 -DiffOnly -Path arquivo" -ForegroundColor Gray
