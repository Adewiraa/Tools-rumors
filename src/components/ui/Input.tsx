import React from 'react';
import { cn } from '@/lib/ui';

// ── Input ─────────────────────────────────────────────────────────────────────
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
  required?: boolean;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

/**
 * Input — text input standar dengan label dan helper.
 *
 * @example
 * <Input label="Nama Pemain" required placeholder="Contoh: Eliano Reijnders" />
 * <Input label="Cari" leftAddon={<Search size={14} />} />
 * <Input error="Wajib diisi" />
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helper, error, required, leftAddon, rightAddon, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (
      <div className="form-group" style={{ margin: 0 }}>
        {label && (
          <label className="form-label" htmlFor={inputId}>
            {label}
            {required && <span className="required" style={{ marginLeft: 2 }}>*</span>}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {leftAddon && (
            <div style={{ position: 'absolute', left: 10, color: 'var(--neutral-500)', display: 'flex', alignItems: 'center' }}>
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn('form-input', error && 'border-danger', leftAddon && 'pl-8', rightAddon && 'pr-8', className)}
            style={{ width: '100%', paddingLeft: leftAddon ? 32 : undefined, paddingRight: rightAddon ? 32 : undefined }}
            {...props}
          />
          {rightAddon && (
            <div style={{ position: 'absolute', right: 10, color: 'var(--neutral-500)', display: 'flex', alignItems: 'center' }}>
              {rightAddon}
            </div>
          )}
        </div>
        {error  && <span style={{ fontSize: 11, color: 'var(--danger-600)', marginTop: 2 }}>{error}</span>}
        {helper && !error && <span className="form-helper">{helper}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ── Select ────────────────────────────────────────────────────────────────────
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helper?: string;
  error?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

/**
 * Select — dropdown standar.
 *
 * @example
 * <Select label="Posisi" options={[{value:'GK', label:'Goalkeeper'}]} />
 * <Select label="Kompetisi" required>
 *   <option value="">Pilih...</option>
 *   {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
 * </Select>
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helper, error, required, options, className, id, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (
      <div className="form-group" style={{ margin: 0 }}>
        {label && (
          <label className="form-label" htmlFor={selectId}>
            {label}
            {required && <span className="required" style={{ marginLeft: 2 }}>*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn('form-select', error && 'border-danger', className)}
          {...props}
        >
          {options ? options.map(o => <option key={o.value} value={o.value}>{o.label}</option>) : children}
        </select>
        {error  && <span style={{ fontSize: 11, color: 'var(--danger-600)', marginTop: 2 }}>{error}</span>}
        {helper && !error && <span className="form-helper">{helper}</span>}
      </div>
    );
  }
);
Select.displayName = 'Select';

// ── Textarea ──────────────────────────────────────────────────────────────────
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
  error?: string;
  required?: boolean;
}

/**
 * Textarea — multi-line input standar.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helper, error, required, className, id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (
      <div className="form-group" style={{ margin: 0 }}>
        {label && (
          <label className="form-label" htmlFor={textareaId}>
            {label}
            {required && <span className="required" style={{ marginLeft: 2 }}>*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn('form-textarea', error && 'border-danger', className)}
          {...props}
        />
        {error  && <span style={{ fontSize: 11, color: 'var(--danger-600)', marginTop: 2 }}>{error}</span>}
        {helper && !error && <span className="form-helper">{helper}</span>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
