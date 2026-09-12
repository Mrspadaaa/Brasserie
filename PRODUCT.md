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

Les opérations de cuverie demandent de préserver les mesures, les alertes et
les actions au bon moment. Les gants ou la pénombre peuvent justifier une
adaptation locale d'une commande ; ils n'imposent pas de grossir toute l'app.

## Priorité d'interface : densité utile sur mobile

**Maximiser l'espace disponible et compacter les données autant que possible,
en conservant une lecture et des actions claires.** Cette décision explicite
s'applique à toute l'interface : boutons, champs, en-têtes, pieds de page,
navigation, titres, lignes, marges et panneaux.

Des tailles standardisées sont souhaitées, mais nettement plus petites.
Le téléphone doit montrer le travail du brasseur : données comparables,
valeurs modifiables là où elles se lisent et action courante rapide. Les
explications secondaires s'ouvrent à la demande. Ni une alerte utile ni une
information nécessaire à la décision ne disparaît pour gagner de la place.

Choisir l'outil qui exprime le mieux la donnée ou le geste : les sélections,
pastilles, jauges, courbes, tableaux et résumés repliables font partie du
vocabulaire courant de l'application. Leur intérêt se mesure au temps gagné,
à la compréhension et à l'espace utile, pas à leur nouveauté.

Cette priorité remplace les anciennes obligations UI qui surdimensionnaient
l'application. [DESIGN.md](DESIGN.md) fixe l'échelle ; le
[guide UI](docs/ui-compacte.md) relie les besoins aux composants disponibles.
Toute tâche frontend, y compris déléguée, prend ces documents en entrée.

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
