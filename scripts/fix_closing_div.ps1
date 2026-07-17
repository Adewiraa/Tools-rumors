$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)

# Insert closing </div> after line index 459 (after "})" of sidebar-logo conditional)
$before = $lines[0..459]
$insert = "        </div>"
$after  = $lines[460..($lines.Count - 1)]
$newLines = $before + $insert + $after

[System.IO.File]::WriteAllLines($f, $newLines, [System.Text.UTF8Encoding]::new($false))
Write-Host "Fixed. Lines: $($newLines.Count)"

# Verify
$v = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)
$v[448..468] | ForEach-Object -Begin {$i=449} -Process { Write-Host "$i`: $_"; $i++ }
