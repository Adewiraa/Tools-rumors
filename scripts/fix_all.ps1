$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# ── 1. FIX ENCODING Â· di baris 1891 ──────────────────────────────────
for ($i = 1885; $i -lt 1898; $i++) {
  if ($lines[$i] -match "Maks 7 asing") {
    $lines[$i] = '                Maks 7 asing starting | 9 dibawa | 11 DSP liga'
    Write-Host "Fixed encoding at line $($i+1)"
    break
  }
}

# ── 2. FIX DELETE — pastikan tombol hapus selalu tampil tanpa role guard ──
# Ganti conditional {hasPermission('Lineup', 'delete') && ...} jadi selalu tampil
# baris 1445-1457: hapus {hasPermission wrapper}, delete selalu ada
for ($i = 1440; $i -lt 1465; $i++) {
  if ($lines[$i] -match "hasPermission\('Lineup', 'delete'\)") {
    # Replace dengan versi tanpa guard - selalu tampilkan delete
    $lines[$i] = '                      {('
    Write-Host "Fixed delete permission at line $($i+1)"
    break
  }
}

# ── 3. REPLACE PREVIEW MODAL (baris 1978-2065, 0-based 1977-2064) ──────
$p3before = $lines[0..1976]
$p3after  = $lines[2065..($lines.Count - 1)]

