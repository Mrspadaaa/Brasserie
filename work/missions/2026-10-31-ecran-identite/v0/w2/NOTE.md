# w2 — le récap, éditable ligne par ligne

- **Série** : w, la réponse d'abord. **Chaleur : froide** (affine la baseline : les mêmes données, en lignes).
- **Axes** : A1 (formulaire compacté, forme « réglages »), A2 (jauge du fermenteur dans la ligne du volume), A4 (stepper ± et
  raccourcis 60 · 90), A5 (interrupteur), A6 (coller seulement sur une recette neuve).
- **L'idée** : l'écran se lit comme le récapitulatif déjà rempli — une ligne par réponse, libellé à gauche, valeur à droite —
  et chaque valeur se corrige là où elle est écrite. Une icône teintée par ligne pour se repérer sans lire.

## Baseline (plancher à enrichir)
- [x] En-tête commun tel quel (Abandonner absent sur recette neuve, comme l'app).
- [x] Fil des 7 étapes tel quel.
- [x] Bandeau Grain · OG · IBU · EBC tel quel (absent sur recette neuve).
- [x] Pied Retour · Suivant et lanceur + tels quels.
- Écarts voulus : plus de cartes grises empilées (« Choix pour ce brassin » devient deux lignes : En fermenteur avec sa jauge,
  Conseil) ; plus de titre de carte ; « Coller » du corps sur recette neuve seulement.

## Honnêteté (J7)
- « Conseil ~24 L » : le « ~ » et le mot ; dessous, « espace libre 20 %, repère provisoire ».
- « ~3 L évaporés » simulé, légende au « ? » : taux du profil, sinon 10 % par heure.
- Inconnu : « — », placeholder « Nom de la bière », pastille tiretée « à choisir ».
- Maquette : évaporation recalculée à la louche (3 L à 24 L, 60 min).

## Boosters UX (boosters-ux)
- `edition-sur-place` — ajuster ; le nom se tape dans sa ligne (souligné tireté = éditable).
- `jauge-volume` — ajuster et lire ; ± 1 L et saisie, jauge 0–30 L, conseil tireté ; +1 L ×3 (`etat-touche.png`) : 27 L,
  jauge ambre, « 3 L libres ».
- `conseil-reglable` — ajuster ; la ligne Conseil déplie l'espace libre sur place.
- `raccourcis-ebullition` — choisir ; 60 · 90 et ± 5 min.
- `interrupteur-nolo` — déclencher ; « alcool du style 7,5–10 % » disparaît, l'atelier se signale (`etat-nolo.png`).
- `style-pastille`, `coller-neuve`.
- B1 OK — 7 boosters marqués, avant/après : `capture-haut.png`, `etat-touche.png`.
- B2 mitigé — pas de masse dominante : toutes les lignes pèsent pareil (c'est le genre « récap ») ; un seul `primary`.
- B3 OK — 71 mots (61 sans l'en-tête), 7 lignes ; repères, espace libre, matériel à un toucher.
- B4 OK — une ligne par grandeur, séparateurs de 1 px, aucun panneau imbriqué.
- B5 à mesurer.
- B6 ECHEC — 5 tailles (13, 14, 15, 16, 18) ; valeurs en Plex Mono tabulaire, colonne de droite alignée.
- B7 OK — CONTRASTE OK ; icônes teintées accompagnées du libellé.
- B8 OK — neuve, plein, NOLO (`etat-neuve.png`, `etat-plein.png`, `etat-nolo.png`) ; BRUTES OK.
- B9 partiel — pression et jauge animée ; mouvement réduit respecté ; délai non mesuré.
- B10 OK — 0 `type="number"`, `inputmode` adapté.
- B11 — « neipa v3, Double IPA, 24 L dans 30 L, 60 min, sans NOLO » : la colonne de droite le dit.
- B12 OK — STANDARD OK.
- B13 OK — cibles ≥ 24 px (hors « Eau » du fil commun, 22 × 38) ; 0 chevauchement au repos.

## Ce qui tient, ce qui casse
- Tient : lisible d'un regard de haut en bas, comme le Récap. ; édition sans quitter la ligne ; la jauge dit le fermenteur.
- Casse : peu de hiérarchie (tout au même poids) ; c'est le plus « formulaire » de la série ; « Conseil » sur sa propre ligne
  ajoute une ligne qui pourrait vivre sous la jauge.

## Contrôles (sorties recopiées)
- `verifier-page.mjs` → PAGE OK.
- `controle-commun.mjs … --sans=mots,au-style,fiche,trait` → COMMUN OK (raison du `--sans` : contrôles de houblons, sans objet ici).
- `mots-premier-ecran.mjs --max=80` → w2 71 mots, MOTS OK.
- `controle-panel.mjs` (6 captures w) → PANEL OK ; remplissage w2 0,547.
- `controle-choix.mjs` : sans objet (Identité hors registre).
