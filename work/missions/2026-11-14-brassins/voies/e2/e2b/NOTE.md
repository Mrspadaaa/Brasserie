# e2b — NOTE

- Chaleur : **tiède**.
- Idée : **La vie du lot en frise.** La fiche est la biographie verticale du brassin : un rail coloré par étape (brassage, fermentation, garde, conditionné, écoulée), chaque étape avec sa date, sa durée et son chiffre ; l'étape en cours s'ouvre et porte son geste.
- Boosters : frise-stable (neuf jours de garde, relevés pleins, jour du jour encadré), bascule-fg (bascule « FG 1,010 confirmée »), plage-conditionnement (répartition bouteilles / fût au pouce), contenants, bascule-ecoulee, verdict, releve-cuve.
- Geste : la bascule passe au vert, la garde se referme, « Conditionner » s'ouvre avec la volume en cuve à saisir au curseur (« — » par défaut), fût F-02 libre.
- Annulé : le rail s'arrête en rouge à « Annulée », la suite est barrée.
- Écarts assumés : l'état annulé et l'état terminé laissent un bas d'écran vide ; pas d'onglets, Carnet et Dossier en icônes.

## Données
- Du brief (BRIEF-AUTEUR, « Les chiffres ») : Pils LOT-017 garde 2 °C depuis le 03.11, J+18, 1,010 stable depuis le 06.11, FG à confirmer ; Stout LOT-015 conditionnée le 06.11, 30 × 33 cl + fût 20 L F-01, 5,9 % ; Saison LOT-012 écoulée, 6,1 % ; Pale Ale LOT-020 prévue le 08.11, F2.
- **Fictives** (plausibles, sobres) : OG Pils 1,050, FG visée 1,008 – 1,012 et relevés 27.10, 30.10, 03.11, 10.11, 13.11 (fixture du banc a1) ; d'où alcool 5,3 % et atténuation 80 % (calculés) ; fermenteur « F3 » ; °C cuve « hier 2,1 » ; OG/FG Stout 1,058 / 1,014 et Saison 1,052 / 1,006, Saison 43 L brassés et 40 L conditionnés (fixture a1, cohérents avec 5,9 % et 6,1 %) ; dates des relevés et des étapes du Stout et de la Saison ; l'état « annulée le 14.11 » de la Pale Ale (cas annulé demandé, montré sur son vrai brassin) ; répartition 70 × 33 cl + 20 L proposée au geste.
- Aucun α, IBU ni arôme (aucun houblon sur ces fiches). Inconnu = « — » (°C cuve du jour, date d'écoulement, budget).

## Fonctions de l'écran actuel (BatchDetailSheet.tsx, batchTransitions.ts)
- OG, FG (cible), alcool calculé, relevé de densité, courbe, volume brassé et conditionné (saisir / corriger), Carnet (3 notes), Dossier (budget, « Passer en … », revenir à l'étape d'avant, annuler, supprimer), Fermer : déplacées : mesures dans l'étape en cours, Carnet et Dossier en icônes en tête, « Revenir en … » et « Supprimer » dans le Dossier.
- Non dessinés ici (à un toucher, inchangés) : « Jour réellement brassé », alerte de densité hors bornes, bandeau de suivi du stock, pilote NOLO.
- Ajouts proposés (neufs, à trancher) : « Rebrasser cette Saison », verdict « à refaire / à corriger / sans suite » du Carnet.

## Causes c3 évitées
- 1 : composition propre (voir Idée), aucun squelette commun aux quatre.
- 2 et 4 : le héros est la décision de l'état (confirmer la FG, déclarer écoulé, rebrasser, revenir à planifié), titrée en gros.
- 3 : couleur pleine (réponse, contenants, bandes) ; pointillé réservé au vide.
- 5 : sans objet (aucun houblon sur ces fiches).
- 6 : graphe resserré sur la plage utile, ou une forme qui dit le stable.
- 7 : aucune phrase grise d'aide au repos.

## Baseline (BRIEF-AUTEUR, « Obligatoire »)
- [x] geste m2 ou bascule à un toucher, jamais type="number", chiffres à la virgule
- [x] J+n depuis le levurage, avec sa date
- [x] °C de cuve face à la consigne, « — » quand non relevée
- [x] FG visée en bande, jamais en point ; alcool « provisoire » tant que la FG n'est pas confirmée
- [x] pas de cockpit, pas de bandeau d'alerte, pas de code interne, pas de paragraphe
- [x] cibles ≥ 44 px ; HTML autonome, classes et script préfixés
- Contrôles du lot non joués ici (v0) : controle-panel, controle-commun.

## Corrections f3a2 (14.11, verdict c5a)
- Volumes selon DONNEES-COMMUNES.md (pilote) : Pils 24 L brassés en F3, ≈ 22 L attendus après lies (≈ 2 L), volume en cuve « — » à saisir au curseur ; fût libre F-02 (20 L) ; Stout 21,9 L conditionnés, F-01 rempli à 12 L sur 20 ; Saison 24 L brassés, 21 L conditionnés.
