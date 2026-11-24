OK — zones de toucher au bord rentrées vers l'intérieur (barre, cadre, boutons) ; défilement au bord ×2,5 ; PRÊT À METTRE EN LIGNE c6f7b2b70

## État de l'art (L29)
Cibles tactiles : WCAG 2.5.5 (44 × 44 px), 2.5.8 (24 × 24 px au minimum), Apple 44 pt, Android 48 dp ; le geste retour d'Android réserve ~20 à 30 dp depuis chaque bord : un doigt qui part de là recule la page. Méthode standard : une cible au bord garde son dessin, sa zone de toucher s'étend vers l'intérieur (pseudo-élément ou zone de geste), sa partie utile se tient hors de la bande du geste. Pas de bibliothèque : pur calcul de segments, `prisesBord.ts` (une fonction `rentrer`, testée).

## Actionneurs concernés (fichier:ligne, avant correctif)
1. Poignée de fin d'une barre, bord droit : usePointeur.ts `surLeBord` (22 px dedans), Barre.tsx:348 `zoneBord`, 542 `.cal-grip`, frise.css:224-227 (`::before` 22 px dehors, rogné par `overflow-x: clip`) → zone utile 20 px.
2. Bord gauche d'une barre : usePointeur.ts `surLeBordDebut`, Barre.tsx:349.
3. Jalon de fin (icône) : frise.css:205 (dans la zone de 1).
4. Poignées du cadre de la fenêtre : Fenetre.tsx `zonesPoignees` (162) et `roleSous` (319, module geste partagé).
5. Petits boutons de la frise : frise.css `.cal-marque::before` (240), `.cal-plus` (73), `.cal-oeil` (76), `.cal-cachees` (78), `.cal-caddie` (68), `.cal-renvoi` (39), `button.cal-lie` (63, 347).
6. Boutons de tête de l'en-tête : entete.css:54, 58, 185, 186 (`.ent-k`, `.ent-mb`, `.ent-per`, `.ent-ret-b`, `.ent-pl` le plein écran à 18 px du bord droit, `.ent-al`, `.ent-cc`).

## Fait
- Tests AVANT : `tests/unit/poigneesBord.test.ts` (23 au rouge, 24 ensuite : un test de voisinage ajouté) et `defileBordCalendrier.test.ts` (6). Lancés rouges : 22 échecs, 7 verts (gardes de non-régression) → `tests-rouge.log`.
- Correctif (commit c6f7b2b70) :
  - `frise/prisesBord.ts` : `rentrer(zone, vue, borne)` étend vers l'intérieur pour que la part hors des 24 px du bord mesure 44 px ; la zone d'avant reste prise (union, aucune régression) ; bornes : une barre cède au plus 40 % de sa largeur (le tiers sous 120 px : le milieu d'une barre courte la déplace, R2-1), le cadre s'arrête où commence la prise de l'autre bout.
  - Barres : `usePointeur.ts` `prisePourBord` (fin et début). Le doigt pris dans la part rentrée ne fait pas sauter la fin (`corr`, le bord va au jour sous le doigt) ; un toucher bref dans cette part ouvre la fiche ou la bulle d'étape comme le corps.
  - Cadre de l'en-tête : `zonesPoignees` et `roleRentre` (Fenetre.tsx). `src/ui/geste` non touché.
  - Boutons : `useRentree` pose `--rentre-g` / `--rentre-d` ; frise.css et entete.css rallongent le `::before` / `::after` (`min(-Npx, calc(var(--rentre-x) * -1))`) ; l'extension s'arrête 2 px avant la commande voisine de la ligne (le plein écran, collé au bouton d'à côté, garde sa zone).
  - Rendu inchangé : bord à bord, traits continus, aucun décalage du dessin.
- Q-4 (« Trop lente sur le calendrier ») : `frise/defileBord.ts` `MULT_DEFILE_CALENDRIER = 2.5` ; usePointeur.ts (plafond 8 col./s, `colonnesParImage(vitesseCalendrier(vitesse)…)`), Fenetre.tsx:352, DureeFenetre.tsx:148. Montée progressive gardée (la vitesse du module croît avec la profondeur). `src/ui/geste` inchangé.
- BUGS.md : lignes POI-1 et Q4-1 (« corrigé en local c6f7b2b70 »), commit par blob : seules ces deux lignes (une ligne C50-5 modifiée par une autre session reste hors du commit).

## Critères
- tests : `poigneesBord` + `defileBordCalendrier` + 31 fichiers calendrier/frise/en-tête : 33 fichiers, 411 verts (`tests.log`).
- `npx vitest run tests/unit/proprietes` : 8 fichiers, 76 verts (`proprietes.log`).
- `tsc --noEmit` : 2 erreurs connues seulement (seedData GanttTask, virtual:pwa-register) (`tsc.log`).
- `node scripts/agents/controle-bugs.mjs` : BUGS OK (2248 bugs).
- Essais : tests 2 passes (3 échecs corrigés : 2 tests mal écrits, 1 motif de regex) ; un correctif.

## Doutes et limites
- Hauteur : la cible fait 44 px de large mais garde sa hauteur (barre + 2 × 2 px) : une rangée mesure ~32 px, 44 px de haut chevaucherait la poignée de la barre voisine (« une zone élargie ne chevauche pas une autre commande »). WCAG 2.5.8 (24 px) tenu.
- La courbe de l'en-tête est supposée bord à bord pour dessiner les zones (`zonesPoignees`, défaut) ; le geste, lui, lit le vrai bord (`vueDansRepere`).
- Une barre de moins de 120 px collée au bord n'a que sa zone d'avant (le tiers) : la rentrer plus mangerait son milieu.
- Rien de vu en vrai rendu (consigne : pas de capture locale) : à contrôler en ligne à 390 px, doigt posé à 25 à 65 px du bord sur la fin de « Fruty », sur le plein écran, sur le « + » de Fêtes ; et le défilement au bord (barre et cadre) à sentir.
- Étiquettes de lecture : les `::before` rallongés peuvent croiser le nom d'une chose posé à côté (non commande) : il ouvre la même fiche.

DÉCISION À PRENDRE : la hauteur de toucher (44 px) — option A : rester à la hauteur de la rangée (fait) ; option B : rangées plus hautes (perte de densité, contre la règle du brasseur). Recommandation : A.

CONNAISSANCE : la zone de prise d'un bord de barre se rentre contre le bord de l'écran (prisesBord.ts, 24 px de bande du geste retour, 44 px de cible) ; une prise rentrée corrige le décalage du doigt pour ne pas sauter la date.
LEÇON PROPOSÉE : aucune
