$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# Cari baris "  };" yang diikuti langsung "<div className=""app-container"">"
# tanpa "return (" di antaranya
$fixIdx = -1
for ($i = 340; $i -lt 370; $i++) {
  if ($lines[$i] -match '^\s*\};\s*$' -and $lines[$i+1] -match 'app-container') {
    $fixIdx = $i + 1
    Write-Host "Found missing return at index $fixIdx (line $($fixIdx+1))"
    break
  }
}

if ($fixIdx -ge 0) {
  $before = $lines[0..($fixIdx - 1)]
  $insert = "  return ("
  $after  = $lines[$fixIdx..($lines.Count - 1)]
  $newLines = $before + $insert + $after
  [System.IO.File]::WriteAllLines($f, $newLines, [System.Text.UTF8Encoding]::new($false))
  Write-Host "Fixed! Total lines: $($newLines.Count)"
  
  # Verify
  $v = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)
  $v[352..360] | ForEach-Object -Begin {$i=353} -Process { Write-Host "$i`: $_"; $i++ }
} else {
  Write-Host "Pattern not found - checking manually:"
  $lines[350..360] | ForEach-Object -Begin {$i=351} -Process { Write-Host "$i`: $_"; $i++ }
}
