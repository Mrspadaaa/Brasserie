# Brief de la passe 2 — l'outil de la rénovation (01.11, nuit, D259, D207)

Tu es un concepteur neuf. Tu reprends des variantes v0 choisies par le critique et tu les mènes plus loin. Tu ne repars pas de zéro :
la variante v0 est ta base, un **plancher à enrichir** (L07). Tu corriges ce que le critique a relevé et tu greffes ce qu'il désigne.

## À lire, dans cet ordre
1. `work/missions/2026-11-01-renovation/BRIEF-V0.md`, en entier : ses mots, la question, la base de l'app, ce que l'app sait, les huit
   états, les données fictives, les exigences, les contrôles, le Possède. Tout y vaut encore, sauf le Possède (plus bas).
2. `work/missions/2026-11-01-renovation/critique/SYNTHESE.md` : la ligne de ta variante dans « Classement », sa section dans
   « Candidates », les « Greffes » qui la visent, et les « Retouches communes ».
3. Ta variante v0 : `v0/<id>/etat.html`, `v0/<id>/NOTE.md`, et ses captures (`v0/<id>/` ou `v0/<id>/captures/`). Ouvre `jour1`,
   `encours` et `ouvert` avant d'écrire.

## La question ne change pas
« Qu'est-ce qui me manque, et qu'est-ce que je fais ensuite ? » Le facteur libre est la place d'un manque dans la suite. L'argent et les
heures vont sur une ligne de contexte, seulement quand ils sont connus.

## Le jour 1 (défini, pour toutes les variantes)
`?etat=jour1` montre **ses cinq titres**, et rien d'autre : « Installation de la hotte », « 2ᵉ évier », « Armoire extérieure »,
« Seconde passe sur les sols », « Site web vitrine ». Aucun prix, aucune heure, aucun mois, aucune enveloppe. Pas de phrase d'aide, pas
de figure vide, pas de compte à zéro (« fait 0 », « 0 projet »). Une figure ne s'affiche que si elle montre une donnée ; au jour 1, elle
montre les cinq titres (épingles, jetons, bulles nommées), ou elle ne s'affiche pas. La nature devinée (« achat + pose », « travail ») est
permise en sous-ligne grise.

## Ce que chaque variante doit corriger (retouches communes de SYNTHESE)
- Aucune zone muette (D259) : chaque surface d'une figure plus grande que 4 % de son aire est nommée par un texte visible.
- Trois tailles de texte au plus dans la zone de l'outil (16, 14, 12) ; aucun texte rendu sous 12 px.
- « Noter un manque » sous le pouce, au-dessus de la barre du bas, à 390.
- Aucune tâche inventée (« Relancer… », « Signer… ») hors d'une étape cochée dans le manque ouvert.
- Le bas de l'écran ne reste pas blanc : à 390, la ligne de contexte développée ; à 1280, le manque ouvert en panneau fixe à droite.

## Les variantes

### Agent A (ids `z2b`, `z1b`, `m1`)
- **z2b**, depuis `v0/z2` : SYNTHESE § « z2 — le plan », retouches 1 à 3. Le plan s'appelle **« plan type, à ajuster »** tant qu'il n'est
  pas le sien ; un geste « Mon plan » ouvre un neuvième état, `?etat=plan`, où il ajuste au doigt quatre à six zones rectangulaires
  nommées (déplacer, redimensionner, renommer). Greffes : les trous nommés (« prix ? », « date ? », « pose ? ») en chips touchables ; la
  phrase-réponse de u4 en ligne de contexte dès qu'une enveloppe existe ; enveloppe ↔ au compte d'un toucher ; « Bloqué par ① … » et
  les étapes cochables de r3 dans `ouvert` ; « Où ? Touche une zone du plan, ou Noter sans lieu » de r3 dans `ajout` ; « Pas
  maintenant » à côté de « Fait » ; « 9 h faites sur 32 h notées » en ligne de contexte.
- **z1b**, depuis `v0/z1` : SYNTHESE § « z1 — la liste du Bord », retouches 1 à 3. Greffes : les trous nommés ; « Prochain trou : … »
  sous « Ensuite » ; la phrase-réponse en ligne de contexte ; « 0 sur 5 faits ○○○○○ » en tête de carte, **sauf au jour 1** où seul
  « 5 à faire » paraît ; le drapeau « Fin : heures à estimer / rythme à régler » dans `ouvert` ; « Pas maintenant ».
