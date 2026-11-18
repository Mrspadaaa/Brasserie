# Voie g2a-ecran — ce que l'écran montre mal : le rouge à sa place, le filtre choisi, Tout valider, Plié, Regrouper, le thème clair

Agent : `auteur` (Sonnet). Plafond : 120 tours. Lire d'abord `../g-commun.md`, puis `.claude/rules/affinee-frontend.md`, DESIGN.md (Colors, échelle),
docs/ui-compacte.md. Travaille dans le worktree ; tests, tsc, build par `copie.mjs`. La voie g2b écrit en même temps dans d'autres fichiers (voir
Possède) : si un test casse par un fichier qu'elle possède, relance une fois, puis dis-le, n'y touche pas.

## Méthode (L13)
Pour chaque défaut : d'abord un test qui échoue sur HEAD (sortie gardée dans `voies/g2a-ecran/rouge-*.txt`), puis la correction, puis le même test
vert. Lignes fictives du même genre que sa pièce dans les tests (jamais ses valeurs). Garder tout ce que ses maquettes ont fixé (règle n° 1).

## Ce qu'il faut corriger (défaut du pilote, réversible ; il juge dans l'app)
1. **D330 et D334, le rouge à sa place.** Une rangée dont une valeur est `inconnu` (unité, article, quantité…) montre le jeton `alert` sur la cellule
   même (bord tireté rouge, texte `alert`, `data-dp-niveau="inconnu"`), comme son en-tête ; `repris` garde le jaune pointillé. Plateau ouvert : le champ
   qui manque porte un bord `alert` et un mot court qui le nomme (« article à choisir », « unité à remplir »…) ; sous le filtre « à remplir », la
   rangée s'ouvre et le focus va sur ce champ. Un en-tête « n ? » a toujours n rangées rouges visibles une fois déplié.
2. **D331, le filtre choisi.** La puce active du récap (`Comptes`, `aria-pressed`) se distingue au premier coup d'œil : fond plein de son jeton et bord
   plein (pas tireté), texte contrasté ≥ 4,5, dans les deux thèmes ; le bandeau de filtre garde son libellé.
3. **D328d, le thème clair.** Un contrôle clair posé dans un aplat paille (`bg-ebc-straw`, noir en clair) garde son texte foncé : corrige la règle
   `.bg-ebc-straw *` de `src/theme/themes.css` pour les fonds `bg-cave-950/900/850` et leurs enfants. « ✕ Toutes les lignes » lisible en clair et en sombre.
4. **D329, « Tout valider » les changements (son B étendu, D313 « Tout validé les changements. Mais aussi un à 1 »).** Le bandeau au pouce
   (`BandeauPerdues`, `src/ui/depense/Pied.tsx`, même forme, même place) devient la file de **tous** les changements de la 3e lecture encore à
   trancher, dans l'ordre du papier : les lignes pas retrouvées (comme aujourd'hui : Garder, Retirer), les valeurs corrigées (le nom de la ligne,
   « nom corrigé · 1/7 » ; Garder = la correction reste, Annuler = la valeur du provisoire revient), les lignes ajoutées (Garder, Retirer), et les
   désaccords qui pèsent (Garder = la valeur retenue, le point se règle ; « Voir » = la rangée s'ouvre sur le champ). « ↻ Tout valider » dès 2 éléments :
   tout garder d'un toucher (les perdues partent, comme aujourd'hui). Un geste passe au suivant. Confirmer sans trancher = tout gardé. Le bleu des
   corrections (D314) et la puce « ↻ N corrigées » restent.
5. **D333, Plié et Déplié.** « Plié » ferme toutes les familles et sous-familles, même celles qui ont une ligne à voir (leur en-tête garde le compte et
   la couleur) ; « Déplié » ouvre tout ; un toucher sur une en-tête la bascule seule ; l'état du segment suit l'état réel (D311).
6. **D332, Regrouper.** Après « Regrouper en une dépense », un geste « ↶ Rétablir les N lignes » à la même place rend les lignes et leurs retouches,
   jusqu'à « Confirmer » ; rien d'autre ne change.
7. **D328e, D328f, D328h.** Aucun nombre rogné au récap à 390 (le libellé passe à la ligne ou se raccourcit, le nombre jamais) ; pluriels justes de
   chaque puce (« 2 désaccords ») ; prix et montants des cellules au repos à 2 décimales au moins (« 9,50 », « 0,098 » reste), et de même dans les
   champs du plateau tant qu'ils n'ont pas le focus (« 1,2 » montré « 1,20 » ; au focus, la valeur telle qu'il la tape, [[saisie-mobile]]).
8. **D328g, le faux français.** Un `nameFr` qui ne change que la casse, les accents, les espaces, la ponctuation ou l'ordre des mots du nom imprimé
   n'est pas une traduction : la rangée montre le nom imprimé seul, sans nom barré (D271) ; une vraie traduction ou une abréviation développée
   (« VITRIFIC.P.SOL » → « Vitrificateur pour sol ») garde la forme d'aujourd'hui.
9. **D335, le segment Nature jamais vide.** « C'est même pas mis au c'est ingrédient, service ou matériel » : le segment
   (`NATURES`, `ExpenseSheet.tsx:916`) garde ses trois mots, et chaque type d'achat en allume un : Ingrédient = `ingredient` ; Matériel =
   `equipment`, `packaging`, `cleaning`, `maintenance`, `other` ; Service = `service`, `shipping`. Une ligne `discount` (remise) ne montre pas le
   segment. Toucher le segment déjà allumé ne change rien ; toucher un autre segment pose `ingredient`, `equipment` ou `service` comme aujourd'hui.
   Le menu « Type d'achat » reste le choix fin. Test : chaque nature de la liste rend exactement un segment pressé.

Après ces corrections, le pilote te renverra (SendMessage) la liste des écarts de l'app à ses maquettes choisies (voie g3, D336) : même méthode.

## Possède
`src/ui/finance/ExpenseSheet.tsx`, `src/ui/depense/Pied.tsx`, `src/ui/depense/Recap.tsx`, `src/ui/depense/Liste.tsx`, `src/ui/depense/Ligne.tsx`,
`src/ui/depense/rangees.ts`, `src/ui/depense/p3c.css`, `src/theme/themes.css`, `src/ui/depense/etat.ts` (libellés seulement), `tests/unit/depense/g2a/**`,
les tests existants de `tests/unit/depense/` que ses changements rendent caducs (dire lesquels et pourquoi), `work/missions/2026-10-31-ecran-depense/voies/g2a-ecran/**`.
Interdits : `src/ui/depense/confiance.ts`, `src/ui/depense/familles.ts`, `src/ui/depense/groupes.ts`, `src/ui/depense/finale.ts` (voie g2b), `functions/**`.

## Critères (le pilote les rejoue)
1. Chaque défaut 1 à 8 : un test rouge sur HEAD (sortie gardée) puis vert.
2. `copie.mjs "npx vitest run tests/unit/depense"` vert (hors échecs connus d'environnement, nommés) ; `npx tsc --noEmit -p tsconfig.json` et `npm run build` verts.
3. Le pilote rejoue ensuite le banc g1 (mesures M5 à M12) sur ton code : chacune passe.
4. `git status --short` : rien hors de « Possède ».

## Rendre
`voies/g2a-ecran/RESULTAT.md` (fichiers, tests rouges et verts, décisions prises ; `LEÇON PROPOSÉE : …`, `CONNAISSANCE : …`), puis une ligne
`G2A OK — …` ou `G2A ECHEC — …`.
