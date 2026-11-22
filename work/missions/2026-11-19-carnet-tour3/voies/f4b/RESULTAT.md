OK — f4b : 8 constats corrigés (a44245e81), 2 écartés, 4 ouverts (f4a, contexte), captures à rejouer

| id | verdict | commit | test | rouge→vert | écran touché |
|---|---|---|---|---|---|
| PCN-54 | corrige | a44245e81 | tests/unit/carnetsTour3F4b.test.tsx | oui | oui — article sans photo à 390 : dessin borné à 92 px dans le cadre de 104 (carnets.css, bloc 899) |
| PCN-103 | corrige | a44245e81 | carnetsTour3F4b + carnetsEcrans, carnetsParcours (texte) | oui | oui — bulle G8 « « pas trop de bruit » tranche entre A et B », deux lignes au plus (line-clamp 2), plus d'ellipse |
| PCN-108 | corrige | a44245e81 | carnetsTour3F4b | oui | oui — 2e article (G20, g5:v06-11) : l'article déposé est une ligne du tableau ; « Article rangé ici · 2e · Annuler » sous le tableau, sans carte complète au-dessus |
| PCN-132 | corrige | a44245e81 | carnetsTour3F4b (même test que 108) | oui | oui — idem 108 ; la puce « ✻ Comparer sur … » reste dans le bandeau (CarnetsVue, f4a), mais ne pousse plus qu'une ligne |
| PCN-113 | corrige | a44245e81 | carnetsTour3F4b + carnetsCritique5Figes (3) | oui | oui — créé hors ligne : « L'IA le range au retour du réseau : ce qui compte, façons, articles. Rien n'est perdu. », aucune rubrique vide ; en ligne et IA éteinte inchangés |
| v1-neuf 3 = v2-neuf 5 | corrige | a44245e81 | carnetsTour3F4b | oui | oui — `.cnf-proposees` margin-bottom 10 px |
| v1-neuf 5 | corrige | a44245e81 | carnetsTour3F4b | oui | oui — `.cn-statut-research` vert (zonebg/zonet), comme g05-1 (liste) et g01-8 (Comparer) ; le beige ne venait que de la greffe v06-11 |
| v1-neuf 6 | corrige | a44245e81 | carnetsTour3F4b (2 cas) | oui | oui — avec tableau et titre = phrase, plus de « votre phrase en titre » seul sous le tableau ; sans tableau, sous le titre (L4-5 gardé) |
| PCN-58 | ecarte | — | — | — | non — h05-9 groupe lui-même « Sans date · 1 » ; « en stock » s'écrit quand l'article choisi a sa dispo (UpgradeWorkspace.tsx, `details`), la Chambre froide du Frigo n'en a pas (fixture.ts:193) : rien d'inventé. « Cette semaine et après » = PCN-111, ouvert par f2. |
| PCN-74 | ecarte | — | — | — | non — h01-6 : la valeur qui classe est le héros (débit, « la plus haute des 4 »), le prix est dans « Offre » ; le rang ne se dit que d'une valeur chiffrée qui classe (FicheArticle `rangDe`). La hotte n'a lu que débit et « tient 80 °C » : la grille complète par Disponibilité et Origine, jamais une valeur inventée. |
| PCN-20 | ouvert | — | — | — | non — code juste : `carnetProche` (rattacher.ts) refuse « Ventilation de la cave de garde » pour « … de la salle de brassage » (critique 6, n° 31 : même objet ET même besoin). La fixture `g35` ne donne donc jamais de cible. DEMANDE f4a ci-dessous. |
| PCN-61 | ouvert | — | — | — | non — « Déjà un carnet proche » vit dans CadreArrivee.tsx et CarnetsVue.tsx:969-976 (f4a). DEMANDE f4a. |
| PCN-119 | ouvert | — | — | — | non — titre = phrase brute en minuscule : `titreDePhrase` / analyseLocale (src/domain/carnets, f4a), même cause que v2-neuf 4 de f4a (en cours : tests de majuscule rouges dans carnetsTour3F4a). |
| PCN-42 | ouvert | — | — | — | non — la puce « À venir · ZZ TEST — Frigo… » est la pastille de lien (R47) du carnet grisé derrière la carte ; la masquer pendant `grise` est simple (CarnetOuvert, liens) mais non fait : plafond de contexte de la voie. À reprendre. |
| PCN-62, PCN-63, PCN-102 | ouvert (preuve) | — | — | — | non — gestes sans défaut de code connu ; preuve par captures distinctes : DEMANDE EXECUTANT. |
| PCN-71, PCN-116 | ouvert (preuve sombre) | — | — | — | non — DEMANDE EXECUTANT (thème sombre). |

