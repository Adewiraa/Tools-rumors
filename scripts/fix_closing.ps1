$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# Baris 1880 (0-based) adalah "</div>" yang menutup lineup-col
# Baris 1881 (0-based) adalah "</div>" yang menutup lineup-cols-grid
# Kita perlu tambah satu "</div>" lagi setelah 1881 untuk lineup-team-panel
# Sekarang insert setelah index 1881
$before = $lines[0..1881]
$after  = $lines[1882..($lines.Count - 1)]
$newLines = $before + "      </div>" + $after

[System.IO.File]::WriteAllLines($f, $newLines, [System.Text.UTF8Encoding]::new($false))
Write-Host "Done. Lines: $($newLines.Count)"
