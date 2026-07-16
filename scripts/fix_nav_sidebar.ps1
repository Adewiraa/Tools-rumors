$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# 1. Update navigateTo agar juga collapse sidebar (baris 344-353, 0-based 343-352)
$lines[343] = "  // Helper to navigate, close mobile drawer, dan collapse sidebar"
$lines[344] = "  const navigateTo = (menu: typeof activeMenu) => {"
$lines[345] = "    setActiveMenu(menu);"
$lines[346] = "    setMobileDrawerOpen(false);"
$lines[347] = "    setSidebarCollapsed(true); // auto-collapse setelah pilih menu"
$lines[348] = "    setEditingLineupId(null);"
$lines[349] = "    setEditingResultId(null);"
$lines[350] = "    setEditingRumorId(null);"
$lines[351] = "    setEditingClubId(null);"
$lines[352] = "    setEditingPlayerId(null);"
$lines[353] = "    setEditingCompetitionId(null);"
$lines[354] = "  };"

# 2. Update <aside> untuk support hover expand
# Cari baris aside dengan sidebarCollapsed
for ($i = 448; $i -lt 455; $i++) {
  if ($lines[$i] -match '<aside.*sidebar.*sidebarCollapsed') {
    $lines[$i] = '      <aside className="sidebar" style={{ width: sidebarCollapsed ? "72px" : "248px", transition: "width 0.2s ease" }} onMouseEnter={() => setSidebarCollapsed(false)} onMouseLeave={() => setSidebarCollapsed(true)}>'
    Write-Host "Updated aside hover at line $($i+1)"
    break
  }
}

[System.IO.File]::WriteAllLines($f, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host "Done. Lines: $($lines.Count)"
