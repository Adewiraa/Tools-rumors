# UI Design Specification — Admin Media Sepak Bola Indonesia

> Dokumen ini adalah sumber instruksi utama bagi AI/designer/developer dalam membuat UI aplikasi admin media sepak bola Indonesia. Gunakan seluruh aturan, struktur, istilah, dan pola interaksi di bawah secara konsisten.

---

## 1. Project Overview

### Nama sementara aplikasi

**GARUDA MATCHROOM**

Nama dapat diganti tanpa mengubah struktur desain.

### Tujuan aplikasi

Menyediakan dashboard operasional untuk admin dan editor media sepak bola Indonesia dalam mengelola:

- lineup pertandingan;
- hasil dan detail pertandingan;
- rumor dan perpindahan pemain;
- master klub;
- master pemain;
- status konten sebelum dipublikasikan.

### Target pengguna

- Super Admin
- Admin Data
- Match Editor
- Transfer/Rumor Editor
- Content Reviewer

### Karakter produk

Modern, profesional, cepat, kredibel, data-driven, dan editorial. Identitas visual menggunakan pendekatan sports media internasional; konteks Indonesia hadir melalui isi data, liga, klub, dan bahasa—bukan melalui warna atau ornamen nasional.

---

## 2. AI Design Prompt

Gunakan prompt berikut saat meminta AI membuat UI:

```text
Buat sebuah admin dashboard media sepak bola Indonesia bernama GARUDA MATCHROOM. Desain harus modern, profesional, editorial, data-dense tetapi tetap mudah dipindai. Gunakan desktop-first responsive layout dengan fixed sidebar di kiri, top header, breadcrumb, contextual page actions, filter bar, data table, cards, tabs, drawer, modal, toast, dan form validation.

Gunakan tema **Quiet Stadium Editorial**: charcoal navy sebagai fondasi, warm white dan stone sebagai permukaan, muted sage sebagai primary accent, serta soft bronze untuk highlight yang sangat terbatas. Seluruh warna harus memiliki saturasi rendah agar terasa tenang, elegan, dan premium. Hindari kombinasi merah-putih sebagai identitas utama, warna neon, warna primer yang tajam, kontras warna yang agresif, tampilan gaming, glassmorphism berlebihan, gradient mencolok, kartu terlalu membulat, dan ilustrasi dekoratif yang tidak memiliki fungsi.

Target pengguna adalah admin media olahraga yang bekerja cepat untuk mengelola lineup pertandingan, match result, rumor pemain, master club, dan master pemain. Semua halaman harus memiliki loading, empty, error, disabled, validation, success, draft, scheduled, published, dan archived states yang relevan.

Tampilkan data contoh Liga 1 Indonesia secara realistis tetapi jangan menggunakan data real-time yang diklaim aktual. Fokus pada hierarki informasi yang jelas, tindakan utama yang terlihat, status publikasi, riwayat perubahan, dan pencegahan kesalahan input.

Ikuti design tokens, struktur halaman, komponen, field, behavior, responsive rules, dan acceptance criteria dalam dokumen spesifikasi ini.
```

---

## 3. Visual Direction

### Konsep visual

**Quiet Stadium Editorial** — perpaduan newsroom olahraga internasional, sistem manajemen pertandingan, dan database pemain. Nuansanya premium, tenang, dewasa, elegan, dan berorientasi data.

### Prinsip desain

1. **Clarity first** — informasi pertandingan dan status publikasi lebih penting daripada dekorasi.
2. **Fast scanning** — skor, klub, jadwal, status, dan aksi harus dapat ditemukan dalam beberapa detik.
3. **Consistent hierarchy** — hanya satu primary action pada setiap area utama.
4. **Operational safety** — aksi publish, delete, dan perubahan hasil pertandingan harus memiliki konfirmasi.
5. **Editorial credibility** — gunakan tampilan bersih, presisi, dan tidak menyerupai game sepak bola.

### Hindari

- layout landing page untuk area admin;
- sidebar penuh warna;
- terlalu banyak gradient dan shadow;
- setiap elemen dibuat dalam card terpisah;
- ikon tanpa label pada aksi penting;
- tabel tanpa filter, pagination, dan empty state;
- badge status yang hanya dibedakan berdasarkan warna;
- bendera, motif nasional, kombinasi merah-putih, atau simbol Garuda sebagai dekorasi visual dominan;
- penggunaan warna neon atau warna dengan saturasi tinggi;
- penggunaan merah sebagai primary accent; merah hanya digunakan secara semantik untuk error atau destructive action;
- klaim data “live” jika tidak terhubung ke sumber real-time.

