# Chasse Calendrier — regard « données et cohérence » (21.11)

Version jugée : tag `en-ligne/2026-11-21-tour8` (5fb61c580), build de test `vite.parcours.config.mjs`, `?dev-local&finance-demo=parcours-calendrier`,
fixture ZZ TEST `scripts/parcours/fixtures/calendrier.mjs`, jour = samedi 21.11.2026 (S47). Chrome 390 tactile (touch), 1280 souris, échelles
2 sem., 6 sem., 3 mois, An. Références recalculées avec le vrai `buildForecast` / `summarizeLedger` sur la même fixture (script jetable, hors dépôt),
puis recoupées à la main (calculs ci-dessous). Le sol de départ : `openingCash` −683,00 au 01.01 + vente encaissée +27,00 = **−656,00 CHF** en caisse.

**Bilan : 0 bloquant, 8 gênants, 3 mineurs.** Limites en fin de fichier.

## Ce qui est JUSTE (calcul → affiché)

| Affiché | Calcul depuis la fixture | |
|---|---|---|
| Caisse −656 (Synthèse « En caisse », variante sans pièce à confirmer) | −683,00 + 27,00 (PAY-REC-ZZ-VENTE) | juste |
| Semaine S47 « −63 » (bande ±) | −45 −45 (2 emballages Jhhh du 21.11) +27 (vente) | juste |
| S48 « −424 » | −24 (énergie neipa v3, 25.11) −400 (loyer 26.11) | juste |
| S49 « −1 629 » | −45 (emball. neipa v3 30.11) −24 (Ttt 30.11) −540 (malt 01.12) −420 (Brouwland 02.12) −600 (lol 03.12) | juste |
| Ventes 6 sem. « +27 » | seule vente datée S44–S49 (Café du Pont est le 07.12 = S50) | juste |
| Achats 6 sem. « −960 » | −540 −420 | juste |
| Ventes 3 mois « +2 257 » | +27 +130 +900 +1 200 (= « Entré 1 227 » + « Prévu » 130+900) | juste |
| Achats 3 mois « −1 200 » | −420 −540 −240 | juste |
| Travaux 3 mois « −1 220 » | −320 −900 | juste |
| Papiers 3 mois « −955 » | −600 −55 −300 | juste |
| Fêtes « +3 580 estimé hors courbe » | +2 400 +1 180 (hors courbe, dit « estimé », jamais « confirmé ») | juste |
| Papiers An « −1 051 + coût à venir » | −600 −55 −300 −96 (impôt 11 brassins, partiel « + ») | juste |
| Titre « −6 925 CHF à dépenser S43 ’27 » | −656 − (somme prévision à fin oct. 2027) = −6 925,20 (solde mensuel 2027-10 de `buildForecast`) ; le loyer du 26.11.2027 tombe après la 52e semaine | juste, constant à toutes les échelles et en 390/1280 |
| Dates « prête » : neipa v3 23 et 24 nov., Jhhh 22 nov., Blonde 21 déc., Ttt 28 déc., Jhhh-3 19 déc., Fruty 4 janv. | date de brassage + (primaire + garde) de la recette figée | justes |
| « pas brassée · prête le 1 déc. / 19 déc. » (Hefe, Ssr, Ttt) | aujourd’hui + 10 j / + 28 j (brassin dépassé replanifié à aujourd’hui) | juste |
| J10/12, J9/12, J33/34, J203, J78 | jours depuis le brassage réel | justes (sauf CH-donnees-9) |
| Bord « Charges 475,00 » ; « Point le plus bas −3 729,00 · 28.12 » (variante sans pièce à confirmer) | 420 + 55 ; plus bas jour par jour : −656 … −3 409 (26.12) −320 (28.12) = **−3 729**, puis +1 200 le 29.12 | juste |
| Prévisions « écart 90 j −2 669,20 » | 2 230,00 entrées − 4 899,20 sorties (21 sorties) | juste |
| Calendrier 390 = 1280 | mêmes pastilles, mêmes titres, mêmes sommes aux échelles testées | égal |

## Défauts

