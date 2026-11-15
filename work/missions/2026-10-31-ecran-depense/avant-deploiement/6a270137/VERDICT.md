OK — 2 problèmes, 0 bloquants

# Test d'écran — Finances, correctifs q6 des 11 problèmes de 8151bee7 (Payer m5pa-d, Apport m5ap-a, Fiche m5fo-a, Modifier m5mo-c)

Version : 6a270137 (arbre propre). Banc local `?dev-local&finance-demo`, profil Chrome neuf pour chaque scénario (rien d'écrit
hors du navigateur de test, aucune vraie donnée). 390 tactile (Puppeteer mobile, 390×844, captures en défilant dans la feuille)
et 1280 ; clair et sombre (`cave`). Script `capturer.mjs`, textes et mesures des champs dans `textes.json` ; 120 captures, comparées
côte à côte avec `work/missions/2026-11-14-finances/voies/m5/<id>/<id>.png`. Aucune erreur de page sur les douze passes.

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| ops-390-clair.png | clair | 390 | Opérations au repos | 0 | 0 |
| fiche-apayer-390-sombre.png | sombre | 390 | fiche du loyer à payer | 0 | 0 |
| payer-ouvert-390-clair.png | clair | 390 | fiche › Noter un paiement, 2 pièces de l'Atelier | 0 | 0 |
| payer-ouvert-1280-clair.png | clair | 1280 | Payer ouvert | 0 | 0 |
| payer-trop-390-clair.png | clair | 390 | virement 700 tapé (au-delà de 460) | 0 | 0 |
| payer-trop-1280-sombre.png | sombre | 1280 | virement 700 tapé | 0 | 0 |
| payer-decoche-390-clair.png | clair | 390 | virement 300, loyer décoché | 0 | 0 |
| payer-autre-toucher-390-sombre.png | sombre | 390 | « autre » date vide, toucher sur le bouton | 0 | 0 |
| payer-apres-390-clair.png | clair | 390 | Opérations après ✓ Payer 300,00 | 0 | 0 |
| payer-apres-1280-sombre.png | sombre | 1280 | Opérations après ✓ Payer 300,00 | 0 | 0 |
| fiche-partielle-390-clair.png | clair | 390 | fiche du loyer payé 240 sur 400 | 0 | 0 |
| fiche-payee-390-clair.png | clair | 390 | fiche d'une pièce payée (Nettoyant 42,00) | 0 | 0 |
| modif-hausse-reste-390-clair.png | clair | 390 | Modifier 42,00 → 45,50, « Reste à payer » | 0 | 0 |
| modif-30-390-clair.png | clair | 390 | Modifier 42,00 → 30,00 (sous le payé) | 1 | 0 |
| modif-30-1280-sombre.png | sombre | 1280 | Modifier 42,00 → 30,00 | 1 | 0 |
| modif-4550-390-sombre.png | sombre | 390 | Modifier 186,80 → 45,50 (sous le payé) | 1 | 0 |
| modif-dessus-bas-390-clair.png | clair | 390 | Modifier le loyer 400,00 → 300,00 (payé 240, au-dessus) | 0 | 0 |
| modif-dessus-apres-390-sombre.png | sombre | 390 | Opérations après cette baisse | 0 | 0 |
| fiche-apres-30-1280-clair.png | clair | 1280 | fiche du Nettoyant après Enregistrer à 30,00 | 1 | 0 |
| apport-ouvert-390-sombre.png | sombre | 390 | Apport ouvert | 0 | 0 |
| apport-500-390-clair.png | clair | 390 | apport 500,00 | 0 | 0 |
| apport-500-1280-clair.png | clair | 1280 | apport 500,00 | 0 | 0 |
| apport-sens-1280-sombre.png | sombre | 1280 | « Dans l'autre sens », autre date, motif | 0 | 0 |

Bloquants : 0

## Les 11 problèmes de 8151bee7, rejoués

1. Corrigé. Baisse sous le payé : plus de « payé 0,00 », plus d'échéance inventée ; un seul choix « Le paiement suit · payé 30,00 »
   et « Trop payé 12,00 ? » (modif-30) ; Opérations : payé 284,80, à payer 400,00, rien de neuf à payer (modif-30-apres).
2. Corrigé. 700 tapé : champ ramené à 460,00, barre « retard 60,00 · loyer 400,00 », bouton « ✓ Payer 460,00 » (payer-trop).
3. Corrigé. « Ramené à 460,00 CHF : c'est tout ce qui reste à payer. » sur une ligne sous le champ, 390 et 1280.
4. Corrigé. Apport : « Ventes − dépenses +23,20 », comme m5ap-a et comme Opérations (720,00 − 696,80).
5. Corrigé. Payer à 1280 : le corps prend toute la feuille, boutons alignés sur le corps.
6. Corrigé. Valeurs centrées à 390 : « 460,00 » (hauteur 52, interligne 50), Nom, Date, Montant de Modifier (« sans TVA » et
   « 30,00 » sur la même ligne, comme m5mo-c), Motif de l'Apport.
