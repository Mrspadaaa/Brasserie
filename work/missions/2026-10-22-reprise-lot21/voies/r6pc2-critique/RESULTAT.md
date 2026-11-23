OK — accepté : le chevauchement « ✓ » / « par » de « moins résineux » a disparu dans les trois états rejoués, et le premier écran n'a pas bougé

Critique Fable, non étalonné (L27) : avis indicatif. Contre-visite du seul défaut qui avait fait rejeter r6p2
(`voies/r6pc-critique/RESULTAT.md` : D56 « l'un sur l'autre », D10 débordement). Méthode : les quatre captures demandées
ouvertes en image, plus `r6p2-quatre-390.png` (quatre colonnes par floral, pour comparer la hauteur du tableau) ; le cadre
de réponse de chacune agrandi ×3 dans le scratchpad (crop 30,140 → 760,270 ; 190 px de haut pour quatre colonnes), et le
bas de la capture quatre colonnes agrandi aussi. Source vérifiée : `r6p2/generer.mjs` lignes 535-537 (`flex: none` sur
`.r6p2-rep-par`, `.r6p2-rep-n` et ses enfants), ligne 843 (`LONG` : libellé > 8 caractères et 3 colonnes au plus → le gain
passe en bout de « contre ★ »), ligne 525 (`body { padding-bottom: 64px }`), `captures.mjs` ligne 17 (viewport 390 × 844).

## Verdict

- **r6p2** (La réponse d'abord) — ACCEPTÉ : par « moins résineux », « ★ ● Cascade ✓ par [🌲 moins résineux ⌄] » tient sur une ligne, le ✓ et « par » séparés d'un blanc net (`r6p2-resineux-390.png`, agrandi ×3 : rien ne se recouvre) ; « 🌲 ~+1,9 » est passé en bout de la ligne « contre ★ Idaho 7 🌲 = Galaxy 🌲 = ⚠🍍 », avant le chevron, sans rien couper ; le premier écran (`r6p2-premier-ecran.png`, floral) est celui de la critique précédente, au pixel près.
  - Vu (`r6p2-resineux-galaxy-390.png`, agrandi) : Galaxy touché, la ligne du doigt « ● Galaxy contre ★ 🌲 = ❀ = ⚠ sort 🍍 … 🌲 ~+1,9 › » sur fond gris, liseré violet ; le cadre du haut inchangé, ✓ et « par » séparés. Rien l'un sur l'autre.
  - Vu (`r6p2-resineux-quatre-390.png`, agrandi) : « ★ ● Nelson Sauvin ✓ par », la pastille « 🌲 moins résineux ⌄ » passe seule sous le nom, « 🌲 ~+0,8 » à droite, puis « contre ★ Ⓒ 🌲 ≈+1,1 Ⓘ 🌲 ≈+1,1 Ⓖ 🌲 ≈+1,1 ⚠🍍 › » : quatre houblons en ronds lettrés, le chevron visible, rien de coupé. Les chiffres tiennent avec le tableau (0,8 contre 1,9 / 2 / 2). Le tableau descend de 28 px dans ce seul état, comme annoncé.
  - Vu (`r6p2-premier-ecran.png`, agrandi) : « ★ ● Idaho 7 ✓ par [❀ floral ⌄] … ❀ ~+1,3 », « contre ★ ● Cascade ❀ ≈−0,4 ● Galaxy ❀ ≈−0,4 ⚠🍍 › ». Identique à ce qui avait été jugé : rien d'autre n'a bougé.
  - Restant, sans règle (déplacé, pas réglé) : par « moins résineux », « 🌲 ~+1,9 » (ce que Cascade, la première, ajoute de résineux à ta stout) se lit maintenant en bout de la ligne « contre ★ ». Sur la ligne du doigt de Galaxy (`r6p2-resineux-galaxy-390.png`), il se trouve au bout de « Galaxy contre ★ … » et peut se lire comme le chiffre de Galaxy, dont le tableau dit ~+2. Donnée juste, place ambiguë. Correction suggérée : sur la ligne du doigt, ne pas afficher le gain de ★, ou l'écrire « ★ 🌲 ~+1,9 ».
  - Restant, sans règle : à quatre colonnes par « moins résineux », avec les 28 px gagnés par la pastille, la ligne « 🍏 👁 ▨ inconnus » passe sous le dock au premier affichage (bas de `r6p2-resineux-quatre-390.png`, agrandi : la moitié basse des lettres derrière le filet du dock). La page défile (`padding-bottom: 64px` pour un dock de 56 px), donc rien n'est perdu ; pas de défilement horizontal, pas d'erreur : D10 n'est pas enfreint. Correction suggérée : 8 px de plus sous la légende, ou la pastille sous le nom seulement quand « contre ★ » ne tient pas.
  - Restants déjà signalés le 23.10 et toujours là, sans règle : ★ et ✓ sont deux signes à apprendre (la légende les dit, le premier écran non) ; le coin « ~+1,9 » en teinte résineux pour un critère « moins », lu vite comme un gain.
  - Phrase prédite : « Là c'est propre, le ✓ est plus collé sur "par". Le +1,9 au bout de la ligne de Galaxy, c'est à Galaxy ou à Cascade ? Sinon la réponse direct et le "=" partout sur le résineux, c'est parlant. »

## Captures

Ouvertes en image (5) : r6p2-resineux-390, r6p2-resineux-galaxy-390, r6p2-resineux-quatre-390, r6p2-premier-ecran,
r6p2-quatre-390 ; cinq agrandissements ×3 dans le scratchpad (z-resineux, z-galaxy, z-quatre, z-quatre-bas, z-premier).
Non rouvertes : les autres captures de r6p2, jugées à la passe précédente et annoncées inchangées (`r6p2-agrumes-390.png`
et `r6p2-tropicaux-390.png` rejouées par l'agent : libellés de 7 et 9 caractères, le second passe par la même règle `LONG`
que « moins résineux », vue tenir ici).

LEÇON PROPOSÉE : aucune (celle de la passe précédente tient : capturer la valeur la plus longue de chaque sélecteur et
agrandir ×3 la ligne qui la porte ; cette contre-visite l'a appliquée et n'a rien trouvé d'autre).
