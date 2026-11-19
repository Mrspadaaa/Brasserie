/**
 * Les retours « après », avec Annuler dans la page (Q18, règle J23) : jamais de boîte de confirmation.
 * R11 « ✓ Carnet créé, en tête des Carnets · ↺ Annuler » et « « phrase » · votre phrase en titre » (g5:v04-4) ;
 * R14 « ✓ Rangé ici, à l'instant · Annuler » (g5:v03-8, cadre tenu par LigneRangee) ;
 * G20 « <nom> rangé, 2e · Annuler » (g5:v06-11) ; G21 « Rangé dans <carnet>, à l'instant · Annuler », raison, Déplacer (g5:v06-14) ;
 * R19 « ✓ 3 lignes rangées dans 2 carnets · Annuler » (g5:v01-16, cadre tenu par NoteEnVrac) ;
 * R20 « ✓ Note modifiée, à l'instant · Annuler » ; G30 « ✓ Renommé · avant : <titre> · Annuler » ; G32 « Note supprimée · Annuler » ;
 * G37 « Carnet supprimé · <titre> · Annuler » ; G26 conséquence pour comparer, au picto local, si `aides.consequence`.
 * Le temps d'affichage (5 s au moins) est tenu par le conteneur ; ce composant ne disparaît pas seul.
 */
import React, { useEffect, useRef } from 'react';
import { Calculator, Check, TriangleAlert, Undo2, WifiOff } from 'lucide-react';
import { PictoLocal, Provenance } from './EtatIA';

/** La fin de la ligne citée sous « ✓ Carnet créé » : d'où vient le titre. Seule la phrase écrite par lui est « votre phrase en titre ». */
const ORIGINE_TITRE: Record<TitreDe, string> = {
  phrase: 'votre phrase en titre',
  page: 'le nom lu sur la page en titre',
  site: 'le site en titre',
  regle: 'titre tiré de votre phrase',
  ia: 'titre mis en forme par l’IA'
};

/**
 * D'où vient le titre d'un carnet créé : `phrase` (« votre phrase en titre », R11) ; `page` (le nom lu sur la page d'un lien collé) ;
 * `site` (un lien seul, page non lue : son domaine, P3) ; `regle` (la règle locale a tiré le titre de sa phrase, sans l'IA) ; `ia` (l'IA a
 * vraiment fourni le titre). Seul `phrase` dit « votre phrase en titre » ; seul `ia` prête le titre à l'IA.
 */
export type TitreDe = 'phrase' | 'page' | 'site' | 'regle' | 'ia';

/** Comparaison de titres : casse, accents et espaces ne comptent pas (« Embouteillage » pour « embouteillage »). */
const memeTitre = (x: string, y: string) => x.trim().localeCompare(y.trim(), 'fr', { sensitivity: 'base' }) === 0;

/**
 * L'origine du titre d'un carnet créé. `ia` seulement si l'IA a fourni ce titre (`titresIA` : ceux de ses lignes, jamais ceux de la règle
 * locale) ; un titre autre que sa phrase, sans page lue ni IA, vient de la règle locale (`regle`), jamais prêté à l'IA.
 */
export function origineDuTitre(a: { titre: string; titreDePhrase: string; lienSeul: boolean; nomLu: boolean; titresIA?: readonly (string | undefined)[] }): TitreDe {
  if (memeTitre(a.titre, a.titreDePhrase)) return a.lienSeul ? 'site' : 'phrase';
  if (a.nomLu) return 'page';
  return a.titresIA?.some(t => !!t && memeTitre(t, a.titre)) ? 'ia' : 'regle';
}

/** L'article rangé ailleurs, montré dans le retour (g5:v06-14) : ce qui est connu seulement, rien d'inventé. */
export interface ArticleRangeV { nom: string; detail?: string; prix?: string; exemple?: boolean }

