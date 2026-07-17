$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# Fix baris 690 (index 689)
$lines[689] = "                        logAction('CREATE_SCHEDULE', 'Jadwal Pertandingan', 'Jadwal baru: ' + newMatch.homeClubName + ' vs ' + newMatch.awayClubName);"

# Fix baris 694 (index 693)
$lines[693] = "                        logAction('UPDATE_SCHEDULE', 'Jadwal Pertandingan', 'Update jadwal: ' + newMatch.homeClubName + ' vs ' + newMatch.awayClubName);"

# Fix baris 709 (index 708)
$lines[708] = "                      logAction('DELETE_SCHEDULE', 'Jadwal Pertandingan', 'Hapus jadwal id: ' + id);"

[System.IO.File]::WriteAllLines($f, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host "Fixed template literals. Verifying..."
$v = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)
$v[688..710] | ForEach-Object -Begin {$i=689} -Process { Write-Host "$i`: $_"; $i++ }
