// Voie f9 (D191) : sur sa vraie recette (neipa v3, 22A), au moins 4 de ses 6 houblons (El Dorado, Mosaic, Mandarina Bavaria, Calypso, Pacific Jade, Idaho 7)
// dans les 10 premiers de « plus d'agrumes » ET de « plus de tropicaux », au dry hop (actif, puis après fermentation).
//   npx vite-node scripts/eval-hop/f9-d191.ts [--combo=defaut|actuel|A3|typicité|A3+typicité|toutes] [--source=principale|dryhop] [--plein] [--liste]
// Sortie : une ligne par combinaison et par cas, puis `D191 OK` SEULEMENT si la combinaison retenue (`defaut` : les défauts du code, INTENSITE_DEFAUT et TYPICITE_DEFAUT) tient
// le critère sur la liste principale (la liste que l'écran lit : pool de 80 comme en production) ET que le témoin négatif (la combinaison « actuel ») échoue.
// Le témoin négatif : be15e480 (HEAD de f8) ou la combinaison « actuel » (intensité et typicité éteintes, k3k1 comme à f8) : 0 à 1 sur 6.
import { poserTypicite } from '../../src/domain/hopIndex/v4/typicite';
import { INTENSITE_DEFAUT, TYPICITE_DEFAUT } from '../../src/domain/hopIndex/v4/voies';
import { COMBINAISONS, MOMENTS_DRY, R22A, SES_SIX, VISEES, chargerTable, houblonsDe, listePrincipale, moteurPlein, rangs, type Combinaison } from './f9-commun';

const args = process.argv.slice(2);
const arg = (k: string, d: string) => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const combo = arg('combo', 'defaut');
const source = arg('source', 'principale');
const liste = args.includes('--liste');
const DEFAUT: Combinaison = { nom: 'défaut du code', intensite: INTENSITE_DEFAUT, typicite: TYPICITE_DEFAUT };

/** Teste une combinaison ; rend vrai si les quatre cas (2 questions × 2 moments) ont au moins 4 de ses 6 dans les 10 premiers. */
async function essayer(c: Combinaison, plein: boolean): Promise<boolean> {
  const m = await moteurPlein(plein);
  let tout = true;
  for (const [nom, f] of VISEES) {
    const res = m.proposeVoies(R22A, { [f]: 1 }, { maxBuy: source === 'dryhop' ? 1 : 80, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false, moments: ['dryActive', 'dryPost'],
      ...(source === 'dryhop' ? { dryHop: true } : {}), intensite: c.intensite, typicite: c.typicite });
    for (const [mnom, moment] of MOMENTS_DRY) {
      const voies = source === 'dryhop' ? (moment === 'dryActive' ? res.dryHop!.actif : res.dryHop!.apres) : listePrincipale(res, moment);
      const hs = houblonsDe(voies);
      const dedans = SES_SIX.filter((s) => hs.slice(0, 10).includes(s)).length;
      const ok = dedans >= 4;
      tout &&= ok;
      console.log(`${ok ? 'ok    ' : 'ECHEC '} [${c.nom}] ${nom} · ${mnom} : ${dedans}/6 dans les 10 premiers (${hs.length} houblons) ; rangs : ${rangs(hs)}`);
      if (liste) console.log('        10 premiers :', hs.slice(0, 10).join(', '));
    }
  }
  return tout;
}

async function main() {
  chargerTable();
  const plein = args.includes('--plein');
  const choisies = combo === 'toutes' ? COMBINAISONS : combo === 'defaut' ? [DEFAUT] : COMBINAISONS.filter((c) => c.nom.replace(/ /g, '') === combo.replace(/ /g, ''));
  if (!choisies.length) throw Error(`combinaison inconnue : ${combo}`);
  let retenue = false;
  for (const c of choisies) { const ok = await essayer(c, plein); console.log(`  → ${c.nom} : ${ok ? 'tient' : 'ne tient pas'} D191 (${source})`); retenue = ok; }
  // Témoin négatif : « actuel » doit échouer, sinon le critère ne prouve rien.
  const temoin = await essayer(COMBINAISONS[0], plein);
  console.log(`  → témoin négatif (actuel) : ${temoin ? 'TIENT (le critère ne discrimine pas)' : 'échoue, comme attendu'}`);
  poserTypicite(null);
  // `toutes` compare les combinaisons : pas de verdict unique, la ligne finale ne dit OK pour aucune.
  console.log(choisies.length === 1 && retenue && !temoin ? 'D191 OK' : 'D191 ECHEC');
}
void main();
