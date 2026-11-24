OK — 6 problèmes, 1 bloquant

RESULTAT critique-58 : 6 problèmes (B 1, m 5, D 0) — corrigés rejoués 8/9 — carnet identique oui — BUGS OK

Version : index-CPpfj_-A.js. Le curl avec ?nocache donne CPpfj_-A, et `maj.mjs` a amené mon onglet neuf sur ce paquet.
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK : 2262 bugs, 518 ouverts, 202 sources).
Couvert : thème clair, 390 × 844, deviceScaleFactor 2, au toucher (événements tactiles CDP). Chrome de débug 9222, mon onglet seulement ; `clore.mjs` fait page.close() puis disconnect, et le navigateur reste ouvert. Non couvert : 1280 et le thème sombre (consigne du DOSSIER).
Coût IA : 10 lignes critique-58 au journal `2026-11-23-carnet-en-ligne/ia-journal.jsonl`, soit 4 rangements, 5 lectures de lien et 1 « Relire » sur ZZ, environ 0,060 CHF (plafond 0,10). L'échec du joint ZZ est simulé : aiTask y est bloqué dans mon onglet, donc 2 appels avortés, sans coût. Aucun appel IA sur son carnet : `vue.mjs` relève toute réponse aiTask, et il y en a eu 0.
Gardes : avant chaque toucher qui commence un geste sur la frise, `exigerZZ` vérifie l'élément sous le doigt (aria « ZZ TEST ») ; `supp-carnet`, `lien`, `creer` et `relire` refusent un titre sans « ZZ TEST » ; `supp-carnet` vérifie aussi le champ « Ajouter à ZZ TEST… » avant Supprimer.

## Son carnet et ses soldes : avant = après (`avant.json`, `apres.json`, 19 champs sur 19 identiques)
- À dépenser −463 (S53). En caisse 1 145,00 (libre 1 145,00). Synthèse 0,00 / 265,40. Opérations 265,40 / 0,00 / 265,40. Départ 1 145,00. Mon mois et HABITUELS identiques.
- Période : 6 sem., du 23 nov. 2026 au 3 janv. 2027. Le localStorage est identique (remis par `k-remettre.mjs` après chaque geste sur le cadre).
- Ses 16 choses de la frise : les aria sont identiques une par une.
- Carnets : Tous 20, Local 10, Brasserie 4, Meuble 4, Papiers 2. Chambre froide : texte identique, et ses 2 documents Firestore (837 et 9 086 o) aussi.
- Aucun ZZ restant : 2 écritures retirées (1 → 0 chacune), 5 carnets ZZ supprimés au toucher, la barre ZZ supprimée au toucher.

## Joué
- Son carnet, en lecture seule : le carnet, la feuille Articles, Comparer défilé, les deux fiches, puis le zoom ×3 de l'Offre (XA-offre). La recherche « frigorifique ». Son stock : Houblons, puis la fiche Cryo Hops Citra.
- Créés par une phrase : « ZZ TEST — cellule à 4 °C », « … marmite de brassage 50 L », « … houblon Citra », « … tuyau silicone 8 mm, 5 m », et « … joint torique 20 mm » (aiTask bloqué).
  - Liens : 2 ggmgastro (cellule) ; brewstore et KS240L (marmite) ; hopfenmarkt (Citra).
  - « ZZ TEST — chambre froide » nomme son carnet : l'aperçu dit « Déjà un carnet proche : Chambre froide [Ouvrir ce carnet] », et « Ajouter » ouvre son carnet (voulu, f5b n° 3). Rien n'y est écrit (Firestore identique). Le sans-critère est donc jugé sur son carnet, en lecture seule.
- Calendrier : la barre « Travaux · S48ZZ TEST — barre D » va du 23 nov. au 10 janv. et finit au bord droit (50–389 px).
  - Poignée de fin prise à 5, 15, 30 et 60 px, glissée de −49 px, puis Annuler. Toucher bref à 30 px.
  - Pas de 2, 4, 6 et 8 px, puis touchCancel.
  - Barre tenue au bord 2 s, à 30 et 4 px. Poignée de fin du cadre tenue 2 s, à 30 et 4 px.
