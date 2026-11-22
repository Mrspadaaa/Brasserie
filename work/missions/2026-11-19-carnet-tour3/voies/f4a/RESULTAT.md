EN COURS — voie f4a (reprise possible : voir § REPRISE)

id | verdict | commit | test | rouge→vert | écran touché

## REPRISE — état du code (non commité, port-carnet), plafond de contexte atteint
Modifiés par f4a (rien d'autre) : src/services/firestoreRepo.ts (persistance sessionStorage dev-local : CLE_DEV_LOCAL, sauverDevLocal
dans notify, restaurerDevLocal dans startSync, `devLocalRestaure()`), src/services/migration.ts (dev-local : pas de graine si restauré),
src/domain/carnets/analyseLocale.ts (façon en queue), src/domain/carnets/operations.ts (accepterProposition « le débit »),
src/ui/carnets/CarnetsVue.tsx (detailDe : genre + import GENRE_LIBELLE), tests/unit/carnetsTour3F4a.test.ts (neuf).
NB : firestoreRepo.ts/migration.ts sont hors « Possède » (lu « src/db/** si v2-neuf 1 l'exige » : la couche données) : à valider par le pilote.
Tests : tests-rouge.txt = 5/5 rouges sur HEAD. tests-vert.txt (avant retrait du titre) : 4/5 verts ; le test dev-local échoue encore
(à déboguer : sans doute `vi.useFakeTimers` + import dynamique, ou `syncing` déjà vrai au 2e module ; essayer d'appeler sauverDevLocal
via `pagehide` sans faux minuteurs). v2-neuf 4 (titre majuscule) RETIRÉ : il cassait ~20 tests « phrase en titre » (titre = phrase
comparé tel quel) ; à refaire en ne changeant que l'affichage, ou `ecarte` (R10/R11 : sa phrase en titre) ; retirer alors son `describe`.
tests-final.txt : 8 échecs / 700 ; hors f4a : G8 bulle (carnetsEcrans ×2, carnetsParcours), carnetsCritique5Figes hors-ligne
« l'IA les cherche », carnetsEcrans L4-5, carnetsTour3F4b : probablement les fichiers en cours de f4b (CarnetOuvert, ChampCarnet) — à
rejouer après le commit de f4b. Restent à faire : PCN-19 (note-critère dans fixture.ts), PCN-126/v2-neuf 3 (annonce `quitte`), v1-neuf 4,
v2-neuf 6 (DEMANDE f4b ou ecarte n° 14), PCN-37 (ouvert : vrai téléphone, ChampCarnet = f4b), captures, commit par chemins.

## Diagnostic (19.11)
- v2-neuf 1 : cause = cache mémoire de `?dev-local` (firestoreRepo.ts, branche dev-local de put/bulkWrite/startSync) : tout rechargement
  de page (Vite recharge quand une autre session modifie un fichier de port-carnet) ou remontage d'App (effet currentUser=null →
  clearMemoryCache → stopSync → `delete cache[c]`) efface tout, puis la graine se rejoue (« Base initialisée… »). Production : NON
  (persistentLocalCache IndexedDB, src/services/firebase.ts:72 ; migration en lot `set` sur des id fixes, ne retire rien ; drapeau
  hasMigrated). Correctif : persister le cache dev-local en sessionStorage, le restaurer à startSync ; migration dev-local ne regraine
  pas si restauré.
- PCN-22 : `detailDe` (CarnetsVue.tsx:308) écrit « Notes : » même pour une note typée « à acheter » (genreLocal la type bien, PIECES).
- PCN-19 : feuille G25 (FeuilleNote) jamais atteinte : aucune note du banc ne ressemble à un critère ; « moins de 60 dB » va droit en
  critère (normal). Correctif : une note du type dans la fixture (fixture.ts).
- PCN-126 / v2-neuf 3 : `ecrireIA` branche `cree` (CarnetsVue ~684) : l'IA (simulée) range « tuyau silicone 8 mm, 5 m » en critère du
  carnet ouvert `depuis` ; « ailleurs » l'y envoie. Correctif : une ligne que l'IA renvoie dans le carnet que le cadre a dit quitter reste
  dans le carnet neuf annoncé (champ `quitte` sur l'annonce).
- v1-neuf 1 : `extraireCriteres` : « Moulin à malt 2 cylindres » (compte en queue du 1er morceau) ignoré ; le rendre en façon.
- v2-neuf 2 : `accepterProposition` (operations.ts:371) recopie « Comparer sur débit » ; texte = « le débit » (comme ZZ-V-K3 de la fixture).
- v2-neuf 4 : `titreDePhrase` sans majuscule ; mettre la majuscule (la phrase reste le titre, R10/R11).
- v2-neuf 6 : ligne Critère (CarnetOuvert.tsx:236-245, voie f4b) : le critère rangé de même caractéristique (débit) fusionne avec « le
  débit » (uniquesParTexte) et `uRange` retire l'unité entière. Règle critique 6 n° 14 : chaque critère écrit une fois.
- v1-neuf 4 : branche `!depuis` de ecrireIA (fin) renvoie à la liste si le bandeau final n'est pas `cree` ; à creuser.
- PCN-37 : ChampCarnet (voie f4b) ; vrai téléphone.
