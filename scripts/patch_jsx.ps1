$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# 1. Replace renderPoolItem (baris 1658-1686, 0-based 1657-1685)
$before = $lines[0..1656]
$after  = $lines[1686..($lines.Count - 1)]

$newPoolItem = @"

  // POOL ITEM: klik = masuk slot, pakai className pool-item-btn (CSS handles sizing)
  const renderPoolItem = (
    player: Player,
    squad: Player[],
    starters: string[], setStarters: React.Dispatch<React.SetStateAction<string[]>>,
    subs:     string[], setSubs:     React.Dispatch<React.SetStateAction<string[]>>,
    asingList: AsingEntry[], setAsing: React.Dispatch<React.SetStateAction<AsingEntry[]>>
  ) => {
    const isForeign = player.nationality !== 'Indonesia';
    const isUnavail = player.availability !== 'available';
    return (
      <button key={player.id}
        className="pool-item-btn"
        onClick={() => pickPlayer(player.id, squad, starters, setStarters, subs, setSubs, asingList, setAsing)}
        style={{
          background: isForeign ? '#fffbeb' : 'white',
          border: isForeign ? '1px solid #f59e0b' : '1px solid var(--neutral-200)',
          opacity: isUnavail ? 0.6 : 1,
        }}
        title={isUnavail ? player.availability : ''}>
        {renderFlag(player)}
        <span style={{ fontSize: 10, minWidth: 18, color: 'var(--neutral-500)', fontWeight: 600, flexShrink: 0 }}>#{player.shirtNumber}</span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isForeign ? 600 : 400 }}>{player.displayName}</span>
        <span style={{ fontSize: 9, color: 'var(--neutral-400)', flexShrink: 0 }}>{posLabel[player.position] || 'MF'}</span>
        {isUnavail && <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 800, flexShrink: 0 }}>{player.availability === 'injured' ? 'CED' : 'SUS'}</span>}
      </button>
    );
  };
"@

$newPoolLines = $newPoolItem -split "`n" | ForEach-Object { $_ -replace "`r", "" }
$lines = $before + $newPoolLines + $after
Write-Host "Pass 1 renderPoolItem done. Lines: $($lines.Count)"

# 2. Add class "pool-pos-group" to pos group wrapper in renderTeamPanel
# Cari baris yang berisi '<div key={pos} style={{ marginBottom: 10 }}>'
for ($i = 1795; $i -lt 1815; $i++) {
  if ($lines[$i] -match 'key=\{pos\}.*marginBottom.*10') {
    $lines[$i] = '                <div key={pos} className="pool-pos-group" style={{ marginBottom: 10 }}>'
    Write-Host "Added pool-pos-group class at line $($i+1)"
    break
  }
}

[System.IO.File]::WriteAllLines($f, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host "All done. Lines: $($lines.Count)"
