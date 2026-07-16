$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# 1. Tambah fDibawa setelah baris fSub (index 1753, 0-based)
$lines = $lines[0..1753] + "    const fDibawa = fSt + fSub; // total asing dibawa per pertandingan" + $lines[1754..($lines.Count-1)]

# 2. Fix template literal rusak dan hapus NON-DSP lama
for ($i = 1850; $i -lt 1900; $i++) {
    if ($lines[$i] -match "Sisa.*slot asing") {
        $lines[$i] = '                  ? (`Sisa ${MAX_ASING_DIBAWA - fDibawa} slot asing tersedia`)'
    }
    if ($lines[$i] -match "\{\/\* NON-DSP \*\/\}") {
        $lines[$i] = ""
    }
}

# 3. Fix closing div - cek apakah kolom 3 punya closing </div> yang cukup
# Cari baris 1879-1885 setelah insert
for ($i = 1878; $i -lt 1888; $i++) {
    Write-Host "$($i+1): $($lines[$i])"
}

[System.IO.File]::WriteAllLines($f, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host "Done. Lines: $($lines.Count)"
