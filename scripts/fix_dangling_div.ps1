$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# Baris 2300 (index 2299) = "<div>" pembuka kosong
# Baris 2301 (index 2300) = "" kosong
# Baris 2302 (index 2301) = "" kosong (waktu dihapus)
# Baris 2303 (index 2302) = "                  </div>" - ini sisa, harus dihapus
# Baris 2304 (index 2303) = venue

# Hapus baris "<div>" kosong (index 2299) dan "</div>" sisa (index 2302)
for ($i = 2296; $i -lt 2308; $i++) {
  $ln = $lines[$i].Trim()
  Write-Host "$($i+1): [$ln]"
}
Write-Host "---"

# Fix: hapus div pembuka di 2300 dan closing div di 2303
$lines[2299] = ""  # <div> pembuka kosong
$lines[2302] = ""  # </div> sisa

[System.IO.File]::WriteAllLines($f, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host "Fixed dangling divs"
