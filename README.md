# Brasserie — L'Affinée

Application de gestion d'une micro-brasserie : recettes, brassins, stocks,
chimie de l'eau, comptabilité et clients. React + TypeScript + Vite, données
sur Firestore avec cache hors-ligne.

Elle est écrite pour un usage réel en cuverie : saisie au pouce, calculs qui
s'annoncent *incalculables* plutôt que d'inventer une valeur plausible, et
aucun champ prérempli avec un chiffre qui n'a pas été mesuré.

## Ce que fait l'application

- **Recettes** — assistant en sept étapes, import d'une recette collée, fiche
  de brassage entièrement modifiable là où les valeurs se lisent.
- **Chimie de l'eau** — profil ionique par style, solveur de sels plafonné par
  la fourchette du style, alcalinité résiduelle (Kolbach), acidification
  séparée de l'empâtage et du rinçage, dilution à l'osmosée en % ou en litres.
- **Brassins** — déroulé minuté du jour de brassage, suivi de fermentation,
  déduction automatique des stocks.
- **Stocks, finances, clients** — inventaire, TVA suisse, factures QR.

Le cœur métier vit dans `src/domain/` (chimie de l'eau, couleur, programmes de
brassage) et `src/services/brewingMath.ts` (volumes, densités, IBU Tinseth,
mise à l'échelle). Ces calculs sont couverts par `tests/` et par les scripts de
vérification de `scripts/`.

## Démarrer

```bash
npm install
cp .env.example .env
cp src/data/seedData.example.ts src/data/seedData.ts
npm run dev
```

Deux copies sont nécessaires parce que les deux fichiers correspondants sont
tenus hors du dépôt :

- **`.env`** porte la configuration Firebase du projet. Les valeurs se lisent
  dans *Console Firebase > Paramètres du projet > Vos applications*. Sans
  elles, l'application démarre et le dit clairement dans la console.
- **`src/data/seedData.ts`** est le jeu de données initial. Le dépôt n'en
  contient que le gabarit, à vide : le vrai fichier porte une comptabilité
  réelle, qui n'a pas sa place dans un dépôt public.

## Vérifier

```bash
npm test
```

Cette commande exécute uniquement les tests locaux avec fournisseurs IA
simulés. Elle n'utilise ni clé Gemini ni quota facturable. Les rares contrôles
contre un vrai modèle sont séparés et protégés par une confirmation explicite ;
voir `docs/compagnon-brasseur.md`.

```bash
node scripts/check-water.mjs
```

Les scripts de `scripts/` reprennent à la main les calculs qui comptent —
chimie de l'eau, unités, brassage — pour qu'un chiffre faux se voie même quand
les tests passent.

## Déployer

```bash
npm run deploy
```

Construit le bundle, régénère les règles Firestore depuis `.env`, puis publie
les deux sur Firebase. Demande un `.firebaserc` local pointant sur le projet
(`{"projects":{"default":"<id-du-projet>"}}`).

⚠️ `firestore.rules` est **généré** par `npm run rules` depuis
`firestore.rules.template` : le dépôt ne versionne que le gabarit, où la liste
des comptes autorisés est un jeton. Ne pas lancer `firebase deploy` à la main —
il enverrait un fichier de règles périmé ou vide, ce qui ferme la base à tout le
monde. Voir [DEPLOY.md](DEPLOY.md).

Les Cloud Functions lisent leur liste d'autorisation dans `functions/.env`
(gabarit : `functions/.env.example`) et se déploient par
`npm run deploy:functions`.

## Licence

Aucune licence n'est accordée pour l'instant : le code est publié pour lecture.
