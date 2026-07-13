# Dokumentasi Fitur — Gosball X AWE
**Gosball Media Studio — Midnight Pitch Edition**
> Aplikasi media tools untuk admin/editor media sepak bola Indonesia.  
> Stack: **Next.js 15** · **TypeScript** · **Supabase (PostgreSQL)** · **Tailwind CSS**

---

## Ringkasan Aplikasi

Gosball X AWE adalah **studio generator konten visual** yang membantu tim media sepak bola Indonesia membuat gambar siap-publish untuk Instagram (Story & Feed) secara cepat. Output akhirnya adalah file **PNG resolusi HD (4×)** yang bisa langsung diposting.

---

## 4 Mode / Fitur Utama

### 1. 🟦 Line-Up Story (`mode: "lineup"`)
Generator kartu formasi lineup pertandingan.

**Apa yang bisa dilakukan:**
| Sub-Fitur | Detail |
|---|---|
| **Setup pertandingan** | Nama kompetisi, matchday label, venue |
| **Pilih klub Home & Away** | Dropdown dari master data Supabase atau data lokal (50+ klub Indonesia) |
| **Import roster otomatis dari iLeague** | Fetch data pemain dari API `ileague.id` berdasarkan slug klub |
| **Import roster dari Supabase** | Cari pemain yang sudah tersimpan di database per klub & season |
| **Pilih formasi** | 18 formasi tersedia: 4-3-3, 4-2-3-1, 4-4-2, 3-5-2, 5-4-1, dst. |
| **Edit pemain per slot** | Nama, nomor punggung, bendera negara |
| **Validasi aturan DSP Super League** | Max 11 asing terdaftar, max 9 DSP, max 7 di lapangan — ditampilkan real-time |
| **Flag negara otomatis** | Dropdown 200+ negara dengan emoji bendera & URL flag |
| **Slot Cadangan (Substitutes)** | 10 slot cadangan per tim |
| **Panel "Asing di luar DSP"** | Tampil otomatis di canvas jika ada pemain asing yang melebihi kuota DSP |
| **Logo klub** | Otomatis dimuat dari Supabase Storage jika tersedia |
| **Warna utama klub** | Digunakan sebagai tema visual tim di canvas |
| **Nama pelatih** | Ditampilkan di kartu tim |
| **Sponsor slot** | Tampilkan brand name + logo sponsor di bagian bawah kartu |
| **Rasio canvas** | 9:16 (IG Story) |

**Canvas output:**
- Visual pitch taktis (titik posisi per formasi)
- Dua panel roster: Starting XI + Cadangan
- Header pertandingan: logo, nama, kompetisi, matchday, venue
- Footer: branding Gosball + sponsor

---

### 2. 🏆 Match Result (`mode: "matchResult"`)
Generator kartu hasil pertandingan.

**Apa yang bisa dilakukan:**
| Sub-Fitur | Detail |
|---|---|
| **Setup pertandingan** | Kompetisi (Super League, Piala Presiden, ACL Two, ACL Challenge), matchday, venue |
| **Logo kompetisi** | Otomatis sesuai kompetisi yang dipilih |
| **Pilih klub Home & Away** | Dari master data + warna tim |
| **Input skor** | Skor Home & Away |
| **Status pertandingan** | Full Time (FT) / Half Time (HT) |
| **Status tambahan** | Extra Time (AET) / Adu Penalti (PEN) |
| **Skor penalti** | Input skor adu penalti jika berlaku |
| **Pencetak gol** | Nama pemain + menit gol + jenis (NORMAL / Penalti / OG / Free Kick) untuk tiap tim |
| **Man of the Match** | Input nama pemain terbaik |
| **Catatan/Note** | Teks tambahan opsional |
| **Background image** | Upload foto pertandingan sebagai latar belakang |
| **Overlay opacity** | Slider transparansi overlay di atas foto |
| **Autosave draft** | Data tersimpan otomatis di `localStorage` berdasarkan ID pertandingan |
| **Load draft terakhir** | Tombol untuk memuat hasil edit sebelumnya |
| **Sponsor slot** | Brand name + logo sponsor |
| **Rasio canvas** | 4:5 (IG Feed Post) |

