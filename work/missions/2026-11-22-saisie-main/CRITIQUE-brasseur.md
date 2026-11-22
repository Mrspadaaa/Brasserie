OK — 8 versions jugées : 49 problèmes, dont 1 bloquant (v07). Tête du classement : v01, v04, v08.

# Saisie à la main : critique au nom du brasseur (22.11)

Grille : PORTRAIT v2, sa plainte du 22.11 (« très ostere, peu intuitif, mal fait », « je peux même pas dire si c'est une vente ou un achat »,
loyer récurrent, apport, abonnement), et les défauts SAISIE-SENS-RECURRENT et GESTE-DATE-PARTOUT.
J'ai ouvert les 16 planches (5 états, clair et cave) et sa capture `00-plainte.jpg`.
Base : p3c-3, la carte d'en-tête (nom, date en mono, grand montant, Payé aujourd'hui / À payer / Banque), puis le pied Mon mois et Enregistrer.
Ce choix n'est pas au registre `ecrans.json` : je ne prononce aucun rejet. Les écarts à p3c-3 sont signalés, et c'est à lui d'en juger.
Sévérité : **B** bloquant (geste sans effet, valeur fausse, élément choisi absent, illisible), **m** moyen, **d** détail.

## Sens métier, d'abord
Aucune absurdité. Les montants sont plausibles : 400,00 pour un loyer, 2 000,00 pour un apport, 29,90 pour un abonnement.
Les dates sont justes : 12 échéances du 22.11.26 au 22.10.27, et Σ 12 mois donne −4 800,00 et −358,80, ce qui est exact.
Mon mois montre seulement l'effet du mouvement, et le sens est cohérent partout : − ambre, + vert.

## Problèmes communs (comptés une fois)
1. **m** Seul v04 permet de payer une échéance déjà prévue (« solde l'échéance du 22.11 »). Dans les sept autres, le brasseur risque
   de ressaisir le loyer de décembre en « chaque mois ». Cela crée un second plan, et le Calendrier compte double : valeur fausse au port.
2. **m** Aucune version ne montre l'achat. « Articles, stock et matériel · 1 » et « Sans justificatif, c'est normal », présents dans son
   écran actuel, ont disparu des 8. Saisi à la main, le malt n'entrerait plus au stock (L03 : reprendre tout l'élément).
3. **m** Rien ne montre que la date « 22.11 » et les choix « une date / date » ouvrent la frise partagée. C'est la règle GESTE-DATE-PARTOUT
   du 22.11. Il faut la montrer dans la version retenue.
4. **m** La ligne « Calendrier 22.11 ✓ 22.12 … sans fin / … 22.10.27 · 12 fois » est en mono gris d'environ 10 px : illisible à
   bout de bras (portrait § 7 : « hyper lisible »).

## v01 — Le genre d'abord (5 problèmes, 0 B)
1. **m** Les 9 tuiles restent en haut après le choix (260 px), et le montant et le rythme descendent d'autant. La tuile choisie prend la
   couleur de sa catégorie (violet), pas celle du sens.
2. **m** « ↑ ÇA SORT / ↓ ÇA RENTRE » est écrit en capitales de 10 px. Le sens tient à un fin liseré ambre ou vert. En cave, ce liseré ambre
   se confond avec l'accent jaune.
3. **d** « Prélèvement » et « Remboursement » touchent les bords de leur tuile.
4. **d** « Une seule fois. » est une légende qui répète le 1× choisi.
5. **d** Au repos, 200 px restent vides sous « Fournisseur, TVA, référence ».

Il dirait : « Là on est bon, je vois ce qui sort et ce qui rentre, le loyer en 3 touchers. Mais ça reste un formulaire, et mes trucs habituels ? »

## v04 — Habituels en un toucher (6 problèmes, 0 B)
1. **m** Le cas de sa plainte, un loyer saisi pour la première fois, n'est pas montré : le loyer est déjà un habituel. Seul l'abonnement
   passe par « Nouveau ».
2. **m** La rangée des genres est coupée à « Appo… ». L'apport, un mot de sa plainte, est à moitié caché. Prélèvement et Remboursement
   sont hors champ.
3. **m** Au repos, le sens tient à des points de 4 px sur les tuiles et au signe de montants écrits en noir. Les icônes colorées disent la
   catégorie, pas le sens.
4. **m** Une fois ouvert, le rythme se règle en puces de 10 px (« 1× · Mois · Trim. · An »). L'apport ouvert n'affiche que « 1× » :
   rien ne montre qu'on peut le rendre récurrent.
5. **d** « Pour quoi ? ou un montant » : un même champ sert à chercher et à saisir.
6. **d** « tirés de tes mouvements » est une légende.

