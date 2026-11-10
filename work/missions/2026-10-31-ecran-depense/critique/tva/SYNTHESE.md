OK — tri : r3, r4, r2 (candidates) ; z3 et u4 en relance ciblée

# Vue TVA — tri des 12 v0 (critique calibrée, 01.11)

Détail par série : `r.md`, `z.md`, `u.md`. 98 captures ouvertes (7 états à 390 et une à 1280 par variante, plus les gestes
de la série r et `z3-carte`). Gestes : joués sur les captures `*-geste-*.png` de r et sur les états `si` / `douteuse` de z et
u ; je n'ai pas ouvert `etat.html` dans Chrome : ce que dit une capture fixe d'un geste est dit comme tel.

## Niveau du panel
Au niveau des premiers écrans du lot 21 et de r6n2 : la base est reconnue dans les 12 (coquille de l'app, onglets, bascule,
barre du bas), les sept états sont dessinés partout, l'inconnu n'est jamais à zéro dans aucune des 12, et les quatre formes
du brief sont couvertes avec quatre formes libres en plus (perles, gaufre, bouteilles, ticket). Pas de « relancer ».
`PANEL OK` du pilote (0,58 ; 0,89 ; 0 paire) confirmé à l'œil : aucune paire ne se ressemble.
Séries restées sur ses exemples (« pastilles sur les items », « récap en haut qui renvoie ») : r1, r4, z1, soit 3 sur 12,
sous le tiers. À signaler avant tout le reste : **la coquille des z** n'est pas celle de la base (icône jaune « D », bouton
« ? », + gris) ; règle n° 1, à copier de r1 avant toute passe.

## Classement
1. **r3** (Annuel, par brassin, perles, balance) — répond en trois secondes (« Non remboursée » noir + « au moins 171,83 »),
   pense brasseur (CHF/L), l'inconnu en perle « ? » sans longueur, le net « si » en balance honnête ; seul désordre : le
   collier du hors brassin.
2. **r4** (Opérations, récap à renvois, frise des mois, pastilles) — ses deux phrases mot pour mot, « ≥ » et « — » sur les
   sous-totaux, frise qui dit « quand » ; place hors cadrage et statut en bouton noir.
3. **z3** (carte de Synthèse → gaufre par mois) — l'idée la plus neuve, honnête (case « ? » sans valeur), la seule carte
   montrée dans la vraie page de Synthèse ; le « Non » est en bas, « ■ = 2 CHF » au repos, coquille à corriger.
4. **u4** (Opérations, ticket, tampon, coupon) — la réponse par un objet, en une seconde ; honnêteté des totaux soignée ;
   coupon = conseil fiscal, comptoir décoratif, noms réels.
5. **z4** (mode de Synthèse, bouteilles par brassin, ct/L, hors brassin 69 %) — pensée brasseur, l'insight « la TVA est dans
   le matériel » ; un brassin avec inconnue donne un ct/L sans « ≥ » ; coquille.
6. **r2** (carte de Synthèse → trimestres, barre empilée, net) — le sélecteur de période est le graphique, 2025 hachuré aux
   4/5 ; ouvre sur T4, barre en TTC sous un titre « TVA », net négatif seul.
7. **u2** (Annuel, frise 12 mois, top 5) — le graphique le plus grand, chapeaux « ? » ; pas de « Non », interrupteur « si »
   pris pour un réglage, paragraphe au repos.
8. **z1** (mode de Synthèse, récap à renvois, liste à pastilles) — la liste la plus dense et la plus lisible du lot, douteuse
   qui clignote ; « Remboursée : 0,00 » demande de lire, coquille.
9. **u3** (Coûts, bouteille en ct/33 cl) — unité parlante, intervalles bien écrits ; le fermenteur dans « chaque 33 cl »
   fausse le chiffre, facteur libre = contenant.
10. **r1** (mode de Synthèse, chiffres) — tout juste, rien de faux, « Non » d'abord ; aucune forme, « un peu sage ».
11. **u1** (mode de Synthèse, liste par poste, barres) — intervalles et import CH bien pensés ; réponse cachée derrière
    « Voir le calcul », conseil dans la feuille, noms réels.
12. **z2** (Annuel, barres par trimestre, net en formule) — bonnes barres (meilleure 1280) ; pas de « Non » au premier écran,
    formule rouge « = −999,74 » à lire, phrase d'aide dans `vide`.

