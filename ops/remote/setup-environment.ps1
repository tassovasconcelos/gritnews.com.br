$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $repoRoot

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  throw 'pnpm não encontrado. Instale pnpm 11 ou disponibilize-o no PATH.'
}

Write-Host 'Instalando dependências do monorepo...'
pnpm install --no-frozen-lockfile

Write-Host 'Validando GRIT News (workspace)...'
pnpm --filter @gritnews/gritnews build

Write-Host 'Validando Meu Espetinho...'
pnpm --filter meu-espetinho build

Write-Host 'Validando portal GRIT (raiz)...'
pnpm exec vite build

Write-Host 'Executando health check dos ambientes publicados...'
& (Join-Path $PSScriptRoot 'check-health.ps1')

Write-Host 'Ambiente GRIT preparado e validado.'
