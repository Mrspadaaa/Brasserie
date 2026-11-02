# Brief v0 — la vue TVA, cas « non assujetti » (01.11, D250)

Séries : tva-r (Opus, la langue de l'app en ligne), tva-z (Fable, créative à fond), tva-u (Opus, **§ Brief minimal seul**). Quatre mini
maquettes par série : 1 froide, 1 tiède, 2 chaudes (M13, D204). Cadrage : `jury-tva/fiche.md` (lis-le en entier, sauf la série u).

## Ses mots (mot pour mot, `work/refonte-frontend/v4/SPEC-BRASSEUR.md`)
- « Aussi pour la TVA. SI plusieurs articles dans la même facture ont différentes taux, comment cela est géré ? En tant que indépendant
  je dois pouvoir me faire rembourser la TVA ? J'aurais besoin d'avoir une vision là dessus »
- « Vue TVA : elle attend aussi ton choix. Je comprends pas ? Je vois pas l'artefact où j'ai déjà validé ? »
- À « TVA : es-tu assujetti ? » : « Je fais moins de 100k »
- Sur l'app : « J'aime beaucoup les pastilles sur les items, ça rend la chose très clair. Aussi un récap en haut comme sur le screen est
  top, avec la possibilité de clicker et avoir des revois »

## Une question (L10)
**« Combien la TVA me coûte-t-elle, et est-ce que je la récupère ? »** La réponse au « récupère » est un réglage (non assujetti) ; le seul
facteur libre de la vue est **la période**. Tout le reste de l'app est repris tel quel (règle n° 1, plancher à enrichir L07).

## La base
L'onglet Finances en ligne : `inventaire/captures/fin-synthese-390.png`, `fin-synthese-1280.png`, `fin-operations-tout-390.png`,
`fin-previsions-390.png` (mêmes noms en 1280). En-tête de l'app, onglets « Synthèse · Opérations · Prévisions · Annuel », bascule
« Situation / Coûts » de Synthèse, barre de navigation du bas : repris tels quels. Code en lecture seule : `src/components/tabs/FinancesTab.tsx`.
Une mini maquette montre la vue TVA à sa place, à 390 × 844 ; le reste peut être une bande figée. Elle tient à 1280.

## Ce que l'app sait (faits du code, `jury-tva/fiche.md` § Tranché)
- Une dépense enregistrée porte **un** taux et **un** montant de TVA ; une TVA non lue y est écrite 0 ; la monnaie n'est pas gardée.
- La lecture d'une facture rend la TVA par taux. Un accord du brasseur permettrait de la garder par taux pour les dépenses à venir :
  montre les deux, les dépenses anciennes marquées « un taux enregistré » ou « TVA inconnue ».
- Le réglage « assujetti » existe dans l'app ; aujourd'hui : non.
- Taux suisses : 8,1 % normal, 2,6 % réduit (denrées), 3,8 % hébergement ; sa bière est au taux normal.

## Les états à montrer (`?etat=`, tous jouables)
1. `annee` : l'année en cours ; ingrédients à 2,6 %, matériel et nettoyage à 8,1 %, quelques dépenses à TVA inconnue.
2. `inconnues` : beaucoup de dépenses anciennes à TVA inconnue (avant le changement) : le total ne doit pas tromper.
3. `douteuse` : une facture dont la TVA lue se contredit (colonne MWST ≠ somme des taux) : « choisie à la saisie », un renvoi vers elle.
4. `etrangere` : une facture allemande (MwSt 19 %) : pas de TVA suisse, comptée à part.
5. `vide` : aucune dépense sur la période.
6. `si` : le geste « si j'étais assujetti » ouvert (selon ton axe : rien et un lien AFC, ou le net récupéré − facturé sur ses ventes
   enregistrées, hypothèses visibles).
7. `horsligne` : la vue hors ligne.
Données fictives seulement (aucune valeur de ses pièces) : fournisseurs « Malterie Fictive SA », « Houblons du Jura Sàrl », « Inox
Demo GmbH » (Allemagne), ventes fictives ; CHF à deux décimales et virgule.

