$run = "C:\Users\fogen\chode\publishable-benchmark\runs\2026-11-03T14-20-41-341Z"
$dataset = "C:\Users\fogen\chode\publishable-benchmark\dataset"
$engine = "C:\Users\fogen\chode\chode\chode.js"
$runner = "C:\Users\fogen\chode\chode\benchmarks\production-public.cjs"

while ($true) {
  $j = $null
  if (Test-Path (Join-Path $run results.json)) {
    $j = Get-Content (Join-Path $run results.json) | ConvertFrom-Json
    if ($j.completed -ge $j.total) { Write-Host "COMPLETE $($j.solved)/$($j.total)"; break }
  }
  Write-Host "completed $($j.completed)/$($j.total). running next..."
  node $runner --dataset $dataset --engine $engine --resume $run
  Start-Sleep -Seconds 5
}
