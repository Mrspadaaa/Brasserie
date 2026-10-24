OK — tri : fla5, flu2, flc8, flb3, fld8

## Niveau du panel (rejoué)
`node work/refonte-frontend/v4/tournoi/outils/controle-panel.mjs work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/captures/*-premier-ecran.png`
→ **PANEL OK** : 48 captures, remplissage médiane 0,64 (1 sous 0,50), ressemblance moyenne 0,86, 0 paire presque identique sur 1128.
Au niveau du lot 21 (0,62 / 0,88). Pas de relance de série pour le niveau. Exemples du brasseur : 10 froides sur 48 (21 %).
Gestes : les 48 `etat.html` joués dans Chrome à 390 px (0 erreur, 0 débordement, bascule « absolu » efficace sur les 48).

## Livrables
- `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/critique/fl-a.md`, `fl-b.md`, `fl-c.md`, `fl-d.md`, `fl-z.md`, `fl-u.md` : une
  critique par série (3 secondes, disposition / habillage, en brasseur, déjà refusé, classe prédite, sa phrase, ce qui est perdu de g1).
- `work/refonte-frontend/v4/ecran-1/fils24-fiche-liste/critique/SYNTHESE.md` : niveau du panel, baseline signalée en premier,
  `## Classement` (48), `## Candidates` (5, 3 retouches chacune), `## Greffes`, retouches communes, relances ciblées, fusions, gestes.

## Candidates
fla5 (a, tiède, au style en mots) · flu2 (u, froide, cartes de famille) · flc8 (c, chaude, tuiles tamponnées) · flb3 (b, tiède, la signature en
une phrase) · fld8 (d, chaude, l'iceberg). Fusion : flz5 → fla5. Relance ciblée : flu6 (mots au bout des rayons, en français, Nelson et Nugget).

## À signaler avant la passe 2 (pas des rejets au tri)
- Série u entière : mots anglais au premier plan (woody, resinous, pineapple, resiny ; D97, D115) et un seul houblon capturé (Nugget, L14).
- Séries b, c : sélecteur de houblons dans la fiche, α en police mono ; flc3 à flc8 sans pied g1 ni étape derrière la feuille.
- Trois plages d'α pour un même houblon dans le panel (Nugget 11–14 / 9,5–16 / Nelson 12–14 / 10–14) : prendre celle de g1 ou nommer la source.
- Radars à plusieurs teintes (fla2, secteurs au style de la série b) : notés en défaut (mon biais connu), zone 16D grise de la série z à la place.
- flz6 : la loupe cache deux étiquettes du radar et le centre (défaut majeur de cette forme, à corriger si greffée).

## Verdicts par variante (tri : aucun REJET ; classe prédite entre parenthèses)
- **fla1** (le mot en tête) — ACCEPTÉ (aime) · **fla2** (le radar parle) — ACCEPTÉ (mitigé) · **fla3** (note de dégustation) — ACCEPTÉ (mitigé) · **fla4** (rubans) — ACCEPTÉ (aime) · **fla5** (au style en mots) — ACCEPTÉ (aime, candidate) · **fla6** (roue) — ACCEPTÉ (mitigé) · **fla7** (cône) — ACCEPTÉ (mitigé-aime) · **fla8** (touches) — ACCEPTÉ (mitigé)
- **flb1** (g1 + signe) — ACCEPTÉ (aime) · **flb2** (rareté) — ACCEPTÉ (mitigé) · **flb3** (phrase de signature) — ACCEPTÉ (aime, candidate) · **flb4** (échelle de rareté) — ACCEPTÉ (rejette prédit) · **flb5** (face aux remplaçants) — ACCEPTÉ (aime, réserve D98) · **flb6** (carte d'identité) — ACCEPTÉ (mitigé) · **flb7** (pyramide) — ACCEPTÉ (mitigé-aime) · **flb8** (orbite) — ACCEPTÉ (mitigé)
- **flc1** (g1 tamponné) — ACCEPTÉ (aime) · **flc2** (par accord) — ACCEPTÉ (aime) · **flc3** (table) — ACCEPTÉ (rejette prédit) · **flc4** (fermeture éclair) — ACCEPTÉ (mitigé) · **flc5** (fiches brutes) — ACCEPTÉ (rejette prédit) · **flc6** (flux) — ACCEPTÉ (mitigé-aime) · **flc7** (pile de fiches) — ACCEPTÉ (mitigé-aime) · **flc8** (tuiles tamponnées) — ACCEPTÉ (aime, candidate)
- **fld1** (g1 corrigé) — ACCEPTÉ (aime) · **fld2** (barre + puces) — ACCEPTÉ (mitigé-aime) · **fld3** (nuage) — ACCEPTÉ (mitigé-aime) · **fld4** (échelle) — ACCEPTÉ (rejette prédit) · **fld5** (carte) — ACCEPTÉ (aime) · **fld6** (éventail) — ACCEPTÉ (rejette prédit) · **fld7** (cible) — ACCEPTÉ (mitigé-aime) · **fld8** (iceberg) — ACCEPTÉ (aime, candidate)
- **flz1** (hors du dessin) — ACCEPTÉ (mitigé-aime) · **flz2** (radar des mots) — ACCEPTÉ (rejette prédit) · **flz3** (à toi de ranger) — ACCEPTÉ (mitigé) · **flz4** (par ses cousins) — ACCEPTÉ (aime) · **flz5** (dans ta stout) — ACCEPTÉ (aime, fusion → fla5) · **flz6** (loupe) — ACCEPTÉ (mitigé) · **flz7** (escalier) — ACCEPTÉ (rejette prédit) · **flz8** (mots bruts → idées) — ACCEPTÉ (rejette prédit)
- **flu1** (une ligne par famille) — ACCEPTÉ (aime) · **flu2** (cartes de famille) — ACCEPTÉ (aime, candidate) · **flu3** (face à ta stout) — ACCEPTÉ (rejette prédit) · **flu4** (quatre tuiles) — ACCEPTÉ (mitigé-aime) · **flu5** (précis ou vague) — ACCEPTÉ (mitigé) · **flu6** (mots au bout des rayons) — ACCEPTÉ (aime, relance) · **flu7** (mouillettes) — ACCEPTÉ (mitigé-aime) · **flu8** (dictionnaire) — ACCEPTÉ (rejette prédit)

LEÇON PROPOSÉE : un brief de série qui exige « tout en français » n'est pas un contrôle ; la série u (8 pages) a rendu woody, resinous, pineapple au premier plan avec COMMUN OK. `controle-valeurs-brutes.mjs` (D97) devrait entrer dans les GATES de chaque série v0 d'un lot dont le brief cite D97, et être rejoué sur le texte rendu, pas sur la NOTE.
