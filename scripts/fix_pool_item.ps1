$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# Replace renderPoolItem (index 1709-1736, 0-based) dengan versi rapi seperti renderSelectedItem
$before = $lines[0..1708]
$after  = $lines[1736..($lines.Count - 1)]

$newBlock = @"

  // POOL ITEM: tampilan serupa dengan Selected Item agar konsisten
  const renderPoolItem = (
    player: Player,
    squad: Player[],
    starters: string[], setStarters: React.Dispatch<React.SetStateAction<string[]>>,
    subs:     string[], setSubs:     React.Dispatch<React.SetStateAction<string[]>>,
    asingList: AsingEntry[], setAsing: React.Dispatch<React.SetStateAction<AsingEntry[]>>
  ) => {
    const isForeign = player.nationality !== 'Indonesia';
    const isUnavail = player.availability !== 'available';
    // Warna background: asing = kuning muda berborder, lokal = abu sangat muda
    const bg     = isForeign ? '#fefce8' : 'var(--neutral-50)';
    const border = isForeign ? '1px solid #f59e0b' : '1px solid var(--neutral-200)';
    return (
      <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <button
          onClick={() => pickPlayer(player.id, squad, starters, setStarters, subs, setSubs, asingList, setAsing)}
          title={isUnavail ? player.availability : 'Klik untuk tambah ke lineup'}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 8, border: border,
            cursor: 'pointer', textAlign: 'left',
            background: bg, color: 'var(--neutral-800)',
            fontSize: 12, fontWeight: isForeign ? 600 : 400,
            opacity: isUnavail ? 0.55 : 1,
            transition: 'background 0.1s, opacity 0.1s',
          }}>
          {renderFlag(player)}
          <span style={{ fontSize: 10, minWidth: 20, color: 'var(--neutral-500)', fontWeight: 700, flexShrink: 0 }}>
            #{player.shirtNumber}
          </span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {player.displayName}
          </span>
          <span style={{ fontSize: 9, color: 'var(--neutral-400)', flexShrink: 0, letterSpacing: 0.3 }}>
            {posLabel[player.position] || 'MF'}
          </span>
          {isUnavail && (
            <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 800, flexShrink: 0 }}>
              {player.availability === 'injured' ? 'CED' : 'SUS'}
            </span>
          )}
        </button>
      </div>
    );
  };
"@

$newLines2 = $newBlock -split "`n" | ForEach-Object { $_ -replace "`r", "" }
$newLines = $before + $newLines2 + $after
[System.IO.File]::WriteAllLines($f, $newLines, [System.Text.UTF8Encoding]::new($false))
Write-Host "Done. Total lines: $($newLines.Count)"
