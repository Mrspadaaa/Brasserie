# CHASSE-edition : ajout et édition du Calendrier (21.11)

Version jugée : tag `en-ligne/2026-11-21-tour8`, build de test `vite.parcours.config.mjs` (`?dev-local`, fixture ZZ TEST du parcours Calendrier, aucune donnée réelle, aucun Gemini). 390 tactile (CDP touch), thème clair. Captures dans `captures-edition/` (toutes ouvertes et regardées).

Bilan : 2 gênants, 1 gênant à confirmer sur un vrai téléphone, 2 mineurs. Aucun bloquant.

## Défauts

### CH-edition-1 : gênant : ajouter une chose lointaine déplace la fenêtre à côté de la chose
- Geste : 390, « 3 mois ». Ventes › + de la rangée. CHF `12,5`. Horizon « 1 an ». Nom « ZZ TEST vente 1:1 ». Entrée.
- Attendu : la chose se pose à S46 2027 (15 nov. 2027) et se voit, ou le message le dit sans changer l'échelle.
- Constaté : la vue passe d'elle-même de « 3 mois » à « 6 sem. », sur S40–S45 2027. La chose est en S46 : elle est HORS de la fenêtre. Le message dit « S46 · Annuler » et rien ne se voit à l'écran. Les rangées Fêtes, Ventes, Achats, Travaux sont vides et très hautes (CAL-VIDE). Suite : le prochain + ouvre sa feuille préréglée sur S40 2027 (« vers oct. S40, 4 oct. »), pas sur aujourd'hui. Un achat posé ensuite sans y penser tombe en octobre 2027 (vu : achat « ZZ TEST achat b » daté 2027-10-04, fenêtre 3 sem.).
- Capture : `captures-edition/e14-apres-vente-1an.png`, `e14-achats-ouvert.png`.
- Fichier probable : la remise au point de la fenêtre après `onAjouter` dans `src/components/tabs/CalendrierTab.tsx` (non localisé à la ligne, budget épuisé).
- Forme nouvelle de CAL-ECHELLE-FIGEE / CAL-BARRE-BORD : l'échelle change sans ordre, et à côté.

