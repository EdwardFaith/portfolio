$ErrorActionPreference = 'Continue'
$repo = 'C:\Users\Emanuele Baccigalupi\Desktop\github\portfolio'
$dir  = 'C:\Users\Public\gk'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
New-Item -ItemType Directory -Force -Path $dir | Out-Null

$base = @(
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', '--window-size=1280,720'
)

$jobs = @(
  @{ name = 'hub.png';       url = 'http://127.0.0.1:8123/godkiller/_shot.html';                    budget = '5000' },
  @{ name = 'mission.png';   url = 'http://127.0.0.1:8123/godkiller/_shot.html?mission=1';          budget = '7000' },
  @{ name = 'win.png';       url = 'http://127.0.0.1:8123/godkiller/_shot.html?probe=win';          budget = '7000' },
  @{ name = 'dead.png';      url = 'http://127.0.0.1:8123/godkiller/_shot.html?probe=dead';         budget = '8000' },
  @{ name = 'contracts.png'; url = 'http://127.0.0.1:8123/godkiller/_shot.html?probe=contracts';    budget = '6000' },
  @{ name = 'shop.png';      url = 'http://127.0.0.1:8123/godkiller/_shot.html?probe=shop';         budget = '6000' },
  @{ name = 'trophies.png';  url = 'http://127.0.0.1:8123/godkiller/_shot.html?probe=trophies';     budget = '6000' },
  @{ name = 'perks.png';     url = 'http://127.0.0.1:8123/godkiller/_shot.html?probe=perks';        budget = '7000' },
  @{ name = 'perf_hub.png';  url = 'http://127.0.0.1:8123/godkiller/_shot.html?probe=perf';         budget = '8000' },
  @{ name = 'perf_mis.png';  url = 'http://127.0.0.1:8123/godkiller/_shot.html?mission=1&probe=perf'; budget = '9000' }
)

foreach ($j in $jobs) {
  $png = Join-Path $dir $j.name
  Remove-Item -LiteralPath $png -Force -ErrorAction SilentlyContinue
  $argv = $base + "--virtual-time-budget=$($j.budget)" + "--screenshot=$png" + $j.url
  $p = Start-Process -FilePath $chrome -ArgumentList $argv -Wait -PassThru `
        -RedirectStandardError (Join-Path $dir ($j.name + '.err.txt'))
  $exists = Test-Path $png
  $size = if ($exists) { (Get-Item $png).Length } else { 0 }
  Write-Output "$($j.name) exit=$($p.ExitCode) exists=$exists size=$size"
  if ($exists) { Copy-Item $png (Join-Path $repo ('_shot_' + $j.name)) -Force }
}

foreach ($j in $jobs) {
  $e = Join-Path $dir ($j.name + '.err.txt')
  if (Test-Path $e) {
    $text = Get-Content $e -Raw
    if ($text -and $text.Trim().Length -gt 0) {
      Write-Output "--- $($j.name) stderr ---"
      Write-Output $text
    }
  }
}

Get-ChildItem (Join-Path $repo '_shot_*.png') | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize | Out-String