**r4 et la place Opérations.** Oui, elle lui parlerait : c'est l'onglet où vivent ses pièces, et « Journal / TVA » se lit
comme « Situation / Coûts ». Mais le journal mêle ventes et dépenses, et le mode TVA ne montre que les dépenses : il demandera
« et mes ventes ? ». À lui de trancher (L24) : la retouche 3 de r4 lui montre la même vue aux deux places.

## Candidates
Trois, une par approche, dans deux chaleurs : r3 (chaude, par brassin), r4 (chaude, journal lu par mois), r2 (tiède, par
trimestre, carte de Synthèse). z3 et u4 ne sont pas candidates parce qu'elles disent la même chose que r4 (l'année lue par
mois avec des renvois) et que u4 doit d'abord être assagie ; leurs idées passent en greffes et en relance ciblée.

### r3 — Annuel, par brassin
1. **Hors brassin** : remplacer le collier de dix perles sur deux lignes par une barre empilée par taux (bleu 8,1 %, vert
   2,6 %) avec le jeton « 4? » au bout (greffe z2). Vérifiable : la rangée « Hors brassin » tient sur une ligne ≤ 48 px à 390.
2. **« ≥ » sur un brassin partiel** : quand un brassin porte une perle « ? », sa TVA et son CHF/L s'écrivent « ≥ 19,39 » et
   « ≥ 0,32/L » (règle de r4 sur les mois). Vérifiable : `douteuse`/`annee`, rangée #23 IPA.
3. **Le « si » au-dessus du pli en 2025** : une rangée repliée « Si j'étais assujetti · je paierais 566,99 de plus ⌄ » juste
   sous le récap, la balance et les hypothèses dans le repli. Vérifiable : en `inconnues` à 390, la rangée est visible sans
   défiler (y < 844).
Plus : écrire dans la NOTE la règle facture → brassin (un malt livré pour deux brassins), avant tout port.

### r4 — Opérations (et Synthèse), récap à renvois
1. **Statut en réglage** : le bouton noir « Non remboursée › » devient le texte « Non remboursée » et un chip au trait
   « Non assujetti › » (celui de r1) vers les Réglages. Vérifiable : `annee-390`, le chip est dans le récap, aucun bouton
   plein noir dans la vue.
2. **Frise lisible** : lettres de mois ≥ 12 px à 390, N et D en « à venir » (pointillé, comme u2), et le mois choisi
   chiffré au-dessus de sa colonne. Vérifiable : CONTRASTE OK et `geste-mois-octobre` montre « 44,62 » sur O.
3. **Deux places pour qu'il tranche** : la même vue en troisième mode de Synthèse (`?place=synthese`, segment « Situation ·
   Coûts · TVA ») et en mode du journal (`?place=operations`), capturées côte à côte sur une page de choix (D126).
   Vérifiable : deux captures `r4-annee-390-synthese.png` et `r4-annee-390-operations.png`.
Plus : la jauge « Ventes 2026 9 860 / 100 000 CHF » sous « Si assujetti » garde le fait (ventes enregistrées) et perd la barre
de seuil ; l'AFC reste au toucher.

### r2 — carte de Synthèse, trimestres
1. **Ouvrir sur l'année** : l'état `annee` montre « Année » choisie (« TVA payée 2026 · au moins 171,83 ») ; T4 à un toucher.
   Vérifiable : `annee-390` affiche 171,83, pas 44,62.
2. **La barre en TVA** : sous « TVA payée », la barre empile la TVA par taux et porte le jeton « +4? » au bout (greffe z2) ;
   la part du TTC inconnu reste dans la rangée « dépensé » (23,50). Vérifiable : la longueur verte / bleue = 101,94 / 69,89.
3. **Le net en mots** : la rangée repliée dit « Si j'étais assujetti · je paierais 85,76 de plus ⌄ » (pas « −85,76 CHF » seul) ;
   la carte de Synthèse dit « au moins 171,83 CHF ». Vérifiable : chaînes présentes dans `annee-390` et `geste-carte-synthese`.