---

## 4. Design Tokens

### Warna

| Token | Nilai | Penggunaan |
|---|---:|---|
| `primary-600` | `#66756A` | Tombol utama, active menu, link penting |
| `primary-700` | `#536057` | Hover primary |
| `primary-100` | `#E1E6E2` | Selected item dan highlight |
| `primary-50` | `#F2F5F2` | Selected row dan subtle highlight |
| `navy-950` | `#151A1D` | Sidebar dan fondasi visual |
| `navy-900` | `#1D2428` | Header gelap, panel premium |
| `navy-800` | `#293236` | Hover pada area gelap |
| `neutral-950` | `#232729` | Teks utama |
| `neutral-700` | `#4D5558` | Teks sekunder kuat |
| `neutral-500` | `#7A8285` | Metadata dan placeholder |
| `neutral-300` | `#CBCBC5` | Border input |
| `neutral-200` | `#E3E1DA` | Divider dan table border |
| `neutral-100` | `#EFEEE9` | Hover surface |
| `neutral-50` | `#F6F5F1` | Background aplikasi |
| `white` | `#FCFBF8` | Surface utama/warm white |
| `success-600` | `#667A68` | Published, confirmed, success |
| `warning-600` | `#9A7B4F` | Scheduled, pending review |
| `info-600` | `#65727A` | Informasi |
| `live-500` | `#7A6E75` | Live match indicator |
| `accent-500` | `#A98C64` | Statistik unggulan dan highlight terbatas |
| `danger-600` | `#9B5F5F` | Error dan destructive action |

Pastikan seluruh kombinasi teks dan background memenuhi minimal WCAG AA.

### Tipografi

- Font utama: `Inter`, fallback `Arial, sans-serif`.
- Angka skor dan statistik: `Inter`, gunakan `font-variant-numeric: tabular-nums`.
- Page title: 28 px / 36 px, weight 700.
- Section title: 18 px / 28 px, weight 650–700.
- Body: 14 px / 21 px, weight 400.
- Table: 13–14 px / 20 px.
- Label: 12–13 px / 18 px, weight 600.

### Radius, border, dan shadow

- Button/input: 8 px.
- Card/panel/modal: 12 px.
- Badge: 999 px untuk pill.
- Border: 1 px `neutral-200`.
- Shadow card: sangat halus, misalnya `0 1px 2px rgba(15,23,42,.05)`.
- Jangan menjadikan shadow sebagai satu-satunya pembatas area.

### Spacing

Gunakan sistem kelipatan 4 px: `4, 8, 12, 16, 20, 24, 32, 40, 48`.

### Ikon

Gunakan satu keluarga ikon outline seperti Lucide. Ukuran standar 16, 18, atau 20 px. Aksi penting wajib memiliki label teks.

---

## 5. Application Shell

### Desktop layout

- Sidebar tetap: lebar 248 px; collapsed 72 px; gunakan background `navy-950` dengan teks slate terang.
- Top header: tinggi 64 px.
- Content area: maksimum 1600 px dengan padding 24–32 px.
- Background aplikasi: `neutral-50`.
- Main content menggunakan grid 12 kolom.

### Sidebar

Urutan menu:

1. Dashboard
2. Pertandingan
   - Lineup
   - Match Result
3. Rumor & Transfer
4. Master Data
   - Klub
   - Pemain
5. Media Library
6. User & Role
7. Audit Log
8. Pengaturan

Menu aktif ditandai dengan background `navy-800`, teks warm white, ikon muted sage `primary-600`, dan indikator vertikal sage. Sidebar bawah berisi profil user dan tombol logout.

### Top header

- Tombol buka/tutup sidebar.
- Global search dengan shortcut `/` atau `Ctrl/Cmd + K`.
- Tombol quick create: pertandingan, rumor, klub, pemain.
- Notification center.
- Avatar, nama, dan role pengguna.

### Page header

Wajib berisi:

- breadcrumb;
- judul halaman;
- deskripsi singkat atau last updated;
- secondary action bila diperlukan;
- satu primary action di kanan.

---

## 6. Global Components

### Buttons

