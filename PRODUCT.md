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

## Compréhension et boosters UX/UI

Les informations métier sont en grande majorité utiles. La densité doit servir
la compréhension et le geste : diminuer toutes les tailles, retirer du contenu
ou tout replier ne sont pas des objectifs. Les rappels utiles partagent une
source commune ; les informations nécessaires à la décision restent visibles.

Rechercher activement des moyens de compréhension autres que le texte, les
« boosters UX/UI ». Le choix des représentations et interactions reste ouvert.
Les revues valorisent leur bénéfice constaté pour comprendre une relation,
choisir ou régler, avec précision, unités, incertitudes et accessibilité.

## Travaux

- **Recettes** — assistant en sept étapes, import d'une recette collée, fiche de
  brassage modifiable là où les valeurs se lisent.
- **Chimie de l'eau** — profil ionique par style, solveur de sels plafonné par la
  fourchette du style, alcalinité résiduelle (Kolbach), acidification séparée de
  l'empâtage et du rinçage, dilution à l'osmosée.
- **Brassins** — déroulé minuté du jour de brassage, suivi de fermentation,
  déduction automatique des stocks.
- **Stocks, finances, clients** — inventaire, TVA suisse, factures QR.

## Orientation Levure — décision du 24 septembre 2026

La prochaine refonte graphique part des décisions du brasseur ; aucun élément
de l'écran actuel n'a de droit acquis à sa place. La richesse documentaire reste
accessible, mais l'entrée sert à trouver une levure, comprendre son effet dans
la recette, ajuster le procédé et comparer une alternative avant de l'appliquer.
Le détail de réalisation est dans [la mission Levure](docs/prompts/refonte-levure.md).

Privilégier les petits sachets secs (environ 11–12 g, sans imposer un poids unique)
et petits packs liquides. Classer l'approvisionnement par distribution effective :
Suisse d'abord, France et Allemagne au même rang ensuite, puis reste de l'Europe.
Le pays du laboratoire ne détermine pas la disponibilité. Séparer stock personnel,
référencement fournisseur, stock annoncé, conditionnement et livraison possible.
Les références étrangères restent recherchables pour identifier la levure d'une
recette et trouver des alternatives ; elles n'encombrent pas la sélection usuelle.
Une alternative fonctionnelle n'est pas une preuve d'identité de souche.

Au choix, montrer la quantité d'ensemencement nécessaire et le nombre entier
de sachets ou petits packs, selon la dose fabricant ou une estimation cellulaire
applicable. La quantité théorique, les unités (g, mL, cellules), la viabilité,
la date et la conservation connues ou inconnues restent explicites. Un starter
n'est proposé que si le produit et le contexte le justifient ; ne pas l'imposer
aux levures sèches. Son plan et ses étapes se préparent et s'enregistrent avant
le brassage si nécessaire, puis sont retrouvés au jour J. Le prévu figé dans
le brassin et l'ensemencement réellement effectué sont deux faits distincts.
La quantité choisie (par exemple un sachet du conditionnement documenté) reste
distincte du conseil calculé ; une action explicite applique le nombre conseillé.
Le conseil suit volume, densité et données du produit, sans écraser une quantité
manuelle. Ni le style de bière ni la seule masse de grains ne fixent la dose.
Distinguer la contribution des ajouts à la densité, leur fermentescibilité
documentée et le milieu approprié au starter, notamment extrait de malt versus
maltodextrine. Le parcours doit rester lisible sans déplier tout le calcul.

Gemini doit pouvoir rechercher, comparer, compléter, contrôler et corriger les
données persistées sur demande explicite. Une valeur provenant de la DB n'est
pas immuable. La correction montre ancien/nouveau, source, portée et justification,
puis passe par les outils de validation et de sauvegarde de l'application.
Une correction demandée n'autorise pas une réponse obsolète à écraser une saisie
ultérieure. Les simulations, faits du catalogue, lots et recettes gardent leurs
portées distinctes ; aucun brassin lancé n'est réécrit.

Pour chaque donnée : pourquoi le brasseur en a-t-il besoin, à quel moment, où,
et avec quel contrôle ou visualisation ? Les effets chiffrés exigent un modèle
documenté ; les tendances sensorielles qualitatives restent identifiées comme
telles. Une inconnue reste visible, sans précision inventée ni dossier opaque.

## Installation et conduite de Gaëtan

Le profil actif privilégie un empâtage fluide (4,2 L/kg), augmenté si la cuve le
permet pour tenir **18 L de rinçage à chaud**. Jusqu’à **24 L à chaud** reste une
exception explicite, avec le récipient principal et une bouilloire annexe ; le
volume à préparer à froid est distinct. La cuve fait 45 L, avec une limite utile
provisoire de 35 L à vérifier. Le fermenteur fait 30 L : 24 L est un repère,
pas son plafond physique. La place pour la mousse dépend du style, de la levure
et du choix expliqué du brasseur.

Les recettes et brassins conservent leur profil matériel figé. Une nouvelle
calibration concerne les prochaines recettes ; adapter une recette existante
est une action explicite qui recalcule aussi l’eau et son traitement.

Une montée en température et un maintien sont deux durées distinctes. Les
estimations de chauffe et de refroidissement restent identifiées, avec leurs
conditions et leurs données manquantes. Le serpentin puis le froid régulé sont
suivis séparément. Transférer sans levure laisse le brassin en attente : seul
l’ajout réel démarre la fermentation. Une température d’ensemencement plus
haute exige un protocole sourcé pour le produit et la forme de levure exacts.

Le rendement exige un couple volume/densité du même moût, sa référence de
température et les ajouts réels. Les sucres et extraits ne calibrent pas le
rendement des grains. Les coefficients changent uniquement après application
explicite d’une proposition issue d’au moins trois brassins comparables
(médiane des cinq derniers au maximum), avec sources, exclusions et historique.
Une correction de mesure signale les calibrations à revoir sans les réappliquer.

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

`web`, mobile d'abord. Vérifier le parcours sur **un mobile et un desktop**
représentatifs (390 et 1280 px par défaut). Ajouter une largeur seulement si un
défaut ou une incertitude le justifie ; conserver clavier, zoom et accessibilité.
