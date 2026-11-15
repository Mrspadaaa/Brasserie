OK — Impôt bière de l'année : six mini maquettes i1a–i1f dans la langue de p2b ; PAGE, 1280, MOTS, PANEL, COMMUN OK

## Fichiers écrits (tous dans `work/missions/2026-11-09-compta-prix/p5/`)
- `i1a/` à `i1f/` : `etat.html` (statique, classes préfixées, sans script), `NOTE.md`, `<id>-haut.png`, `<id>-page.png` (premier écran + annexe), `<id>-1280.png`.
- `i1a/capturer-1280.mjs` (copie du script de p4/p5a, ids i1*).
- `p5/RESULTAT-i.md`. Rien d'autre : les fichiers modifiés du worktree hors `p5/` (`src/dev/financeDemo.ts`, `src/services/incomeEntry.ts`, `src/ui/finance/annuel*`, `MISSION.md`, `SPEC-BRASSEUR.md`) ne sont pas de cette voie.

## Les six, et la question de chacune
| Id | Chaleur | Idée | Répond d'abord à |
|---|---|---|---|
| i1a le total et la liste | froide | le total découpé sur une barre aux trois bandes ; chaque brassin avec sa pastille de bande ; annexe : **la feuille p2b telle quelle**, ouverte depuis l'année | combien (la baseline enrichie) |
| i1b mes bières sur la règle | tiède | la règle de p2b porte l'année : une épingle par brassin à son °P ; trois cartes de bande ; la somme | combien, et pourquoi (quelles bières coûtent) |
| i1c sorti de cave, ou dedans | tiède | deux colonnes : dû (sorti, 230,41) / attend (en cave, 25,59 – 30,08) ; mini barres par brassin ; annexe : les sorties d'un brassin | combien maintenant, combien attend (la loi : sortie de cave) |
| i1d le chemin jusqu'au paiement | chaude | frise des mois, perles de bande, cumul, « aujourd'hui », arrivée 20 / 30 janv. 2027 ; annexe : régime trimestriel, T3 en retard | quand |
| i1e ma déclaration, déjà remplie | chaude | le formulaire Taxas pré-rempli : hl × taux par bande, hachures, réduction, total, tampon ; annexe : réduction 40 % confirmée | à qui, et quoi copier |
| i1f la cuve de l'année | chaude | jauge 1 200 L remplie par couches de bande ; le vide « à brasser » et son impôt ; annexe : trois bandes possibles pour la prochaine bière | combien jusqu'ici, combien en fin d'année |

Tous : Clients › Impôt bière, année en pilule, primaire « Copier pour Taxas » (bleu finances, la troisième teinte demandée par COULEURS), liens Taxas / Directives, réduction petit brasseur « à confirmer », densité manquante en hachures et fourchette (4,49 – 8,98, jamais 0), lien vers la feuille p2b de chaque brassin (›, bulle ou feuille selon le concept).

