import React from 'react';
import { BellRing, Check, LoaderCircle, Pause } from 'lucide-react';

export type BrewTagTone = 'neutral' | 'info' | 'active' | 'pause' | 'due' | 'done';
export function BrewTag({
  tone = 'neutral',
  children
}: {
  tone?: BrewTagTone;
  children: React.ReactNode;
}) {
  const Icon =
    tone === 'active'
      ? LoaderCircle
      : tone === 'done'
        ? Check
        : tone === 'pause'
          ? Pause
          : tone === 'due'
            ? BellRing
            : null;
  return (
    <span className={`brew-tag is-${tone}`}>
      {Icon && <Icon size={14} aria-hidden="true" />}
      {children}
    </span>
  );
}