## Tests
- Neuf `tests/unit/carnetsTour3F4b.test.tsx` : rouge 8/9 (`tests-rouge.txt`), vert 10/10 (`tests-vert.txt`, v1-neuf 6 réécrit en 2 cas pour garder L4-5).
- Mis à jour (même règle) : carnetsCritique5Figes (hors ligne), carnetsEcrans et carnetsParcours (« tranche entre »).
- Final `tests/unit/carnets* tests/integration/carnets*` (`tests-final.txt`) : 675 verts, 2 échecs, tous dans `carnetsTour3F4a.test.ts` (tests rouges de la voie f4a en cours, non à moi).
- `tsc --noEmit` : aucune erreur dans mes fichiers.
- `git show --stat HEAD` (a44245e81) : seulement mes 8 chemins.

## Écrans touchés (vision)
Carnet ouvert (2e lien, hors ligne, Frigo avec tableau), champ G8 (390), article sans photo (390), pastille « À comparer » (Comparer, carnet).

## DEMANDE f4a
1. PCN-20 : `src/domain/carnets/fixture.ts`, `ventilationCave()` : un carnet de même besoin, p. ex. titre « Ventilation de la salle de fermentation » (le qualifiant « salle » recoupe « salle de brassage »), pour que `&g35=1` montre « 1 article en veille : le déplacer dans … · Déplacer ». Vérifier `carnetProche(V, carnets)` non nul.
2. PCN-61 : liste, « Ventilation de la salle » avec IA lente : le cadre pendant doit dire « Déjà un carnet proche : Ventilation de la salle de brassage » avant toute création (CarnetsVue.tsx:969-976, CadreArrivee.tsx:103).
3. PCN-119 : titre mis en forme (« Hotte qui tient 80 °C au-dessus de la cuve »), avec v2-neuf 4.

## DEMANDE EXECUTANT
Serveur : `cd C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet && npx vite --port 5185 --strictPort` (arrière-plan). Banc `http://localhost:5185/?preview=carnets`, script modèle `../f2/captures.mjs 5185` (390 tactile 390×844 dpr 2, 1280×800), sorties dans `voies/f4b/captures/`, clair puis sombre.
1. `g8-390-{clair,sombre}` (`&g8=1`, Ventilation, toucher le champ) : bulle sur 2 lignes, « tranche entre Hotte inox + extracteur et Extracteur mural seul », sans « … ».
2. `article-hotte-390-clair` : picto entier dans le cadre (rien sous le bord bas).
3. `d35-{390,1280}-clair-2` (Pompe, 2e lien) : tableau visible sans défiler, « Article rangé ici · 2e · Annuler » dessous ; marge entre la puce « ✻ Comparer sur… » et « 2 articles à comparer ».
4. `horsligne-{390,1280}-clair` (réseau coupé, « acheter 2 sachets de levure ») : ligne « au retour du réseau », aucune rubrique « · aucune ».
5. `frigo-390-clair` (Frigo ouvert) : pas de « votre phrase en titre » sous le tableau.
6. `comparer-390-clair`, `liste-390-clair` : « À comparer » vert aux deux endroits.
7. PCN-62/63 : ··· d'une note › Modifier, changer, Enregistrer (`notes-390-modifiee`, `notes-1280-modifiee`) ; ··· › Supprimer, puis Annuler (`notes-1280-supprimee`, `notes-1280-annulee`), une page neuve par geste.
8. PCN-102 : `?dev-local`, lien avant (puce « Coller : … ») à 390 et 1280 ; D-118 à 390.
9. PCN-71, PCN-116 : `node ../v2/banc.mjs choisi,comparer 1280 sombre` → `choisi-1280-sombre-pourquoi`, `recon-ventil-1280-sombre` : réglettes lisibles, meilleure valeur verte lisible sur son aplat.
Attendu : chaque capture ouverte ; port 5185 libre à la fin (`netstat -ano | grep 5185` vide). Renvoyer les chemins à f4b pour jugement.

Prédiction : « Le tableau au 2e lien, enfin ; mais montre-moi le sombre et la suppression avec Déplacer. »

CONNAISSANCE : la fixture `g35` ne peut pas montrer G35, `carnetProche` exigeant le même besoin (critique 6, n° 31).
LEÇON PROPOSÉE : aucune.
REPRISE : ce fichier (PCN-42 à coder ; captures de la DEMANDE EXECUTANT à juger).
