$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)
$lines[1991] = "                  link.download = 'Lineup_' + (homeClub?.shortName || 'HOME') + '_vs_' + (awayClub?.shortName || 'AWAY') + '.png';"
[System.IO.File]::WriteAllLines($f, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host "Fixed download filename at line 1992"