$previewBlock = @"

      {showPreviewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
          onClick={() => setShowPreviewModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, maxHeight: '95vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-md btn-primary" onClick={async () => {
                const node = document.getElementById('lineup-story-card');
                if (!node) return;
                try {
                  triggerToast('Membuat gambar...');
                  const dataUrl = await htmlToImage.toPng(node, { cacheBust: true, pixelRatio: 3 });
                  const link = document.createElement('a');
                  link.download = `Lineup_${homeClub?.shortName}_vs_${awayClub?.shortName}.png`;
                  link.href = dataUrl; link.click();
                  triggerToast('Story berhasil diunduh!');
                } catch { triggerToast('Gagal mengunduh.', 'error'); }
              }}><Upload size={14} /> Unduh PNG (9:16)</button>
              <button className="btn btn-md btn-secondary" onClick={() => setShowPreviewModal(false)}>
                <X size={14} /> Tutup
              </button>
            </div>

            {/* STORY CARD 9:16 - DESIGN PROFESIONAL */}
            <div id="lineup-story-card" style={{
              width: 360, minHeight: 640,
              background: '#0a0a0a',
              color: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              boxShadow: '0 30px 60px rgba(0,0,0,0.9)', position: 'relative',
              fontFamily: "'Inter', system-ui, sans-serif",
            }}>

              {/* TOP ACCENT BAR */}
              <div style={{ height: 3, background: 'linear-gradient(90deg, #c8a84b 0%, #e8cc6a 50%, #c8a84b 100%)' }} />

              {/* HEADER — kompetisi + logo */}
              <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {(() => {
                  const comp = competitions.find(c => c.name === selectedCompetitionName);
                  return comp?.logoUrl && comp.logoUrl.startsWith('http')
                    ? <img src={comp.logoUrl} crossOrigin="anonymous" alt="" style={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }} />
                    : <div style={{ width: 28, height: 28, background: 'rgba(200,168,75,0.15)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 14, height: 14, background: '#c8a84b', borderRadius: 2 }} />
                      </div>;
                })()}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 7, fontWeight: 700, color: '#c8a84b', letterSpacing: 2, textTransform: 'uppercase' }}>
                    {selectedCompetitionName}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'white', letterSpacing: 0.5, marginTop: 1 }}>SUSUNAN PEMAIN</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 7, color: '#666', letterSpacing: 1 }}>MEDIA</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#c8a84b', letterSpacing: 1 }}>TOOLS</div>
                </div>
              </div>

              {/* CLUBS MATCHUP */}
              <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  {homeClub?.logoUrl && homeClub.logoUrl.startsWith('http')
                    ? <img src={homeClub.logoUrl} crossOrigin="anonymous" style={{ width: 38, height: 38, objectFit: 'contain' }} alt="" />
                    : <div style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.05)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#666' }}>HOME</div>}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: 0.5 }}>{homeClub?.shortName}</div>
                    <div style={{ fontSize: 8, color: '#c8a84b', fontWeight: 600, marginTop: 1 }}>{homeFormation}</div>
                  </div>
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#444', letterSpacing: 2, padding: '0 8px' }}>VS</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexDirection: 'row-reverse' }}>
                  {awayClub?.logoUrl && awayClub.logoUrl.startsWith('http')
                    ? <img src={awayClub.logoUrl} crossOrigin="anonymous" style={{ width: 38, height: 38, objectFit: 'contain' }} alt="" />
                    : <div style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.05)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#666' }}>AWAY</div>}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: 0.5 }}>{awayClub?.shortName}</div>
                    <div style={{ fontSize: 8, color: '#c8a84b', fontWeight: 600, marginTop: 1 }}>{awayFormation}</div>
                  </div>
                </div>
              </div>

              {/* PLAYERS SECTION — Starting XI */}
              <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

                {/* HOME */}
                <div style={{ flex: 1, padding: '10px 12px 10px 16px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                  {/* Starting XI */}
                  <div style={{ fontSize: 7, fontWeight: 800, color: '#c8a84b', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                    {homeClub?.code || 'HOME'} — STARTING
                  </div>
                  {homeSquad.filter(p => homeStarters.includes(p.id))
                    .sort((a,b) => ['Goalkeeper','Defender','Midfielder','Forward'].indexOf(a.position) - ['Goalkeeper','Defender','Midfielder','Forward'].indexOf(b.position))
                    .map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                      <span style={{ fontSize: 8, color: '#c8a84b', fontWeight: 700, minWidth: 20, fontVariantNumeric: 'tabular-nums' }}>#{p.shirtNumber}</span>
                      <span style={{ fontSize: 9, color: p.id === homeCaptain ? '#c8a84b' : (p.nationality !== 'Indonesia' ? '#93c5fd' : '#e2e8f0'),
                        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: p.id === homeCaptain ? 700 : 400 }}>
                        {p.displayName}{p.id === homeCaptain ? ' (C)' : ''}
                      </span>
                    </div>
                  ))}

                  {/* Cadangan Home */}
                  {homeSubs.length > 0 && (
                    <>
                      <div style={{ fontSize: 7, fontWeight: 700, color: '#555', letterSpacing: 1, textTransform: 'uppercase', margin: '6px 0 4px', paddingTop: 5, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        CADANGAN
                      </div>
                      {homeSquad.filter(p => homeSubs.includes(p.id)).map(p => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                          <span style={{ fontSize: 7, color: '#555', fontWeight: 600, minWidth: 20 }}>#{p.shirtNumber}</span>
                          <span style={{ fontSize: 8, color: '#6b7280', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.displayName}{p.nationality !== 'Indonesia' ? ' *' : ''}
                          </span>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Non-DSP Home */}
                  {homeSquad.filter(p => !homeStarters.includes(p.id) && !homeSubs.includes(p.id) && p.nationality !== 'Indonesia').length > 0 && (
                    <>
                      <div style={{ fontSize: 7, fontWeight: 700, color: '#444', letterSpacing: 1, textTransform: 'uppercase', margin: '5px 0 3px', paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                        NON-DSP
                      </div>
                      {homeSquad.filter(p => !homeStarters.includes(p.id) && !homeSubs.includes(p.id) && p.nationality !== 'Indonesia').map(p => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                          <span style={{ fontSize: 7, color: '#444', fontWeight: 600, minWidth: 20 }}>#{p.shirtNumber}</span>
                          <span style={{ fontSize: 8, color: '#4b5563', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.displayName}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* AWAY */}
                <div style={{ flex: 1, padding: '10px 16px 10px 12px' }}>
                  {/* Starting XI */}
                  <div style={{ fontSize: 7, fontWeight: 800, color: '#c8a84b', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                    {awayClub?.code || 'AWAY'} — STARTING
                  </div>
                  {awaySquad.filter(p => awayStarters.includes(p.id))
                    .sort((a,b) => ['Goalkeeper','Defender','Midfielder','Forward'].indexOf(a.position) - ['Goalkeeper','Defender','Midfielder','Forward'].indexOf(b.position))
                    .map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                      <span style={{ fontSize: 8, color: '#c8a84b', fontWeight: 700, minWidth: 20, fontVariantNumeric: 'tabular-nums' }}>#{p.shirtNumber}</span>
                      <span style={{ fontSize: 9, color: p.id === awayCaptain ? '#c8a84b' : (p.nationality !== 'Indonesia' ? '#93c5fd' : '#e2e8f0'),
                        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: p.id === awayCaptain ? 700 : 400 }}>
                        {p.displayName}{p.id === awayCaptain ? ' (C)' : ''}
                      </span>
                    </div>
                  ))}

                  {/* Cadangan Away */}
                  {awaySubs.length > 0 && (
                    <>
                      <div style={{ fontSize: 7, fontWeight: 700, color: '#555', letterSpacing: 1, textTransform: 'uppercase', margin: '6px 0 4px', paddingTop: 5, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        CADANGAN
                      </div>
                      {awaySquad.filter(p => awaySubs.includes(p.id)).map(p => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                          <span style={{ fontSize: 7, color: '#555', fontWeight: 600, minWidth: 20 }}>#{p.shirtNumber}</span>
                          <span style={{ fontSize: 8, color: '#6b7280', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.displayName}{p.nationality !== 'Indonesia' ? ' *' : ''}
                          </span>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Non-DSP Away */}
                  {awaySquad.filter(p => !awayStarters.includes(p.id) && !awaySubs.includes(p.id) && p.nationality !== 'Indonesia').length > 0 && (
                    <>
                      <div style={{ fontSize: 7, fontWeight: 700, color: '#444', letterSpacing: 1, textTransform: 'uppercase', margin: '5px 0 3px', paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                        NON-DSP
                      </div>
                      {awaySquad.filter(p => !awayStarters.includes(p.id) && !awaySubs.includes(p.id) && p.nationality !== 'Indonesia').map(p => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                          <span style={{ fontSize: 7, color: '#444', fontWeight: 600, minWidth: 20 }}>#{p.shirtNumber}</span>
                          <span style={{ fontSize: 8, color: '#4b5563', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.displayName}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* LEGEND */}
              <div style={{ padding: '5px 16px', display: 'flex', gap: 12, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 7, color: '#555' }}><span style={{ color: '#93c5fd' }}>Biru</span> = Asing</span>
                <span style={{ fontSize: 7, color: '#555' }}><span style={{ color: '#c8a84b' }}>Emas</span> = Kapten</span>
                <span style={{ fontSize: 7, color: '#555' }}>* = Asing cadangan</span>
              </div>

              {/* FOOTER */}
              <div style={{ padding: '8px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(200,168,75,0.03)' }}>
                <div>
                  <div style={{ fontSize: 8, color: '#666' }}>
                    {new Date(kickoffTime).toLocaleString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} WIB
                  </div>
                  <div style={{ fontSize: 7, color: '#444', marginTop: 1 }}>{venueName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#c8a84b', letterSpacing: 1 }}>MEDIA TOOLS</div>
                  <div style={{ fontSize: 7, color: '#555', marginTop: 1 }}>@GARUDAMATCHROOM</div>
                </div>
              </div>

              {/* BOTTOM ACCENT BAR */}
              <div style={{ height: 3, background: 'linear-gradient(90deg, #c8a84b 0%, #e8cc6a 50%, #c8a84b 100%)' }} />
            </div>
          </div>
        </div>
      )}
"@

$p3midLines = $previewBlock -split "`n" | ForEach-Object { $_ -replace "`r", "" }
$lines = $p3before + $p3midLines + $p3after
Write-Host "Preview replaced. Lines: $($lines.Count)"

[System.IO.File]::WriteAllLines($f, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host "All done. Final: $($lines.Count)"
