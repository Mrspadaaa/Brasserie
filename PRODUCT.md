# L'Affinée — vérité produit

> Contexte durable pour toute personne, humaine ou agent, qui touche à cette
> application. Ce fichier ne décrit **pas** l'apparence : voir `DESIGN.md`.

## Produit

Application de gestion d'une micro-brasserie suisse : recettes, brassins,
chimie de l'eau, stocks, comptabilité TVA et clients.

Ce n'est pas un carnet de brassage de plus. Sa particularité tient en une règle :
**elle refuse d'inventer un chiffre plausible.** Un calcul qui manque d'une
donnée s'annonce *incalculable* plutôt que de retourner une valeur ronde. Aucun
champ n'arrive prérempli d'une mesure qui n'a pas été prise.

## Utilisateur

Gaëtan, brasseur, seul opérateur. Il est à la fois le producteur, le comptable
et le commercial. Il n'y a pas d'équipe, pas de rôles, pas de permissions.

Deux scènes d'usage, opposées, dans la même journée :

| | **Cuverie** | **Bureau** |
|---|---|---|
| Appareil | Téléphone, une main | Téléphone ou portable |
| Mains | Gantées, mouillées, occupées | Libres |
| Lumière | Pénombre | Normale |
| Attention | Fragmentée, minutée | Continue |
| Erreur coûte | Un brassin de 30 L | Une ligne à corriger |
| Écrans | Assistant de recette, jour de brassage, atelier de l'eau | Finances, clients, stocks |

La cuverie commande. Quand les deux scènes s'opposent, c'est la cuverie qui
tranche : on peut refaire une saisie comptable, pas un empâtage.

## Travaux

- **Recettes** — assistant en sept étapes, import d'une recette collée, fiche de
  brassage modifiable là où les valeurs se lisent.
- **Chimie de l'eau** — profil ionique par style, solveur de sels plafonné par la
  fourchette du style, alcalinité résiduelle (Kolbach), acidification séparée de
  l'empâtage et du rinçage, dilution à l'osmosée.
- **Brassins** — déroulé minuté du jour de brassage, suivi de fermentation,
  déduction automatique des stocks.
- **Stocks, finances, clients** — inventaire, TVA suisse, factures QR.

## Contraintes durables

- **Langue : français.** Vouvoiement jamais ; l'application tutoie ou reste
  impersonnelle. Les anglicismes du métier (*cold crash*, *dry hopping*) sont
  admis quand ils sont le mot réellement employé au fourquet — pas ailleurs.
- **Suisse** : CHF, TVA suisse, factures QR, Fribourg / OFDF pour les échéances.
- **Une recette figée dans le brassin.** Modifier une recette ne réécrit jamais
  un brassin déjà lancé.
- **Hors ligne d'abord.** Firestore avec cache ; la cuverie n'a pas de réseau.
- **Le cœur métier est testé** : `src/domain/` et `src/services/brewingMath.ts`
  sont couverts par `tests/`. Une modification d'écran ne doit jamais forcer une
  modification de calcul.

## Pile

React 19 · TypeScript · Vite · Tailwind v3 · Firestore · Dexie.
Pas de `react-router` : les pages plein écran passent par `useFullScreenRoute`.
`vaul` a été explicitement refusé — les feuilles sont faites main en CSS.

## Plateforme

`web`, mobile d'abord. Vérifier tout rendu à **320 / 375 / 430 / 1280 px**.
