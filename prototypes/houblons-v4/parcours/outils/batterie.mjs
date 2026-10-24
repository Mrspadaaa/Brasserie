// Batterie de la version D107 à D121 (23.10, nuit), rejouée par le pilote sur la construction commune avant le critique
// et la publication. Une ligne par contrôle, puis BATTERIE OK n/n ou BATTERIE ECHEC et la liste.
// Usage (depuis la racine du dépôt) : node prototypes/houblons-v4/parcours/outils/batterie.mjs [--sans-construire]
import { spawnSync } from 'node:child_process';

const D = 'prototypes/houblons-v4/maquettes/parcours';
const T = 'work/refonte-frontend/v4/tournoi/outils';
const O = 'prototypes/houblons-v4/parcours/outils';
const n = (cmd, attendu) => ({ cmd, attendu });
const lot = [
  ...(process.argv.includes('--sans-construire') ? [] : [n(`node ${O}/construire.mjs`, 'CONSTRUIT OK')]),
  n(`node ${O}/verifier-types.mjs`, 'TYPES OK'),
  n(`node ${O}/app-intacte.mjs`, 'APP INTACTE OK'),
  // Règle n° 1 : ses choix, sa teinte.
  n(`node ${T}/controle-choix.mjs ${D}`, 'CHOIX OK'),
  n(`node ${T}/controle-teinte.mjs ${D}`, 'TEINTE OK'),
  // Les exigences de toute l'app, écran par écran (les mots se comptent à part, MOTS OK des voies).
  // L'onglet Ma bière de sa base ne nomme aucun houblon : pas d'appui long à y vérifier (fiche).
  ...['ma-biere', 'biere', 'suggerer', 'comparer', 'dryhopper', 'levure', 'substituer'].map((r) => n(`node ${T}/controle-commun.mjs ${D} ${r} --page=etat.html --sans=${r === 'biere' ? 'mots,fiche' : 'mots'}`, 'COMMUN OK')),
  n(`node ${T}/mots-premier-ecran.mjs ${D} ma-biere --max=30 --page=etat.html --sans-coquille --sans-donnees`, 'MOTS OK'),
  n(`node ${T}/controle-hauteur.mjs ${D} ma-biere --max=1.05`, 'HAUTEUR OK'),
  n(`node ${T}/controle-retour.mjs ${D} --fiche`, 'RETOUR OK'),
  // Le rail (D27, D35 à D37, D46, D47, D55, D69).
  // 24.10 (r7, décision du pilote, option b) : le contrat --parcours de controle-rail décrit le rail D111 que sa base a
  // remplacé (D124) ; il ne joue plus que Dryhopper. L'étape est gardée par le rail de sa base, rejoué fonction par fonction
  // (controle-fonctions-rail) et au froid (controle-geste-etape --froid). Mesures D61 bis et D56 : voies/r7-batterie/RESULTAT.md.
  n(`node ${T}/controle-rail.mjs ${D} dryhopper --page=etat.html --parcours`, 'RAIL OK'),
  n(`node ${T}/controle-fonctions-rail.mjs ${D}`, 'FONCTIONS-RAIL OK'),
  n(`node ${T}/controle-geste-etape.mjs ${D} --froid`, 'GESTE-ETAPE OK (froid'),
  // D107 à D121.
  n(`node ${T}/controle-comparer-etapes.mjs ${D}`, 'COMPARER-ETAPES OK'),
  n(`node ${T}/controle-visee.mjs ${D}`, 'VISEE OK'),
  n(`node ${T}/controle-retour.mjs ${D}`, 'RETOUR OK'),
  n(`node ${T}/controle-retour.mjs ${D} --routes=biere,suggerer,comparer`, 'RETOUR OK'),
  n(`node ${T}/controle-traits.mjs ${D}`, 'TRAITS OK'),
  n(`node ${T}/controle-geste-etape.mjs ${D}`, 'GESTE-ETAPE OK'),
  n(`node ${T}/controle-appui.mjs ${D} --etape`, 'APPUI-ETAPE OK'),
  n(`node ${T}/controle-legende.mjs ${D} --etape`, 'LEGENDE OK'),
  n(`node ${T}/controle-fiche-radar.mjs ${D}`, 'FICHE-RADAR OK'),
  n(`node ${T}/controle-stepper.mjs ${D}`, 'STEPPER OK'),
  n(`node ${T}/controle-annuler.mjs ${D}`, 'ANNULER OK'),
  n(`node ${T}/controle-profil-ouvre.mjs ${D}`, 'PROFIL OK'),
  // Le parcours joué au téléphone et à l'ordinateur.
  n(`node ${O}/jouer-parcours.mjs --dossier=${D} --routes`, 'ROUTES OK'),
  n(`node ${O}/jouer-parcours.mjs --dossier=${D} --ponts`, 'PONTS OK'),
  n(`node ${O}/parcours-complet.mjs --sans-construire --dossier=${D}`, 'PARCOURS OK'),
];
const rates = [];
for (const { cmd, attendu } of lot) {
  const r = spawnSync(cmd, { shell: true, encoding: 'utf8', timeout: 900000 });
  const sortie = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  const ok = sortie.includes(attendu);
  const fin = sortie.trim().split('\n').filter((l) => /\b(OK|ECHEC)\b/.test(l)).at(-1) ?? sortie.trim().split('\n').at(-1) ?? '';
  console.log(`${ok ? 'tenu ' : 'RATÉ '} ${cmd.replace(/^node /, '').slice(0, 110)} → ${fin.slice(0, 160)}`);
  if (!ok) rates.push(`${cmd}\n${sortie.trim().split('\n').slice(-8).join('\n')}`);
}
if (rates.length) { console.log(`BATTERIE ECHEC ${lot.length - rates.length}/${lot.length}`); for (const r of rates) console.log(`---\n${r}`); process.exit(1); }
console.log(`BATTERIE OK ${lot.length}/${lot.length}`);
