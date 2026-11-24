# Piccolo server web locale per le stanze 3D (nessuna installazione richiesta).
# Serve la cartella in rete locale, cosi' il telefono sulla stessa Wi-Fi puo' aprire la pagina.
#   -Https   per il telefono: il sensore di movimento e la fotocamera funzionano solo da https.
#            Il server si crea da solo un certificato per questo computer; il telefono mostrera'
#            l'avviso "connessione non privata": tocca Avanzate > Procedi.
param([int]$Port = 8090, [switch]$NoOpen, [string]$Root = '', [string]$Page = 'stanza.html', [switch]$Https)

$root = if ($Root) { (Resolve-Path $Root).Path } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254*' -and $_.InterfaceAlias -notmatch 'vEthernet|Loopback|VMware|VirtualBox' } |
  Select-Object -First 1).IPAddress
if (-not $ip) { $ip = 'localhost' }
$scheme = if ($Https) { 'https' } else { 'http' }

$types = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'application/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.jfif' = 'image/jpeg'; '.gif' = 'image/gif'; '.webp' = 'image/webp'
  '.svg' = 'image/svg+xml'; '.json' = 'application/json'; '.webmanifest' = 'application/manifest+json'; '.ico' = 'image/x-icon'; '.txt' = 'text/plain; charset=utf-8'
  '.mp3' = 'audio/mpeg'; '.mpeg' = 'audio/mpeg'; '.wav' = 'audio/wav'; '.ogg' = 'audio/ogg'; '.mp4' = 'video/mp4'; '.webm' = 'video/webm'
}

# il certificato per https: uno solo, creato la prima volta e poi riusato
$cert = $null
if ($Https) {
  $cert = Get-ChildItem Cert:\CurrentUser\My -ErrorAction SilentlyContinue | Where-Object { $_.Subject -eq 'CN=stanza-locale' -and $_.NotAfter -gt (Get-Date) } | Select-Object -First 1
  if (-not $cert) {
    $cert = New-SelfSignedCertificate -Subject 'CN=stanza-locale' -DnsName 'localhost', $ip -CertStoreLocation 'Cert:\CurrentUser\My' -NotAfter (Get-Date).AddYears(3) -KeyExportPolicy Exportable -KeyAlgorithm RSA -KeyLength 2048
  }
}

# se la stanza è già accesa (lanciatore aperto due volte) basta aprire il browser
if (-not $Https) {
  try {
    $probe = Invoke-WebRequest -UseBasicParsing "http://localhost:$Port/$Page" -TimeoutSec 2
    if ($probe.StatusCode -eq 200) { Write-Host "  era gia' accesa: la apro nel browser."; if (-not $NoOpen) { Start-Process "http://localhost:$Port/$Page" }; exit }
  } catch { }
}
# altrimenti si accende; se la porta è occupata da altro, si prova la successiva
$listener = $null
for ($p = $Port; $p -lt $Port + 10; $p++) {
  try { $l = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $p); $l.Start(); $listener = $l; $Port = $p; break } catch { }
}
if (-not $listener) { Write-Host "  non trovo una porta libera: chiudi le altre finestre del server e riprova."; exit 1 }
$url = "${scheme}://localhost:$Port/$Page"
Write-Host ""
Write-Host "  accesa."
Write-Host "  da questo computer:   $url"
Write-Host "  dal telefono (stessa Wi-Fi):   ${scheme}://${ip}:$Port/$Page"
if ($Https) { Write-Host "  il telefono dira' 'connessione non privata': tocca Avanzate, poi Procedi." }
else { Write-Host "  (per muoverti girando il telefono usa AVVIA-PER-TELEFONO.bat: serve https)" }
Write-Host "  Chiudi questa finestra per spegnere il server."
Write-Host ""
if (-not $NoOpen) { Start-Process $url }

while ($true) {
  try { $client = $listener.AcceptTcpClient() } catch { break }
  try {
    $client.ReceiveTimeout = 8000; $client.SendTimeout = 15000
    $stream = $client.GetStream()
    if ($Https) {
      $ssl = [System.Net.Security.SslStream]::new($stream, $false)
      $ssl.AuthenticateAsServer($cert, $false, [System.Security.Authentication.SslProtocols]::Tls12, $false)
      $stream = $ssl
    }
    $reader = [System.IO.StreamReader]::new($stream)
    $line = $reader.ReadLine()
    while (($h = $reader.ReadLine()) -ne $null -and $h -ne '') { }
    $path = '/'
    if ($line -match '^[A-Z]+ ([^ ]+)') { $path = $Matches[1] }
    $path = [System.Uri]::UnescapeDataString(($path -split '\?')[0])
    if ($path -eq '/' -or $path -eq '') { $path = '/index.html' }
    $file = [System.IO.Path]::GetFullPath((Join-Path $root $path.TrimStart('/')))
    if ($file.StartsWith($root) -and (Test-Path $file -PathType Leaf)) {
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $ct = $types[[System.IO.Path]::GetExtension($file).ToLower()]
      if (-not $ct) { $ct = 'application/octet-stream' }
      $head = "HTTP/1.1 200 OK`r`nContent-Type: $ct`r`nContent-Length: $($bytes.Length)`r`nCache-Control: no-cache`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
    } else {
      $bytes = [System.Text.Encoding]::UTF8.GetBytes('404')
      $head = "HTTP/1.1 404 Not Found`r`nContent-Length: 3`r`nConnection: close`r`n`r`n"
    }
    $hb = [System.Text.Encoding]::ASCII.GetBytes($head)
    $stream.Write($hb, 0, $hb.Length)
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Flush()
  } catch { } finally { $client.Close() }
}
