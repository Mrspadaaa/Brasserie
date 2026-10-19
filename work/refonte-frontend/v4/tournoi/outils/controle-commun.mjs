// Les exigences de toute l'app, sur n'importe quel écran (19.10, soir). Le brasseur : « Ça reprend les
// code de l'app avec la Baseline, ça utilise les bonne pratique, contraintes, retour ecttra ? » ; et,
// plus tôt : « commen ça a pu être oublié ? c'était une demande centre répété à mainte et mainte
// fois » (au style), « Un appui long montre une vrai fiche de houblons... » (oubliée dans b5). Une
// exigence transversale ne doit plus dépendre d'un brief : ce lanceur les joue toutes.
//   MOTS (≤ 70 au premier écran) ; COULEURS (D74) ; AU-STYLE (D75) ; SURVOL (D81) ; BLOCS (D82) ;
//   STANDARD (D83) ; CONTRASTE (D86) ; FICHE (D25 : l'appui long ouvre la vraie fiche, sur toute page
//   qui nomme un houblon) ; TRAIT (D88 : pictos d'arôme au trait, sans halo) ; LEGENDE (D89 : légende
//   derrière un bouton discret, fermée au repos).
// Usage : node controle-commun.mjs <dossier> <id> [id…] [--page=etat-b.html] [--sans=fiche,au-style]
// (--sans seulement avec une raison écrite dans la NOTE de la variante). Imprime COMMUN OK, ou
// COMMUN ECHEC et le détail de chaque contrôle en échec.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const pos = args.filter((a) => !a.startsWith('--'));
const [dir, ...ids] = pos;
const pg = (args.find((a) => a.startsWith('--page=')) || '--page=etat-b.html').slice(7);
const sans = new Set(((args.find((a) => a.startsWith('--sans=')) || '').slice(7)).split(',').filter(Boolean));
if (!dir || !ids.length) { console.log('Usage : node controle-commun.mjs <dossier> <id> [id…] [--page=…] [--sans=…]'); process.exit(2); }
const CONTROLES = [
  ['mots', 'mots-premier-ecran.mjs', [dir, ...ids, '--max=70', '--page=' + pg], /MOTS OK/],
  ['couleurs', 'controle-couleurs.mjs', [dir, ...ids, '--page=' + pg], /COULEURS OK/],
  ['au-style', 'controle-au-style.mjs', [dir, ...ids, '--pages=' + pg], /AU-STYLE OK/],
  ['survol', 'controle-sens-survol.mjs', [dir, ...ids, '--pages=' + pg], /SURVOL OK/],
  ['blocs', 'controle-gros-blocs.mjs', [dir, ...ids, '--page=' + pg], /BLOCS OK/],
  ['contraste', 'controle-contraste.mjs', [dir, ...ids, '--page=' + pg], /CONTRASTE OK/],
  ['fiche', 'controle-fiche.mjs', [dir, ...ids, '--pages=' + pg], /FICHE OK/],
  ['standard', 'controle-standard.mjs', ids.map((id) => path.join(dir, id, pg)), /STANDARD OK/],
  ['trait', 'controle-pictos-trait.mjs', [dir, ...ids, '--page=' + pg], /TRAIT OK/],
  ['legende', 'controle-legende.mjs', [dir, ...ids, '--page=' + pg], /LEGENDE OK/],
];
let echecs = 0;
for (const [nom, script, a, ok] of CONTROLES) {
  if (sans.has(nom)) { console.log(nom.padEnd(10) + ' sauté (--sans)'); continue; }
  const r = spawnSync(process.execPath, [path.join(ici, script), ...a], { encoding: 'utf8', timeout: 600000 });
  const sortie = (r.stdout || '') + (r.stderr || '');
  const bon = ok.test(sortie) && r.status === 0;
  if (!bon) echecs++;
  console.log(nom.padEnd(10) + (bon ? ' OK' : ' ECHEC'));
  if (!bon) for (const l of sortie.split('\n').filter((l) => /^\s+\S|ECHEC/.test(l)).slice(0, 12)) console.log('    ' + l.trim());
}
console.log(echecs ? 'COMMUN ECHEC ' + echecs + ' contrôle(s)' : 'COMMUN OK');
process.exit(echecs ? 1 : 0);
