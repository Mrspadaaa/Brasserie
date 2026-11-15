import React from 'react';
import {
  Beer, ClipboardCopy, CloudOff, Database, Droplet, FileText, Hop, Lightbulb, MessageCircle, MessagesSquare, LoaderCircle,
  Package, Plus, Receipt, Tag, TrendingUp, UserPlus, Wheat, Wrench
} from 'lucide-react';
import type { FabIntent } from '../../domain/fabActions';
import type { PlusCle, PlusEntree, PlusMenu, PlusTon } from '../../domain/plusEcran';
import './navigation.css';

/**
 * Le contenu de la feuille du + (b1s-a « Deux étages ») : « Sur cet écran » à la couleur de la rubrique (l'action de
 * l'écran en plein, puis ses autres actions), « Partout » dessous (les gestes communs à cases fixes, le Compagnon en
 * sixième case). Au téléphone c'est une feuille posée au-dessus du + ; au 1280 la même matière en liste à lettres.
 *
 * Les tuiles de « Partout » au 390 portent le libellé court de b1s-a (« Écriture », « Facture », « Vente », « Recette », « Brassin ») ; au 1280 la ligne dit le libellé plein (« Encaisser une vente »).
 * Un geste commun déjà monté en tête garde sa case de « Partout », marquée ↑ et active : le brasseur retrouve toujours
 * la même grille (« certaines actions doivent toujours être possible »).
 */

const ICONES: Record<PlusCle, typeof Plus> = {
  ecriture: Receipt, facture: FileText, vente: TrendingUp, brassin: Beer, recette: Wheat, idee: Lightbulb,
  courses: ClipboardCopy, houblon: Hop, article: Package, fut: Database, client: UserPlus, tarif: Tag, materiel: Wrench, densite: Droplet
};

const ICONES_ECRAN: Record<FabIntent, typeof Plus> = {
  quickAction: Plus, newTransaction: Receipt, newBatch: Beer, newRecipe: Wheat, newIdea: Lightbulb,
  newStockItem: Package, newHopVariety: Hop, newKeg: Database, newEquipment: Wrench, newClient: UserPlus,
  newTarif: Tag, copyShoppingList: ClipboardCopy
};

/** Les classes sont écrites en entier : Tailwind ne lit pas les noms assemblés. */
const TON: Record<PlusTon, { texte: string; plein: string; doux: string }> = {
  finances: { texte: 'text-area-finances', plein: 'bg-area-finances/15 border-area-finances/50', doux: 'bg-area-finances/10 border-area-finances/30' },
  production: { texte: 'text-area-production', plein: 'bg-area-production/15 border-area-production/50', doux: 'bg-area-production/10 border-area-production/30' },
  stocks: { texte: 'text-area-stocks', plein: 'bg-area-stocks/15 border-area-stocks/50', doux: 'bg-area-stocks/10 border-area-stocks/30' },
  clients: { texte: 'text-cave-200', plein: 'bg-cave-850 border-cave-600', doux: 'bg-cave-900 border-cave-700' }
};

export interface PlusCompagnon {
  /** Hors connexion : l'état se lit ici, plus dans une pastille flottante. */
  horsConnexion: boolean;
  /** Réponses à lire. */
  attente: number;
  occupe: boolean;
  /** Ce dont parle le compagnon ici (écran ou page). */
  contexte: string;
  conversations: number;
}

interface Props {
  menu: PlusMenu;
  /** `feuille` : téléphone ; `liste` : 1280, avec les lettres de raccourci. */
  forme: 'feuille' | 'liste';
  compagnon: PlusCompagnon;
  onChoisir: (cle: PlusCle | 'ecran') => () => void;
  onCompagnon: () => void;
  onConversations: () => void;
}

const BOUTON = 'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cave-50 text-left';

const Zone: React.FC<{ titre: string; chemin?: string; ton: PlusTon; haut?: boolean }> = ({ titre, chemin, ton, haut }) => (
  <div className={`flex items-baseline justify-between gap-2 text-footnote text-cave-400 mx-0.5 ${haut ? 'mb-1.5' : 'mt-2.5 mb-1.5'}`}>
    <span>{titre}</span>
    {chemin && <em className={`not-italic font-semibold truncate ${TON[ton].texte}`}>{chemin}</em>}
  </div>
);

const Lettre: React.FC<{ lettre: string }> = ({ lettre }) => (
  <kbd aria-hidden="true" className="ml-auto shrink-0 font-mono text-footnote leading-[18px] min-w-5 px-1 text-center rounded border border-cave-700 bg-cave-900 text-cave-200">{lettre}</kbd>
);

