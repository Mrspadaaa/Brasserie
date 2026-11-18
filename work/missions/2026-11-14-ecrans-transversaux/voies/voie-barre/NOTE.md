# voie-barre — la barre du bas et le + (v0, 4 mini maquettes non jouables)

Contexte commun : écran Brassins › Brassins (B-031 IPA Nelson J+4, B-030 Triple d'automne, B-032 planifié, B-029/B-028
conditionnés), même en-tête qu'aujourd'hui (logo, lune, loupe, ⋮ ; « Ce mois ▾ » à 1280). Source unique : `fabrique.mjs`
(classes préfixées par variante, assemblage par gabarits, sans remplacement de chaîne, L26).

b1 · Le + à ordre figé · froide · défauts réglés n° 10, 11, 12, 13 · le menu du + devient une feuille à deux zones : « Sur cet écran » (une seule ligne, couleur de la rubrique : Nouveau brassin) puis « Partout », six tuiles dans un ordre qui ne change jamais (écriture, facture, vente, recette, brassin, compagnon) ; la pastille compagnon entre dans sa tuile (« hors connexion ») ; le toast se range au-dessus de la barre, jamais sur les onglets de l'écran ; à 1280, rail latéral de 88 px (Material 3), le + en tête du rail, menu en liste avec raccourcis N, E, F, V, R, B, C (proposé) ; la barre étirée disparaît à l'ordinateur.
b2 · La rangée Créer · tiède · défauts réglés n° 10, 11, 12 · le + ne couvre plus l'écran : il ouvre une rangée de pastilles collée à la barre (l'action de l'écran en premier, pleine, puis Écriture, Facture, Vente, Recette, Compagnon hors connexion en pointillé) ; le contenu reste lisible, sans voile ; à 1280, une bande sous l'en-tête porte les rubriques à gauche et les créations à droite, toujours visibles (zéro clic pour ouvrir) ; « Lancer un brassin » se fond dans l'action de l'écran sur Brassins (pas de doublon).
b3 · L'orgue des rubriques · chaude · défauts réglés n° 10, 11, 12 · le + fait monter, au-dessus de chaque onglet, la colonne de ce qu'on crée dans cette rubrique (Finances : écriture, facture, vente ; Brassins : brassin, recette, idée ; Stocks : article, houblon, fût, matériel ; Clients : client, tarif ; Bord : compagnon, marqué hors connexion) ; l'action de l'écran est la case pleine ; chaque création a toujours la même place, au-dessus de sa rubrique ; à 1280, barre latérale avec un + par rubrique et la colonne couchée à côté ; les créations de Stocks et Clients au + sont nouvelles (proposé : aujourd'hui seulement par l'action d'écran).
b4 · L'éventail au pouce · chaude · défauts réglés n° 11, 12 (10 en partie) · le + rond s'ouvre en quart de cercle sous le pouce droit : anneau proche = l'action de l'écran (Nouveau brassin) et le compagnon (nuage barré hors connexion) ; anneau extérieur fixe, cinq gestes toujours au même angle (écriture, facture, vente, recette, brassin) ; à 1280, les rubriques passent en segment au centre de l'en-tête (proposé, à accorder avec la voie menu) et le même éventail sort du coin, lettres de raccourci sur chaque pétale (proposé).

## Ce qui disparaît ou bouge (rien de perdu)
- Les 5 onglets restent (Bord · Finances · Brassins · Stocks · Clients), la pastille Stocks « 3 au seuil » aussi (existe : `criticalStockCount`).
- Les lignes du + d'aujourd'hui (Nouvelle écriture, Compagnon brasseur, Encaisser une vente, Créer une recette, Lancer un brassin, Entrer une facture, action de l'écran) ont toutes une place dans les 4 variantes. b2 et b3 abrègent les libellés (« Écriture », « Vente ») ; b2 fond « Lancer un brassin » dans l'action d'écran sur Brassins.
- La pastille flottante « Compagnon hors connexion · mode local » disparaît partout : elle devient l'état de l'entrée Compagnon (b1 tuile + pied du rail, b2 pastille en pointillé, b3 case du Bord + pied de barre latérale, b4 pétale barré).
- « sera B-032 » (b1) : numéro du prochain brassin, proposé.

## Jugement (3 lignes)
- Préférée : **b3** — elle répond aux deux moitiés de la question d'un même geste : la rubrique dit où l'on crée, la place ne change jamais, et elle se lit sans texte ; risque : colonnes de 62 px, libellés d'un mot.
- b1 est la plus sûre à porter (raccourcis clavier, toast rangé) ; b2 la plus légère, l'écran reste vivant ; b4 la plus joueuse, mais le quart de cercle cache Brassins, Stocks et Clients à 390.
- À regarder par le critique : densité du 1280 (contenu court, grand vide sous les tables, fixture de 5 brassins), et si le rail de b1 ou la bande de b2 est la vraie navigation d'ordinateur attendue.

## Boosters UX (boosters-ux, v0 : recopiés, non mesurés)
- Boosters : `creer` (b1) déclencher, feuille à deux zones ; `rangee-creer` (b2) déclencher sans voile ; `orgue` (b3) déclencher + se repérer, colonnes par rubrique ; `eventail` (b4) déclencher au pouce, angle fixe par geste. Maquettes non jouables : avant/après = captures a et b.
- B2 OK (une action pleine par état : l'action de l'écran) · B3 OK (aucune légende ajoutée) · B6 3 tailles 12/14/16, chiffres en Plex Mono · B7 à mesurer en passe 2 (cave : texte sur production en #12100E) · B8 hors connexion dessiné dans les 4 · B13 cibles ≥ 36 px à 390 (b3 : cases 62 × 56) · autres s.o. en v0.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
