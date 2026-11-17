param([string[]]$Files)
$Files = $Files | ForEach-Object { $_ -split ',' } | Where-Object { $_ }
foreach ($f in $Files) {
  $txt = Get-Content -LiteralPath $f -Raw
  $st = 'code'
  $depth = 0; $line = 1; $bad = $null
  $stack = New-Object System.Collections.Stack
  for ($i = 0; $i -lt $txt.Length; $i++) {
    $ch = $txt[$i]
    $nx = if ($i + 1 -lt $txt.Length) { $txt[$i + 1] } else { '' }
    if ($ch -eq "`n") { $line++; continue }
    switch ($st) {
      'code' {
        if ($ch -eq '/' -and $nx -eq '/') { $st = 'line'; $i++; continue }
        if ($ch -eq '/' -and $nx -eq '*') { $st = 'block'; $i++; continue }
        if ($ch -eq "'") { $st = 'sq'; continue }
        if ($ch -eq '"') { $st = 'dq'; continue }
        if ($ch -eq '`') { $st = 'tpl'; continue }
        if ($ch -eq '(' -or $ch -eq '{' -or $ch -eq '[') { $stack.Push(@($ch, $line)); continue }
        if ($ch -eq ')' -or $ch -eq '}' -or $ch -eq ']') {
          if ($stack.Count -eq 0) { $bad = "chiusura $ch senza apertura alla riga $line"; break }
          $top = $stack.Pop()
          $ok = ($top[0] -eq '(' -and $ch -eq ')') -or ($top[0] -eq '{' -and $ch -eq '}') -or ($top[0] -eq '[' -and $ch -eq ']')
          if (-not $ok) { $bad = "atteso $($top[0]) aperto alla riga $($top[1]), trovato $ch alla riga $line"; break }
        }
        continue
      }
      'line' { if ($ch -eq "`n") { $st = 'code' }; continue }
      'block' { if ($ch -eq '*' -and $nx -eq '/') { $st = 'code'; $i++ }; continue }
      'sq' { if ($ch -eq '\') { $i++; continue }; if ($ch -eq "'") { $st = 'code' }; continue }
      'dq' { if ($ch -eq '\') { $i++; continue }; if ($ch -eq '"') { $st = 'code' }; continue }
      'tpl' { if ($ch -eq '\') { $i++; continue }; if ($ch -eq '`') { $st = 'code' }; continue }
    }
    if ($bad) { break }
  }
  if (-not $bad -and $stack.Count -gt 0) {
    $top = $stack.Peek()
    $bad = "aperto $($top[0]) alla riga $($top[1]) e mai chiuso"
  }
  if (-not $bad -and $st -ne 'code') { $bad = "stato finale $st (stringa o commento non chiuso)" }
  if ($bad) { Write-Output ("NO  " + $f + " :: " + $bad) } else { Write-Output ("OK  " + $f) }
}