**Canvas output:**
- Score header besar dengan warna tim
- Timeline pencetak gol (kiri/kanan sesuai tim)
- Badge kompetisi + matchday
- Man of the Match
- Status: FT / HT / AET / PEN

---

### 3. 📊 Rumor Transfer (`mode: "rumor"`)
Generator kartu rumor & transfer pemain.

**Apa yang bisa dilakukan:**
| Sub-Fitur | Detail |
|---|---|
| **Nama pemain** | Input manual atau dari data Transfermarkt |
| **Foto pemain** | Otomatis dari Transfermarkt via ID pemain |
| **Pencarian pemain Transfermarkt** | Search by nama + negara → dapatkan foto & data otomatis |
| **Negara pemain** | Dropdown 200+ negara dengan bendera |
| **Klub asal & tujuan** | Input bebas + pilihan dari master data |
| **Persentase kemungkinan transfer** | Slider 0–100% |
| **Kategori rumor otomatis** | Berdasarkan persentase: Rumor saja / Ada pembicaraan / Negosiasi serius / Advanced talks / Hampir resmi |
| **Status rumor** | Rumor / Advanced Talks / Here We Go |
| **Sponsor slot** | Brand name + logo |
| **Rasio canvas** | 9:16 (IG Story) |

**Canvas output:**
- Foto pemain besar
- Animasi progress bar transfer
- Badge status rumor (warna otomatis per kategori)
- Klub asal → tanda panah → klub tujuan
- Persentase besar di tengah

---

### 4. 🗄️ Master Data (`mode: "master"`)
Manajemen data referensi (tersimpan ke Supabase).

#### 4a. Sub-modul: Master Klub
| Fitur | Detail |
|---|---|
| **Lihat daftar klub** | Semua klub dari Supabase + fallback data lokal 50+ klub |
| **Tambah / Edit klub** | Form input lengkap |
| **Field klub** | Nama resmi, Short name, Slug, Kota, Nama pelatih, Warna utama, Warna sekunder, iLeague Slug, iLeague URL, Logo URL |
| **Pilih kompetisi** | Klub bisa masuk ke 1–4 kompetisi (Super League, Piala Presiden, ACL Two, ACL Challenge) |
| **Upload logo klub** | Upload file gambar → tersimpan di Supabase Storage |
| **Color picker** | Pilih warna primer dari 30 preset warna atau input hex manual |
| **Refresh data** | Reload dari Supabase |
| **Fallback lokal** | Jika Supabase tidak tersedia, tampil 50+ klub dari data lokal |

#### 4b. Sub-modul: Master Pemain
| Fitur | Detail |
|---|---|
| **Tambah pemain ke roster** | Tambah pemain ke klub + season tertentu |
| **Field pemain** | Nama lengkap, Display name, Kode negara, Nama negara, URL bendera, Nomor punggung, Posisi, URL sumber |
| **Otomatis buat club_season** | Jika belum ada relasi klub-season, otomatis dibuat |
| **Validasi unik** | Pemain unik berdasarkan `full_name + country_code` |
| **Upsert** | Jika pemain sudah ada, data diperbarui; jika belum, dibuat baru |

---

## API Endpoints

| Method | Endpoint | Fungsi |
|---|---|---|
| `GET` | `/api/clubs` | Ambil semua klub (Supabase atau lokal) dengan info kompetisi & pelatih |
| `GET` | `/api/clubs/[clubId]/...` | Detail klub |
| `POST` | `/api/master/clubs` | Tambah/update klub ke Supabase (admin) |
| `POST` | `/api/master/players` | Tambah/update pemain ke roster Supabase (admin) |
| `POST` | `/api/master/club-logo` | Upload logo klub ke Supabase Storage |
| `GET` | `/api/countries` | Ambil daftar negara dengan kode & bendera |
| `GET` | `/api/ileague/club/...` | Fetch data roster dari `ileague.id` |

---

## 🗃️ Database — Supabase (PostgreSQL)

Platform: **Supabase** · Auth: Row Level Security (RLS) aktif

### Tabel & Struktur