export type BandeauV =
  | { sorte: 'cree'; phrase: string; titreDe?: TitreDe }
  | { sorte: 'range' }
  /* P9 (R25) : un lien seul dont la page n'a pas été lue : lequel, en clair, et « page non lue · Ouvrir ↗ » */
  | { sorte: 'lien'; url: string; lu: boolean; ici?: boolean }
  /* P21 : une photo rangée */
  | { sorte: 'photo'; ici?: boolean }
  /* critique 6, n° 12 : `rang`, « 1re de sa façon, devant Hotte inox 120 cm » (R26, G20) */
  | { sorte: 'article'; faconNom?: string; rang?: string }
  | { sorte: 'deuxieme'; nom: string; rang: number; faconsNees?: number }
  | { sorte: 'ailleurs'; carnet: string; rang?: string; raison?: string; onDeplacer?: () => void; cite?: string; article?: ArticleRangeV }
  | { sorte: 'vrac'; lignes: number; carnets: number }
  | { sorte: 'modifiee' }
  | { sorte: 'renomme'; avant: string }
  | { sorte: 'note-supprimee' }
  | { sorte: 'carnet-supprime'; titre: string };

/** G26 : ce que le changement fait à la comparaison (différence calculée par `comparer.ts`, jamais inventée). */
export interface ConsequenceV { texte: string; onPasserCritere?: () => void }

export function texteBandeau(b: BandeauV): string {
  switch (b.sorte) {
    case 'cree': return '✓ Carnet créé, en tête des Carnets';
    case 'range': return '✓ Rangé ici, à l\'instant';
    case 'lien': return b.lu ? '✓ Lien rangé ici' : '✓ Lien rangé ici · page non lue';
    case 'photo': return '✓ Photo rangée ici';
    case 'article': return `${b.faconNom ? `✓ Article rangé ici, dans ${b.faconNom}` : '✓ Article rangé ici, à l\'instant'}${b.rang ? ` · ${b.rang}` : ''}`;
    case 'deuxieme': return `${b.nom} rangé, ${b.rang === 1 ? '1er' : `${b.rang}e`}`;
    case 'ailleurs': return `Rangé dans ${b.carnet}, à l'instant${b.rang ? ` · ${b.rang}` : ''}`;
    case 'vrac': return `✓ ${b.lignes} ligne${b.lignes > 1 ? 's' : ''} rangée${b.lignes > 1 ? 's' : ''} dans ${b.carnets} carnet${b.carnets > 1 ? 's' : ''}`;
    case 'modifiee': return '✓ Note modifiée, à l\'instant';
    case 'renomme': return '✓ Renommé';
    case 'note-supprimee': return 'Note supprimée';
    case 'carnet-supprime': return 'Carnet supprimé';
  }
}

/**
 * d1280-18 (R27, G21) : à son arrivée, le retour « … · Annuler » vient dans la zone visible, au-dessus du champ (`scroll-margin`,
 * carnets.css, lit `--cn-champ-h` et `--cn-clavier`). Une fois par apparition : le conteneur le monte avec la clé du retour, et la
 * réponse de l'IA qui ne fait que compléter le même retour ne le fait plus bouger (P8 : rien ne bouge sous le doigt).
 */
function useAmeneEnVue<T extends HTMLElement>(): React.RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof requestAnimationFrame !== 'function') { el.scrollIntoView?.({ block: 'nearest' }); return; }
    const id = requestAnimationFrame(() => el.scrollIntoView?.({ block: 'nearest' }));
    return () => cancelAnimationFrame(id);
  }, []);
  return ref;
}

