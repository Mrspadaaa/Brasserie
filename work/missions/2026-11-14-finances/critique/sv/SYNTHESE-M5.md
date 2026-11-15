OK — 10 montrables, 0 bloquant ; mo : c > a > b > d ; pa : a > c > d > b

# Critique m5 (15.11) — Modifier, Payer et l'apport avec justificatif, fiche avec barre

Juge : Opus (aucun Fable). Les 10 images ouvertes une à une, chacune à côté de sa base (m2mo-a, m2pa-a…d, m1ap-c, m2fo-a + m2fo-c).
`etat.html` : aucun « lock », aucun `type="number"`, `inputmode="decimal"` partout où il y a un montant, « justificatif » écrit dans les 5 pa/ap.
Mesure des cibles : px de l'image ÷ 2 (390 px, échelle 2).

## Tableau

| id | montrable | défauts numérotés |
|---|---|---|
| m5mo-a | oui | 1. « garder 42,00 payé » est un lien texte d'environ 22 px de haut (< 44), alors que c'est la seule sortie quand le prix a vraiment augmenté. 2. Le libellé ne dit pas ce qui arrive : « garder 42,00 payé » ne montre pas « reste 3,50 à payer ». 3. Doute : par défaut, le paiement bancaire déjà noté passe de 42,00 à 45,50 sans qu'on le demande, ce qui peut contredire le relevé si la banque a vraiment débité 42,00. |
| m5mo-b | oui | 1. Les pastilles « payé 42,00 » et « reste 3,50 à payer » font environ 22 px, et « Payer 3,50 » environ 28 px (< 44). 2. Le cas de la faute de frappe (42 tapé, 45,50 payé) n'a pas de solution : il force un 2e paiement de 3,50 qui n'a jamais eu lieu, et « le paiement suit » n'existe pas ici. |
| m5mo-c | oui | 1. Un peu chargé : le segment dit déjà « payé 42,00 · reste 3,50 » et les deux rangées « avant / après » le répètent. Une seule rangée « après » suffirait. 2. La pastille « reste 3,50 » de l'aperçu est à peine hachurée à l'écran, à vérifier en plein format. 3. « Dans Opérations » et « avant / après » sont en gris pâle, à la limite de la lisibilité. |
| m5mo-d | oui (variante libre) | 1. Sens : la zone de pièce dit « Pas encore de pièce » alors que le bloc juste dessous s'appelle « Lignes de la pièce ». Ces lignes viennent d'où ? 2. Le total se tape à deux endroits (le champ Montant et les lignes) : lequel gagne ? 3. La règle « le paiement couvre les premières lignes » est inventée et n'existe pas dans le code (NOTE). 4. « Gants nitrile » ajouté à une opération nommée « Nettoyant alcalin » : le nom ne suit pas. 5. « + ligne » est un lien texte < 44 px. 6. Plus de cases que la base : cela tire vers le cockpit, alors qu'il demandait seulement de pouvoir modifier. |
| m5pa-a | oui | 1. Seul l'état vide est montré : on ne voit pas à quoi ressemble la rangée une fois le justificatif joint. Base m2pa-a gardée telle quelle, rangée à sa place (après « Avec », avant Payer), cibles d'environ 44 px. |
| m5pa-b | oui | 1. Le justificatif est caché derrière « Autre montant, date ou moyen », et le geste principal « Tout payé » n'en a pas, ce qui rejoue sa plainte « Payer pas de justificatif ? ». 2. La ligne s'appelle « Preuve » et le mot « justificatif » n'apparaît que dans la pastille. 3. Pastilles d'environ 36 px (< 44), même taille que dans la base. 4. Hérité de la base : deux boutons noirs principaux (« Tout payé 400,00 » et « Payer 250,00 ») quand le volet est ouvert. |
| m5pa-c | oui | 1. Seul l'état « joint » est montré : le cadre pointillé « + justificatif » n'est que décrit dans la NOTE. 2. « Changer » fait environ 36 px (< 44). 3. Chiffres hérités de m2pa-c et faux entre eux : payé 575,40 + à payer 150,00 = 725,40, mais « dépensé 696,80 » ; et la mini-barre « Fixes » vaut 468,00 alors que la ligne « payé » montre 575,40. À corriger avant de le montrer comme la seule Payer retenue. |
| m5pa-d | oui | 1. Le texte « joint aux 2 pièces » est affiché dans le cadre pointillé vide : il dit joint alors que rien n'est joint. Il faut « sera joint aux 2 pièces ». 2. Le bouton fichier n'a qu'une icône (environ 37 px, < 44), sans le mot. « Photo » fait environ 36 px. 3. Le justificatif est placé avant « Le … avec », alors que dans les autres il vient après le moyen de paiement (ordre à harmoniser). |
| m5ap-a | oui | 1. Seul l'état vide est montré. 2. Hérité de m1ap-c : « Ventes – dépenses » est coupé sur deux lignes. Base gardée telle quelle, justificatif sous le motif, mot écrit, pointillé = sans pièce, cibles d'environ 43 px. |
| m5fo-a | oui | 1. Les segments de la barre n'ont pas de nom : on ne les lit que grâce au trait de couleur des rangées dessous. C'est voulu (NOTE), à confirmer devant lui. Base m2fo-a intacte. Proportions justes : 39 / 21 / 26 / 14 % pour 72,50 / 38,40 / 48,90 / 27,00, et la somme fait bien 186,80. |

