# M3 — Test par scénarios de bout en bout (persona) — Calendrier global

Méthode : test par scénarios (Kaner, « An Introduction to Scenario Testing », 2003 ; Carroll, « Scenario-Based
Design ») : histoires crédibles et motivées, de bout en bout, dont le résultat se juge facilement. Persona : le brasseur,
au téléphone Android, d'une main, entre deux brassins. App en ligne https://brasserie-l-affinee.web.app/, thème clair.
Données « ZZ TEST — M3 — … » seulement, toutes supprimées (preuve en fin de rapport). Captures regardées :
`work/missions/2026-11-23-calendrier-en-ligne/M3-captures/` (nn-*.jpg|png ci-dessous).

## Paquet et conditions (à lire avant les verdicts)

- **Paquet** : S1 à S10 ont été joués d'abord sur l'onglet servi par le service worker, **ancien paquet
  `index-B8Mp3grp.js`** (constaté par `document.scripts` à la fin de ce passage ; pas vérifié au début). Après le
  message du coordinateur : rechargement sans cache (Ctrl+Maj+R) → **`index-Bt0rkeZN.js` (tour 10)**, puis rejeu
  partiel (colonne « Tour 10 » plus bas). Attention : un `navigate` normal ressert l'ancien paquet par le service
  worker ; seul Ctrl+Maj+R donne le tour 10.
