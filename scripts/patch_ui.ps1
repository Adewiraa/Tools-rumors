$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# 1. Fix addAsing (baris 1617-1625, 0-based 1616-1624)
$p1before = $lines[0..1615]
$p1after  = $lines[1625..($lines.Count - 1)]
$addAsingBlock = @"

  const addAsing = (side: 'home' | 'away') => {
    const inp = side === 'home' ? homeAsingInput : awayAsingInput;
    if (!inp.name.trim()) { triggerToast('Nama wajib diisi.', 'error'); return; }
    const entry: AsingEntry = { id: 'asing-' + Date.now(), name: inp.name.trim(), no: Number(inp.no) || 0, pos: inp.pos };
    if (side === 'home') { setHomeAsing(p => [...p, entry]); setHomeAsingInput({ name: '', no: '', pos: 'FW' }); }
    else { setAwayAsing(p => [...p, entry]); setAwayAsingInput({ name: '', no: '', pos: 'FW' }); }
  };
"@
$p1mid = $addAsingBlock -split "`n" | ForEach-Object { $_ -replace "`r", "" }
$lines = $p1before + $p1mid + $p1after
Write-Host "Pass 1 done. Lines: $($lines.Count)"

# 2. Setelah pass 1, cari baris kolom 3 "NON-DSP" untuk diganti
# Cari baris yang mengandung "KOLOM 3" atau "NON-DSP" di renderTeamPanel
$col3Start = -1; $col3End = -1
for ($i = 1830; $i -lt 1910; $i++) {
  if ($lines[$i] -match "KOLOM 3|NON-DSP") { $col3Start = $i; break }
}
for ($i = $col3Start; $i -lt $col3Start + 70; $i++) {
  if ($lines[$i] -match "^\s*\}\s*$" -and $lines[$i+1] -match "^\s*$" -and $lines[$i+2] -match "lineup-cols-grid|<\/div>") {
    $col3End = $i; break
  }
  if ($lines[$i] -match "^\s*\{\/\* NON-DSP \*\/\}\s*$" -or ($i -gt $col3Start + 5 -and $lines[$i] -match "asingList\.length < MAX_NONDSP")) {
    # keep searching
  }
}
# Fallback: cari closing div kolom 3
if ($col3End -lt 0) {
  for ($i = 1880; $i -lt 1910; $i++) {
    if ($lines[$i] -match "^\s*\}\s*$" -and $lines[$i+1] -match "^\s*</div>") { $col3End = $i; break }
    if ($lines[$i] -match "^\s*</div>\s*$" -and $lines[$i+1] -match "^\s*</div>\s*$" -and $lines[$i+2] -match "lineup-cols-grid") { $col3End = $i - 1; break }
  }
}
Write-Host "Col3: start=$($col3Start+1) end=$($col3End+1)"

# Ganti area "KOLOM 3" - dari div opening sampai closing div nya
# Kita hapus baris 1854-1890 (0-based) dan ganti dengan versi baru yang clean
$c3before = $lines[0..1853]
$c3after  = $lines[1891..($lines.Count - 1)]

$col3New = @"

            {/* CADANGAN INFO */}
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--neutral-100)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--neutral-600)', marginBottom: 6,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Kuota Asing Dibawa</span>
                <span style={{ background: fDibawa >= MAX_ASING_DIBAWA ? '#fee2e2' : '#fef3c7',
                  color: fDibawa >= MAX_ASING_DIBAWA ? '#991b1b' : '#92400e',
                  padding: '1px 7px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                  {fDibawa}/{MAX_ASING_DIBAWA}
                </span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--neutral-400)', lineHeight: 1.5 }}>
                {fDibawa < MAX_ASING_DIBAWA
                  ? `Sisa ${MAX_ASING_DIBAWA - fDibawa} slot asing tersedia`
                  : 'Kuota 9 asing per pertandingan penuh'}
              </div>
              <div style={{ marginTop: 8, fontSize: 10, color: 'var(--neutral-400)', lineHeight: 1.5,
                padding: '6px 8px', background: 'var(--neutral-50)', borderRadius: 6 }}>
                <strong style={{ color: 'var(--neutral-600)' }}>Regulasi:</strong>
                <br />Maks 7 asing di Starting XI
                <br />Total asing dibawa maks 9
                <br />DSP liga maks 11 asing
              </div>
            </div>
"@
$c3midLines = $col3New -split "`n" | ForEach-Object { $_ -replace "`r", "" }
$lines = $c3before + $c3midLines + $c3after
Write-Host "Pass 2 done. Lines: $($lines.Count)"

[System.IO.File]::WriteAllLines($f, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host "All done. Final lines: $($lines.Count)"