## Les axes (chaque série en couvre au moins deux, sans se répéter ; `jury-tva/fiche.md` § Axes)
- **place** : un mode de Synthèse à côté de « Situation / Coûts » ; une section d'Annuel ; une carte de Synthèse qui ouvre la vue ;
- **période** : année ; trimestre ; par brassin ;
- **« si assujetti »** : aucun chiffre, un lien AFC et fiduciaire ; le net récupéré − facturé, hypothèses au toucher ; jamais un
  « récupéré » seul, jamais un curseur de chiffre d'affaires ;
- **forme** : barre empilée par taux ; liste à pastilles ; chiffres seuls.

## Exigences transversales
Honnêteté : l'inconnu jamais à zéro, son compte à côté du total ; « choisie à la saisie » pour une TVA douteuse ; l'étranger à part ; le
statut dit comme un réglage ; aucun conseil, aucune phrase d'intro fiscale ; une source AFC au toucher seulement. 60 mots au plus au premier
écran, aucune phrase d'aide au repos ; pas de cockpit ; chaque chip mène quelque part ; texte ≥ 12 px ; cibles ≥ 24 px sans chevauchement ;
aucun `type="number"`. Charge `boosters-ux`, `impeccable` et `ui-design-system` avant de dessiner ; marque chaque booster `data-booster`.

## Ce que rend chaque variante (`tva/v0/<id>/`, ids `r1`…`r4`, `z1`…`z4`, `u1`…`u4`)
- `etat.html` jouable à 390 × 844 et à 1280 ; classes et globales préfixées par son id (`tvar1-…`, L26), script dans une fonction
  immédiate, assemblage sans remplacement de chaîne ; les sept états par `?etat=`.
- `NOTE.md` : chaleur, axes, l'idée en une phrase, ce qui vient de la base, les boosters cochés.
- Captures : `node scripts/agents/verifier-page.mjs <etat.html> --captures <dossier>/<id>`, puis une par état à 390 et une à 1280 ;
  **ouvre-les** et juge-les comme lui, zone par zone en plein format (L12).
- Contrôles, depuis la racine (`<dir>` = `work/missions/2026-10-31-ecran-depense/tva/v0`) :
  `node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs <dir>/<id> --ecran=finances` (l'écran Finances n'a pas d'entrée dans
  `ecrans.json` : note sa sortie telle quelle, ce n'est pas un échec de ta variante) ;
  `node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs <dir> <id> --page=etat.html --profil=sans-houblons --sans-lignes` → COMMUN OK ;
  `node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs <dir> <id> --page=etat.html --max=60 --sans-lignes` → MOTS OK
  (les lignes de dépenses marquées `data-mots="lignes"` ne comptent pas) ;
  `node work/refonte-frontend/v4/tournoi/outils/controle-contraste.mjs <dir> <id> --page=etat.html` → CONTRASTE OK ;
  `node scripts/agents/verifier-page.mjs <dir>/<id>/etat.html --min-images 0` → PAGE OK.
  (Si un outil prend ses arguments autrement, lis son en-tête et adapte ; dis-le.)

## Possède
Ta série seulement : `work/missions/2026-10-31-ecran-depense/tva/v0/<lettre>*/**` et `tva/v0/<lettre>-RESULTAT.md`. Ni `src/`, ni l'app.
Aucun serveur dans `C:/Users/mrspa/Documents/Brasserie` ; aucun code écrit par heredoc ni `node -e` ; pas de `git stash`, aucun commit,
aucune installation. Ne touche jamais `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `functions/.env`. Chemins absolus
dans Bash.

## Retour
`tva/v0/<lettre>-RESULTAT.md`, écrit variante par variante : l'idée, les sorties des contrôles, les captures ouvertes, ce qui tient et ce
qui casse. Puis une ligne : `TVA-R OK — …` (ou Z, U) ou `… ECHEC — <raison>`. `LEÇON PROPOSÉE : …` au besoin.

## Brief minimal (série u : lis cette section, la base, « Possède », « Ce que rend », « Retour » ; rien d'autre)
Le brasseur, non assujetti à la TVA (chiffre d'affaires sous 100 000 CHF), demande « une vision » sur la TVA qu'il paie sur ses achats,
et s'il pourrait se la faire rembourser. Montre-lui, dans l'onglet Finances de l'app tel qu'il est, combien la TVA lui coûte sur une
période, sans jamais compter une TVA inconnue comme zéro. Quatre idées, de la plus sage à la plus libre. Les sept états par `?etat=` :
annee, inconnues, douteuse, etrangere, vide, si, horsligne.