7. Corrigé. « autre » sans date : le bouton dit « Choisis la date » ; le toucher met le curseur dans le champ date (focus vérifié).
8. Corrigé. « Payer l'Atelier ».
9. Corrigé. Loyer décoché : 60,00 dans le champ, la barre et « ✓ Payer 60,00 », « pas dans ce virement » sur le loyer.
10. Corrigé. Pastille « Reste 160,00 CHF à payer · 25 nov. · dans 10 j » entière à 390, « sans pièce » passe dessous.
11. Corrigé. Espèces, TWINT, Autre, « autre date… » ont leur bord ; « ⇄ Dans l'autre sens : je reprends » en bleu.

Gestes vus et justes en plus : Payer 300,00 → retard 60,00 soldé, « en retard » disparaît, loyer « sur 400,00 · reste 160,00 »,
payé 536,80 + à payer 160,00 = dépensé 696,80 ; fiche du loyer ensuite « Déjà payé : 240,00 », « Reste à payer : 160,00 » ;
Modifier le loyer 400 → 300 (au-dessus des 240 payés) : aperçu « payé 240,00 · reste 60,00 », puis Opérations « Reste 60,00 »,
à payer 60,00, Fixes 368,00 ; hausse 42 → 45,50 : deux choix, « Reste à payer » par défaut comme m5mo-c ; Apport : 500 sur la
flèche, Caisse +500,00, autre date (champ date), Dans l'autre sens → « De la brasserie à ta poche », flèche rouge, Caisse −500,00,
« Enregistrer le prélèvement ».

## Problèmes

1. Pas pratique, chiffres trompeurs : après une baisse sous le payé (Nettoyant 42,00 → 30,00, Enregistrer), la fiche liste trois
   paiements « banque » du 15 nov. : −42,00, « +42,00 banque · correction », −30,00, pour un seul virement réel de 42,00 ; et les
   12,00 payés en trop ne sont plus dits nulle part (fiche « ✓ payé », Opérations payé 284,80) : la phrase « Trop payé 12,00 ? »
   n'existait que dans Modifier (fiche-apres-30-1280-clair, fiche-apres-30-390-sombre). En brasseur : « j'ai fait un virement de
   42, c'est quoi ce +42 et ce −30, et où sont mes 12 ? ». Attendu : une seule ligne de paiement telle que payée (ou la correction
   repliée), et « trop payé 12,00 · avoir à recevoir » sur la fiche tant qu'aucun avoir n'est noté.
2. Pas à sa place : sous le payé, le choix unique « Le paiement suit · payé 30,00 » est dessiné en barre pleine sur toute la
   largeur (noire en clair, crème en sombre), comme le bouton Enregistrer juste en dessous ; on le prend pour un bouton et le
   toucher ne fait rien (modif-30-390-clair, modif-30-1280-sombre, modif-4550-390-sombre). Attendu : une ligne de texte
   « Le paiement suit · payé 30,00 », pas un bouton seul.

## Doutes (non comptés)

- « Avoir ou remboursement » après la baisse : non joué. Si l'avoir de 12,00 retire encore 12,00 à la dépense déjà ramenée à
  30,00, la dépense tomberait à 18,00 ; à vérifier avant de dire au brasseur de passer par là.
- Titres « Payer l'Atelier » et de la fiche (« Nettoyant alcalin ») un peu moins gras en clair que dans m5pa-d et m5fo-a ; en sombre
  ils paraissent gras. Écart de graisse à confirmer au zoom.
- Fiche à 390 : « Nettoyage · Comptoir du brasseur · 15 nov. 2026 » laisse « 2026 » seul sur une deuxième ligne.
- Apport vide puis Enregistrer : seule la bulle du navigateur « Veuillez renseigner ce champ » sur Motif (apport-erreur) ; rien sur
  le montant 0,00. Montant 0 avec un motif rempli non joué.
- « Compagnon hors connexion · mode local » (BrewerActivity, fixe en bas) passe sur « Doublons » et « Apport ou prélèvement privé »
  à 390, et sur une rangée en sombre (ops-390-clair, modif-dessus-apres-390-sombre) ; vu sur le banc local, à voir en ligne.
- Le × de Payer et de la fiche porte un cadre noir épais à l'ouverture (focus posé par le script) ; sans doute absent après un vrai
  toucher.

Pilote : vu (15.11 : payer-ouvert-390-clair, modif-30-390-clair, apport-500-390-sombre ouvertes ; 2 mineurs restants acceptés)
