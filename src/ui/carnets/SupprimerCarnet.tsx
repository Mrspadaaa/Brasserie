/**
 * Supprimer une idée (R23 ; g4:v02-17 → g4:v02-18 ; Suppression v2, son choix du 16.11, D-47b).
 * La carte, dans la page (D-121) : ce qui part (« Il part avec 1 article, 1 photo, 2 façons et 1 note. La veille du prix, tous
 * les 3 jours, s'arrête. ») ; « n liens le retiennent », un lien par ligne avec son réglage d'un toucher :
 * plan à venir → « Garder le plan sans ce carnet » ; plan réalisé (facture payée) → « Archiver », seul.
 * Supprimer (contour rouge) est grisé tant que n > 0, allumé à 0 ; Garder en noir. G35 (calcul local, picto local) : « n articles
 * en veille : les déplacer dans <carnet proche> · Déplacer ». G36 : à 0 lien, « ni dans À venir, ni en commande », tiré de la
 * même liste (jamais de l'IA), picto local. G34 (champ et + grisés, page grisée) est tenu par le conteneur.
 */
import React from 'react';
import { Archive, ArrowRightToLine, Trash2 } from 'lucide-react';
import { PictoLocal, type ContenuCarnetV } from './EtatIA';
import './carnets-decider.css';

export interface LienRetientV { sorte: 'plan-a-venir' | 'plan-realise'; planId: string; libelle: string; reglage: 'detacher' | 'archiver' }

export interface SupprimerCarnetProps {
  titre: string;
  contenu: ContenuCarnetV;
  liens: LienRetientV[];
  /** G35 : un carnet proche (rattacher.ts) où déplacer les articles en veille. */
  proche?: { titre: string; onDeplacer: () => void } | null;
  onDetacher: (planId: string) => void;
  onArchiver: (planId: string) => void;
  onSupprimer: () => void;
  onGarder: () => void;
}

function compte(n: number, un: string, plusieurs: string) { return n ? `${n} ${n > 1 ? plusieurs : un}` : null; }

/** « 1 article, 1 photo, 2 façons et 1 note » ; rien ne part : null. */
export function cequiPart(c: ContenuCarnetV): string | null {
  const parts = [
    compte(c.articles.length, 'article', 'articles'), compte(c.photos.length, 'photo', 'photos'),
    compte(c.facons.length, 'façon', 'façons'), compte(c.notes.length, 'note', 'notes'),
  ].filter(Boolean) as string[];
  if (!parts.length) return null;
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} et ${parts[parts.length - 1]}` : parts[0];
}

export function SupprimerCarnet(p: SupprimerCarnetProps) {
  const n = p.liens.length;
  const realise = p.liens.some(l => l.reglage === 'archiver');
  const part = cequiPart(p.contenu);
  const enVeille = p.contenu.articles.filter(a => a.veille?.active).length;
  /* P9 : la carte est à l'écran dès le geste, à 390 comme à 1280 ; le focus y va (le lecteur d'écran l'annonce, Tab mène à Garder). */
  const ref = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    el.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, []);
  return (
    <section ref={ref} tabIndex={-1} className="cn-supprimer" aria-label={`Supprimer le carnet ${p.titre}`}>
      <h3 className="cn-sous">Supprimer le carnet {p.titre} ?</h3>
      <p>
        {part ? <>Il part avec <b>{part}</b>.</> : 'Il est vide.'}
        {enVeille ? ` La veille du prix, tous les 3 jours, s'arrête${enVeille > 1 ? ` pour les ${enVeille}` : ''}.` : ''}
      </p>
      {n > 0 && (
        <div className="cn-liens-retiennent">
          <p><b>{n} lien{n > 1 ? 's' : ''} le reti{n > 1 ? 'ennent' : 'ent'}</b></p>
          {/* P42 : le plan se nomme une fois, sur toute la largeur (2 lignes au plus à 390), son réglage dessous ; pas de « À venir · » en tête. */}
          {p.liens.map(l => (
            <div key={`${l.sorte}:${l.planId}`} className="cn-lien-retient">
              <span className="cn-lien-retient-tx"><b>{l.libelle}</b><span className="cn-mut"> · plan {l.sorte === 'plan-a-venir' ? 'dans À venir' : 'réalisé'}</span></span>
              {l.reglage === 'detacher'
                ? <button type="button" className="cn-second" onClick={() => p.onDetacher(l.planId)}>Garder le plan sans ce carnet</button>
                : <button type="button" className="cn-second" onClick={() => p.onArchiver(l.planId)}><Archive size={16} aria-hidden /> Archiver</button>}
            </div>
          ))}
        </div>
      )}
      {/* G35 (g5:v08-27) : proposé avant, sans bloquer ; calcul local (rattacher.ts), picto local. */}
      {enVeille > 0 && p.proche && (
        <div className="cn-aide cn-g35">
          <PictoLocal />
          <span className="cn-sp">{enVeille} article{enVeille > 1 ? 's' : ''} en veille : les déplacer dans {p.proche.titre}</span>
          <button type="button" className="cn-puce cn-g35-bouton" onClick={p.proche.onDeplacer}><ArrowRightToLine size={18} aria-hidden /> Déplacer</button>
        </div>
      )}
      {n === 0 && <p className="cn-mut"><PictoLocal /> ni dans À venir, ni en commande</p>}
      <div className="cn-rang-boutons">
        {!realise && (
          <button type="button" className="cn-supprimer-bouton cn-sp" disabled={n > 0} data-allume={n === 0 ? true : undefined}
            title={n > 0 ? `Réglez d'abord ${n > 1 ? `les ${n} liens` : 'le lien'}` : undefined} onClick={p.onSupprimer}><Trash2 size={18} aria-hidden /> Supprimer</button>
        )}
        <button type="button" className="cn-action cn-sp" onClick={p.onGarder}>Garder</button>
      </div>
    </section>
  );
}
