$ErrorActionPreference = 'Stop'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 18+ with npm first, then retry.' }
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Install Git first, then retry.' }
$chodeInstaller = Join-Path ([IO.Path]::GetTempPath()) ('chode-installer-' + [Guid]::NewGuid().ToString('N') + '.cjs')
try {
  Invoke-WebRequest -Uri 'https://chode.borken.app/install.cjs' -Headers @{'Cache-Control'='no-cache'} -OutFile $chodeInstaller -UseBasicParsing
  & node $chodeInstaller
  if ($LASTEXITCODE -ne 0) { throw 'Chode installer failed. See the error above.' }
} finally {
  if (Test-Path -LiteralPath $chodeInstaller) { Remove-Item -LiteralPath $chodeInstaller -Force }
}