- **Taille** : `resize_window 390×844` n'a jamais donné 390 de large : l'onglet rendait 628×1297 px CSS, puis
  500×693 (fenêtre partagée, dimensionnée par d'autres). Un essai d'iframe 390 est refusé par l'en-tête de cadrage de
  l'hébergement. Les captures sont donc à 628 puis 500 de large, pas 390.
- **Rejeu tour 10 sans vision** : pendant le rejeu, la fenêtre de mon groupe était réduite (outer 160×28) ; toute
  capture échouait (« renderer frozen », 30 s). Le rejeu tour 10 est donc mesuré au DOM seulement : il confirme ou
  infirme les faits, il **ne vaut pas validation visuelle** (L12). Mon groupe d'onglets a aussi été supprimé deux fois
  par d'autres (onglets recréés : 1005988790, puis 796, 799, 803).
- La période de l'app est partagée entre onglets (stockage local) : un autre agent l'a mise sur 7 sept. → 4 oct. ; je
  l'ai remise sur 9 nov. → 6 déc. par la feuille Période.

## Scénarios (écrits avant de jouer) et résultats

| # | Scénario | Étapes jouées | Attendu | Observé (B8Mp3grp, vision) | Tour 10 Bt0rkeZN (DOM) | Verdict |
|---|---|---|---|---|---|---|
| S1 | Poser mon prochain brassin | + → Recette « ZZ TEST — M3 — recette » (vide, enregistrée) ; + → Poser un brassin → puce de la recette → « Ajouter en S47 » | Feuille pré-remplie sur la semaine visée ; barre dans la frise et dans Brassins | Pré-rempli S47 (« cette semaine, 22 nov. »). Barre posée (01), aria « 22 nov., S47, J0/28 · prête 20 déc. ». Barre dessinée depuis le lundi 16 nov. (02, T10-M3-3). Liste Brassins : présent, **lot « LOT-4eeeabd2-badc-… »** (20, T10-M3-2). Date du brassin par puces « Aujourd'hui / 1 mois… », pas par la frise (T10-M3-5) | Feuille brassin : 5 puces, aucune frise (T10-M3-5 confirmé). Création non rejouée (pas de vision) | OK fonctionnel, 3 défauts |
| S2 | Décaler d'une semaine, puis annuler | Glisser la barre ZZ +1 sem. ; Annuler du toast | Barre déplacée ; Annuler la remet ; rien d'autre ne bouge | Glisser OK, toast « 22 nov. → 29 nov. · Annuler » (03). Annuler touché vite : retour OK (04). Toast visible ~5 à 7 s ; Annuler touché à ~10 s : trop tard, rien. État transitoire « J0/35 · prête 3 janv. » lu une fois juste après Annuler, puis correct. Autres barres immobiles | Non rejoué | OK |
| S3 | Régler la date au doigt dans la fiche | Toucher la barre ZZ → fiche v02 → toucher « 29 nov. » → réglette | Réglage par la frise B partagée (CAL-FICHE-FRISE) | Fiche v02 (05). La date devient une réglette propre `.cal-fi-regle` (06), pas la frise partagée. Glisser à la souris : la réglette se ferme sans rien changer (07). Glisser au toucher (pointer touch) : +60 px = +7 j, enregistré, puis la fiche entière se ferme (08). Pictogramme posé sur « 29 nov. » | Non vérifié (vision impossible ; mon essai de toucher a ouvert la feuille Période à la place, fermée sans changement) | **KO (régression)** |
| S4 | Noter une idée, un papier, une activité, des travaux | + → chaque action → nom ZZ → Ajouter | Bonne feuille ; semaine pré-remplie ; chose au bon endroit | Bonne feuille à chaque fois, pré-rempli S47 (semaine en cours). Idée : 104 puces de semaine, la sélection S47 hors écran (10, T10-M3-5) ; arrive au Carnet, pas au Calendrier. Papier déplacé au doigt sur la frise vers S48 → posé 23 nov. S48 (11, 12). Activité S47. Travaux étendus à 2 sem. par la poignée de fin → barre S47→S48 (27) | Idée : 104 puces semaine, 0 frise ; Papier : frise `cal-f-duree-poi` + 5 puces ; papier, activité, travaux posés S47 22 nov. | OK, défauts T10-M3-5, -6 |
| S5 | Prévoir un achat, une vente, une fête | idem, montants −37 / +50 | idem + courbe | Achat déplacé en S49 par la frise de durée → posé 30 nov. S49 ; vente S47 +50 ; fête S47 (16). Toast de pose : chiffres différents de l'en-tête (T10-M3-7) | Achat, vente, fête posés S47 22 nov. | OK, T10-M3-7 |
| S6 | Achat prévu depuis le Carnet, puis glisser sa barre | Carnet → idée ZZ → Quand 1 mois, Prix 100 CHF → « Au calendrier » ; puis glisser l'achat ZZ du + | L'achat prévu arrive dans Achats et dans la courbe ; sa barre se glisse | « Au calendrier » ouvre le Calendrier S50–S2, ampoule sur S52 seulement (18) ; Achats « vide », argent inchangé (−706). Suppression : « ni dans À venir, ni en commande » (19). L'achat posé par le + se glisse : 30 nov. → 23 nov., totaux de semaine suivent | Non rejoué | **KO** (T10-M3-4) |
| S7 | La courbe d'argent suit | relevé « CHF à dépenser » après chaque geste | variation = montant | −683 → −694 (−11) → −719 (−25) → −756 (−37) → −706 (+50) ; suppressions : −669, −644, −694, −683. Exact | −683 → −706 (−11−25−37+50) → −683 après suppressions. Exact | OK |
| S8 | Bord → Calendrier → Brassins → retour | changer la fenêtre (S50–S2), aller Bord, Stocks, Brassins, revenir | État gardé | Fenêtre S50–S2 gardée au retour (28) ; Brassins garde son sous-onglet. Bord : agenda montre fête et activité ZZ (17). Carnet à deux adresses : Brassins › Atelier › Carnet et Stocks › Matériel › Carnets | Navigation par les onglets OK | OK, d |
| S9 | Rechargement en plein geste | + → Achat, nom tapé, recharger | Rien de fantôme ; état cohérent | Rien créé, argent inchangé (22, 23). Brouillon perdu ; fenêtre du Calendrier revenue à 4 sem. autour d'aujourd'hui ; semaine dépliée repliée | — | OK (d) |
| S10 | Ménage | supprimer chaque ZZ M3 | Tout disparaît ; vraies choses intactes | Suppression par fiche › « … » › Supprimer, sans confirmation, avec Annuler (24). Fiche du brassin : pas de « … » ni Supprimer (26, T10-M3-8) ; supprimé par Ouvrir › « Budget, compagnon, supprimer ». Recette : feuille › Supprimer › confirmation | 6 choses (t10) supprimées par la fiche ; relevé après identique | OK, T10-M3-8 |

Couverture : 10 scénarios sur 10 joués sur l'ancien paquet avec vision ; sur le tour 10, S1 (feuille), S4, S5, S7,
S8, S10 rejoués au DOM, S2, S3, S6, S9 non rejoués (fenêtre réduite, pas de vision). Couverture estimée : 100 % des
scénarios avec vision sur B8Mp3grp, 60 % au DOM sur Bt0rkeZN.

## Défauts

Paquet de constat : V = ancien B8Mp3grp avec capture ; T = confirmé au DOM sur Bt0rkeZN.

1. **T10-M3-1 — G — Fiche v02 (Calendrier), date d'une chose** (V ; T non vérifié). Toucher une barre de brassin →
   fiche → toucher la date. Attendu : la frise B partagée (mêmes classes et gestes). Observé : réglette propre
   `div.cal-fi-regle[data-regle]` (« Brassage : glisser pour changer la date », ±120 j) ; à la souris elle se ferme
   sans changer ; au toucher elle marche mais referme toute la fiche ; picto par-dessus « 29 nov. ». Captures 06, 07,
   08. **Régression CAL-FICHE-FRISE.**
2. **T10-M3-2 — m — Brassin posé par le + : numéro de lot brut** (V). + → Poser un brassin → Ajouter. Attendu :
   LOT-0NN comme les autres. Observé : « LOT-4eeeabd2-badc-4a32-b72f-b3858486a13f » dans Brassins, au Bord et dans le
   toast « … supprimé ». Capture 20.
3. **T10-M3-3 — m — Barre posée au lundi, pas au jour** (V). Brassin du 22 nov. (dimanche) dessiné depuis le
   16 nov. ; daté 29 nov., dessiné depuis le 23 nov. ; la date de fin affichée (« prête 20 déc. ») est juste.
   Décalage visuel jusqu'à 6 jours à l'échelle 4 sem. Capture 02. À rapprocher de CAL-ECHELLE-COHERENTE (à confirmer
   s'il s'agit d'un choix d'échelle).
4. **T10-M3-4 — G — « Au calendrier » d'une idée du Carnet ne crée pas d'achat prévu** (V). Carnet → idée → 1 mois,
   100 CHF → Au calendrier. Attendu : achat prévu dans la rangée Achats, compté dans la courbe, glissable. Observé :
   seule une ampoule sur la semaine S52 ; Achats vide ; argent inchangé ; la suppression dit « ni dans À venir ». Le
   prix estimé ne compte nulle part. Captures 18, 19.
5. **T10-M3-5 — G — Choix de date hors frise dans les feuilles du +** (V et T). Poser un brassin : puces « Aujourd'hui
   / 1 mois / 3 mois / 6 mois / 1 an », sans frise ; Noter une idée : rangée de 104 puces S32…, la semaine choisie
   hors écran ; idée au Carnet : mêmes puces. Les autres feuilles (papier, achat…) ont la frise. Captures 10 (et
   feuille brassin, S1). **Régression GESTE-DATE-PARTOUT.**
6. **T10-M3-6 — G — Étiquettes de la courbe** (V). Après chaque ajout : « consomable ( m… −23 » rognée puis
   disparue ; « ZZ … papier −11 » coupe le bord du cadre ; étiquettes barrées par la courbe ; « ZZ TEST — M3 —… −25 »
   rognée. Captures 13, 14, 15. **Régression CAL-FRISE-ETIQUETTES / CAL-AN-390 (« aucun texte rogné »).**
7. **T10-M3-7 — m — Toast de pose : chiffres différents de l'en-tête** (V). Papier −11 : en-tête −683 → −694, toast
   « S48 : −680 → −691 » ; achat −37 : en-tête −756, toast « −716 → −753 » ; vente : toast « −702 → −652 ». Deux soldes
   sans dire lequel. Captures 12, 16.
8. **T10-M3-8 — m — Fiche du brassin sans « … » ni Supprimer / Modifier** (V). Les autres fiches ont « … ›
   Supprimer ». D412 : « CHE-2 (Supprimer) et CHE-5 (Modifier un brassin) entrent dans la fiche ». Capture 26.
9. **T10-M3-9 — m — Semaine dépliée : courbe et grille à deux échelles** (V). Toucher S48 : la grille passe en jours
   (23…29), la courbe reste en semaines ; « lol −600 » ne tombe plus sur sa colonne ; icône de « neipa v3 · lotus »
   rognée au bord gauche ; « S48 23–29 nov. » écrit deux fois. Capture 09. Proche de CAL-ECHELLE-COHERENTE.
10. **T10-M3-10 — d — Le + ignore la semaine touchée** (V). Après avoir touché S48, le menu propose toujours
    « en S47 ». (Hors fenêtre, il propose la 1re semaine visible : S50.) Capture 21.
11. **T10-M3-11 — d — Bouton + par-dessus les actions de la fiche** (V). Fiche travaux › « … » : la ligne Supprimer
    passe sous le +. Capture 25.
12. **T10-M3-12 — d — Toast par-dessus le bas de la liste** (V). Après une suppression, toucher la chose suivante en
    bas de liste a touché « Annuler » du toast : l'activité supprimée est revenue (relu au DOM).
13. **T10-M3-13 — d — Libellés de la feuille** (V). « Quand cette semaine S47, 22 nov. » contre frise « S47, 16 nov. » ;
    après réglage de durée, « cette semaine S47, 16 nov. » ; « vers nov. » ; un achat a une « Durée ».
14. **T10-M3-14 — d — Ordre des brassins instable** (V). Ttt et Hefe échangent leur place entre deux chargements.
15. **T10-M3-15 — d — Carnet à deux adresses** (V) : Brassins › Atelier › Carnet et Stocks › Matériel › Carnets.

Non reproduit / environnement : un gel de 30 s du rendu à l'ouverture du Carnet par la recherche (une fois, puis
systématique dans une fenêtre réduite) : attribué à la fenêtre réduite, non retenu comme défaut.

Total : 15 défauts — B 0, G 4 (T10-M3-1, -4, -5, -6), m 5, d 6.

## Relevé avant / après (vraies choses)

- Avant (9 nov. → 6 déc., 4 sem.) : « −683 CHF à dépenser · S50 » ; Brassins Milk Stout J205/255 · prête 11 janv. ;
  NEIPA Test J80/97 · 9 déc. ; Ttt pas brassée · 10 janv. ; Hefe pas brassée · 13 déc. ; neipa v3 J12/14 · 24 nov. ;
  neipa v3 J11/12 · 23 nov. ; Jhhh J0/15 · 1 déc. ; neipa v3 J0/12 · 28 nov. ; Ttt 30 nov. (−4) ; Fête « vi » ; Vente
  10 × Bière · Restaurant du Lac +5 695 ; Papiers lol −600, Impôt sur la bière · 2 brassins.
- Après (tour 10, DOM) : mêmes choses, mêmes dates et états (Milk Stout 1 mai S18 … Ttt 30 nov. S49 J0/91 · prête
  1 mars ; vi 12 oct. ; Restaurant du Lac 10 nov. ; lol 22 nov. ; Impôt 22 nov.), « −683 ». Brassins 17 → 16 → 16 et
  Recettes 24 → 23 (retour au compte d'avant ma recette et mon brassin). Aucune vraie chose déplacée.

## Preuve de suppression des ZZ TEST — M3

Supprimés : recette « ZZ TEST — M3 — recette », brassin LOT-4eeeabd2… (toast « supprimé »), idée du Carnet (Carnets
16 → 15), papier, activité, travaux, achat, vente, fête ; puis les 6 « (t10) » du rejeu. Contrôle final au DOM :
`[aria-label*="ZZ TEST — M3"]` = 0 au Calendrier ; « ZZ TEST — M3 » absent des pages Brassins, Recettes et Atelier ;
« CHF à dépenser » revenu à −683. Les ZZ d'autres méthodes (M4, M5, « parcours r2 / 10.11 ») ne sont pas à moi et
n'ont pas été touchées.
