# e5, passe 3 : « on gagne / on paie », sans vide (série E, la frise ; tiède)

Page : `e5/etat.html`, générée par `generer.mjs` et `socle2.mjs`, copiés de la passe 2, qui n'est pas modifiée. Retouche scriptée :
`captures/travail/passe3.cjs`, par remplacements exacts, sans regex (L26). Geste joué : `captures/geste-e5.json`, 0 erreur.

## Passe 3

Remplissage du premier écran (M14, `controle-panel`) : **0,39 → 0,61**, au-dessus du plancher de 0,55 (r6n2 : 0,70 sur la même mesure).
Le vide est rempli par des idées, pas par du texte : **77 mots** (76 en passe 2).

- **Ce qu'on gagne, toutes les familles** : chaque colonne empile ce qu'Idaho 7 ajoute, le floral en bas, puis les baies, les tropicaux, les agrumes et le noyau, aux couleurs des arômes. Les cinq pictos sont en tête, dans l'ordre de la pile. Avant, seul le floral était dessiné, et le haut de la figure restait vide. Le simulé reste « ~ », l'interpolé pâli. La bande pâle garde la place du floral dans la 16D.
- **Le spectre des 12 familles au moment touché**, monté du « 12 familles » d'un toucher et sans chiffres : « ta stout » en gris, « avec Idaho 7 » en couleur, face à la zone 16D. Pépins et Melon sont hachurés (inconnus), le résineux en orangé au-delà de la zone. C'est x3b réduit, « Ma bière → + Idaho 7 ». Les valeurs chiffrées restent derrière « 12 familles ».
- **Le solde contre le meilleur** (greffe b4, verdict) : dès qu'on quitte le meilleur moment, la ligne de la figure dit « contre ★ floral ≈−18 » ; le bouton « ★ actif · 2 j » y ramène.
- **Un seul sens par trait** (retouche commune du verdict) : la hachure reste à l'inconnu (IBU à cru, Pépins, Melon). Les jours « sans gain » passent en pâle et pointillé. Le mot « IBU à cru? » part du pied : la hachure se lit seule, et la légende la dit.
- **Rapproché, élargi** : fond blanc comme r6n2, blocs sans marge latérale, figure sur toute la largeur. L'étiquette « ~+22 » au-dessus de la colonne part : la réponse la porte déjà, et sur une pile elle se lisait comme un total.
- **La fiche** : « 1 fiche : Beer Maverick 2023 » une fois, plus de « 1/1 » (retouche commune du verdict).

Gardé de la passe 2 : la loupe à mini-barres chiffrées, l'IBU orangé « trop amer », la mesure qui suit le moment, le CO₂, la levure en dernière étape, les jours au bout de la frise, le pas de 5′ et le picto « épicé » cannelle et clou croisés.

Sorties décisives (`captures/travail/gates.txt`) :
- COMMUN OK ;
- MOTS OK (77) ;
- UNE-QUESTION OK (1 groupe libre : moment) ;
- ACQUIS OK (4/4 : geste, frise, valeurs, levure) ;
- PAGE OK ;
- PANEL OK (e5 à 0,61, r6n2 à 0,70).

Captures ouvertes : `captures/e5-premier-ecran.png`, `captures/e5-390.png` et `captures/e5-toucher-390.png` (doigt à 50′, loupe, « contre ★ floral ≈−18 »).

Ce qui casse encore :
- le bas du premier écran garde environ 8 % de blanc ;
- les teintes des tropicaux et du noyau sont proches dans la pile, et seul l'ordre des pictos les départage ;
- la bande pâle du floral ne parle pas pour les autres familles de la pile.

## Passe 2 (rappel)

Voir `../passe2/NOTE.md` : greffes, retouches et sorties de la passe 2, toutes reprises ici.

## Baseline

Reprise (plancher à enrichir) :
- **y1b** :
  - le moment glissé par tranches de 5′ ;
  - « Face à ta stout » en une ligne ;
  - la jauge d'amertume de la stout (base Nugget 60, zone 16D 50–70, l'ajout en orangé s'il est trop amer, hachuré à
    cru) ;
  - le dock sous le pouce : la frise est le curseur, au bas de l'écran, avec la loupe.
- **x3b réduit, en fin de frise** : les jours de contact au bout, 1 à 7 j, hachurés au-delà de 2 j.
- **La levure en dernière étape**, comme dans la v0 : « 2 Levure › », placée après toutes les étapes, avec l'effet de
  Pomona quand il existe.
- **Les acquis** :
  - code couleur des arômes ; barres l5b à un toucher ;
  - au style par défaut et absolu, la zone du style toujours visible (bande rose de la frise, zone grise des barres) ;
  - pictos au trait de la planche standard, dont « épicé » cannelle et clou croisés (choisi le 23.10) ;
  - α du lot puis plage des fiches, rôle en mot (« mixte »), stock en icône ;
  - légende derrière le « ? » ;
  - appui long ou survol long sur Idaho 7 : la fiche (silhouette, α, arômes sourcés 1/1, geste « Goûter dans ma
    stout ») ;
  - honnêteté : « ~ » simulé, « ≈ » interpolé ou estimé et pâli, hachuré pour l'inconnu, « IBU à cru ? », une mesure
    sourcée par moment, « jamais mesuré » au whirlpool.

Écarts, chacun avec sa raison :
- **Les 12 barres l5b ne sont pas au premier plan** : elles s'ouvrent à un toucher, comme le demandait le critique, car
  la frise gagner/payer est la réponse. Au repos, elles feraient passer l'écran à plus de 100 mots.
- **Pas de radar m4/h4** : l'outil répond au moment, pas à la silhouette. Le radar reste dans la fiche.
- **a2b n'est pas dans Dryhopper** : la levure est fixée (D98). Son effet est dit dans l'étape 2 (« Pomona agrumes
  ~+13 » à l'actif, calculé).
- **« second houblon puis » de y1b est absent** : un seul facteur libre.
- **Le dock n'est pas fixé à l'écran** comme celui de y1b : la frise occupe le bas du premier écran, sous le pouce, et
  la page tient sans défiler (fin du contenu à 81 % de la hauteur).
- **Pas de bouton d'édition dans le contexte** (D98 b, admis) : la dose et la levure restent fixées pour cette question.
