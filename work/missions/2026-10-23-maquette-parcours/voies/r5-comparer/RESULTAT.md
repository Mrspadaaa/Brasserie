OK — Comparer r6a avec dock r6n2, carte « + », critère, biotransformation et plans x3b : 18/18 états

## Fichiers écrits (Possède)
- `prototypes/houblons-v4/parcours/src/ecrans/comparer/index.tsx` (écran : critère, pont, dock, feuilles, data-etat)
- `prototypes/houblons-v4/parcours/src/ecrans/comparer/Feuilles.tsx` (neuf : feuille basse au-dessus du dock ; Défi, Égaler, Valeurs, Preuve, Frise, Souche, « + », « pourquoi ? », biotransformation, plans)
- `prototypes/houblons-v4/parcours/src/ecrans/comparer/icones.tsx` (neuf : icônes sorties d'index.tsx, icônes du dock de r6n2)
- `prototypes/houblons-v4/parcours/src/ecrans/comparer/calcul.ts` (critère, Défi, tirage, en actif, jour après jour, souche, biotransformation : tout par le moteur)
- `prototypes/houblons-v4/parcours/src/ecrans/comparer/Etapes.tsx` (PiedEtapes : cuve, référence, Biotransformation, Enchaîner)
- `prototypes/houblons-v4/parcours/src/ecrans/comparer/Radar.tsx` (rayon 96 → 80, comme r6n2 : « Le radar perd 22 px »)
- `prototypes/houblons-v4/parcours/src/ecrans/comparer/comparer.css`, `jeu.mjs` (geste « Fermer Égaler »), `NOTE.md` (lignes Reprise)
- `prototypes/houblons-v4/maquettes/parcours-comparer/**` (construction et `captures-r5/`)

## États rendus (data-etat posé sur le déclencheur ; capture après, à côté de capture_choisie)
Captures : `prototypes/houblons-v4/maquettes/parcours-comparer/captures-r5/<id>.png` ; choisies : `work/refonte-frontend/v4/choix/etats/captures/<id>-choisie.png` ; 5345f6ad : `…/<id>-5345f6ad.png`.
- etat-comp-repos (present, gardé) — `captures-r5/etat-comp-repos.png` ; 80 mots au premier écran (r6a 74, r6n2 79, seuil 80)
- etat-comp-absolu (present) — `captures-r5/etat-comp-absolu.png`
- etat-comp-retenir (present) — `captures-r5/etat-comp-retenir.png` ; le Défi suit (1/4 pour Cascade)
- etat-comp-colonne-plus (different → rendu) — `captures-r5/etat-comp-colonne-plus.png` : feuille « Ajouter un houblon », une carte par houblon du stock (α, rôle, familles, part et mots hors des 12 familles, « + Ajouter X à la comparaison »)
- etat-comp-chimie (present, déclencheur = « Valeurs » du dock) — `captures-r5/etat-comp-chimie.png` ; en tête « X en a plus | Y en a plus » ⇄ (v1), en pied « Ce que disent les fiches » (p06)
- etat-comp-egaler (present, « Égaler » du dock) — `captures-r5/etat-comp-egaler.png` ; + « la même amertume en ébullition » (r6n2)
- etat-comp-osu (present) — `captures-r5/etat-comp-osu.png` : rappel du panel dans Valeurs, courbe dans Preuve
- etat-comp-placer (present) — pont « Placer Idaho 7 › » monté sur la ligne du critère (r6n2), title « Doser Idaho 7 dans Dryhopper »
- etat-comp-fiche (present) — appui long sur le nom de Cascade
- etat-comp-legende (present) — `captures-r5/etat-comp-legende.png` : forme de r6a (« Les familles », « hachuré : inconnu, jamais zéro ») + dock
- etat-comp-etapes (present ; relevé x3b) — `captures-r5/etat-comp-etapes.png` : « Enchaîner, comme x3b »
- etat-comp-etat-moment, etat-comp-reference (present) — `captures-r5/etat-comp-etat-moment.png`
- etat-comp-defi (absent → rendu) — `captures-r5/etat-comp-defi.png` : « Ton défi », score n sur 4, pistes à ronds lettrés, amertume tenue, dans ta 16D, pont Suggérer
- etat-comp-critere (absent → rendu) — `captures-r5/etat-comp-critere.png` : floral, agrumes, tropicaux, moins résineux
- etat-comp-preuve (absent → rendu) — `captures-r5/etat-comp-preuve.png` : panel OSU + 20 bières tirées, « 20 autres »
- etat-comp-frise-levure (absent → rendu) — `captures-r5/etat-comp-frise-levure.png` : frise, en actif, jour après jour (mêmes nombres que r6n2 : ~−0,5/−0,4… ; 1 j ~24,1 → 2 à 7 j ~24,5)
- etat-comp-biotransfo (absent → rendu) — `captures-r5/etat-comp-biotransfo.png` : « La biotransformation de ce plan » (simulerCas, US-05, actif)
- Souche (acquis r6n2-dock, sans état propre) — `captures-r5/souche.png` : mêmes nombres que r6n2 (Idaho 7 agrumes ~+1,3)
- « pourquoi ? » (r6n2) — `captures-r5/pourquoi.png`
- etat-comp-croix : voulu D109, non rejoué, intact.

## Sorties décisives (rejouées depuis la racine)
Voir la fin de ce fichier (« Critères »).

## Décisions
- DÉCISION : l'ordre des colonnes reste celui de la question (premier écran de r6a) ; le critère de r6n2 déplace le ★, la réponse, le mis en avant et le Défi, sans reclasser les colonnes.
- DÉCISION : les feuilles du dock sont une feuille basse propre à Comparer, au-dessus du dock qui reste touchable (r6n2), pas le Sheet de l'app (vaul couvre le dock).
- DÉCISION : le panel OSU vit dans Preuve (r6n2) ; D114 tenu par une ligne discrète « Panel OSU, Cascade : la courbe mesurée, dans Preuve › » sous le tableau (12 px, hors du premier écran) et un rappel dans Valeurs. COMPARER-ETAPES OK (D114 et D107).
- DÉCISION : radar à rayon 80 (r6n2 : 84) pour que 60′ / 10′ / dry hop et la référence tiennent au repos au-dessus du dock (D107).
- DÉCISION : la biotransformation et « Enchaîner » sont sous les rangées au dry hop (pas sous la rangée dry hop des étapes) : au-dessus, ils passaient le premier écran à 94 mots.
- DÉCISION : « Enchaîner » montre les plans avec tes houblons comparés ET les trois plans de x3b (Citra cryo du stock, 2 g/L, actif), tous calculés par le moteur ; c'est la lecture la plus proche de sa capture (relevé etat-comp-etapes).
- Rien pris à Dryhopper ni Levure hors ce que r6n2 et x3b montraient (Frise, Souche, plans, biotransformation) ; ponts vers eux.
- Aucun retrait par DEFAUTS-COURT : les « visée » du Défi (r6n2, 22–23.10) sont postérieures à D91 (q2b, 19.10).
- Les 6 éléments « écartés » de la NOTE (pastille critère, jauge d'amertume, défi, tirage, piste commune w2, deux objectifs s5) sont repris (5) ou en pont (s5).

DÉCISION À PRENDRE : Nelson Sauvin montre 83 % de mots hors des 12 familles (moteur) contre 67 % dans r6n2 (« Descripteurs A » : « groseille à maquereau » rangée dans Petits fruits). Le moteur n'applique pas l'option A ; à régler à la source (lexique des familles, hors de mon Possède).

Prédiction : « Là oui, c'est r6a avec ce que j'avais aimé de r6n2 » ; risque : densité des feuilles Défi et Valeurs.

CONNAISSANCE : le compteur de mots du premier écran compte aussi ce qui passe sous le dock fixe (tout texte dont le haut est < 844 px), et `{a}/{b}` en JSX fait deux mots ; une ligne ajoutée en tête pousse les étapes sous le cadre défilant (controle-comparer-etapes exige leur centre dans `main`).
LEÇON PROPOSÉE : aucune

## Critères
- G1 construire.mjs --sortie=…/parcours-comparer → `CONSTRUIT OK (9 pages)`
- G2 controle-etats.mjs … --ecran=comparer → `ETATS OK (18/18) ; 1 voulu(s) non rejoué(s)` (avant : ECHEC 18/18 sans data-etat ; avec --repli 16/18)
- G3 controle-choix.mjs … --ecran=comparer → `CHOIX OK (1 écran(s) conforme(s) à son choix ; 0 ouvert(s))` (REPRISE et COMPARER-ETAPES compris, D107 et D114)
- G4 controle-commun.mjs … comparer --page=etat.html --sans=mots → `COMMUN OK`
- G5 controle-teinte.mjs … → `TEINTE OK 6/6`
- G6 verifier-types.mjs → `TYPES OK`
- G7 systeme.mjs note … → voir ci-dessous
- Hors GATES : jouer-parcours.mjs --etape=comparer --dossier=…/parcours-comparer → `ETAPE OK (comparer)` ; mots du premier écran : 80.
- G7 systeme.mjs note … --contient "data-etat,capture,choisie,5345f6ad" → `NOTE OK`
