$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# Fix baris 451-458 (0-based) - sidebar logo bersih tanpa emoji encoding
$lines[451] = '          {!sidebarCollapsed ? ('
$lines[452] = '            <>'
$lines[453] = '              <span style={{ color: "var(--primary-600)", fontSize: 18, fontWeight: 800, letterSpacing: -1 }}>GM</span>'
$lines[454] = '              <span>GARUDA MATCH</span>'
$lines[455] = '            </>'
$lines[456] = '          ) : ('
$lines[457] = '            <span style={{ color: "var(--primary-600)", fontSize: 14, fontWeight: 800 }}>GM</span>'
$lines[458] = '          )}'

# Fix mobile drawer juga - baris yang punya flag emoji
for ($i = 370; $i -lt 390; $i++) {
  $raw = [System.Text.Encoding]::Latin1.GetString([System.Text.Encoding]::UTF8.GetBytes($lines[$i]))
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($lines[$i])
  # Cek apakah ada byte sequence F0 9F 87 AE F0 9F 87 A9 (flag Indonesia emoji)
  $hasBadFlag = $false
  for ($b = 0; $b -lt $bytes.Length - 3; $b++) {
    if ($bytes[$b] -eq 0xF0 -and $bytes[$b+1] -eq 0x9F -and $bytes[$b+2] -ge 0x87) { $hasBadFlag = $true; break }
  }
  if ($hasBadFlag -or $lines[$i] -match "color.*primary-600.*Garuda|GARUDA.*span") {
    Write-Host "Check line $($i+1): $($lines[$i])"
  }
}

[System.IO.File]::WriteAllLines($f, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host "Done. Lines: $($lines.Count)"