```
┌─────────────────┐      ┌──────────────────┐
│  competitions   │      │     seasons      │
│─────────────────│      │──────────────────│
│ id (uuid) PK    │◄─────│ competition_id FK│
│ code (unique)   │      │ code (unique/comp)│
│ name            │      │ name             │
│ country_code    │      │ starts_on (date) │
│ created_at      │      │ ends_on (date)   │
└─────────────────┘      └────────┬─────────┘
                                  │
                         ┌────────▼─────────┐
                         │   club_seasons   │
                         │──────────────────│
         ┌──────────┐    │ club_id FK       │
         │  clubs   │◄───│ season_id FK     │
         │──────────│    │ head_coach       │
         │ id PK    │    └────────┬─────────┘
         │ name     │             │
         │ slug     │    ┌────────▼─────────┐
         │ colors   │    │  club_rosters   │
         │ logo     │    │──────────────────│
         │ city     │    │ club_season_id FK│
         │ ileague  │    │ player_id FK     │◄─── ┌──────────┐
         └──────────┘    │ shirt_number     │     │ players  │
                         │ position         │     │──────────│
                         │ source_url       │     │ id PK    │
                         └──────────────────┘     │ full_name│
                                                  │ disp_name│
                                                  │ country  │
                                                  │ flag_url │
                                                  │ dob      │
                                                  └──────────┘
```

### Detail Setiap Tabel

| Tabel | Isi | Catatan |
|---|---|---|
| `competitions` | Super League, Piala Presiden, ACL Two, ACL Challenge | Seed otomatis di schema.sql |
| `seasons` | Musim per kompetisi (contoh: BRI_SUPER_LEAGUE_2026-27) | Unique per `competition_id + code` |
| `clubs` | Master data klub Indonesia | Slug unique, ada warna, logo, iLeague link |
| `club_seasons` | Relasi klub × musim + nama pelatih | Unique per `club_id + season_id` |
| `players` | Data pemain (nama, negara, tanggal lahir) | Unique per `full_name + country_code` |
| `club_rosters` | Pemain yang terdaftar di roster klub per musim | Nomor punggung, posisi, sumber data |

### Data Kompetisi yang Diisi (Seed)

| Kode | Nama | Musim |
|---|---|---|
| `BRI_SUPER_LEAGUE` | Super League | 2026–27 |
| `PIALA_PRESIDEN` | Piala Presiden | 2026 |
| `ACL_TWO` | ACL Two | 2026–27 |
| `ACL_CHALLENGE` | ACL Challenge | 2026–27 |

### Keamanan Database
- **RLS aktif** pada semua tabel
- `anon` & `authenticated` → **hanya bisa READ**
- `service_role` (admin) → **full CRUD**
- API `/api/master/*` menggunakan `service_role` key (tidak terbuka ke publik)
- API `/api/clubs` menggunakan anon key (read-only, aman)

---

## Fitur Teknis Lain

| Fitur | Detail |
|---|---|
| **Export PNG HD** | Resolusi 4× menggunakan `html-to-image` |
| **Aspect ratio canvas** | 9:16 untuk Story, 4:5 untuk Feed Post |
| **Autosave match result** | `localStorage` dengan key unik per pertandingan |
| **Fallback data lokal** | Jika Supabase tidak terhubung, 50+ klub sudah ada secara built-in |
| **iLeague integration** | Fetch roster dari `ileague.id` tanpa login |
| **Aturan DSP real-time** | Counter asing terdaftar/lapangan dihitung live saat input |
| **Drag-free** | Tidak ada drag-and-drop (keyboard-friendly, pilih dari dropdown) |
| **TypeScript strict** | Semua tipe didefinisikan, tidak ada `any` |
| **Responsive** | Mobile (scroll vertikal) + Desktop (sidebar tetap + preview canvas sticky) |
| **prefers-reduced-motion** | Animasi dimatikan jika sistem user mengaktifkan aksesibilitas |

---

## Stack Teknologi

```
Frontend:  Next.js 15.5 (App Router) + TypeScript
Styling:   Tailwind CSS v4 + Custom CSS (Midnight Pitch Design System)
Icons:     Lucide React
Database:  Supabase (PostgreSQL + Storage)
Export:    html-to-image (PNG 4×)
Font:      Inter (Google Fonts)
Deploy:    Vercel (diperkirakan, dari env Vercel di kode)
```