/** « Sur cet écran » : l'action pleine, puis ses autres actions en rangées. */
function ZoneEcran({ menu, forme, onChoisir }: Pick<Props, 'menu' | 'forme' | 'onChoisir'>) {
  const { action, autres } = menu;
  if (!action && !autres.length) return null;
  const icone = action ? ICONES_ECRAN[action.intent] : null;
  const t = action ? TON[action.ton] : null;
  const Icone = icone;
  return (
    <>
      <Zone titre="Sur cet écran" chemin={menu.etat ? `${menu.chemin} · ${menu.etat}` : menu.chemin} ton={menu.ton} haut />
      {action && Icone && t && (
        <button type="button" role="menuitem" tabIndex={-1} onClick={onChoisir('ecran')}
          className={`${BOUTON} w-full flex items-center gap-2.5 border text-cave-50 ${t.plein} ${forme === 'feuille' ? 'h-[52px] px-3 rounded-[10px]' : 'h-10 px-2 rounded-[10px]'}`}>
          <Icone size={forme === 'feuille' ? 22 : 18} aria-hidden="true" className={`shrink-0 ${t.texte}`} />
          <span className={`font-semibold whitespace-nowrap ${forme === 'feuille' ? 'text-base' : 'text-sm'}`}>{action.label}</span>
          {action.hint && <span className="text-footnote text-cave-400 whitespace-nowrap truncate">{action.hint}</span>}
          <span className="flex-1" />
          {forme === 'liste' && <Lettre lettre="N" />}
        </button>
      )}
      {autres.map((e) => {
        const I = ICONES[e.cle];
        return (
          <button key={e.cle} type="button" role="menuitem" tabIndex={-1} onClick={onChoisir(e.cle)}
            className={`${BOUTON} w-full flex items-center gap-2.5 border text-cave-50 overflow-hidden whitespace-nowrap ${TON[e.ton].doux} ${action || e !== autres[0] ? 'mt-1.5' : ''} ${forme === 'feuille' ? 'h-11 px-3 rounded-[10px]' : 'h-[34px] px-2 rounded-[10px]'}`}>
            <I size={forme === 'feuille' ? 20 : 18} aria-hidden="true" className={`shrink-0 ${TON[e.ton].texte}`} />
            <span className="text-sm">{e.label}</span>
            {e.hint && <span className={`text-footnote text-cave-400 truncate ${forme === 'feuille' ? 'ml-auto' : ''}`}>{e.hint}</span>}
            {forme === 'liste' && <Lettre lettre={e.lettre} />}
          </button>
        );
      })}
    </>
  );
}

/** Une ligne de « Partout » au 1280 : icône, libellé, précision, ↑ si monté, lettre. */
function Ligne({ e, onChoisir }: { e: PlusEntree; onChoisir: Props['onChoisir'] }) {
  const I = ICONES[e.cle];
  return (
    <button type="button" role="menuitem" tabIndex={-1} onClick={onChoisir(e.cle)}
      className={`${BOUTON} w-full flex items-center gap-2.5 h-[34px] px-2 rounded-[10px] text-cave-50 text-sm hover:bg-cave-850`}>
      <I size={18} aria-hidden="true" className={`shrink-0 ${TON[e.ton].texte}`} />
      <span>{e.label}</span>
      {e.hint && <span className="text-footnote text-cave-400 truncate">{e.hint}</span>}
      <span className="ml-auto inline-flex"><Lettre lettre={e.lettre} /></span>
    </button>
  );
}

/** Une case de « Partout » au téléphone : la grille 3 × 2 ne change jamais d'un écran à l'autre. */
function Case({ e, onChoisir }: { e: PlusEntree; onChoisir: Props['onChoisir'] }) {
  const I = ICONES[e.cle];
  return (
    <button type="button" role="menuitem" tabIndex={-1} onClick={onChoisir(e.cle)} aria-label={e.hint ? `${e.label}, ${e.hint}` : e.label}
      className={`${BOUTON} relative min-h-[68px] px-2 py-[7px] rounded-[10px] bg-cave-900 border border-cave-800 text-cave-50 flex flex-col gap-[3px] overflow-hidden leading-[1.15]`}>
      <span className="flex items-center justify-between">
        <I size={20} aria-hidden="true" className={`shrink-0 ${TON[e.ton].texte}`} />
      </span>
      <span className="text-sm">{e.court ?? e.label}</span>
      {e.hint && <span className="text-footnote leading-[14px] text-cave-400 truncate">{e.hint}</span>}
    </button>
  );
}

