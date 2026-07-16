$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# Replace baris 1522-1603 (0-based: 1521-1602) - konstanta + pickPlayer + returnToPool
$before = $lines[0..1521]
$after  = $lines[1603..($lines.Count - 1)]

$newBlock = @"

  // =================================================================
  // REGULASI PEMAIN ASING - LIGA INDONESIA
  // - DSP Liga      : maks 11 asing boleh didaftarkan di liga
  // - Dibawa match  : dari 11, maks 9 yang boleh dibawa per pertandingan
  // - Starting XI   : dari 9, maks 7 yang boleh main
  // - Cadangan      : sisa dari 9 dikurangi yang main di starting
  //   Contoh:
  //     5 starting asing -> 4 cadangan asing (5+4=9 dibawa)
  //     6 starting asing -> 3 cadangan asing (6+3=9 dibawa)
  //     7 starting asing -> 2 cadangan asing (7+2=9 dibawa)
  // =================================================================
  const MAX_ASING_DSP     = 11; // maks asing terdaftar di DSP liga
  const MAX_ASING_DIBAWA  =  9; // maks asing dibawa per pertandingan
  const MAX_ASING_MAIN    =  7; // maks asing di starting XI
  const MAX_SUBS          = 15; // maks total cadangan

  const homeValid = homeStarters.length === 11;
  const awayValid = awayStarters.length === 11;
  const homeHasGK = homeSquad.some(p => homeStarters.includes(p.id) && p.position === 'Goalkeeper');
  const awayHasGK = awaySquad.some(p => awayStarters.includes(p.id) && p.position === 'Goalkeeper');
  const posLabel: Record<string, string> = { Goalkeeper: 'GK', Defender: 'DF', Midfielder: 'MF', Forward: 'FW' };

  // Klik dari pool -> masuk slot yang tepat otomatis
  const pickPlayer = (
    id: string,
    squad: Player[],
    starters: string[], setStarters: React.Dispatch<React.SetStateAction<string[]>>,
    subs:     string[], setSubs:     React.Dispatch<React.SetStateAction<string[]>>,
    asingList: AsingEntry[], setAsing: React.Dispatch<React.SetStateAction<AsingEntry[]>>
  ) => {
    const player = squad.find(p => p.id === id);
    if (!player) return;
    const isForeign = player.nationality !== 'Indonesia';

    if (isForeign) {
      const fSt    = squad.filter(p => starters.includes(p.id) && p.nationality !== 'Indonesia').length;
      const fSub   = squad.filter(p => subs.includes(p.id)     && p.nationality !== 'Indonesia').length;
      const fDibawa = fSt + fSub; // total asing dibawa (starting + cadangan)

      // Cek apakah total asing yang dibawa sudah mencapai 9
      if (fDibawa >= MAX_ASING_DIBAWA) {
        // Semua jatah 9 asing sudah terpakai -> tidak bisa masuk starting/cadangan
        // Tampilkan info tapi jangan masuk ke mana pun (pemain ini hanya di pool DSP liga)
        triggerToast(
          player.displayName + ' tidak bisa dibawa - kuota 9 asing per pertandingan sudah penuh.',
          'warning'
        );
        return;
      }

      // Masih ada slot asing dibawa (fDibawa < 9)
      if (starters.length < 11 && fSt < MAX_ASING_MAIN) {
        // Slot starter tersedia dan asing starter belum 7 -> masuk starting
        setStarters(p => [...p, id]);
      } else if (starters.length < 11 && fSt >= MAX_ASING_MAIN) {
        // Starter tersedia tapi asing di starting sudah 7 -> otomatis cadangan
        if (subs.length < MAX_SUBS) {
          setSubs(p => [...p, id]);
          triggerToast(player.displayName + ' masuk cadangan - kuota 7 asing starting sudah penuh', 'warning');
        } else {
          triggerToast('Cadangan penuh.', 'warning');
        }
      } else if (starters.length >= 11) {
        // Starting sudah 11 -> cadangan
        if (subs.length < MAX_SUBS) {
          setSubs(p => [...p, id]);
        } else {
          triggerToast('Cadangan penuh.', 'warning');
        }
      }

    } else {
      // Pemain lokal - bebas, tidak ada batasan
      if (starters.length < 11) {
        setStarters(p => [...p, id]);
      } else if (subs.length < MAX_SUBS) {
        setSubs(p => [...p, id]);
      } else {
        triggerToast('Cadangan penuh.', 'warning');
      }
    }
  };

  // Klik di starting/cadangan -> kembalikan ke pool
  const returnToPool = (
    id: string,
    starters: string[], setStarters: React.Dispatch<React.SetStateAction<string[]>>,
    subs:     string[], setSubs:     React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (starters.includes(id)) setStarters(p => p.filter(x => x !== id));
    else if (subs.includes(id)) setSubs(p => p.filter(x => x !== id));
  };
"@

$midLines = $newBlock -split "`n" | ForEach-Object { $_ -replace "`r", "" }
$newLines = $before + $midLines + $after
[System.IO.File]::WriteAllLines($f, $newLines, [System.Text.UTF8Encoding]::new($false))
Write-Host "Done. Lines: $($newLines.Count)"
