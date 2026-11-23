### Où le conseil s'accorde
- La confusion vient du contenu de chaque écran, pas du nombre d'outils. A, C, D, F et les trois revues le disent. Vérifié sur `y1b-390.png` : l'écran « Quand ? » porte un sélecteur de houblon, « + second houblon », des doses de 1 à 8 g/L, les levures US-05 et Pomona, un comparatif Idaho 7 / Citra, l'IBU et « Défi ».
- Substituer, c'est Comparer avec le houblon absent déjà chargé.
- Suggestions → « + » → Comparer (D78).
- Lot 22 : Comparer seul, sur la stout à 16 °P, avec Cascade, Idaho 7 et Galaxy, environ 12 variantes.
- On entre depuis Ma bière (C, D, F).

### Où il se divise
- Les portes : trois (A, B, C, F), ses quatre verbes (D), ou Choisir / Placer / Fermenter (E). E est écarté : « Choisir » regroupe justement les trois mots de sa plainte.
- La levure : dans le Quand (A, C, D), interrupteur de Comparer (B), ou outil propre (F).
- Le calcul : B abandonne le repli sans avoir chronométré. Les revues ont raison contre lui. `simulerCas` est pur et a un mode léger (`profil-simule.ts`), mais aucun temps n'a été mesuré sur téléphone.
- Le « Quand et combien » de F fait varier deux facteurs, ce qui contredit sa propre règle.

### Angles morts
- Comparer existe déjà : p06 et le radar p02 sont intégrés dans la base v4.6 (DEFAUTS D33 bis, #138). Le lot 22 part de là (L06).
- Le radar de Comparer attend toujours son choix, r2 ou r3 (registre, lot 16). Aucun avis ne le relève, et ce choix bloque le lot 22.
- Données : L14 et son contrôle sont encore « à écrire », et la note [[descripteurs-hors-familles]] n'existait pas au moment du conseil. Le comparateur risque de tromper sur Galaxy comme il l'a fait sur Nelson Sauvin.
- « pas pour tout de suite » (18.10) visait le lot 5. D78 et a2b sont plus récents : la levure reste sur la carte.

### Recommandation
Le président donne raison à F et C, minoritaires sur ce point. Règle : un seul facteur libre par écran, les autres fixés sur une ligne de contexte. y1b a déjà cette ligne : « Citra · 4 g/L · dry hop actif · 3 j · US-05 ». Le bouton porte son verbe, le titre porte la question (choix réversible).

**La carte**
- **Point d'entrée** : Ma bière, étape Houblons (disposition l8, radars m4/h4). Chaque houblon, ajout ou levure ouvre son outil en plein écran, car trois colonnes ne tiennent pas dans un panneau de 390 px.
- **Suggérer** : « Quel houblon ajouter à ma bière ? » (s5).
  - Varie : les candidats.
  - Pont : « + » vers Comparer.
- **Comparer** : « Lequel pour ma stout : Cascade, Idaho 7 ou Galaxy ? »
  - Varie : la variété seule.
  - Contenu : α et rôle en tête, puis la base v4.9 (p06, radar avec intervalles), la chimie rattachée aux familles, les vraies valeurs de v1 sous un toucher, la manière de w2 et le panel OSU sans molette.
  - Entrée « Je n'ai pas X » (u4) : X épinglé en colonne 1.
  - Pont : le gagnant ouvre Dryhopper.
- **Dryhopper** : « Quand l'ajouter ? » C'est y1b sans sélecteur de houblon, sans second houblon et sans levure.
  - Varie : le moment, par 5′. La dose reste en contexte, réglable d'un toucher.
  - En fin de frise, x3b réduit : « ma bière → +1 → +2 dry hops ».
  - Pont : vers Levure.
- **Levure** : « Que change ma levure ? » (a2b).
  - Varie : la levure.

**Avant le lot 22**
1. Un contrôle L10 au rendu : la liste des éléments admis par outil, un seul groupe de sélecteurs libres. Témoins négatifs : y1b et y3 doivent échouer.
2. Un contrôle L06 : radar, chimie, panel OSU et vraies valeurs présents.
3. Les données L14 : corriger le rattachement des descripteurs, puis confronter Cascade, Idaho 7, Galaxy, Nelson Sauvin et Motueka à leur réputation.
4. Chronométrer `simulerCas`, léger et complet, sur tout le catalogue, sans écrire de fichier. Le repli tient jusqu'à cette mesure.

**Lot 22** : Comparer seul. Ensuite Dryhopper, puis Levure.

**Au brasseur de trancher**
1. Radar de Comparer : r2 ou r3 ?
2. Comparer à dose égale, à effet égal sur l'arôme visé, ou à IBU égal ?
3. Substituer : une porte qui ouvre Comparer avec X épinglé, ou un outil propre (u4 complet) ?
4. Levure : dernière étape de Dryhopper, ou outil propre ?

### Premier geste
Dessiner une seule page en fil de fer qui suit la stout de l'étape Houblons jusqu'à Dryhopper. Elle montre un écran par outil, marque la ligne de contexte et le facteur libre, et pose les quatre questions fermées en tête. C'est elle qu'on montre au brasseur.

**Leçons retenues par le président** :
1. Faire : définir chaque outil par le seul facteur qui y varie et par la liste de ses éléments admis, avec un contrôle au rendu ; un titre en forme de question ne suffit pas (cause : au lot 21, « Quand ? » et « Quelle dose ? » laissaient libres le houblon, la dose et la levure).
2. Faire : avant de cadrer une question, relire les acquis déjà intégrés et les choix en attente, et lire une plainte du brasseur aussi comme une proposition (cause : le cadrage A / B / C ignorait Comparer v4.6, le radar r2/r3 et sa liste « suggestions, comparer, substituer, dryhopper »).
3. Faire : chronométrer le moteur avant d'écarter un repli que le brasseur a accepté (cause : la « grille 1,8 Mo » a été lue comme un coût, puis le repli a été écarté sans mesure).