- Primary: background muted sage `primary-600`, teks warm white atau `navy-950` sesuai hasil uji kontras.
- Secondary: putih dengan border neutral.
- Tertiary: text button.
- Destructive: `danger-600`, hanya untuk aksi berisiko. Warna merah tidak digunakan untuk tombol utama biasa.
- Ukuran: small 32 px, medium 40 px, large 44 px.
- Sertakan loading spinner dan disabled state.

### Status badge

Setiap badge menggunakan warna, ikon kecil, dan teks:

| Status | Warna | Ikon |
|---|---|---|
| Draft | Neutral | File |
| Menunggu Review | Warning | Clock |
| Terjadwal | Warning | Calendar |
| Published | Success | Check Circle |
| Live | Info + pulse terbatas | Radio |
| Selesai | Success | Trophy/Check |
| Ditunda | Warning | Pause |
| Dibatalkan | Danger | X Circle |
| Archived | Neutral | Archive |

### Data table

Wajib mendukung:

- search;
- filter chips;
- sort;
- column visibility;
- selectable rows;
- bulk action;
- sticky header;
- pagination dan rows per page;
- row action menu;
- loading skeleton;
- empty state;
- error state dengan retry;
- horizontal scroll pada layar kecil.

### Form

- Label selalu terlihat di atas input.
- Tanda `*` untuk field wajib.
- Helper text sebelum error.
- Error tampil di bawah field dan ring merah.
- Autosave sebagai draft untuk form panjang.
- Tampilkan indikator `Perubahan belum disimpan`.
- Jika user keluar saat ada perubahan, tampilkan confirmation dialog.

### Feedback

- Toast success maksimal 5 detik.
- Error penting tidak hanya berupa toast; tampilkan inline alert.
- Destructive confirmation menyebut objek yang akan dihapus.
- Publish confirmation menampilkan ringkasan data dan waktu publikasi.

---

## 7. Dashboard

### Tujuan

Memberikan gambaran tugas editorial dan data pertandingan yang perlu ditindaklanjuti hari ini.

### Layout

#### Row 1 — KPI cards

- Pertandingan Hari Ini
- Lineup Belum Lengkap
- Hasil Menunggu Review
- Rumor Draft
- Konten Terjadwal

Setiap card berisi nilai, perubahan dibanding periode sebelumnya jika relevan, dan link ke halaman detail. Jangan gunakan grafik mini jika tidak memberi konteks.

#### Row 2 — Agenda pertandingan

Panel lebar 8 kolom:

- tab Hari Ini / Besok / 7 Hari;
- kickoff;
- kompetisi;
- home vs away;
- venue;
- kelengkapan lineup;
- status pertandingan;
- status publikasi;
- quick action.

Panel 4 kolom:

- tugas editorial saya;
- deadline;
- prioritas;
- assignee;
- tombol tandai selesai.

#### Row 3 — Activity dan data quality

- Recent activity/audit trail.
- Data quality alerts: pemain tanpa foto, klub tanpa stadion, lineup kurang dari 11 pemain, hasil belum memiliki pencetak gol.

---

## 8. Page — Lineup Pertandingan

### List page

Kolom tabel:

| Kolom | Isi |
|---|---|
| Pertandingan | Logo + nama home dan away |
| Kompetisi | Nama kompetisi dan musim |
| Kickoff | Tanggal, waktu WIB |
| Kelengkapan | `18/23` pemain atau progress bar |
| Formasi | Contoh `4-3-3 vs 4-2-3-1` |
| Status Data | Draft/Complete/Needs Review |
| Publikasi | Draft/Scheduled/Published |
| Editor | Avatar + nama |
| Updated | Relative time + exact tooltip |
| Aksi | Edit, preview, duplicate, archive |

Filter: kompetisi, tanggal, klub, kelengkapan, status data, status publikasi, editor.

### Lineup editor

Gunakan page penuh, bukan modal.

#### Header

- Tombol kembali.
- Match identity: kompetisi, tanggal, kickoff, venue.
- Status autosave.
- Preview.
- Save Draft.
- Submit for Review atau Publish.

#### Content tabs

1. Lineup
2. Match Info
3. Official
4. Publication
5. History

#### Tab Lineup

Desktop menggunakan dua panel berdampingan untuk klub home dan away.

Setiap panel berisi:

- logo dan nama klub;
- selector formasi;
- visual pitch sederhana;
- starting XI;
- substitutes;
- coach;
- captain selector;
- goalkeeper marker;
- status availability pemain;
- pencarian pemain;
- drag-and-drop atau aksi `Jadikan Starter/Cadangan` yang tetap bisa digunakan dengan keyboard.

