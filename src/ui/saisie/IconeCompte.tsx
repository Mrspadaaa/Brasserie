import React from 'react';
import { Banknote, Landmark, Smartphone, Wallet } from 'lucide-react';

/** E43-4 : une icône propre à chaque compte de paiement (la banque, les espèces, TWINT au téléphone, l'autre au portefeuille), au lieu de la banque pour tous. */
export function IconeCompte({ methode, size = 14 }: { methode: string; size?: number }) {
  const Icone = methode === 'cash' ? Banknote : methode === 'twint' ? Smartphone : methode === 'other' ? Wallet : Landmark;
  return <Icone size={size} aria-hidden="true" data-icone-compte={methode} />;
}
