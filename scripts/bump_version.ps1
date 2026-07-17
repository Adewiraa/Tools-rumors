$f = "d:\Ade Wiramiharja\Aplikasi\Media Tools\src\app\page.tsx"
$lines = [System.IO.File]::ReadAllLines($f, [System.Text.Encoding]::UTF8)
# Tambah comment kecil sebagai version marker untuk trigger Vercel
$lines[0] = "'use client'; // build-fix-v2"
[System.IO.File]::WriteAllLines($f, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host "Bumped. Line 1: $($lines[0])"
