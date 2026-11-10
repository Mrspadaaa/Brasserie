import React from 'react';
import type { EffetPiece } from '../../../domain/finance/effetPiece';
import { amountOnly } from '../financeFormat';
import { colonnesDe } from '../operations/Piles';
import { moisCourt } from '../operations/calculs';
import './ongletMois.css';

/**
 * L'onglet « Mon mois » (f2d, choisi le 10.11), posé au pied de la vraie Nouvelle dépense et de la vraie Caisse.
 * Fermé : un bouton avec mini-piles et la pastille d'écart. Ouvert : une carte au-dessus du pied, la saisie visible derrière ; sans le titre de la maquette.
 * Il ne calcule rien : tout vient de `effetPiece` (donc de `periodeSynthese`) ; les colonnes viennent de `colonnesDe` (les piles d'Opérations).
 * La bascule n'a pas d'état : elle lit `effet.reglement` (le règlement de la saisie) et le réécrit par `onChoisir`.
 */
export type VarianteMois = 'depense' | 'caisse';

const signe = (cents: number) => `${cents < 0 ? '−' : '+'}${amountOnly(Math.abs(cents))}`;

export function BoutonMois({ effet, variante, ouvert, onBascule }: { effet: EffetPiece | null; variante: VarianteMois; ouvert: boolean; onBascule: () => void }) {
  const ecart = effet && effet.ecart.principal ? effet.ecart.principalCents : 0;
  return <button type="button" data-om="bouton" data-variante={variante} aria-expanded={ouvert} aria-disabled={!effet || undefined} title={effet ? undefined : 'Saisis un montant, une date et une catégorie'}
    aria-label={effet && ecart ? `Mon mois, ${signe(ecart)} CHF` : 'Mon mois'} onClick={() => { if (effet) onBascule(); }} className="om-mo">
    <svg width="22" height="18" viewBox="0 0 22 18" aria-hidden="true"><rect x="0" y="2" width="5" height="16" rx="1.5" fill="#56D27B" /><rect x="7" y="7" width="4" height="11" rx="1.2" fill="#9856D2" /><rect x="12" y="10" width="4" height="8" rx="1.2" fill="#D2B356" /><rect x="17" y="15" width="4" height="3" rx="1" fill="#56C1D2" /></svg>
    <span>Mon mois</span>{ecart ? <em className="om-m" data-sens={effet!.ecart.principal === 'entre' ? 'entre' : 'sortie'}>{signe(ecart)}</em> : null}
  </button>;
}

interface Tuile { cle: string; libelle: string; cents: number; ecart: number; hach?: boolean; on: boolean }

function tuilesDe(e: EffetPiece, variante: VarianteMois): Tuile[] {
  const { apres, ecart } = e;
  return variante === 'caisse'
    ? [{ cle: 'encaisse', libelle: 'encaissé', cents: apres.entreCents - apres.entreAEncaisserCents, ecart: ecart.encaisseCents, on: ecart.encaisseCents !== 0 },
      { cle: 'aEncaisser', libelle: 'à encaisser', cents: apres.entreAEncaisserCents, ecart: ecart.aEncaisserCents, hach: true, on: ecart.aEncaisserCents !== 0 },
      { cle: 'depense', libelle: 'dépensé', cents: apres.depenseCents, ecart: ecart.depenseCents, on: false }]
    : [{ cle: 'paye', libelle: 'payé', cents: apres.payeCents, ecart: ecart.payeCents, on: ecart.payeCents !== 0 },
      { cle: 'aPayer', libelle: 'à payer', cents: apres.aPayerCents, ecart: ecart.aPayerCents, hach: true, on: ecart.aPayerCents !== 0 },
      { cle: 'depense', libelle: 'dépensé', cents: apres.depenseCents, ecart: ecart.depenseCents, on: false }];
}

/** Les piles du mois (v6a) avec la pièce en segment cerné : pleine si réglée, hachurée si à payer. Hauteurs en règle de trois sur les centimes (affichage seulement). */
function PilesMois({ effet }: { effet: EffetPiece }) {
  const apres = colonnesDe(effet.apres), avant = colonnesDe(effet.avant);
  const avantDe = (cle: string) => [avant.ventes, ...avant.charges, avant.materiel].find(c => c?.cle === cle);
  const toutes = [apres.ventes, ...apres.charges, apres.materiel].filter((c): c is NonNullable<typeof c> => !!c);
  const max = Math.max(...toutes.map(c => c.cents), 1);
  const pile = (c: (typeof toutes)[number]) => {
    const dessous = avantDe(c.cle);
    const piece = Math.max(0, c.cents - (dessous?.cents ?? 0));
    const pieceHach = Math.min(piece, Math.max(0, c.hachureCents - (dessous?.hachureCents ?? 0)));
    const hachAutre = Math.max(0, c.hachureCents - pieceHach);
    const pleinAutre = Math.max(0, c.cents - hachAutre - piece);
    return <div key={c.cle} className="om-p" data-pile={c.cle}>
      <b className="om-m" data-signe={c.signe}>{c.signe ?? ''}{amountOnly(c.cents)}</b>
      <span className="om-st" style={{ height: `calc(var(--om-haut) * ${Math.max(c.cents / max, 0.04).toFixed(4)})` }}>
        {hachAutre > 0 && <i className="om-hach" style={{ flex: hachAutre }} />}
        {piece > 0 && <i data-piece={pieceHach > 0 ? 'a-payer' : 'payee'} className={`om-nv${pieceHach > 0 ? ' om-hach' : ''}`} style={{ flex: piece, ...(pieceHach > 0 ? {} : { background: c.couleur }) }} />}
        {pleinAutre > 0 && <i style={{ flex: pleinAutre, background: c.couleur }} />}
      </span>
      <span className="om-nom">{c.libelle}</span>
    </div>;
  };
  const sep = (k: string) => <span key={k} className="om-sep" aria-hidden="true" />;
  return <div className="om-piles" role="group" aria-label="Le mois par catégorie, avec cette pièce cernée">
    {apres.ventes && pile(apres.ventes)}
    {apres.ventes && (apres.charges.length > 0 || apres.materiel) && sep('s1')}
    {apres.charges.map(pile)}
    {apres.materiel && apres.charges.length > 0 && sep('s2')}
    {apres.materiel && pile(apres.materiel)}
  </div>;
}