Validasi:

- tepat 11 starter per tim;
- minimal 1 goalkeeper;
- captain harus termasuk starter;
- pemain tidak boleh muncul dua kali;
- pemain suspended/injured memerlukan override reason;
- nomor punggung tidak boleh duplikat dalam satu lineup.

#### Preview lineup

Preview meniru kartu publikasi media: nama klub, logo, formasi, starter, substitutes, coach, tanggal pertandingan, serta watermark brand. Preview tidak boleh menggantikan form editor.

---

## 9. Page — Match Result

### List page

Kolom:

- pertandingan;
- kompetisi;
- kickoff;
- skor;
- status pertandingan;
- kelengkapan event;
- status review;
- publikasi;
- editor;
- aksi.

Filter: date range, kompetisi, klub, status pertandingan, review, publikasi.

### Result editor

#### Score header

- klub home dan away;
- skor normal time;
- skor half time;
- extra time bila berlaku;
- penalty shootout bila berlaku;
- status: scheduled/live/half-time/finished/postponed/cancelled.

#### Tabs

1. Summary
2. Timeline
3. Statistics
4. Lineup
5. Publication
6. History

#### Summary fields

- kompetisi dan ronde;
- kickoff aktual;
- venue;
- attendance;
- referee;
- player of the match;
- match report singkat;
- source/reference internal.

#### Timeline events

Jenis event:

- goal;
- own goal;
- penalty goal/miss;
- yellow card;
- red card;
- substitution;
- VAR decision;
- injury;
- kickoff/half-time/full-time.

Setiap event memiliki menit, injury time, klub, pemain utama, pemain terkait, dan catatan. Urutkan otomatis berdasarkan menit tetapi izinkan reorder manual dengan audit trail.

#### Statistics

- possession;
- shots;
- shots on target;
- corners;
- fouls;
- offsides;
- saves;
- passes dan pass accuracy, bila tersedia.

Validasi persentase dan angka negatif. Statistik opsional tidak boleh memblokir publikasi kecuali ditetapkan oleh workflow.

#### Safety rules

- Perubahan skor setelah published wajib meminta alasan.
- Perubahan skor membuat status kembali `Needs Review`.
- Publish membutuhkan minimal skor final dan status pertandingan.
- Semua perubahan penting dicatat di audit log.

---

## 10. Page — Rumor & Transfer Pemain

### List page

Sediakan toggle `Table View` dan `Editorial Board`.

Kolom tabel:

- headline;
- pemain;
- klub asal;
- klub tujuan;
- tipe: rumor/negosiasi/resmi/perpanjangan/loan;
- reliability tier;
- source;
- status editorial;
- publish date;
- author;
- aksi.

Board columns:

- Idea;
- Research;
- Draft;
- Review;
- Scheduled;
- Published.

### Rumor editor

Field:

- headline;
- slug;
- player;
- from club;
- destination club;
- transfer type;
- rumor status;
- confidence/reliability tier;
- source name;
- source URL;
- source publication date;
- short summary;
- article body;
- featured image;
- tags;
- SEO title;
- meta description;
- publication status;
- schedule date and time WIB;
- author dan reviewer.

Reliability tier:

| Tier | Label | Arti |
|---|---|---|
| A | Sangat Terpercaya | Sumber resmi atau konfirmasi langsung |
| B | Terpercaya | Jurnalis/media dengan rekam jejak kuat |
| C | Berkembang | Beberapa indikasi, belum terkonfirmasi |
| D | Spekulatif | Sumber lemah; wajib diberi penanda jelas |

Aturan editorial:

- Rumor tidak boleh ditampilkan sebagai transfer resmi.
- Wajib ada sumber sebelum submit review.
- Tier D membutuhkan warning dan reviewer approval.
- Artikel resmi harus memiliki rujukan klub, liga, pemain, atau agen yang terverifikasi.
- Pisahkan `Status Transfer` dari `Status Publikasi`.

---

## 11. Page — Master Club

### List page

Tersedia table dan compact grid view.

Kolom:

- logo;
- nama resmi;
- short name;
- kota;
- stadion;
- kompetisi aktif;
- jumlah pemain aktif;
- kelengkapan profil;
- status;
- updated;
- aksi.

### Club editor

Tabs:

1. Informasi Umum
2. Identitas Visual
3. Stadion
4. Squad
5. Social & Media
6. History

Field utama:

- nama resmi;
- short name;
- slug;
- kode 3 huruf;
- tahun berdiri;
- kota/provinsi;
- kompetisi;
- stadion;
- alamat;
- warna utama dan sekunder;
- logo utama;
- logo versi gelap/terang;
- official website;
- social links;
- status active/inactive;
- catatan internal.

Validasi logo: format SVG/PNG/WebP, preview pada background terang dan gelap, rasio aman, serta batas ukuran file.

---

## 12. Page — Master Pemain

### List page

Kolom:

- foto;
- nama lengkap;
- display name;
- klub aktif;
- posisi;
- nomor punggung;
- kebangsaan;
- usia;
- contract end;
- status;
- data completeness;
- aksi.

Filter: klub, posisi, kebangsaan, status, contract end, kelengkapan data.

### Player editor

Tabs:

1. Profil
2. Karier Klub
3. Kontrak
4. Statistik
5. Media
6. Availability
7. History

Field utama:

- nama lengkap;
- display name;
- slug;
- tempat dan tanggal lahir;
- kebangsaan;
- tinggi;
- kaki dominan;
- primary position;
- secondary positions;
- current club;
- squad number;
- contract start/end;
- transfer status;
- national team status;
- profile photo;
- short biography;
- social links;
- active/retired/free agent;
- internal notes.

Availability:

- available;
- injured;
- suspended;
- international duty;
- doubtful;
- inactive.

Field availability memuat tanggal mulai, perkiraan selesai, alasan, sumber, dan catatan internal.

---

## 13. Search, Filter, and Data Behavior

### Global search

Mencari:

- pertandingan berdasarkan klub atau kompetisi;
- pemain berdasarkan nama/display name;
- klub;
- rumor/headline.

Hasil dikelompokkan berdasarkan kategori dan dapat dinavigasi dengan keyboard.

### Filter rules

- Filter aktif tampil sebagai removable chips.
- Sediakan `Reset semua`.
- Simpan filter terakhir per user pada halaman yang sering digunakan.
- Date range menggunakan zona waktu Asia/Jakarta.
- URL menyimpan query filter agar view bisa dibagikan.

### Date and time

- Default: `13 Jul 2026, 19.30 WIB`.
- Simpan waktu dalam UTC di backend, tampilkan dalam WIB.
- Relative time memiliki tooltip exact timestamp.

---

## 14. Roles and Permissions

| Fitur | Super Admin | Admin Data | Match Editor | Rumor Editor | Reviewer |
|---|---:|---:|---:|---:|---:|
| Master Klub/Pemain | Full | Create/Edit | View | View | View |
| Lineup | Full | View | Create/Edit | View | Review |
| Match Result | Full | View | Create/Edit | View | Review |
| Rumor/Transfer | Full | View | View | Create/Edit | Review |
| Publish | Yes | No | Sesuai izin | Sesuai izin | Yes |
| User & Role | Yes | No | No | No | No |
| Audit Log | Yes | View terbatas | View sendiri | View sendiri | View |

UI harus menyembunyikan aksi yang tidak diizinkan dan backend tetap wajib melakukan authorization. Jangan hanya mengandalkan disabled button.

---

## 15. Required UI States

Setiap halaman dan komponen utama harus memiliki:

1. Default
2. Hover
3. Focus-visible
4. Active/selected
5. Disabled
6. Loading/skeleton
7. Empty
8. No search results
9. Partial/incomplete data
10. Validation error
11. Server error + retry
12. Offline/connection lost
13. Success
14. Unsaved changes
15. Permission denied

Contoh empty state lineup:

> Belum ada lineup pada periode ini. Buat lineup baru atau ubah filter yang digunakan.

Primary action: `Buat Lineup`  
Secondary action: `Reset Filter`

---

## 16. Responsive Behavior

### Breakpoints

- Mobile: `< 640 px`
- Tablet: `640–1023 px`
- Desktop: `≥ 1024 px`
- Wide desktop: `≥ 1440 px`

### Tablet

- Sidebar menjadi overlay drawer.
- KPI cards menjadi 2 kolom.
- Filter lanjutan masuk ke drawer kanan.
- Form dua kolom berubah menjadi satu kolom bila ruang tidak cukup.

### Mobile

