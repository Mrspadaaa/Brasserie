// Écrit VOIE.md et GATES.md de la passe 2 (une voie par candidate), pilote, 14.11.
import fs from 'node:fs';
const M = 'work/missions/2026-11-14-ecrans-transversaux';
const C = {
  r3: { src: 'voie-recherche', extra: '', vues: false,
    plus: "Greffes de r1 : « 3 de plus dans les archives » en pointillé, champ collé au clavier, meilleur résultat sous le pouce ; au 1280, aperçu de la ligne choisie (stock, α, emplois)." },
  m2: { src: 'voie-menu', extra: '', vues: false,
    plus: "Fusion avec la bascule d'auteur de m4. Greffes : avatar d'auteur à la place du ⋮ plein, même poids que la loupe (m1, m4) ; pas à pas « ‹ oct. Novembre déc. › » sous la frise (m4) ; pastilles d'état sur les lignes du menu (IBAN à corriger, Drive · IA) (m1, m3) ; tuiles de période avec plages et nombre d'écritures (d2). Au 1280, s'accorder avec la navigation d'ordinateur de b3 (lire `voies/voie-barre/b3.html`)." },
  b3: { src: 'voie-barre', extra: 'ecrans', vues: false,
    plus: "Greffes de b1 : au 1280, rail latéral et lettres de raccourci N, E, F, V ; « Hors connexion » dans l'entrée Compagnon, plus de pastille flottante ; le toast de démarrage rangé au-dessus de la barre, sans couvrir l'en-tête ni les onglets. En plus (couverture, une vue sans maquette = pas fini) : une planche `b3p2-ecrans-390.png` qui montre le + ouvert sur chaque écran — Bord, Finances, Brassins, Recettes, Atelier, Volumes, Stock, Courses, Fûts, Matériel, Houblons, Clients — avec l'action de l'écran à sa place (actions actuelles : `src/domain/fabActions.ts`, lecture seule ; Atelier a aujourd'hui son propre + dans l'écran : un seul + à l'écran). L'état « a » montre la barre au repos sur un écran rempli (pas un bas vide)." },
  d3: { src: 'voie-destinations', extra: '', vues: true,
    plus: "Fusions et greffes : le bilan « 1 à corriger · 3 à saisir · 4 bons » et les onglets à point de santé (d2) ; le barème Plato en trois cases titrées (d2) ; la pastille-trou en pointillé ambre et le pied « Il reste 2 trous et 1 erreur » (d4) ; le Journal par personne avec barre de part (m3, lire `voies/voie-menu/m3.html`). Garder les dix vues et l'état vide du Journal." },
};
for (const [v, c] of Object.entries(C)) {
  const id = `voie-p2-${v}`; const d = `${M}/voies/${id}`; const n = `${v}p2`;
  fs.mkdirSync(d, { recursive: true });
  const ctl = `node ${M}/controle-serie.mjs ${id} ${n}${c.vues ? ' --vues' : ''}`;
  fs.writeFileSync(`${d}/VOIE.md`, `# Voie ${id} — passe 2 de ${v} (mission 2026-11-14-ecrans-transversaux)

- Agent : concepteur · Modèle : opus · Plafond : 60 tours · Décideur : le brasseur (choix) ; Fable interdit (10.11)
- Lis : \`${M}/BRIEF-CONCEPTEUR.md\` (obligatoire), \`${M}/voies/voie-critique/SYNTHESE.md\` (ta candidate, greffes, retouches communes),
  la section ${v} de \`${M}/voies/voie-critique/RESULTAT.md\` (ses problèmes numérotés), puis ta base \`${M}/voies/${c.src}/${v}.html\`
  et ses captures (et \`src/\` de cette voie s'il existe : copie-le chez toi, ne modifie rien dans \`${c.src}\`). Charge \`boosters-ux\`.
  Exigences transversales (L05) : densité utile et chrome compact ; même en-tête et même barre que l'app (logo, pictos), même place
  du + partout (D119, D129, BX-4) ; aucun menu déroulant au téléphone (D350) ; 390 tactile et 1280 ; clair et cave ; rien de perdu.

## Objectif
Ta base est ${v} ; tu la gardes (plancher à enrichir, L07) et tu corriges **tous** ses problèmes numérotés, ses retouches de
candidate et les retouches communes (dates : 14.11.2026 est un samedi, J+n cohérents ; mêmes données partout : B-031 IPA Nelson,
Citra T90 1,2 kg ; mono pour les chiffres seulement ; vente d'exemple plausible).
${c.plus}
Variante livrée : \`${n}\` (même idée, finie). Ce qui est proposé et n'existe pas dans l'app est marqué « (proposé) » dans NOTE.md.

## Livrables
\`${n}.html\` et captures regardées : \`${n}-a-390.png\`, \`${n}-b-390.png\`, \`${n}-cave-390.png\`, \`${n}-1280.png\`${c.vues ? `, \`${n}-vues-390.png\` (les dix vues)` : ''}${c.extra ? `, \`${n}-ecrans-390.png\`` : ''}.
\`NOTE.md\` : une ligne \`${n} · nom · chaleur · problèmes réglés · ce qui disparaît ou bouge\`, puis la liste des corrections faites.

## Contrôles
- \`${ctl} > ${d}/controle.txt\` → SERIE OK.
- Tests : aucun Vitest (maquettes statiques, pas de --reporter=dot : pas de Vitest ici) ; sortie écrite dans un fichier (\`> controle.txt\`).
- RESULTAT.md tenu au fil (une ligne après chaque étape ; une limite de tours ne doit rien perdre).
- Ouvre chaque capture (Read) ; « combien et quels problèmes ? » ; corrige. Reste sous 120 k de contexte.
- Captures : puppeteer-core (\`createRequire('C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/package.json')\`, Chrome
  \`C:/Program Files/Google/Chrome/Application/chrome.exe\`, headless).

## Possède
\`${d}/**\` seulement. Rien dans \`src/\` du dépôt, aucun serveur de l'app, aucun déploiement, aucun commit.

## Rendre
Une ligne : « ${id} : SERIE OK, ${n} livrée » ou « ${id} ECHEC : <raison> ».
`);
  fs.writeFileSync(`${d}/GATES.md`, `# Gates: voie ${id} — passe 2 de ${v}

OWNS: ${d}/

Scope: ${v} corrigée et enrichie de ses greffes, livrée en ${n} avec ses captures et NOTE.md.

- [ ] G1: ${n}, ses captures et sa ligne de NOTE existent, sans ressource externe ni script de jeu
  CHECK: ${ctl}
  EXPECT: SERIE OK
  EVIDENCE: pending
`);
}
console.log('PASSE 2 ECRITE');