### CH-donnees-1 — Le Calendrier affirme un solde que Finances et le Bord déclarent inconnu (gênant)
- Geste : fixture telle quelle (une pièce payée sans paiement : `T-ZZ-POMPE`, « 1 paiement historique à confirmer »). Onglet Finances › Synthèse, puis Bord, puis Calendrier.
- Attendu : « une seule caisse » (K4) : si Finances dit « solde pas connu », le Calendrier ne chiffre pas un « CHF à dépenser » ferme.
- Constaté : Finances › Synthèse « En caisse À compléter … sans eux, le solde n’est pas connu » ; Finances › Prévisions « Confirmer les paiements (1) … le solde n’est pas connu » ; Bord : aucune ligne « point le plus bas ». Calendrier : « **−6 925** CHF à dépenser S43 ’27 », courbe, creux, bande ±, tout tracé comme si la caisse était sûre. Retirer la pièce (variante « propre ») : Finances dit « En caisse −656,00 », le Bord écrit « −3 729,00 · 28.12 » et le Calendrier garde le même −6 925 : il ne distingue pas les deux cas.
- Cause probable : `useDonneesCalendrier.ts:115,190,204` ne teste que `openingCashCents === null`, jamais `cashComplete` ; le Bord applique `pointBasAVenir` (`forecast.ts:58`, `!cashComplete → null`).
- Captures : `fin-defaut.png` (Finances), `bord.png`, `cal-defaut.png` ; variante `propre-bord.png`, `propre-prev.png`.

### CH-donnees-2 — L’étiquette de la courbe ne dit que la moitié de la semaine (gênant)
- Geste : Calendrier 390, 6 sem. ; lire l’étiquette « Emballage −45 » posée sur S47 (et son nom complet « Emballage · Jhhh −45, S47 » dans le DOM).
- Attendu : −90 (deux brassins Jhhh, chacun −45 le 21.11) ; Finances › Prévisions dit « emballage (2 fois) −90, 21.11 » ; la bande ± dit S47 = −63 = −90 + 27.
- Constaté : −45. Un seul mouvement est nommé : le second de même nom est ignoré, et la marche de la courbe (−90) ne correspond plus à son nom. Même mécanisme sur les homonymes d’autres semaines (« neipa v3 », « Ttt », « Jhhh »).
- Fichier : `src/ui/calendrier/entete/Courbe.tsx:259-266` (`parNom` indexé sur `m.nom`, le doublon n’ajoute que sa semaine). La lecture au doigt, elle, regroupe (`mouvementsDeSemaine`, `calendrierCaisse.ts`), d’où deux chiffres pour la même semaine.
- Capture : `cal-defaut.png`, `fiche-neipav311.png` (étiquettes sur la courbe).

### CH-donnees-3 — La pastille « Brassins » compte des montants datés hors de la fenêtre, et les dit « confirmé » (gênant)
- Geste : 2 sem. puis 6 sem., lire la pastille de Brassins.
- Attendu : la somme des mouvements de la fenêtre (comme Ventes, Achats, qui comptent par date).
- Constaté :
  - 2 sem. (26.10–08.11) : « **−90** + coût à venir **confirmé 26 oct.–8 nov.** ». Les deux −45 sont des emballages datés du 21.11 (hors fenêtre) ; sur la fenêtre, aucun mouvement (courbe plate, Finances › Opérations : « du 22 au 31 oct. aucune opération »).
  - 6 sem. (S44–S49) : « **−228** + coût à venir ». Calcul par date : 45+45 (21.11) + 24 (25.11) + 45+24 (30.11) = **−183**. Les 45 de trop sont l’emballage de Ttt le **21.12** (S51, hors fenêtre) compté parce que la barre porte le budget entier du brassin.
  - Le montant ne bouge pas de 6 sem. à An (−228 partout) : c’est le budget des barres, pas le solde de la période.
- Fichiers : `Rangee.tsx:578-600` (`pastille` somme `c.centimes` des barres), budget posé par `calendrier.ts:540` (`budgetBrassin`, hors impôt) ; l’impôt (96,20, 30.01) n’y est jamais, alors qu’il est dans la courbe et dans Finances.
- Captures : `cal-2sem-390.png`, `cal-defaut.png`.

