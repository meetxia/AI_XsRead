param(
  [ValidateSet('both', 'local', 'production')]
  [string]$Mode = 'both',

  [int]$BatchSize = 5,
  [int]$Concurrency = 5,
  [int]$CoverTimeoutMs = 600000,
  [int]$MaxBatches = 999,
  [int]$ProductionBatchDelayMs = 60000,
  [int]$ProductionRetryDelayMs = 900000,
  [int]$MaxBatchRetries = 2,

  [string]$Repo = 'E:\momo-ruanjiansheji\AI-XsRead',
  [string]$LogPath = ''
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($LogPath)) {
  $LogPath = Join-Path $Repo '.qa-test-output\upload-all-remaining-novels.log'
}

$OutputDir = Split-Path -Parent $LogPath
if (-not (Test-Path -LiteralPath $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$ScriptPath = Join-Path $Repo 'backend\scripts\upload-all-remaining-novels.mjs'
$ErrPath = [System.IO.Path]::ChangeExtension($LogPath, '.err.log')

$ArgumentList = @(
  $ScriptPath,
  '--mode', $Mode,
  '--batch-size', [string]$BatchSize,
  '--concurrency', [string]$Concurrency,
  '--cover-timeout-ms', [string]$CoverTimeoutMs,
  '--max-batches', [string]$MaxBatches,
  '--production-batch-delay-ms', [string]$ProductionBatchDelayMs,
  '--production-retry-delay-ms', [string]$ProductionRetryDelayMs,
  '--max-batch-retries', [string]$MaxBatchRetries
)

$Process = Start-Process `
  -FilePath 'node' `
  -ArgumentList $ArgumentList `
  -WorkingDirectory $Repo `
  -RedirectStandardOutput $LogPath `
  -RedirectStandardError $ErrPath `
  -PassThru `
  -WindowStyle Hidden

$PidPath = Join-Path $OutputDir 'upload-all-remaining-novels.pid'
Set-Content -LiteralPath $PidPath -Value ([string]$Process.Id) -Encoding ASCII

[PSCustomObject]@{
  pid = $Process.Id
  mode = $Mode
  log = $LogPath
  err = $ErrPath
  pidFile = $PidPath
  state = (Join-Path $Repo '.qa-test-output\upload-all-remaining-novels.state.json')
} | ConvertTo-Json -Depth 3
