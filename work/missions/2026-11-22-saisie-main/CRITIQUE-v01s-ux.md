OK — v01s UX : 20 problèmes (1 B, 11 m, 8 d) ; 14 touchers confirmés à 844 avec le clavier dessiné, environ 18 à 660 avec un clavier réel (estimé)

# Saisie à la main v01s — critique UX mobile (22.11)

Regard : expert UX mobile (pouce, une main, clavier ouvert). J'ai ouvert les 16 captures de `captures/v01s/`, plus `tableau.png`.
Base : v01 choisie (D426, « rendre le workflow encore mieux et plus simple »). Légende : **B** bloquant, **m** moyen, **d** détail.
Cibles jugées selon DESIGN.md (§ Cibles) : 24 px CSS au minimum, 28 à 32 px pour une commande courante. Le 44 px n'est pas la règle de l'app.
Mesures en px CSS. Les captures sont en @2x : 1 px CSS = 2 px d'image.

## Recompte (touchers / frappes)
Hypothèses, celles des NOTES :
- clavier ouvert d'office sur le montant ;
- nom posé par le genre ;
- catégorie par défaut juste (Brassage pour l'achat) ;
- date = aujourd'hui.

Un défilement compte pour un geste, comme un toucher.

| Cas | Gestes | 844, clavier dessiné (224 px) | 844, clavier réel ≈ 300 px (estimé) | 660, clavier réel ≈ 300 px (estimé) |
|---|---|---|---|---|
| 1. Achat 40 | Achat · 4 0 · Payé | 2 / 2 | 2 / 2 | 2 / 2 |
| 2. Vente 250 | Vente · 2 5 0 · Reçu | 2 / 3 | 2 / 3 | **3** / 3 (défiler jusqu'à « Ça rentre ») |
| 3. Loyer chaque mois | Loyer · 4 0 0 · Payé | 2 / 3 | 2 / 3 | 2 / 3 |
| 4. Apport | Apport · 2 0 0 0 · Reçu | 2 / 4 | 2 / 4 | **3** / 4 (défiler) |
| 5. Abonnement → oct. 2027 | Abonnement · 2 9 , 9 0 · 1 an · 12 fois · Payé | 3 / 5 | 3 / 5 | **4** / 5 (« jusqu'à » à y 301–335, sous le clavier) |
| 6. Remboursement 18,40 | Remboursement · Malterie · 1 8 , 4 0 · Reçu | 3 / 5 | 3 / 5 | **4** / 5 (défiler jusqu'à Remboursement) |
| **Total** | | **14 / 22** | **14 / 22** | **≈ 18 / 22** |
| Loyer, le mois suivant | habituel Loyer · Payé | 2 / 0 | **3** / 0 (habituels à y 481–537, sous le clavier) | **3** / 0 |

- **Sur la planche** : je retrouve les 14 / 22 et le 2 / 0 des NOTES. Les frappes sont justes : 2 + 3 + 3 + 4 + 5 + 5 = 22.
- **Sur son téléphone** : le gain tient, mais pas partout.
  - La source est l'hypothèse de la passe 1 : un Android avec Gboard, 390 × 660 utiles, un clavier numérique d'environ 300 px.
  - Les 4 cas de la passe 1 (loyer, apport, abonnement, achat) coûtent environ 11 touchers à 660, contre 18 pour v01. Le progrès est réel.
- **Ce que le clavier couvre** (zone visible = de 48 px à la hauteur utile, moins le pied de 61 px et le clavier) :
  - 844 dessiné : tout est visible jusqu'aux habituels (y 538), et le pied commence à 560 ;
  - 844 réel (estimé) : le pied remonte vers 484. Remboursement passe juste (fin à 466), les habituels sont couverts ;
  - 660 dessiné : on voit la carte, « Ça sort » et « Ça rentre ». Remboursement et habituels demandent un défilement ;
  - 660 réel (estimé) : le pied remonte vers 299. On ne voit que la carte et « Ça sort » (fin à 292), « Ça rentre » est couvert. Pour Loyer et Abonnement, « jusqu'à », le Calendrier et Σ sont couverts.

## Problèmes
1. **B (estimé, à mesurer)** — Le clavier dessiné fait 224 px : 4 rangées de 46 px, plus les écarts et les marges. Un pavé Gboard réel fait environ 300 px.
   - À 660 sur son téléphone, « Ça rentre » (Vente, Apport) passe sous le clavier. Le premier écran ne montre que des sorties : c'est sa plainte « vente ou achat » rejouée à moitié.
   - La promesse des NOTES ne tient donc pas : « à 660, carte + Ça sort + Ça rentre restent visibles ».
   - Remède :
     - mesurer `visualViewport.height`, clavier ouvert, sur son téléphone ;
     - redessiner le clavier à cette hauteur et refaire les captures 660 et 844 ;
     - prévoir un mode court sous 700 px utiles :
       - la carte tient sur une ligne, environ 70 px : montant en 40 px et date, « Pour quoi ? » caché tant qu'aucun genre n'est choisi ;
       - les titres « ↑ Ça sort » et « ↓ Ça rentre » deviennent une tranche colorée à gauche du panneau, ce qui gagne environ 60 px ;
       - les tuiles passent en ligne, à 40 px.
     - Bilan estimé : la carte, les 7 tuiles de sortie et les 3 d'entrée tiennent dans 48 + 70 + 88 + 44 + 16 ≈ 266 px, sous la limite de 299 px.
2. **m** — Le clavier ouvert d'office, et le focus gardé quand on touche une tuile, ne sont pas prouvés. Tout le gain de −7 touchers en dépend : sans eux, il faut un toucher de plus par cas, soit 20.
   - Remède :
     - appeler `focus()` de façon synchrone dans le geste qui ouvre l'écran ;
     - sur iPhone, mettre le focus sur un champ relais dans ce geste, puis le transférer au montant ;
     - tuiles et puces en `pointerdown` + `preventDefault` ;
     - preuve sur son téléphone : une capture clavier ouvert à l'arrivée, une après le toucher d'une tuile.
3. **m** — Les habituels sont en bas, sous Remboursement. Le loyer du mois suivant, le cas le plus répété, demande un défilement (problème 1), donc 3 / 0 au lieu de 2 / 0.
   - Remède : montrer l'échéance due en une ligne sous la carte, par exemple « ↻ Loyer de décembre −400,00 · dû le 22.12 ».
   - L'échéance due est l'occurrence d'un plan récurrent, non soldée, à ± 7 jours. Les autres habituels restent en bas.
4. **m** — L'état « montant tapé, genre pas encore choisi » n'est pas dessiné, alors que les NOTES disent « on tape avant ou après le genre ».
   - Dans cet état, Enregistrer reste gris sans dire pourquoi, et l'effet d'Entrée n'est pas dit.
   - Remède : le bouton grisé dit « Ça sort ou ça rentre ? » ; Entrée fait pulser les deux panneaux ; le montant reste sans signe, en gris foncé.
5. **m** — Dès qu'un genre est choisi, la puce date « 22.11.26 » de la carte disparaît : elle laisse place à la catégorie, pour Achat, Vente, Apport et Remboursement.
   - Saisir le ticket d'hier n'a plus de chemin visible : la date ne survit que dans « Payé aujourd'hui » et dans « Calendrier 22.11 », qu'on ne touche pas.
   - Remède : « Payé le 22.11 ⌄ », qui ouvre « aujourd'hui · hier · date », ou garder la puce date à gauche de la catégorie.
6. **m** — Le pli « Fournisseur, TVA, référence » est le même pour Vente et Apport. Un fournisseur sur une vente ou une TVA sur un apport n'existent pas, et le sens se brouille.
   - Remède, un pli par genre : Vente « Client, bières, TVA » ; Apport « Note » ou pas de pli ; Loyer « Bailleur, référence ».
7. **m** — Le Remboursement garde « Revient : Une fois ⌄ » et « Calendrier 22.11 ✓ une fois », dans le formulaire et dans la confirmation. Un remboursement lié à une pièce ne revient pas.
   - Remède : retirer ce bloc pour le Remboursement.
8. **m** — Plusieurs textes redisent ce que l'écran montre déjà :
   - « le genre le pose » : le mot « genre » n'apparaît nulle part ailleurs ;
   - la phrase « Le sens suit la pièce… » : l'étiquette « rentre » ou « sort » de chaque ligne le dit déjà ;
   - la note de l'apport, sur deux lignes : Mon mois « inchangé » et la confirmation le disent déjà ;
   - « Calendrier 22.11 ✓ une fois » sur chaque mouvement unique ;
   - « solde l'échéance… pas de second plan » et « déjà au plan, rien à refaire », dans l'habituel : « plan » est un mot du code.
   - Remède : retirer les quatre premiers. Pour l'habituel, une seule ligne : « Loyer de décembre · déjà prévu chaque mois ».
9. **m** — Le plateau « De quelle pièce ? » n'a ni ✕, ni poignée, ni voile. Au-dessus, Mon mois « — » et Enregistrer, grisé, restent visibles : cela fait deux zones d'action.
   - Remède : un voile sur le formulaire, une poignée et un ✕, et le pied masqué tant que le plateau est ouvert.
10. **m** — Dans l'état `fin`, « OK » noir et « Payé −29,90 » noir sont visibles ensemble : on ne sait pas lequel toucher.
    - Remède : masquer le pied tant que la frise est ouverte, ou supprimer OK. La frise s'applique alors en direct, et un toucher hors du plateau le ferme.
11. **m** — À 660, après le toucher de « 1 an · 12 fois », la ligne « … 22.10.27 · 12 fois » et le Σ passent sous le pied. Le toucher n'a pas d'effet lisible, à part la puce allumée.
    - Remède : mettre la fin dans la puce choisie, « 12 fois → 22.10.27 ».
12. **m** — Dans la confirmation du remboursement, « coût net 168,00 » est posé dans la colonne des libellés, sous « Pièce ».
    - Remède : le mettre dans la colonne des valeurs : « Malterie 14.11 · 186,40 → net 168,00 ».
13. **d** — Pour un achat, « Brassage » apparaît deux fois : en pastille dans la carte et en puce choisie dessous.
    - Remède : masquer la pastille tant que la rangée de catégories est visible. C'est la base v01 : à lui montrer avant de changer.
14. **d** — Le noir des choix (Payé aujourd'hui, Chaque mois, sans fin, Brassage) est le même que celui du bouton d'action. Avec 4 ou 5 aplats noirs, l'action ne ressort plus.
    - Il ne faut pas y toucher sans le lui montrer : cela vient de la base p3c-3 et de v01.
15. **d** — La place vide à 844 va de 84 px (loyer, abonnement) à 225 px (habituel). Les « ~160 px » des NOTES sont des px d'image @2x, soit 84 px CSS pour le loyer.
    - Environ 76 px de ce vide viennent du clavier dessiné trop court.
    - Remède : ne rien y ajouter. Mesurer d'abord (problème 1), puis il ne reste que 8 à 150 px.
16. **d** — En fr-CH ou de-CH, Gboard peut donner « . » au lieu de « , ». Le champ doit accepter les deux.
17. **d** — « 1 an · 12 fois » doit suivre le rythme : en trimestriel, « 1 an · 4 fois ». Ce n'est pas dessiné.
18. **d** — Safari sur iPhone ignore `interactive-widget=resizes-content` : seul `visualViewport` tient le pied au-dessus du clavier. Les NOTES citent les deux comme équivalents.
19. **d** — Le crayon du nom est une icône d'environ 11 px, et sa cible n'est pas prouvée.
    - Remède : faire de toute la ligne du nom la cible, à 24 px au moins (DESIGN.md).
    - Les autres cibles sont conformes : tuiles 52 px, puces 33, « changer » 36, habituels 44, lignes de pièce 58.
20. **d** — Le remboursement d'un client n'est pas dessiné, par exemple la pièce « Marché de Noël ↑ sort ». Il faudrait une bande ambre « Ça sort » et un bouton « Rendu −… ».

## Sens
Le sens n'est jamais ambigu une fois le genre choisi. Quatre choses le disent ensemble : le signe et la couleur du montant, le panneau ↑ ou ↓, et le verbe du bouton (« Payé −… », « Reçu +… »).
- Avant le genre, le montant n'a pas de signe et on ne peut pas enregistrer, ce qui est sûr. Cet état reste à dessiner (problème 4).
- Le Remboursement neutre prend le sens de sa pièce, et chaque ligne du plateau le montre : c'est correct.

## Défilement à 660
Le pied reste épinglé, et le contenu défile entre l'en-tête et le pied. Ce qui demande un défilement :
- avec le clavier dessiné : Remboursement, les habituels, et le « … sans fin » ou Σ du loyer et de l'abonnement ;
- avec un clavier réel (estimé) : en plus, « Ça rentre » et la ligne « jusqu'à ».

## Mesure demandée
Sur son téléphone, ou sur Chrome Android à 390 × 660, avec le clavier numérique ouvert sur un `<input inputmode="decimal">` : relever `visualViewport.height`.
Ce chiffre confirme ou lève le problème 1, et fixe la hauteur du clavier à redessiner.
