// Les contrôles de la pièce (`src/domain/finance/controlesPiece.ts`, voie c1) mis en rangées du bloc de contrôles (`controlesCroises.ts`, voie t1) : pur, aucun React.
// Chaque rangée dit ses deux valeurs (« 23 / 29 »), son verdict et, quand elle échoue, son geste : la pastille d'erreur mène au geste (règle du brasseur, 09.11 : « on appuie et ça fait un renvoi sur l'action du besoin »).
// Règles : un contrôle non vérifiable (`ok === null`) n'est ni vert ni rouge : il n'a pas de rangée (la rangée « Articles » et la rangée « Payé » de t1 disent déjà « non imprimé » et « montant non lu ») ;
// le comptage des montants et le paiement vivent déjà dans les rangées « Articles » et « Payé » (mêmes valeurs, mêmes gestes) : ils ne sont pas répétés ici, le paiement ajoute sa note.
import type { ControleId, ControlePiece, Geste } from '../../domain/finance/controlesPiece';
import type { RangControle, Renvoi } from './controlesCroises';

const premierEntier = (s: string): number | null => { const m = /^\s*(\d+)/.exec(s); return m ? Number(m[1]) : null; };
const pluriel = (n: number, un: string, plusieurs = `${un}s`) => `${n} ${n > 1 ? plusieurs : un}`;

/** Le geste du contrôle, vu par l'écran : vers où mène la pastille. */
export function renvoiDuGeste(g: Geste): Renvoi {
  switch (g.type) {
    case 'ajouter': case 'rechercher': return 'manquante';
    case 'ouvrir-ligne': return g.lignes?.length ? 'lignes' : 'fausse';
    case 'relire-photo': return 'photo';
    case 'saisir-autre': return 'total';
    case 'voir-doublon': return 'doublon';
    default: return 'liste';
  }
}

const TEXTES: Partial<Record<ControleId, string>> = {
  'comptage-ean': 'Codes EAN', 'cle-ean': 'Clé EAN', 'brut-rabais': 'Brut − rabais', 'tva-par-taux': 'TVA recalculée', doublon: 'Pièce déjà saisie ?',
  'hors-articles': 'Lignes hors articles', 'prix-plausible': 'Prix connus', 'photo-incomplete': 'Photo',
};

/** Les deux valeurs comparées, en peu de signes ; le texte entier (`trouve`) reste dans `detail`. */
function valeursDe(c: ControlePiece): string {
  const ko = c.ok === false, n = c.ecart ?? 0;
  switch (c.id) {
    case 'comptage-ean': return `${premierEntier(c.trouve) ?? '?'} / ${premierEntier(c.attendu) ?? '?'}`;
    case 'cle-ean': return ko ? pluriel(n, 'invalide') : 'toutes valides';
    case 'brut-rabais': {
      const net = /=\s*(\d+,\d{2})\s*$/.exec(c.trouve)?.[1], total = /(\d+,\d{2})/.exec(c.attendu)?.[1];
      return net && total ? `${net} / ${total}` : c.trouve;
    }
    case 'tva-par-taux': {
      const lignes = [...c.trouve.matchAll(/(\d+,\d{2}) imprimée, (\d+,\d{2}) recalculée/g)];
      return lignes.length === 1 ? `${lignes[0][1]} / ${lignes[0][2]}` : lignes.length > 1 ? pluriel(lignes.length, 'taux', 'taux') : '—';
    }
    case 'doublon': return ko ? (/heure non comparable/.test(c.trouve) ? 'probable' : 'identique') : 'aucune';
    case 'hors-articles': return ko ? pluriel(n, 'ligne') : c.trouve.startsWith('aucune') ? 'aucune' : `${premierEntier(c.trouve) ?? 0} écartée${(premierEntier(c.trouve) ?? 0) > 1 ? 's' : ''}`;
    case 'prix-plausible': return ko ? `${pluriel(n, 'ligne')} à revoir` : `${premierEntier(c.trouve) ?? 0} comparé${(premierEntier(c.trouve) ?? 0) > 1 ? 's' : ''}`;
    case 'photo-incomplete': return ko ? 'incomplète' : 'lisible';
    default: return '';
  }
}

