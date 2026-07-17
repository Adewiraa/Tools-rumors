$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# ── 1. FIX LOGO KOMPETISI: tambah background putih agar terlihat ────────────────
# Baris 2086 (0-based 2085): img logo kompetisi
for ($i = 2083; $i -lt 2092; $i++) {
  if ($lines[$i] -match "comp\.logoUrl.*startsWith.*http" -and $lines[$i+1] -match "<img.*comp\.logo") {
    $lines[$i+1] = "                    ? <img src={comp.logoUrl} crossOrigin=""anonymous"" alt="""" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0, background: 'white', borderRadius: 4, padding: 2 }} />"
    Write-Host "Fixed comp logo at line $($i+2)"
    break
  }
}

# ── 2. HAPUS LEGEND (baris 2288-2296) ──────────────────────────────────────────
$legendStart = -1
for ($i = 2285; $i -lt 2300; $i++) {
  if ($lines[$i] -match "Biru.*Asing starting|gap.*14.*borderTop") {
    $legendStart = $i
    Write-Host "Legend starts at line $($i+1)"
    break
  }
}
if ($legendStart -ge 0) {
  # Hapus 8 baris legend block
  for ($i = $legendStart; $i -lt $legendStart + 9; $i++) {
    $lines[$i] = ""
  }
  Write-Host "Removed legend block"
}

# ── 3. HAPUS WAKTU, HANYA TAMPILKAN VENUE ──────────────────────────────────────
for ($i = 2290; $i -lt 2320; $i++) {
  if ($lines[$i] -match "toLocaleString.*WIB|weekday.*short.*day.*2-digit") {
    # Cari div pembungkus waktu (biasanya 2 baris: div + konten)
    # Hapus baris waktu WIB
    $lines[$i] = ""
    # Hapus div pembungkus jika ada
    if ($lines[$i-1] -match '^\s*<div.*fontSize.*8.*color.*555') {
      $lines[$i-1] = ""
    }
    Write-Host "Removed time line at $($i+1)"
    break
  }
}

# ── 4. FIX AWAY FLAG: gunakan dot indikator jika flagUrl kosong ────────────────
# Cari blok away starting yang punya isForeign && p.flagUrl check
$awayFixed = 0
for ($i = 2210; $i -lt 2240; $i++) {
  if ($lines[$i] -match "isForeign && p\.flagUrl && p\.flagUrl\.startsWith" -and $awayFixed -eq 0) {
    # Ganti dengan versi yang handle empty flagUrl dengan dot
    $lines[$i]   = "                          {isForeign && p.flagUrl && p.flagUrl.startsWith('http')"
    $lines[$i+1] = "                            ? <img src={p.flagUrl} crossOrigin=""anonymous"" alt="""" style={{ width: 12, height: 8, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />"
    $lines[$i+2] = "                            : isForeign && p.flagUrl && p.flagUrl.length <= 4"
    $lines[$i+3] = "                              ? <span style={{ fontSize: 9, lineHeight: 1, flexShrink: 0 }}>{p.flagUrl}</span>"
    $lines[$i+4] = "                              : isForeign ? <span style={{ fontSize: 8, color: '#93c5fd', fontWeight: 800, flexShrink: 0 }}>*</span> : null}"
    $awayFixed++
    Write-Host "Fixed away flag fallback at line $($i+1)"
    break
  }
}

# Sama untuk home (jaga konsistensi)
$homeFixed = 0
for ($i = 2120; $i -lt 2165; $i++) {
  if ($lines[$i] -match "isForeign && p\.flagUrl && p\.flagUrl\.startsWith" -and $homeFixed -eq 0) {
    $lines[$i]   = "                          {isForeign && p.flagUrl && p.flagUrl.startsWith('http')"
    $lines[$i+1] = "                            ? <img src={p.flagUrl} crossOrigin=""anonymous"" alt="""" style={{ width: 12, height: 8, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />"
    $lines[$i+2] = "                            : isForeign && p.flagUrl && p.flagUrl.length <= 4"
    $lines[$i+3] = "                              ? <span style={{ fontSize: 9, lineHeight: 1, flexShrink: 0 }}>{p.flagUrl}</span>"
    $lines[$i+4] = "                              : isForeign ? <span style={{ fontSize: 8, color: '#93c5fd', fontWeight: 800, flexShrink: 0 }}>*</span> : null}"
    $homeFixed++
    Write-Host "Fixed home flag fallback at line $($i+1)"
    break
  }
}

[System.IO.File]::WriteAllLines($f, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host "All done. Total lines: $($lines.Count)"
