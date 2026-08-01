'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  ChevronRight,
  Sparkles,
  Layers,
  Laptop,
  Palette,
  Terminal,
  Info,
  Shield,
  Trash2,
  Lock,
  List,
  AlertTriangle,
  CheckCircle,
  FileText,
  User,
  Settings,
  HelpCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';

type ComponentCategory = 'all' | 'primitives' | 'forms' | 'data' | 'feedback' | 'tokens';

export default function DesignSystemView() {
  const [activeCategory, setActiveCategory] = useState<ComponentCategory>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inputText, setInputText] = useState('Persib Bandung');
  const [isChecked, setIsChecked] = useState(true);
  const [isSwitched, setIsSwitched] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'stats' | 'rules'>('info');

  const categories = [
    { id: 'all', label: 'Semua Komponen' },
    { id: 'primitives', label: 'Core Primitives (Tombol & Badge)' },
    { id: 'forms', label: 'Form Controls (Input, Checkbox, Switch)' },
    { id: 'data', label: 'Data Display (Card, Tabel, Tabs)' },
    { id: 'feedback', label: 'Feedback & Alert (Dialog, Alert Box)' },
    { id: 'tokens', label: 'Design Tokens (Warna & Tipografi)' },
  ];

  const filteredClass = (cat: ComponentCategory) => {
    if (activeCategory === 'all') return 'block';
    return activeCategory === cat ? 'block' : 'hidden';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Sidebar Navigation */}
      <aside className="lg:w-64 flex-shrink-0">
        <div className="sticky top-6 flex flex-col gap-4">
          <div className="p-4 bg-navy-950 text-white rounded-xl border border-navy-800 shadow-md">
            <div className="flex items-center gap-2 text-accent-500 font-bold text-xs uppercase tracking-wider mb-1">
              <Palette size={14} />
              <span>Studio Desain</span>
            </div>
            <h2 className="text-lg font-extrabold text-white">Media Tools UI</h2>
            <p className="text-2xs text-neutral-400 mt-1">
              Dokumentasi sistem komponen berbasis Tailwind CSS v4 & Shadcn.
            </p>
          </div>

          <nav className="flex flex-col gap-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as ComponentCategory)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-8 min-w-0">
        {/* Page Title */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            <span>Sistem</span>
            <ChevronRight size={10} />
            <span>Design System</span>
          </div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
            Sistem Komponen Aplikasi
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Gunakan panduan ini untuk membangun layout dashboard yang konsisten. Semua komponen di bawah 
            mengadopsi warna tema olahraga *Quiet Stadium Editorial* secara responsif.
          </p>
        </div>

        {/* 1. Core Primitives */}
        <section className={filteredClass('primitives')}>
          <div className="border-b border-neutral-200 pb-3 mb-5">
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <Laptop className="text-primary-600" size={20} />
              1. Core Primitives (Tombol & Badge)
            </h2>
          </div>
          
          <div className="flex flex-col gap-6">
            {/* Buttons Card */}
            <Card>
              <CardHeader>
                <CardTitle>Varian Tombol (`Button`)</CardTitle>
                <CardDescription>Digunakan untuk interaksi utama, form submission, dan navigasi tindakan.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div>
                  <div className="text-2xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Tipe Varian</div>
                  <div className="flex flex-wrap gap-3 items-center">
                    <Button variant="default">Default (Sage)</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="destructive">
                      <Trash2 size={14} /> Hapus Data
                    </Button>
                    <Button variant="ghost">Ghost Link</Button>
                    <Button variant="link">Underlined Link</Button>
                  </div>
                </div>

                <div className="border-t border-neutral-100 pt-4">
                  <div className="text-2xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Ukuran (Sizes)</div>
                  <div className="flex flex-wrap gap-3 items-center">
                    <Button size="sm">Small (sm)</Button>
                    <Button size="default">Medium (default)</Button>
                    <Button size="lg">Large (lg)</Button>
                    <Button size="icon" variant="outline">
                      <Settings size={15} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges Card */}
            <Card>
              <CardHeader>
                <CardTitle>Penanda Status (`Badge`)</CardTitle>
                <CardDescription>Menampilkan label status data yang ringkas.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2.5">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Draft</Badge>
                <Badge variant="success">Published</Badge>
                <Badge variant="warning">Scheduled</Badge>
                <Badge variant="destructive">Suspended</Badge>
                <Badge variant="info">Reviewing</Badge>
                <Badge variant="outline">Secondary Border</Badge>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 2. Form Controls */}
        <section className={filteredClass('forms')}>
          <div className="border-b border-neutral-200 pb-3 mb-5">
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <Terminal className="text-primary-600" size={20} />
              2. Form Controls (Input & Kontrol Pilihan)
            </h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Elemen Formulir</CardTitle>
              <CardDescription>Berbagai elemen input yang telah distyle agar menyatu dengan tema.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-700 uppercase">Input Teks</label>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-sm transition-all focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
                    placeholder="Masukkan teks..."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-700 uppercase">Pilihan Dropdown (Select)</label>
                  <select className="flex h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-sm transition-all focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600">
                    <option>Liga 1 Indonesia</option>
                    <option>Liga 2 Indonesia</option>
                    <option>Piala Indonesia</option>
                  </select>
                </div>
              </div>

              {/* Checkbox and Toggle Switches */}
              <div className="border-t border-neutral-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Custom Checkbox */}
                <div className="flex items-center gap-3">
                  <label className="relative flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => setIsChecked(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 bg-white border border-neutral-300 rounded peer-checked:bg-primary-600 peer-checked:border-primary-600 flex items-center justify-center transition-colors">
                      {isChecked && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </label>
                  <div>
                    <div className="text-sm font-semibold text-neutral-800">Checkbox Kustom</div>
                    <div className="text-2xs text-neutral-500">Peer-styled checkbox tanpa dependency eksternal.</div>
                  </div>
                </div>

                {/* Custom Toggle Switch */}
                <div className="flex items-center gap-3">
                  <label className="relative flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSwitched}
                      onChange={(e) => setIsSwitched(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-200 border border-neutral-300 rounded-full peer-checked:bg-primary-600 peer-checked:border-primary-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                  <div>
                    <div className="text-sm font-semibold text-neutral-800">Toggle Switch</div>
                    <div className="text-2xs text-neutral-500">Cocok untuk mengaktifkan fitur/mode secara cepat.</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 3. Data Display */}
        <section className={filteredClass('data')}>
          <div className="border-b border-neutral-200 pb-3 mb-5">
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <List className="text-primary-600" size={20} />
              3. Data Display (Card, Tabel, Tabs)
            </h2>
          </div>

          <div className="flex flex-col gap-6">
            {/* Custom Tab Switcher */}
            <Card>
              <CardHeader>
                <CardTitle>Tab Kontrol (`Tabs`)</CardTitle>
                <CardDescription>Untuk berpindah antar sub-halaman/kategori informasi.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex border-b border-neutral-200 mb-4 gap-4">
                  {(['info', 'stats', 'rules'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                        activeTab === tab
                          ? 'border-primary-600 text-primary-600'
                          : 'border-transparent text-neutral-400 hover:text-neutral-700'
                      }`}
                    >
                      {tab === 'info' ? 'Informasi Klub' : tab === 'stats' ? 'Statistik Musim' : 'Regulasi Pemain'}
                    </button>
                  ))}
                </div>

                <div className="p-4 bg-neutral-50 rounded-lg text-sm border border-neutral-200">
                  {activeTab === 'info' && (
                    <div>
                      <h4 className="font-bold text-neutral-800 mb-1">Profil Klub: {inputText}</h4>
                      <p className="text-xs text-neutral-500">Berisi data alamat, nama stadion, sejarah singkat, dan tahun berdiri klub.</p>
                    </div>
                  )}
                  {activeTab === 'stats' && (
                    <div>
                      <h4 className="font-bold text-neutral-800 mb-1">Statistik Pertandingan</h4>
                      <p className="text-xs text-neutral-500">Jumlah penampilan di liga: 34 Main, 20 Menang, 8 Seri, 6 Kalah.</p>
                    </div>
                  )}
                  {activeTab === 'rules' && (
                    <div>
                      <h4 className="font-bold text-neutral-800 mb-1">Aturan Pemain Asing</h4>
                      <p className="text-xs text-neutral-500">Maksimal 6 pemain asing dalam skuad (5 Bebas + 1 Asia).</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Custom Table Display */}
            <Card>
              <CardHeader>
                <CardTitle>Tabel Informasi Pemain</CardTitle>
                <CardDescription>Gaya tabel modern untuk memajang daftar data master.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-2xs font-bold text-neutral-500 uppercase tracking-wider">
                      <th className="p-4">Pemain</th>
                      <th className="p-4">Klub</th>
                      <th className="p-4">Posisi</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs">
                    <tr>
                      <td className="p-4 font-semibold text-neutral-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 font-bold">
                          DD
                        </div>
                        David da Silva
                      </td>
                      <td className="p-4 text-neutral-600">Persib Bandung</td>
                      <td className="p-4"><Badge variant="outline">Forward</Badge></td>
                      <td className="p-4"><Badge variant="success">Active</Badge></td>
                      <td className="p-4 text-right">
                        <Button size="sm" variant="ghost" className="h-7 py-0 px-2 text-2xs">Edit</Button>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-neutral-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 font-bold">
                          MK
                        </div>
                        Marc Klok
                      </td>
                      <td className="p-4 text-neutral-600">Persib Bandung</td>
                      <td className="p-4"><Badge variant="outline">Midfielder</Badge></td>
                      <td className="p-4"><Badge variant="success">Active</Badge></td>
                      <td className="p-4 text-right">
                        <Button size="sm" variant="ghost" className="h-7 py-0 px-2 text-2xs">Edit</Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 4. Feedback & Dialog */}
        <section className={filteredClass('feedback')}>
          <div className="border-b border-neutral-200 pb-3 mb-5">
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <Layers className="text-primary-600" size={20} />
              4. Feedback & Alert (Modal & Peringatan)
            </h2>
          </div>

          <div className="flex flex-col gap-6">
            {/* Alert boxes */}
            <Card>
              <CardHeader>
                <CardTitle>Kotak Peringatan (Alert Callouts)</CardTitle>
                <CardDescription>Memberikan notifikasi situasional kepada pengguna.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {/* Info Alert */}
                <div className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800">
                  <Info size={16} className="text-neutral-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold">Info:</span> Anda sedang menggunakan database simulasi lokal karena server belum terhubung.
                  </div>
                </div>

                {/* Success Alert */}
                <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                  <CheckCircle size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold">Sukses:</span> Data formasi tim berhasil disimpan dan diunggah ke repositori utama.
                  </div>
                </div>

                {/* Warning Alert */}
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                  <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold">Peringatan:</span> Terdapat pemain asing yang melebihi kuota regulasi pada lineup pertandingan ini.
                  </div>
                </div>

                {/* Danger Alert */}
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  <Shield className="text-red-600 mt-0.5 flex-shrink-0" size={16} />
                  <div className="text-xs">
                    <span className="font-bold">Error:</span> Gagal melakukan integrasi API eksternal. Periksa token otentikasi Anda di berkas env.
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Modal dialog trigger */}
            <Card>
              <CardHeader>
                <CardTitle>Modal Dialog</CardTitle>
                <CardDescription>Aksi konfirmasi krusial menggunakan dialog overlay.</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="default">
                      Buka Dialog Konfirmasi
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Simpan Konfigurasi</DialogTitle>
                      <DialogDescription>
                        Apakah Anda ingin menyimpan perubahan logo aplikasi untuk media tenant **Gosball**? Aksi ini akan segera terlihat di sidebar admin.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Batal</Button>
                      </DialogClose>
                      <Button variant="default">Simpan Perubahan</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 5. Design Tokens */}
        <section className={filteredClass('tokens')}>
          <div className="border-b border-neutral-200 pb-3 mb-5">
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <Palette className="text-primary-600" size={20} />
              5. Design Tokens (Warna & Tipografi)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Palet Warna Utama</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-2 rounded bg-primary-600 text-white text-xs font-semibold">
                  <span>Primary Sage</span>
                  <span>#66756A</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-accent-500 text-white text-xs font-semibold">
                  <span>Accent Gold</span>
                  <span>#A98C64</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-navy-950 text-white text-xs font-semibold">
                  <span>Navy Dark</span>
                  <span>#151A1D</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-navy-900 text-white text-xs font-semibold">
                  <span>Navy Base</span>
                  <span>#1D2428</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tipografi & Font</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-neutral-800">
                <div>
                  <div className="text-2xs text-neutral-400 font-bold uppercase">Font Family</div>
                  <div className="text-sm font-semibold mt-0.5">Inter, Arial, sans-serif</div>
                </div>
                <div className="border-t border-neutral-100 pt-3">
                  <div className="text-2xs text-neutral-400 font-bold uppercase">Skala Ukuran</div>
                  <div className="flex flex-col gap-1 mt-1 font-mono text-2xs">
                    <span className="text-lg font-black">Headline 3XL</span>
                    <span className="text-md font-bold">Subtitle MD</span>
                    <span className="text-sm">Body Text SM</span>
                    <span className="text-xs">Caption XS</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

      </div>
    </div>
  );
}
