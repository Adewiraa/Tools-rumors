---
inclusion: always
---

# Media Tools — Design System

Panduan ini adalah **sumber kebenaran tunggal** untuk semua keputusan UI/UX di proyek ini.
Selalu ikuti panduan ini saat membuat atau memodifikasi komponen.

---

## Stack Teknologi UI

| Layer | Library | Kegunaan |
|---|---|---|
| Framework | Next.js 16 + React 19 | Routing & rendering |
| Styling | Tailwind CSS v4 + Custom CSS | Utility classes |
| Komponen | `@/components/ui` | Shared components standar |
| Utility | `@/lib/ui` (cn, tokens, spacing) | Class merging & token access |
| Icons | `lucide-react` | Satu-satunya icon library |
| Primitives | `@radix-ui/react-dialog` | Accessible modal/dialog |

---

## Aturan Wajib

### 1. Selalu gunakan komponen dari `@/components/ui`
```tsx
// ✅ BENAR
import { Button, Card, Input, Select, Badge, Stack, Row } from '@/components/ui';

// ❌ SALAH — jangan buat tombol sendiri
<button style={{ background: '#66756A', padding: '8px 16px' }}>Simpan</button>
```

### 2. Gunakan `cn()` untuk conditional classes
```tsx
import { cn } from '@/lib/ui';

// ✅ BENAR
<div className={cn('card', isActive && 'ring-2 ring-primary', className)} />

// ❌ SALAH
<div className={`card ${isActive ? 'ring-2' : ''}`} />
```

### 3. Gunakan tokens, bukan hardcode warna
```tsx
import { tokens } from '@/lib/ui';

// ✅ BENAR
style={{ color: tokens.color.primary }}
style={{ background: 'var(--primary-600)' }}

// ❌ SALAH
style={{ color: '#66756A' }}
style={{ background: '#66756A' }}
```

### 4. Gunakan komponen layout untuk spacing
```tsx
// ✅ BENAR
<Stack gap={16}>
  <Input label="Nama" />
  <Select label="Posisi" />
</Stack>

// ❌ SALAH — jangan pakai margin/padding ad-hoc di setiap field
<div style={{ marginBottom: 16 }}><Input /></div>
<div style={{ marginBottom: 16 }}><Select /></div>
```

### 5. Semua icon harus dari Lucide React
```tsx
import { Save, Trash2, Edit, Plus, ChevronRight } from 'lucide-react';
// Jangan import dari library lain
```

---

## Token Warna

```css
/* Primary (Quiet Forest Green) */
--primary-600: #66756A   /* Tombol, border aktif, link */
--primary-700: #536057   /* Hover state */
--primary-50:  #F2F5F2   /* Background highlight */

/* Neutrals */
--neutral-950: #232729   /* Text utama */
--neutral-700: #4D5558   /* Text sekunder */
--neutral-500: #7A8285   /* Placeholder, muted */
--neutral-200: #E3E1DA   /* Border standar */
--neutral-100: #EFEEE9   /* Background subtle */
--neutral-50:  #F6F5F1   /* Background page */
--white:       #FCFBF8   /* Card background */

/* Semantic */
--success-600: #667A68   /* Published, Complete */
--warning-600: #9A7B4F   /* Draft, Review */
--danger-600:  #9B5F5F   /* Error, Delete, Cancelled */
--info-600:    #65727A   /* Info, Scheduled */

/* Dark (Sidebar) */
--navy-950: #151A1D
--navy-900: #1D2428
--navy-800: #293236

/* Accent */
--accent-500: #A98C64   /* Highlights, graphic elements */
```

---

## Komponen Standar

### Button
```tsx
<Button variant="primary" size="md">Simpan</Button>
<Button variant="secondary" size="sm">Batal</Button>
<Button variant="danger" size="sm" leftIcon={<Trash2 size={14} />}>Hapus</Button>
<Button loading loadingLabel="Menyimpan...">Simpan</Button>
<Button fullWidth>Simpan Pemain</Button>
```