- **m1**, mélange prévu par le critique (« le plan de z2 avec la cuve de u4 à côté ») : le plan de `z2b` en haut, et sous lui une cuve
  étroite qui empile les prix connus dans l'ordre de la suite contre l'enveloppe ou le compte (`v0/u4`, avec les retouches 1 à 3 de
  SYNTHESE § « u4 — la cuve »). La cuve n'apparaît qu'à partir du premier prix connu. Neuf états, `plan` compris.

### Agent B (ids `u4b`, `u2b`, `u3b`)
- **u4b**, depuis `v0/u4` : SYNTHESE § « u4 — la cuve », retouches 1 à 3. L'enveloppe est un **champ neuf** (l'app n'en a pas) : dis-le dans
  NOTE.md. Greffes : le bac « sans mois » de u3 devient une rangée de jetons nommés au-dessus de la cuve ; le champ d'ajout fixe au-dessus
  de la barre ; « 9 h faites sur 32 h notées » en en-tête.
- **u2b**, depuis `v0/u2` : SYNTHESE § « u2 — la grille des trous », retouches 1 à 3. La grille monte dans le Bord ou en écran à lui
  ouvert depuis le Bord (pas au 3ᵉ niveau de Finances) ; dis lequel et pourquoi. Greffes : la couleur de puce = l'état et le numéro =
  la place (z2) ; la nature devinée en sous-ligne.
- **u3b**, depuis `v0/u3` : SYNTHESE § « u3 — la frise », retouches 1 à 3. Greffes : « Prochain trou : … » ; le drapeau « Fin : … » de r4
  à la place des mois vides ; la couleur de jeton = l'état, le numéro = la place ; la piste de solde seulement en `caisse`, jamais au
  repos.

## Ce que rend chaque variante (`v1/<id>/`)
- `etat.html` jouable à 390 × 844 et à 1280, avec les huit états de BRIEF-V0 (neuf pour `z2b` et `m1`). Classes et globales préfixées
  par l'id (`renoz2b-…`, L26) ; script dans une fonction immédiate ; aucun assemblage par remplacement de chaîne.
- `NOTE.md` : la chaleur, les axes, l'idée en une phrase, **la table « v0 → v1 »** (chaque retouche et chaque greffe : fait, où, ou
  refusé et pourquoi), ce qui vient de la base, les boosters cochés, les champs neufs que la variante suppose.
- Les captures, par `node scripts/agents/verifier-page.mjs <etat.html> --captures <dossier>/<id>` : une par état à 390, une à 1280.
  **Ouvre-les toutes** en plein format, zone par zone, et juge-les comme lui (L12), avant d'écrire OK.
- Les contrôles de BRIEF-V0 § « Ce que rend », lancés depuis la racine avec `<dir>` = `work/missions/2026-11-01-renovation/v1` :
  controle-choix (sortie notée telle quelle), controle-commun `--profil=sans-houblons --sans-lignes` → COMMUN OK, mots-premier-ecran
  `--max=60 --sans-lignes` → MOTS OK, controle-contraste → CONTRASTE OK, verifier-page `--min-images 0` → PAGE OK.
- Avant de dessiner : charge `boosters-ux`, `impeccable` et `ui-design-system` (Skill). Marque chaque booster `data-booster`.

## Possède
- Agent A : `work/missions/2026-11-01-renovation/v1/{z2b,z1b,m1}/**` et `v1/A-RESULTAT.md`.
- Agent B : `work/missions/2026-11-01-renovation/v1/{u4b,u2b,u3b}/**` et `v1/B-RESULTAT.md`.
- Tu lis `v0/` sans jamais y écrire. Ni `src/`, ni l'app, ni un autre dossier.
- **Aucun fichier écrit par heredoc ni par `node -e`** : utilise l'outil Write. Chemins absolus dans Bash.
- Pas de `git stash`, aucun commit, aucune installation, aucun serveur dans `C:/Users/mrspa/Documents/Brasserie`.
- Ne touche jamais `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `functions/.env`.

## Retour
- `v1/<A|B>-RESULTAT.md`, écrit **variante par variante, dès la première** (L18) : l'idée, la table v0 → v1, les sorties des
  contrôles, les captures ouvertes, ce qui tient et ce qui casse.
- Puis une ligne : `RENO-P2-A OK — …` (ou `-B`), ou `… ECHEC — <raison>`.
- `LEÇON PROPOSÉE : …` au besoin.
