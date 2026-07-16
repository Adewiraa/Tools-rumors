$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\globals.css"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# Keep everything before the lineup section (lines 0..887, 0-based)
$before = $lines[0..887]

$newCss = @'
/* ==========================================
   LINEUP EDITOR — RESPONSIVE
   ========================================== */

.lineup-editor-root {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lineup-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--neutral-200);
  padding-bottom: 10px;
  gap: 8px;
  flex-wrap: wrap;
}

.lineup-field-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--neutral-500);
  display: block;
  margin-bottom: 3px;
}

/* ── INFO BAR ── */
.lineup-info-bar { padding: 10px 14px !important; }
.lineup-info-grid {
  display: grid;
  grid-template-columns: 2fr 2fr 2fr 1.5fr 3fr;
  gap: 8px;
  align-items: end;
}
.lineup-venue-field { grid-column: span 1; }

/* ── TEAMS GRID: 2 kolom desktop ── */
.lineup-teams-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: start;
}

.lineup-team-panel {
  display: flex;
  flex-direction: column;
}

.lineup-team-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px 8px 0 0;
  color: white;
  flex-wrap: wrap;
}

/* ── 3 KOLOM PER TEAM ── */
.lineup-cols-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  border: 1px solid var(--neutral-200);
  border-top: none;
  border-radius: 0 0 8px 8px;
  overflow: visible; /* NO scrollbar - ikut tinggi konten */
}

.lineup-col {
  padding: 10px;
  /* NO max-height, NO overflow-y — kolom ikut tinggi konten */
  background: white;
}

.lineup-col-header {
  font-size: 10px;
  font-weight: 700;
  color: var(--neutral-600);
  text-transform: uppercase;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--neutral-100);
}

/* Pool item desktop: ukuran normal */
.pool-item-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 6px 8px;
  margin-bottom: 3px;
  border-radius: 7px;
  cursor: pointer;
  text-align: left;
  transition: opacity 0.1s, transform 0.08s;
  font-size: 12px;
}
.pool-item-btn:hover { opacity: 0.85; transform: scale(0.99); }
.pool-item-btn:active { transform: scale(0.97); }

.hide-mobile { display: inline; }

/* ── TABLET ≤1024px ── */
@media (max-width: 1024px) {
  .lineup-info-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
  .lineup-venue-field {
    grid-column: span 3;
  }
}

/* ── MOBILE ≤768px ── */
@media (max-width: 768px) {
  /* Info bar: 2 kolom */
  .lineup-info-grid {
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .lineup-venue-field {
    grid-column: span 2;
  }
  .lineup-info-bar { padding: 8px 10px !important; }

  /* Teams: 1 kolom full width */
  .lineup-teams-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  /* 3 kolom jadi 1 kolom stacked */
  .lineup-cols-grid {
    grid-template-columns: 1fr;
  }

  .lineup-col {
    border-top: 1px solid var(--neutral-100);
    padding: 10px 12px;
  }
  .lineup-col:first-child {
    border-top: none;
  }

  /* Pool di mobile: grid 2 kolom pill compact */
  .lineup-col:first-child .pool-pos-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3px;
  }

  /* Pool item di mobile: lebih compact, font lebih kecil */
  .pool-item-btn {
    padding: 5px 7px;
    font-size: 11px;
    border-radius: 6px;
    margin-bottom: 2px;
  }

  .hide-mobile { display: none; }

  .lineup-editor-header {
    gap: 6px;
  }
  .lineup-team-header {
    font-size: 12px;
    padding: 7px 10px;
  }
}

/* ── SMALL MOBILE ≤480px ── */
@media (max-width: 480px) {
  .lineup-info-grid {
    grid-template-columns: 1fr 1fr;
  }
  .lineup-info-bar { padding: 8px !important; }
  
  /* Pool item sangat compact */
  .pool-item-btn {
    padding: 4px 6px;
    font-size: 10px;
  }
}
'@

$newCssLines = $newCss -split "`n" | ForEach-Object { $_ -replace "`r", "" }
$newLines = $before + $newCssLines
[System.IO.File]::WriteAllLines($f, $newLines, [System.Text.UTF8Encoding]::new($false))
Write-Host "CSS patched. Total lines: $($newLines.Count)"
