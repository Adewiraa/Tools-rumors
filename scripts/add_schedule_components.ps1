$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# Insert sebelum baris "// 2. LINEUP LIST VIEW" (index 1427)
$insertIdx = 1427

$before = $lines[0..($insertIdx - 1)]
$after  = $lines[$insertIdx..($lines.Count - 1)]

$scheduleCode = @"

// ==========================================
// 1a. SCHEDULE LIST VIEW
// ==========================================
interface ScheduleListProps {
  matches: Match[];
  competitions: Competition[];
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateLineup: (id: string) => void;
  onInputResult: (id: string) => void;
  hasPermission: (module: string, action: any) => boolean;
}

function ScheduleListView({ matches, competitions, onCreateNew, onEdit, onDelete, onCreateLineup, onInputResult, hasPermission }: ScheduleListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComp, setSelectedComp] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = matches.filter(m => {
    const name = (m.homeClubName + ' vs ' + m.awayClubName).toLowerCase();
    const matchSearch = name.includes(searchTerm.toLowerCase()) || m.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchComp   = selectedComp === 'Semua' || m.competition === selectedComp;
    const matchStatus = selectedStatus === 'Semua' || m.status === selectedStatus;
    return matchSearch && matchComp && matchStatus;
  }).sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());

  // Pisah: upcoming vs played
  const upcoming = filtered.filter(m => m.status === 'Scheduled' || m.status === 'Live' || m.status === 'Postponed');
  const played   = filtered.filter(m => m.status === 'Finished' || m.status === 'Cancelled');

  const statusBadge = (m: Match) => {
    const cls = m.status === 'Live' ? 'badge-danger' : m.status === 'Finished' ? 'badge-success' : m.status === 'Postponed' ? 'badge-warning' : m.status === 'Cancelled' ? 'badge-draft' : 'badge-info';
    const label = m.status === 'Scheduled' ? 'Dijadwalkan' : m.status === 'Live' ? 'Live' : m.status === 'Finished' ? 'Selesai' : m.status === 'Postponed' ? 'Ditunda' : 'Dibatalkan';
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  const lineupBadge = (m: Match) => {
    const cls = m.lineupStatus === 'Complete' ? 'badge-success' : m.lineupStatus === 'Needs Review' ? 'badge-warning' : 'badge-draft';
    return <span className={`badge ${cls}`}>{m.lineupStatus === 'Complete' ? 'Siap' : m.lineupStatus === 'Needs Review' ? 'Review' : 'Belum'}</span>;
  };

  const renderMatchRow = (m: Match) => {
    const kickoffDate = new Date(m.kickoff);
    const isToday = kickoffDate.toDateString() === new Date().toDateString();
    const canLineup = m.status === 'Scheduled' || m.status === 'Live';
    const canResult = m.status === 'Live' || m.status === 'Finished';
    return (
      <tr key={m.id} style={{ backgroundColor: isToday ? 'var(--primary-50)' : undefined }}>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {m.homeLogo && m.homeLogo.startsWith('http')
              ? <img src={m.homeLogo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
              : <span style={{ fontSize: 18 }}>{m.homeLogo}</span>}
            <span className="semibold" style={{ fontSize: 13 }}>{m.homeClubName}</span>
            <span className="text-muted" style={{ fontSize: 11, margin: '0 2px' }}>vs</span>
            {m.awayLogo && m.awayLogo.startsWith('http')
              ? <img src={m.awayLogo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
              : <span style={{ fontSize: 18 }}>{m.awayLogo}</span>}
            <span className="semibold" style={{ fontSize: 13 }}>{m.awayClubName}</span>
            {isToday && <span style={{ fontSize: 10, background: 'var(--primary-600)', color: 'white', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>HARI INI</span>}
          </div>
          <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>{m.venue}</div>
        </td>
        <td style={{ fontSize: 12 }}>{m.competition}</td>
        <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          <div>{new Date(m.kickoff).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: '2-digit' })}</div>
          <div className="text-muted" style={{ fontSize: 11 }}>{new Date(m.kickoff).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</div>
        </td>
        <td>{statusBadge(m)}</td>
        <td>{lineupBadge(m)}</td>
        <td>
          {m.status === 'Finished' && m.homeScore !== undefined
            ? <span style={{ fontWeight: 700, fontSize: 14 }}>{m.homeScore} - {m.awayScore}</span>
            : <span className="text-muted" style={{ fontSize: 12 }}>-</span>}
        </td>
        <td className="text-right">
          <div style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {canLineup && hasPermission('Lineup', 'create_edit') && (
              <button className="btn btn-sm btn-primary" onClick={() => onCreateLineup(m.id)}
                title="Buat / Edit Lineup" style={{ fontSize: 11 }}>
                Lineup
              </button>
            )}
            {canResult && hasPermission('Match Result', 'create_edit') && (
              <button className="btn btn-sm btn-secondary" onClick={() => onInputResult(m.id)}
                style={{ fontSize: 11 }}>
                Hasil
              </button>
            )}
            <button className="btn btn-sm btn-secondary" onClick={() => onEdit(m.id)}
              style={{ fontSize: 11 }}>
              <Edit size={12} />
            </button>
            {hasPermission('Lineup', 'delete') && (
              confirmDeleteId === m.id ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ fontSize: 11, color: 'var(--danger-600)', fontWeight: 600 }}>Yakin?</span>
                  <button className="btn btn-sm btn-danger" style={{ fontSize: 11 }} onClick={() => { onDelete(m.id); setConfirmDeleteId(null); }}>Ya</button>
                  <button className="btn btn-sm btn-secondary" style={{ fontSize: 11 }} onClick={() => setConfirmDeleteId(null)}>Batal</button>
                </span>
              ) : (
                <button className="btn btn-sm btn-secondary" style={{ color: 'var(--danger-600)', fontSize: 11 }} onClick={() => setConfirmDeleteId(m.id)}>
                  <Trash2 size={12} />
                </button>
              )
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb"><span>Dashboard</span> <ChevronRight size={10} /> <span>Jadwal Pertandingan</span></div>
          <h1 className="page-title">Jadwal Pertandingan</h1>
          <p className="page-description">Kelola jadwal semua kompetisi. Dari sini kamu bisa langsung buat lineup dan input hasil.</p>
        </div>
        {hasPermission('Lineup', 'create_edit') && (
          <button className="btn btn-md btn-primary" onClick={onCreateNew}>
            <Plus size={16} /> Tambah Jadwal
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="card" style={{ padding: '12px 20px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-input-wrapper" style={{ maxWidth: 260, flex: 1 }}>
          <Search size={14} className="search-icon" />
          <input type="text" className="form-input" placeholder="Cari klub atau stadion..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select className="form-select" style={{ maxWidth: 200 }} value={selectedComp} onChange={e => setSelectedComp(e.target.value)}>
          <option value="Semua">Semua Kompetisi</option>
          {competitions.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select className="form-select" style={{ maxWidth: 160 }} value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
          <option value="Semua">Semua Status</option>
          <option value="Scheduled">Dijadwalkan</option>
          <option value="Live">Live</option>
          <option value="Finished">Selesai</option>
          <option value="Postponed">Ditunda</option>
          <option value="Cancelled">Dibatalkan</option>
        </select>
        {(searchTerm || selectedComp !== 'Semua' || selectedStatus !== 'Semua') && (
          <button className="btn btn-sm btn-secondary" onClick={() => { setSearchTerm(''); setSelectedComp('Semua'); setSelectedStatus('Semua'); }}>Reset</button>
        )}
        <span className="text-muted" style={{ fontSize: 12, marginLeft: 'auto' }}>{filtered.length} pertandingan</span>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Calendar size={36} color="var(--neutral-400)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Belum ada jadwal</h3>
          <p className="text-muted" style={{ marginBottom: 16 }}>Tambahkan jadwal pertandingan untuk semua kompetisi.</p>
          {hasPermission('Lineup', 'create_edit') && (
            <button className="btn btn-sm btn-primary" onClick={onCreateNew}>Tambah Jadwal</button>
          )}
        </div>
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Mendatang ({upcoming.length})
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Pertandingan</th>
                      <th>Kompetisi</th>
                      <th>Kickoff</th>
                      <th>Status</th>
                      <th>Lineup</th>
                      <th>Skor</th>
                      <th className="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>{upcoming.map(renderMatchRow)}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* Played */}
          {played.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 8 }}>
                Sudah Berlangsung ({played.length})
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Pertandingan</th>
                      <th>Kompetisi</th>
                      <th>Kickoff</th>
                      <th>Status</th>
                      <th>Lineup</th>
                      <th>Skor</th>
                      <th className="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>{played.map(renderMatchRow)}</tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ==========================================
// 1b. SCHEDULE EDITOR VIEW
// ==========================================
interface ScheduleEditorProps {
  matchId: string;
  clubs: Club[];
  competitions: Competition[];
  matches: Match[];
  onClose: () => void;
  onSave: (match: Match) => void;
  triggerToast: (msg: string, type?: any) => void;
}

function ScheduleEditorView({ matchId, clubs, competitions, matches, onClose, onSave, triggerToast }: ScheduleEditorProps) {
  const isNew = matchId === 'new';
  const existing = matches.find(m => m.id === matchId);
  const firstComp = competitions.find(c => c.isActive) || competitions[0];

  const [competition, setCompetition] = useState(existing?.competition || firstComp?.name || '');
  const [homeClubId, setHomeClubId] = useState(existing?.homeClubId || clubs[0]?.id || '');
  const [awayClubId, setAwayClubId] = useState(existing?.awayClubId || clubs[1]?.id || '');
  const [kickoff, setKickoff]   = useState(existing?.kickoff ? existing.kickoff.slice(0, 16) : new Date().toISOString().slice(0, 16));
  const [venue, setVenue]       = useState(existing?.venue || '');
  const [status, setStatus]     = useState<Match['status']>(existing?.status || 'Scheduled');

  // Auto-fill venue dari home club
  useEffect(() => {
    if (!existing?.venue) {
      const hc = clubs.find(c => c.id === homeClubId);
      if (hc?.stadium) setVenue(hc.stadium);
    }
  }, [homeClubId]);

  const handleSave = () => {
    if (!homeClubId || !awayClubId) { triggerToast('Pilih kedua tim.', 'error'); return; }
    if (homeClubId === awayClubId) { triggerToast('Tim home dan away tidak boleh sama.', 'error'); return; }
    if (!kickoff) { triggerToast('Isi tanggal kickoff.', 'error'); return; }

    const hc = clubs.find(c => c.id === homeClubId);
    const ac = clubs.find(c => c.id === awayClubId);
    const comp = competitions.find(c => c.name === competition);

    const match: Match = {
      id: existing?.id || ('match-' + Date.now()),
      homeClubId,
      homeClubName: hc?.name || '',
      homeLogo: hc?.logoUrl || '',
      awayClubId,
      awayClubName: ac?.name || '',
      awayLogo: ac?.logoUrl || '',
      competition,
      season: comp?.season || '',
      kickoff: new Date(kickoff).toISOString(),
      venue,
      status,
      homeScore: existing?.homeScore,
      awayScore: existing?.awayScore,
      halfTimeHomeScore: existing?.halfTimeHomeScore,
      halfTimeAwayScore: existing?.halfTimeAwayScore,
      lineupStatus: existing?.lineupStatus || 'Draft',
      publicationStatus: existing?.publicationStatus || 'Draft',
      editor: 'Admin',
      lastUpdated: 'Baru saja',
    };
    onSave(match);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--neutral-200)', paddingBottom: 14 }}>
        <button className="btn btn-sm btn-secondary" onClick={onClose}><ArrowLeft size={16} /> Kembali</button>
        <div>
          <div className="breadcrumb"><span>Jadwal Pertandingan</span> <ChevronRight size={10} /> <span>{isNew ? 'Tambah Jadwal' : 'Edit Jadwal'}</span></div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{isNew ? 'Tambah Jadwal Baru' : `Edit: ${existing?.homeClubName} vs ${existing?.awayClubName}`}</h2>
        </div>
        <button className="btn btn-md btn-primary" style={{ marginLeft: 'auto' }} onClick={handleSave}>
          <CheckCircle size={14} /> {isNew ? 'Simpan Jadwal' : 'Update Jadwal'}
        </button>
      </div>

      <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Kompetisi <span className="required">*</span></label>
          <select className="form-select" value={competition} onChange={e => setCompetition(e.target.value)}>
            {competitions.filter(c => c.isActive).map(c => <option key={c.id} value={c.name}>{c.name} ({c.season})</option>)}
            {competitions.filter(c => !c.isActive).map(c => <option key={c.id} value={c.name}>{c.name} (nonaktif)</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Tim Home <span className="required">*</span></label>
            <select className="form-select" value={homeClubId} onChange={e => setHomeClubId(e.target.value)}>
              {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tim Away <span className="required">*</span></label>
            <select className="form-select" value={awayClubId} onChange={e => setAwayClubId(e.target.value)}>
              {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Preview matchup */}
        {homeClubId && awayClubId && homeClubId !== awayClubId && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '12px 0',
            background: 'var(--neutral-50)', borderRadius: 8, border: '1px solid var(--neutral-200)' }}>
            {(() => {
              const hc = clubs.find(c => c.id === homeClubId);
              const ac = clubs.find(c => c.id === awayClubId);
              return <>
                <div style={{ textAlign: 'center' }}>
                  {hc?.logoUrl && hc.logoUrl.startsWith('http')
                    ? <img src={hc.logoUrl} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                    : <span style={{ fontSize: 28 }}>{hc?.logoUrl || 'H'}</span>}
                  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>{hc?.shortName}</div>
                </div>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--neutral-400)' }}>VS</span>
                <div style={{ textAlign: 'center' }}>
                  {ac?.logoUrl && ac.logoUrl.startsWith('http')
                    ? <img src={ac.logoUrl} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                    : <span style={{ fontSize: 28 }}>{ac?.logoUrl || 'A'}</span>}
                  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>{ac?.shortName}</div>
                </div>
              </>;
            })()}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Tanggal & Waktu Kickoff <span className="required">*</span></label>
            <input type="datetime-local" className="form-input" value={kickoff} onChange={e => setKickoff(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value as Match['status'])}>
              <option value="Scheduled">Dijadwalkan</option>
              <option value="Live">Live</option>
              <option value="Finished">Selesai</option>
              <option value="Postponed">Ditunda</option>
              <option value="Cancelled">Dibatalkan</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Venue / Stadion <span style={{ fontSize: 11, color: 'var(--neutral-400)', fontWeight: 400 }}>(auto dari home club, bisa diubah)</span></label>
          <input type="text" className="form-input" placeholder="Nama stadion..." value={venue} onChange={e => setVenue(e.target.value)} />
        </div>
      </div>
    </div>
  );
}

"@

$newLines = $newBlock -split "`n" | ForEach-Object { $_ -replace "`r", "" }
$newLines = $before + $newLines + $after
[System.IO.File]::WriteAllLines($f, $newLines, [System.Text.UTF8Encoding]::new($false))
Write-Host "Schedule components added. Total lines: $($newLines.Count)"
