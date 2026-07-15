# Aturan Auto-Push ke Repository

## Kapan Push Dilakukan

Setiap kali Kiro selesai melakukan pembaruan kode (edit file, buat file baru, atau hapus file), 
Kiro **wajib** melakukan git commit dan push otomatis ke branch `master` di remote `origin`.

## Prosedur Wajib Setelah Edit File

1. **Stage** semua file yang diubah secara spesifik (hindari `git add -A`)
2. **Commit** dengan pesan yang deskriptif dalam format: `feat/fix/chore: <deskripsi singkat perubahan>`
3. **Push** ke `origin master`

## Format Pesan Commit

Gunakan format Conventional Commits:
- `feat: <nama fitur baru>` — saat menambah fitur
- `fix: <deskripsi bug>` — saat memperbaiki bug
- `chore: <perubahan kecil>` — saat update config, dependency, dll
- `refactor: <deskripsi>` — saat refactor tanpa perubahan fungsional

Contoh: `feat: tambah master kompetisi dan relasi ke master club`

## Aturan Keamanan

- **Jangan push langsung ke `main`** jika branch utama bernama `main` — gunakan PR
- Branch `master` adalah branch utama proyek ini, push langsung diperbolehkan
- Jangan gunakan `--force` kecuali diminta eksplisit oleh pengguna
- Jangan skip hooks dengan `--no-verify`
- Selalu verifikasi build tidak error sebelum push jika memungkinkan

## Remote Target

- Remote: `origin`  
- Branch: `master`  
- URL: `https://github.com/Adewiraa/Tools-rumors.git`