/** Ce que la lecture a trouvé, sans répéter le titre de la rangée : la photo ne garde que la remarque de la lecture (« bas du ticket taché »). */
function detailDe(c: ControlePiece): string | undefined {
  if (c.id !== 'photo-incomplete') return c.trouve;
  return c.trouve.replace(/^zone des montants coupée, pliée ou tachée\s*:?\s*/, '') || undefined;
}
/** Le geste, sans répéter le titre de la rangée (« Photo incomplète : reprendre… » sous « Photo · incomplète »). */
const gesteDe = (c: ControlePiece): string => (c.id === 'photo-incomplete' ? c.geste.libelle.replace(/^Photo incomplète\s*:\s*/, '').replace(/^./, m => m.toUpperCase()) : c.geste.libelle);

/** Un écart en CHF s'écrit « +2,50 » / « −2,50 » ; un nombre de lignes ou de codes « −6 » / « +1 » (le signe dit le côté : `manque` ↔ moins). */
function ecartDe(c: ControlePiece): string | undefined {
  if (c.ok !== false || c.ecart === undefined) return undefined;
  const s = c.sens === 'exces' ? '+' : c.sens === 'manque' ? '−' : '';
  return c.unite === 'CHF' ? `${s}${c.ecart.toFixed(2).replace('.', ',')}` : c.id === 'comptage-ean' ? `${s}${c.ecart}` : undefined;
}

/**
 * Les rangées de la pièce : les contrôles vérifiables hors comptage des montants et paiement (déjà dans « Articles » et « Payé »). `nRemises` : le brut − rabais ne s'ajoute que s'il y a des remises
 * (sinon il redit « Somme = imprimé »), et jamais quand il échoue pour la même raison que la somme (`sommeEnEcart`).
 */
export function rangsDePiece(liste: readonly ControlePiece[], o: { nRemises: number; sommeEnEcart: boolean }): RangControle[] {
  const rangs: RangControle[] = [], discrets: ControlePiece[] = [];
  for (const c of liste) {
    const texte = TEXTES[c.id];
    if (!texte || c.ok === null) continue;
    /* Un « aucun doublon » n'apprend rien au brasseur : la rangée n'existe que si une pièce identique est trouvée. */
    if (c.id === 'doublon' && c.ok === true) continue;
    if (c.id === 'brut-rabais' && (o.nRemises === 0 || (c.ok === false && o.sommeEnEcart))) continue;
    const ko = c.ok === false;
    /* Un taux de 0 % : « 0,00 / 0,00 » ne dit rien. */
    if (c.id === 'tva-par-taux' && !ko && valeursDe(c) === '0,00 / 0,00') continue;
    /* Les contrôles « rien à signaler » sans deux valeurs à montrer (lignes hors articles, photo, clé EAN) se rangent sur UNE ligne : seuls ceux qui échouent ont leur pastille. */
    if (!ko && DISCRETS.includes(c.id)) { discrets.push(c); continue; }
    rangs.push({
      cle: c.id, verdict: ko ? 'ecart' : 'ok', texte, valeurs: valeursDe(c), ...(ecartDe(c) ? { ecart: ecartDe(c)! } : {}),
      ...(detailDe(c) ? { detail: detailDe(c)! } : {}), ...(ko && c.note ? { note: c.note } : {}),
      ...(ko ? { geste: gesteDe(c), renvoi: renvoiDuGeste(c.geste), ...(c.lignes?.length ? { lignes: c.lignes } : c.geste.lignes?.length ? { lignes: c.geste.lignes } : {}), ...(c.refs?.length ? { refs: c.refs } : {}) } : {}),
    });
  }
  if (discrets.length) rangs.push({ cle: 'verifies', verdict: 'ok', texte: discrets.map(c => NOMS_DISCRETS[c.id]).join(' · '), valeurs: 'rien à signaler', detail: discrets.map(c => c.trouve).join(' · ') });
  return rangs;
}

/** Les contrôles sans deux valeurs à montrer quand tout va bien, et leur nom court. */
const DISCRETS: readonly ControleId[] = ['hors-articles', 'photo-incomplete', 'cle-ean'];
const NOMS_DISCRETS: Partial<Record<ControleId, string>> = { 'hors-articles': 'Lignes hors articles', 'photo-incomplete': 'Photo', 'cle-ean': 'Clé EAN' };

/**
 * La note du paiement, une courte phrase sous la rangée « Payé », jamais un drapeau : un règlement partagé entre tickets se dit en entier (c'est une explication) ; « le terminal affiche
 * 163,85, plus que le total : … ? Aucune autre dépense … » se coupe à la constatation (le reste est une hypothèse).
 */
export function notePaiement(liste: readonly ControlePiece[]): string | undefined {
  const note = liste.find(c => c.id === 'paiement')?.note;
  if (!note) return undefined;
  return note.startsWith('Paiement partagé') ? note : note.split(' : ')[0];
}
