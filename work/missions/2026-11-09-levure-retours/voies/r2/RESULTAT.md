OK — Chercher levure ligne entière et alignée ; recherche avancée commune ; houblons branchés par la pile

## Fichiers écrits
- Moteur commun : `src/domain/rechercheAvancee/facettes.ts` (facettes à comptes disjonctifs, non documentées à part, tranches, garde de plage).
- Levure, instance du moteur : `src/domain/levure/filtres.ts` (`facettesLevure`, `passe` délègue), `src/domain/levure/recherche.ts`
  (étapes 3 et 4 → `facetter`). Aucun autre changement de règle.
- Vue commune : `src/ui/rechercheAvancee/RechercheAvancee.tsx`, `types.ts` (contrat `CatalogueRA`), `rechercheAvancee.css` (`ra-`).
- Levure : `src/ui/etapeLevure/Chercher.tsx` = `catalogueLevure(api, …)` + `<RechercheAvancee>` ; export `Chercher` et ses props
  inchangés (EtapeLevure.tsx non touché) ; pièces reprises par Comparer et Suggérer gardées (une copie). `vues.css` : règles
  devenues `ra-` retirées (−130 lignes), plus de copie parallèle.
- Houblons : `src/ui/hopIndex/rechercheAvancee/catalogue.tsx` (fiches, 7 facettes, ordre, pièces de ligne), `EcranApp.tsx` (couche),
  `rechercheHoublons.css` (`hx-`) ; `src/ui/hopIndex/maBiere/Ajouter.tsx` (bouton « avancée » près du champ) ;
  route `hopSearch` : `src/pages/useFullScreenRoute.ts` et **`src/ui/hopIndex/HopToolLayer.tsx`** (titre + rendu de la couche :
  hors de « Possède » au sens strict, mais c'est le répartiteur des routes de la pile ; sans lui la route n'ouvre rien — 2 ajouts, rien d'autre).
- Tests : `tests/integration/etapeLevure/vues-ligne.test.tsx`, `tests/unit/levure/rechercheAvancee-identite.test.ts`
  (+ `rechercheAvancee-requetes.ts`, `rechercheAvancee-identite.json` figé sur HEAD), `tests/unit/hopIndexV4/rechercheAvancee-houblons.test.tsx` ;
  sélecteurs `lvv-` → `ra-` dans `vues-corrections.test.tsx` (2) et `vues-reel.test.tsx` (4), mêmes assertions.
- Voie : `gen-identite.ts`, `capturer.mjs`, `captures/`, `tests.txt`.

## 1. Chercher levure : la ligne entière, les alignements
Ligne entière : un toucher n'importe où (pistes, pastilles, fond) ouvre « Choisir pour ma recette · + Comparer » ; le nom reste le
bouton de la ligne (focus, Entrée, Espace, `aria-expanded`), son focus entoure toute la ligne ; « ⌕ », Choisir, Comparer gardent leur
geste. Même geste sur la carte de la levure tapée. Pas de bouton dans un `role=button` (a11y) : un seul gestionnaire sur la ligne,
qui ignore les autres commandes.

Alignements (ses captures 2 et 3, puis les miennes, mesurés par `capturer.mjs` → `captures/journal.json`) :
1. « 19 » de l'en-tête centré dans sa colonne (50 %) alors que le trait rouge est à 45 % : décalé. Corrigé : le repère est posé à sa
   place sur la piste ; mesuré 242 px contre 243 px pour le trait (±1 px). Une borne qu'il recouvrirait s'efface.
2. En-tête en `minmax(0, 1fr)`, lignes en `1fr` : un nom insécable ou une pastille longue pouvait élargir la colonne et pousser les
   pistes d'une ligne. Corrigé : une seule grille ; toutes les lignes ont leur piste à 204 px (390) / 902 px (1280), comme l'en-tête.
3. « LalBrew NovaLager Br… » : nom en `nowrap` + ellipse. Corrigé : nom entier, sur deux lignes au besoin (mesure : 0 nom coupé).
4. Pastilles en `nowrap` sans largeur maximale : une pastille longue sortait de sa colonne. Corrigé : elles passent à la ligne et se
   replient dans leur colonne (mesure : 0 élément au-delà de la première piste).
5. « 30 65 » / « 20 0 » collés : deux échelles qui se lisent comme une. Corrigé : 16 px entre les deux pistes (au lieu de 10).

## 2. Moteur et vue génériques
Contrat `CatalogueRA<T>` : fiches, filtres, `chercher`, rayons, pistes, tris, `documente`, pièces de ligne (`ApresNom`, `SousNom`,
`Pastilles`, `Actions`, `NonDoc`, `Carte`). La vue ne connaît aucun catalogue. Identité levure : 12 requêtes (repos, repères,
« 1056 », « us-05 », texte + forme, tolérance + famille, STA1, effets cumulés, °C + ici, stock, cidre, trois filtres) : même liste
(empreinte FNV de tous les ids, ordre compris), mêmes comptes, même résumé, même levure tapée ; et le moteur seul rend les mêmes comptes.

## 3. Houblons
Champ « Ajouter — houblon… » inchangé ; à sa droite, « ⫶ avancée » (« Recherche avancée » dès 640 px), 81 × 28 px, gris discret.
Il ouvre la couche `hopSearch` dans la pile (comme Suggérer). Forme c6b : champ « Nom ou alias », résumé « houblons · au style … · n »,
puces α · Rôle · Arômes · Origine · Huiles · En stock, feuille à index (Disponibilité en « Plus de filtres »), rayons Chez moi /
Épuisés chez moi / À acheter, deux pistes (α 0–20 %, huile totale 0–4 mL/100 g).
Ligne (L04) : nom, α (lot, sinon milieu de la plage des fiches ; « α ? » inconnu), rôle (« rôle ? »), stock en icône ; puis jusqu'à 4
familles en couleur avec leur picto (marquées d'abord, citées en pâle), « arômes ? » sans famille, « ◇ vin blanc +10 » pour les mots
hors des 12 familles (L14 : Nelson Sauvin ne paraît plus ordinaire). Ordre : chez moi → épuisés → à acheter, puis le texte, puis le
rang du moteur pour le style (celui des ajouts proposés), jamais l'alphabet d'abord.
Ligne ouverte : « Ajouter à ma recette · 10 g à 10′ » (dose et moment proposés par `quickAdds`, même règle que le champ) et « Fiche »
(FicheApp). L'ajout passe par `ajouter` de `parcours/operations`, puis `versPatch` et la porte du wizard, et la couche se referme
sur l'étape (banc : Nelson Sauvin dans l'étape, couche fermée).

## Critères
- Tests qui échouent avant : `vues-ligne` (3 rouges avant sur 5 : pistes, fond, Comparer ; clavier et ⌕ passaient déjà par le nom) ;
  identité levure et houblons : modules inexistants avant (import en échec).
- Temps d'une recherche houblon à chaud : 0,20 à 0,91 ms sur 318 fiches (cible < 20 ms) ; banc : 497 fiches (catalogue plein).
- `npx tsc --noEmit -p .` : sortie vide (vert).
- Tests : 127 fichiers, 1187 tests passés (`tests.txt`, suite entière etapeLevure + levure + hopIndex + hopIndexV4, mes tests compris).
  Aucun rouge hors zone.
- Captures : voir « Captures ».

## Captures
(complétées après le dernier passage)

## Doutes et limites
- Banc `?dev-local&etape=houblons` : stock vide, donc un seul rayon « À acheter » ; « Chez moi » n'est prouvé que par le test (stock du moteur).
- Pas de recherche IA (« ⌕ chercher ») pour les houblons : une donnée absente se dit « arômes ? », « α ? », « rôle ? », sans geste.
- Le bouton de l'étape appelle `ouvrirCouche` directement (pas `useOuvrir` de l'hôte : `hote.tsx` n'est pas à moi) ; dans la maquette
  (sans pile) il ne fait rien.
- La couche ne se rouvre pas sur sa recherche après « Ajouter » (fermée sur l'étape, comme demandé).

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : la recherche avancée est commune (`src/domain/rechercheAvancee`, `src/ui/rechercheAvancee`) ; un nouveau catalogue
(malts, sucres) n'écrit qu'un `CatalogueRA` et ses facettes.
LEÇON PROPOSÉE : aucune.
