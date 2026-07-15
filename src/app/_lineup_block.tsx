// ==========================================
// 2. LINEUP LIST VIEW
// ==========================================
interface LineupsListProps {
  matches: Match[];
  competitions: Competition[];
  uiState: string;
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  hasPermission: (module: string, action: any) => boolean;
}

function LineupsListView({ matches, competitions, onCreateNew, onEdit, onDelete, hasPermission }: LineupsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComp, setSelectedComp] = useState('Semua');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredMatches = matches.filter(match => {
    const matchName = `${match.homeClubName} vs ${match.awayClubName}`.toLowerCase();
    const matchesSearch = matchName.includes(searchTerm.toLowerCase()) || match.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesComp = selectedComp === 'Semua' || match.competition === selectedComp;
    return matchesSearch && matchesComp;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <span>Dashboard</span> <ChevronRight size={10} /> <span>Lineup Pertandingan</span>
          </div>
          <h1 className="page-title">Lineup Pertandingan</h1>
          <p className="page-description">Kelola susunan pemain, formasi, dan cadangan untuk setiap pertandingan.</p>
        </div>
        {hasPermission('Lineup', 'create_edit') && (
          <button className="btn btn-md btn-primary" onClick={onCreateNew}>
            <Plus size={16} /> Buat Lineup
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 280 }}>
          <div className="search-input-wrapper" style={{ maxWidth: 280 }}>
            <Search size={16} className="search-icon" />
            <input type="text" placeholder="Cari klub atau stadion..." className="form-input"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="form-select" style={{ maxWidth: 220 }} value={selectedComp} onChange={(e) => setSelectedComp(e.target.value)}>
            <option value="Semua">Semua Kompetisi</option>
            {competitions.filter(c => c.isActive).map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        {(searchTerm || selectedComp !== 'Semua') && (
          <button className="btn btn-sm btn-secondary" onClick={() => { setSearchTerm(''); setSelectedComp('Semua'); }}>
            Reset Filter
          </button>
        )}
      </div>

      {/* Table */}
      {filteredMatches.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <AlertCircle size={32} color="var(--neutral-500)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Belum ada lineup</h3>
          <p className="text-muted" style={{ marginBottom: 16 }}>Buat lineup baru atau ubah filter.</p>
          {hasPermission('Lineup', 'create_edit') && (
            <button className="btn btn-sm btn-primary" onClick={onCreateNew}>Buat Lineup</button>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pertandingan</th>
                <th>Kompetisi</th>
                <th>Kickoff</th>
                <th>Status</th>
                <th>Publikasi</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredMatches.map(match => (
                <tr key={match.id}>
                  <td>
                    <div className="flex align-center gap-10">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {match.homeLogo && match.homeLogo.startsWith('http')
                          ? <img src={match.homeLogo} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                          : <span style={{ fontSize: 20 }}>{match.homeLogo}</span>}
                        <span className="semibold" style={{ fontSize: 13 }}>{match.homeClubName}</span>
                      </div>
                      <span className="text-muted" style={{ fontSize: 11 }}>vs</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {match.awayLogo && match.awayLogo.startsWith('http')
                          ? <img src={match.awayLogo} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                          : <span style={{ fontSize: 20 }}>{match.awayLogo}</span>}
                        <span className="semibold" style={{ fontSize: 13 }}>{match.awayClubName}</span>
                      </div>
                    </div>
                    <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>{match.venue}</div>
                  </td>
                  <td style={{ fontSize: 12 }}>{match.competition}</td>
                  <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {new Date(match.kickoff).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} WIB
                  </td>
                  <td>
                    <span className={`badge ${match.lineupStatus === 'Complete' ? 'badge-success' : match.lineupStatus === 'Needs Review' ? 'badge-warning' : 'badge-draft'}`}>
                      {match.lineupStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${match.publicationStatus === 'Published' ? 'badge-success' : 'badge-warning'}`}>
                      {match.publicationStatus}
                    </span>
                  </td>
                  <td className="text-right">
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button className="btn btn-sm btn-primary" onClick={() => onEdit(match.id)}>
                        <Edit size={13} /> Edit
                      </button>
                      {hasPermission('Lineup', 'delete') && (
                        confirmDeleteId === match.id ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 11, color: 'var(--danger-600)', fontWeight: 600 }}>Yakin?</span>
                            <button className="btn btn-sm btn-danger" onClick={() => { onDelete(match.id); setConfirmDeleteId(null); }}>Ya</button>
                            <button className="btn btn-sm btn-secondary" onClick={() => setConfirmDeleteId(null)}>Batal</button>
                          </span>
                        ) : (
                          <button className="btn btn-sm btn-secondary" style={{ color: 'var(--danger-600)' }} onClick={() => setConfirmDeleteId(match.id)}>
                            <Trash2 size={13} />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. LINEUP EDITOR VIEW
// ==========================================
interface LineupEditorProps {
  matchId: string;
  clubs: Club[];
  players: Player[];
  matches: Match[];
  competitions: Competition[];
  onClose: () => void;
  onSave: (match: Match) => void;
  triggerToast: (msg: string, type?: any) => void;
  logAction: (action: string, module: string, details: string) => void;
}

// Tipe pemain asing non-DSP (input manual)
interface AsingEntry { id: string; name: string; no: number; pos: string; }

function LineupEditorView({ matchId, clubs, players, matches, competitions, onClose, onSave, triggerToast }: LineupEditorProps) {
  const isNew = matchId === 'new';
  const existingMatch = matches.find(m => m.id === matchId);

  // ── INFO PERTANDINGAN ──────────────────────────────────────
  const firstComp = competitions.find(c => c.isActive) || competitions[0];
  const [selectedCompetitionName, setSelectedCompetitionName] = useState(
    existingMatch?.competition || firstComp?.name || ''
  );
  const [selectedHomeClub, setSelectedHomeClub] = useState(existingMatch?.homeClubId || clubs[0]?.id || '');
  const [selectedAwayClub, setSelectedAwayClub] = useState(existingMatch?.awayClubId || clubs[1]?.id || '');
  const [kickoffTime, setKickoffTime] = useState(existingMatch?.kickoff || new Date().toISOString());
  const [venueName, setVenueName] = useState(existingMatch?.venue || '');
  const [homeFormation, setHomeFormation] = useState('4-3-3');
  const [awayFormation, setAwayFormation] = useState('4-2-3-1');

  const FORMATIONS = ['4-3-3','4-2-3-1','3-5-2','4-4-2','5-3-2','3-4-3','4-1-4-1'];

  // Auto-fill venue dari home club saat pertama buat atau ganti home club
  useEffect(() => {
    if (!existingMatch || !venueName) {
      const hc = clubs.find(c => c.id === selectedHomeClub);
      if (hc?.stadium) setVenueName(hc.stadium);
    }
  }, [selectedHomeClub]);

  // ── SQUAD DATA ─────────────────────────────────────────────
  const homeSquadAll = players.filter(p => p.clubId === selectedHomeClub);
  const awaySquadAll = players.filter(p => p.clubId === selectedAwayClub);

  // Starting XI — array id pemain (maks 11)
  const [homeStarters, setHomeStarters] = useState<string[]>([]);
  const [awayStarters, setAwayStarters] = useState<string[]>([]);
  // Cadangan — array id pemain (maks 7)
  const [homeSubs, setHomeSubs] = useState<string[]>([]);
  const [awaySubs, setAwaySubs] = useState<string[]>([]);
  // Kapten
  const [homeCaptain, setHomeCaptain] = useState<string>('');
  const [awayCaptain, setAwayCaptain] = useState<string>('');

  // Asing non-DSP (input manual)
  const [homeAsing, setHomeAsing] = useState<AsingEntry[]>([]);
  const [awayAsing, setAwayAsing] = useState<AsingEntry[]>([]);
  const [homeAsingInput, setHomeAsingInput] = useState({ name: '', no: '', pos: 'FW' });
  const [awayAsingInput, setAwayAsingInput] = useState({ name: '', no: '', pos: 'FW' });

  // Tab aktif: 'home' | 'away' | 'preview'
  const [activeTab, setActiveTab] = useState<'home' | 'away' | 'preview'>('home');

  // ── HELPER TOGGLE ──────────────────────────────────────────
  const togglePlayer = (
    id: string,
    starters: string[], setStarters: React.Dispatch<React.SetStateAction<string[]>>,
    subs: string[], setSubs: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (starters.includes(id)) {
      // starter → cadangan
      setStarters(p => p.filter(x => x !== id));
      if (subs.length < 7) setSubs(p => [...p, id]);
    } else if (subs.includes(id)) {
      // cadangan → tidak dipilih
      setSubs(p => p.filter(x => x !== id));
    } else {
      // tidak dipilih → starter (jika < 11) atau cadangan
      if (starters.length < 11) setStarters(p => [...p, id]);
      else if (subs.length < 7) setSubs(p => [...p, id]);
      else triggerToast('Slot starter (11) dan cadangan (7) sudah penuh.', 'warning');
    }
  };

  const getPlayerStatus = (id: string, starters: string[], subs: string[]) => {
    if (starters.includes(id)) return 'starter';
    if (subs.includes(id)) return 'sub';
    return 'none';
  };

  const addAsing = (side: 'home' | 'away') => {
    const inp = side === 'home' ? homeAsingInput : awayAsingInput;
    if (!inp.name.trim()) { triggerToast('Nama pemain wajib diisi.', 'error'); return; }
    const entry: AsingEntry = { id: `asing-${Date.now()}`, name: inp.name.trim(), no: Number(inp.no) || 0, pos: inp.pos };
    if (side === 'home') { setHomeAsing(p => [...p, entry]); setHomeAsingInput({ name: '', no: '', pos: 'FW' }); }
    else { setAwayAsing(p => [...p, entry]); setAwayAsingInput({ name: '', no: '', pos: 'FW' }); }
  };

  // ── VALIDASI ───────────────────────────────────────────────
  const homeValid = homeStarters.length === 11;
  const awayValid = awayStarters.length === 11;
  const homeHasGK = homeSquadAll.some(p => homeStarters.includes(p.id) && p.position === 'Goalkeeper');
  const awayHasGK = awaySquadAll.some(p => awayStarters.includes(p.id) && p.position === 'Goalkeeper');

  // ── SAVE ───────────────────────────────────────────────────
  const handleSave = (publish = false) => {
    const homeClub = clubs.find(c => c.id === selectedHomeClub);
    const awayClub = clubs.find(c => c.id === selectedAwayClub);
    const status: Match['lineupStatus'] = homeValid && awayValid && homeHasGK && awayHasGK ? 'Complete' : 'Needs Review';
    const updatedMatch: Match = {
      id: existingMatch?.id || `match-${Date.now()}`,
      homeClubId: selectedHomeClub,
      homeClubName: homeClub?.name || '',
      homeLogo: homeClub?.logoUrl || '',
      awayClubId: selectedAwayClub,
      awayClubName: awayClub?.name || '',
      awayLogo: awayClub?.logoUrl || '',
      competition: selectedCompetitionName,
      season: competitions.find(c => c.name === selectedCompetitionName)?.season || '',
      kickoff: kickoffTime,
      venue: venueName,
      status: existingMatch?.status || 'Scheduled',
      lineupStatus: status,
      publicationStatus: publish ? 'Published' : (existingMatch?.publicationStatus || 'Draft'),
      editor: 'Admin',
      lastUpdated: 'Baru saja',
    };
    onSave(updatedMatch);
  };

  const homeClub = clubs.find(c => c.id === selectedHomeClub);
  const awayClub = clubs.find(c => c.id === selectedAwayClub);

  // ── RENDER PLAYER PILL ─────────────────────────────────────
  const renderPlayerPill = (
    player: Player,
    starters: string[], setStarters: React.Dispatch<React.SetStateAction<string[]>>,
    subs: string[], setSubs: React.Dispatch<React.SetStateAction<string[]>>,
    captain: string, setCaptain: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const status = getPlayerStatus(player.id, starters, subs);
    const isUnavailable = player.availability !== 'available';
    const bgColor = status === 'starter' ? 'var(--primary-600)' : status === 'sub' ? 'var(--neutral-300)' : 'var(--neutral-100)';
    const textColor = status !== 'none' ? 'white' : 'var(--neutral-700)';
    return (
      <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <button
          onClick={() => togglePlayer(player.id, starters, setStarters, subs, setSubs)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
            backgroundColor: bgColor, color: textColor,
            fontSize: 12, fontWeight: status !== 'none' ? 700 : 400,
            transition: 'all 0.15s', opacity: isUnavailable ? 0.6 : 1,
            textAlign: 'left'
          }}
          title={isUnavailable ? `${player.availability}` : ''}
        >
          <span style={{ fontSize: 11, minWidth: 22, opacity: 0.8 }}>#{player.shirtNumber}</span>
          <span style={{ flex: 1 }}>{player.displayName}</span>
          <span style={{ fontSize: 9, opacity: 0.7 }}>
            {player.position === 'Goalkeeper' ? 'GK' : player.position === 'Defender' ? 'DF' : player.position === 'Midfielder' ? 'MF' : 'FW'}
          </span>
          {isUnavailable && <span style={{ fontSize: 9, backgroundColor: 'rgba(239,68,68,0.3)', padding: '1px 4px', borderRadius: 4 }}>
            {player.availability === 'injured' ? '🤕' : '🚫'}
          </span>}
          {player.nationality !== 'Indonesia' && <span style={{ fontSize: 9 }}>🌍</span>}
        </button>
        {status === 'starter' && (
          <button
            onClick={() => setCaptain(captain === player.id ? '' : player.id)}
            title="Set Kapten"
            style={{ padding: '4px 7px', borderRadius: 12, border: '1px solid', cursor: 'pointer', fontSize: 11, fontWeight: 700,
              backgroundColor: captain === player.id ? '#eab308' : 'transparent',
              color: captain === player.id ? '#000' : 'var(--neutral-500)',
              borderColor: captain === player.id ? '#eab308' : 'var(--neutral-300)' }}
          >C</button>
        )}
      </div>
    );
  };

  // ── JSX ────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--neutral-200)', paddingBottom: 14 }}>
        <div className="flex align-center gap-12">
          <button className="btn btn-sm btn-secondary" onClick={onClose}><ArrowLeft size={16} /> Kembali</button>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>
              {isNew ? 'Buat Lineup Baru' : `${existingMatch?.homeClubName} vs ${existingMatch?.awayClubName}`}
            </h2>
            <div style={{ fontSize: 11, color: 'var(--neutral-500)', marginTop: 2, display: 'flex', gap: 12 }}>
              <span>{homeValid ? '✅' : `⚠️ Home ${homeStarters.length}/11`}</span>
              <span>{awayValid ? '✅' : `⚠️ Away ${awayStarters.length}/11`}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-10">
          <button className="btn btn-md btn-secondary" onClick={() => handleSave(false)}>Simpan Draft</button>
          <button className="btn btn-md btn-primary" onClick={() => handleSave(true)}>
            <Upload size={14} /> Terbitkan
          </button>
        </div>
      </div>

      {/* ── INFO BAR (selalu tampil) ── */}
      <div className="card" style={{ padding: '14px 20px' }}>
        <div className="grid-12" style={{ gap: 12 }}>
          <div style={{ gridColumn: 'span 3' }}>
            <label className="form-label" style={{ fontSize: 11 }}>Kompetisi</label>
            <select className="form-select" value={selectedCompetitionName} onChange={e => setSelectedCompetitionName(e.target.value)}>
              {competitions.filter(c => c.isActive).map(c => (
                <option key={c.id} value={c.name}>{c.name} ({c.season})</option>
              ))}
              {competitions.filter(c => !c.isActive).length > 0 && (
                <optgroup label="── Nonaktif ──">
                  {competitions.filter(c => !c.isActive).map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          <div style={{ gridColumn: 'span 3' }}>
            <label className="form-label" style={{ fontSize: 11 }}>Tim Home</label>
            <select className="form-select" value={selectedHomeClub}
              onChange={e => { setSelectedHomeClub(e.target.value); setHomeStarters([]); setHomeSubs([]); setHomeCaptain(''); }}>
              {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: 'span 3' }}>
            <label className="form-label" style={{ fontSize: 11 }}>Tim Away</label>
            <select className="form-select" value={selectedAwayClub}
              onChange={e => { setSelectedAwayClub(e.target.value); setAwayStarters([]); setAwaySubs([]); setAwayCaptain(''); }}>
              {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: 'span 3' }}>
            <label className="form-label" style={{ fontSize: 11 }}>Kickoff</label>
            <input type="datetime-local" className="form-input" style={{ fontSize: 12 }}
              value={kickoffTime.slice(0, 16)} onChange={e => setKickoffTime(new Date(e.target.value).toISOString())} />
          </div>
          <div style={{ gridColumn: 'span 8' }}>
            <label className="form-label" style={{ fontSize: 11 }}>
              Venue / Stadion
              <span style={{ fontSize: 10, color: 'var(--neutral-400)', fontWeight: 400, marginLeft: 6 }}>(auto dari home club, bisa diubah)</span>
            </label>
            <input type="text" className="form-input" placeholder="Nama stadion..." value={venueName} onChange={e => setVenueName(e.target.value)} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="form-label" style={{ fontSize: 11 }}>Formasi Home</label>
            <select className="form-select" value={homeFormation} onChange={e => setHomeFormation(e.target.value)}>
              {FORMATIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="form-label" style={{ fontSize: 11 }}>Formasi Away</label>
            <select className="form-select" value={awayFormation} onChange={e => setAwayFormation(e.target.value)}>
              {FORMATIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-container">
        <div className={`tab-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          {homeClub?.logoUrl && !homeClub.logoUrl.startsWith('http') ? homeClub.logoUrl : '🏠'} Home — {homeClub?.shortName}
          <span style={{ marginLeft: 6, fontSize: 10, color: homeValid ? 'var(--success-600)' : 'var(--warning-600)', fontWeight: 700 }}>
            {homeStarters.length}/11
          </span>
        </div>
        <div className={`tab-item ${activeTab === 'away' ? 'active' : ''}`} onClick={() => setActiveTab('away')}>
          {awayClub?.logoUrl && !awayClub.logoUrl.startsWith('http') ? awayClub.logoUrl : '✈️'} Away — {awayClub?.shortName}
          <span style={{ marginLeft: 6, fontSize: 10, color: awayValid ? 'var(--success-600)' : 'var(--warning-600)', fontWeight: 700 }}>
            {awayStarters.length}/11
          </span>
        </div>
        <div className={`tab-item ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>
          📸 Preview & Unduh Story
        </div>
      </div>

      {/* ── TAB: HOME ── */}
      {activeTab === 'home' && (
        <div className="grid-12" style={{ gap: 16 }}>
          {/* Kolom 1: DSP / Squad */}
          <div className="card" style={{ gridColumn: 'span 4', padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--neutral-700)' }}>
              📋 Skuad Terdaftar ({homeSquadAll.length})
              <div style={{ fontSize: 10, color: 'var(--neutral-500)', fontWeight: 400, marginTop: 2 }}>
                Klik 1x → Starter &nbsp;·&nbsp; Klik 2x → Cadangan &nbsp;·&nbsp; Klik 3x → Hapus
              </div>
            </div>
            {['Goalkeeper','Defender','Midfielder','Forward'].map(pos => {
              const posPlayers = homeSquadAll.filter(p => p.position === pos);
              if (!posPlayers.length) return null;
              return (
                <div key={pos} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', marginBottom: 4, borderBottom: '1px solid var(--neutral-100)', paddingBottom: 2 }}>
                    {pos === 'Goalkeeper' ? 'GK' : pos === 'Defender' ? 'DF' : pos === 'Midfielder' ? 'MF' : 'FW'}
                  </div>
                  {posPlayers.map(p => renderPlayerPill(p, homeStarters, setHomeStarters, homeSubs, setHomeSubs, homeCaptain, setHomeCaptain))}
                </div>
              );
            })}
          </div>

          {/* Kolom 2: Starting XI */}
          <div className="card" style={{ gridColumn: 'span 4', padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>⚽ Starting XI</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: homeValid ? 'var(--success-600)' : 'var(--warning-600)',
                backgroundColor: homeValid ? 'var(--success-50,#f0fdf4)' : '#fef9c3', padding: '2px 8px', borderRadius: 10 }}>
                {homeStarters.length}/11 {homeHasGK ? '' : '⚠️ GK?'}
              </span>
            </div>
            {homeStarters.length === 0
              ? <div style={{ textAlign: 'center', color: 'var(--neutral-400)', fontSize: 12, padding: '20px 0' }}>Pilih pemain dari daftar skuad</div>
              : homeSquadAll.filter(p => homeStarters.includes(p.id))
                  .sort((a, b) => {
                    const order = ['Goalkeeper','Defender','Midfielder','Forward'];
                    return order.indexOf(a.position) - order.indexOf(b.position);
                  })
                  .map(p => renderPlayerPill(p, homeStarters, setHomeStarters, homeSubs, setHomeSubs, homeCaptain, setHomeCaptain))
            }
            {homeAsing.filter((_, i) => i < 3).map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 20, backgroundColor: 'var(--primary-600)', color: 'white', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                <span style={{ fontSize: 11, opacity: 0.8, minWidth: 22 }}>#{a.no}</span>
                <span style={{ flex: 1 }}>{a.name}</span>
                <span style={{ fontSize: 9 }}>{a.pos} 🌍</span>
                <button onClick={() => setHomeAsing(p => p.filter(x => x.id !== a.id))} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 12 }}>×</button>
              </div>
            ))}
          </div>

          {/* Kolom 3: Cadangan + Asing Non-DSP */}
          <div className="card" style={{ gridColumn: 'span 4', padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🔄 Cadangan</span>
              <span style={{ fontSize: 11, color: 'var(--neutral-500)' }}>{homeSubs.length}/7</span>
            </div>
            {homeSubs.length === 0
              ? <div style={{ textAlign: 'center', color: 'var(--neutral-400)', fontSize: 12, padding: '12px 0' }}>Belum ada cadangan</div>
              : homeSquadAll.filter(p => homeSubs.includes(p.id))
                  .map(p => renderPlayerPill(p, homeStarters, setHomeStarters, homeSubs, setHomeSubs, homeCaptain, setHomeCaptain))
            }
            {homeAsing.filter((_, i) => i >= 3).map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 20, backgroundColor: 'var(--neutral-300)', color: 'var(--neutral-900)', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                <span style={{ fontSize: 11, opacity: 0.8, minWidth: 22 }}>#{a.no}</span>
                <span style={{ flex: 1 }}>{a.name}</span>
                <span style={{ fontSize: 9 }}>{a.pos} 🌍</span>
                <button onClick={() => setHomeAsing(p => p.filter(x => x.id !== a.id))} style={{ background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer', fontSize: 12 }}>×</button>
              </div>
            ))}

            {/* Input asing non-DSP */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--neutral-200)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-600)', marginBottom: 8 }}>➕ Tambah Asing Non-DSP</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input type="text" className="form-input" placeholder="Nama pemain" style={{ flex: 2, fontSize: 11 }}
                  value={homeAsingInput.name} onChange={e => setHomeAsingInput(p => ({ ...p, name: e.target.value }))} />
                <input type="number" className="form-input" placeholder="No" style={{ width: 50, fontSize: 11 }}
                  value={homeAsingInput.no} onChange={e => setHomeAsingInput(p => ({ ...p, no: e.target.value }))} />
                <select className="form-select" style={{ fontSize: 11, width: 60 }}
                  value={homeAsingInput.pos} onChange={e => setHomeAsingInput(p => ({ ...p, pos: e.target.value }))}>
                  <option value="GK">GK</option><option value="DF">DF</option>
                  <option value="MF">MF</option><option value="FW">FW</option>
                </select>
              </div>
              <button className="btn btn-sm btn-secondary w-full" style={{ fontSize: 11 }} onClick={() => addAsing('home')}>Tambah</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: AWAY ── */}
      {activeTab === 'away' && (
        <div className="grid-12" style={{ gap: 16 }}>
          <div className="card" style={{ gridColumn: 'span 4', padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--neutral-700)' }}>
              📋 Skuad Terdaftar ({awaySquadAll.length})
              <div style={{ fontSize: 10, color: 'var(--neutral-500)', fontWeight: 400, marginTop: 2 }}>Klik 1x → Starter · Klik 2x → Cadangan · Klik 3x → Hapus</div>
            </div>
            {['Goalkeeper','Defender','Midfielder','Forward'].map(pos => {
              const posPlayers = awaySquadAll.filter(p => p.position === pos);
              if (!posPlayers.length) return null;
              return (
                <div key={pos} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--neutral-500)', textTransform: 'uppercase', marginBottom: 4, borderBottom: '1px solid var(--neutral-100)', paddingBottom: 2 }}>
                    {pos === 'Goalkeeper' ? 'GK' : pos === 'Defender' ? 'DF' : pos === 'Midfielder' ? 'MF' : 'FW'}
                  </div>
                  {posPlayers.map(p => renderPlayerPill(p, awayStarters, setAwayStarters, awaySubs, setAwaySubs, awayCaptain, setAwayCaptain))}
                </div>
              );
            })}
          </div>

          <div className="card" style={{ gridColumn: 'span 4', padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>⚽ Starting XI</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: awayValid ? 'var(--success-600)' : 'var(--warning-600)',
                backgroundColor: awayValid ? 'var(--success-50,#f0fdf4)' : '#fef9c3', padding: '2px 8px', borderRadius: 10 }}>
                {awayStarters.length}/11 {awayHasGK ? '' : '⚠️ GK?'}
              </span>
            </div>
            {awayStarters.length === 0
              ? <div style={{ textAlign: 'center', color: 'var(--neutral-400)', fontSize: 12, padding: '20px 0' }}>Pilih pemain dari daftar skuad</div>
              : awaySquadAll.filter(p => awayStarters.includes(p.id))
                  .sort((a, b) => { const order = ['Goalkeeper','Defender','Midfielder','Forward']; return order.indexOf(a.position) - order.indexOf(b.position); })
                  .map(p => renderPlayerPill(p, awayStarters, setAwayStarters, awaySubs, setAwaySubs, awayCaptain, setAwayCaptain))
            }
            {awayAsing.filter((_, i) => i < 3).map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 20, backgroundColor: 'var(--primary-600)', color: 'white', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                <span style={{ fontSize: 11, opacity: 0.8, minWidth: 22 }}>#{a.no}</span>
                <span style={{ flex: 1 }}>{a.name}</span>
                <span style={{ fontSize: 9 }}>{a.pos} 🌍</span>
                <button onClick={() => setAwayAsing(p => p.filter(x => x.id !== a.id))} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 12 }}>×</button>
              </div>
            ))}
          </div>

          <div className="card" style={{ gridColumn: 'span 4', padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🔄 Cadangan</span>
              <span style={{ fontSize: 11, color: 'var(--neutral-500)' }}>{awaySubs.length}/7</span>
            </div>
            {awaySubs.length === 0
              ? <div style={{ textAlign: 'center', color: 'var(--neutral-400)', fontSize: 12, padding: '12px 0' }}>Belum ada cadangan</div>
              : awaySquadAll.filter(p => awaySubs.includes(p.id))
                  .map(p => renderPlayerPill(p, awayStarters, setAwayStarters, awaySubs, setAwaySubs, awayCaptain, setAwayCaptain))
            }
            {awayAsing.filter((_, i) => i >= 3).map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 20, backgroundColor: 'var(--neutral-300)', color: 'var(--neutral-900)', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                <span style={{ fontSize: 11, opacity: 0.8, minWidth: 22 }}>#{a.no}</span>
                <span style={{ flex: 1 }}>{a.name}</span>
                <span style={{ fontSize: 9 }}>{a.pos} 🌍</span>
                <button onClick={() => setAwayAsing(p => p.filter(x => x.id !== a.id))} style={{ background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer', fontSize: 12 }}>×</button>
              </div>
            ))}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--neutral-200)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--neutral-600)', marginBottom: 8 }}>➕ Tambah Asing Non-DSP</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input type="text" className="form-input" placeholder="Nama pemain" style={{ flex: 2, fontSize: 11 }}
                  value={awayAsingInput.name} onChange={e => setAwayAsingInput(p => ({ ...p, name: e.target.value }))} />
                <input type="number" className="form-input" placeholder="No" style={{ width: 50, fontSize: 11 }}
                  value={awayAsingInput.no} onChange={e => setAwayAsingInput(p => ({ ...p, no: e.target.value }))} />
                <select className="form-select" style={{ fontSize: 11, width: 60 }}
                  value={awayAsingInput.pos} onChange={e => setAwayAsingInput(p => ({ ...p, pos: e.target.value }))}>
                  <option value="GK">GK</option><option value="DF">DF</option>
                  <option value="MF">MF</option><option value="FW">FW</option>
                </select>
              </div>
              <button className="btn btn-sm btn-secondary w-full" style={{ fontSize: 11 }} onClick={() => addAsing('away')}>Tambah</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: PREVIEW ── */}
      {activeTab === 'preview' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <button className="btn btn-md btn-primary" onClick={async () => {
            const node = document.getElementById('lineup-story-card');
            if (!node) return;
            try {
              triggerToast('Sedang membuat gambar Story...');
              const dataUrl = await htmlToImage.toPng(node, { cacheBust: true, pixelRatio: 3 });
              const link = document.createElement('a');
              link.download = `Lineup_${homeClub?.shortName}_vs_${awayClub?.shortName}_Story.png`;
              link.href = dataUrl; link.click();
              triggerToast('Gambar Story berhasil diunduh!');
            } catch (err) { triggerToast('Gagal mengunduh gambar.', 'error'); }
          }}>
            <Upload size={14} /> Unduh Story (9:16)
          </button>

          {/* Story Card 9:16 */}
          <div id="lineup-story-card" style={{
            width: 360, height: 640,
            background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
            color: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between', padding: '28px 22px',
            boxShadow: 'var(--shadow-lg)', position: 'relative', fontFamily: 'system-ui, sans-serif'
          }}>
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', right: '-10%', height: '40%',
              background: 'radial-gradient(circle, rgba(15,159,154,0.18) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

            {/* Header */}
            <div style={{ zIndex: 2, textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#0F9F9A', letterSpacing: 2, textTransform: 'uppercase' }}>
                {selectedCompetitionName}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, marginTop: 3, color: '#94a3b8' }}>STARTING XI</div>
              <div style={{ width: 36, height: 2, backgroundColor: '#0F9F9A', margin: '6px auto 0' }} />
            </div>

            {/* VS Header */}
            <div style={{ zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                {homeClub?.logoUrl && homeClub.logoUrl.startsWith('http')
                  ? <img src={homeClub.logoUrl} crossOrigin="anonymous" style={{ width: 44, height: 44, objectFit: 'contain', margin: '0 auto', display: 'block' }} alt="" />
                  : <div style={{ fontSize: 36, textAlign: 'center' }}>{homeClub?.logoUrl || '🏠'}</div>}
                <div style={{ fontSize: 10, fontWeight: 800, marginTop: 4, textTransform: 'uppercase', color: 'white' }}>
                  {homeClub?.shortName?.split(' ')[0]}
                </div>
                <div style={{ fontSize: 8, color: '#0F9F9A', marginTop: 1 }}>({homeFormation})</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#475569' }}>VS</div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                {awayClub?.logoUrl && awayClub.logoUrl.startsWith('http')
                  ? <img src={awayClub.logoUrl} crossOrigin="anonymous" style={{ width: 44, height: 44, objectFit: 'contain', margin: '0 auto', display: 'block' }} alt="" />
                  : <div style={{ fontSize: 36, textAlign: 'center' }}>{awayClub?.logoUrl || '✈️'}</div>}
                <div style={{ fontSize: 10, fontWeight: 800, marginTop: 4, textTransform: 'uppercase', color: 'white' }}>
                  {awayClub?.shortName?.split(' ')[0]}
                </div>
                <div style={{ fontSize: 8, color: '#0F9F9A', marginTop: 1 }}>({awayFormation})</div>
              </div>
            </div>

            {/* Players */}
            <div style={{ zIndex: 2, display: 'flex', gap: 12, flex: 1, margin: '8px 0',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 12px',
              backgroundColor: 'rgba(255,255,255,0.02)' }}>
              {/* Home starters */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: '#0F9F9A', marginBottom: 5, borderBottom: '1px solid rgba(15,159,154,0.3)', paddingBottom: 2 }}>
                  {homeClub?.code || 'HOME'}
                </div>
                {[...homeSquadAll.filter(p => homeStarters.includes(p.id))
                    .sort((a, b) => { const o = ['Goalkeeper','Defender','Midfielder','Forward']; return o.indexOf(a.position) - o.indexOf(b.position); }),
                  ...homeAsing.filter((_, i) => i < 3)].map((p: any) => (
                  <div key={p.id} style={{ display: 'flex', gap: 4, fontSize: 9, marginBottom: 3 }}>
                    <span style={{ color: '#0F9F9A', fontWeight: 700, minWidth: 18 }}>
                      {p.shirtNumber !== undefined ? `#${p.shirtNumber}` : `#${p.no}`}
                    </span>
                    <span style={{ color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>
                      {p.displayName || p.name}
                      {(p.id === homeCaptain) && <span style={{ color: '#eab308', fontWeight: 'bold' }}> (C)</span>}
                    </span>
                  </div>
                ))}
                {homeStarters.length === 0 && homeAsing.length === 0 && (
                  <div style={{ fontSize: 8, color: '#64748b', marginTop: 8 }}>Belum ada starter</div>
                )}
              </div>
              {/* Away starters */}
              <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: 10 }}>
                <div style={{ fontSize: 8, fontWeight: 800, color: '#0F9F9A', marginBottom: 5, borderBottom: '1px solid rgba(15,159,154,0.3)', paddingBottom: 2 }}>
                  {awayClub?.code || 'AWAY'}
                </div>
                {[...awaySquadAll.filter(p => awayStarters.includes(p.id))
                    .sort((a, b) => { const o = ['Goalkeeper','Defender','Midfielder','Forward']; return o.indexOf(a.position) - o.indexOf(b.position); }),
                  ...awayAsing.filter((_, i) => i < 3)].map((p: any) => (
                  <div key={p.id} style={{ display: 'flex', gap: 4, fontSize: 9, marginBottom: 3 }}>
                    <span style={{ color: '#0F9F9A', fontWeight: 700, minWidth: 18 }}>
                      {p.shirtNumber !== undefined ? `#${p.shirtNumber}` : `#${p.no}`}
                    </span>
                    <span style={{ color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>
                      {p.displayName || p.name}
                      {(p.id === awayCaptain) && <span style={{ color: '#eab308', fontWeight: 'bold' }}> (C)</span>}
                    </span>
                  </div>
                ))}
                {awayStarters.length === 0 && awayAsing.length === 0 && (
                  <div style={{ fontSize: 8, color: '#64748b', marginTop: 8 }}>Belum ada starter</div>
                )}
              </div>
            </div>

            {/* Kickoff info */}
            <div style={{ zIndex: 2, textAlign: 'center', fontSize: 9, color: '#64748b', margin: '4px 0' }}>
              {new Date(kickoffTime).toLocaleString('id-ID', { weekday: 'long', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} WIB · {venueName}
            </div>

            {/* Footer */}
            <div style={{ zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8, fontSize: 8, color: '#64748b', fontWeight: 600 }}>
              <span>@GARUDAMATCHROOM</span>
              <span style={{ color: '#0F9F9A' }}>MEDIA STUDIO</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
