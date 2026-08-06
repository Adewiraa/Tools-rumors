import React from 'react';
import { cn, type Status, statusBadgeClass } from '@/lib/ui';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: Status;
  dot?: boolean;
}

/**
 * Badge — label status standar.
 *
 * @example
 * <Badge status="success">Published</Badge>
 * <Badge status="warning">Review</Badge>
 * <Badge status="live" dot>LIVE</Badge>
 */
export const Badge: React.FC<BadgeProps> = ({ status, dot, className, children, ...props }) => {
  return (
    <span
      className={cn('badge', status && statusBadgeClass[status], className)}
      {...props}
    >
      {dot && <span className="pulse-dot" style={{ marginRight: 4 }} />}
      {children}
    </span>
  );
};

// ── Preset badges yang sering dipakai ──────────────────────────────────────────
export const StatusBadge = {
  Published: () => <Badge status="success">Published</Badge>,
  Draft:     () => <Badge status="draft">Draft</Badge>,
  Review:    () => <Badge status="warning">Needs Review</Badge>,
  Live:      () => <Badge status="live" dot>LIVE</Badge>,
  Complete:  () => <Badge status="success">Complete</Badge>,
  Scheduled: () => <Badge status="info">Scheduled</Badge>,
  Cancelled: () => <Badge status="danger">Cancelled</Badge>,
};
