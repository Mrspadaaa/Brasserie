OK — 8 problèmes, 1 bloquants

# Test d'écran — Finances, constats 20, 21 et 33 du rejeu de nuit (voie v1)

Version : 8b9e1732 (arbre propre, `git diff HEAD -- src` vide). Banc local `?dev-local&finance-demo`, port 3000 ; il sert bien ce code
(`curl` des sources : `FicheEtiquette.tsx` porte « Supprimer ce projet », `ChoixPlage.tsx` « Tout l’historique », `TransactionJournal.tsx`
le filtre `void`). Script `work/missions/2026-11-14-finances/voies/v1/capturer.mjs`, points 20, 21, 21p, 33, chacun dans les quatre
configurations (390 tactile et 1280, clair et sombre `cave`), profil Chrome neuf par configuration. Données « ZZ TEST — Apport » 5,00 et
« ZZ TEST — Prévision » 7,00, écrites dans le seul navigateur de test. Journaux `j-20.log`, `j-21.log`, `j-21p.log`, `j-33.log` : les
16 passages finissent sans erreur (code 0). 44 captures copiées ici ; 15 ouvertes en plein format (le tableau), les 29 autres couvertes
par le journal seul.

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| 20-390-clair-liste.png | clair | 390 | Opérations après annulation de l'apport : ligne absente, payé 296,80 / à payer 400,00 / dépensé 696,80 | 1 | 0 |
| 20-390-clair-recherche.png | clair | 390 | recherche « ZZ » : « Aucune opération trouvée · novembre 2026 · « ZZ » » | 1 | 0 |
| 20-390-cave-annulees.png | sombre | 390 | Filtres › « Écritures annulées uniquement » : « Annulées », ZZ TEST — Apport, +5,00 barré, « Annulé » | 2 | 0 |
| 20-1280-cave-liste.png | sombre | 1280 | Opérations après annulation, mêmes totaux, ligne absente | 1 | 0 |
| 20-1280-clair-annulees.png | clair | 1280 | recherche « ZZ » + annulées uniquement : l'apport annulé seul, totaux inchangés | 2 | 0 |
| 21-390-clair-hub.png | clair | 390 | feuille « Sorties et entrées prévues » : ZZ TEST — Prévision 16.11 −7,00 → 4 114,60 | 1 | 0 |
| 21-390-cave-confirmation.png | sombre | 390 | Modifier la prévision › « Supprimer « ZZ TEST — Prévision » ? » Garder / Oui, supprimer | 1 | 0 |
| 21-1280-clair-apres.png | clair | 1280 | Prévisions après « Oui, supprimer » : Avec 2 107,34 (2 100,34 avant), ZZ sortie | 1 | 0 |
| 21p-390-clair-fiche.png | clair | 390 | fiche du projet depuis Prévisions : Retirer / Déplacer / Supprimer, puis Ouvrir le projet, sans chevauchement | 2 | 0 |
| 21p-390-cave-confirmation.png | sombre | 390 | « Supprimer « Fermenteur supplémentaire » ? » Garder / Oui, supprimer | 2 | 0 |
| 21p-1280-cave-fiche.png | sombre | 1280 | même fiche en bulle, quatre boutons sur une ligne | 3 | 0 |
| 33-390-clair-tout.png | clair | 390 | Plus › Période « Tout » : « Tout l’historique · 15 opérations », Du/Au grisés 01.06.2024 → 25.11.2026 | 1 | 1 |
| 33-1280-cave-tout.png | sombre | 1280 | même état à 1280 | 1 | 1 |
| 33-390-cave-plage.png | sombre | 390 | plage de 30 jours : titre « 18 oct. → 16 nov. », « 30 jours · 5 opérations », en-tête « 18.10–16.11 » | 0 | 0 |
| 33-1280-clair-plage.png | clair | 1280 | même plage à 1280 | 1 | 0 |

Bloquants : 1

## Argent (j-*.log, les quatre configurations identiques)

- 20 : apport 5,00 enregistré, corrigé puis annulé : « Écriture annulée » ; encore dans la liste false, encore dans la recherche false,
  visible par « annulées uniquement » true. Totaux d'Opérations inchangés (payé 296,80, à payer 400,00, dépensé 696,80).
- 21 : prévision 7,00 ajoutée, puis supprimée : confirmation true, ZZ encore là false ; carte Avec 2 100,34 → 2 107,34 (+7,00).
- 21p : fiche du projet true, confirmation true, « Garder » : fiche encore là true.
- 33 : « Tout » : durée en jours affichée false, « Tout l’historique » true ; plage 18.10 → 16.11 : « 30 jours » true.

