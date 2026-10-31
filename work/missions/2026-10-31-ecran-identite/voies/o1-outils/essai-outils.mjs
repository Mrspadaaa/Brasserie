// Témoins des quatre corrections de o1 (31.10, D202). Chaque cas lance un outil sur un petit fait exprès et compare
// sa sortie à ce qu'on en attend :
//   mode « apres » (défaut) : les outils du dépôt, corrigés ;
//   mode « avant » : `--outils=<dossier>` vers une copie de HEAD (git archive), où les cas fautifs doivent échouer.
// Un cas a deux attentes (avant, apres) ; les cas « vrai défaut » ont la même attente aux deux : ils échouent toujours.
// Usage : node essai-outils.mjs [--outils=<dossier des outils>] [--mode=avant|apres]
// Imprime une ligne par cas, puis TEMOINS OK ou TEMOINS ECHEC n.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const val = (k) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const OUTILS = path.resolve(val('outils') || path.join(ici, '../../../../refonte-frontend/v4/tournoi/outils'));
const MODE = val('mode') || (val('outils') ? 'avant' : 'apres');
const T = (...p) => path.join(ici, 'temoins', ...p);
const V0 = path.join(ici, '../../v0');

const lance = (script, a) => {
  const r = spawnSync(process.execPath, [path.join(OUTILS, script), ...a], { encoding: 'utf8', timeout: 300000, cwd: ici });
  return (r.stdout || '') + (r.stderr || '');
};
const CAS = [];
const cas = (nom, script, a, avant, apres) => CAS.push({ nom, script, a, avant, apres });

// 1. controle-panel : l'identifiant d'une capture. Six capture-haut.png de dossiers différents ne sont pas des doublons.
const homonymes = [1, 2, 3, 4, 5, 6].map((i) => path.join(V0, `g${i}`, 'capture-haut.png'));
cas('panel : six capture-haut.png de six dossiers', 'controle-panel.mjs', homonymes, /DIVERSITÉ/, /^(?![\s\S]*DIVERSITÉ)[\s\S]*captures/);
cas('panel : deux captures identiques, même nom, deux dossiers (vrai défaut)', 'controle-panel.mjs', [T('panel/identique-a/capture-haut.png'), T('panel/identique-b/capture-haut.png')], /DIVERSITÉ : 100 % de paires presque identiques/, /DIVERSITÉ : 100 % de paires presque identiques/);
cas('panel : deux captures identiques, deux noms (vrai défaut)', 'controle-panel.mjs', [T('panel/distincts/un.png'), T('panel/distincts/deux.png')], /DIVERSITÉ : 100 % de paires presque identiques/, /DIVERSITÉ : 100 % de paires presque identiques/);

// 2. mots-premier-ecran : seulement le texte visible au premier écran.
// Le comptage du texte visible est réservé au profil sans-houblons ; le profil houblons garde l'ancien (à part, plus bas).
const mots = (id, avant, apres, profil = '--profil=sans-houblons') => cas(`mots (${profil.slice(9)}) : ${id}`, 'mots-premier-ecran.mjs', [T('mots'), id, '--max=80', '--page=etat.html', profil], new RegExp(`^${id} ${avant} mots`, 'm'), new RegExp(`^${id} ${apres} mots`, 'm'));
mots('details-ferme', 46, 16);       // 3 + 10 + « Plus de détails » (3) ; les 30 mots du <details> fermé ne comptent pas
mots('details-ouvert', 46, 46);      // ouvert, ils sont lus : un vrai texte de trop reste compté
mots('defile', 32, 12);              // 4 + 2 sur 12 dans la rangée qui défile + 3 lignes sur 8 (6 mots)
mots('vrai-trop', 90, 90);           // 90 mots lisibles : dépasse 80 aux deux
mots('details-ferme', 46, 46, '--profil=houblons');   // le profil houblons ne change pas
mots('defile', 32, 32, '--profil=houblons');

