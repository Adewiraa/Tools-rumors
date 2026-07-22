# Design System & Panduan Style UI/UX — Gosball Media Tools

Dokumen ini berisi spesifikasi teknis, standar komponen, dan panduan gaya antarmuka (UI/UX) yang berlaku di seluruh modul aplikasi **Gosball Media Tools**. Dokumen ini menjadi acuan utama untuk menjaga konsistensi tampilan dan pengalaman pengguna (*user experience*).

---

## 1. Prinsip Utama Desain (*Design Philosophy*)

1. **Quiet Stadium Editorial**: Estetika modern media olahraga yang mengombinasikan warna sage hijau alami (`#66756A`), aksen navy gelap (`#151A1D`), serta latar belakang terang netral (`#F6F5F1`).
2. **Presisi & Seragam**: Seluruh modul (Pertandingan, Editorial, Master Data, hingga Sistem) menggunakan struktur header, filter toolbar, datatable, dan modal aksi yang identik.
3. **Class-Based Global CSS**: Penggunaan CSS global (`globals.css`) sebagai sumber kebenaran tunggal (*single source of truth*) untuk class layout, tombol, tabel, dan badge.

---

## 2. Palet Warna & Token Desain

### A. Warna Utama (*Brand Colors*)
| Variable | Hex Code | Pengunaan Utama |
|---|---|---|
| `--primary-600` | `#66756A` | Tombol Utama (*Primary Button*), Tab Aktif, Aksen Brand |
| `--primary-700` | `#536057` | Hover State Tombol Utama, Header Kategori Tabel |
| `--primary-100` | `#E1E6E2` | Ring Border Focus State Input |
| `--primary-50` | `#F2F5F2` | Highlight Baris Pertandingan Hari Ini, Active Pill |

### B. Warna Tema Gelap / Sidebar (*Navy Palette*)
| Variable | Hex Code | Pengunaan Utama |
|---|---|---|
| `--navy-950` | `#151A1D` | Sidebar Background, Login Page Outer Background |
| `--navy-900` | `#1D2428` | Sidebar Hover/Active State, Card Login Inner |
| `--navy-800` | `#293236` | Border Card Login & Navigasi Sidebar |

### C. Warna Netral (*Neutral Palette*)
| Variable | Hex Code | Pengunaan Utama |
|---|---|---|
| `--neutral-950` | `#232729` | Teks Utama / Body Text |
| `--neutral-700` | `#4D5558` | Subtitle, Description, Input Label |
| `--neutral-500` | `#7A8285` | Placeholder Input, Icon Muted, Text Helper |
| `--neutral-300` | `#CBCBC5` | Border Form Input Default |
| `--neutral-200` | `#E3E1DA` | Card Border, Table Separator |
| `--neutral-50` | `#F6F5F1` | Background Halaman (*Body*), Header Datatable |
| `--white` | `#FCFBF8` | Background Card Content |

### D. Warna Status & Semantik (*Status Palette*)
| Status | Badge Background | Text Color | Contoh Penggunaan |
|---|---|---|---|
| **Success** | `#F0F6F1` | `#667A68` / `#059669` | Match Finished, Status Active, Lineup Siap |
| **Info** | `#F0F4F6` | `#65727A` / `#2563eb` | Status Scheduled, User Role Info |
| **Warning** | `#FDF6EC` | `#9A7B4F` / `#d97706` | Status Review Needed, Match Postponed |
| **Danger** | `#FDF2F2` | `#9B5F5F` / `#e11d48` | Status Live, Alert Error, Delete Action |
| **Draft** | `#EFEEE9` | `#475569` | Match Cancelled, System Category |

---

## 3. Tipografi (*Typography*)

- **Font Family**: `'Inter', Arial, sans-serif`
- **Ukuran & Weight Standar**:
  - `Page Title (H1)`: `28px`, Bold (`700`), Color: `var(--neutral-950)`
  - `Card Heading (H3)`: `17px - 18px`, Extra Bold (`800`)
  - `Section Label / Category`: `11px`, Bold (`800`), Uppercase, Letter Spacing: `0.5px - 1px`
  - `Body Text / Table Text`: `13px` - `14px`, Regular (`400`) / Medium (`500`)
  - `Breadcrumb`: `12px`, Medium (`500`), Color: `var(--neutral-500)`
  - `Form Label`: `13px`, Semibold (`600`), Color: `var(--neutral-700)`

---

## 4. Spesifikasi Struktur Layout Halaman

Setiap menu/view wajib mengikuti hirarki layout berikut:

```jsx
<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

  {/* 1. Page Header (Wajib Pakai Standard Class) */}
  <div className="page-header">
    <div>
      <div className="breadcrumb">
        <span>Dashboard</span>
        <ChevronRight size={10} />
        <span>Nama Menu</span>
      </div>
      <h1 className="page-title">Judul Halaman</h1>
      <p className="page-description">Deskripsi singkat fungsi menu ini.</p>
    </div>
    {/* Tombol Aksi Utama (Opsional) */}
    <button className="btn btn-md btn-primary">
      <Plus size={16} /> Tambah Data
    </button>
  </div>

  {/* 2. Summary Cards / Quick Stats (Opsional) */}
  <div className="schedule-flow-grid">
    <div className="schedule-flow-card">
      <Icon size={18} />
      <div>
        <span>Metrik 1</span>
        <strong>12</strong>
      </div>
    </div>
  </div>

  {/* 3. Filter Bar (Dibungkus Card) */}
  <div className="card" style={{ padding: '12px 20px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
    <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
      <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
      <input className="form-input" style={{ paddingLeft: 30 }} placeholder="Cari..." />
    </div>
    <select className="form-select" style={{ maxWidth: 180 }}>...</select>
    <button className="btn btn-sm btn-secondary"><RotateCcw size={14} /> Reset</button>
    <span className="text-muted" style={{ fontSize: 12, marginLeft: 'auto' }}>XX data</span>
  </div>

  {/* 4. Data Table (Dibungkus table-wrapper) */}
  <div className="table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          <th>Kolom 1</th>
          <th>Kolom 2</th>
          <th className="text-right">Aksi</th>
        </tr>
      </thead>
      <tbody>
        {/* Rows */}
      </tbody>
    </table>
  </div>

  {/* 5. Pagination Footer */}
  <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
    <span>Menampilkan 1-20 dari 100 data</span>
    <div style={{ display: 'flex', gap: 6 }}>
      <button className="btn btn-sm btn-secondary"><ChevronLeft size={15} /></button>
      <button className="btn btn-sm btn-primary">1</button>
      <button className="btn btn-sm btn-secondary">2</button>
      <button className="btn btn-sm btn-secondary"><ChevronRight size={15} /></button>
    </div>
  </div>

</div>
```

---

## 5. Komponen Standard & Tombol

### A. Tombol (*Buttons*)
- **Ukuran**:
  - `.btn-sm`: Height `32px`, Padding `6px 12px`, Font `12px` (Gunakan untuk Aksi Tabel/Filter)
  - `.btn-md`: Height `40px`, Padding `8px 16px`, Font `14px` (Gunakan untuk Aksi Header Halaman)
  - `.btn-lg`: Height `44px`, Padding `10px 20px`, Font `14px` (Gunakan untuk Form Submit Utama)
- **Varian**:
  - `.btn-primary`: Hijau Sage (`#66756A`), Teks Putih
  - `.btn-secondary`: Putih (`#FCFBF8`), Border Netral (`#CBCBC5`), Teks Dark
  - `.btn-danger`: Merah (`#9B5F5F`), Teks Putih

### B. Form Inputs
- Class: `.form-input`, `.form-select`, `.form-textarea`
- Height input standar: `38px` - `40px`
- Focus state: Border warna `--primary-600` + Box-shadow ring `rgba(102,117,106,0.2)`
- Label: `.form-label` dengan tanda bintang merah `<span className="required">*</span>` untuk bidang wajib.

### C. Modal Dialog
- **Backdrop**: `position: fixed`, `inset: 0`, `backgroundColor: rgba(15, 23, 42, 0.65)`, `backdropFilter: blur(4px)`
- **Header Modal**:
  - Create: Background Taint Hijau Muda (`#f0fdf4`), Icon Hijau (`#16a34a`)
  - Edit: Background Taint Biru Muda (`#eff6ff`), Icon Biru (`#2563eb`)
  - Delete: Background Taint Merah Muda (`#fef2f2`), Icon Merah (`#e11d48`)
- **Footer Modal**: Segregated dengan `border-top: 1px solid var(--neutral-200)`, tombol Batal di kiri/kanan, tombol Konfirmasi di kanan.

---

## 6. Spesifikasi Logo & Halaman Login

### A. Aturan Logo Transparan
- **Seluruh Logo Aplikasi** (baik pada Halaman Login, Sidebar Navigasi, Mobile Drawer, maupun Preview Pengaturan) **WAJIB berkeliatan transparan** tanpa wadah kotak hitam/gelap (`background: 'transparent'`).
- Tidak boleh menggunakan `background: #050505` atau `background: #0d1117` di sekeliling elemen `<img>` logo.

