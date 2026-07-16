$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# Fix duplikat baris 451-452 (0-based: 450-451)
# baris 450 = "{!sidebarCollapsed ? (" (duplikat, hapus)
# baris 451 = "{!sidebarCollapsed ? (" (keep)
$lines[450] = "        <div className=""sidebar-logo"">"
$lines[451] = "          {!sidebarCollapsed ? ("

[System.IO.File]::WriteAllLines($f, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host "Fixed duplication. Lines: $($lines.Count)"

# Verifikasi
$verify = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)
$verify[448..462] | ForEach-Object -Begin {$i=449} -Process { Write-Host "$i`: $_"; $i++ }