**Variants:** `primary` | `secondary` | `danger` | `ghost` | `outline`
**Sizes:** `xs` | `sm` | `md` | `lg`

### Card
```tsx
<Card>Konten default</Card>
<Card variant="compact" padding={12}>Compact</Card>
<Card variant="highlight">Dengan border primary</Card>
```

### Input / Select / Textarea
```tsx
<Input label="Nama Lengkap" required placeholder="..." />
<Input label="Cari" leftAddon={<Search size={14} />} />
<Input error="Wajib diisi" />
<Select label="Posisi" required options={[{value:'GK', label:'Goalkeeper'}]} />
<Textarea label="Caption" rows={4} helper="Maks 200 karakter" />
```

### Badge
```tsx
<Badge status="success">Published</Badge>
<Badge status="warning">Review</Badge>
<Badge status="live" dot>LIVE</Badge>

// Preset siap pakai:
<StatusBadge.Published />
<StatusBadge.Draft />
<StatusBadge.Live />
```

### Layout
```tsx
// Vertical stack
<Stack gap={16}>...</Stack>

// Horizontal row
<Row gap={8} align="center" justify="space-between">...</Row>

// Grid responsive
<Grid cols={2} gap={16}>
  <Input label="Nama" />
  <Input label="Display" />
</Grid>

// Divider dengan label
<Divider label="Informasi Tambahan" />

// Empty state konsisten
<EmptyState
  icon={<Calendar size={36} />}
  title="Belum ada jadwal"
  description="Tambahkan jadwal pertandingan untuk semua kompetisi."
  action={<Button size="sm">Tambah Jadwal</Button>}
/>

// Page header konsisten
<PageHeader
  breadcrumb={<><span>Dashboard</span> <ChevronRight size={10} /> <span>Pemain</span></>}
  title="Master Pemain"
  description="Kelola data pemain."
  action={<Button leftIcon={<Plus size={16} />}>Tambah Pemain</Button>}
/>
```

---

## Grid & Spacing

```
Spacing scale: 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48
Gap default antar fields: 16px
Gap compact: 12px
Page padding: 32px desktop, 16px mobile
```

### Pola grid form yang konsisten:
- **1 field per baris** — untuk field penting/lebar (Nama Lengkap, Caption, Klub)
- **2 kolom** — untuk field yang saling berkaitan (Nama + Display, Posisi + No Punggung)
- **Jangan lebih dari 2 kolom di form mobile**

---

## Tipografi

```
page-title:    24px, weight 800 — Judul halaman utama
section-title: 18px, weight 700 — Judul card/section
label:         12px, weight 600 — Form label
body:          13-14px, weight 400/500 — Teks konten
helper:        11px, weight 400 — Helper text & hint
caption:       10px, weight 600, uppercase — Label tabel, badge kecil
```

---

## Responsive Breakpoints

```
Mobile:  ≤ 480px  — 1 kolom, compact padding
Tablet:  ≤ 768px  — max 2 kolom
Desktop: > 768px  — layout penuh
```

**Aturan mobile:**
- Form: maksimal 2 kolom
- Header halaman: tombol aksi di bawah judul (stack, bukan row)
- Sidebar: tertutup by default, toggle manual
- Notifikasi dropdown: `position: fixed` agar tidak terpotong

---

## Anti-patterns (JANGAN Lakukan)

```tsx
// ❌ Jangan hardcode warna
style={{ background: '#66756A' }}

// ❌ Jangan buat tombol dari scratch
<button style={{ ... }}>Simpan</button>

// ❌ Jangan pakai margin bottom manual di setiap field
<div style={{ marginBottom: 16 }}>...</div>

// ❌ Jangan pakai grid span 3+ di form mobile
<div style={{ gridColumn: 'span 3' }}>...</div>

// ❌ Jangan campur emoji encoding langsung di JSX
<span>🌍</span>  // gunakan renderFlag() atau flagUrl
```