### CH-edition-2 : gênant : pas de Supprimer dans la fiche ni dans Modifier
- Geste : 390. Créer « ZZ TEST fête sup » (Fêtes +, nom, Entrée). Toucher la chose : la fiche propose `Modifier | Lier | Ranger sans date`. Modifier : `Enregistrer` seul (et × de fermeture).
- Attendu : le brasseur retire ce qu'il vient de créer depuis la fiche ou Modifier (Supprimer, ou au moins un Retirer qui dit ce qu'il fait).
- Constaté : seul chemin, 5 touchers : chose › « Ranger sans date » › « Sans date › » (au bas d'une longue liste 2027) › la ligne › Supprimer (« Supprimée : ZZ TEST fête sup · Annuler », relu : bien supprimée). Le toast Annuler disparaît avant 11 s. Pour un achat, un travaux, un papier : le bouton est « Annuler l'achat », « Annuler les travaux », « Annuler le papier » (mot ambigu avec Annuler le geste). Pour un brassin : aucun Retirer ni Supprimer dans la fiche.
- Capture : `captures-edition/e10-fiche.png`, `e23-sans-date.png`, `e24-poche-detail.png`.
- Fichier : `src/ui/calendrier/frise/DetailChose.tsx:346-348` (`onRetirer`, `onSupprimer` seulement pour la poche Sans date). La décision « on ne supprime jamais » (L33) est dans `MenuAppuiLong.tsx:24` : à trancher par le pilote.

### CH-edition-3 : gênant, à confirmer sur vrai téléphone : le premier toucher sur Nom est perdu après un montant de 1 000 ou plus
- Geste : 390. Papiers › + . Toucher CHF, taper `1000` (ou `12000`, `250000`). Toucher le champ Nom (« Papiers · S47 »).
- Attendu : le curseur entre dans Nom au premier toucher.
- Constaté : `document.activeElement` reste un DIV ; le deuxième toucher entre. Avec `999` ou `120`, au premier toucher. Conséquence : le nom tapé juste après est perdu et le nom posé (« Papiers · S47 ») est créé tel quel. Vu en ajout sur Papiers ; même champ CHF partout.
- Capture : `captures-edition/e17-apres-tap-nom.png` (après le toucher : aucun focus sur Nom).
- Fichier probable : `src/ui/finance/ChampMontant.tsx:67-71` (au blur, le texte brut `1000` devient `1 000`, le champ se redessine).
- Réserve : headless Chrome sans clavier logiciel ; à rejouer sur un téléphone.

### CH-edition-4 : mineur : Entrée dans CHF ne fait rien
- Geste : 390. Ventes › + . Nom « ZZ TEST vente EntrMontant », CHF `50`, Entrée dans CHF.
- Attendu : le clavier annonce « suivant » (`enterKeyHint="next"`) : Entrée passe au champ suivant ou valide.
- Constaté : feuille ouverte, focus resté dans CHF, rien créé. Il faut toucher Nom puis Entrée (alors, créé, relu). Seul Nom a F-ENTREE.
- Fichier : `src/ui/finance/ChampMontant.tsx:48` (`enterKeyHint="next"` sans action).

### CH-edition-5 : mineur : la fiche d'un brassin n'a pas Modifier
- Geste : 390. Toucher « Fruty ». La fiche propose `Ouvrir le brassin | Commander | Budget › | Lier`.
- Attendu : renommer ou changer la date depuis la fiche, comme pour les autres genres (Modifier).
- Constaté : pas de Modifier ; il faut quitter le Calendrier (Ouvrir le brassin) ou glisser la barre.
- Capture : voir `captures-edition/e10-fiche.png` pour la fiche des autres genres (celle du brassin n'a pas été capturée à part).

## Vérifié, tient (ne pas rouvrir)
- Nom et Entrée à l'ajout, par le + de rangée : Fêtes, Travaux, Activités créent d'emblée (nom posé « ZZ TEST … », date aujourd'hui) ; l'étiquette se voit sur la frise et résiste au rechargement.
- Ventes, Achats, Papiers sans montant : refus lisible dans la feuille (« Indique un montant : un montant inconnu n'est pas 0. »). Brassin sans recette : « Choisis une recette. » (`e12-ventes.png`).
- Somme de 250 000 CHF : « C'est plus de 10 fois ta plus grosse somme de cette rangée » et bouton « Oui, 250 000 CHF ».
- Horizons et durée : « 1 mois » pose le 21 déc. (S52) ; durée 6 sem. tirée au doigt ; jours actifs 3 j : relu `fenetre {du 2026-12-21, au 2027-01-31, joursActifs 3}`, `estimatedRevenue 500`. La barre se voit avec ses 3 points (`e9-rechargé.png`).
- Renommer avec Entrée dans Modifier, pour vente, achat, travaux, papier, activité, fête : enregistré, relu après rechargement.
- Modifier une vente (montant 200, jeudi 17 déc.) : relu ; Annuler du toast restaure exactement l'état d'avant. Fermer sans enregistrer : rien écrit. Nom vidé : « Choisis un nom. ». Montant d'une fête vidé : `estimatedRevenue` retiré (inconnu, pas 0).
- Case vide touchée : Travaux et Activités créent d'emblée « Activités · S53 » (Annuler au toast) ; Fêtes, Ventes, Achats, Papiers, Brassins ouvrent la feuille sur la semaine touchée.
- Le + flottant ouvre « Partout / Sur le calendrier » avec les genres ; « Poser une fête », « Prévoir un papier »… ouvrent la même feuille.

## Pas joué (budget de contexte atteint ; la chasse n'est pas « à sec »)
- 1280 souris, thème cave, échelles 2 sem., 17 sem., An (ajout et édition joués en 3 mois seulement).
- Jours actifs avec une durée courte (10 j pour 1 semaine) ; Lier ; Modifier la durée d'une fête (CAL-MODIFIER déjà connu).
- Ajout d'un brassin avec chaque temps en cuve et la date relue ; Modifier d'un brassin.

## Doutes
- Une touche à l'arrière-plan (au-dessus de la feuille, sur « 3 mois » de l'en-tête) ferme la feuille et perd montant, durée et nom sans avertissement. Je l'ai vue par une erreur de mon banc ; comportement de fond de feuille habituel, non retenu comme défaut.
- La liste des recettes de Brassins + montre des homonymes indiscernables (« Jhhh » ×3, « neipa v3 » ×3) : vient de la fixture (une recette par brassin) ; à vérifier sur ses vraies données avant d'en faire un défaut.
- L'horizon pose le lundi de la semaine : « 1 an » écrit le 15 nov. 2027 (horizon dit « vers nov. »). Un jour précis à l'ajout pour Ventes, Achats, Papiers n'existe pas (CAL-JOUR connu : pas recité).
