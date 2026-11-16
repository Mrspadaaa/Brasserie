OK — 7 problèmes, 0 bloquants

# Test d'écran — Finances, FN-33, FN-35, FN-37 et corrections du verdict dfe9189e (voie x1, second passage)

Version : 18abc69f (banc rechargé à chaud ; `git diff 18abc69f -- src` vide ; changements depuis dfe9189e : `TransactionJournal.tsx`,
`TransactionRow.tsx`). Banc local `?dev-local&finance-demo`, port 3000. Même script que dfe9189e
(`work/missions/2026-11-14-finances/voies/x1/jeu.mjs`, journaux `log18-*.txt`), profil Chrome neuf par configuration, quatre
configurations (390 tactile, 1280 souris ; clair et sombre `cave`), aucune erreur de page. Mêmes gestes par l'app : saisie de A 10,00 et
B 15,00 à payer ; ✓ Payé sur A ; Annuler à 1,1 s ; double toucher (deux touchers à 120 ms au même point) ; B payée 12,00 par la fiche ;
B Modifier à 10,00 › « J'ai bien payé 12,00 » › Enregistrer ; Opérations ; Annuel. 40 captures ici, 9 ouvertes en plein format (le tableau).

## Nombres relevés (identiques dans les quatre configurations, et à dfe9189e)

| moment | payé | à payer | dépensé | à la main |
|---|---|---|---|---|
| avant | 296,80 | 400,00 | 696,80 | juste |
| A et B à payer | 296,80 | 425,00 | 721,80 | juste |
| ✓ Payé sur A | 306,80 | 415,00 | 721,80 | juste |
| Annuler à 1,1 s | 296,80 | 425,00 | 721,80 | annulé, juste |
| double toucher | 306,80 | 415,00 | 721,80 | payé une seule fois, pas annulé, aucune fiche ouverte (encore vrai à +2 s) |
| B payée 12,00 | 318,80 | 403,00 | 721,80 | juste |
| B à 10,00, « J'ai bien payé » | 316,80 | 400,00 | 716,80 | 696,80 + 20,00 ; 716,80 − 400,00 = 316,80 : juste |

En caisse : 4 181,60 → 4 159,60 (−22,00, juste). Pile « Autres 20,00 » = en-tête de groupe « Autres frais 20,00 » (bloquant dfe9189e levé).

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| 04-apres-annuler-1280-clair.png | clair | 1280 | A et B à payer après Annuler : « Autres frais 25,00 », pile Autres 25,00 hachurée, bande 296,80 / 425,00 / 721,80 | 0 | 0 |
| 03-double-390-clair.png | clair | 390 | après double toucher : A payée, avis « Payé 10,00 · Annuler · Autre montant » visible, pas de fiche | 0 | 0 |
| 03-double-1280-cave.png | sombre | 1280 | même état à la souris en sombre : bande 306,80 / 415,00 / 721,80 | 0 | 0 |
| 05-modifier-question-1280-cave.png | sombre | 1280 | Modifier B (payée 12,00 sur 15,00) à 10,00 : question « Le paiement déjà noté » | 0 | 0 |
| 06-apercu-bien-paye-390-cave.png | sombre | 390 | « J'ai bien payé 12,00 » choisi : aperçu avant/après sans les 2,00 | 1 | 0 |
| 07-ops-a-recuperer-390-clair.png | clair | 390 | Opérations : « Autres frais 20,00 » au-dessus de trois lignes 2,00 + 10,00 + 10,00 ; créance coupée | 2 | 0 |
| 07-ops-a-recuperer-1280-cave.png | sombre | 1280 | même liste : pile Autres 20,00 = groupe 20,00 ; bande 316,80 / 400,00 / 716,80 | 1 | 0 |
| 07b-ops-bande-390-clair.png | clair | 390 | bande et pile à 390 : « Nettoya… », bandeau « Opération mise à jour » | 2 | 0 |
| 08-annuel-autres-1280-cave.png | sombre | 1280 | Annuel sur 18abc69f : Autres frais 233,00 (213,00 avant, +20,00 sans la créance), Dépensé + usure 1 246,40 ; bandeau « Opération mise à jour » | 1 | 0 |

Bloquants : 0

## Vu juste

- Bloquant n° 1 de dfe9189e levé : l'en-tête « Autres frais » vaut 20,00 comme la pile, à 390 et 1280, clair et sombre.
- N° 2 de dfe9189e levé : le double toucher paie une fois, n'annule pas, n'ouvre aucune fiche ; l'avis reste visible (quatre configurations).
- FN-33 : Annuler à 1,1 s annule toujours. FN-35 : la question paraît sur B payée en partie. FN-37 : dépensé, payé, pile, caisse justes.

## Problèmes

1. **« Autres frais 20,00 » coiffe trois lignes qui font 22,00** (07-ops-a-recuperer-390-clair, 07-ops-a-recuperer-1280-cave) : la
   créance « À récupérer » de 2,00 reste rangée sous Autres frais, sans signe qu'elle n'entre pas dans le sous-total. Le nombre est juste
   (comme la pile) mais l'addition à l'œil ne tombe pas. En brasseur : « 2 + 10 + 10, ça fait 22, pas 20 ». Attendu : la créance dans son
   propre groupe « À récupérer », ou son montant marqué hors total.
2. **Fiche après Payé, Annuler, Payé : « Paiements 3 », un « 10,00 corrigé » barré et un « −10,00 » qui propose « Corriger ce paiement
   saisi par erreur »** (vu sur dfe9189e, 03-double-390-clair et 03-double-1280-clair ; fiche non touchée par 18abc69f). En brasseur :
   « j'ai payé une fois, pourquoi 3 paiements et un moins 10 ? ».
3. **Aperçu « après » sans le trop-payé** (06-apercu-bien-paye-390-cave) : « 10,00 ✓ payé aujourd'hui · banque », pas la ligne
   « À récupérer 2,00 » qui va naître. Au registre (FN-36).
4. **Créance coupée à 390** (07-ops-a-recuperer-390-clair) : « À récupérer : trop payé sur « ZZ TEST — piè… », le nom de la pièce est
   mangé par le préfixe. En brasseur : « à récupérer sur quoi ? ».
5. **Pile à 390 : « Nettoya… »** (07b-ops-bande-390-clair) : la colonne Autres en plus coupe l'étiquette.
6. **Bandeau « Opération mise à jour. Fermer » persistant** (07b-ops-bande-390-clair, 08-annuel-autres-1280-cave). Au registre (FN-40).
7. **Feuille Payer : « zz 12,00 » sous la barre** (05a-payer-12-390-clair, journal ; même rendu que dfe9189e). Au registre (FN-32).

## Doutes (non comptés)

- « Erreur de saisie » pré-choisi quand la question paraît (choix prudent, sans doute voulu).
- L'étiquette « à récupérer 2,00 » porte le cadre orange de « à payer » ; argent attendu, pas une dette. La maquette v6a n'a pas ce cas.
- À 390, la pastille « Compagnon hors connexion · mode local » chevauche Filtres et Doublons : mode local du banc.
- Annuel 213,00 avant : relevé sur un profil neuf (`voies/x1/annuel-avant.mjs`), pas dans le même navigateur.
- Second paiement « avant redessin » signalé par le pilote : non mesurable de l'écran ; la bande ne montre aucun doublon (306,80 après le double).

Pilote : vu (16.11, 07-ops-a-recuperer-390-clair : Autres frais 20,00 = pile ; 03-double-390-clair : avis visible, aucune fiche, payé une fois).
