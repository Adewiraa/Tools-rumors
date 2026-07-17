$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# ── 1. Update activeMenu type union (baris 74, index 73) ─────────────────────
$lines[73] = "  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'schedule' | 'lineups' | 'results' | 'rumors' | 'clubs' | 'players' | 'competitions' | 'logs' | 'settings'>('dashboard');"
Write-Host "1. Updated activeMenu type"

# ── 2. Tambah editingScheduleId state setelah editingCompetitionId (index 103) ─
$before2 = $lines[0..103]
$insert2 = "  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);"
$after2  = $lines[104..($lines.Count - 1)]
$lines   = $before2 + $insert2 + $after2
Write-Host "2. Added editingScheduleId state"

# ── 3. navigateTo: tambah setEditingScheduleId(null) ─────────────────────────
for ($i = 344; $i -lt 360; $i++) {
  if ($lines[$i] -match "setEditingCompetitionId\(null\)") {
    $lines[$i] = $lines[$i]
    $lines = $lines[0..$i] + "    setEditingScheduleId(null);" + $lines[($i+1)..($lines.Count-1)]
    Write-Host "3. Added setEditingScheduleId in navigateTo at line $($i+2)"
    break
  }
}

# ── 4. Sidebar Desktop — tambah menu Jadwal SEBELUM Lineup Tim ────────────────
for ($i = 468; $i -lt 480; $i++) {
  if ($lines[$i] -match "activeMenu === 'lineups'.*Lineup Tim|Lineup Tim") {
    # Insert 3 baris sebelum menu lineups
    $before4 = $lines[0..($i-1)]
    $ins4 = @(
      "          <div className={`menu-item \${activeMenu === 'schedule' ? 'active' : ''}`} onClick={() => { setActiveMenu('schedule'); setEditingScheduleId(null); }}>",
      "            <Calendar size={18} />",
      "            {!sidebarCollapsed && <span>Jadwal Pertandingan</span>}",
      "          </div>"
    )
    $after4 = $lines[$i..($lines.Count-1)]
    $lines  = $before4 + $ins4 + $after4
    Write-Host "4. Added Jadwal menu in sidebar at line $($i+1)"
    break
  }
}

# ── 5. Mobile Drawer — tambah menu Jadwal SEBELUM Lineup Tim ─────────────────
for ($i = 388; $i -lt 410; $i++) {
  if ($lines[$i] -match "activeMenu === 'lineups'.*navigateTo.*lineups|navigateTo.*lineups.*Lineup Tim") {
    $before5 = $lines[0..($i-1)]
    $ins5 = @(
      "              <div className={`menu-item \${activeMenu === 'schedule' ? 'active' : ''}`} onClick={() => navigateTo('schedule')} style={{ flexDirection: 'row', borderLeft: '3px solid transparent', borderTop: 'none' }}>",
      "                <Calendar size={18} />",
      "                <span style={{ display: 'inline', fontSize: 14 }}>Jadwal Pertandingan</span>",
      "              </div>"
    )
    $after5 = $lines[$i..($lines.Count-1)]
    $lines  = $before5 + $ins5 + $after5
    Write-Host "5. Added Jadwal in mobile drawer at line $($i+1)"
    break
  }
}

# ── 6. "Buat Baru" button — tambah handle schedule ───────────────────────────
for ($i = 565; $i -lt 585; $i++) {
  if ($lines[$i] -match "activeMenu === 'lineups'.*setEditingLineupId|if.*lineups.*setEditingLineupId") {
    # Insert else if schedule sebelum 'lineups' check
    $before6 = $lines[0..($i-1)]
    $ins6 = "                  if (activeMenu === 'schedule') setEditingScheduleId('new');"
    $after6 = $lines[$i..($lines.Count-1)]
    $lines  = $before6 + $ins6 + $after6
    Write-Host "6. Added schedule in Buat Baru at line $($i+1)"
    break
  }
}

# ── 7. Router — tambah {activeMenu === 'schedule'} route ─────────────────────
# Cari "Lineup Roster Route"
for ($i = 655; $i -lt 685; $i++) {
  if ($lines[$i] -match "Lineup Roster Route") {
    $before7 = $lines[0..($i-1)]
    $ins7 = @(
      "",
      "              {/* Jadwal Pertandingan Route */}",
      "              {activeMenu === 'schedule' && (",
      "                editingScheduleId ? (",
      "                  <ScheduleEditorView",
      "                    matchId={editingScheduleId}",
      "                    clubs={clubs}",
      "                    competitions={competitions}",
      "                    matches={matches}",
      "                    onClose={() => setEditingScheduleId(null)}",
      "                    onSave={async (newMatch) => {",
      "                      try {",
      "                        const res = await fetch('/api/matches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ match: newMatch }) });",
      "                        const result = await res.json();",
      "                        if (!result.success) triggerToast('DB error: ' + result.error, 'warning');",
      "                      } catch (err) { console.warn('Schedule save error:', err); }",
      "                      if (editingScheduleId === 'new') {",
      "                        setMatches(prev => [newMatch, ...prev]);",
      "                        logAction('CREATE_SCHEDULE', 'Jadwal Pertandingan', `Jadwal baru: \${newMatch.homeClubName} vs \${newMatch.awayClubName}`);",
      "                        triggerToast('Jadwal berhasil ditambahkan!');",
      "                      } else {",
      "                        setMatches(prev => prev.map(m => m.id === newMatch.id ? newMatch : m));",
      "                        logAction('UPDATE_SCHEDULE', 'Jadwal Pertandingan', `Update jadwal: \${newMatch.homeClubName} vs \${newMatch.awayClubName}`);",
      "                        triggerToast('Jadwal berhasil diperbarui!');",
      "                      }",
      "                      setEditingScheduleId(null);",
      "                    }}",
      "                    triggerToast={triggerToast}",
      "                  />",
      "                ) : (",
      "                  <ScheduleListView",
      "                    matches={matches}",
      "                    competitions={competitions}",
      "                    onCreateNew={() => setEditingScheduleId('new')}",
      "                    onEdit={setEditingScheduleId}",
      "                    onDelete={async (id) => {",
      "                      setMatches(prev => prev.filter(m => m.id !== id));",
      "                      logAction('DELETE_SCHEDULE', 'Jadwal Pertandingan', `Hapus jadwal id: \${id}`);",
      "                      triggerToast('Jadwal berhasil dihapus.');",
      "                      try { await fetch('/api/matches', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); } catch {}",
      "                    }}",
      "                    onCreateLineup={(id) => { setEditingLineupId(id); setActiveMenu('lineups'); }}",
      "                    onInputResult={(id) => { setEditingResultId(id); setActiveMenu('results'); }}",
      "                    hasPermission={hasPermission}",
      "                  />",
      "                )",
      "              )}",
      ""
    )
    $after7 = $lines[$i..($lines.Count-1)]
    $lines  = $before7 + $ins7 + $after7
    Write-Host "7. Added Schedule route at line $($i+1)"
    break
  }
}

[System.IO.File]::WriteAllLines($f, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host "All done. Total lines: $($lines.Count)"
