import React from 'react';
import { MessageCircle } from 'lucide-react';
import { brewerLauncher } from '../services/brewerLauncher';
import './brewer-navigation.css';

/** Recipe pages reserve space in their mobile chrome for the existing chat. */
export function BrewerPageShortcut() {
  return <button type="button" data-inline-companion
    aria-label="Ouvrir le compagnon brasseur" title="Compagnon brasseur"
    className="shrink-0 w-7 h-7 rounded-control border border-hop/50 bg-hop/10 text-hop flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2"
    onClick={() => { brewerLauncher.open(); }}>
    <MessageCircle size={17} />
  </button>;
}