function Compagnon({ forme, compagnon, onCompagnon, onConversations }: Pick<Props, 'forme' | 'compagnon' | 'onCompagnon' | 'onConversations'>) {
  const Icone = compagnon.occupe ? LoaderCircle : MessageCircle;
  const etat = compagnon.horsConnexion;
  const nom = `Compagnon brasseur${etat ? ', hors connexion' : ''} · ${compagnon.contexte}`;
  return (
    <>
      {forme === 'feuille' ? (
        <button type="button" role="menuitem" tabIndex={-1} onClick={onCompagnon} aria-label={nom}
          className={`${BOUTON} relative min-h-[68px] px-2 py-[7px] rounded-[10px] bg-cave-900 border border-cave-800 text-cave-50 flex flex-col gap-[3px] overflow-hidden leading-[1.15]`}>
          <span className="flex items-center justify-between">
            <Icone size={20} aria-hidden="true" className={`shrink-0 text-cave-400 ${compagnon.occupe ? 'motion-safe:animate-spin' : ''}`} />
            {!!compagnon.attente && (
              <span className="shrink-0 min-w-4 px-1 rounded-full bg-attention text-cave-950 font-mono text-footnote leading-4 font-semibold text-center">{compagnon.attente}</span>
            )}
          </span>
          <span className="text-sm">Compagnon</span>
          <span className="flex items-center gap-1 text-footnote leading-[14px] text-cave-400">
            {etat && <CloudOff size={12} aria-hidden="true" className="shrink-0" />}
            <span className="truncate">{etat ? 'hors connexion' : compagnon.contexte}</span>
          </span>
        </button>
      ) : (
        <button type="button" role="menuitem" tabIndex={-1} onClick={onCompagnon} aria-label={nom}
          className={`${BOUTON} w-full flex items-center gap-2.5 h-[34px] px-2 rounded-[10px] text-cave-50 text-sm hover:bg-cave-850`}>
          <Icone size={18} aria-hidden="true" className={`shrink-0 text-cave-400 ${compagnon.occupe ? 'motion-safe:animate-spin' : ''}`} />
          <span>Compagnon brasseur</span>
          <span className="ml-auto flex items-center gap-1 text-footnote text-cave-400">
            {etat && <CloudOff size={14} aria-hidden="true" />}
            {etat ? 'hors connexion' : compagnon.contexte}
          </span>
          {!!compagnon.attente && (
            <span className="shrink-0 min-w-4 px-1 rounded-full bg-attention text-cave-950 font-mono text-footnote leading-4 font-semibold text-center">{compagnon.attente}</span>
          )}
          <Lettre lettre="C" />
        </button>
      )}
      {compagnon.conversations > 0 && forme === 'liste' && (
        <button type="button" role="menuitem" tabIndex={-1} onClick={onConversations}
          className={`${BOUTON} w-full flex items-center gap-2 h-9 px-2.5 text-cave-200 text-sm rounded-[10px] hover:bg-cave-850`}>
          <MessagesSquare size={16} aria-hidden="true" className="shrink-0 text-cave-400" />
          Mes conversations · {compagnon.conversations}
        </button>
      )}
    </>
  );
}

export const PlusSheet: React.FC<Props> = ({ menu, forme, compagnon, onChoisir, onCompagnon, onConversations }) => {
  /* b1s-a : « Partout » = les communes moins celle déjà montée en tête (pas de doublon). Sa lettre reste active (`lettresActives`). */
  const partout = menu.partout.filter((e) => !e.monte);
  const enTete = !!menu.action || menu.autres.length > 0;
  return (
    <>
      <ZoneEcran menu={menu} forme={forme} onChoisir={onChoisir} />
      <Zone titre="Partout" ton={menu.ton} haut={!enTete} />
      {forme === 'feuille' ? (
        <div className="grid grid-cols-3 gap-1.5">
          {partout.map((e) => <Case key={e.cle} e={e} onChoisir={onChoisir} />)}
          <Compagnon forme={forme} compagnon={compagnon} onCompagnon={onCompagnon} onConversations={onConversations} />
        </div>
      ) : (
        <>
          {partout.map((e) => <Ligne key={e.cle} e={e} onChoisir={onChoisir} />)}
          <Compagnon forme={forme} compagnon={compagnon} onCompagnon={onCompagnon} onConversations={onConversations} />
        </>
      )}
      {forme === 'feuille' && compagnon.conversations > 0 && (
        <button type="button" role="menuitem" tabIndex={-1} onClick={onConversations}
          className={`${BOUTON} mt-1.5 w-full flex items-center gap-2 h-9 px-2.5 text-cave-200 text-sm rounded-[10px] hover:bg-cave-850`}>
          <MessagesSquare size={16} aria-hidden="true" className="shrink-0 text-cave-400" />
          Mes conversations · {compagnon.conversations}
        </button>
      )}
    </>
  );
};