- Fokus pada review dan quick edit, bukan seluruh workflow kompleks.
- Header ringkas dengan sticky primary action.
- Table dapat berubah menjadi list rows/cards hanya jika struktur datanya tetap terbaca.
- Lineup home dan away ditampilkan melalui segmented control, bukan dua panel berdampingan.
- Timeline match tetap vertikal.
- Touch target minimal 44 × 44 px.

---

## 17. Accessibility

- Target WCAG 2.2 AA.
- Semua fungsi tersedia melalui keyboard.
- Focus ring terlihat jelas.
- Input memiliki programmatic label.
- Ikon dekoratif menggunakan `aria-hidden`.
- Icon-only button memiliki accessible name dan tooltip.
- Drag-and-drop selalu memiliki alternatif tombol/keyboard.
- Live score update menggunakan `aria-live` secara hemat.
- Jangan menyampaikan status hanya melalui warna.
- Modal mengunci fokus dan mengembalikannya ke trigger setelah ditutup.
- Respect `prefers-reduced-motion`.

---

## 18. Motion

- Durasi umum: 150–220 ms.
- Gunakan ease-out untuk masuk dan ease-in untuk keluar.
- Sidebar, drawer, modal, toast, dan row update boleh dianimasikan secara halus.
- Pulse hanya untuk status Live dan tidak agresif.
- Hindari parallax, bounce, dan animasi dekoratif yang memperlambat kerja admin.

---

## 19. Sample Data for Mockup

Gunakan data fiktif berikut agar desain terasa realistis tanpa mengklaim data aktual:

```yaml
competition: Liga Nusantara Utama 2026/27
match:
  home: Jakarta Garuda FC
  away: Surabaya Samudra FC
  kickoff: 2026-07-18T12:30:00Z
  display_time: 18 Jul 2026, 19.30 WIB
  venue: Stadion Merdeka Raya
  status: Scheduled
lineup:
  home_formation: 4-3-3
  away_formation: 4-2-3-1
result_example:
  home_score: 2
  away_score: 1
rumor:
  headline: Jakarta Garuda FC Memantau Penyerang Muda Ardi Pratama
  player: Ardi Pratama
  from_club: Bandung Cakra FC
  destination_club: Jakarta Garuda FC
  reliability: B
  transfer_status: Rumor
  publication_status: Draft
```

Tambahkan label `Data contoh untuk desain` pada mockup bila diperlukan.

---

## 20. Recommended Screen Set

Buat minimal screen berikut:

1. Login
2. Dashboard
3. Lineup List
4. Lineup Editor
5. Match Result List
6. Match Result Editor
7. Rumor & Transfer List
8. Rumor Editor
9. Master Club List
10. Club Editor
11. Master Pemain List
12. Player Editor
13. Global Search
14. Notification Center
15. Publish Confirmation
16. Audit History Drawer
17. Empty/Error/Loading state examples

---

## 21. Acceptance Criteria

UI dianggap memenuhi spesifikasi jika:

- seluruh lima modul utama tersedia dan konsisten;
- sidebar, page header, filter, table, form, dan status mengikuti design system yang sama;
- halaman lineup mampu membedakan starter, substitute, goalkeeper, dan captain;
- match result mendukung timeline event serta perubahan skor dengan audit reason;
- rumor memisahkan reliability, transfer status, dan publication status;
- master klub dan pemain memiliki data completeness indicator;
- semua form penting memiliki validasi, autosave/draft, unsaved changes warning, dan history;
- desktop, tablet, dan mobile memiliki behavior yang dijelaskan;
- aksi publish/delete tidak terjadi tanpa confirmation;
- aksesibilitas keyboard dan kontras minimum terpenuhi;
- desain tidak terlihat seperti template admin generik atau UI game;
- data contoh tidak diklaim sebagai data real-time;
- tampilan akhir terasa layak digunakan oleh tim media sepak bola profesional.

---

## 22. Output Instruction for AI

Saat menghasilkan desain atau kode, AI wajib memberikan:

1. Ringkasan visual direction yang diterapkan.
2. Daftar screen dan user flow.
3. Design tokens yang digunakan.
4. Component inventory.
5. Implementasi responsive.
6. Implementasi state dan validation.
7. Catatan accessibility.
8. Asumsi yang dibuat.

Jika AI menghasilkan kode, prioritaskan komponen reusable, semantic HTML, typed data models, authorization-aware UI, dan pemisahan antara data pertandingan, editorial workflow, serta master data.
