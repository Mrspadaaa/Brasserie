import React from 'react';
import {
  Beer, Calculator, ClipboardCopy, CloudOff, Copy, Database, Download, Droplet, FileText, FlaskConical, Hop, Lightbulb, MessageCircle, MessagesSquare, LoaderCircle,
  Package, Pencil, Plus, Receipt, Save, Tag, Trash2, TrendingUp, UserPlus, Wheat, Wrench
} from 'lucide-react';
import type { FabIntent } from '../../domain/fabActions';
import type { PlusCle, PlusEntree, PlusMenu, PlusTon } from '../../domain/plusEcran';
import { libelleCourt, type PlusPageAction, type PlusPageDeclaration, type PlusPageGenre } from '../../ui/plusPage';
import './navigation.css';

/**
 * Le contenu du menu du + (b1s-b2 « La pile au pouce », choisi le 15.11 : « Ça j'aime énormément, à améliorer et
 * implémenter »). Pas de feuille : les actions montent du + en pilules alignées à droite.
 *  - contre le + : l'action de l'écran, pleine, à la couleur de sa rubrique (56 px) ;
 *  - au-dessus : ses autres actions (48 px, larges), sous un « Sur <écran> » ;
 *  - plus haut : « Partout », les gestes communs en deux colonnes de pilules de 44 px, ordre figé, le Compagnon en dernier.
 *    Un geste commun déjà monté en tête n'est pas répété ; sa lettre reste active (`lettresActives`). Un nombre impair de pilules
 *    laisse la première seule en haut à droite.
 * Un seul libellé par geste commun, aux deux largeurs (pilote, 16.11 : « Nouvelle écriture » au 1280 et « Écriture » au 390 se
 * contredisaient) : « Écriture », « Facture », « Vente », « Recette », « Brassin » ; au 1280 les pilules gagnent leur lettre de raccourci.
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

const ICONES_PAGE: Record<PlusPageGenre, typeof Plus> = {
  ajouter: Plus, enregistrer: Save, exporter: Download, supprimer: Trash2, brasser: FlaskConical, modifier: Pencil, dupliquer: Copy
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
  /** Ce que la page plein écran ouverte met en tête (`usePlusPage`, b1r) ; absent : rien de plus. */
  page?: PlusPageDeclaration | null;
  /** Lance un geste de la page, menu refermé. */
  onPage?: (lancer: () => void) => () => void;
  onCompagnon: () => void;
  onConversations: () => void;
  /** `deux-blocs` : téléphone couché, une page à beaucoup de gestes (le calendrier) ; « Partout » et « Sur … » côte à côte. Absent : la pile. */
  disposition?: 'pile' | 'deux-blocs';
}

/** La couleur de rubrique d'une pilule : une classe, qui pose `--tc` (`navigation.css`). */
const TON: Record<PlusTon | 'neutre', string> = {
  finances: 'plus-ton-finances', production: 'plus-ton-production', stocks: 'plus-ton-stocks',
  clients: 'plus-ton-clients', neutre: 'plus-ton-neutre'
};

/** « Brassins › Recettes » → « Recettes » : la pile nomme l'écran, pas son chemin. */
const nomEcran = (chemin: string) => chemin.split(' › ').pop() ?? '';

const Lettre: React.FC<{ lettre: string }> = ({ lettre }) => <kbd aria-hidden="true">{lettre}</kbd>;

