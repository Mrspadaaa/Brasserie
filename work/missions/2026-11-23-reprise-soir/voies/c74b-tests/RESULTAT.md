TESTS ROUGES 41 rouges / 50 au total — tests/unit/c74bRegles.test.tsx (hash du commit : voir la réponse finale)

# RESULTAT c74b-tests (25.11)

## Fichiers écrits
- tests/unit/c74bRegles.test.tsx (50 tests, un bloc describe par règle R92 à R97).
- tests/fixtures/c74b/anciens.ts : carnets à la FORME de ses vieux carnets, anonymisés (vendeurs et prix d'exemple, préfixe « ZZ TEST — »).
- voies/c74b-tests/tests-rouge.log (sortie `--reporter=dot`).
- Aucun fichier de src/ ni functions/ modifié (git status : seules les modifications des autres voies). tsc : aucune erreur dans c74b.

## Les fixtures (L28) : la forme de ses vieux carnets
- Houblons citra : Brau « Citra 13.6% » `prixCentimes: 10, prixDes` (le gramme, sans que rien le dise) ; MotlerHops 3,72 € TTC, cours 0,918, ligne « Poids : 50 g, 250 g et 500 g », sans `conditionnement` ni `offres` ni `prixUnite`. Rendu sur le vrai code : tableau « 13,6 ? » et « 10 - 15 ? », rang 1 sur Brau, Choisir « 0,10 CHF », fiche « prix ? » : les constats de reel-73 sont reproduits à l'identique.
- Chambre froide : 2 articles × 20 caractéristiques. Deux houblons sans aucune quantité. Fil de Houblons citra et de Chambre froide avec adresses brutes (gclid, utm, 400 caractères).
- « Malt pilsner en rupture » : 5 messages `rangement: 'brut'` sans étiquette, copie de sa capture notes-vrac.
- Import du Planning : fabriqué par `carnetDeTache` (le code même de l'import du 3 sept.) : critère « Budget du Planning : 850 CHF », note « À faire du 01.05.2027 au 01.07.2027 », `date` = lundi 26 avr. 2027.

## Rouges par règle (code actuel)
| règle | rouges / tests | ce qui est rouge |
|---|---|---|
| R92 | 2 / 5 | champ au repos 55 px (min 52 + marges 8 + bordure 3 ; plafond 44) ; bande 71 px (plafond 60) |
| R93 | 9 / 10 | CHF/kg « ? » MotlerHops et Brau ; rang 1 sur Brau ; prix du sachet recopié comme CHF/kg (4,20 · 4,50) ; « 0,10 CHF » dans Choisir, la phrase « Part dans À venir » et la carte rang 2 ; plan À venir à 10 centimes |
| R94 | 9 / 10 | α « 10 - 15 » espacé et en chasse fixe (tableau, fiche, Choisir) ; Offre : le corps prend `flex: 1 1 100%` ; α dit deux fois (13,6 ; 10–15) ; « 3,72 » dit deux fois à Choisir ; pourquoi « En stock, … » ; Chambre froide : 21 lignes de valeurs |
| R95 | 6 / 7 | adresse brute dans le fil ; mot de 400 caractères ; titre redit en 1re bulle ; ni option, ni Résolu, ni tâche à l'ouverture d'un fil ancien |
| R96 | 8 / 10 | `analyserLigne` rend « article » pour « 4 CHF de plus le sac » et « critere » pour le constat ; constat devenu Critère ; « Résolu » écrit sans proposition ; budget « Critère : Budget du Planning » ; Quand « vers avr. · prix ? » ; À faire « sem. du 26 avr. 2027 » |
| R97 | 7 / 8 | « semaine du 14 décembre » non lue ; devis 620 CHF sans prix ; « hotte » dans « essayé » ; constat noté deux fois ; « Ou une balance neuve à 140 CHF » comme nom ; bandeau « Hors ligne » resté en ligne |

## Les 9 tests verts (garde-fous, tous justifiés)
R92 : texte actif d'un toucher, photo et micro présents, le champ grandit et redevient une ligne (le CSS actuel fait déjà `field-sizing: content` ; le défaut est la hauteur au repos). R93 : Comparer dit déjà une valeur pour MotlerHops. R94 : aucun élément vide dans le bloc Offre (le vide de la plainte est de mise en page). R95 : ouvrir un fil ne l'écrit pas. R96 : « 4 CHF de plus le sac » tapée dans un problème (IA éteinte, puis IA simulée en note) ne crée pas d'article dans CE parcours ; la cause de la plainte est `analyserLigne`, rouge ci-dessus. R97 : la piste « à 25 CHF » garde son prix.

## Doutes et limites
- jsdom ne mesure aucune boîte. R92 lit les vraies feuilles (hors @media) avec un modèle border-box (Tailwind) ; R94 « Offre vide » est jugé sur la cause de mise en page (le corps de l'Offre à 100 % de la ligne), pas sur 60 px mesurés : si c'est corrigé autrement, ce test est à citer dans RESULTAT de la voie c74b-fix avec sa raison. Rendu à 390 px à revoir en ligne.
- R95 : le contrat de l'écran (« option », « Résolu », « tâche » proposés à l'ouverture) est lu en gros (section.cnp-options avec « autre fournisseur » ; le mot « Résolu » et le mot « tâche » dans le carnet ouvert). Le MOT et l'endroit exacts restent à lui.
- C73-4 : la réponse de l'IA est SIMULÉE à la forme observée (constat en double) ; aucune réponse réelle relevée pour ce cas. C73-1 : testé sur `echeanceDite` (la date dite prime déjà sur l'IA, C70-5).
- R94 « pas plus de 8 lignes de valeurs » à Choisir : borne tirée de 390 × 844 (≈ 34 px la ligne) ; arbitraire dans le détail.
- Essais : 2 passes de test (le premier passage : 39 rouges dont un réglé à tort sur la bordure jsdom ; corrigé par la lecture postcss de la feuille).

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : jsdom lit mal le raccourci `border: 1.5px solid var(--c)` (rend 16px, le rayon) ; pour mesurer un cadre, lire la déclaration avec postcss.
LEÇON PROPOSÉE : aucune
