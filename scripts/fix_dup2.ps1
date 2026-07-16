$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# Cari dan hapus duplikat sidebar-logo
for ($i = 445; $i -lt 460; $i++) {
  if ($lines[$i] -match 'sidebar-logo' -and $lines[$i+1] -match 'sidebar-logo') {
    Write-Host "Found dup at lines $($i+1) and $($i+2)"
    # Remove the duplicate - keep only the second one
    $lines[$i] = ''
    Write-Host "Removed line $($i+1)"
    break
  }
}

[System.IO.File]::WriteAllLines($f, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host "Done. Verifying..."
$check = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)
$check[447..462] | ForEach-Object -Begin {$i=448} -Process { Write-Host "$i`: $_"; $i++ }
