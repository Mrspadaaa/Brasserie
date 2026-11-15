# Voie s2c — Ajouter une prévision m3pr-c (fin), Bien amorti m3im-c, Profil m4pf-c

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : 386e29f4 (commité)
- Décideur en cas de doute : pilote

## Objectif
Ajouter une prévision m3pr-c (fin), Bien amorti m3im-c, Profil m4pf-c : porté dans l'app, branché, typé, testé, au banc (reprise de s2 : lire d'abord work/missions/2026-11-14-finances/voies/s2/RESULTAT.md).

## Entrées
- Ses mots (15.11) : « m1do-a · m1ar-c · m3pr-c · m3pm-d · m3im-c · m4bb-a · m4pf-c · m4ia-c ».
- Les maquettes citées ci-dessous (etat.html, png, NOTE.md) ; `work/missions/2026-11-14-finances/DOSSIER-SOUS-VUES.md` pour ses goûts.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance/FinanceForms.tsx`
- `src/ui/finance/prevision`
- `src/ui/finance/bien`
- `src/ui/finance/profil`
- `tests/integration/previsionAjout.test.tsx`
- `tests/integration/bienAmorti.test.tsx`
- `tests/integration/profilEffets.test.tsx`
- `work/missions/2026-11-14-finances/voies/s2c`

## Consignes
- **Ajouter une prévision = m3pr-c** : déjà porté par s2 (`src/ui/finance/prevision`), pas encore vu ni testé : le voir au rendu côte à côte avec `work/missions/2026-11-14-finances/voies/m3/m3pr-c/`, corriger, tester.
- **Bien amorti = m3im-c** (`work/missions/2026-11-14-finances/voies/m3/m3im-c/`) : `AssetSheet` ; la cuve année par année, l'usure sous le doigt ; règles d'amortissement et catégories AFC du domaine inchangées (`annual.ts` intouché) ; confirmation des valeurs gardée.
- **Profil et paramètres = m4pf-c** (`work/missions/2026-11-14-finances/voies/m4/m4pf-c/`) : `ProfileSheet` ; chaque réglage montre ce qu'il change (solde, mois complétés, TVA, coût du litre), avec les nombres du domaine.
- `PaymentSheet` (dans FinanceForms) est déjà m5pa-d : ne pas y toucher.
- Un test par vue : enregistrement juste (centimes, dates), effet affiché = calcul du domaine.
- Captures 390 et 1280, clair et cave, de chaque vue ouverte et après son geste, côte à côte avec sa maquette, dans `work/missions/2026-11-14-finances/voies/s2c/cap/`, ouvertes.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : chaque maquette choisie portée telle quelle (`etat.html`, image, NOTE.md de sa voie ; les défauts du critique y sont déjà corrigés en passe 2) : mots, ordre, couleurs, tailles, gestes ; un port retire ce qu'elle n'a pas ; captures côte à côte maquette / app. Plancher à enrichir pour le contenu actuel (L07) : une donnée ou action actuelle sans place dans la maquette va dans un « … » et RESULTAT.md le dit.
- Acquis à garder verts : `node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000` (V6A OK), `node work/missions/2026-11-14-finances/voies/f1/controle-frise.mjs 3000` (FRISE OK), ses choix déjà en ligne (v6a + s2ap2, g3a, p5b, g6, m5pa-d, m5ap-a, m5fo-a, m5mo-c).
- Écritures et paiements : risque élevé. Aucune donnée réelle ; banc `http://localhost:3000/?dev-local&finance-demo` (déjà lancé, ne pas relancer). Services existants seulement ; règles Firestore `C:/Users/mrspa/Documents/Brasserie/firestore.rules` en lecture seule (paiement immuable, contre-paiement `CONTRE-<id>`, un lot par étape comme `src/ui/finance/modifier/executerCorrection.ts`).
- Hors ligne gardé ; jamais `type="number"` ; 44 px ; inconnu ≠ 0 ; hachure = à payer, rouge = en retard, pointillé = sans pièce ; clair et cave. Gemini jamais appelé (simulé dans les tests).
- Pas de Fable, aucun sous-agent. `npx tsc` : `node work/missions/2026-11-14-finances/outils/tsc.mjs` ignore `functions/`. Rien hors de « Possède » ; `git status --short` à la fin. Ne commite pas. Trois autres voies écrivent en même temps dans d'autres fichiers.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (plan, chaque étape, écarts à la maquette).
- La ligne « Tests » : `npx vitest run tests/integration/previsionAjout.test.tsx tests/integration/bienAmorti.test.tsx tests/integration/profilEffets.test.tsx --reporter=dot --no-color > work/missions/2026-11-14-finances/voies/s2c/tests.txt`.
Réponse finale au pilote : une ligne.