Aucun bloquant : aucun geste sans effet, aucun élément de la base choisie absent, aucun texte illisible, aucune absurdité de métier. La seule valeur fausse (m5pa-c, 3) vient de la base m2pa-c.
Hachure = à payer, respecté partout. Rouge = retard seulement (m5pa-d, solde 2025). Pointillé = sans pièce, respecté partout sauf le texte de m5pa-d.

## Réponses aux questions
- **Base choisie gardée** : oui pour les 10. Rien n'est retiré. Seul ajout : le bloc paiement sous Montant (mo), la rangée justificatif (pa, ap) et la barre (fo).
- **Modifier modifie vraiment** : oui. Le montant devient un champ bleu actif, et l'ancien montant 42,00 reste visible barré à côté du libellé. Effet sur le paiement :
  - juste et clair dans c (il choisit, et voit la rangée après) ;
  - juste dans a (suit) et dans b (reste à payer), mais chacune ne couvre qu'un cas ;
  - confus dans d (deux sources du total, règle inventée).
- **Justificatif visible et à sa place** : a, c et ap oui. d oui, mais le texte est faux. b non au premier plan.
- **Chiffres** : justes partout sauf l'aperçu du mois hérité dans m5pa-c.

## Classement Modifier (mo)
1. **m5mo-c** : la seule qui couvre les deux cas (faute de frappe, ou vrai surcoût), et l'effet dans Opérations se voit. À alléger : retirer la rangée « avant ».
2. **m5mo-a** : la plus proche de sa base tiède et sobre. La sortie « garder 42,00 payé » doit devenir un vrai bouton de 44 px qui montre « reste 3,50 ».
3. **m5mo-b** : la plus honnête vis-à-vis de la banque, avec une hachure claire, mais pas de « le paiement suit » et des cibles de 22 à 28 px.
4. **m5mo-d** : bonne idée pour une facture à plusieurs lignes, mais elle répond à une autre question et crée deux sources du total.

## Classement Payer (pa)
1. **m5pa-a** : place évidente, mot écrit, pointillé juste, cibles de 44 px. Retouche : montrer aussi l'état « joint ».
2. **m5pa-c** : la vignette jointe avec date et montant est la plus parlante. Mais l'état vide n'est pas montré, « Changer » est < 44 px et les chiffres du mois hérités sont faux.
3. **m5pa-d** : un justificatif pour un virement qui paie deux pièces, c'est l'idée juste. Retouches : « sera joint », bouton fichier nommé, 44 px.
4. **m5pa-b** : le justificatif est derrière le volet et le geste principal n'en a pas, donc sa plainte reste vraie.

## Greffes
- La vignette « ✓ joint · date · montant » de m5pa-c, comme état « joint » pour m5pa-a et m5ap-a.
- « Joint aux N pièces » de m5pa-d, pour m5pa-a quand le paiement couvre plusieurs pièces.
- La pastille hachurée « reste 3,50 à payer » de m5mo-b, à la place du lien de m5mo-a une fois « garder 42,00 payé » touché.

## Phrases prédites du brasseur
- m5mo-c : « Là au moins je vois ce que ça change. »
- m5mo-a : « Ok, ça suit, mais le petit lien bleu je le vois pas. »
- m5mo-d : « Pourquoi des lignes ? Je voulais juste corriger le montant. »
- m5pa-a : « Voilà, là il y a le justificatif. »
- m5pa-b : « Et si je fais "Tout payé", il est où le justificatif ? »
- m5pa-d : « Joint ? Mais j'ai rien mis. »

LEÇON PROPOSÉE : aucune
