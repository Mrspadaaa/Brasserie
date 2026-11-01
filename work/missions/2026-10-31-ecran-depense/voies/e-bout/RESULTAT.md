OK — 5 groupes sur 5 finis, 174 OK et 8 KO, tous sur doc14 (4 défauts de l'app, aucun du banc) ; ARRÊT : aucun

(Voie e-bout, mission 2026-10-31-ecran-depense. Aucun GATES.md n'existait : j'ai suivi les « Contrôles » de VOIE.md. Aucun appel Gemini, aucun commit, aucun déploiement. Aucune valeur de ses pièces dans le code ni ici : comptes, codes, oui/non.)

## Pourquoi le banc ne tournait plus (défauts du banc, corrigés et rejoués)
1. **Le vrai blocage n'était pas le sélecteur.** `zxing-wasm` et `pdfjs-dist` (package.json, `src/services/qrLecture.ts`) ne sont pas dans le `node_modules` partagé du poste : Vite répond 500 sur `QuickActionModal.tsx`, la feuille ne s'ouvre pas, d'où le délai sur `section[aria-label="Justificatif de la dépense"]` (capture `final4/A/390-99-arret-etats.png` = tableau de bord). Je n'ai pas touché au `node_modules` : `voies/e-bout/vite.banc.config.mjs` reprend la configuration du dépôt et alias ces deux paquets (mêmes versions exactes, installés dans `voies/e-bout/qr-deps/`, hors Git). Option `--vite-config` du banc ; sans elle et sans les paquets, le banc s'arrête au lancement avec le message qui l'explique. **À corriger côté poste : `npm ci` dans le dépôt principal.**
2. Le bouton principal du pied n'est plus le premier `footer button` (il y a maintenant « Catégorie / Papier » et le point courant) : `footer button[data-primary]` (confirmSheet, reçu, saveAndMeasure).
3. « Changer » vit dans le panneau du picto du justificatif (fermé au repos) : `scan()` touche d'abord le picto de l'en-tête.
4. `setStockLines` retrouvait les rangées par leur rang dans le DOM : les bandes réordonnent la liste, la décision d'une ligne tombait sur une autre (un malt relié à l'article levure, refus « Kg ne se convertit pas en sachet »). Maintenant par id `line-N`. C'était le KO de doc5.
5. `--memory-floor <Go>` (défaut 3, jamais sous 1,5) : la garde de 3 Go arrêtait 4 essais sur 4 (3 à 4 Go libres, autres sessions). `lancer.sh` passe 2,2 et attend 3,8 Go et les ports libres.
Aucun critère affaibli : les attentes de doc5, doc6, finances, etc. sont inchangées (`etats` 4/4, doc5 11, doc6 3 au premier rejeu de contrôle).

## Fichiers écrits
`scripts/check-invoice-journey-emulator.mjs` (`node --check` OK) ; `voies/e-bout/` : `vite.banc.config.mjs`, `lancer.sh`, `rejouer.sh`, `qr-deps/` (hors Git), `essai1` à `essai5` et leurs `.log` ; `voies/e-emulateur/final5/` ; `H13-reels/jus0/rejeu-k6.json` (copie du manifeste + doc14 : image, `banc-k6-AC/results.json` → `records[13].variants["Csv8+N"].result`, vérité `cas-5.json`).

## Cas ajoutés (nouveaux critères)
- **doc14** : (a) aucune suite de trois mots lue deux fois dans une rangée ni dans son champ (la lecture finale met la mouture dans le nom et laisse `variant` vide : la comparaison à la variante serait vide) ; (b) aucune pastille « Total » **et** l'enregistrement du total arrondi n'est pas bloqué ; (c) aucune pastille TVA (rond sur la tuile) ni indice TVA ; (d) 16 lignes dans les bandes, port seulement dans « dont port » et le total, jamais en stock ; (e) chaque ligne dans la bande de sa famille, jugé par le crochet `data-dp-bande` (levure 1, malts 7-9-11, sucre 8, houblon 10, matériel 2-5, emballage 12-14 ; 6, 15, 16 : jamais « autres » ; une famille = une bande, deux familles = deux bandes, les trois bandes actuelles gardent leur nom) : passera une fois les bandes posées ; (f) confirmer, mouvement par ligne de stock (quantité, unité, article), article à jour, catégorie de brasseur, port jamais en stock, journal, original rouvert (octets identiques), Excel et ZIP.
- **doublon** (D264a) : 25 écritures `B-…` semées depuis la lecture rejouée de doc5 (sans `finance`, libellé qui commence par la référence, même date, somme = total, retirées en fin de cas) puis doc5 ressaisi : avertissement « déjà enregistré », motif « écritures historiques », rien d'écrit avant le geste.

