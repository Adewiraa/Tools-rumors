$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# Replace baris 1524-1586 (0-based: 1523-1585)
$before = $lines[0..1523]
$after  = $lines[1586..($lines.Count - 1)]

$mid = @(
'',
'  // Regulasi:',
'  // - Starting XI: 11 pemain, maks 7 asing (selebihnya otomatis ke cadangan/non-DSP)',
'  // - Cadangan DSP: maks 4, TIDAK ADA batas asing di cadangan',
'  // - Non-DSP: input manual, maks 2',
'  const MAX_SUBS   = 4;',
'  const MAX_ASING_ST = 7;  // maks asing di starting XI',
'  const MAX_NONDSP = 2;',
'',
'  const homeValid = homeStarters.length === 11;',
'  const awayValid = awayStarters.length === 11;',
'  const homeHasGK = homeSquad.some(p => homeStarters.includes(p.id) && p.position === ''Goalkeeper'');',
'  const awayHasGK = awaySquad.some(p => awayStarters.includes(p.id) && p.position === ''Goalkeeper'');',
'  const posLabel: Record<string, string> = { Goalkeeper: ''GK'', Defender: ''DF'', Midfielder: ''MF'', Forward: ''FW'' };',
'',
'  // Klik dari pool -> masuk slot yang tepat secara otomatis',
'  const pickPlayer = (',
'    id: string,',
'    squad: Player[],',
'    starters: string[], setStarters: React.Dispatch<React.SetStateAction<string[]>>,',
'    subs:     string[], setSubs:     React.Dispatch<React.SetStateAction<string[]>>,',
'    asingList: AsingEntry[], setAsing: React.Dispatch<React.SetStateAction<AsingEntry[]>>',
'  ) => {',
'    const player = squad.find(p => p.id === id);',
'    if (!player) return;',
'    const isForeign = player.nationality !== ''Indonesia'';',
'    // Hitung berapa asing sudah di starting (DSP + non-DSP)',
'    const fSt = squad.filter(p => starters.includes(p.id) && p.nationality !== ''Indonesia'').length + asingList.length;',
'',
'    if (starters.length < 11) {',
'      // Masih ada slot di starting XI',
'      if (isForeign && fSt >= MAX_ASING_ST) {',
'        // Kuota asing di starting sudah penuh (7) -> langsung cadangan',
'        if (subs.length < MAX_SUBS) {',
'          setSubs(p => [...p, id]);',
'          triggerToast(player.displayName + '' masuk cadangan (kuota asing starting penuh)'', ''warning'');',
'        } else if (asingList.length < MAX_NONDSP) {',
'          const entry: AsingEntry = { id: ''nd-'' + id, name: player.displayName, no: player.shirtNumber, pos: posLabel[player.position] || ''MF'' };',
'          setAsing(prev => [...prev, entry]);',
'          triggerToast(player.displayName + '' masuk Non-DSP (starting & cadangan penuh)'', ''warning'');',
'        } else {',
'          triggerToast(''Kuota asing penuh di semua slot.'', ''warning'');',
'        }',
'        return;',
'      }',
'      // Asing masih bisa masuk starting, atau pemain lokal',
'      setStarters(p => [...p, id]);',
'    } else if (subs.length < MAX_SUBS) {',
'      // Starting sudah 11 -> masuk cadangan (tidak ada batas asing di cadangan)',
'      setSubs(p => [...p, id]);',
'    } else {',
'      triggerToast(''Semua slot penuh (11 starter + '' + MAX_SUBS + '' cadangan).'', ''warning'');',
'    }',
'  };'
)

$newLines = $before + $mid + $after
[System.IO.File]::WriteAllLines($f, $newLines, [System.Text.UTF8Encoding]::new($false))
Write-Host "Patch rules OK. Total lines: $($newLines.Count)"