### CH-donnees-4 — Le loyer (−400 × 12) n’entre dans aucune pastille de rangée (gênant)
- Geste : 6 sem. puis An, rangée Papiers.
- Attendu : la rangée résume ce qu’elle montre : « Loyer du local −400 / mois » et « lol −600 » dans S44–S49 = −1 000 ; en An −4 800 de loyer.
- Constaté : 6 sem. « Papiers **−600** confirmé S44–S49 » (lecture : « 1 chose … 1 probable ») avec le loyer −400 (S48) dessiné juste dessous ; An « −1 051 … **12 probables** » : 12 × 400 = **−4 800**, soit 69 % du titre −6 925, absents de toute pastille. Finances les compte (« loyer du local −400 (3 fois), le 26 », source `recurring`, plan actif), la bande S48 aussi (−424).
- Fichier : `Rangee.tsx:582` (`fermes = !probable && !proposition`), marquage `useDonneesCalendrier.ts:118` (`echeancesProposees`). `texte` ne reprend `probable` que si la rangée n’a rien d’autre (`probSeul`).
- Capture : `cal-defaut.png`, `cal-An-390.png` (bas, hors capture ; valeur lue dans le DOM `aria-label`).

### CH-donnees-5 — « confirmé » sur des prévisions et des factures non payées (gênant)
- Geste : 3 mois, lire Ventes, Achats, Travaux, Papiers.
- Attendu : « confirmé » = encaissé/payé ; sinon « prévu » / « à encaisser » / « à payer » (les mots de Finances).
- Constaté : « Ventes **+2 257 confirmé** S44–S3 » = +27 encaissé + 1 200 facture non payée (« à encaisser » 29 déc.) + 130 et 900 plans manuels ; Finances : Entré 1 227 (encaissé 27), À encaisser 1 200, Prévu 2 230. « Achats **−960 confirmé** S44–S49 » alors que Finances › Opérations dit « payé 0,00, à payer 475,00 » (Brouwland) et que Commande de malt est un plan.
- Fichier : `Rangee.tsx:895` (mot « confirmé » posé dès `confirme`), `pastille` ne sépare pas payé / dû / prévu.
- Capture : `cal-3mois-390.png` (rangées), `fin-Opérations.png`.

### CH-donnees-6 — « 2 sem. » pose la fenêtre dans le passé : aujourd’hui n’y est pas (gênant)
- Geste : 390, menu de période › « 2 sem. ».
- Attendu : la durée choisie posée autour d’aujourd’hui (S47), au minimum contenant la semaine courante.
- Constaté : fenêtre **26.10–08.11 (S44–S45)**, 3 semaines avant la semaine courante ; toutes les rangées « vides » sauf Brassins en cuve ; la colonne d’aujourd’hui (21.11) n’existe pas dans la vue ; le message annonce « période 6 sem. → 2 sem., Finances aussi » (Finances est donc poussé sur la même plage passée ; le contenu de Finances sur cette plage n’a pas été relu). 3 mois commence aussi à S44 (S44–S3), An à 26.10.26. Distinct de CAL-ECHELLE-FIGEE (durée) : ici c’est le début qui reste celui du recul de 3 semaines.
- Fichier probable : `EnTete.tsx` (index conservé au changement de durée, `semainesPassees` = 3).
- Capture : `cal-2sem-390.png`.

### CH-donnees-7 — Trois dates différentes pour la même fenêtre « An » (gênant)
- Geste : 390 ou 1280, « An ».
- Constaté : bouton de période « **26.10.26–24.10.27** » ; cadre sur la courbe « **janv. – nov. 2027** » ; axe O N D J F M A M J J A S O (oct. 2026 → oct. 2027) ; pastilles « confirmé **oct.–oct.** » (même mois deux fois, sans année). Le cadre est dessiné de D à A–S mais nommé janv.–nov. 2027 ; mêmes valeurs à 1280.
- Attendu : « oct. 2026 – oct. 2027 » (ou la date des deux bords) partout.
- Fichier : `EnTete.tsx:585-590` (`etiquetteAnnee`), `Fenetre.tsx:112`, étiquette des pastilles `Rangee.tsx` (`colonnes[0].etiquette`).
- Capture : `cal-An-390.png`.

