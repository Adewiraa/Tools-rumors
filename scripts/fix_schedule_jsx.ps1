$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# Fix baris 396 (index 395) - mobile drawer Jadwal
$lines[395] = '              <div className={`menu-item ${activeMenu === ' + "'" + 'schedule' + "'" + ' ? ' + "'" + 'active' + "'" + ' : ' + "'" + "'}" + '`} onClick={() => navigateTo(' + "'" + 'schedule' + "'" + ')} style={{ flexDirection: ' + "'" + 'row' + "'" + ', borderLeft: ' + "'" + '3px solid transparent' + "'" + ', borderTop: ' + "'" + 'none' + "'" + ' }}>'
Write-Host "Fixed mobile drawer line 396"

# Fix baris 479 (index 478) - sidebar desktop Jadwal
# Cari index yang tepat
for ($i = 474; $i -lt 490; $i++) {
  if ($lines[$i] -match "menu-item\\s+\\\\}" -or ($lines[$i] -match 'className=\{menu-item' -and $lines[$i] -match 'schedule')) {
    $lines[$i] = '          <div className={`menu-item ${activeMenu === ' + "'" + 'schedule' + "'" + ' ? ' + "'" + 'active' + "'" + ' : ' + "'" + "'}" + '`} onClick={() => { setActiveMenu(' + "'" + 'schedule' + "'" + '); setEditingScheduleId(null); }}>'
    Write-Host "Fixed sidebar desktop line $($i+1)"
    break
  }
}

[System.IO.File]::WriteAllLines($f, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host "Done"