## Sorties (bilan.txt de `voies/e-emulateur/final5/`)
- A [etats, doublon, doc5, finances, doc6], 390 et 1280 : `exit 0 (50 OK, 0 KO, 0 ARRÊT)`.
- B [autre-numero, rattacher, minuscules, doc1] : `exit 0 (10 OK, 0 KO, 0 ARRÊT)`.
- C, D, E : **lancés par `rejouer.sh` en arrière-plan, pas finis quand je rends la main** (plafond de tours). Rien n'est affirmé sur doc4, hors-ligne, doc3, doc2, drive-fond aux nouveaux écrans : jamais joués par moi depuis le port. Au 390 seuls etats, doublon, doc5, finances, doc6, doc14 ont tourné (essai3, 4, 5, groupe A).
- D (doc14) a tourné seul au 390 avant mes deux derniers changements (essai5) : 16 OK, 3 KO (ci-dessous). Les deux derniers changements (unité de la ligne 11 en grammes, contrôle de catégorie des articles neufs) n'ont pas été rejoués.

## KO de doc14 : tous des défauts de l'app ou de la lecture, aucun du banc
1. **(b) enregistrement du total arrondi** : « Le détail des lignes doit correspondre exactement au total TTC » (lignes 1 centime au-dessus du total imprimé) refuse « Confirmer ». Cause : `src/services/purchaseEntry.ts:393`. D261b n'a levé que la pastille. Pour continuer, le banc joue les gestes d'un brasseur (date saisie, « À payer », total remis à la somme des lignes) et le dit (`doc14-total-corrige-a-la-main`).
2. **(c) pastille TVA** : un rond « 3 » sur la tuile TVA et l'indice « Valeur corrigée après relecture » sous la TVA. Le serveur n'est pas en jeu (le banc rejoue la lecture déjà rendue) : les deux signaux sont dans la lecture rejouée. Le rond vient du point `ht-tva-ttc` (pèse), posé sur un HT lu qui est en fait le sous-total TTC (la vérité attend HT absent) : `functions/src/invoiceControls.ts:196`, gardé tel quel par `src/domain/finance/invoicePoints.ts:71`. L'indice vient de `correctedFields` de la lecture (partie serveur de D262a, non rejouée). `lectures-divergentes` sur le bloc TVA ne pèse pas : D262a tient pour lui. Je n'ai pas fait l'essai contraire (HT retiré) pour prouver que `ht-tva-ttc` seul suffit. **Aucun des deux côtés ne la lève pour cette pièce.**
3. **(e) bandes** : 4 bandes seulement (`src/ui/depense/groupes.ts:5-8`) : sucre, matériel, emballage tombent dans « autres » (D262d, attendu, voie p3c-bandes). **En plus** : la ligne 11 (lue « grain », référence `MAG…`) tombe aussi dans « autres » au lieu de « malt » : sans correction elle restera hors de sa famille une fois les bandes posées. Cause probable (non essayée) : `src/services/stockLineMatching.ts:326`, le préfixe de référence ne reconnaît que `MA`.
Autres constats à l'image (capture ouverte `essai5/390-09-doc14-stocks.png`) : les articles neufs apparaissent dans des groupes « Yeast » et « Grain » (mot anglais de la lecture au lieu de Levure et Malt) : le nouveau contrôle de catégorie est écrit pour le montrer, pas encore rejoué ; cause non localisée. Dans la preuve (`essai3/390-18-doc14-repos.png`) « Somme = imprimé » et sa valeur « non vérifiée » se chevauchent à 390 (`Recap.tsx`, libellé et valeur en `whitespace-nowrap`) ; la valeur vient de `controls.sum` de la lecture rejouée (`ExpenseSheet.tsx:688`), donc l'ancien serveur : avec le serveur corrigé le texte serait court.

