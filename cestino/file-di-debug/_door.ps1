param([string]$out = 'door.png', [string]$url = 'http://127.0.0.1:8123/museo/_probe_door.html')
$ErrorActionPreference = 'Continue'
$repo = 'C:\Users\Emanuele Baccigalupi\Desktop\github\portfolio'
$dir  = 'C:\Users\Public\gk'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
New-Item -ItemType Directory -Force -Path $dir | Out-Null

$png = Join-Path $dir $out
Remove-Item -LiteralPath $png -Force -ErrorAction SilentlyContinue
$argv = @(
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', '--window-size=960,600', '--virtual-time-budget=4000',
  "--screenshot=$png", $url
)
$p = Start-Process -FilePath $chrome -ArgumentList $argv -Wait -PassThru `
      -RedirectStandardError (Join-Path $dir ($out + '.err.txt'))
$exists = Test-Path $png
$size = if ($exists) { (Get-Item $png).Length } else { 0 }
Write-Output "$out exit=$($p.ExitCode) exists=$exists size=$size"
if ($exists) { Copy-Item $png (Join-Path $repo ('_shot_' + $out)) -Force }
$e = Join-Path $dir ($out + '.err.txt')
if (Test-Path $e) {
  $text = Get-Content $e -Raw
  if ($text -and $text.Trim().Length -gt 0) { Write-Output '--- stderr ---'; Write-Output $text }
}
