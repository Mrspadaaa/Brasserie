import React from 'react';
import {
  Beer, Calculator, ClipboardCopy, CloudOff, Database, Droplet, FileText, Hop, Lightbulb, MessageCircle, MessagesSquare, LoaderCircle,
  Package, Plus, Receipt, Tag, TrendingUp, UserPlus, Wheat, Wrench
} from 'lucide-react';
import type { FabIntent } from '../../domain/fabActions';
import type { PlusCle, PlusEntree, PlusMenu, PlusTon } from '../../domain/plusEcran';
import './navigation.css';

/**
 * Le contenu du menu du + (b1s-b2 « La pile au pouce », choisi le 15.11 : « Ça j'aime énormément, à améliorer et
 * implémenter »). Pas de feuille : les actions montent du + en pilules alignées à droite.
 *  - contre le + : l'action de l'écran, pleine, à la couleur de sa rubrique (56 px) ;
 *  - au-dessus : ses autres actions (48 px, larges), sous un « Sur <écran> » ;
 *  - plus haut : « Partout », les gestes communs en deux colonnes de pilules de 44 px, ordre figé, le Compagnon en dernier.
 *    Un geste commun déjà monté en tête n'est pas répété ; sa lettre reste active (`lettresActives`). Un nombre impair de pilules
 *    laisse la première seule en haut à droite.
 * Au 1280 les mêmes pilules portent leur libellé plein et leur lettre de raccourci ; au 390 le libellé court de la maquette
 * (« Écriture », « Facture », « Vente », « Recette », « Brassin »).
 *
 * Ordre du DOM = ordre de la pile lue depuis le + (`column-reverse`) : l'action de l'écran est la première entrée du menu
 * (focus à l'ouverture, ↓ vers les autres puis « Partout »), alors qu'elle s'affiche en bas, contre le pouce.
 */

const ICONES: Record<PlusCle, typeof Plus> = {
  ecriture: Receipt, facture: FileText, vente: TrendingUp, brassin: Beer, recette: Wheat, idee: Lightbulb,
  courses: ClipboardCopy, estimer: Calculator, houblon: Hop, article: Package, fut: Database, client: UserPlus, tarif: Tag, materiel: Wrench, densite: Droplet
};

