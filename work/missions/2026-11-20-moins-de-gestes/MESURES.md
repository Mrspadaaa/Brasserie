# Mesures « moins de gestes » (20.11, Sonnet) — 8 parcours

Périmètre : app du worktree `port-carnet` (HEAD 5ca0f6e13, modifs non commitées d'une autre session laissées intactes), Vite de dev, `http://localhost:3027/?dev-local`, 390 × 844 tactile, Chrome réel. Aucun fichier source modifié. Données : le `seedData.ts` de ce worktree est le gabarit vide (11 enregistrements) ; pour avoir recettes, stock, fûts, clients, un config Vite hors dépôt (`%TEMP%/mesures-gestes/vite.mesures.config.mjs`) redirige l'import vers le seed du dépôt principal (158 enregistrements, mémoire seule, réseau externe coupé). Pas de Gemini, aucune écriture en ligne. Serveur arrêté. Captures et traces : `C:/Users/mrspa/AppData/Local/Temp/mesures-gestes/` (p1full.out, pall.out, pq.out, NOTES-P1.txt ; captures p1j-galaxy.png, p1i-cit.png, p1-malts.png lues).

Comptage : touchers = clics de confiance (listener `click` capture) ; saisie = un champ modifié (pas de comptage par lettre). Le compteur de saisie a double-compté le champ kg et manqué le filtre de style (combobox sans événement `input`) : les chiffres ci-dessous sont corrigés à la main. Le banc attendait « réseau calme » (30 s) : les lenteurs de chargement mesurées sont un artefact du banc, non une mesure de l'app.

## P1 Créer une recette d'IPA depuis zéro (mesuré jusqu'à la levure ; la suite lue, non jouée)

| Sous-étape | Touchers | Saisies | Écrans | Confirmations | Bloquant | Fichier |
|---|---|---|---|---|---|---|
| Ouvrir + identité (menu +, Recette, nom, style, choix dans la liste, Suivant) | 6 | 2 (nom, style) | 2 (feuille +, assistant) | 0 | non | src/pages/BrewWizard.tsx l.2649 |
| Malts, par malt (puce du stock + kg) | 2 | 1 | 1 | 0 | non ; la puce ajoute à 0 kg | BrewWizard.tsx |
| Malts, ligne tapée « Munich 0,5 kg » + Entrée | 1 | 1 | 1 | « Créer … (stock à zéro) » : article neuf | non ; hors stock | idem |
| Houblons : Suivant + ouvrir « Ajouter un houblon » | 2 | 0 | 1 | 0 | non | BrewWizard.tsx l.3079 |
| Houblons, par houblon (moment, filtre, article, dose, α) | 5 | 2 (dose, α) | 1 | 0 | non ; α vide | BrewWizard.tsx l.1528 `addHop` |
| 3 houblons (ébullition, whirlpool, à cru) | 15 (13 mesurés + 2 estimés) | 6 | 1 | 0 | non | idem |
| Levure : Suivant, chercher « US-05 », choisir | 3 (2 mesurés, choix estimé) | 1 | 1 | 0 | non | BrewWizard.tsx |
| Paliers : Suivant (défauts 67 °C 60′ ; fermentation 19 °C 10 j, maturation 4 °C 5 j) | 1 | 0 | 1 | 0 | non | idem |
| Eau et sels : Suivant (eau 39,7 L, sels 0 g, acide 4,8 + 3,0 mL calculés) | 1 | 0 | 1 | 0 | non | idem |
| Récap : Enregistrer la recette | 1 | 0 | 1 | « Enregistrable · 1 repère » | non | idem |
| **Total** | **≈ 34** (25 mesurés) | **≈ 11** | 7 étapes | 1 | non | |

Vérifié : OG 1,040 avec 5,5 kg (6 kg : 1,044 ; IBU 28 après Galaxy 20 g) ; le style American IPA affiche 1,056–1,070 et 40–70 IBU en repère.

## P2 à P8 (mesurés au banc le 20.11, seed du dépôt principal, 390 × 844, thème clair)

Correction du banc : le premier essai avait un bug de sélecteur (`replace(/s+/g," ")` sans barre inverse : « Brassins » devenait « Bra in »), d'où les « boutons introuvables » de P2 et P4 à P7. Corrigé, attente par sélecteur. Captures : `app/p2-….png` à `app/p8-….png`. Le seed n'a aucun brassin terminé ni bière conditionnée ni fût plein : P2 « Rebrasser », P6 et P7 (rempli, livré, revenu) ne se jouent pas jusqu'au bout.

### P2 Rebrasser (refaire un brassin d'une recette déjà brassée)

Aucun bouton « Rebrasser » dans le seed : il n'existe que sur une carte de brassin **terminé** avec recette figée (`src/ui/production/liste/CarteBrassin.tsx` l.45 `peutRebrasser`, `src/domain/brassin/rebrasser.ts`) ; le seed n'en a pas. Chemin mesuré : Brassins → Recettes → fiche → « Brasser quand même » (recette « à vérifier »).

| Étape | Touchers | Saisies | Écrans | Confirmations | Bloquant | Fichier |
|---|---|---|---|---|---|---|
| Brassins → Recettes → fiche « Milk Stout v1 » → « Brasser quand même » (mesuré) | 4 | 0 | 3 (liste, fiche, feuille « Brasser ») | 0 | non ; 8 lignes « non relié » | `ui/production/recettes/CarnetRecettes.tsx` l.231 |
| Feuille « Brasser Milk Stout · v1 » : jour de cuve, puis « Créer à 27 L » / « Garder 30 L et régler après » / « Adapter à mon matériel » | 2, **compté au code** | 0 | 1 | 0 | non ; la cuve tient 27 L, la recette veut 30 L | `components/QuickActionModal.tsx` l.1279 |
| Variante : + → « Brassin, sera LOT-003 » → liste de recettes → Brasser | 2 + 1 par recette, **compté au code** (la liste ne s'est pas ouverte en 30 s au banc) | 0 | 2 | 0 | non | `QuickActionModal.tsx` l.1269 |
| Brassin terminé : « ↻ Rebrasser » sur la carte, puis la date | 2, **compté au code** (brassin créé sans date) | 0 | 1 | 0 | non | `CarteBrassin.tsx` l.77 |
| **Total** | **≈ 6** (4 mesurés) ; **2** via la carte sur un brassin terminé | 0 | 3 | 0 | non | |

### P3 Saisir une facture

| Chemin | Touchers | Saisies | Écrans | Confirmations | Bloquant | Fichier |
|---|---|---|---|---|---|---|
| Sans justificatif : + → Facture → « Saisir sans justificatif » → total → « Enregistrer la dépense » (mesuré ; retour à l'accueil) | 4 | 1 (total TTC) ; 3 avec description et fournisseur | 2 | 0 | non ; **ni quantité ni prix unitaire** : un « Total TTC » et « Pour quoi ? » | `QuickActionModal.tsx` (quick-expense) |
| Avec article rangé : « Stock ligne 1 » → « Ajouter à un article existant » / « Nouvel article » → article → « Quantité reçue » | +3 à 4, **compté au code** | +1 | 0 | 0 | non | `QuickActionModal.tsx` l.1214 |
| Photo : + → Facture → « Photographier le ticket » (ou PDF) → dépôt → lecture IA → relecture | 3 jusqu'au dépôt ; **appel IA après le dépôt, non joué** (pas de Gemini) | 0 | 3 | relecture des champs | non | `QuickActionModal.tsx` (scan, matching) |
| **Total sans justificatif** | **4** | 1 à 3 | 2 | 0 | non | |

### P4 Ranger un achat

Même formulaire que P3 : « Stock ligne 1 » offre « Aucun mouvement de stock », « Ajouter à un article existant », « Nouvel article » (mesuré). Pas d'action « Ranger un achat » sur l'écran Stocks (atteint en 1 toucher : malts 8, houblons 9, levures 4).

| Étape | Touchers | Saisies | Écrans | Confirmations | Bloquant | Fichier |
|---|---|---|---|---|---|---|
| Dans le formulaire : ouvrir « Stock ligne 1 », choisir l'option, choisir l'article, saisir la quantité reçue | ≈ 4, **compté au code** (le total est déjà saisi) | 1 | 0 | 0 | non | `QuickActionModal.tsx` l.1214 |
| **Total** | **≈ 4**, ou 4 + 4 de P3 si la dépense n'existe pas ; Stocks : 1 (mesuré) | 1 | 1 | 0 | non | |

### P5 Conduire un brassin (compagnon, LOT-002)

| Étape | Touchers | Saisies | Écrans | Confirmations | Bloquant | Fichier |
|---|---|---|---|---|---|---|
| Brassins → « Brasser · LOT-002 » (compagnon plein écran, mesuré) | 2 | 0 | 2 | 0 | non ; « Date dépassée · Changer la date » (prévu le 01.06.2026) | `pages/BrewDayPage.tsx` |
| « Commencer aujourd'hui » | 1 | 0 | 0 | 0 | non | idem |
| Passer un palier : « Terminer et continuer » (barre du bas) | 1 | 0 | 0 | 0 | non ; palier suivant non rejoué | idem |
| Relevé « Eau d'empâtage » : pouce du curseur (pose 55,0) puis « Enregistrer » ; ou « Mesurer » → feuille (pH, Temp., Volume, ±0,1) | 2 (+1 via « Mesurer ») | 0 (curseur) | 0 à 1 | 0 | non | idem |
| Densité (OG, « Densité à la coupure ») : même feuille, étape concernée | ≈ 3, **compté au code** (étapes plus tardives) | 0 à 1 | 1 | 0 | non ; « ? » tant que non posée | idem |
| **Total jusqu'au 1er relevé** | **≈ 6** (5 mesurés) ; densité : + ≈ 3 au code | 0 à 1 | 2 | 0 | non | |

### P6 Vendre

| Étape | Touchers | Saisies | Écrans | Confirmations | Bloquant | Fichier |
|---|---|---|---|---|---|---|
| + → Vente → client « Cave à Bières Morat » (mesuré) | 3 | 0 | 2 | 0 | **oui dans le seed : « aucune bière conditionnée »** ; « 75 cl · tarif à corriger », « fût 20 L · capacité supposée », « prix ? » | `ui/vente/Caisse.tsx` |
| + bière, quantité, prix si « prix ? », moyen (« ✓ Payé ici » / « Facture QR »), « Encaisser » / « Facturer » | ≈ 5 à 7, **compté au code** | 0 à 2 | 0 | 0 | « Encaisser » grisé tant que le moyen manque | `Caisse.tsx` l.403 à 428 |
| **Total** | **≈ 9** (3 mesurés) ; QR : + « + adresse » et « + IBAN » | | | | | |

### P7 Marquer un fût

Stocks → Fûts : 4 fûts « À laver ». Fiche F-001 mesurée : « Retirer du parc · Annuler · Marquer propre ».

| Geste | Touchers | Saisies | Écrans | Confirmations | Bloquant | Fichier |
|---|---|---|---|---|---|---|
| Propre : Stocks → Fûts → fiche → « Marquer propre » (« Tout marquer propre » : 3 aussi, pour les 4) | 3 (mesuré) | 0 | 2 | 0 | non | `ui/KegFiche.tsx` l.84 ; `ui/KegBoard.tsx` l.229 |
| Rempli : « Remplir depuis un lot », lot, volume | ≈ 4, **compté au code** | 0 à 1 | 1 | 0 | oui (aucun lot conditionné) | `KegBoard.tsx` |
| Livré : fiche d'un fût plein, « Livré », client | ≈ 4, **compté au code** | 0 | 1 | 0 | oui (aucun fût plein) | `KegFiche.tsx` |
| Revenu : fiche d'un fût livré, « Revenu plein » / « Retour vide » | ≈ 3, **compté au code** | 0 | 1 | 0 | oui (aucun fût dehors) | `KegFiche.tsx` l.89 |

### P8 Planifier (Calendrier)

| Étape | Touchers | Saisies | Écrans | Confirmations | Bloquant | Fichier |
|---|---|---|---|---|---|---|
| Calendrier (1 toucher) : « NEIPA Test · pas brassée · prévu 20 nov. » déjà visible | 1 | 0 | 1 | 0 | non ; bandeau « Solde de départ inconnu » | `src/App.tsx` (onglet Calendrier) |
| Tâche : « Ajouter dans Travaux » → feuille (semaine S47 · 20 nov., jours actifs 1 j à 10 j, Nom, Montant) → Nom → « Ajouter en S47 » | 3 (2 mesurés + « Ajouter en S47 » comptés : l'enregistrement n'a pas été vérifié, champ Nom non atteint par le sélecteur) | 1 | 2 | 0 | non | idem |
| Brassin : `onPoserBrassin` → feuille « Brasser » | ≈ 4, **compté au code** (`src/App.tsx` l.1310) | 0 | 2 | 0 | non | idem |
| **Total** | **3** (tâche) ; ≈ 4 (brassin) | 1 | 2 | 0 | non | |

## Ce que l'app sait déjà et redemande

| Cas | Preuve |
|---|---|
| α du houblon : nommé dans l'article (« Houblon Galaxy 17.2% »), mais le champ α de la ligne reste vide et ambré ; à retaper pour chaque houblon | capture p1j-galaxy.png ; BrewWizard.tsx l.1535 `alpha: item?.alphaPct ?? 0` : le seed n'a pas de `alphaPct`, seulement l'α dans le nom (à vérifier sur les vraies données) |
| Poids de malt : le style donne OG 1,056–1,070 et le volume est 30 L, mais le poids part de 0 kg et l'OG 1,040 s'affiche sans proposer l'écart | texte « style 1,056–1,070 · ~1,040 » ; puce du stock : « 0 kg » |
| Dose de houblon : 0 g à chaque ajout ; ni répartition d'IBU vers 40–70 ni dose par défaut | « Ébullition · 1 ajout 0 g · 0 g/L » ; `weightG: 0` l.1541 |
| Moment : à chaque houblon il faut retoucher la puce (moment) ; minutes déjà proposées : ébullition 60, whirlpool 20 min à 80 °C, à cru jour 3 | champs `num_wz-hop-time-0=60`, `-time-1=20`, `-temp-1=80`, `-day-2=3` |
| Levure : le stock (« Safale US-05 · 2 sachets ») n'est proposé qu'après une recherche tapée ; rien n'est suggéré d'après le style IPA | texte « Aucune levure dans la recette : cherche-la … ou prends-en une de ton stock » |
| Vente : « tarif à corriger » et « capacité supposée » : le prix et la capacité du fût manquent alors que le tarif existe en base | écran + → Vente, texte cité plus haut |
| Brassin : le numéro (LOT-003) et la recette sont connus ; la fiche demande néanmoins « Saisir une densité » en feuille + | menu + : « Saisir une densité · LOT-001 · J+203 » |
| Eau, sels, acide, paliers : déjà calculés ou par défaut (39,7 L ; 67 °C 60′) : rien à retaper | Récap |
| Brassin (P2) : la feuille « Brasser » connaît le matériel (« Ton matériel actuel tient 27 L », « Système 30L (Actuel) ») et la recette (30 L) et redemande un choix (« Créer à 27 L / Garder 30 L / Adapter ») | capture p2-feuille-brasser.png |
| Recette Milk Stout brassée 1 fois : 8 lignes « non relié » (Maris Otter, Target, Windsor…) alors que le stock a 8 malts, 9 houblons, 4 levures : à relier une à une | capture p2-recette-fiche.png |
| Compagnon (P5) : « Date dépassée » (prévu le 01.06.2026) mais « Commencer aujourd'hui » redemandé ; eau d'empâtage « ? °C », curseur à 55,0 alors que la recette vise 67 °C d'empâtage | p5-compagnon.png |
| Facture (P3) : fournisseur facultatif, catégorie « Brassage » et date « aujourd'hui, par défaut » proposés ; mais **un seul « Total TTC »**, aucune ligne quantité × prix | p3-saisie-sans-justificatif.png |
| Stock sur une ligne de dépense (P4) : « Aucun mouvement de stock » par défaut même si la description nomme un houblon du stock | select mesuré |
| Fût (P7) : « Date de retour non enregistrée », « Aucune étape enregistrée » ; 4 fûts « À laver » listés, « Tout marquer propre » les traite d'un coup | p7-fut-F001.png |
| Vente (P6) : client choisi mais « adresse du client ? », « IBAN ? », « prix ? » ; n° FAC-2026-0001 et date déjà posés | p6-vente.png |
| Calendrier (P8) : semaine du jour (S47) et 1 jour préchoisis ; « Solde de départ inconnu : à régler dans Finances › Solde » redemandé en bandeau | p8-calendrier-ajout.png |
Doute P1 : seed sans `alphaPct` possible (à vérifier sur les vraies données).

## Touchers par parcours : mesurés / comptés au code

| Parcours | Mesurés au banc | Comptés au code | Saisies | Écrans | Bloquant au banc |
|---|---|---|---|---|---|
| P1 Créer une recette d'IPA | 25 | ≈ 9 | ≈ 11 | 7 | non |
| P2 Rebrasser | 4 (recette → « Brasser quand même ») | 2 (jour, choix) ; carte « Rebrasser » : 2 | 0 | 3 | pas de brassin terminé dans le seed |
| P3 Facture sans justificatif | 4 | +3 à 4 pour ranger l'article | 1 à 3 | 2 | non ; ni quantité ni prix unitaire |
| P3 bis Facture photo | 3 jusqu'au dépôt | relecture IA non jouée | 0 | 3 | non |
| P4 Ranger un achat | 1 (Stocks) | ≈ 4 | 1 | 1 | non |
| P5 Conduire un brassin | 5 | ≈ 3 (une densité) | 0 à 1 | 2 | non |
| P6 Vendre | 3 | ≈ 6 | 0 à 2 | 2 | oui : aucune bière conditionnée |
| P7 Marquer un fût | 3 (propre) | ≈ 4, 4, 3 (rempli, livré, revenu) | 0 à 1 | 2 | oui pour rempli, livré, revenu |
| P8 Planifier | 2 + 1 compté (tâche) | ≈ 4 (brassin) | 1 | 2 | non |

MESURES OK 7/7 (P2 à P8 abordés ; P2, P6, P7 en partie comptés au code : le seed n'a ni brassin terminé, ni bière conditionnée, ni fût plein).

Doutes : seed du dépôt principal (158 enregistrements), pas les vraies données ; P8 : l'enregistrement de la tâche non vérifié ; la lenteur des feuilles (« Chargement… ») est celle de Vite en dev, non de l'app en ligne ; les saisies comptent un champ, non les lettres.