Il dirait : « Ça c'est vachement bien, le loyer en un toucher et il solde l'échéance. Mais Apport est coupé ?? Et la première fois, je fais comment ? »

## v08 — Pavé de caisse (6 problèmes, 0 B)
1. **m** « tape le montant, puis − Payé ou + Reçu » : un mode d'emploi écrit au repos.
2. **m** La rangée des genres est coupée : Vente (un mot de sa plainte), Salaire et Prélèvement sont hors champ.
3. **m** « À payer » et le moyen de règlement (Banque) ont disparu : une facture à payer ne se saisit pas. C'est un écart à p3c-3.
4. **m** Le rythme est en puces de 10 px et la date « 22.11 ⌄ » en 9 px, sous un montant de 50 px.
5. **d** 100 px vides entre le Calendrier et le pavé.
6. **d** En cave, la touche non choisie (Reçu, vert sombre sur fond sombre) perd du contraste.

Il dirait : « Payé ou Reçu sur le bouton, là impossible de se tromper. Par contre le pavé bouffe la moitié de l'écran. »

## v05 — Deux côtés (6 problèmes, 0 B)
1. **m** « ÇA RENTRE / ÇA SORT » est écrit couché à 90° dans la bande : il faut pencher la tête pour lire.
2. **m** Pour changer de genre, il n'y a qu'un « changer » souligné de 9 px.
3. **m** La pastille de règlement se réduit à « Payé aujourd'hui » : plus d'« À payer » ni de moyen. C'est un écart à p3c-3.
4. **m** 200 px vides entre le Calendrier et Mon mois (états a, b, c).
5. **d** La fin « → oct. 2027 » est un texte de 9 px au bout de la ligne : on ne voit pas où toucher.
6. **d** Le pied centré, Mon mois au-dessus d'Enregistrer en pleine largeur, s'écarte du pied actuel (écart assumé dans NOTES).

Il dirait : « Très clair, vert ça rentre, jaune ça sort. Mais le texte couché sur le côté, et tout ce vide en bas… »

