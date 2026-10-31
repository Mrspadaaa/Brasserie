# u2 — le fil à régler, trié par risque (v0, 31.10)

- **Chaleur** : tiède (la forme de l'approche u : la question d'abord, « qu'est-ce que je dois régler ? »).
- **Axes** : A1 un fil trié par risque (argent, puis stock) ; A2 groupées par famille ; A5 la balance « imprimé 86,50 = 23 lignes
  86,50 » en tête.
- **L'idée** : l'écran est la liste des 6 décisions, dans l'ordre du risque ; une seule ouverte ; la réglée se replie en ✓ avec
  sa valeur et ouvre la suivante. Tout le reste, lu et recoupé, est replié sous « Le reste ».

## Sa facture, et ce qui est simulé
Ses 23 lignes, ses montants, sa TVA imprimée. Simulé, et dit : le stock d'essai, « Target α 11,8 » et « Hallertauer Blanc DE »
au stock, l'unité illisible de Sabro (sa facture porte « g »), la prévision de 90,00, le doublon 380001. Moyen « déduit »,
échéance « déduite ».

## Baseline, cochée
- [x] justificatif (vignette dans la balance) · [x] Total TTC (se tape ; la balance passe en rouge, avec l'écart)
- [x] Pour quoi ?, date de l'achat, Déjà payé / À payer, payé le et moyen, échéance déduite : sous « Le reste »
- [x] fournisseur et catégorie, lier à une dépense prévue : sous « Le reste »
- [x] lignes par famille (Malts 7, Moutures 5, Houblons 7, Levures 4, avec leur somme) ; chaque famille s'ouvre sur ses lignes,
  quantité et montant se tapent, icône de lien ; ajouter, regrouper, « Détail » : sous « Le reste » (retirer : non dessiné en v0)
- [x] référence et TVA (n° de facture, de commande, TVA, taux, HT « non imprimé ») · [x] pied · [x] ×
- Écart : le type d'achat et le choix d'article d'une ligne ne sont pas dessinés dans u2 (u1 et u4 les montrent) : à greffer.

## Honnêteté
- TVA : « par taux 1,95 + 2,20 = 4,15 ≠ 2,80 », « bases 26,20 + 84,20 = 110,40 ≠ 86,50 écart 23,90 » ; choix « vide (proposé) ·
  2,80 (colonne) · 4,15 (par taux) ».
- Payé le « 27.04.2026 supposée » ; mouture : tableau « lu 2,30 → avec mouture 2,40 /kg » par malt, rattachée par un seul geste.
- Target : « la variété est Target, l'α va à part ; jamais fusionné » ; Hallertauer CH contre DE ; Sabro « rien n'entre en stock
  tant que l'unité manque ».

## États (annexe, sur le même fil)
1 lecture (Envoi 1,2 s, Lecture…, Vérification) · 2 fil vide (illustration) · 3 premier écran · 4 un réglé puis 6/6 · 5 erreur
(fichier gardé, Saisir à la main) · 6 Drive à connecter · 7 envoi au Drive puis reçu · 8 doublon en premier point du fil ·
9 hors ligne.

## Boosters UX
- `fil-a-regler` — choisir ; fil vertical, une carte ouverte, valeurs en tuiles ; régler ouvre la suivante (`u2-regle-1.png`,
  `u2-regle-2.png`) · `progression` — suivre ; 6 pastilles bleues (argent) et vertes (stock) · `balance-recoupe` — lire ;
  imprimé = lignes · `familles` — lire ; 4 rangées teintées · `reste-recoupe` — ouvrir (`u2-reste.png`) · `drive-pret`
- B1 OK · B2 OK — le point ouvert domine, un seul bouton plein · B3 OK — 97 mots · B4 OK · B5 non mesuré · B6 OK — 28/14/12
- B7 OK — CONTRASTE OK (pire 4,55:1) · B8 OK — 9 états · B9 partiel · B10 OK · B11 « 6 choses à régler, la TVA d'abord »
- B12 OK — STANDARD OK · B13 OK

## Contrôles (sorties)
- PAGE OK · COMMUN OK (série) · MOTS OK (97) · CONTRASTE OK · PANEL OK (série, médiane 0,59)

## Ce qui tient, ce qui casse
- Tient : on sait d'un coup quoi faire et dans quel ordre ; la TVA, risque d'argent, vient d'abord.
- Casse : le doute n'est plus à sa place (il est dans le fil, pas sur la ligne) ; les lignes sont à deux touchers.

Captures : `u2-haut.png`, `u2-page.png`, `u2-repos.png`, `u2-regle-1.png`, `u2-regle-2.png`, `u2-reste.png`, `u2-enregistre.png`,
`u2-1280.png`.