/** `reglee` : l'état du règlement de la saisie ; `onChoisir(true)` l'écrit « réglé », `onChoisir(false)` « ouvert ». Un règlement inconnu ne coche rien. */
export function CarteMois({ effet, variante, aujourdhui, onChoisir, onFermer }: { effet: EffetPiece; variante: VarianteMois; aujourdhui: string; onChoisir: (reglee: boolean) => void; onFermer: () => void }) {
  const caisse = variante === 'caisse', reglee = effet.reglement === 'paye', ouverte = effet.reglement === 'a-payer';
  const mot = (aria: boolean) => ({ role: 'radio' as const, 'aria-checked': aria });
  const ref = React.useRef<HTMLElement>(null);
  /* Caisse : la rangée du bouton est dans une zone qui défile (elle rognerait la carte). La carte se pose alors en `fixed`, à la largeur de la rangée (≥ 900 px : 420 px,
     alignée à droite de la rangée). Au-dessus de la rangée si elle y tient entière ; sinon dessous si elle y tient ; sinon pleine hauteur de fenêtre, défilement interne. */
  const [pose, setPose] = React.useState<React.CSSProperties | null>(null);
  React.useLayoutEffect(() => {
    if (!caisse) return;
    const mesurer = () => {
      const carte = ref.current, rangee = carte?.parentElement; if (!carte || !rangee) return;
      const r = rangee.getBoundingClientRect(), large = window.innerWidth >= 900, H = window.innerHeight, h = carte.scrollHeight + 2, m = 8;
      const cote = large ? { left: 'auto', right: Math.max(m, Math.round(window.innerWidth - r.right)), width: Math.min(420, Math.round(r.width)) } : { left: m, right: m };
      let v: React.CSSProperties;
      if (r.top - m - h >= m) v = { top: 'auto', bottom: Math.round(H - r.top + m), maxHeight: Math.round(r.top - 2 * m) };
      else if (H - (r.bottom + m) - m >= h) v = { top: Math.round(r.bottom + m), bottom: 'auto', maxHeight: Math.round(H - r.bottom - 2 * m) };
      else v = { top: m, bottom: 'auto', maxHeight: H - 2 * m };
      const next: React.CSSProperties = { position: 'fixed', ...cote, ...v };
      setPose(prev => (prev && JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    mesurer();
    window.addEventListener('resize', mesurer); document.addEventListener('scroll', mesurer, true);
    return () => { window.removeEventListener('resize', mesurer); document.removeEventListener('scroll', mesurer, true); };
  }, [caisse, effet, variante]);
  return <>
    <div className="om-scrim" data-om="scrim" onClick={onFermer} aria-hidden="true" />
    <section ref={ref} className="om-carte" data-om="carte" data-variante={variante} data-ouverte={ouverte ? '1' : '0'} aria-label="Effet sur le mois" style={pose ?? undefined}>
      <div className="om-hd"><span>{moisCourt(effet.mois, aujourdhui)}</span></div>
      <div className="om-tg" role="radiogroup" aria-label={caisse ? 'Règlement de la vente' : 'Règlement de la pièce'}>
        <button type="button" data-om="regle" {...mot(reglee)} onClick={() => onChoisir(true)}>{caisse ? '✓ Encaissé' : '✓ Payé'}</button>
        <button type="button" data-om="ouvert" {...mot(ouverte)} onClick={() => onChoisir(false)}>{caisse ? <i className="om-qr" aria-hidden="true" /> : <i className="om-hach om-sw" aria-hidden="true" />}{caisse ? 'Facture QR' : 'À payer'}</button>
      </div>
      <div className="om-tuiles" data-variante={variante}>
        {tuilesDe(effet, variante).map(t => <div key={t.cle} className="om-t" data-on={t.on ? '' : undefined} data-tuile={t.cle}>
          <span>{t.hach && <i className="om-hach om-sw" aria-hidden="true" />}{t.libelle}</span><b className="om-m">{amountOnly(t.cents)}</b>
          {t.ecart ? <em className="om-m" data-sens={caisse ? 'entre' : 'sortie'}>{signe(t.ecart)}</em> : <em className="om-z" />}
        </div>)}
      </div>
      <div className="om-pw"><PilesMois effet={effet} /></div>
    </section>
  </>;
}
