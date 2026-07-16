$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# 1. Tambah kalkulasi foreignPool setelah baris fDibawa (index 1754, 0-based)
# baris 1755 = "    const fDibawa = ..."
# insert setelah index 1755
$lines = $lines[0..1755] +
  "    // Asing di pool = terdaftar di squad tapi tidak dibawa ke match (tidak masuk DSP pertandingan)" +
  "    const foreignPool = pool.filter(p => p.nationality !== 'Indonesia');" +
  $lines[1756..($lines.Count - 1)]

Write-Host "After insert foreignPool: $($lines.Count)"

# 2. Ganti blok CADANGAN INFO (baris 1857-1880, sekarang +2 jadi 1859-1882)
# Cari baris "{/* CADANGAN INFO */}" 
$ciStart = -1; $ciEnd = -1
for ($i = 1855; $i -lt 1895; $i++) {
  if ($lines[$i] -match "CADANGAN INFO") { $ciStart = $i; break }
}
# Cari closing </div> dari blok CADANGAN INFO
for ($i = $ciStart; $i -lt $ciStart + 30; $i++) {
  if ($lines[$i] -match "^\s*</div>\s*$") {
    # Check kalau ini closing dari div CADANGAN INFO (ada 3 </div>: inner, outer, kolom)
    # Yang kita mau adalah closing outer div dari blok info
    $j = $i
    $depth = 0
    for ($k = $ciStart; $k -le $i; $k++) {
      if ($lines[$k] -match "<div") { $depth++ }
      if ($lines[$k] -match "</div>") { $depth-- }
    }
    if ($depth -eq 0) { $ciEnd = $i; break }
  }
}
Write-Host "CADANGAN INFO block: start=$($ciStart+1) end=$($ciEnd+1)"

# Ganti baris ciStart..ciEnd dengan blok baru
$newInfoBlock = @"

            {/* TIDAK MASUK DSP PERTANDINGAN */}
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--neutral-100)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>
                  Tidak Masuk DSP
                </span>
                <span style={{ fontSize: 9, fontWeight: 700,
                  background: fDibawa >= MAX_ASING_DIBAWA ? '#fee2e2' : '#fef3c7',
                  color: fDibawa >= MAX_ASING_DIBAWA ? '#991b1b' : '#92400e',
                  padding: '1px 7px', borderRadius: 6 }}>
                  Dibawa: {fDibawa}/{MAX_ASING_DIBAWA}
                </span>
              </div>
              {foreignPool.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--neutral-400)', textAlign: 'center', padding: '8px 0' }}>
                  Semua asing masuk DSP pertandingan
                </div>
              ) : (
                foreignPool.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                    borderRadius: 8, background: '#fef3c7', border: '1px solid #f59e0b',
                    fontSize: 11, fontWeight: 600, marginBottom: 4, color: '#78350f' }}>
                    {renderFlag(p)}
                    <span style={{ fontSize: 10, minWidth: 20, opacity: 0.75 }}>#{p.shirtNumber}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.displayName}</span>
                    <span style={{ fontSize: 9, opacity: 0.7 }}>{posLabel[p.position] || 'MF'}</span>
                  </div>
                ))
              )}
              <div style={{ marginTop: 8, fontSize: 9, color: 'var(--neutral-400)', lineHeight: 1.5,
                padding: '5px 7px', background: 'var(--neutral-50)', borderRadius: 6 }}>
                Maks 7 asing starting · 9 dibawa · 11 DSP liga
              </div>
            </div>
"@

$newInfoLines = $newInfoBlock -split "`n" | ForEach-Object { $_ -replace "`r", "" }

$lines = $lines[0..($ciStart - 1)] + $newInfoLines + $lines[($ciEnd + 1)..($lines.Count - 1)]
Write-Host "After replace info block: $($lines.Count)"

[System.IO.File]::WriteAllLines($f, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host "All done. Final lines: $($lines.Count)"