// 3. controle-contraste : le fond réellement peint derrière le texte.
const contraste = (id, avant, apres, profil = '--profil=sans-houblons') => cas(`contraste (${profil.slice(9)}) : ${id}`, 'controle-contraste.mjs', [T('contraste'), id, '--page=etat.html', profil], avant, apres);
contraste('bande-cote', /CONTRASTE ECHEC[\s\S]*Volume 30 L/, /CONTRASTE OK/);   // texte clair, bande sombre en frère : faux 1:1 avant
contraste('bande-faible', /CONTRASTE OK/, /CONTRASTE ECHEC[\s\S]*Volume 30 L[\s\S]*sur le fond peint/); // vrai défaut que l'ancien outil ne voyait pas
contraste('pale-simple', /CONTRASTE ECHEC[\s\S]*2\.3\d?:1/, /CONTRASTE ECHEC[\s\S]*2\.3\d?:1/);
contraste('sans-bande', /CONTRASTE OK/, /CONTRASTE OK/);
contraste('haute-fixe', /CONTRASTE ECHEC[\s\S]*Volume 30 L/, /CONTRASTE OK/);   // page haute, pied fixe sombre, bande sous le pli : aucun faux 1:1
contraste('bande-cote', /CONTRASTE ECHEC/, /CONTRASTE ECHEC/, '--profil=houblons');   // le profil houblons ne change pas
contraste('bande-faible', /CONTRASTE OK/, /CONTRASTE OK/, '--profil=houblons');

// 4. controle-standard : le profil sans-houblons (DESIGN.md : 10, 16 et 24 px ; le + commun à 2 px est permis).
const std = (nom, fichier, profil, avant, apres) => cas(`standard : ${nom}`, 'controle-standard.mjs', [T('standard', fichier), ...(profil ? ['--profil=sans-houblons'] : [])], avant, apres);
std('rayons 10/16 + commun 2 px, profil sans-houblons', 'design-ok.html', true, /STANDARD ECHEC/, /STANDARD OK/);
std('mêmes rayons, profil houblons (inchangé)', 'design-ok.html', false, /STANDARD ECHEC[\s\S]*S3/, /STANDARD ECHEC[\s\S]*S3/);
std('rayon de 6 px, profil sans-houblons (vrai défaut)', 'rayon-hors.html', true, /STANDARD ECHEC[\s\S]*S3/, /STANDARD ECHEC[\s\S]*S3[\s\S]*6px/);
std('deux traits d\'icône ordinaires, profil sans-houblons (vrai défaut)', 'trait-hors.html', true, /STANDARD ECHEC[\s\S]*S4/, /STANDARD ECHEC[\s\S]*S4/);
std('rayons 2/4/8, profil houblons (inchangé)', 'houblons-ok.html', false, /STANDARD OK/, /STANDARD OK/);
std('rayons 2/4/8, profil sans-houblons (l\'échelle est remplacée)', 'houblons-ok.html', true, /STANDARD OK/, /STANDARD ECHEC[\s\S]*S3/);

let ecarts = 0;
console.log(`Outils : ${OUTILS} · mode ${MODE}`);
for (const c of CAS) {
  const sortie = lance(c.script, c.a);
  const attendu = MODE === 'avant' ? c.avant : c.apres;
  const bon = attendu instanceof RegExp ? attendu.test(sortie) : false;
  if (!bon) ecarts++;
  console.log((bon ? 'OK     ' : 'ECART  ') + c.nom);
  if (!bon) console.log('       sortie : ' + sortie.trim().split('\n').slice(0, 6).join(' | ').slice(0, 400));
}
console.log(ecarts ? `TEMOINS ECHEC ${ecarts}/${CAS.length}` : `TEMOINS OK (${CAS.length} cas, mode ${MODE})`);
process.exitCode = ecarts ? 1 : 0;