## Données (une seule fois, partagées par les six)
Fixture : Pale Ale de septembre, 26,6 L conditionnés (les 26,6 L de p2b ; l'impôt 6,74 à 12 °P), densité absente → 4,49 – 8,98 ; production annuelle 1 200 L ; clients Café du Bourg, Martin Rey.
Exemple (marqué « janv. – août : exemple » sur chaque premier écran) : Blonde de janvier 11,4 °P · 200 L → 50,64 ; IPA de mars 15,2 °P · 180 L → 60,77 ; Saison de mai 12,8 °P · 200 L → 50,64 ; Blanche de juin 11,0 °P · 220 L → 55,70 ; Lager d'août 9,6 °P · 200 L → 33,76. Sommes : 1 026,6 L ; connu 251,51 ; année **256,00 – 260,49 CHF** taux plein ; par bande légère 2,00 hl → 33,76 · normale 6,20 hl → 156,98 · forte 1,80 hl → 60,77 ; sortis 890 L → 230,41 ; en cave 136,6 L → 25,59 – 30,08 ; réduction 40 % (annexe i1e) → 153,60 – 156,29. Barème `BAREME_IMPOT_BIERE` (16,88 / 25,32 / 33,76, bornes 10 et 14,0 °P) ; échéances 20 j / 30 j après la période (d1), « si régime annuel ».

## Sorties décisives
- `verifier-page.mjs … --min-images 0` × 6 : **PAGE OK** (390 px, sans erreur, sans défilement horizontal).
- `i1a/capturer-1280.mjs i1a … i1f` : **CAPTURES 1280 OK** (débord 0).
- `mots-premier-ecran.mjs p5 i1a–i1f --page=etat.html --profil=sans-houblons --sans-donnees --sans-coquille --sans-lignes --max=60` : i1a 58 · i1b 54 · i1c 59 · i1d 56 · i1e 60 · i1f 48 → **MOTS OK**. Les lignes de brassins (nom, °P, litres, montant) sont marquées `data-mots="lignes"` (D238 : « je vois le maximum d'items ») ; sans cette exclusion ni celle des données : 114 à 145 mots, dont 60 à 80 sont des noms de bières, des litres et des montants.
- `controle-panel.mjs` (6 `-haut.png`) : remplissage médian 0,57, 0 sous 0,50, ressemblance 0,86, 0 paire ≥ 0,95 → **PANEL OK**.
- `controle-commun.mjs p5 i1a–i1f --page=etat.html --profil=sans-houblons --sans=mots` : couleurs, survol, blocs, contraste, standard, parlant, brutes **OK** (fiche, trait, légende sautés par le profil) → **COMMUN OK**. Corrigés en route : rayons à l'échelle DESIGN (3/4/8 → 10, pilule, rond) ; i1b, épingles qui traversaient les étiquettes (1:1) → fond blanc, épingles derrière ; i1d, textes gris sur la carte rouge → blancs ; i1f, « 900 » et sous-libellés lus au pixel du glyphe → gris foncé ; textes de 11 px → 12 px partout (interdit du brief).
- `controle-virgule.mjs` : ÉCHEC sur 10 écritures dans `src/` (hors voie, non touchées) ; les maquettes n'ont que des virgules et des espaces fines.
- `controle-choix.mjs` non lancé : « Impôt bière de l'année » n'a pas d'entrée dans `ecrans.json` ; la feuille d'un brassin (p2b) est reprise telle quelle dans l'annexe de i1a (seul écart : le fil « ‹ Impôt bière 2026 » et l'onglet Clients actif, puisqu'elle s'ouvre depuis l'année).

## Captures ouvertes (L12)
Les six `-haut.png` après chaque passe, `i1a-1280.png` ; jugées en 3 s : la réponse lue d'abord (i1a, i1c, i1e, i1f), la représentation d'abord (i1b, i1d). Trois défauts vus et refaits : étiquettes en collision (i1b), colonne droite qui débordait (i1f), bouton bleu dans la reproduction de p2b (remis en noir).

## Prédiction
Il dira « ça top » de i1e (le formulaire qu'il connaît, déjà rempli) ou de i1b (sa règle, avec ses bières dessus), demandera « d'autres variantes » de i1c ou i1f, et trouvera i1a « correct mais c'est l'écran d'aujourd'hui ».

DÉCISION À PRENDRE : (1) les brassins d'exemple (janvier à août) n'existent pas dans `financeDemo.ts` ; au port, soit la fixture en reçoit cinq, soit l'écran se montre avec la seule Pale Ale (une ligne, et la cuve presque vide). (2) i1c suppose une saisie des sorties de cave par brassin (`litresSortis` existe déjà dans `estimateSwissBeerTax`) : à relier à la caisse v3a (une vente = une sortie) si i1c est retenue.

CONNAISSANCE : un écran d'année à six lignes de brassins dépasse toujours 60 mots si les noms, litres et montants comptent ; le marquage `data-mots="lignes"` (D238) ramène le compte aux mots qui expliquent (46 à 60 ici) ; à écrire dans le brief des écrans à listes.

LEÇON PROPOSÉE : un remplacement « en bloc » appliqué à deux cadres jumeaux (premier écran + annexe) a laissé le premier cadre désynchronisé quand une retouche antérieure n'avait touché qu'un des deux ; le compteur de mots a validé un cadre périmé (60) avant que la capture ne le révèle. Faire : après toute retouche groupée, `grep -c` de la chaîne nouvelle = nombre de cadres, puis ouvrir la capture avant de lire les contrôles.