## v03 — Phrase à trous (6 problèmes, 0 B)
1. **m** C'est un écart à p3c-3 : la carte d'en-tête a disparu (date en mono, Payé aujourd'hui / À payer, Banque). On ne peut plus dire
   « à payer », ni le moyen.
2. **m** « Fournisseur, TVA, référence » est absent.
3. **m** « Commence par le genre, le sens suit » est une légende au repos (refus : « énormément d'information pour rien »).
4. **m** En cave, « reçu » choisi s'allume en jaune dans le plateau, alors que la phrase le montre en vert. Ce jaune ressemble à l'ambre
   de « payé ».
5. **d** Le temps change selon le cas : « J'ai payé » ici, « Je paie » là.
6. **d** 250 à 350 px vides entre la phrase et le plateau (états b et c).

Il dirait : « Marrant, ça se lit bien en gros. Mais c'est du texte partout, et je retrouve plus à payer, Banque, la TVA… »

## v02 — ± sur le montant (5 problèmes, 0 B)
1. **m** Les puces « Pour quoi » mêlent les sens (Loyer, Abonnement, Apport, puis Vente, Achat, Salaire). Le sens ne tient qu'à un point
   de 4 px, si bien que la question « vente ou achat ? » ne se lit pas d'un coup.
2. **m** Sur la bascule, « sort » et « rentre » sont en 9 px. Au repos, aucun des deux n'est posé.
3. **m** 300 px vides entre le Calendrier et le pied (états a, b, c).
4. **d** L'interrupteur et les puces du rythme sont bleus, et ce bleu domine l'écran, plus fort que le sens.
5. **d** « jusqu'à ∞ » : le ∞ seul est un picto muet pour « sans fin ».

Il dirait : « Pas mal, le ± collé au montant c'est malin. Mais les petites puces, je sais pas laquelle sort ou rentre. »

## v06 — Qui paie qui ? (6 problèmes, 0 B)
1. **m** Il n'y a pas de nœud pour le salarié : Salaire n'a pas de place dans le schéma.
2. **m** Après le choix, le schéma prend 290 px pour 2 ronds, et le montant descend en 22 px. C'est un écart à p3c-3, qui donne un grand
   montant.
3. **m** « Touche avec qui l'argent passe » est une légende au repos.
4. **m** Au repos, le montant et « Pour quoi ? » sont grisés sous le schéma : on ne sait pas si on peut taper le montant d'abord.
5. **d** « chaque mois · → oct. 2027 » : « · → » collés, ponctuation cassée.
6. **d** 200 px vides sous le Calendrier.

Il dirait : « Sympa le schéma, la flèche qui se répète c'est parlant. Mais pour un achat de malt c'est long, et le montant est tout petit. »

## v07 — Quand ça tombe ? (5 problèmes, 1 B)
1. **B** Une poignée maison, au bout de la grille, règle la fin de la période. C'est un nouveau choix de période hors de la frise partagée
   (GESTE-DATE-PARTOUT : « le geste au doigt choisi et porté PARTOUT »). La poignée, une barre noire de 4 px collée à « oct. », se lit
   comme une barre de défilement. Correction : la fin se règle sur la frise partagée.
2. **m** Pour un achat ou une vente d'une seule fois, le cas le plus fréquent, la grille de 12 mois occupe tout l'écran pour rien.
3. **m** Aucune tuile de genre : le genre se devine du texte « Pour quoi ? loyer, apport… », et le sens tient au petit « − + » en haut à gauche.
4. **m** Au repos, 12 cases vides et un « + » en novembre : on ne comprend pas l'écran en 3 s.
5. **d** « le 22 · sans fin, poignée pour finir » est un mode d'emploi écrit.

Il dirait : « Les 12 mois pour un loyer ok, le total sur l'année j'aime bien. Mais pour un achat ça sert à rien. Et c'est pas la frise ??? »

## Doutes (non comptés)
- L'abonnement n'existe qu'en sortie, alors qu'un abonnement client (club bière) rentrerait. Le remboursement n'existe qu'en entrée.
- « Prélèvement » peut se lire comme un débit bancaire (LSV), mais « prélèvements privés » est le mot suisse de la comptabilité.
- L'échéance s'ancre sur le jour de saisie (« le 22 »). Un loyer dû le 1er demande d'aller chercher la date.
- v07 : la hauteur des barres n'est pas proportionnelle (2 000 fait à peine 1,5 fois 400, et 29,90 n'est qu'un trait).
- Les gestes n'ont pas été joués : je ne juge que des captures fixes.

## Classement
1. **v01** : base p3c-3 tenue, sens en deux rangées, tout sur un écran, 3 touchers.
2. **v04** : le moins de gestes, il solde l'échéance (règle le problème commun 1), confirmation sur la ligne même. Le sens est faible au repos.
3. **v08** : le sens est impossible à oublier, mais il perd « à payer », et le pavé est lourd.
4. **v05** : le sens le plus fort en couleur, mais du texte couché et du vide.
5. **v03** : très lisible, mais il quitte la carte p3c-3 et c'est du texte au premier plan.
6. **v02** : compact, mais les puces mêlent les sens.
7. **v06** : l'idée amuse, mais elle est lente pour un achat et le montant est rapetissé.
8. **v07** : bonne pour la récurrence, inutile pour une saisie d'une fois, et elle enfreint la règle de la frise.

Prédiction : il prend v01 et demande « avec les habituels de v04 ». La fusion v01 + v04 est la candidate.

## Greffes
- **Habituels** (v04), 3 à 5 lignes au-dessus des tuiles, un toucher pour ouvrir. Vers v01 et v08.
- **« solde l'échéance du 22.11 »** (v04). Vers toutes : c'est la correction du problème commun 1.
- **Sens écrit sur le bouton** (v08 : « − Payé », « + Reçu »). Vers v01 et v04 : le bouton noir garde sa forme, son libellé devient
  « ✓ Payé −400,00 » ou « ✓ Reçu +2 000,00 ».
- **Moitiés teintées vert et ambre** (v05) à la place du liseré. Vers v01, sur le fond des deux rangées de tuiles.
- **Flèche en rafale ou flèche simple** (v06) pour dire « chaque mois » ou « une fois ». Vers v01 et v04, dans la confirmation et l'aperçu.
- **⇄ inverser le sens** (v06). Vers v04 et v08 : corriger le sens sans tout ressaisir.
- **Σ 12 mois** (v07 : « −4 800,00 / an »). Vers v01 et v04, sous « Revient ».
- **« jusqu'à : sans fin · 6 mois · 1 an (12 fois) · date »** (v03). Vers v01 et v02 : plus direct que « une date ».
- **« Fournisseur, TVA, référence » replié** (v01). Vers v03, v05 et v08, qui l'ont perdu.
- **Articles et stock pour l'achat** (son écran actuel). Vers toutes : la ligne repliée « Articles · n » sous la tuile Achat.

## Retouches communes
- Supprimer toute légende au repos (v03, v06, v07, v08, et « Une seule fois. » de v01).
- Écrire la ligne Calendrier en 12 px au moins, en noir.
- Montrer l'état Achat, et ce que fait la date quand on la touche (la frise partagée).

LEÇON PROPOSÉE : aucune
