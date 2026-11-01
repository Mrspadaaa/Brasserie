OK — z2b : les 23 lignes sur le papier, six points au stylo, en-tête éditable ; remplissage 0,91 ; mots 149 (à trancher)

## Fichiers écrits (`work/missions/2026-10-31-ecran-depense/v1/z2b/`)
- `etat.html` (la maquette, états joués par `?etat=1 | 2 | 3 | 4a | 4b | 5 | 6 | 7a | 7b | 8 | 9`), `NOTE.md`, `capturer.mjs`,
  `panel-mesures.json`, `RESULTAT.md`.
- Captures, toutes ouvertes (L12) : `z2b-haut-390.png` (repos), `z2b-haut-1280.png`, `z2b-etat{1,2,3,4a,4b,5,6,7a,7b,8,9}-390.png`
  et `-1280.png` (22), `z2b-plateau-390.png`, `z2b-preuve-390.png`, `z2b-moutures-390.png`, `z2b-haut.png` / `z2b-page.png`
  (verifier-page).

## Sorties décisives (racine)
- `node scripts/agents/verifier-page.mjs v1/z2b/etat.html --captures … --min-images 0` : **PAGE OK** (390 px, sans erreur, sans débord).
- `node …/controle-commun.mjs v1 z2b --page=etat.html --profil=sans-houblons` : **COMMUN ECHEC 1 contrôle** : `mots` ; couleurs,
  survol, blocs, contraste, standard, parlant, brutes **OK**.
- `mots-premier-ecran --max=70 --modere --profil=sans-houblons` : **149** (> 98).
- `controle-contraste --profil=sans-houblons` : **CONTRASTE OK**.
- `node v1/z2b/capturer.mjs` : **CAPTURES OK** (11 écrans d'état × 2 largeurs + repos + plateau + preuve + moutures, 0 erreur).
- `controle-panel.mjs z2b-haut-390.png z2-haut.png` : remplissage **z2b 0,91** (seuil demandé 0,55 ; v0 z2 : 0,63).
- `grep type="number"` : 0.

## Les trois retouches, vérifiées
1. Lignes sur le papier : 23 lignes dans l'ordre, Menge / Bezeichnung / Betrag, icône dans la marge, accolades de mouture, « Target
   bis » sur la ligne ; bas du premier écran plein (0,91). Capture : `z2b-haut-390.png`.
2. Six pastilles : TVA, Payé le, mouture ×5, Target, Sabro (simulé), Hallertauer CH ; « y aller » vers la ligne ; geste sur la ligne.
   Capture : `z2b-etat4b-390.png` (six ✓), `z2b-etat4a-390.png` (une ✓).
3. En-tête éditable sur place (fournisseur, n°, date) ; chips sous le tampon ; fond gris gardé. Capture : `z2b-haut-390.png`.
Greffes citées avec leur id dans NOTE.md (u1, r1, z1, u2, u4, u3, r3/r2, r2, r2/r4, r4, r3, r2/z4, u1/z3). Confirmer actif dans les
11 écrans d'état (Drive à connecter et hors ligne compris).

## Prédiction
« Là c'est ma facture, je vois tout » ; il touchera Maris Otter pour voir le plateau et le tampon pour la preuve ; il trouvera le papier
long et demandera un repli des lignes sans doute (« ouvre-moi que ce qui cloche »).

DÉCISION À PRENDRE : les mots du premier écran. La retouche 1 (23 lignes sur le papier, remplissage ≥ 0,55) et le seuil de mots
(≤ 98 modéré, ≤ 100 brief) se contredisent sur une facture de 23 lignes : à 390 px, 22 lignes tiennent dans le premier écran et leurs
seuls mots (quantité, unité, nom, α, montant) font ~120. Deux sorties, au choix du pilote : (a) garder le papier entier et accepter
149 (les mots sont la facture, pas de l'explication) ; (b) replier les lignes sans doute par famille (« 7 malts · 35,35 ») et garder
ouvertes les lignes en doute avec leur voisine, ce qui ramène vers ~95 mots mais rend ~0,6 de remplissage.

CONNAISSANCE : dans un `.z2b-d` rendu `<button>`, un bouton inline (« ↑ ») faisait fermer le bouton parent par l'analyseur HTML
(bouton dans bouton interdit) et cassait la grille de la ligne sans erreur de script : une ligne cliquable qui porte des boutons est un
`<span role="button">`, pas un `<button>`.

LEÇON PROPOSÉE : aucune (L26 déjà notée en v0 : un nom par rôle).
