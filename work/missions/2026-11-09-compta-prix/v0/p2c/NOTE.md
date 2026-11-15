# p2c — Impôt bière, chaud : en cave / sorti, et le Compagnon rédige la déclaration

Chaleur : **chaude** (forme libre : deux colonnes s5a, une sombre « en cave », une « sorti » ; la frise des délais ; l'IA au toucher).
Idée : l'impôt n'est dû que quand la bière sort de cave (problème 13). L'écran sépare ce qui attend (en cave, sombre) de ce qui est dû (sorti, à l'OFDF). « Dû aujourd'hui : 0,00 CHF » est le vrai chiffre ; sortir 12 L le fait monter à 2,03 – 4,05 CHF. La frise dit quand déclarer et payer ; « Rédiger ma déclaration » demande au Compagnon le texte, marqué exemple, avec ses sources.

## Ce qui est montré
- Feuille ouverte depuis Prévisions : « ‹ Prévisions · Impôt bière · 2026 » (proposition : l'impôt est une échéance, il vit dans Finances).
- « Dû aujourd'hui **0,00 CHF** ».
- En cave (sombre) : Pale Ale de septembre, conditionné 26,6 L, densité « °P ? · à noter », impôt à venir 4,49 – 8,98 ; stepper − 0 L + ; « Sortir de cave → » (aplat paille : l'action de la colonne) ; « en cave 26,6 L · 4,49 – 8,98 CHF ».
- Sorti (rosé) : « Rien de sorti en 2026 · vente, marché ou bière bue sur place » ; « dû 0,00 CHF ».
- Frise : sortie de cave → déclarer sous 20 jours · date ? → payer sous 30 jours · date ? ; « à qui : OFDF, par Taxas ».
- Pied : « Rédiger ma déclaration » (Compagnon, violet) · primaire « Noter la densité ».
- Annexe : 12 L sortis en novembre → Dû 2,03 – 4,05 CHF, en cave 14,6 L · 2,46 – 4,93 ; réponse du Compagnon « déclaration de novembre · exemple » : le texte, « D'après : 12 L sortis, 26,6 L conditionnés, barème OFDF 2026 », date limite 20 déc., Copier / Ouvrir Taxas.

## Problèmes de l'inventaire
13 (l'assiette devient la sortie de cave, suivie ici), 12 (l'impôt est une échéance de Prévisions, par sa place), 125-métier (combien **dû**, quand, à qui ; le statut déclaré/payé découle de la colonne Sorti), 14 (un barème).
Baseline : année, montant, réduction (à dire au port : pastille dans la carte), densité manquante (« à noter » + action), Comprendre (pli à dire), Copier et Taxas (dans la réponse du Compagnon), Directives (pli).

## Honnêteté
« Dû 0,00 » parce que rien n'est sorti : un vrai zéro, expliqué dans la colonne. Fourchettes tant que la densité manque, même après la sortie. Les dates limites disent « date ? » tant qu'aucune sortie n'est notée ; une fois 12 L sortis, « 20 déc. » est calculé (20 jours après le mois de novembre). La réponse du Compagnon est marquée « exemple », cite ses sources, ne remplace aucun calcul et n'apparaît qu'après le toucher (ajout du 09.11 au brief).
Un seul facteur libre : les litres sortis.

## Boosters UX (boosters-ux)
- cave-sorti — comparer ; deux colonnes, sombre / rosé ; la réponse « Dû aujourd'hui » suit la colonne de droite.
- sortir-litres — ajuster ; stepper − + (`inputmode=decimal`) et « Sortir de cave → » ; la carte passe à droite (annexe).
- compagnon-declaration — déclencher ; bouton violet ; réponse en carte « exemple » avec sources et date limite (annexe).
- Statique (09.11) : l'état « 12 L sortis + réponse » est dessiné à côté.
- B1 OK · B2 OK (« Dû aujourd'hui » à 28 px ; un primaire noir, l'aplat paille est l'action de colonne : à trancher) · B3 ECHEC (91 mots hors données) · B4 OK · B5 non mesuré · B6 OK · B7 OK · B8 OK (vide dessiné dans la colonne Sorti) · B9 s.o. · B10 OK · B11 OK (« rien de dû tant que rien n'est sorti ») · B12 ~ (deux aplats forts : noir et paille) · B13 OK (stepper 28 px, boutons 28–32 px).

## Contrôles
PAGE OK · 1280 OK · COMMUN OK (les 6) · mots 91 (> 60) · panel : remplissage 0,828, le plus dense des six.

## Tient / casse
- Tient : c'est le seul des trois qui dit la vérité du métier (dû à la sortie) et qui donne un statut ; l'IA épargne la rédaction.
- Casse : la colonne sombre tranche avec la page blanche (chaud assumé) ; deux aplats d'action ; sans sortie notée, l'écran reste à 0,00 longtemps.