## Greffes
| # | Idée | Origine | Reçoit |
|---|---|---|---|
| 1 | La gaufre (1 case = 2 CHF, « ? » hachuré) comme contenu de la carte fermée de Synthèse, l'unité au toucher | z3 | r2 (carte) |
| 2 | Le jeton « n? » au bout d'une barre, sans longueur | z2 | r3 (hors brassin), r2 (barre) |
| 3 | « ≥ » sur un sous-total qui contient une inconnue, « — » s'il n'a que des inconnues | r4 | r3, z4 |
| 4 | Le mot « total partiel » à côté du total quand l'inconnu domine (en plus de l'ocre) | z1, z2 | r2 (2025), r3 (2025) |
| 5 | La ligne renvoyée clignote 1,6 s quand on touche son chip (« 1 choisie à la saisie ») | z1 | r4, r3 |
| 6 | La borne haute « au plus N (si tout à 8,1 %) » au toucher du chip « +4 inconnues » | u1, u4 | r3, r2 |
| 7 | La TVA suisse à l'importation (La Poste / douane) comptée, distincte de la MwSt étrangère « à part » | u1, u2, u4 | r3 (rangée Étranger), r4 (chip « DE à part ») |
| 8 | « Photos pas encore lues ×2 · ? · pas comptées » dans `horsligne` | u4, u1 | r4 (journal), r3 |
| 9 | « Voir 2025 · 1 204,30 › » dans l'état `vide` | u1, u3 | r2, r3 |
| 10 | La part du hors brassin en % (« 69 % ») | z4 | r3 (rangée Hors brassin : « 41 % ») |
| 11 | « Du prix · 2,8 % » et le ct par 33 cl à côté du CHF/L | u3 | r3 |
| 12 | « Me la faire rembourser ? » (son mot) comme libellé du repli « si » | u1–u4 | r2, r3, r4 |
| 13 | Une barre de données derrière la ligne (longueur = sa TVA, teinte du taux) | u1 | r4 (journal) |
| 14 | « Les plus grosses TVA » : un chip du récap qui trie le journal par TVA décroissante | u2 | r4 |
| 15 | Le filtre par chip qui estompe les autres au lieu de les cacher (la frise garde son contexte) | z3 | r4 |
| 16 | « 5,9 % de 14 860,00 d'achats » sous le total | u1 | r2 |
| 17 | Le tampon « NON RÉCUPÉRABLE » comme forme du « Non » (objet, pas phrase) | u4 | r2 (« Remboursée Non » gris, trop discret) |
| 18 | Le ticket étranger agrafé de travers : l'étranger est physiquement hors du document | u4 | r3 (rangée Étranger : à essayer en pli séparé) |

## Retouches communes au lot
- **Le « Non » avant le total**, dans chaque variante (fiche : « je récupère ? » d'abord) : r2, z1–z4, u1–u3 ne le disent pas
  en premier ; « Remboursée : 0,00 » (z) demande de lire, « récupérable ? » (u2) ne répond pas.
- **Le statut en chip de réglage** « Non assujetti › » partout (r4, u1–u4 : absent ou en bouton / tampon).
- **La douteuse « choisie à la saisie »** avec renvoi à la tuile ① (u1–u4 la tranchent dans la vue : J5).
- **Aucun conseil dans le « si »** : ni point d'équilibre (« gagnant sous 11 609 »), ni « obligatoire dès 100 000 », ni
  « à confirmer avec ta fiduciaire » en phrase (u1–u4) ; le net et ses hypothèses, ou rien et l'AFC.
- **Aucune phrase d'aide au repos** dans `vide` (z1, z2, u1, u2, u4).
- **Noms fictifs** dans la série u (Vetropack, Landi, Brouwland, Inox-Pro…).
- **Coquille de r1** pour les z.
- **« au moins »** sur tout total qui a une inconnue, carte de Synthèse comprise (r2).
- **1280** : deux colonnes quand la vue a une liste (r1, z1, z3, u1 restent en colonne unique à 872 px).

## Relances ciblées et fusions
- **u4** (relance) : coupon sans conseil (net + hypothèses), ticket sur fond blanc sans comptoir, tampon lié au réglage,
  noms fictifs, douteuse « choisie à la saisie ». Assagie, elle revient en quatrième candidate : le brasseur dira « ça c'est
  parlant » devant le tampon.
- **z3 → r2** (fusion) : la carte de Synthèse de r2 reçoit la gaufre de z3 (greffe 1) ; la vue ouverte garde les trimestres de
  r2, et un rang de gaufre par trimestre peut remplacer les colonnes si la passe 2 le montre mieux.
- **z4 → r3** (fusion) : la part « 69 % hors brassin » et le « ≥ » ; r3 garde les perles, qu'il a demandées (« pastilles sur
  les items »).
- **u2 → r4** : le top 5 et les mois à venir en pointillé.

LEÇON PROPOSÉE : un brief minimal (série u) qui omet « données fictives » et « choisie à la saisie » produit des noms réels et
une douteuse tranchée dans la vue ; les exigences d'honnêteté et de données sont transversales (L05) et doivent figurer même
dans le brief minimal.
