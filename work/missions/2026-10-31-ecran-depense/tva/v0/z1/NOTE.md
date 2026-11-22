# z1 — le mode « TVA » à côté de Situation / Coûts : récap à renvois, liste à pastilles (v0 TVA, série z, 01.11)

**Chaleur : froide.** Les idées qu'il a retenues, affinées : « J'aime beaucoup les pastilles sur les items » et « un récap en haut
[…] avec la possibilité de clicker et avoir des renvois ». Une seule idée : la TVA est un troisième mode de Synthèse ; le récap
dit la réponse (« Remboursée : 0,00 · non assujetti », puis « 160,19 CHF TVA payée · 11 factures »), les chips à pastille (2,6 %,
8,1 %, choisie, DE) renvoient dans la liste en la filtrant, et chaque facture porte la pastille de son taux devant sa TVA.

**Axes** : place = mode de Synthèse à côté de « Situation / Coûts » ; période = année (‹ 2026 ›, le seul facteur libre) ; « si
assujetti » = aucun chiffre, une feuille avec l'AFC, la fiduciaire et le réglage ; forme = liste à pastilles.

**Honnêteté** : l'inconnu n'est jamais à zéro : une bande ambrée hachurée « + 3 sans TVA lue · 228,10 CHF » sous le total, et
« ? » en TVA sur la ligne ; à 14 inconnues (`?etat=inconnues`) le total se dit « total partiel ». La TVA douteuse est « choisie »
(pastille en pointillé, chip ambrée qui renvoie à la ligne et la fait clignoter). L'allemande est violette, « DE 19 % », « hors
CH », jamais dans les taux suisses. Le statut se dit comme un réglage : chip « Non assujetti · réglage » avec un interrupteur
éteint, qui mène aux Réglages.

**Ce qui vient de la base** : en-tête, onglets « Synthèse · Opérations · Prévisions · Annuel », titre « Situation financière »
avec son picto de réglages et la bascule « Situation / Coûts » (un segment « TVA » ajouté), navigation du bas avec le « + ».

## Boosters UX (boosters-ux)
- Boosters : `mode-tva` — choisir ; segment ; troisième mode de Synthèse. `periode` — ajuster ; stepper ‹ 2026 › ; l'année change
  tout l'écran. `statut` — lire, déclencher ; chip à interrupteur « Non assujetti · réglage » → Réglages. `chip-taux` — comparer,
  suivre ; chips à pastille et compte ; filtre la liste, renvoi à la ligne (la douteuse clignote). `si-assujetti` — déclencher ;
  rangée « Remboursée : 0,00 » → feuille AFC / fiduciaire / réglage, aucun chiffre déduit.
- B1 OK (5 boosters, chaque chip change la liste) · B2 OK (le 160,19 à 28 px domine ; un seul primary, dans l'état vide) ·
  B3 OK (55 mots au premier écran hors lignes, MOTS OK) · B4 OK (récap dans un panneau, liste sans cadre) · B5 OK (4–6 / 8 px) ·
  B6 : 12 / 14 / 28 pour le contenu, plus le 18 du titre de la base et le 16 de l'en-tête de l'app · B7 OK (CONTRASTE OK, pire
  5,17:1) · B8 OK (sept états, « — » dans le vide, « ? » pour l'inconnu) · B9 OK (fond au toucher, clignotement 1,6 s, réduit)
  · B10 s.o. (aucune saisie) · B11 : « 160,19 CHF de TVA payée en 2026, rien de remboursé, trois factures sans TVA lue » ·
  B12 OK (rayons 10 / 16 / 24, chevron, trait 1,5) · B13 OK (28 px, lignes de 36 px).
- Écarts voulus : aucun.

## Contrôles (sorties)
`verifier-page` : PAGE OK (0 images chargées, 390 px, sans erreur). `controle-commun --profil=sans-houblons --sans-lignes` :
COMMUN OK (mots, couleurs, survol, blocs, contraste, standard, parlant, brutes). `mots-premier-ecran --max=60 --sans-lignes` :
z1 55 mots, MOTS OK. `controle-contraste` : 128 textes, pire « TVA » 5,17:1, CONTRASTE OK. `controle-choix --ecran=finances` :
« CHOIX OK (0 écran(s) conforme(s) à son choix ; 0 ouvert(s)) » : l'écran Finances n'a pas d'entrée dans `ecrans.json`.
