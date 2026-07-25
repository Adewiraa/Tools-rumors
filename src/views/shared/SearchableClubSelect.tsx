'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { Club } from '@/lib/mockData';

export interface SearchableClubSelectProps {
  clubs: Club[];
  value: string;
  onChange: (clubId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function SearchableClubSelect({
  clubs,
  value,
  onChange,
  placeholder = 'Pilih Tim...',
  disabled = false,
  className = '',
}: SearchableClubSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedClub = clubs.find(c => c.id === value);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredClubs = clubs.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.shortName && c.shortName.toLowerCase().includes(q)) ||
      (c.code && c.code.toLowerCase().includes(q))
    );
  });

  const handleSelect = (clubId: string) => {
    onChange(clubId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const getLogoElement = (club?: Club, size = 22) => {
    if (!club) return null;
    const hasValidLogo = club.logoUrl && club.logoUrl.startsWith('http');
    if (hasValidLogo) {
      return (
        <img
          src={club.logoUrl}
          alt={club.name}
          className="searchable-select-logo"
          style={{ width: size, height: size }}
          onError={(e) => {
            // fallback if image fails
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      );
    }
    const initial = (club.shortName || club.name || 'T').substring(0, 2).toUpperCase();
    return (
      <div
        className="searchable-select-logo-placeholder"
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        {initial}
      </div>
    );
  };

  return (
    <div className={`searchable-select-container ${className}`} ref={containerRef}>
      <button
        type="button"
        className={`searchable-select-trigger ${isOpen ? 'is-open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <div className="searchable-select-trigger-content">
          {selectedClub ? (
            <>
              {getLogoElement(selectedClub, 22)}
              <span style={{ fontWeight: 500 }}>{selectedClub.name}</span>
            </>
          ) : (
            <span style={{ color: 'var(--neutral-400)' }}>{placeholder}</span>
          )}
        </div>
        <ChevronDown size={16} style={{ color: 'var(--neutral-500)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </button>

      {isOpen && (
        <div className="searchable-select-dropdown">
          <div className="searchable-select-search-wrap">
            <Search size={14} className="searchable-select-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="searchable-select-search-input"
              placeholder="Cari tim..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="searchable-select-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="searchable-select-options">
            {filteredClubs.length > 0 ? (
              filteredClubs.map(c => {
                const isSelected = c.id === value;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`searchable-select-option ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelect(c.id)}
                  >
                    <div className="searchable-select-option-item">
                      {getLogoElement(c, 22)}
                      <span>{c.name}</span>
                      {c.shortName && c.shortName !== c.name && (
                        <span style={{ fontSize: 11, color: 'var(--neutral-400)', background: 'var(--neutral-100)', padding: '1px 5px', borderRadius: 4 }}>
                          {c.shortName}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check size={14} style={{ color: 'var(--primary-600)' }} />}
                  </button>
                );
              })
            ) : (
              <div className="searchable-select-empty">
                Tim "{searchQuery}" tidak ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