### B. Spesifikasi Halaman Login (`/login`)
- **Layout**: Standalone page tanpa sidebar/header bawaan aplikasi.
- **Background**: `backgroundColor: var(--navy-950)` dengan `radial-gradient(circle at top, #1d2428 0%, #151a1d 70%)`.
- **Card Login**: Max width `420px`, `backgroundColor: var(--navy-900)`, `border: 1px solid var(--navy-800)`, `borderRadius: var(--radius-lg)`.
- **Elemen Dilarang**:
  - ❌ Tidak menampilkan section "Akun Tersedia" atau chip role hints.
  - ❌ Tidak menampilkan status indikator "Terhubung ke server".
- **Elemen Wajib**:
  - Logo transparan + Nama Aplikasi.
  - Field Username & Password dengan ikon mata show/hide.
  - Tombol Submit `.btn .btn-primary` berukuran penuh.
  - Text Copyright di bagian paling bawah.

---

## 7. Pemetaan Kepatuhan Seluruh Menu

| Menu | Path | Header Pattern | Filter Card | Datatable Style | Status Uniformity |
|---|---|---|---|---|---|
| **Dashboard** | `/dashboard` | `.page-header` | Card Stats | Flow Cards | ✅ Sesuai |
| **Jadwal Pertandingan** | `/schedule` | `.page-header` | `.card` | `.data-table` | ✅ Reference Standard |
| **Lineup Tim** | `/lineups` | `.page-header` | `.card` | `.data-table` | ✅ Reference Standard |
| **Hasil Pertandingan** | `/results` | `.page-header` | `.card` | `.data-table` | ✅ Reference Standard |
| **Rumor & Transfer** | `/rumors` | `.page-header` | `.card` | Board / Table | ✅ Reference Standard |
| **Master Klub / Pemain / Komp** | `/clubs`, etc. | `.page-header` | `.card` | Grid / Table | ✅ Sesuai |
| **Manajemen User & Password** | `/users` | `.page-header` | `.card` | `.data-table` | ✅ Sesuai |
| **Manajemen Hak Akses** | `/permissions` | `.page-header` | Card Alert | Matrix Table | ✅ Sesuai |
| **Audit Log** | `/logs` | `.page-header` | `.card` | `.data-table` | ✅ Sesuai |
| **Pengaturan** | `/settings` | `.page-header` | `.card` | N/A | ✅ Sesuai |
| **Login** | `/login` | Standalone | N/A | N/A | ✅ Sesuai (Transparan) |

---

## 8. Spesifikasi Tampilan Mobile & Bottom Navigation Bar

### A. Transformatif Datatable Mobile (*Mobile Card View*)
- **Perilaku**: Pada layar seluler ($\le 768\text{px}$), komponen `.data-table` secara otomatis bertransformasi dari tabel horizontal menjadi deretan **Cards** vertikal yang presisi.
- **Rules**:
  - `thead` disembunyikan (`display: none`).
  - Setiap baris `tr` berubah menjadi `card` independen (`background: var(--white)`, `border-radius: var(--radius-lg)`, `margin-bottom: 12px`, `box-shadow: var(--shadow-sm)`).
  - Setiap sel `td` menjadi flex-row tersusun rapi dengan border separator tipis antar bidang data.
  - Baris tombol aksi (`td:last-child`) ditempatkan di bagian bawah card dengan alignment kanan untuk kemudahan akses jempol pengguna.

### B. Mobile Bottom Navigation Bar (`.mobile-bottom-nav`)
- **Perilaku**: Pada layar seluler ($\le 768\text{px}$), navigasi utama dipindahkan ke bagian bawah layar secara melayang (*fixed bottom navigation*).
- **Tab Menu Utama**:
  1. **Dashboard**: `/dashboard` (Icon `Activity`)
  2. **Jadwal**: `/schedule` (Icon `Calendar`)
  3. **Lineup**: `/lineups` (Icon `FileText`)
  4. **Rumor**: `/rumors` (Icon `Radio`)
  5. **Menu / Lainnya**: Membuka drawer navigasi lengkap untuk akses Master Data, Audit Log, User, Permissions, & Settings (Icon `Menu`).
- **Styling**: `position: fixed`, `bottom: 0`, `height: 60px`, `background: var(--navy-950)`, `border-top: 1px solid var(--navy-900)`, `z-index: 1000`.
- **Padding Container**: `.page-container` pada mobile diberi `padding-bottom: 84px` agar konten tidak tertutup oleh bar navigasi bawah.

---
*Dokumen ini dibuat sebagai standar acuan resmi pengembangan UI/UX Gosball Media Tools.*