export function Bandeau({ bandeau, onAnnuler, consequence, aideConsequence, enLigne, avis, detail }: {
  bandeau: BandeauV;
  onAnnuler: () => void;
  consequence?: ConsequenceV | null;
  /** `aides.consequence` : G26 ne paraît que s'il est vrai. */
  aideConsequence?: boolean;
  /** Rendu à la place de l'élément (note supprimée, carnet supprimé) : sans cadre vert. */
  enLigne?: boolean;
  /**
   * P22, P36 : l'IA n'a pas mis en forme (éteinte, hors ligne, en échec). L'avis se lit dans le bandeau même, picto local, sans roue :
   * une seule ligne d'état. `detail` : ce qui a été rangé, et où.
   */
  avis?: { sorte: 'eteint' | 'hors-ligne' | 'echec'; texte: string } | null;
  detail?: string;
}) {
  const b = bandeau;
  /* Critique 5, n° 24 : quand l'IA n'est pas passée, « ✓ Rangé ici » (ou « Lien rangé ici », « Photo rangée ici ») cède la tête du
     bandeau à l'avis : c'est lui qui dit l'état ; ce qui a été rangé, et où, suit en détail. « Carnet créé », « Rangé dans … » et « n lignes
     rangées » restent vrais et gardent leur tête, l'avis dessous. */
  const avisEnTete = !!avis && (b.sorte === 'range' || b.sorte === 'lien' || b.sorte === 'photo');
  const avecCoche = !avisEnTete && b.sorte !== 'note-supprimee' && b.sorte !== 'carnet-supprime' && b.sorte !== 'deuxieme';
  const texte = avisEnTete ? avis!.texte : texteBandeau(b).replace(/^✓ /, '');
  const ref = useAmeneEnVue<HTMLDivElement>();
  return (
    <div ref={ref} className={`cn-bandeau${enLigne ? ' cn-bandeau-ligne' : ''}${avis ? ' cnf-bandeau-avis' : ''}`} role="status" data-sorte={b.sorte} data-avis={avis?.sorte}>
      <div className="cn-bandeau-tete">
        {avisEnTete && (avis!.sorte === 'hors-ligne' ? <WifiOff size={18} aria-hidden /> : avis!.sorte === 'echec' ? <TriangleAlert size={18} aria-hidden className="cnf-avis-picto" /> : <Calculator size={18} aria-hidden />)}
        {avecCoche && <Check size={18} aria-hidden className="cn-ok" />}
        <span className="cn-sp">
          {avecCoche && <span className="cn-cache">✓ </span>}
          {texte}
          {b.sorte === 'renomme' && <span className="cn-mut"> · avant : {b.avant}</span>}
          {b.sorte === 'carnet-supprime' && <span> · <b>{b.titre}</b></span>}
        </span>
        <button type="button" className="cn-lien" onClick={onAnnuler}>
          {b.sorte === 'cree' && <Undo2 size={16} aria-hidden />} Annuler
        </button>
      </div>
      {b.sorte === 'cree' && <p className="cn-cite">« {b.phrase} » · {ORIGINE_TITRE[b.titreDe ?? 'phrase']}</p>}
      {b.sorte === 'lien' && (
        <p className="cnf-bandeau-lien">
          <span className="cn-mono cnf-lien-clair">{b.url.replace(/^https?:\/\//i, '').replace(/^www\./i, '')}</span>
          <a className="cn-lien cnf-ouvrir" href={b.url} target="_blank" rel="noopener noreferrer">Ouvrir ↗</a>
        </p>
      )}
      {avisEnTete && detail && <p className="cnf-avis cnf-avis-detail" data-avis={avis!.sorte}><span className="cn-sp">{detail}</span></p>}
      {avis && !avisEnTete && (
        <p className="cnf-avis" data-avis={avis.sorte}>
          {avis.sorte === 'hors-ligne' ? <WifiOff size={16} aria-hidden /> : avis.sorte === 'echec' ? <TriangleAlert size={16} aria-hidden /> : <Calculator size={16} aria-hidden />}
          <span className="cn-sp">{avis.texte}{detail ? <span className="cnf-avis-detail"> — {detail}</span> : null}</span>
        </p>
      )}
      {b.sorte === 'deuxieme' && b.faconsNees ? <p className="cn-mut">{b.faconsNees} façons nées des {b.faconsNees} articles</p> : null}
      {b.sorte === 'ailleurs' && b.article && (
        <p className="cn-bandeau-article">
          <b>{b.article.nom}</b>
          {(b.article.detail || b.article.exemple) && <span className="cn-mut"> · {b.article.detail}{b.article.exemple && <> <Provenance origine="exemple" /></>}</span>}
          {b.article.prix && <span> · <b className="cn-chiffre">{b.article.prix}</b></span>}
        </p>
      )}
      {b.sorte === 'ailleurs' && b.cite && <p className="cn-cite">votre message : « {b.cite} »</p>}
      {b.sorte === 'ailleurs' && (b.raison || b.onDeplacer) && (
        <div className="cn-bandeau-pied">
          {b.raison && <span className="cn-mut cn-sp"><Provenance origine="ia" /> {b.raison}</span>}
          {b.onDeplacer && <button type="button" className="cn-puce" onClick={b.onDeplacer}>Déplacer</button>}
        </div>
      )}
      {aideConsequence && consequence && (
        <div className="cn-consequence">
          <PictoLocal />
          <span className="cn-sp">{consequence.texte}</span>
          {consequence.onPasserCritere && <button type="button" className="cn-puce" onClick={consequence.onPasserCritere}>Passer en Ce qui compte</button>}
        </div>
      )}
    </div>
  );
}