## Problèmes

1. **Bloquant — en « Tout », la frise dessine un seul mois** (33-390-clair-tout, 33-1280-cave-tout) : la ligne dit « Tout l’historique ·
   15 opérations » et Du/Au « 01.06.2024 → 25.11.2026 », mais la frise juste en dessous va de « 1er » à « 30 » avec « auj. 16 » et les
   deux poignées aux bouts : c'est novembre. Bornes fausses pour la période choisie, au cœur du constat 33. En brasseur : « j'ai mis Tout,
   pourquoi ça va du 1er au 30 ? ». Attendu : en « Tout », la frise couvre l'étendue réelle (juin 2024 → nov. 2026) ou ne montre pas de
   poignées de mois.
2. **En-tête coupé à 1280 sur une plage** (33-1280-clair-plage) : la pastille de période dit « 18 oct. → 16 nov » rognée contre la flèche ›
   (le point et la fin manquent). À 390 elle dit « 18.10–16.11 », entière.
3. **« Mouvement enregistré. Fermer » reste en tête d'Opérations après l'annulation** (20-390-clair-liste, -recherche, 20-390-cave-annulees,
   20-1280-cave-liste, 20-1280-clair-annulees) : le message parle d'un mouvement qui vient d'être annulé. Pas à sa place (doute de
   fca6caf6, vu ici sur chaque capture).
4. **Panneau Filtres : « Tout », « Toutes » et « toutes les dates »** (20-390-cave-annulees, 20-1280-clair-annulees) : trois mots presque
   pareils, « Toutes » seule sur sa ligne sous « Courantes | Tout », « toutes les dates » en texte nu devant les puces. En brasseur :
   « c'est quoi la différence entre Tout et Toutes ? ».
5. **Légende du graphique en minuscules : « avec zz test — prévision »** (21-390-cave-confirmation) pour « ZZ TEST — Prévision ». FN-20,
   toujours là.
6. **Nom du projet coupé : « Avec Fermenteur suppléme… / Sans Fermenteur suppléme… »** (21-390-clair-hub, 21-1280-clair-apres,
   21p-390-clair-fiche, 21p-390-cave-confirmation, 21p-1280-cave-fiche ; « sans Fermenteur supplé… 2 857,34 » dans le graphique). FN-19,
   toujours là.
7. **Fiche du projet : « Limites » contredit les chiffres du dessus** (21p-390-clair-fiche, 21p-390-cave-confirmation, 21p-1280-cave-fiche) :
   « Avec cet achat, aucun mois ne tient le seuil de 0,00 CHF dans l’horizon » sous « Tu restes au-dessus de zéro » et « Plus bas
   2 107,34 le 25.01 ». Les deux ne parlent pas du même horizon (`materielFutur.ts` l. 204, horizon des soldes mensuels, non dit). En
   brasseur : « alors je passe sous zéro ou pas ? ». Non compté bloquant : le message peut être vrai sur l'horizon long.
8. **« CHF » seul à la ligne dans le titre de la fiche à 1280** (21p-1280-cave-fiche) : « Fermenteur supplémentaire, 750,00 / CHF ».

## Doutes (non comptés)

- La confirmation de la prévision met « Oui, supprimer » en gros bouton plein neutre (21-390-cave-confirmation), celle du projet en
  contour rouge (21p-390-cave-confirmation) : deux habits pour le même geste (doute de fca6caf6, inchangé).
- Hub des prévisions : la première ligne « Solde atelier −60,00 » n'a pas son solde « → », les suivantes l'ont (21-390-clair-hub).
- Recherche « ZZ » sans résultat : l'histogramme garde les totaux du mois (20-390-clair-recherche) ; voulu ou non, non tranché.
- Champs Du/Au en « Tout » : dates grisées dans un cadre pointillé, on peut les prendre pour des champs inactifs (33-390-clair-tout).
- Contour de focus resté sur l'avatar « G A » (33-390-clair-tout) et sur « Assistant de brassage » (33-390-cave-plage,
  33-1280-clair-plage) : probablement un reste du banc, pas un état que le brasseur verrait.
- 29 captures non ouvertes (feuilles et confirmations des autres configurations, `-apres` à 390, `33-*-tout` restants) : couvertes par
  les journaux, identiques d'une configuration à l'autre.
