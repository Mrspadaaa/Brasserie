// Écrit VOIE.md et GATES.md des trois séries (pilote, 14.11).
import fs from 'node:fs';
const M = 'work/missions/2026-11-14-ecrans-transversaux';
const S = {
  'voie-recherche': {
    nom: 'La recherche (loupe, ⌘K)', ids: ['r1', 'r2', 'r3', 'r4'], def: '1, 2, 3',
    q: "Trouver vite un article, une recette, un brassin, une écriture ou un client, et aller à un écran ou lancer une création, depuis n'importe où, au pouce comme au clavier.",
    etats: "état principal = ouverte sans rien taper (que voit-il avant la frappe ?) ; second état = « cit » tapé, résultats de plusieurs types (Citra T90 en stock, recette IPA Nelson qui l'emploie, écriture Brouwland…) ; un petit cadre « rien trouvé » dans le HTML ; à 1280 la palette au clavier.",
    pistes: "feuille plein écran au téléphone avec champ près du pouce ; récents et raccourcis d'écrans ; filtres par type en pastilles avec compteur ; commandes (« Aller à Courses », « Nouvelle recette ») mêlées aux objets ; chaque ligne montre sa valeur utile (stock, statut, montant) ; archives en bascule discrète.",
    refs: 'references/*-recherche.png et references/*-bord.png',
  },
  'voie-menu': {
    nom: "L'en-tête et son menu ⋮ (réglages, compte, historique, thème, période)", ids: ['m1', 'm2', 'm3', 'm4'], def: '4, 5, 6, 7, 8, 9',
    q: "Où vivent la période de l'app (Tout l'historique, Ce mois…), le compte (qui saisit : Gaëtan ou Aricia), le thème, les outils (Assistant de brassage, Atelier R&D), l'administration (Journal des modifications, Connexions cloud et IA, Réglages) et la sortie, sans alourdir l'en-tête de chaque écran.",
    etats: "état principal = en-tête au repos + menu (ou son remplaçant) ouvert ; second état = une destination ouverte, au choix Réglages resserré ou Journal des modifications (l'historique : qui a fait quoi, filtres) ; 1280 = en-tête et menu à l'ordinateur.",
    pistes: "menu groupé par nature avec en-tête de compte ; période en segment ou pastille dans l'en-tête aux deux formats ; bascule d'auteur claire (« Je saisis : Gaëtan | Aricia ») ; thème en segment Clair · Cave dans le menu ; page « Plus » plein écran à sections ; feuille du bas en grille d'icônes ; avatar de compte.",
    refs: 'references/*-menu.png, references/*-reglages.png, references/*-journal.png et references/*-bord.png',
  },
  'voie-barre': {
    nom: 'La barre du bas et le bouton + (et son menu)', ids: ['b1', 'b2', 'b3', 'b4'], def: '10, 11, 12, 13',
    q: "Passer d'une rubrique à l'autre (Bord, Finances, Brassins, Stocks, Clients) et créer vite (Nouvelle écriture / facture, Encaisser une vente, Créer une recette, Lancer un brassin, l'action de l'écran), au pouce à 390 et à la souris à 1280.",
    etats: "état principal = barre au repos sur un écran (Brassins actif) ; second état = le + ouvert (ses actions, l'action de l'écran à sa place) ; 1280 = la navigation d'ordinateur et la place du + ; montrer où va la pastille « Compagnon hors connexion ».",
    pistes: "+ au centre de la barre ; + comme 6e case de la barre ; rail latéral à 1280 avec + en tête ; feuille du bas « Créer » en grille 2×2 avec l'action de l'écran en tête ; barre qui se replie au défilement ; un seul + par écran (celui de l'écran fusionné au flottant).",
    refs: 'references/*-plus.png et references/*-bord.png',
  },
};
for (const [id, s] of Object.entries(S)) {
  const d = `${M}/voies/${id}`;
  fs.mkdirSync(d, { recursive: true });
  const ctl = `node ${M}/controle-serie.mjs ${id} ${s.ids.join(',')}`;
  fs.writeFileSync(`${d}/VOIE.md`, `# Voie ${id} — ${s.nom} : 4 mini maquettes v0 (mission 2026-11-14-ecrans-transversaux)

- Agent : concepteur · Modèle : opus · Plafond : 60 tours · Décideur : le brasseur (choix), après tri du critique (Opus, jamais Fable)
- Lis d'abord : \`${M}/BRIEF-CONCEPTEUR.md\` (obligatoire, sources, livrables), \`${M}/INVENTAIRE.md\`, les captures \`${M}/${s.refs}\`.
  Charge le skill \`boosters-ux\`, puis \`impeccable\` et \`ui-design-system\` pour ce qui sert. Exigences transversales (L05) :
  densité utile et chrome compact ; même en-tête et même place du + partout (D119, D129, BX-4) ; 390 tactile et 1280 ; clair et cave.

## Objectif
La question : ${s.q}
Quatre variantes ${s.ids.join(', ')}, une idée chacune, chaleurs variées ; elles règlent les défauts n° ${s.def} d'INVENTAIRE.md
(chacune dit lesquels). Plancher à enrichir (L07) : l'existant est le minimum, pas le modèle.
États à figer : ${s.etats}
Pistes (direction, pas catalogue ; ose au-delà) : ${s.pistes}

## Contrôles
- \`${ctl}\` → SERIE OK.
- Ouvre chaque capture (Read) avant de rendre ; juge-la comme le brasseur (« combien et quels problèmes ? ») et corrige.
- Captures : puppeteer-core (\`createRequire('C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/package.json')\`, Chrome
  \`C:/Program Files/Google/Chrome/Application/chrome.exe\`, headless), fichiers dans ta voie.

## Possède
\`${d}/**\` seulement. Rien dans \`src/\`, aucun serveur de l'app, aucun déploiement, aucun commit.

## Rendre
Une ligne : « ${id} : SERIE OK, 4 variantes, préférée <v> » ou « ${id} ECHEC : <raison> ». LEÇON PROPOSÉE / CONNAISSANCE au besoin dans NOTE.md.
`);
  fs.writeFileSync(`${d}/GATES.md`, `# Gates: voie ${id} — ${s.nom}

OWNS: ${d}/

Scope: quatre mini maquettes v0 non jouables (${s.ids.join(', ')}) : 390 clair, second état, cave, 1280, avec NOTE.md.

- [ ] G1: les quatre variantes, leurs quatre captures et leurs lignes de NOTE existent, sans ressource externe ni script de jeu
  CHECK: ${ctl}
  EXPECT: SERIE OK
  EVIDENCE: pending
`);
}
console.log('VOIES ECRITES');
