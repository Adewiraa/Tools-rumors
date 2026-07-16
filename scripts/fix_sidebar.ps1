$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# 1. Fix sidebarCollapsed initial state -> true (collapsed by default)
for ($i = 74; $i -lt 80; $i++) {
  if ($lines[$i] -match "useState\(false\).*sidebar|sidebarCollapsed.*useState") {
    $lines[$i] = "  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // default collapsed"
    Write-Host "Fixed sidebarCollapsed default at line $($i+1)"
    break
  }
}

# 2. Fix flagUrl fallback encoding rusak
for ($i = 255; $i -lt 265; $i++) {
  if ($lines[$i] -match "flagUrl.*country_flag_url") {
    $lines[$i] = "              flagUrl: p.country_flag_url || '',"
    Write-Host "Fixed flagUrl fallback at line $($i+1)"
    break
  }
}

# 3. Fix sidebar logo encoding rusak - ganti dengan SVG/text Indonesia flag
for ($i = 448; $i -lt 465; $i++) {
  if ($lines[$i] -match "sidebar-logo") {
    # Find the block with the flag emoji
    for ($j = $i; $j -lt $i + 15; $j++) {
      if ($lines[$j] -match "ðŸ‡®ðŸ‡©|flag.*primary") {
        $lines[$j] = $lines[$j] -replace "ðŸ‡®ðŸ‡©", "ID"
        Write-Host "Fixed flag emoji at line $($j+1)"
      }
    }
    break
  }
}

# 4. Fix all remaining encoding rusak emoji
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -match "ðŸ‡®ðŸ‡©") {
    $lines[$i] = $lines[$i] -replace "ðŸ‡®ðŸ‡©", ""
    Write-Host "Fixed remaining flag at line $($i+1)"
  }
}

[System.IO.File]::WriteAllLines($f, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host "Done sidebar fix. Lines: $($lines.Count)"