## Captures ouvertes en image
`final4/A/390-99-arret-etats.png` ; `essai1/390-01-etat-vide`, `390-03-etat-erreur-refus` ; `essai2/390-99-arret-doc5` ; `essai3/390-18-doc14-repos`, `390-19-doc14-lignes` ; `essai4/390-12-doc14-confirmation-refusee` ; `essai5/390-05-doc14-apres-confirmation` (« Achat enregistré », Finances au total), `390-09-doc14-stocks`. **Non ouvertes** : les captures de `final5/*` et du 1280.

## Essais
Vite : 3 (alias, exclusion de l'optimiseur) ; groupes : essai1 à essai5 (2 arrêtés par la garde mémoire). Aucune limite de trois essais dépassée par critère.

## git status --short (à moi)
` M scripts/check-invoice-journey-emulator.mjs` ; le reste des voies (`work/missions/…`, `H13-reels/jus0/rejeu-k6.json`) est ignoré par Git. Autres lignes (hooks, manifeste, GATES d'essai, décisions, DEFAUTS, SPEC, mesurer-loupe) : à d'autres voies, non touchées.

## MISE À JOUR : rejeu final5 terminé (bilan.txt, ligne FIN)
- A `exit 0 (50 OK, 0 KO, 0 ARRÊT)` ; B `exit 0 (10 OK)` ; C [doc4, hors-ligne, doc3, doc2] `exit 0 (14 OK)` ; E [drive-fond] `exit 0 (68 OK)` ; D [doc14] `exit 1 (32 OK, 8 KO, 0 ARRÊT)`. Aucun « ARRÊT » dans les console.log.
- Les 8 KO de D sont 4 constats aux deux largeurs : (b) refus d'enregistrer le total arrondi (purchaseEntry.ts:393), (c) pastille TVA, (e) bandes (D262d attendu, voie p3c-bandes ; ligne 11 en plus), (f) catégorie des articles neufs en « yeast » et « grain » (le contrôle ajouté à la fin est maintenant joué et rouge ; cause non localisée). Tous classés défauts de l'app ou de la lecture rejouée ; le (e) est écrit pour passer une fois les bandes posées (crochet data-dp-bande).
- Réserves : les captures de final5 et du 1280 ne sont toujours pas ouvertes (seules celles de essai1 à essai5 le sont) ; C et E ont tourné sans que j'aie lu leurs captures. Le pilote rejoue D après les bandes.
- Les mentions « incomplet », « C, D, E non joués » plus haut sont périmées : lire ce bilan.

DEMANDE EXECUTANT (déjà exécutée pour A à E ; reste D après les bandes) :
1. `cat work/missions/2026-10-31-ecran-depense/voies/e-emulateur/final5/bilan.txt` : si la ligne `FIN` est là, passer à 3 ; sinon attendre (le rejeu tourne : `rejouer.sh`, C, D, E), ou le relancer (`bash work/missions/2026-10-31-ecran-depense/voies/e-bout/rejouer.sh`, une seule instance : ports 9099 8080 5001 4400 4500 5175).
2. Pour D seul après les bandes : `bash …/e-bout/lancer.sh …/e-emulateur/final5/D doc14 390,1280`.
3. Sorties attendues : `exit 0` pour A, B ; C et E à lire (jamais joués) ; D : `(e)` OK seulement après p3c-bandes et correction de la ligne 11, `(b)`, `(c)` et la catégorie des articles neufs tant que l'app ne change pas.
4. Rendre au pilote : les lignes `KO` de chaque `console.log` ; ouvrir en image `D/390-*-doc14-repos`, `-lignes`, `-apres-confirmation`, `-stocks`, et `C/*`.

DÉCISION À PRENDRE : (1) installer `zxing-wasm` et `pdfjs-dist` dans le `node_modules` partagé (`npm ci` au dépôt principal) puis retirer `--vite-config` de `lancer.sh` ; (2) lever le refus d'enregistrer un total arrondi à 5 centimes (`purchaseEntry.ts:393`) : recommandé, la même règle que `sumCheck` ; (3) corriger la ligne 11 et la catégorie des articles neufs avant ou avec p3c-bandes.

CONNAISSANCE : le banc JUS-0 doit retrouver les rangées par id `line-N` et les bandes par `data-dp-bande`, jamais par rang du DOM ; une dépendance déclarée mais non installée fait échouer l'écran en 500 sans message dans l'interface.
LEÇON PROPOSÉE : un contrôle ne s'arrête pas au premier sélecteur en défaut : lire la console de Vite avant de réécrire les sélecteurs (ici 500 sur un module, pas un écran changé).