const ICONES_ECRAN: Record<FabIntent, typeof Plus> = {
  quickAction: Plus, newTransaction: Receipt, newBatch: Beer, newRecipe: Wheat, newIdea: Lightbulb,
  newStockItem: Package, newHopVariety: Hop, newKeg: Database, newEquipment: Wrench, newClient: UserPlus,
  newTarif: Tag, copyShoppingList: ClipboardCopy
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

/** La couleur de rubrique d'une pilule : une classe, qui pose `--tc` (`navigation.css`). */
const TON: Record<PlusTon | 'neutre', string> = {
  finances: 'plus-ton-finances', production: 'plus-ton-production', stocks: 'plus-ton-stocks',
  clients: 'plus-ton-clients', neutre: 'plus-ton-neutre'
};

/** « Brassins › Recettes » → « Recettes » : la pile nomme l'écran, pas son chemin. */
const nomEcran = (chemin: string) => chemin.split(' › ').pop() ?? '';

const Lettre: React.FC<{ lettre: string }> = ({ lettre }) => <kbd aria-hidden="true">{lettre}</kbd>;

const Pastille: React.FC<{ Icone: typeof Plus; spin?: boolean }> = ({ Icone, spin }) => (
  <span className="plus-pp-i" aria-hidden="true">
    <Icone size={18} className={spin ? 'motion-safe:animate-spin' : undefined} />
  </span>
);

/** L'action de l'écran, pleine, contre le +. */
function ActionPleine({ menu, avecLettre, onChoisir }: { menu: PlusMenu; avecLettre: boolean; onChoisir: Props['onChoisir'] }) {
  const { action } = menu;
  if (!action) return null;
  const Icone = ICONES_ECRAN[action.intent];
  return (
    <button type="button" role="menuitem" tabIndex={-1} onClick={onChoisir('ecran')} className={`plus-pp plus-pp--pi ${TON[action.ton]}`}>
      <b>{action.label}</b>
      {action.hint && <small>{action.hint}</small>}
      {avecLettre && <Lettre lettre="N" />}
      <span className="plus-pp-i" aria-hidden="true"><Icone size={22} /></span>
    </button>
  );
}

/** Une autre action de l'écran : pilule large, teinte de sa rubrique. */
function ActionDeLEcran({ e, avecLettre, onChoisir }: { e: PlusEntree; avecLettre: boolean; onChoisir: Props['onChoisir'] }) {
  return (
    <button type="button" role="menuitem" tabIndex={-1} onClick={onChoisir(e.cle)} className={`plus-pp plus-pp--ps ${TON[e.ton]}`}>
      <span className="plus-pp-t">{e.label}</span>
      {e.hint && <small>{e.hint}</small>}
      {avecLettre && <Lettre lettre={e.lettre} />}
      <Pastille Icone={ICONES[e.cle]} />
    </button>
  );
}

/** Une pilule de « Partout » : libellé court au téléphone, plein au 1280 (avec sa lettre). */
function Commun({ e, forme, seule, onChoisir }: { e: PlusEntree; forme: Props['forme']; seule: boolean; onChoisir: Props['onChoisir'] }) {
  return (
    <button type="button" role="menuitem" tabIndex={-1} onClick={onChoisir(e.cle)}
      aria-label={`${e.hint ? `${e.label}, ${e.hint}` : e.label}${e.monte ? ', aussi en tête de la pile' : ''}`}
      className={`plus-pp ${TON[e.ton]} ${seule ? 'plus-pp--seule' : ''} ${e.monte ? 'plus-pp--renvoi' : ''}`}>
      <span className="plus-pp-t">{forme === 'liste' ? e.label : (e.court ?? e.label)}</span>
      {e.monte && <span className="plus-pp-r" aria-hidden="true">↑</span>}
      {forme === 'liste' && <Lettre lettre={e.lettre} />}
      <Pastille Icone={ICONES[e.cle]} />
    </button>
  );
}

function Compagnon({ forme, compagnon, onCompagnon, seule }: Pick<Props, 'forme' | 'compagnon' | 'onCompagnon'> & { seule: boolean }) {
  const etat = compagnon.horsConnexion;
  const nom = `Compagnon brasseur${etat ? ', hors connexion' : ''} · ${compagnon.contexte}`;
  return (
    <button type="button" role="menuitem" tabIndex={-1} onClick={onCompagnon} aria-label={nom}
      className={`plus-pp ${TON.neutre} ${seule ? 'plus-pp--seule' : ''}`}>
      <span className="plus-pp-t">Compagnon</span>
      {etat && (
        <small title="hors connexion"><CloudOff size={14} aria-hidden="true" /><span className="sr-only">hors connexion</span></small>
      )}
      {!!compagnon.attente && <span className="plus-pp-n">{compagnon.attente}</span>}
      {forme === 'liste' && <Lettre lettre="C" />}
      <Pastille Icone={compagnon.occupe ? LoaderCircle : MessageCircle} spin={compagnon.occupe} />
    </button>
  );
}

export const PlusSheet: React.FC<Props> = ({ menu, forme, compagnon, onChoisir, onCompagnon, onConversations }) => {
  /* « Partout » : toujours les mêmes gestes, dans le même ordre, sur tous les écrans (BUGS 34, 16.11). Un geste déjà monté en tête garde sa case, marquée ↑. */
  const partout = menu.partout;
  const avecLettre = forme === 'liste';
  /* b1s-b2 nomme « Sur Clients » le carnet (la rubrique) ; les autres sous-écrans portent leur nom (Recettes, Courses, Fûts…). */
  const nom = menu.ecran === 'clients' ? 'Clients' : nomEcran(menu.chemin);
  const enTete = !!menu.action || menu.autres.length > 0;
  /* Les pilules de « Partout » + le Compagnon : un nombre impair laisse la première seule, en haut à droite. */
  const impair = (partout.length + 1) % 2 === 1;
  return (
    <>
      <ActionPleine menu={menu} avecLettre={avecLettre} onChoisir={onChoisir} />
      {menu.autres.map((e) => <ActionDeLEcran key={e.cle} e={e} avecLettre={avecLettre} onChoisir={onChoisir} />)}
      {enTete
        ? <span className="plus-pile-zone" data-zone="ecran">Sur <em className={TON[menu.ton]}>{nom || 'cette page'}</em></span>
        : nom && <span className="plus-pile-zone" data-zone="ecran">{nom} · rien à créer, le commun reste</span>}
      <div className="plus-pile-grille" data-zone="partout">
        {partout.map((e, i) => <Commun key={e.cle} e={e} forme={forme} seule={impair && i === 0} onChoisir={onChoisir} />)}
        <Compagnon forme={forme} compagnon={compagnon} onCompagnon={onCompagnon} seule={impair && partout.length === 0} />
        {compagnon.conversations > 0 && (
          <button type="button" role="menuitem" tabIndex={-1} onClick={onConversations} className="plus-pp plus-pp--large">
            <MessagesSquare size={16} aria-hidden="true" className="shrink-0 text-cave-400" />
            <span className="plus-pp-t">Mes conversations · {compagnon.conversations}</span>
          </button>
        )}
      </div>
      <span className="plus-pile-zone" data-zone="partout-titre">Partout</span>
    </>
  );
};
