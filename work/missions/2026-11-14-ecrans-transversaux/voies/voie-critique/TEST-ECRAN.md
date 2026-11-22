OK — 10 problèmes, 3 bloquants

Version : 44e1fcc0 (branche claude/ecrans-transversaux), ?dev-local sur le port 3037, joué dans l'app : 390 tactile (DPR 2) et 1280, clair et cave. Captures dans `test-ecran/` (préfixes `<largeur>-<thème>-…`, et `-d-` pour le banc semé des fixtures r3).
Comparé à ses choix : m3 (voie-menu), d3p2 (voie-p2-d3), b1s-a (voie-r2-b1), r3p2 (voie-p2-r3).

## Combien et quels problèmes ?

**Bloquants**
1. En-tête, thème clair, 390 et 1280 : l'avatar de qui saisit est un disque noir sans sa lettre « G ». Seul le « A » se lit (`390-clair-bord`, `1280-clair-plus`). m3 montre un G blanc sur fond noir. En cave, la lettre se voit. Texte illisible.
2. Plus › « Mes conversations » : toucher la ligne n'ouvre rien, aux deux largeurs et dans les deux thèmes (`*-f-conv`). La ligne affiche pourtant « hors ligne », l'état que dessine la feuille n° 8 de d3p2 (« Compagnon hors connexion · mode local »). Cause lue : `BrewerActivity.tsx` (l. 64) n'écoute `brewer-inbox-open` que hors `localOnly`. Geste sans effet. Pas vérifié en ligne.
3. Plus : il manque l'état écrit à droite de « Connexions cloud et IA » (m3 : « ✓ Drive · IA Rapide » ; ici Drive est « à connecter ») et à droite de « Réglages » (m3 : « ⚠ IBAN à corriger » ; Réglages compte ici « 2 erreurs », dont l'IBAN). Ces éléments de sa maquette sont absents (`390-clair-plus`, `1280-clair-plus`).

**Non bloquants**
4. Recherche à 390 tactile : après le toucher sur la loupe, le focus reste sur le bouton loupe. « cit » tapé ne s'écrit nulle part (`390-clair-rech-cit`) et il faut toucher le champ une seconde fois. r3p2 montre le champ actif, clavier levé. À 1280, le focus est bon.
5. Le + sur Finances à 1280 : les trois actions de tête reviennent dans « Partout » avec ↑ (Nouvelle écriture, Entrer une facture, Encaisser une vente), soit six lignes pour trois gestes (`1280-clair-p-finances-menu`). Même doublon pour « Brassin ↑ » sur Brassins aux deux largeurs. b1s-a dit : « moins celle déjà montée en tête (pas de doublon) ». C'est un écart à sa maquette, issu d'une lecture du pilote (« toujours possible ») à faire valider.
6. Le + sur Brassins, avec B-031 en fermentation à J+4 (banc semé) : la seconde action est « Courses » seule. b1s-a montre « Saisir une densité · B-031 · J+4 » et « Ajouter aux courses · froment ». Le titre de la feuille dit « Brassins › Brassins » ; b1s-a dit « Brassins » (`390-clair-d-p-brassins-menu`).
7. Plus à 390 : la ligne Journal affiche « 0 · novembre 2026 » en chasse fixe espacée, et « Journal des modifications » passe sur 2 lignes. m3 dit « 23 en novembre » sur une ligne. La tuile Assistant (« Aucun brassin en cuve ») passe sur 4 lignes (`390-clair-plus`).
8. Réglages › Fiscalité à 390 : dans les pastilles pointillées, « à saisir » est collé en haut au lieu d'être centré (`390-clair-reg-Fiscalité`).
9. Plus à 1280 : la carte de période n'a ni titre « Période » ni le mois choisi en gras (m3 : « Novembre 2026 »). La période ne se lit qu'en petit, dans « du 1er au 31 oct. » (`1280-clair-plus`).
10. Recherche à 390 : sous la feuille, l'écran est voilé de blanc (délavé), alors que r3p2 l'assombrit en gris. Le contexte se perd (`390-clair-rech-vide`).

**Ce qui tient**
- Période : « Mois dernier » réglé dans Plus se lit partout pareil : pastille « Oct. », Finances « Octobre », Bord « Octobre 2026 », et le choix tient au rechargement.
- Le + flotte sur les 14 écrans aux deux largeurs. « Partout » est toujours présent et l'écran passe en tête.
- Recherche : « cit » donne 5 résultats, avec α et stock. « Corriger » ouvre la correction d'inventaire de Citra T90. « Rien pour « zzqxw » » propose ses gestes. « 1 de plus dans les archives » s'affiche.
- Réglages : les 4 onglets s'ouvrent. Journal, Connexions et Saisir au nom correspondent à d3p2 (la bascule change bien l'en-tête en « Aricia »).
- Caisse v3a (+ › Vente) intacte à 390, en clair et en cave.

**Doutes (non comptés)**
- Brassins n'affiche rien de la période en dehors de la pastille d'en-tête. Je n'ai pas pu vérifier que la liste la suit.
- Plus montre des segments avec une frise ; Finances montre des puces « sept. oct. nov. tout … ». « Une plage comme pour les finances » : reste à confirmer que la frise de Finances est bien celle derrière « … ».
- La pastille ‹ Nov. › de l'en-tête n'existe pas dans m3. Je la lis comme l'un des « plusieurs endroits » (14.11).
- Avec un brassin B-031 en cuve, le + annonce « sera LOT-001 » (numérotation des fixtures ?).
- Caisse à 1280 non ouverte : le + 1280 dit « Encaisser une vente », pas « Vente ». Données ?dev-local presque vides : recherche et + jouées sur les fixtures du banc r3, pas sur de vraies pièces.
- Finances à 390 : les cases Entré et Dépensé laissent un vide à droite (hors périmètre ?).

## Verdict
NON LIVRABLE : 3 bloquants (n° 1, 2, 3). Ensuite, corriger d'abord 4 et 5, puis rejouer ce test.
