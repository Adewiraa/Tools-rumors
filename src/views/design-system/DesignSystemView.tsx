'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
  Search,
  Eye,
  EyeOff,
  Plus,
  Minus,
  X,
  Upload,
  ArrowUp,
  Menu,
  MoreHorizontal,
  Home,
  MessageSquare,
  ChevronDown,
  CornerDownRight,
  Folder,
  File,
  AlertCircle,
  Volume2,
  Play,
  Pause,
} from 'lucide-react';

type ComponentCategory = 'forms' | 'actions' | 'navigation' | 'display' | 'feedback' | 'overlays' | 'layout' | 'media';

export default function DesignSystemView() {
  const [activeCategory, setActiveCategory] = useState<ComponentCategory>('forms');

  const categories = [
    { id: 'forms', label: '1. Form & Input Elements' },
    { id: 'actions', label: '2. Action & Trigger Elements' },
    { id: 'navigation', label: '3. Navigation Systems' },
    { id: 'display', label: '4. Data Display & Organization' },
    { id: 'feedback', label: '5. Feedback, Status & Notifications' },
    { id: 'overlays', label: '6. Contextual Popups & Overlays' },
    { id: 'layout', label: '7. Layout & Structural Containers' },
    { id: 'media', label: '8. Media & Data Visualization' },
  ];

  // Shared state triggers
  const [showPassword, setShowPassword] = useState(false);
  const [stepperVal, setStepperVal] = useState(5);
  const [searchText, setSearchText] = useState('');
  const [isChecked, setIsChecked] = useState(true);
  const [radioVal, setRadioVal] = useState('option-1');
  const [switchVal, setSwitchVal] = useState(false);
  const [segmentVal, setSegmentVal] = useState<'harian' | 'mingguan' | 'bulanan'>('mingguan');
  const [provinsi, setProvinsi] = useState('');
  const [kota, setKota] = useState('');
  const [sliderVal, setSliderVal] = useState(50);
  const [ratingVal, setRatingVal] = useState(4);
  const [ratingHover, setRatingHover] = useState<number | null>(null);
  
  // Actions states
  const [isBtnLoading, setIsBtnLoading] = useState(false);
  
  // Navigation states
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'docs'>('preview');
  
  // Display states
  const [accordionOpen, setAccordionOpen] = useState<string | null>(null);
  const [collapseOpen, setCollapseOpen] = useState(false);
  
  // Feedback states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [progressVal, setProgressVal] = useState(65);
  
  // Overlay states
  const [activeTooltip, setActiveTooltip] = useState(false);
  const [activePopover, setActivePopover] = useState(false);

  // Trigger Toast
  const triggerShowcaseToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper for Cascading select
  const getKotaOptions = (prov: string) => {
    if (prov === 'jabar') return [{ id: 'bdg', name: 'Bandung' }, { id: 'bgr', name: 'Bogor' }];
    if (prov === 'dki') return [{ id: 'jakpus', name: 'Jakarta Pusat' }, { id: 'jaksel', name: 'Jakarta Selatan' }];
    return [];
  };

  // Stepper helper
  const handleStepper = (dir: 'up' | 'down') => {
    setStepperVal(prev => dir === 'up' ? prev + 1 : Math.max(0, prev - 1));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto w-full relative">
      
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-primary-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 border border-primary-500 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle size={16} />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Floating Action Button (FAB) Showcase */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end">
        <button 
          onClick={() => triggerShowcaseToast('Floating Action Button (FAB) diklik!')}
          className="w-12 h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer border border-primary-500"
          title="Floating Action Button"
        >
          <Plus size={24} />
        </button>
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-10 h-10 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer border border-neutral-300"
          title="Back to Top"
        >
          <ArrowUp size={16} />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className="lg:w-64 flex-shrink-0">
        <div className="sticky top-6 flex flex-col gap-4">
          <div className="p-4 bg-navy-950 text-white rounded-xl border border-navy-800 shadow-md">
            <div className="flex items-center gap-2 text-accent-500 font-bold text-xs uppercase tracking-wider mb-1">
              <Palette size={14} />
              <span>Studio Desain</span>
            </div>
            <h2 className="text-base font-extrabold text-white">Media Tools UI</h2>
            <p className="text-2xs text-neutral-400 mt-1">
              Galeri komponen lengkap dikelompokkan berdasarkan jenis fungsional teknis.
            </p>
          </div>

          <nav className="flex flex-col gap-1">
            <button
              onClick={() => setActiveCategory('forms')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === 'forms' ? 'bg-primary-600 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              1. Form & Input Elements
            </button>
            <button
              onClick={() => setActiveCategory('actions')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === 'actions' ? 'bg-primary-600 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              2. Action & Trigger Elements
            </button>
            <button
              onClick={() => setActiveCategory('navigation')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === 'navigation' ? 'bg-primary-600 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              3. Navigation Systems
            </button>
            <button
              onClick={() => setActiveCategory('display')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === 'display' ? 'bg-primary-600 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              4. Data Display & Organization
            </button>
            <button
              onClick={() => setActiveCategory('feedback')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === 'feedback' ? 'bg-primary-600 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              5. Feedback, Status & Notifications
            </button>
            <button
              onClick={() => setActiveCategory('overlays')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === 'overlays' ? 'bg-primary-600 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              6. Contextual Popups & Overlays
            </button>
            <button
              onClick={() => setActiveCategory('layout')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === 'layout' ? 'bg-primary-600 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              7. Layout & Structural Containers
            </button>
            <button
              onClick={() => setActiveCategory('media')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === 'media' ? 'bg-primary-600 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              8. Media & Data Visualization
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        
        {/* Title */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
            <span>Sistem</span>
            <ChevronRight size={10} />
            <span>Design System</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
            {categories.find(c => c.id === activeCategory)?.label || 'Design System'}
          </h1>
        </div>

        {/* ── 1. FORM & INPUT ELEMENTS ────────────────────────────────────────── */}
        {activeCategory === 'forms' && (
          <div className="flex flex-col gap-6">
            
            {/* Text Inputs */}
            <Card>
              <CardHeader>
                <CardTitle>Text Inputs</CardTitle>
                <CardDescription>Berbagai kontrol input berbasis entri teks langsung.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Single-line */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-neutral-700 uppercase">Single-line Text</label>
                    <input 
                      type="text" 
                      className="flex h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600" 
                      placeholder="Masukkan nama lengkap..."
                    />
                  </div>

                  {/* Password Input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-neutral-700 uppercase">Password Input</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        className="flex h-9 w-full rounded-md border border-neutral-300 bg-white pl-3 pr-10 py-1 text-sm shadow-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600" 
                        placeholder="••••••••"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Number Input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-neutral-700 uppercase">Number Input</label>
                    <div className="flex h-9 w-full rounded-md border border-neutral-300 bg-white shadow-sm overflow-hidden">
                      <button onClick={() => handleStepper('down')} className="px-3 hover:bg-neutral-100 border-r border-neutral-300 text-neutral-500 cursor-pointer flex items-center justify-center"><Minus size={14} /></button>
                      <input 
                        type="number" 
                        value={stepperVal} 
                        onChange={(e) => setStepperVal(Number(e.target.value))}
                        className="w-full text-center text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button onClick={() => handleStepper('up')} className="px-3 hover:bg-neutral-100 border-l border-neutral-300 text-neutral-500 cursor-pointer flex items-center justify-center"><Plus size={14} /></button>
                    </div>
                  </div>

                  {/* Search Input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-neutral-700 uppercase">Search Input</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
                      <input 
                        type="text" 
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-neutral-300 bg-white pl-9 pr-9 py-1 text-sm shadow-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600" 
                        placeholder="Cari pertandingan..."
                      />
                      {searchText && (
                        <button onClick={() => setSearchText('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Textarea */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-neutral-700 uppercase">Textarea</label>
                  <textarea 
                    className="flex min-h-[60px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600" 
                    placeholder="Masukkan deskripsi detail..."
                  />
                </div>

                {/* OTP Input */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-neutral-700 uppercase">OTP / PIN Input</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(idx => (
                      <input 
                        key={idx}
                        type="text" 
                        maxLength={1}
                        className="w-10 h-10 text-center border border-neutral-300 rounded-md text-sm font-bold shadow-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selection Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Selection Controls</CardTitle>
                <CardDescription>Pilihan biner, eksklusif, atau grup opsi biner.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Checkbox */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-neutral-700 uppercase">Checkbox</label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={(e) => setIsChecked(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 bg-white border border-neutral-300 rounded peer-checked:bg-primary-600 peer-checked:border-primary-600 flex items-center justify-center transition-colors">
                      {isChecked && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className="text-sm text-neutral-700 select-none">Persetujuan lisensi dan regulasi</span>
                  </label>
                </div>

                {/* Radio Group */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-neutral-700 uppercase">Radio Group</label>
                  <div className="flex flex-col gap-2">
                    {[
                      { id: 'option-1', label: 'Admin Utama (Super Admin)' },
                      { id: 'option-2', label: 'Matchday Reporter' }
                    ].map(opt => (
                      <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="showcase-radio"
                          value={opt.id}
                          checked={radioVal === opt.id}
                          onChange={() => setRadioVal(opt.id)}
                          className="sr-only peer"
                        />
                        <div className="w-4.5 h-4.5 rounded-full border border-neutral-300 flex items-center justify-center peer-checked:border-primary-600">
                          {radioVal === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-primary-600"></div>}
                        </div>
                        <span className="text-sm text-neutral-700 select-none">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Switch / Toggle */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-neutral-700 uppercase">Switch / Toggle</label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={switchVal} 
                      onChange={(e) => setSwitchVal(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-200 border border-neutral-300 rounded-full peer-checked:bg-primary-600 peer-checked:border-primary-600 transition-colors relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                    <span className="text-xs text-neutral-600">Aktifkan Notifikasi Real-time</span>
                  </label>
                </div>

                {/* Segmented Control */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-neutral-700 uppercase">Segmented Control</label>
                  <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                    {(['harian', 'mingguan', 'bulanan'] as const).map(seg => (
                      <button
                        key={seg}
                        onClick={() => setSegmentVal(seg)}
                        className={`flex-1 text-center py-1 rounded-md text-xs font-bold uppercase cursor-pointer transition-all ${
                          segmentVal === seg ? 'bg-white text-primary-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
                        }`}
                      >
                        {seg}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dropdowns & Pickers */}
            <Card>
              <CardHeader>
                <CardTitle>Dropdowns & Pickers</CardTitle>
                <CardDescription>Antarmuka untuk memilih data dari menu popup atau widget penentu.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-neutral-700 uppercase">Select / Dropdown</label>
                    <select className="flex h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-primary-600 focus:outline-none focus:ring-1">
                      <option>Pilih Kompetisi...</option>
                      <option>Liga 1 Indonesia</option>
                      <option>Liga 2 Indonesia</option>
                    </select>
                  </div>

                  {/* Cascading Select */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-neutral-700 uppercase">Cascading Select (Provinsi & Kota)</label>
                    <div className="flex gap-2">
                      <select 
                        value={provinsi} 
                        onChange={(e) => { setProvinsi(e.target.value); setKota(''); }}
                        className="flex-1 h-9 rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs"
                      >
                        <option value="">Provinsi...</option>
                        <option value="jabar">Jawa Barat</option>
                        <option value="dki">DKI Jakarta</option>
                      </select>
                      <select 
                        value={kota} 
                        onChange={(e) => setKota(e.target.value)}
                        disabled={!provinsi}
                        className="flex-1 h-9 rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs disabled:opacity-50"
                      >
                        <option value="">Kota...</option>
                        {getKotaOptions(provinsi).map(k => (
                          <option key={k.id} value={k.id}>{k.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Multi-Select / Tag Input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-neutral-700 uppercase">Multi-Select / Tag Input Mockup</label>
                    <div className="flex flex-wrap items-center gap-1.5 p-1.5 border border-neutral-300 rounded-md bg-white min-h-[36px]">
                      <Badge variant="secondary" className="gap-1">
                        ⚽ Persib <X size={10} className="cursor-pointer" />
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        ⚽ Bali United <X size={10} className="cursor-pointer" />
                      </Badge>
                      <input type="text" placeholder="Tambah..." className="flex-1 min-w-[60px] text-xs focus:outline-none px-1" />
                    </div>
                  </div>

                  {/* Pickers (Date & Time Mockup) */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-neutral-700 uppercase">Date & Time Picker Mockup</label>
                    <div className="flex gap-2">
                      <input type="date" className="flex-1 h-9 rounded-md border border-neutral-300 bg-white px-2 text-xs" />
                      <input type="time" className="flex-1 h-9 rounded-md border border-neutral-300 bg-white px-2 text-xs" />
                    </div>
                  </div>
                </div>

                {/* Dropzone File Uploader */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-neutral-700 uppercase">File Uploader / Dropzone</label>
                  <div className="border-2 border-dashed border-neutral-300 hover:border-primary-600 rounded-lg p-6 bg-neutral-50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                    <Upload size={24} className="text-neutral-400" />
                    <span className="text-xs text-neutral-600 font-semibold">Tarik & lepas file logo klub di sini</span>
                    <span className="text-3xs text-neutral-400">PNG, SVG, JPG (Max 2MB)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Range & Interactive Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Range & Interactive Controls</CardTitle>
                <CardDescription>Kontrol geser dan rating penilaian.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Slider */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-bold text-neutral-700 uppercase">
                    <span>Slider</span>
                    <span className="text-primary-600">{sliderVal}%</span>
                  </div>
                  <input 
                    type="range" 
                    min={0} 
                    max={100}
                    value={sliderVal}
                    onChange={(e) => setSliderVal(Number(e.target.value))}
                    className="w-full accent-primary-600 cursor-pointer"
                  />
                </div>

                {/* Rating */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-neutral-700 uppercase">Rating Bintang</label>
                  <div className="flex gap-1.5 items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingVal(star)}
                        onMouseEnter={() => setRatingHover(star)}
                        onMouseLeave={() => setRatingHover(null)}
                        className="text-amber-400 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                      >
                        <svg 
                          className="w-6 h-6 fill-current" 
                          viewBox="0 0 24 24" 
                          opacity={(ratingHover !== null ? star <= ratingHover : star <= ratingVal) ? 1 : 0.25}
                        >
                          <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.362l8.2-1.192z" />
                        </svg>
                      </button>
                    ))}
                    <span className="text-xs font-bold text-neutral-600 ml-2">({ratingVal} / 5)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Structure Helpers */}
            <Card>
              <CardHeader>
                <CardTitle>Form Structure Helpers</CardTitle>
                <CardDescription>Pembungkus visual untuk menata form.</CardDescription>
              </CardHeader>
              <CardContent>
                <fieldset className="border border-neutral-300 rounded-lg p-4">
                  <legend className="text-xs font-bold text-neutral-500 uppercase px-2">Informasi Akun</legend>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-neutral-700">Username *</label>
                    <input type="text" className="flex h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm focus:border-red-500 focus:outline-none" defaultValue="superadmin" />
                    <span className="text-2xs text-red-500 font-semibold mt-0.5">Username sudah terdaftar! (Pesan Error)</span>
                  </div>
                </fieldset>
              </CardContent>
            </Card>

          </div>
        )}

        {/* ── 2. ACTION & TRIGGER ELEMENTS ────────────────────────────────────── */}
        {activeCategory === 'actions' && (
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Buttons & Varian Aksi</CardTitle>
                <CardDescription>Pemicu tindakan utama, sekunder, destruktif, atau proses asinkron.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="flex flex-wrap gap-3 items-center">
                  <Button variant="default">Primary Button</Button>
                  <Button variant="secondary">Secondary / Outline</Button>
                  <Button variant="ghost">Ghost Button</Button>
                  <Button variant="destructive">Destructive / Danger</Button>
                  
                  {/* Icon Button */}
                  <Button size="icon" variant="outline" title="Edit">
                    <Lock size={14} />
                  </Button>

                  {/* Loading/Async */}
                  <Button 
                    variant="default"
                    disabled={isBtnLoading}
                    onClick={() => {
                      setIsBtnLoading(true);
                      setTimeout(() => {
                        setIsBtnLoading(false);
                        triggerShowcaseToast('Proses asinkron selesai!');
                      }, 2000);
                    }}
                  >
                    {isBtnLoading ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <span>Uji Coba Async Button</span>
                    )}
                  </Button>

                  {/* Split Button */}
                  <div className="inline-flex rounded-md shadow-sm">
                    <button className="h-9 px-4 rounded-l-md bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold border-r border-primary-500 cursor-pointer flex items-center justify-center">Simpan Skuad</button>
                    <button className="h-9 px-2.5 rounded-r-md bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold cursor-pointer flex items-center justify-center"><ChevronDown size={14} /></button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── 3. NAVIGATION SYSTEMS ────────────────────────────────────────────── */}
        {activeCategory === 'navigation' && (
          <div className="flex flex-col gap-6">
            
            {/* Nav Headers & Mockups */}
            <Card>
              <CardHeader>
                <CardTitle>Global Navigation Mockups</CardTitle>
                <CardDescription>Simulasi batang navigasi atas, samping, dan mobile bottom bar.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                
                {/* Navbar/Header Mockup */}
                <div className="border border-neutral-200 rounded-lg p-3 bg-neutral-50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 font-bold text-sm text-neutral-900">
                    <Shield size={18} className="text-primary-600" />
                    <span>Gosball</span>
                  </div>
                  <div className="hidden md:flex gap-4 text-xs font-semibold text-neutral-600">
                    <span className="text-primary-600 font-bold">Jadwal</span>
                    <span>Lineup</span>
                    <span>Klasemen</span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center font-extrabold text-xs text-primary-600">
                    A
                  </div>
                </div>

                {/* Mobile Bottom Navigation Mockup */}
                <div className="max-w-[320px] mx-auto w-full border border-neutral-200 rounded-lg p-2 bg-white flex justify-around items-center">
                  <div className="flex flex-col items-center text-primary-600 cursor-pointer"><Home size={16} /><span className="text-4xs font-bold uppercase mt-0.5">Home</span></div>
                  <div className="flex flex-col items-center text-neutral-400 cursor-pointer"><List size={16} /><span className="text-4xs font-bold uppercase mt-0.5">Matches</span></div>
                  <div className="flex flex-col items-center text-neutral-400 cursor-pointer"><Settings size={16} /><span className="text-4xs font-bold uppercase mt-0.5">Settings</span></div>
                </div>
              </CardContent>
            </Card>

            {/* Hierarchical Navigation */}
            <Card>
              <CardHeader>
                <CardTitle>Breadcrumbs & Pagination</CardTitle>
                <CardDescription>Jalur hirarkis dan pemilah halaman data.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500">
                  <span className="hover:text-neutral-800 cursor-pointer">Dashboard</span>
                  <ChevronRight size={10} />
                  <span className="hover:text-neutral-800 cursor-pointer">Pertandingan</span>
                  <ChevronRight size={10} />
                  <span className="text-neutral-900 font-bold">Lineup Tim</span>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center border-t border-neutral-100 pt-4">
                  <div className="text-xs text-neutral-500">Menampilkan 1-10 dari 120 data</div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled>Prev</Button>
                    <Button variant="default" size="sm">1</Button>
                    <Button variant="outline" size="sm">2</Button>
                    <Button variant="outline" size="sm">Next</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── 4. DATA DISPLAY & ORGANIZATION ──────────────────────────────────── */}
        {activeCategory === 'display' && (
          <div className="flex flex-col gap-6">
            
            {/* Accordion & Collapse */}
            <Card>
              <CardHeader>
                <CardTitle>Accordion & Collapse</CardTitle>
                <CardDescription>Panel konten lipat untuk menghemat area vertikal.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                
                {/* Accordion */}
                <div className="border border-neutral-200 rounded-lg overflow-hidden">
                  {[
                    { id: 'acc-1', q: 'Bagaimana regulasi kuota pemain asing?', a: 'Kuota maksimal adalah 6 pemain asing bebas kewarganegaraan ditambah 1 pemain asing Asia (6+1).' },
                    { id: 'acc-2', q: 'Kapan batas pendaftaran lineup pertandingan?', a: 'Lineup wajib disubmit minimal 60 menit sebelum kickoff pertandingan berlangsung.' }
                  ].map(item => (
                    <div key={item.id} className="border-b last:border-0 border-neutral-200">
                      <button 
                        onClick={() => setAccordionOpen(accordionOpen === item.id ? null : item.id)}
                        className="w-full p-4 text-left font-bold text-xs text-neutral-800 flex justify-between items-center bg-neutral-50 hover:bg-neutral-100 cursor-pointer"
                      >
                        <span>{item.q}</span>
                        <ChevronDown size={14} className={`transform transition-transform ${accordionOpen === item.id ? 'rotate-180' : ''}`} />
                      </button>
                      {accordionOpen === item.id && (
                        <div className="p-4 bg-white text-xs text-neutral-600 border-t border-neutral-100">
                          {item.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Collapse */}
                <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100">
                  <Button variant="outline" size="sm" className="w-fit" onClick={() => setCollapseOpen(!collapseOpen)}>
                    {collapseOpen ? 'Sembunyikan Catatan' : 'Tampilkan Catatan Teknis'}
                  </Button>
                  {collapseOpen && (
                    <div className="p-3 bg-neutral-100 border border-neutral-200 rounded-lg text-xs text-neutral-600">
                      Catatan: Semua data master disinkronkan langsung dengan repositori Supabase secara terenkripsi.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* List Display & Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>List Displays, Tree View & Timeline</CardTitle>
                <CardDescription>Model penataan data berurutan, terstruktur, atau kronologis.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Tree View */}
                <div className="flex flex-col gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="text-2xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Folder Tree View</div>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-neutral-700 font-bold"><Folder size={14} className="text-yellow-600" /> <span>src</span></div>
                    <div className="flex items-center gap-1.5 text-neutral-600 ml-4"><Folder size={14} className="text-yellow-600" /> <span>components</span></div>
                    <div className="flex items-center gap-1.5 text-neutral-500 ml-8"><File size={14} /> <span>button.tsx</span></div>
                    <div className="flex items-center gap-1.5 text-neutral-600 ml-4"><Folder size={14} className="text-yellow-600" /> <span>views</span></div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex flex-col gap-3">
                  <div className="text-2xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Kronologi Transaksi</div>
                  <div className="relative border-l border-neutral-200 ml-3 pl-4 flex flex-col gap-4">
                    <div className="relative">
                      <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-emerald-600 border-2 border-white"></div>
                      <div className="text-xs font-bold text-neutral-900">Lineup Terkirim</div>
                      <div className="text-3xs text-neutral-400">Hari ini, 10:15 WIB oleh admin</div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white"></div>
                      <div className="text-xs font-bold text-neutral-900">Persetujuan Pending</div>
                      <div className="text-3xs text-neutral-400">Kemarin, 14:00 WIB oleh Reviewer</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informational Indicators */}
            <Card>
              <CardHeader>
                <CardTitle>Avatars, KPI & Statistik</CardTitle>
                <CardDescription>KPI ringkasan statistik beserta profil grup pengguna.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* KPI Card */}
                <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 flex justify-between items-center">
                  <div>
                    <div className="text-3xs font-bold text-primary-600 uppercase">Jumlah Master Pemain</div>
                    <div className="text-2xl font-black text-primary-700 mt-1">320</div>
                    <div className="text-4xs text-emerald-600 font-bold mt-0.5">▲ 12% peningkatan bulan ini</div>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                    <User size={20} />
                  </div>
                </div>

                {/* Avatar Stack */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-neutral-700 uppercase">Avatar Group</label>
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary-600 border-2 border-white text-white flex items-center justify-center font-bold text-xs">U1</div>
                    <div className="w-8 h-8 rounded-full bg-amber-500 border-2 border-white text-white flex items-center justify-center font-bold text-xs">U2</div>
                    <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white text-white flex items-center justify-center font-bold text-xs">U3</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── 5. FEEDBACK, STATUS & NOTIFICATIONS ─────────────────────────────── */}
        {activeCategory === 'feedback' && (
          <div className="flex flex-col gap-6">
            
            {/* Banners & Dialog Trigger */}
            <Card>
              <CardHeader>
                <CardTitle>Feedback Overlay, Drawer & Toast Triggers</CardTitle>
                <CardDescription>Konfirmasi aksi berat dan notifikasi melayang sementara.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                {/* Modal Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="default">Buka Dialog Konfirmasi</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Publikasikan Data?</DialogTitle>
                      <DialogDescription>Aksi ini akan menyiarkan lineup pertandingan yang dipilih ke dalam portal berita aktif.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Batal</Button>
                      </DialogClose>
                      <Button variant="default" onClick={() => triggerShowcaseToast('Data sukses dipublikasikan!')}>
                        Ya, Publikasikan
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Toast Trigger */}
                <Button variant="secondary" onClick={() => triggerShowcaseToast('Pesan notifikasi Toast berhasil ditampilkan!')}>
                  Tampilkan Toast
                </Button>

                {/* Drawer Trigger */}
                <Button variant="outline" onClick={() => setDrawerOpen(true)}>Buka Drawer Samping</Button>
              </CardContent>
            </Card>

            {/* Static Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Alert Banners</CardTitle>
                <CardDescription>Pesan konseptual di dalam halaman.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                  <AlertTriangle size={15} className="mt-0.5 text-amber-600 flex-shrink-0" />
                  <div><strong>Peringatan:</strong> Batas unggah file adalah 2MB. Format harus SVG/PNG.</div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs">
                  <AlertCircle size={15} className="mt-0.5 text-red-600 flex-shrink-0" />
                  <div><strong>Error:</strong> Gagal tersambung ke server database online. Silakan periksa kredensial.</div>
                </div>
              </CardContent>
            </Card>

            {/* Loaders & Skeletal Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Loading, Progress & Placeholder</CardTitle>
                <CardDescription>Indikator tunggu progres aksi.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                
                {/* Progress bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-bold text-neutral-600">
                    <span>Mempersiapkan data build</span>
                    <span>{progressVal}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${progressVal}%` }}></div>
                  </div>
                </div>

                {/* Skeleton Loader placeholder */}
                <div className="flex flex-col gap-2 pt-3 border-t border-neutral-100">
                  <div className="text-2xs font-bold text-neutral-400 uppercase mb-1">Skeleton Placeholder (Shimmer)</div>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-200 animate-pulse"></div>
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-3 w-1/3 bg-neutral-200 rounded animate-pulse"></div>
                      <div className="h-2 w-2/3 bg-neutral-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {/* ── 6. CONTEXTUAL POPUPS & OVERLAYS ─────────────────────────────────── */}
        {activeCategory === 'overlays' && (
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contextual Popups & Overlays</CardTitle>
                <CardDescription>Elemen melayang temporer di atas layar utama.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4 items-center">
                
                {/* Tooltip Mockup */}
                <div className="relative">
                  <button 
                    onMouseEnter={() => setActiveTooltip(true)}
                    onMouseLeave={() => setActiveTooltip(false)}
                    className="h-9 px-3 rounded-md border border-neutral-300 text-xs font-semibold hover:bg-neutral-100 cursor-pointer"
                  >
                    Arahkan Kursor (Tooltip)
                  </button>
                  {activeTooltip && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-neutral-900 text-white text-3xs font-bold rounded shadow-md whitespace-nowrap z-50">
                      Ini adalah petunjuk singkat tooltip
                    </div>
                  )}
                </div>

                {/* Popover Mockup */}
                <div className="relative">
                  <button 
                    onClick={() => setActivePopover(!activePopover)}
                    className="h-9 px-3 rounded-md border border-neutral-300 text-xs font-semibold hover:bg-neutral-100 cursor-pointer"
                  >
                    Klik untuk Popover
                  </button>
                  {activePopover && (
                    <div className="absolute top-full left-0 mt-2 w-48 p-3 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 flex flex-col gap-2 text-xs">
                      <div className="font-bold text-neutral-800">Detail Cepat</div>
                      <div className="text-neutral-500">Anda dapat menyisipkan form kecil atau menu link di sini.</div>
                      <Button size="sm" variant="default" className="text-2xs h-7 py-0" onClick={() => setActivePopover(false)}>Tutup</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── 7. LAYOUT & STRUCTURAL CONTAINERS ───────────────────────────────── */}
        {activeCategory === 'layout' && (
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tata Letak & Pembatas Visual</CardTitle>
                <CardDescription>Sistem struktur grid dan divider spasial.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                
                {/* Grid layout demonstration */}
                <div className="grid grid-cols-3 gap-2 bg-neutral-50 p-2 rounded-lg border border-neutral-200">
                  <div className="p-3 bg-neutral-200 text-center text-3xs font-bold text-neutral-600 rounded">Kolom 1</div>
                  <div className="p-3 bg-neutral-200 text-center text-3xs font-bold text-neutral-600 rounded">Kolom 2</div>
                  <div className="p-3 bg-neutral-200 text-center text-3xs font-bold text-neutral-600 rounded">Kolom 3</div>
                </div>

                {/* Divider lines */}
                <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 text-2xs text-neutral-400 font-bold uppercase">
                  <span>Divider Horizontal</span>
                </div>
                <hr className="border-neutral-200 my-1" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── 8. MEDIA & DATA VISUALIZATION ───────────────────────────────────── */}
        {activeCategory === 'media' && (
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Chart Mockup & Visuals</CardTitle>
                <CardDescription>Simulasi grafik data interaktif menggunakan gambar atau model SVG.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                
                {/* SVG Line Chart Mockup */}
                <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                  <div className="text-2xs font-bold text-neutral-500 uppercase mb-3">Tren Kemenangan Klub (SVG Chart)</div>
                  <div className="w-full h-32 flex items-end gap-4 relative">
                    <svg className="w-full h-full text-primary-600" viewBox="0 0 100 50">
                      <path 
                        d="M 10 40 Q 30 10 50 35 T 90 5" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3"
                      />
                      <circle cx="10" cy="40" r="3" fill="#A98C64" />
                      <circle cx="38" cy="18" r="3" fill="#A98C64" />
                      <circle cx="50" cy="35" r="3" fill="#A98C64" />
                      <circle cx="90" cy="5" r="3" fill="#A98C64" />
                    </svg>
                  </div>
                </div>

                {/* Media Players simulation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border border-neutral-200 rounded-lg bg-neutral-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 size={16} className="text-neutral-500" />
                      <span className="text-xs font-semibold">Uji Coba Sound.mp3</span>
                    </div>
                    <button onClick={() => triggerShowcaseToast('Play Audio!')} className="w-8 h-8 rounded-full bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center cursor-pointer shadow-sm">
                      <Play size={12} className="ml-0.5" />
                    </button>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        )}

      </div>

      {/* Drawer Overlay Showcase */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[5000] bg-black/60 backdrop-blur-sm flex justify-end" onClick={() => setDrawerOpen(false)}>
          <div 
            className="w-full max-w-sm h-full bg-white p-6 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <h3 className="font-extrabold text-sm text-neutral-900">Panel Drawer Samping</h3>
              <button className="text-neutral-400 hover:text-neutral-600 cursor-pointer" onClick={() => setDrawerOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="text-xs text-neutral-600 flex-1">
              Ini adalah area panel drawer samping (Sheet). Sangat berguna untuk form edit cepat data master, log aktivitas terperinci, atau menu filter tambahan.
            </div>
            <div className="border-t border-neutral-200 pt-3 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDrawerOpen(false)}>Batal</Button>
              <Button variant="default" size="sm" onClick={() => { setDrawerOpen(false); triggerShowcaseToast('Aksi Drawer Berhasil!'); }}>Simpan</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