- Rejeu : deux achats ZZ à payer le 08.12 (79,95 et 80). Vus dans l'en-tête, la frise, S50, les causes, la Liste, Prévisions et Caisse, puis retirés.

## Corrigés rejoués : 8 sur 9 (6 vérifiés, 2 rouverts, 1 non rejouable)
- **C56-1 vérifié** — en ligne index-CPpfj_-A.js. « ggmgastro.com » est seul sur sa ligne, le prix passe à la ligne, et ils ne se touchent plus (zoom ×3 XA-offre ; A-F1-0, Z-F1-0). La place du prix : voir le n° 6.
- **C56-2 non rejouable** — la marmite ZZ n'a plus de jauge, car son critère ne classe plus (n° 5).
- **C56-3 rouvert** — Les variantes du Citra tiennent : « 250 g » est entier (H-F1-1). Mais l'insécable coupe le nombre lui-même (n° 2). Les noms d'articles et le compromis ne sont pas couverts (n° 1).
- **C56-4 vérifié** — en ligne index-CPpfj_-A.js.
  - Les 5 phrases sont rangées au premier essai : aiTask répond 200 en 3,5 à 4,9 s. Aucun « n'a pas répondu » à la création (C1-fin, C4-fin).
  - Échec simulé : une reprise à 0,4 s, puis l'avis. « Relire » range ensuite en 3 s : « Joint torique 20 mm · à acheter ».
- **C56-5 vérifié** — en ligne index-CPpfj_-A.js. Dans le carnet du joint, un seul avis à la fois : le bandeau « Carnet créé », puis « L'IA n'a pas répondu : 1 message rangé tel quel [Relire] » (C6-t1_5, C6-fin). Il déborde ailleurs : voir le n° 3.
- **C56-6 vérifié** — en ligne index-CPpfj_-A.js. Cellule ZZ « Classé par Température de 4 °C › Prix » : prix, dispo, vendeur, puis température et Volume (Z-comparer-0).
- **C50-5 rouvert** — le compromis ne dit toujours pas ce qu'on perd (n° 4).
- **K57-1 vérifié** — en ligne index-CPpfj_-A.js. La poignée de fin du cadre est tenue 2 s.
  - À 4 px du bord : de 8 à 31 sem., en montée linéaire (avant, 305). À 30 px : de 8 à 19 sem.
  - Lâchée : « 23 nov. 2026 – 27 juin 2027 », soit +1 sem. d'arrondi après le lâcher, dans la plage (VC4-fin, VC4-lache).
- **K57-2 vérifié** — en ligne index-CPpfj_-A.js.
  - Prise à 5, 15, 30 ou 60 px : à 2 et 4 px, rien ne bouge ; à 6 px, la fin passe du 10 au 9 janv. (1 jour, sans saut) ; à −49 px, elle arrive au 4 janv.
  - Toucher bref : la fiche s'ouvre.
  - Q4-1 tenu : de S51 à S12 en 2,2 s à 30 px (≈ 6 col./s) ; de S51 à S20 à 4 px (≈ 9,5 col./s). POI-1 tenu.
- Rejeu, en regardant :
  - Tiennent : C46-1, C46-2 et C46-5 (« Achats · Fruty −2,40 » dans les causes ; −623 = −463 − 159,95).
  - Tiennent : E47-1 à E47-3. E47-4 n'est pas rejouable.
  - Tiennent : C52-1 et C52-2. C52-3 = C56-1.
  - Tiennent : C53-1 à C53-5 (Alpha 12,8 %, Récolte 2025, 2,5 ml/100 g, Myrcène).
  - Tiennent : C54-1 à C54-3 (« achat rond + 1 autre −159,95 »).
  - Tiennent : C55-1 (Branchement entier), C55-3 (« 242 L », « 50 L ») et C55-4.
  - **C55-2 retombe** (n° 5). Ligne hors de mon Possède, non modifiée : au pilote.
  - C48-1 à C48-6 et C50-1 à C50-9 (hors C50-5) : aucun écart vu sur les captures du tour. Non repris ligne à ligne.

