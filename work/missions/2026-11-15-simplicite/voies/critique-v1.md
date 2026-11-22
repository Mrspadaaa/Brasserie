ECHEC — 17 problèmes : parcours comptés depuis le code, pas tirés de ses mots

Jugé : `maquettes.html` (passe 1), lu en HTML et rendu à 1280 et à 390 (captures dans le scratchpad, ouvertes). Sources : SPEC 10 au 15.11 (copie SPEC-26ca.md), PORTRAIT v2, `choix/ecrans.json`.
Phrase prédite du brasseur : « C'est joli, mais c'est pas mes problèmes. »

## Parcours qui ne reposent sur aucun de ses mots
1. **Densité du jour** (« 6 fois par semaine ») : aucune plainte sur la saisie de la densité. Il a seulement demandé le curseur (10.11, « utilise des slider plutot que de chiffre des input de chiffre sur téléphone »), et il a choisi m2.
2. **Corriger le stock** (mode « Compter ») : je ne trouve aucune plainte entre le 10 et le 15.11 (estimé, recherche par mots-clés).
3. **Note rapide rangée par l'IA** : je ne trouve aucun de ses mots. C'est un parcours inventé.
4. **Le tableau « Classement par gain »** : toutes les fréquences par semaine sont inventées (« ≈ 18 », « 6 / sem. »). C'est contraire à PRODUCT (« aucun chiffre inventé »), et c'est la base du classement.
5. Le fût et le Star San servent de premier exemple et de règle réglée (« Quand je lave un fût »). Il avait écrit : « C'est juste des exemples, être générique et général, pas focus sur ces exemples !!! » (15.11).

## Ses vraies plaintes absentes
6. Sa propre chaîne (10.11) : « Création de recette, met à jour les stock et besoin. Achat du matériel, met à jour le stock, brassage, met à jour les stock. Vente, met à jour les finances ». La cascade devait partir de là. Ni la recette vers le besoin, ni la vente vers les finances n'apparaissent.
7. Ses mots du 10.11 : « Quand j'entre une facture ou encaisse, je veux un Tab en bas, qui me montrer le changement dans mes finances », et « On voit pas vraiment ce que on ajoute ». La dépense « après » cache au contraire ses lignes (« 4 lignes → stock »).
8. « Atelier Houblons V5.5 … peut être retiré » (15.11) : une simplification qu'il a demandée mot pour mot, et que la page omet.
9. Finances › Opérations : « je peux pas fitré pour une intervalles de temps précis » (10.11). La période se règle à plusieurs endroits (m3, 15.11).
10. Des astuces qu'il a dictées lui-même : le bouton « next … ça doit respecter le filtrage » et le zoom sur la facture (10.11), et la lenteur des nouvelles vues (« lenteur dans l'app », 10.11).
11. Le besoin : « trop contraignant, pas intuitif … je veux un système d'embouteillage … budget » (15.11). La page le réduit à un scan relié, ce qui ne règle pas son problème de prospection.

## Ce qui fait cockpit, texte ou formulaire
12. Le premier écran est un tableau à huit lignes en chiffres à chasse fixe. C'est un tableur (L04), et pas une maquette.
13. Le schéma Action / Règles / Effets / Trace et la note « idempotent par identifiant d'événement » sont un jargon de développeur, pas des mots de brasseur.
14. « Réglage · une règle » est un formulaire de règles « quand X, alors Y » avec des pas. Il demande « autogéré, autocomplete », pas de régler un moteur. Le fil du jour (c3) et les pastilles sous chaque ligne (c2) rappellent zq1, qu'il a jugé « anxiogène ».

## Ce qui contredit ses maquettes choisies
15. La densité « après » utilise un pavé numérique. Or il a choisi m2, le curseur (10.11, « non part là dessus »).
16. Les fûts sont redessinés en lignes nues. Ils ne reprennent pas ses choix du 15.11 : « Entre l1 et l2 », « R1 Le lot d'abord », « F2 La carte d'identité », et les titres « propre et à laver ». Pour le besoin, la carte « Devis reconnu, Besoin → devis reçu ↺ » remet une étape de liaison alors qu'il a retenu « kyg1 sans étape de liaison » et dit « en théorie il y en a pas besoin ?? » (15.11).
17. La forme de la page de choix ne suit pas sa demande : une seule proposition par parcours, et aucun bouton « copier et choisir », alors qu'il a demandé « met cote à cote les propal » (15.11). À 390, le titre, le tableau et les téléphones débordent à droite. La page annonce « Sept parcours » mais en liste huit.

Doutes, non comptés :
- « −12 g Star San » d'un côté et « −5 ml » de l'autre : l'unité varie pour le même produit.
- « Eau −20 L » est compté comme un article de stock.
- « 3 fûts pleins » pour 58 L dans trois fûts de 20 L.
- « Client en texte libre » n'est pas vérifié dans le code.

## Cinq critères pour une passe 2 bien ciblée
1. **Chaque parcours s'ouvre sur sa citation** (date et mots, entre le 10 et le 15.11), et aucun parcours n'en est dépourvu. On retire les fréquences inventées.
2. **La cascade se montre sur sa chaîne du 10.11** : recette → stock et besoin, achat → stock, brassage → stock, vente → finances. La conséquence se voit dans un onglet du bas « changement dans mes finances ». Le fût et le Star San restent au plus un exemple parmi d'autres.
3. **Chaque « après » part de sa maquette choisie**, montrée à côté d'elle : m2 pour mesurer, l1/l2, R1 et F2 pour les fûts, b1 avec un + toujours flottant, kyg1 et kh1r sans étape de liaison, la vue FACTURE | STOCK. Rien ne la contredit.
4. **Zéro réglage et zéro jargon** : les conséquences sont déduites, et une correction se fait en un geste. Aucun formulaire de règles, aucun tableau en tête, une ligne de texte au plus par mini maquette. On inclut aussi ce qu'il a demandé de retirer (Atelier V5.5).
5. **La forme de la page suit ses consignes** : deux ou trois propositions côte à côte par parcours, un bouton « copier et choisir », aucun débordement à 390, et les deux thèmes.

LEÇON PROPOSÉE : une mission de simplification part de la liste de ses plaintes datées. Elle ne part jamais d'un comptage de touchers dans le code, et chaque parcours proposé cite ses mots.