const Pastille: React.FC<{ Icone: React.ComponentType<{ size?: number; className?: string }>; spin?: boolean }> = ({ Icone, spin }) => (
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

/** Une action de la page ouverte (l'assistant, la page d'une recette) : pilule large, teinte de Brassins, comme les autres actions de l'écran ;
 *  « Supprimer » : bord et icône rouges (comme le bouton du bas de la page de la recette). */
function ActionDeLaPage({ a, onPage }: { a: PlusPageAction; onPage: NonNullable<Props['onPage']> }) {
  const Icone = a.icone ?? ICONES_PAGE[a.genre];
  /* une page qui a ses couleurs (le calendrier : une couleur de zone par rangée) les pose sur la ligne par `--tc` */
  const style = a.couleur ? ({ ['--tc' as string]: a.couleur } as React.CSSProperties) : undefined;
  if (a.plein) {
    /* passe 10 : le libellé, puis sa précision dessous (« S47 · prête le 14 déc. ») ; la précision passe à la ligne plutôt que de perdre sa date */
    return (
      <button type="button" role="menuitem" tabIndex={-1} data-page-action={a.id} onClick={onPage(a.lancer)} style={style}
        className={`plus-pp plus-pp--pi ${TON.production}${a.hint ? ' !h-auto min-h-14 py-1.5' : ''}`}>
        {a.hint
          ? <span className="flex min-w-0 flex-col items-start leading-tight"><b>{a.label}</b><small className="!overflow-visible !whitespace-normal" data-plus-precision>{a.hint}</small></span>
          : <b>{a.label}</b>}
        <span className="plus-pp-i" aria-hidden="true"><Icone size={22} /></span>
      </button>
    );
  }
  return (
    <button type="button" role="menuitem" tabIndex={-1} data-page-action={a.id} onClick={onPage(a.lancer)} style={style}
      className={`plus-pp plus-pp--ps ${TON.production}${a.genre === 'supprimer' ? ' plus-pp--danger' : ''}`}>
      <span className="plus-pp-t">{a.label}</span>
      {a.hint && <small>{a.hint}</small>}
      <Pastille Icone={Icone} />
    </button>
  );
}

/** Une case de la pile en deux blocs (l-clair-ouvert, paysage) : le nom court (« Fête »), sa couleur ; le nom accessible reste le libellé entier. */
function CaseDeLaPage({ a, onPage }: { a: PlusPageAction; onPage: NonNullable<Props['onPage']> }) {
  const Icone = a.icone ?? ICONES_PAGE[a.genre];
  const style = a.couleur ? ({ ['--tc' as string]: a.couleur } as React.CSSProperties) : undefined;
  const precision = a.precisionEnCase && a.hint ? a.hint : null;
  return (
    <button type="button" role="menuitem" tabIndex={-1} data-page-action={a.id} onClick={onPage(a.lancer)} style={style} aria-label={precision ? `${a.label} ${precision}` : a.label}
      className={`plus-pp plus-pp--ps ${precision ? '!h-auto min-h-10 py-1' : '!h-10'} ${TON.production}`}>
      {precision
        ? <span className="flex min-w-0 flex-col items-start leading-tight"><span className="plus-pp-t">{libelleCourt(a)}</span><small className="!overflow-visible !whitespace-normal" data-plus-precision>{precision}</small></span>
        : <span className="plus-pp-t">{libelleCourt(a)}</span>}
      <Pastille Icone={Icone} />
    </button>
  );
}

/** « Aller à » : une pastille par étape, à la suite, l'étape courante marquée (`aria-current`). */
function AllerA({ etapes, onPage }: { etapes: NonNullable<PlusPageDeclaration['etapes']>; onPage: NonNullable<Props['onPage']> }) {
  return (
    <div className="plus-pile-etapes" role="group" aria-label="Aller à une étape" data-page-etapes>
      <span className="plus-pile-etapes-t" aria-hidden="true">Aller à</span>
      {etapes.options.map((o, i) => (
        <button key={o.id} type="button" role="menuitem" tabIndex={-1} aria-label={`Étape ${i + 1}, ${o.label}`}
          aria-current={o.id === etapes.courant ? 'step' : undefined} onClick={onPage(() => etapes.aller(o.id))}
          className={`plus-chip ${TON.production}`}>{o.court ?? o.label}</button>
      ))}
    </div>
  );
}

/** Une pilule de « Partout » : un seul libellé par geste, le même aux deux largeurs (16.11) ; au 1280 il gagne sa lettre. */
function Commun({ e, forme, seule, onChoisir, bas }: { e: PlusEntree; forme: Props['forme']; seule: boolean; onChoisir: Props['onChoisir']; bas?: boolean }) {
  return (
    <button type="button" role="menuitem" tabIndex={-1} onClick={onChoisir(e.cle)}
      aria-label={`${e.hint ? `${e.court ?? e.label}, ${e.hint}` : (e.court ?? e.label)}${e.monte ? ', aussi en tête de la pile' : ''}`}
      className={`plus-pp ${TON[e.ton]} ${seule ? 'plus-pp--seule' : ''} ${e.monte ? 'plus-pp--renvoi' : ''}${bas ? ' !h-10' : ''}`}>
      <span className="plus-pp-t">{e.court ?? e.label}</span>
      {e.monte && <span className="plus-pp-r" aria-hidden="true">↑</span>}
      {forme === 'liste' && <Lettre lettre={e.lettre} />}
      <Pastille Icone={ICONES[e.cle]} />
    </button>
  );
}

function Compagnon({ forme, compagnon, onCompagnon, seule, bas }: Pick<Props, 'forme' | 'compagnon' | 'onCompagnon'> & { seule: boolean; bas?: boolean }) {
  const etat = compagnon.horsConnexion;
  const nom = `Compagnon brasseur${etat ? ', hors connexion' : ''} · ${compagnon.contexte}`;
  return (
    <button type="button" role="menuitem" tabIndex={-1} onClick={onCompagnon} aria-label={nom}
      className={`plus-pp ${TON.neutre} ${seule ? 'plus-pp--seule' : ''}${bas ? ' !h-10' : ''}`}>
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

export const PlusSheet: React.FC<Props> = ({ menu, forme, compagnon, onChoisir, page, onPage, onCompagnon, onConversations, disposition = 'pile' }) => {
  /* « Partout » : toujours les mêmes gestes, dans le même ordre, sur tous les écrans (BUGS 34, 16.11). Un geste déjà monté en tête garde sa case, marquée ↑. */
  const partout = menu.partout;
  const avecLettre = forme === 'liste';
  /* b1s-b2 nomme « Sur Clients » le carnet (la rubrique) ; les autres sous-écrans portent leur nom (Recettes, Courses, Fûts…). */
  const pageOuverte = page && onPage ? page : null;
  const nom = pageOuverte ? pageOuverte.titre : menu.ecran === 'clients' ? 'Clients' : nomEcran(menu.chemin);
  const enTete = !!menu.action || menu.autres.length > 0 || !!pageOuverte;
  /* Les pilules de « Partout » + le Compagnon : un nombre impair laisse la première seule, en haut à droite. */
  const impair = (partout.length + 1) % 2 === 1;
  const grillePartout = (bas: boolean) => (
    <div className="plus-pile-grille" data-zone="partout">
      {partout.map((e, i) => <Commun key={e.cle} e={e} forme={forme} seule={impair && i === 0} onChoisir={onChoisir} bas={bas} />)}
      <Compagnon forme={forme} compagnon={compagnon} onCompagnon={onCompagnon} seule={impair && partout.length === 0} bas={bas} />
      {compagnon.conversations > 0 && (
        <button type="button" role="menuitem" tabIndex={-1} onClick={onConversations} className="plus-pp plus-pp--large">
          <MessagesSquare size={16} aria-hidden="true" className="shrink-0 text-cave-400" />
          <span className="plus-pp-t">Mes conversations · {compagnon.conversations}</span>
        </button>
      )}
    </div>
  );

  /* l-clair-ouvert (passe 10, paysage) : quand la hauteur manque, deux blocs côte à côte, rien coupé en haut. À droite, contre le +,
     « Sur <page> » : ses gestes en cases de deux colonnes, le plein en bas ; à gauche, « Partout ». L'ordre du DOM garde le plein en
     premier (focus à l'ouverture), puis les cases, puis « Partout ». */
  if (disposition === 'deux-blocs' && pageOuverte && onPage) {
    const pleins = pageOuverte.actions.filter(a => a.plein);
    const cases = pageOuverte.actions.filter(a => !a.plein);
    return (
      <>
        <div className="flex min-w-0 flex-1 flex-col-reverse gap-1.5" data-bloc="ecran">
          <ActionPleine menu={menu} avecLettre={avecLettre} onChoisir={onChoisir} />
          {pleins.map((a) => <ActionDeLaPage key={a.id} a={a} onPage={onPage} />)}
          <div className="plus-pile-grille" data-zone="ecran-cases">
            {cases.map((a, i) => (
              <div key={a.id} className={cases.length % 2 === 1 && i === cases.length - 1 ? 'col-start-2' : undefined}><CaseDeLaPage a={a} onPage={onPage} /></div>
            ))}
          </div>
          {menu.autres.map((e) => <ActionDeLEcran key={e.cle} e={e} avecLettre={avecLettre} onChoisir={onChoisir} />)}
          <span className="plus-pile-zone" data-zone="ecran">Sur <em className={TON[menu.ton]}>{nom || 'cette page'}</em></span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col-reverse gap-1.5" data-bloc="partout">
          {grillePartout(true)}
          <span className="plus-pile-zone" data-zone="partout-titre">Partout</span>
        </div>
      </>
    );
  }

  return (
    <>
      <ActionPleine menu={menu} avecLettre={avecLettre} onChoisir={onChoisir} />
      {menu.autres.map((e) => <ActionDeLEcran key={e.cle} e={e} avecLettre={avecLettre} onChoisir={onChoisir} />)}
      {pageOuverte && onPage && pageOuverte.actions.map((a) => <ActionDeLaPage key={a.id} a={a} onPage={onPage} />)}
      {pageOuverte && onPage && pageOuverte.etapes && <AllerA etapes={pageOuverte.etapes} onPage={onPage} />}
      {enTete
        ? <span className="plus-pile-zone" data-zone="ecran">Sur <em className={TON[menu.ton]}>{nom || 'cette page'}</em></span>
        : nom && <span className="plus-pile-zone" data-zone="ecran">{nom} · rien à créer, le commun reste</span>}
      {grillePartout(false)}
      <span className="plus-pile-zone" data-zone="partout-titre">Partout</span>
    </>
  );
};