### CH-donnees-8 — Trois « points bas » pour la même caisse, sans horizon commun (gênant)
- Calcul (variante sans pièce à confirmer, caisse −656) : Bord **−3 729,00 · 28.12** (90 j, jour par jour) ; Finances › Prévisions **−3 325,20** au 18.02 (fin de l’horizon, étiquette « sous zéro 21.11 ») ; Calendrier **−6 925** S43 ’27 (52 sem.).
- Attendu : la même grandeur, au même horizon nommé ; ou le mot « horizon » sur chacune.
- Constaté : aucune ne dit son horizon (« Point le plus bas au plus −3 729,00 CHF · 28.12 » ; « −6 925 CHF à dépenser S43 ’27 »). Latent, vérifié par le calcul : la courbe du Calendrier est au pas de la semaine. Sur 90 j elle donnerait −3 624 (fin S50) au lieu de −3 729 : S53 finit à −2 529 car la rentrée de 1 200 du 29.12 efface le creux du 28.12. « À dépenser sans passer sous 0 » peut donc dire OK un jour où la caisse est sous le seuil.
- Fichiers : `calendrierCaisse.ts` (`creuxDepuis`, minimum des soldes de fin de semaine) ; `DashboardTab.tsx:184-190` (`pointBasAVenir`, jour par jour).
- Captures : `propre-bord.png`, `propre-prev.png`, `propre-cal.png`.

### CH-donnees-9 — « J34 / 34 · prête 15 nov. » pour un brassin à J+40 (mineur)
- Constaté : Jhhh brassé le 12.10 : Calendrier « J34 / 34 · prête 15 nov. » ; Bord « Fermentation **J+40** ». Le jour est plafonné à la durée, la date « prête » est passée de 6 jours et rien ne le dit (ni « en retard », ni « prête depuis 6 j »). L’autre Jhhh (19.10) : J33/34 et Bord J+33 concordent.
- Attendu : J40, ou « prête depuis 6 j ». Capture : `cal-defaut.png`.

### CH-donnees-10 — Le Bord nomme les brassins par leur id, le Calendrier par leur nom (mineur)
- Constaté : Bord « Cette semaine au calendrier — 6 cette semaine : **B-NEIPA-1 neipa v3, B-NEIPA-2 neipa v3**… » ; Calendrier « neipa v3 ». Le « 6 » n’est pas rapproché ligne à ligne du Calendrier (S47 en montre plus selon ce qu’on compte).
- Fichier : `calendrier.ts:123` (`nom = \`${batch.id} ${batch.name}\``). Capture : `bord.png`.

### CH-donnees-11 — Les coûts inconnus des brassins en cuve se taisent (mineur)
- Constaté : neipa v3 ×2, Milk Stout, NEIPA Test (en cuve) ont dans la prévision un emballage et un impôt « partiel, à compléter » (Finances › Prévisions « Limites (14) ») ; au Calendrier ni montant ni « coût à venir » (`useDonneesCalendrier.ts:171`, « un brassin commencé n’a rien à dire »). L’inconnu n’est pas 0 (bien), mais il n’est pas dit non plus ; la fiche le dit seulement à l’ouverture (« Frais : emballage le 21 nov. · montant non renseigné »).
- Capture : `fiche-neipav311.png`.

## Doutes (à ne pas compter comme défauts)
- Impôt : pièce « Impôt sur la bière · 4 brassins −55 » (due 11.12) et prévision « impôt (4 fois) −96,20 » (30.01) coexistent ; rien ne montre si elles couvrent les mêmes brassins (possible double compte). La fixture ne dit pas le contraire.
- Courses : aucune course en double ni vente cachée trouvée ; les lignes « courses : ingrédients le 21 nov. » sont `montant non renseigné`, pas 0.

## Limites de la chasse
- Échelle « 17 sem. » non jouée (absente du menu ; atteinte seulement par étirement de la frise, hors regard « données »). Thème cave non rejoué : les chiffres ne dépendent pas du thème, aucune différence de valeur n’est attendue mais elle n’est pas vérifiée. 1280 : pastilles et titre comparés à 6 sem. et An seulement.
- Le glisser d’un événement et l’édition n’ont pas été rejoués ici (autres chasseurs) ; la lecture au doigt de la courbe (tête « 3 801 CHF · S12 … ») n’a pas pu être ouverte par un tap simple : la tête « libre · S · variation » reste non vérifiée.
- Deux tours de lecture des chiffres (390 puis 1280) ; le second n’a rien ajouté.
