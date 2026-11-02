# Série r — vue TVA (non assujetti), v0, dans la langue de l'app en ligne

Écrit variante par variante. Données fictives seulement (Malterie Fictive SA, Houblons du Jura Sàrl, Inox Demo GmbH, Droguerie
Démo SA, Matériel Exemple SA, Quincaillerie Démo, Levures Démo Sàrl, Marché Fictif ; ventes fictives). Les sept états par
`?etat=annee|inconnues|douteuse|etrangere|vide|si|horsligne`. Captures : `node tva/v0/r1/capturer.mjs <ids>` (7 états à 390
tactile, `annee` et `si` à 1280, gestes de `gestes.json`).

## r1 — froide : un troisième mode de Synthèse « Situation · Coûts · TVA », en chiffres
- **Idée** : « Récupérer la TVA : Non » d'abord (statut en chip de réglage), puis « au moins 171,83 CHF » avec « +4 inconnues »
  collé au total ; une rangée par taux (pastille verte 2,6 %, bleue 8,1 %, hachurée « ? ») qui filtre la liste des dépenses
  dessous ; année au pas ‹ 2026 › des Opérations ; « Si j'étais assujetti » replié : AFC et fiduciaire, aucun chiffre.
- **Contrôles** : CHOIX OK (0 conforme ; 0 ouvert — Finances hors `ecrans.json`, noté tel quel) ; COMMUN OK (après un STANDARD
  ECHEC S4 corrigé : trait d'icône rendu unique) ; MOTS 57 → OK ; CONTRASTE OK (pire 5,17:1) ; PAGE OK.
- **Captures ouvertes** : annee-390, inconnues-390, etrangere-390, si-390, vide-390, annee-1280, geste-douteuse-ouverte.
  Corrigé après regard : « Clients » mangé par le + (barre du bas recalée), comptes « 10 » sans unité (devenus « 10 dépenses »),
  inconnues 2025 trop discrètes (montant TTC « payés » sous la rangée, total ocre souligné quand l'inconnu dépasse la moitié).
- **Tient** : la réponse en trois secondes, la base reconnaissable, l'inconnu jamais à zéro. **Casse** : forme sage, peu de
  boosters visuels (aucune barre) ; à 1280 la colonne reste à 872 px, comme l'app.

## r2 — tiède : la carte de Synthèse qui s'ouvre, par trimestre, barre empilée par taux
- **Idée** : le sélecteur de période est un petit graphique (T1…T4 empilés par taux, l'inconnu en case hachurée chiffrée,
  et l'année) ; sous « au moins 44,62 CHF », la barre du TTC dépensé par taux, l'inconnu hachuré à sa vraie part ; « Si
  assujetti −85,76 CHF » = récupéré − facturé sur ses ventes, hypothèses au toucher ; la carte vit dans Synthèse.
- **Contrôles** : CHOIX OK (noté tel quel) ; COMMUN OK (après STANDARD S3, coins de 2 px, corrigé) ; MOTS 60 → OK ;
  CONTRASTE OK (5,63:1) ; PAGE OK.
- **Captures ouvertes** : annee-390, si-390, inconnues-390, annee-1280 (deux colonnes), geste-carte-synthese. Corrigé après
  regard : la carte cassée par des boutons imbriqués (barre statique dans la carte), pilule « Année » muette (devenue colonne),
  pluriel des hypothèses, colonne des comptes sans titre.
- **Tient** : 2025 se lit d'un coup d'œil (barre hachurée aux 4/5) ; le net fait voir qu'être assujetti lui coûterait. **Casse** :
  la barre en TTC (et non en TVA) demande la légende ; à 390 le net et la liste passent sous le pli.

## r3 — chaude : une section d'Annuel, brassin par brassin, une perle par dépense
- **Idée** : dans « Bilan et impôts », un bloc noir « Non remboursée » (statut, mène au réglage) à côté de « au moins 171,83 CHF » ;
  puis chaque brassin (#25 Pale Ale, #24 Stout…) avec sa pastille EBC, un collier de perles (une par facture : vert 2,6 %, bleu
  8,1 %, hachuré « ? », longueur = sa TVA), sa TVA et son prix au litre ; « Hors brassin » pour matériel et nettoyage ; en bas,
  la balance « récupérée / facturée », net −566,99 CHF en tête, hypothèses au toucher.
- **Contrôles** : CHOIX OK (noté tel quel) ; COMMUN OK ; MOTS 78 → ECHEC, puis 42 → OK (rangées de brassin marquées
  `data-mots="lignes"` comme les groupes à sous-total de la Dépense, D238 : écart dit dans la NOTE) ; CONTRASTE OK ; PAGE OK.
- **Captures ouvertes** : annee-390, inconnues-390, douteuse-390. Corrigé après regard : « Hors bras… » coupé (colonne élargie),
  montants des lignes déroulées rognés à droite (colonne `minmax(0,1fr)`), TVA douteuse soulignée en ocre.
- **Tient** : la vue la plus « brasseur » (CHF/L, brassins) ; 2025 saute aux yeux (colliers de « ? »). **Casse** : la
  longueur des perles n'a pas d'échelle écrite ; la balance passe sous le pli à 390 en 2025.

## r4 — chaude : la lentille TVA du journal, récap à renvois, frise des mois, pastille par dépense
- **Idée** : dans Opérations, un mode « Journal / TVA » ; en haut le récap bordé (‹ TVA 2026 ›, « au moins 171,83 CHF »,
  chips « 2,6 % 101,94 · 8,1 % 69,89 · ? 4 » qui filtrent, « Non remboursée › » vers le réglage, « Si assujetti ⌄ » : ventes
  9 860,00 / 100 000 CHF, AFC, fiduciaire — aucun chiffre de TVA) ; la frise des 12 mois empilée par taux choisit le mois ;
  le journal par mois porte sur chaque dépense sa pastille de taux et sa TVA.
- **Contrôles** : CHOIX OK (noté tel quel) ; COMMUN OK ; MOTS 44 → OK ; CONTRASTE OK (4,54:1) ; PAGE OK.
- **Captures ouvertes** : annee-390, si-390. Corrigé après regard : le sous-total de juin (que des inconnues) affichait 0,00 :
  devenu « — », et « ≥ » quand un mois mêle connu et inconnu.
- **Tient** : ses deux phrases exaucées (récap qui renvoie, pastilles sur les items) ; la frise dit « quand ». **Casse** : la
  place sort du cadrage (Opérations) ; lettres des mois serrées à 390.

## Pour toute la série
- Rejeu final des quatre (journal `tva/v0/r-controles.log`) : MOTS OK (57, 60, 42, 44) ; COMMUN OK ; CONTRASTE OK (pires 5,17 ;
  5,63 ; 5,63 ; 4,54) ; PAGE OK ×4 ; CHOIX OK ×4 (`0 écran(s) conforme(s) à son choix ; 0 ouvert(s)` : Finances n'a pas d'entrée
  dans `ecrans.json`, sortie notée telle quelle, pas un échec).
- controle-panel, indicatif (D244), sur les quatre `*-annee-390.png` : remplissage médian 0,58, 0 paire presque identique,
  ressemblance 0,91 ≥ 0,90 → `PANEL ECHEC` (DIVERSITÉ) : l'en-tête, les onglets et la barre du bas de l'app sont repris tels
  quels (règle n° 1) ; les quatre corps diffèrent (chiffres, barre + colonnes, perles par brassin, frise + journal), et les places
  aussi (Synthèse, carte de Synthèse, Annuel, Opérations). Non forcé.
- Couverture des axes : place 4 (mode de Synthèse r1, carte r2, Annuel r3, Opérations r4) ; période 4 (année r1, trimestre r2,
  brassin r3, mois r4) ; forme 3 (chiffres r1, barre r2, pastilles r3 et r4) ; « si » 3 (rien + AFC r1, net r2 et r3, seuil r4).
- Fichiers écrits (Possède) : `tva/v0/r1/` à `r4/` (`etat.html`, `NOTE.md`, `gestes.json`, captures `rN-<état>-390.png` ×7,
  `rN-annee-1280.png`, `rN-si-1280.png`, `rN-geste-*.png`), `tva/v0/r1/capturer.mjs` (captures de la série :
  `node …/tva/v0/r1/capturer.mjs r1 r2 r3 r4`), `tva/v0/r-controles.log`, ce fichier.
- Prédiction : « r3 c'est vachement bien, la TVA par brassin et au litre, mais r4 pour le récap qui renvoie et les pastilles ;
  r1 trop sage ».
- DÉCISION À PRENDRE : r4 place la vue dans Opérations, hors des trois places du cadrage ; à garder comme axe si le brasseur
  la prend. L'accord groupé « garder la TVA par taux à l'enregistrement » (déploiement) reste à lui, avec la page.
- CONNAISSANCE : non assujetti au taux normal pour ses ventes et ~2,6 % sur ses ingrédients, le net « si assujetti » est
  négatif (il paierait) dans les données fictives (−566,99 CHF sur 2026) : à confirmer sur ses vraies ventes avant tout
  message ; aucune conclusion fiscale ici.
- LEÇON PROPOSÉE : aucune.

TVA-R OK — quatre mini maquettes TVA (r1 froide, r2 tiède, r3 et r4 chaudes), sept états jouables, contrôles verts
