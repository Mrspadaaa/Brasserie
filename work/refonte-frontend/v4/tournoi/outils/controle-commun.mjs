// Les exigences de toute l'app, sur n'importe quel écran (19.10, soir). Le brasseur : « Ça reprend les
// code de l'app avec la Baseline, ça utilise les bonne pratique, contraintes, retour ecttra ? » ; et,
// plus tôt : « commen ça a pu être oublié ? c'était une demande centre répété à mainte et mainte
// fois » (au style), « Un appui long montre une vrai fiche de houblons... » (oubliée dans b5). Une
// exigence transversale ne doit plus dépendre d'un brief : ce lanceur les joue toutes.
//   MOTS (70 au premier écran, modéré : alerte jusqu'à 98, échec au-delà ; 24.10) ; COULEURS (D74) ; AU-STYLE (D75) ; SURVOL (D81) ; BLOCS (D82) ;
//   STANDARD (D83) ; CONTRASTE (D86) ; FICHE (D25 : l'appui long ouvre la vraie fiche, sur toute page
//   qui nomme un houblon) ; TRAIT (D88 : pictos d'arôme au trait, sans halo) ; LEGENDE (D89 : légende
//   derrière un bouton discret, fermée au repos) ; PARLANT (D90 : l'usage d'un houblon en mot, pas en
//   picto seul ; D91 : pas de bande d'axe « visée » hors des objectifs). La piste d'objectif (D92,
//   controle-piste-objectif) ne vaut que sur un écran à objectifs : elle se joue à part.
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
// Profil (o1, 31.10, D202). `--profil=sans-houblons` pour les écrans hors de l'outil houblons (Identité…) :
//   - standard prend les rayons de DESIGN.md (10, 16 et 24 px) à la place de 2, 4 et 8 (DESIGN.md prime, décision du
//     pilote) et permet le trait de 2 px du + commun, repris de l'app ;
//   - au-style, fiche, trait et legende sont sautés, avec leur raison : ils visent des houblons et leurs arômes ;
//   - mots ne compte que le texte visible (ni <details> fermé, ni texte rogné par un overflow) et contraste lit le fond
//     réellement peint derrière le texte : les deux correctifs d'o1, réservés à ce profil pour que les verdicts des
//     maquettes houblons restent ceux d'avant.
// Sans l'option, le profil houblons s'applique, inchangé.
const profil = (args.find((a) => a.startsWith('--profil=')) || '--profil=houblons').slice(9);
if (!['houblons', 'sans-houblons'].includes(profil)) { console.log('Profil inconnu : ' + profil + ' (houblons ou sans-houblons)'); process.exit(2); }
// Le profil se transmet à mots (texte visible seulement), contraste (fond réellement peint) et standard.
const passe = profil === 'houblons' ? [] : ['--profil=' + profil];
const SANS_HOUBLONS = {
  'au-style': 'compare à la plage d\'un style les arômes d\'un houblon : aucun houblon sur cet écran',
  fiche: 'l\'appui long sur un houblon ouvre sa fiche : aucun nom de houblon sur cet écran',
  trait: 'pictos d\'arôme au trait : aucune famille d\'arômes sur cet écran',
  legende: 'légende des familles d\'arômes : aucune famille sur cet écran',
};
if (!dir || !ids.length) { console.log('Usage : node controle-commun.mjs <dossier> <id> [id…] [--page=…] [--sans=…] [--profil=sans-houblons]'); process.exit(2); }
const CONTROLES = [
  ['mots', 'mots-premier-ecran.mjs', [dir, ...ids, '--max=70', '--modere', '--page=' + pg, ...passe], /MOTS OK/],
  ['couleurs', 'controle-couleurs.mjs', [dir, ...ids, '--page=' + pg], /COULEURS OK/],
  ['au-style', 'controle-au-style.mjs', [dir, ...ids, '--pages=' + pg], /AU-STYLE OK/],
  ['survol', 'controle-sens-survol.mjs', [dir, ...ids, '--pages=' + pg], /SURVOL OK/],
  ['blocs', 'controle-gros-blocs.mjs', [dir, ...ids, '--page=' + pg], /BLOCS OK/],
  ['contraste', 'controle-contraste.mjs', [dir, ...ids, '--page=' + pg, ...passe], /CONTRASTE OK/],
  ['fiche', 'controle-fiche.mjs', [dir, ...ids, '--pages=' + pg], /FICHE OK/],
  ['standard', 'controle-standard.mjs', [...ids.map((id) => path.join(dir, id, pg)), ...passe], /STANDARD OK/],
  ['trait', 'controle-pictos-trait.mjs', [dir, ...ids, '--page=' + pg], /TRAIT OK/],
  ['legende', 'controle-legende.mjs', [dir, ...ids, '--page=' + pg], /LEGENDE OK/],
  ['parlant', 'controle-usage-parlant.mjs', [dir, ...ids, '--page=' + pg], /PARLANT OK/],
  ['brutes', 'controle-valeurs-brutes.mjs', [dir, ...ids, '--page=' + pg], /BRUTES OK/],
];
let echecs = 0;
for (const [nom, script, a, ok] of CONTROLES) {
  if (sans.has(nom)) { console.log(nom.padEnd(10) + ' sauté (--sans)'); continue; }
  if (profil === 'sans-houblons' && SANS_HOUBLONS[nom]) { console.log(nom.padEnd(10) + ' sauté (profil sans-houblons : ' + SANS_HOUBLONS[nom] + ')'); continue; }
  const r = spawnSync(process.execPath, [path.join(ici, script), ...a], { encoding: 'utf8', timeout: 600000 });
  const sortie = (r.stdout || '') + (r.stderr || '');
  const bon = ok.test(sortie) && r.status === 0;
  if (!bon) echecs++;
  console.log(nom.padEnd(10) + (bon ? ' OK' : ' ECHEC'));
  if (!bon) for (const l of sortie.split('\n').filter((l) => /^\s+\S|ECHEC/.test(l)).slice(0, 12)) console.log('    ' + l.trim());
}
console.log(echecs ? 'COMMUN ECHEC ' + echecs + ' contrôle(s)' : 'COMMUN OK');
process.exit(echecs ? 1 : 0);
