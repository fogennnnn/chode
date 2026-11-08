$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$dataset = Join-Path $root 'dataset'
$runs = Join-Path $root 'runs'
$engine = 'C:\Users\fogen\chode\chode\chode.js'
$runner = 'C:\Users\fogen\chode\chode\benchmarks\production-public.cjs'

if (-not (Test-Path $dataset)) { throw "Dataset not found: $dataset" }
if (-not (Test-Path $engine)) { throw "Engine not found: $engine" }
if (-not (Test-Path $runner)) { throw "Runner not found: $runner" }

New-Item -ItemType Directory -Force -Path $runs | Out-Null

Write-Host "Dataset:  $dataset"
Write-Host "Engine:   $engine"
Write-Host "Runner:   $runner"
Write-Host "Results:  $runs"
Write-Host "Version:  1.9.53"
Write-Host ""
Write-Host "This runs all 34 pinned Python tasks. Expect many hours (up to 34h worst case)."
Write-Host "Keep this terminal open. Results are written under runs\<timestamp>."
Write-Host ""

node $runner --dataset $dataset --out $runs --engine $engine
