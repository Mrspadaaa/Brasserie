import React, { useId, useState } from 'react';
import { Input } from '../../Input';
import { formatDecimal, parseDecimal } from '../../numericInput';
import { formatCHF } from '../../../domain/finance/ledger';

/**
 * Le montant du virement : UNE seule valeur à l'écran (q6, points 2, 3 et 9). Le champ, la barre et le bouton disent le même nombre :
 *   · au-delà de `maxCents` (le total dû des pièces cochées), le champ est ramené à ce total tout de suite, et le message tient sur UNE ligne SOUS le champ ;
 *   · un texte illisible, négatif ou à plus de deux décimales ne change pas la valeur (le champ la reprend en le quittant), et le dit de la même façon.
 * `valeurCents` vient du parent : quand le total baisse (une pièce décochée), le parent recale la valeur et le champ la montre, sauf pendant la frappe.
 * Tactile : le champ est un <textarea> d'une ligne (`Input`) ; ses mesures sont dans payer.css.
 */
export function ChampVirement({ libelle, aria, valeurCents, maxCents, onValeur }: {
  libelle: string; aria: string; valeurCents: number | undefined; maxCents: number; onValeur: (cents: number | undefined) => void;
}) {
  const [texte, setTexte] = useState<string | null>(null);
  const [avis, setAvis] = useState<string | null>(null);
  const idAvis = useId();
  // Un texte resté dans le champ au-dessus d'un total qui vient de baisser (pièce décochée) ne reste pas : le champ montre la valeur recalée (q6, point 9).
  const nTexte = texte === null ? null : parseDecimal(texte);
  const perime = nTexte !== null && Math.round(nTexte * 100) > maxCents;
  const affiche = texte !== null && !perime ? texte : formatDecimal(valeurCents === undefined ? undefined : valeurCents / 100, 2);
  const changer = (t: string) => {
    setTexte(t); setAvis(null);
    if (t.trim() === '') { onValeur(undefined); return; }
    if (/^\s*[-−–]/.test(t)) { setAvis('Pas de valeur négative.'); return; }
    const n = parseDecimal(t);
    if (n === null) { if (/[^\d\s.,]/.test(t)) setAvis('Ce n’est pas un nombre.'); return; } // « 12, » : frappe intermédiaire
    if ((t.trim().replace(',', '.').split('.')[1] ?? '').length > 2) { setAvis('Au plus 2 décimales.'); return; }
    const cents = Math.round(n * 100);
    if (cents > maxCents) {
      setTexte(formatDecimal(maxCents / 100, 2));
      setAvis(`Ramené à ${formatCHF(maxCents)} : c’est tout ce qui reste à payer.`);
      onValeur(maxCents);
      return;
    }
    onValeur(cents);
  };
  return <>
    <div className="pay-who" data-booster="un-virement">
      <span>{libelle}</span>
      <Input aria-label={aria} aria-invalid={avis ? true : undefined} aria-describedby={avis ? idAvis : undefined} type="text" inputMode="decimal" enterKeyHint="next" value={affiche}
        onFocus={e => { setAvis(null); e.currentTarget.select(); }} onChange={e => changer(e.target.value)} onBlur={() => setTexte(null)} />
    </div>
    {avis && <p className="pay-err" id={idAvis} role="alert">{avis}</p>}
  </>;
}