## Combien et quels problèmes ? 6
1. m — **C58-1** — Un nombre est séparé de son unité en fin de ligne, dans les noms d'articles et dans le compromis :
   - son carnet Chambre froide, dans la liste et la feuille Articles : « 1500 x 1200 mm - 2,6 » puis « m³ - groupe frigorifique inclus » ;
   - la recherche : « 4,06 » puis « m³ » ;
   - le compromis : « 289,77 » puis « CHF de moins que la 2e ».
   R27 n'a pas été porté à ces textes (A-carnet, A-articles-0, R-frigorifique, A-comparer-3). Le brasseur : « 2,6, puis m³ en dessous ? » Attendu : nombre et unité sur la même ligne.
2. B — **C58-2** — L'insécable de C56-3 n'enveloppe que le dernier chiffre.
   - Lien retour du Comparer de la marmite ZZ : « ZZ TEST — marmite de brassage 5 », puis « 0 L » à l'écart. Le 50 est coupé en deux (M-comparer-0, P-m1).
   - Titre « ZZ TEST — joint torique 20 mm » : « 2 » en 18 px, « 0 mm » en 14 px (`cn-nowrap` en 14 px dans un titre de 18 px ; zoom XJ-titre). « 8 mm, 5 m », « 4 °C » et « 50 L » sont aussi plus petits que le titre (C4-fin, C1-fin, EZ1).
   - Valeur fausse à l'écran. Le brasseur : « Brassage 5… 0 L ? C'est 50 L. »
   - Attendu : le nombre entier avec son unité, à la taille du titre.
3. m — **C58-3** — Le joint ZZ échoue seul (aiTask bloqué, simulé). Ensuite, le bandeau « L'IA n'a pas répondu : 1 message rangé tel quel [Relire] » s'affiche dans tous les carnets ouverts : cellule, marmite, Citra, tuyau.
   - Là, l'IA avait répondu et rangé (EZ0 à EZ3, P-ez).
   - Cause au code : `bandeauxCarnet.tsx:35` ne filtre pas `aReprendre` par le carnet ouvert.
   - Le brasseur : « Il me dit que l'IA n'a pas répondu dans la marmite, alors que tout est rangé. »
   - Attendu : l'avis seulement dans le carnet du message, ou dans la liste.
4. m — **C58-4** — R30 n'est pas tenu : le compromis ne dit jamais ce qu'on perd.
   - Son carnet, sans critère : « la 1re, la moins chère : 289,77 CHF de moins que la 2e ; aucun critère ne les départage ». Rien sur 4,06 m³ contre 2,6.
   - Cellule ZZ : « la 1re, la température 0 à 8 °C ; 2 697,74 CHF, la moins chère, 289,77 CHF de moins que la 2e ». La température est la même chez les deux.
   - Marmite ZZ : « 218 CHF de moins que la 2e ; aucun critère ne les départage ».
   - Captures : A-comparer-3, P-m1, P-z1.
   - Le brasseur : « Et qu'est-ce que je perds pour 289 balles ? »
   - Attendu (sa réponse « Oui ») : le gain et la perte, avec ou sans critère.
5. m — **C58-5** — Marmite ZZ : « Critère : Marmite de brassage 50 L · calculé sur place » est affiché, mais le critère ne classe plus.
   - Comparer est « Classé par Prix », le compromis dit « aucun critère ne les départage », et la jauge a disparu des fiches.
   - Au tour 56, le carnet était classé par « Volume utile : 50 L » (C55-2 vérifié).
   - Cause probable : R30, « un critère sans valeur chez personne ne compte plus » (M-comparer-0, M-F1-0).
   - Le brasseur : « J'ai dit 50 L, pourquoi il trie au prix ? »
   - Attendu : le critère de sa phrase classe le carnet.
6. m — **C58-6** — Fiche › Offre, articles ggmgastro (son carnet, deux fiches ; cellule ZZ) : le prix passe sous « en stock », mais il flotte au milieu de la carte.
   - Il n'est ni sous le vendeur ni à droite, et il est loin de « Ouvrir » (zoom XA-offre, Z-F1-0).
   - Sur galaxus et brewstore, le prix est sur la ligne du vendeur, à droite (P-m1).
   - Le brasseur : « Le prix est au milieu de nulle part. »
   - Attendu : une place fixe pour le prix.

