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
  n(`node ${O}/app-intacte.mjs`, 'FONCTIONS INTACTES OK'),
  // Règle n° 1 : ses choix, sa teinte.
  n(`node ${T}/controle-choix.mjs ${D}`, 'CHOIX OK'),
  n(`node ${T}/controle-teinte.mjs ${D}`, 'TEINTE OK'),
  // Les exigences de toute l'app, écran par écran (les mots se comptent à part, MOTS OK des voies).
  // L'onglet Ma bière de sa base ne nomme aucun houblon : pas d'appui long à y vérifier (fiche).
  ...['ma-biere', 'biere', 'suggerer', 'comparer', 'dryhopper', 'levure', 'substituer'].map((r) => n(`node ${T}/controle-commun.mjs ${D} ${r} --page=etat.html --sans=${r === 'biere' ? 'mots,fiche' : 'mots'}`, 'COMMUN OK')),
  n(`node ${T}/mots-premier-ecran.mjs ${D} ma-biere --max=30 --page=etat.html --sans-coquille --sans-donnees`, 'MOTS OK'),
  // D51 (24.10, soir) : la barre B de son choix (D45, « La meilleure ») porte Ma bière à 1,09 écran ; la hauteur se compte
  // contre sa B (règle n° 1), comme les mots de Dryhopper contre sa p4b2f (D46). Avant B : 1,05.
  n(`node ${T}/controle-hauteur.mjs ${D} ma-biere --max=1.10`, 'HAUTEUR OK'),
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
  // D127 à D133 (24.10, soir) : Substituer au dry hop, Comparer et ses familles, la continuité, les types hors 16D, la fiche
  // exhaustive au pied de flu2b, le radar en pics.
  n(`node ${T}/controle-substituer-gestes.mjs ${D}`, 'SUBSTITUER-GESTES OK'),
  n(`node ${T}/controle-comparer-familles.mjs ${D}/comparer/etat.html`, 'FAMILLES OK'),
  n(`node ${T}/controle-continuite.mjs ${D}`, 'CONTINUITE OK'),
  n(`node ${T}/controle-hors-16d.mjs ${D}/comparer/etat.html --min=3 --premier-ecran`, 'HORS-16D OK'),
  n(`node ${T}/controle-hors-16d.mjs ${D}/substituer/etat.html --min=2`, 'HORS-16D OK'),
  n(`node ${T}/controle-hors-16d.mjs ${D}/suggerer/etat.html --min=2`, 'HORS-16D OK'),
  n(`node ${T}/controle-hors-16d.mjs ${D}/fiche/etat.html --min=1`, 'HORS-16D OK'),
  n(`node ${T}/controle-fiche-exhaustive.mjs ${D}/fiche/etat.html`, 'EXHAUSTIVE OK'),
  n(`node ${T}/controle-radar-pics.mjs ${D}/fiche/etat.html`, 'PICS OK'),
  // D134 : le rail sort au lever du doigt (« un peu de délai pour "sortir" du mode rail »).
  n(`node ${T}/controle-sortie-rail.mjs ${D}`, 'SORTIE-RAIL OK'),
  // D135, D136 : « Substituts › » ouvre Substituer ; plus de « classé » dans la fiche.
  n(`node ${T}/controle-fiche-pied.mjs ${D}`, 'FICHE-PIED OK'),
  // D137 : Comparer retire, remplace à sa place et cherche le catalogue.
  n(`node ${T}/controle-comparer-choix.mjs ${D}`, 'COMPARER-CHOIX OK'),
  // D140 : la légende sous les pastilles est leg3-v2a telle quelle, avec la barre de v2e (« Je veux qqch comme ça moi ???? »).
  n(`node ${T}/controle-legende-v2a.mjs ${D}`, 'LEGENDE-V2A OK'),
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
