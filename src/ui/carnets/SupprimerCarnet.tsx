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
import { accord, comptesCarnet, pluriel } from '../../domain/carnets/comptes';
import { PictoLocal, type ContenuCarnetV } from './EtatIA';
import './carnets-decider.css';

export interface LienRetientV { sorte: 'plan-a-venir' | 'plan-realise'; planId: string; libelle: string; reglage: 'detacher' | 'archiver' }

export interface SupprimerCarnetProps {
  titre: string;
  contenu: ContenuCarnetV;
  liens: LienRetientV[];
  /**
   * G35 : un carnet proche (`carnetProche`, lot A) où déplacer les articles en veille. Critique 5, n° 27 : seulement un carnet du même
   * objet (une hotte ne part pas dans l'extracteur CO₂) ; `memeCategorie: false` le tait, faute de quoi rien n'est proposé.
   */
  proche?: { titre: string; onDeplacer: () => void; memeCategorie?: boolean } | null;
  onDetacher: (planId: string) => void;
  onArchiver: (planId: string) => void;
  onSupprimer: () => void;
  onGarder: () => void;
}

function compte(n: number, un: string, plusieurs?: string) { return n ? pluriel(n, un, plusieurs) : null; }

/**
 * « 1 article, 1 photo, 2 façons et 1 note » ; rien ne part : null. Critique 6, n° 15 : les nombres viennent de `comptesCarnet`, comme
 * la liste et le carnet ouvert ; l'écartée part aussi, elle est dite à part (« 2 façons, 1 façon écartée »).
 */
export function cequiPart(c: ContenuCarnetV): string | null {
  const n = comptesCarnet(c);
  const parts = [
    compte(n.articles, 'article'), compte(n.photos, 'photo'),
    compte(n.facons, 'façon'), n.ecartees ? `${pluriel(n.ecartees, 'façon')} ${accord(n.ecartees, 'écartée')}` : null, compte(n.notes, 'note'),
  ].filter(Boolean) as string[];
  if (!parts.length) return null;
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} et ${parts[parts.length - 1]}` : parts[0];
}

export function SupprimerCarnet(p: SupprimerCarnetProps) {
  const n = p.liens.length;
  const realise = p.liens.some(l => l.reglage === 'archiver');
  const part = cequiPart(p.contenu);
  const enVeille = comptesCarnet(p.contenu).veilles;
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
      {/* G35 (g5:v08-27) : proposé avant, sans bloquer ; calcul local (rattacher.ts), picto local en couleur neutre (n° 38, Q19 : le
          calcul local ne passe pas pour de l'IA, ni violet ni ✻). */}
      {enVeille > 0 && p.proche && p.proche.memeCategorie !== false && (
        <div className="cn-g35" data-source="locale">
          <PictoLocal />
          {/* critique 6, n° 31 : « 1 article en veille : le déplacer », « 2 articles en veille : les déplacer » */}
          <span className="cn-sp">{pluriel(enVeille, 'article')} en veille : {accord(enVeille, 'le', 'les')} déplacer dans {p.proche.titre}</span>
          <button type="button" className="cn-puce cn-g35-bouton" onClick={p.proche.onDeplacer}><ArrowRightToLine size={18} aria-hidden /> Déplacer</button>
        </div>
      )}
      {n === 0 && <p className="cn-mut cn-g36"><PictoLocal /> ni dans À venir, ni en commande</p>}
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
