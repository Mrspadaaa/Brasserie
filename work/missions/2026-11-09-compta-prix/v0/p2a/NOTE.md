# p2a — Impôt bière, froid : combien, quand, à qui en trois lignes

Chaleur : **froide** (la baseline Clients › Impôt bière, à sa place, resserrée : la fourchette domine et dit pourquoi elle est large).
Idée : « Ma part à la Confédération » : **4,49 – 8,98 CHF** pour 26,6 L conditionnés, pastille « fourchette · densité manquante » ; trois lignes Combien / Quand / À qui ; « Noter la densité » remplace la fourchette par un chiffre (annexe : 12 °P, 6,74 CHF, exemple).

## Ce qui est montré
- Rail Clients / **Impôt bière** / Prix et marges (baseline) ; titre « Ma part à la Confédération » (pas le mot de l'onglet) ; segments 2025 / 2026.
- Réponse : « Pour 26,6 L conditionnés en 2026 », **4,49 – 8,98 CHF**, pastilles « taux plein · réduction à confirmer », bouton « + Noter la densité ».
- Combien : 16,88 à 33,76 CHF par hl, selon le °Plato · Quand : à la sortie de cave, **aucune sortie notée** (rouge) · À qui : OFDF, par Taxas, déclarer sous 20 jours, payer sous 30 · Par bière : 33 cl 0,08 · 75 cl 0,19 · fût 20 L 5,06 CHF (à 12 °P, exemple).
- Brassins de 2026 : Pale Ale de septembre, 26,6 L, « °P ? » en pastille, 4,49 – 8,98 ; « Année entière, si 1 200 L à 12 °P ~ 303,84 · estimé · exemple ».
- Réduction petit brasseur › (Réglages) ; Comprendre le calcul ⌄ ; liens Taxas, Directives OFDF ; primaire « Copier l'estimation ».
- Annexe : densité notée (12 °P, exemple) : 6,74 CHF, pastille verte « 12 °P · classe 10–14 », Combien devient « 25,32 CHF par hl · 0,266 hl ».

## Problèmes de l'inventaire
13 (la ligne Quand dit « à la sortie de cave, pas à la mise en bouteille », et avoue « aucune sortie notée »), 14 (un seul barème : 16,88 / 25,32 / 33,76), 12 en partie (le montant est un chiffre à prévoir ; le lien vers Prévisions reste à dessiner), 125-métier (« combien, quand, à qui » en trois lignes ; le statut déclaré/payé manque).
Baseline : année, avertissement (devenu pastille), montant, réduction, densité manquante (devenue l'action), Comprendre (pli), Copier, Taxas, Directives : tout est là.

## Honnêteté
Fourchette tant que la densité manque ; 12 °P et 1 200 L marqués « exemple » et « estimé » ; la réduction n'est pas appliquée et le dit ; les dates limites ne sont pas calculées (« aucune sortie notée »).

## Boosters UX (boosters-ux)
- annee — choisir ; segments 2025 / 2026.
- noter-densite — déclencher ; bouton dans la réponse ; la fourchette devient un chiffre et la pastille passe au vert (annexe).
- Statique (09.11) : l'état « densité notée » est dessiné à côté.
- B1 OK · B2 OK (la fourchette à 28 px ; un primaire) · B3 ECHEC (113 mots hors données : trois lignes à deux niveaux, chrome compris) · B4 OK · B5 non mesuré · B6 OK · B7 OK · B8 OK (fourchette, « °P ? », « aucune sortie notée ») · B9 s.o. · B10 OK · B11 OK (« entre 4,49 et 8,98 CHF, densité à noter ») · B12 OK · B13 OK (lignes 58 px, bouton 28 px).

## Contrôles
PAGE OK · 1280 OK · COMMUN OK (les 6) · mots 113 (> 60) · panel : remplissage **0,498**, juste sous le plancher 0,50 (lignes de texte fines, pied bas) : à resserrer en passe 2 (pied remonté sous la liste, brassins en pastilles).

## Tient / casse
- Tient : il retrouve son écran ; la fourchette est expliquée par une pastille et corrigée par une action.
- Casse : trop de lignes à deux étages ; le statut « déclaré / payé » n'existe pas encore ici (voir p2c).