Bloquants : 1 (n° 2, valeur fausse à l'écran). Aucun geste sans effet, aucun texte illisible, rien de sa maquette ne manque.

### Doutes (non comptés)
- « ZZ TEST — chambre froide » : le bouton dit « Ajouter », mais il ouvre son carnet, et la phrase disparaît du champ. C'est voulu (f5b n° 3). Le mot du bouton ne le dit pas.
- La pastille « Lu · Kibernetik KS240L dans « ZZ TEST — marmite… » » suit dans tous les carnets (EZ0 à EZ3), comme le bandeau du n° 3.
- Après Annuler d'une barre tirée, la barre mesure 49–383 au bout de 1,5 s. Au script suivant, elle est revenue à 50–389 (transitoire).
- VC4-lache : 1,8 s après avoir lâché le cadre à 4 px, l'écran est voilé de blanc. Non élucidé (demi-échelle).
- Le cadre à 4 px gagne environ 10 sem./s : on passe 6 mois en 1,5 s environ. Le plafond est tenu, mais c'est encore vif.
- Déjà vus : « Horizon : jusqu'au 23 nov. 2031 » dans les causes. La bulle « achats ≥ 2,40, 13.12 » dans Prévisions.
- Ma mesure de texte signale « mm » qui déborde dans Dimensions (Comparer). À l'œil, rien (A-comparer-2).

## Table (captures 390 ouvertes)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| A-carnet, A-comparer-0/2/3, A-F1-0 | clair | 390 | son carnet, Comparer, fiche | 3 (n° 1, 4, 6) | 0 |
| P-a1 (A-F2-0, A-F1-1, B-comparer-branchement, SH1-houblons) | clair | 390 | ses fiches, Branchement, stock | 1 (n° 6) | 0 |
| P-a2 (SH2-fiche, K3-frigo-prix, R-frigorifique, A-articles-0) | clair | 390 | stock, rejeu C46, recherche, Articles | 1 (n° 1) | 0 |
| XA-offre (×3) | clair | 390 | Offre de son carnet | 1 (n° 6) | 0 |
| C5-avant-entree, C5-fin | clair | 390 | phrase qui nomme son carnet | 0 | 0 |
| P-c1 (C6-t1_5, C6-fin, C4-fin, C1-fin) | clair | 390 | création, échec simulé | 1 (n° 2) | 1 |
| XJ-titre (×3) | clair | 390 | titre « 20 mm » | 1 (n° 2) | 1 |
| P-ez (EZ0 à EZ3) | clair | 390 | carnets ZZ après l'échec | 2 (n° 2, 3) | 1 |
| P-m1 (M-comparer-0/1, M-F1-0, M-F2-0) | clair | 390 | marmite ZZ | 3 (n° 2, 4, 5) | 1 |
| P-z1 (Z-comparer-0, Z-F1-0, H-F1-1, M-comparer-4) | clair | 390 | cellule, Citra, compromis marmite | 2 (n° 4, 6) | 0 |
| P-k1 (VC4-pendant, VC4-fin, VC4-lache, P30-pendant) | clair | 390 | cadre et barre tenus au bord | 0 | 0 |
| P-r1 (F0-haut, B1-achats, S50, D1-causes) | clair | 390 | en-tête, achats, causes | 0 | 0 |
| P-r2 (L1-liste, V2-previsions, C-A, AN1-caisse) | clair | 390 | Liste, Prévisions, Caisse | 0 | 0 |

LEÇON PROPOSÉE : un script qui retrouve un titre par son texte exact casse dès que l'app y met des espaces insécables (`nav.mjs`, tour 58 : 4 lectures de lien perdues, sans coût). Il faut comparer les textes avec les espaces normalisés (`/[\s  ]+/`). Il faut aussi juger un correctif « insécable » sur un nombre à plusieurs chiffres (« 20 mm », « 50 L »), pas seulement sur « 4 °C ».
