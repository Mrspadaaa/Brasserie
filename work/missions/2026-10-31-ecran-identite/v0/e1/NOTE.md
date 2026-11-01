# e1 — Le champ est le contenant (série e, l'échelle du matériel)

- **Chaleur** : froide (la baseline affinée : même ordre, même carte « Identité », même bouton d'import).
- **Axes** : A2 (le fermenteur en jauge, le conseil marqué dessus), A4 (volume et ébullition en pas à pas), A5 (NOLO en
  interrupteur) ; A3 effleuré (trois mini plages sous le style, sans chiffre répété).
- **L'idée** : chaque volume se saisit dans son contenant : le champ « En fermenteur » est la jauge du fermenteur de 30 L,
  et l'ébullition remplit à côté la cuve de 45 L (moût avant ébullition, part évaporée en bleu, limite de 35 L).
- **Captures** : `e1-haut.png`, `e1-page.png` ; états `etats/neuve.png`, `plein.png`, `nolo.png`, `long.png` ; geste
  `etats/geste-avant.png`, `geste-pendant.png`, `geste-apres.png`. Sources : `../e-serie/src/`.

## Baseline (acquis cochés)
- [x] En-tête commun tel quel : ‹, « Identité 1/7 », Abandonner (absent sur recette neuve, comme l'app), import, thème.
- [x] Fil des 7 étapes, tel quel.
- [x] Bandeau Grain · OG · IBU · EBC, tel quel (absent sur recette neuve, comme l'app).
- [x] Plancher enrichi : « 24 / 30 L · 6 L libres » et « 3 L évaporés » deviennent deux jauges éditables ; le bloc
  « Choix pour ce brassin » et « Matériel du plan » se replient en une ligne « Matériel ⌄ ».
- Le + flottant ne recouvre plus de valeur : le pied laisse son coin libre (seul point commun dans le périmètre, J12).

## Boosters UX (boosters-ux)
- `volume-jauge` — ajuster ; jauge-champ glissée au doigt (pas de 0,5 L) ; remplissage or, espace libre hachuré,
  pointillé vert du conseil ; capture avant 24 L, après 28 L (`geste-*`).
- `volume-moins` / `volume-plus` — ajuster ; pas à pas de 0,5 L ; même jauge.
- `ebullition-moins` / `ebullition-plus` — ajuster ; pas de 5 min ; la cuve se remplit (~27 → ~28 L à 90 min, `long.png`).
- `nolo` — choisir ; interrupteur ; « Atelier NOLO ouvert ⌄ » (`nolo.png`).
- `reperes`, `materiel` — lire ; dépliages ; `etat` — démo des cas limites (sous le premier écran).
- B1 OK — 7 déclencheurs marqués, le geste change l'écran (`etats.mjs` : « geste change », ETATS OK).
- B2 OK — dominante : la jauge or du fermenteur ; une seule action `primary` (Suivant).
- B3 OK — 76 mots au premier écran (`mots-premier-ecran --max=80`), réglage de l'espace libre replié.
- B4 OK — une carte, deux groupes séparés par un filet (identité / volumes) ; pas de carte dans la carte.
- B5 s.o. — R2 non joué (v0).
- B6 ECHEC voulu — tailles 12, 14, 16 (bandeau commun), 18 : quatre ; le bandeau est hors périmètre (J12).
- B7 OK — `controle-contraste` OK (clair) ; cave non mesuré ; `controle-couleurs` OK (or, bleu eau, vert houblon).
- B8 OK — recette neuve : nom et style vides, plages masquées, 30 L par défaut dans 30 L → « Fermenteur plein » dit
  honnêtement (le défaut réel de l'app, inventaire § constats) ; plein : alerte rouge sous la jauge ; « — » jamais 0.
- B9 OK — retour sous le doigt (halo or `e1-tient`, mesuré « oui » pendant le geste) ; 150 ms ; mouvement réduit respecté.
- B10 OK — aucun `type="number"` (0) ; pas à pas au pouce, pas de clavier pour le volume.
- B11 OK — « neipa v3, Double IPA, 24 L dans 30 L, 60 min, ~3 L évaporés » se lit sur la capture.
- B12 OK — chevron ⌄ unique ; rayons 10/16 de DESIGN.md (voir S3 plus bas).
- B13 s.o. — R5 non joué ; cibles de 32 × 60 px au moins pour les pas, 40 × 24 pour l'interrupteur.
- Écarts voulus : B6 (bandeau commun à 16 px).

## Contrôles (sorties recopiées)
- `verifier-page.mjs --min-images 0` : PAGE OK (390 px, sans erreur).
- `mots-premier-ecran --max=80` : e1 76 mots, MOTS OK.
- `controle-panel` (série e) : médiane 0,61, 1 sous 0,50 (e1, 0,48), ressemblance 0,89, 0 paire identique, PANEL OK.
- `controle-commun --sans=mots,au-style,fiche,trait` : couleurs, survol, blocs, contraste, légende, parlant, brutes OK ;
  standard ECHEC S3 (rayons 10 px et 16 px). Sautés : au-style, fiche et trait visent les houblons et leurs familles,
  absents de l'écran Identité. S3 suit l'échelle 2/4/8 des lots houblons ; DESIGN.md fixe 10/16/24 : gardé DESIGN.md,
  signalé au pilote.
- `etats.mjs` : 4 états capturés, geste change, ETATS OK.

## Ce qui tient, ce qui casse
- Tient : le geste et son effet dans le même champ ; les deux contenants côte à côte, cuve plus longue ; l'honnêteté
  (« ~ » et légende « ? »).
- Casse : le remplissage du premier écran reste à 0,48 (beaucoup de libellés) ; la cuve à droite des pas d'ébullition
  est étroite ; le texte posé sur la jauge frôle la superposition (D164) — à surveiller.
