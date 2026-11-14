# Voie voie-destinations — ce qu'ouvrent le menu ⋮ et le + : 4 mini maquettes v0 (mission 2026-11-14-ecrans-transversaux)

- Agent : concepteur · Modèle : opus · Plafond : 70 tours · Décideur : le brasseur (choix), après tri du critique (Opus, jamais Fable)
- Lis d'abord : `work/missions/2026-11-14-ecrans-transversaux/BRIEF-CONCEPTEUR.md` (obligatoire, sources, livrables),
  `INVENTAIRE.md`, `COUVERTURE.md` (ta part : lignes « voie-destinations »), les captures `references/*-reglages.png`,
  `references/*-journal.png`, `captures/390-clair-menu-*.png`, `captures/390-clair-plus-Encaisser-une.png`. Le contenu réel de
  chaque vue est dans le code (lecture seule) : `src/components/SettingsModal.tsx` (onglets Fiscalité, Brasserie, Accès,
  Sauvegardes : tous leurs champs), `src/components/AuditLogModal.tsx` (Journal des modifications), `src/components/CloudConfigModal.tsx`
  (Connexions cloud et IA), le dialogue « Saisir au nom de … » et « Mes conversations » (`src/components/Header.tsx`, événement
  `brewer-inbox-open`), « Encaisser une vente » (`src/components/QuickActionModal.tsx`), la période (`Header.tsx`, PERIODS).
  Charge le skill `boosters-ux`, puis `impeccable` et `ui-design-system`. Exigences transversales (L05) : densité utile et chrome
  compact ; même en-tête et même croix de fermeture à la même place partout (D109, D119, D129) ; 390 tactile et 1280 ; clair et cave.
  Règle du brasseur (14.11) : « J'ai l'impression que tout les écrans sous les boutons de ces Tabs ne sont pas traitées ??? » :
  **chaque vue et chaque onglet ci-dessous a sa maquette ; une vue sans maquette = pas fini.**

## Objectif
La question : une fois une ligne du menu ⋮ ou du + touchée, le brasseur règle, vérifie ou saisit vite, sans formulaire-fleuve,
et revient d'où il venait. Quatre variantes d1, d2, d3, d4 : chacune est **un langage commun appliqué à toutes les vues** :
1. Réglages · Fiscalité ; 2. Réglages · Brasserie ; 3. Réglages · Accès ; 4. Réglages · Sauvegardes ;
5. Journal des modifications (l'historique : qui a fait quoi, quand ; filtres ; état vide sans filtre) ;
6. Connexions cloud et IA (IA Rapide/Max, Google Drive) ; 7. Saisir au nom de (Gaëtan ↔ Aricia) ;
8. Mes conversations (liste, et état hors ligne) ; 9. Encaisser une vente ; 10. Période (Tout l'historique, Ce mois, Mois
dernier, Exercice 2026, trimestres).
Chaleurs : d1 froide, d2 tiède, d3 et d4 chaude (froide = outil sobre affiné, tiède = forme imposée par la question, chaude = forme
libre). Elles règlent les défauts n° 5, 6, 8, 9 d'INVENTAIRE.md et disent lesquels. Plancher à enrichir (L07) : chaque champ qui
existe garde sa place ou sa disparition est dite dans NOTE.md (« rien de perdu »).
Pistes (direction, pas catalogue) : réglages en résumé lisible (valeur · toucher pour modifier) plutôt qu'en champs ouverts ;
journal en frise par jour avec pastilles d'auteur ; erreurs dites au bon endroit, sans pavé rouge à l'ouverture ; IA en segment.

## Livrables (remplacent le § Livrables du brief pour cette voie)
Pour chaque variante `<v>` : `<v>.html` (tous ses cadres) et les captures regardées : `<v>-a-390.png` (= vue 1, clair),
`<v>-b-390.png` (= vue 5, clair), `<v>-cave-390.png` (vue 1, cave), `<v>-1280.png` (vue 1 et 5 à l'ordinateur, clair), et une
planche `<v>-vues-390.png` qui montre les dix vues côte à côte (clair, 390 chacune, réduites).
`NOTE.md` : une ligne par variante (`<v> · nom · chaleur · défauts réglés · ce qui disparaît ou bouge`), puis 3 lignes de jugement.

## Contrôles
- `node work/missions/2026-11-14-ecrans-transversaux/controle-serie.mjs voie-destinations d1,d2,d3,d4 --vues > work/missions/2026-11-14-ecrans-transversaux/voies/voie-destinations/controle.txt` → SERIE OK.
- Tests : aucun Vitest (maquettes statiques, pas de --reporter=dot : pas de Vitest ici) ; la sortie du contrôle est écrite dans un fichier (`> controle.txt`).
- RESULTAT.md tenu au fil : une ligne après chaque variante finie (une limite de tours ne doit rien perdre).
- Ouvre chaque capture (Read) avant de rendre ; « combien et quels problèmes ? », et corrige.
- Captures : puppeteer-core (`createRequire('C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/package.json')`, Chrome
  `C:/Program Files/Google/Chrome/Application/chrome.exe`, headless).

## Possède
`work/missions/2026-11-14-ecrans-transversaux/voies/voie-destinations/**` seulement. Rien dans `src/`, aucun serveur de l'app,
aucun déploiement, aucun commit.

## Rendre
Une ligne : « voie-destinations : SERIE OK, 4 variantes × 10 vues, préférée <v> » ou « … ECHEC : <raison> ».
