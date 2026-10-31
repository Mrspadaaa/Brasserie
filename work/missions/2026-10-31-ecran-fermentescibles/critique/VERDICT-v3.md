PRÊT À MONTRER — r4d : r4c reprise telle quelle, les quatre gestes sur la ligne en 1 toucher ; 0 bloquant, 0 majeur à corriger, 5 détails (1 à corriger en une ligne)

Critique t4 (Fable calibré, PORTRAIT v2), 31.10. Lu : VOIE.md p4, RESULTAT.md p4, `v3/r4d/NOTE.md`, `v3/r4d/etat.html` (diff complet contre
`v2/r4c/etat.html`), `v2/r4c/NOTE.md`, VERDICTS-v2 § r4c, D208 et D209. Captures ouvertes une à une (L12) : r4d -repos, -replie, -masse-pendant,
-retrait-apres, -detail, -1280 ; r4c -repos, -1280, -huit en face. Page jouée moi-même (`critique/t4/jouer.mjs`) : t4-masse-fantome (390), t4-1280-fantome,
t4-retrait-zoom, t4-huit ; `controle-gestes-ligne.mjs … --etats=,replie` rejoué : GESTES OK (16).

## 1. r4c reprise telle quelle hors des gestes de la ligne ? Oui.
Diff hors script : une colonne de 24 px pour le × (`grid-template-columns:24px 1fr auto 24px`), le style de la ligne choisie passé de `aria-selected`
à `aria-current` (même dessin : cadre 2 px, pointe à droite), un × « fermer » dans l'en-tête du plateau en `#replie` seulement, une phrase de plus
dans l'annexe (hors premier écran), un `aria-label` du plateau. Ticket, bandeau, plateau clair, piste et pouce noir, carte des repères (rendement,
style 1,060–1,085, « 3 couleurs à renseigner », échelle 0–40 et crochet 6–14), OG « — », sucre en ligne, « 100 % ferm. » / « 0 % ferm. », bandeau
« Lactose : … », puces, pied, + : identiques, pixel pour pixel à l'œil, sur r4d-repos / r4c-repos, r4d-1280 / r4c-1280 et t4-huit / r4c-huit. Chaque
écart visible est le geste qu'il a demandé (D209) : il le reconnaîtra. Pas de D105.

| n° | gravité | état et largeur | écart (capture) | correction attendue |
|---|---|---|---|---|
| 1 | détail | repos et #replie, 390 et 1280 | Un × gris de 14 px (cible 24 × 32) en bout de chaque ligne ; la masse recule de 24 px (r4d-repos vs r4c-repos, r4d-1280 vs r4c-1280). À 8 lignes, une colonne de 8 × (t4-huit), gris #808080, rien ne chevauche (mesuré). | Aucune : c'est « supprimer à la volée », son mot. La page de choix le nomme comme seul changement visible au repos. |
| 2 | détail | repos, 390 | La place laissée par la ligne retirée fait 34 px, la ligne en faisait 50 (40 en serré) : la liste remonte de 16 px au retrait, puis encore à la fin des 6 s (t4-retrait-zoom, r4d-retrait-apres : Haferflocken monte de 466 à 430 px ×2). NOTE dit « laisse sa place » : pas tout à fait. | `.r4d-ote{min-height:50px}` (40 px sous `body:not(.r4b-ample)`), une ligne. À faire par le pilote avant la page : un saut de liste sous le doigt, c'est ce qu'il remarque (« je pose le doigt et je regarde ce qui bouge », PORTRAIT § 3.5). |
| 3 | détail (coût de l'état, pas une faute) | #replie, 390 | À 3 lignes, le pied s'arrête à 616 px et 228 px restent vides avant le + (r4d-replie). C'est la plainte v1 sur r4b (« 220 px de blanc sous le pied », D4, D149) qui revient dans ce seul état. | Aucune ici : il choisit entre les deux états sur la page, qui doit montrer ce vide tel quel, pas le masquer. S'il prend #replie, le détail s'attache sous la ligne (accordéon) au lieu du bas de page. |
| 4 | détail (coût de l'état) | #replie, 390 | Le détail ouvert par le nom apparaît 346 px sous la ligne touchée (ligne à 186, plateau à 582 ; mesuré, r4d-detail) : l'œil saute, le plateau n'est pas « attaché ». Au repos c'est la place de r4c, qu'il a choisie : pas un écart. | Aucune : à dire sur la page de choix (« le détail s'ouvre en bas »). |
| 5 | détail (goût prêté, L27) | repos, 390 et 1280 | Pendant la frappe sur Weizenmalz, le cadre et le plateau restent sur Pilsner (r4d-masse-pendant) : deux lignes « courantes » à la fois. C'est la consigne du pilote (« sans ouvrir ni changer le plateau ») et ça évite que le plateau bouge sous la main. | Aucune avant qu'il le dise. Si « ??? » : la frappe sur une masse déplace aussi le cadre (une ligne dans `focusin`), sans ouvrir en #replie. |

Rien de bloquant : aucun refus explicite de SPEC ou de DEFAUTS ne revient (pas de dialogue de confirmation, pas de `type="number"`, pas de
surbrillance système, pas de texte ajouté au premier plan : 76 mots, sous les 80 de r4c, pas de bouton par ligne au-delà d'un signe).

## 2. Ses mots sont-ils servis ? Oui, 1 toucher partout.
Touchers d'écran, depuis le repos, mêmes comptes à 390 (tactile) et à 1280 (souris ; Tab enchaîne les masses sans clic) ; dans les deux états :
- **Modifier** : 1 toucher sur le chiffre, « 2,5 », Entrée (ou « OK » du clavier). r4c : 2 (la ligne, puis la lecture du plateau). Le bandeau,
  la part et la barre suivent la frappe (r4d-masse-pendant : Grain 9,0, 28 %). Le plateau ne bouge pas.
- **Retirer** : 1 toucher sur le ×, sans dialogue ; revenir : 1 toucher sur « Annuler », la ligne reprend sa place avec sa masse (contrôle). r4c : 2.
- **Ajouter** : 1 toucher dans le champ, « Cara 0,3 », Entrée : la ligne naît à 0,30. « Munich », Entrée : le curseur attend dans la masse de la
  ligne, Entrée ramène au champ d'ajout (la pesée suivante). Une puce : 1 toucher, ligne à 0, curseur dans sa masse. Doublon « pils » : vers la masse
  de Pilsner, 4 lignes. Même compte que r4c, mais le curseur reste dans la liste au lieu de descendre au plateau.
- **Plus d'informations** : 1 toucher sur le nom (ou la ligne hors du chiffre et du ×) : le plateau (piste, − +, moment, EBC, corbeille) se pose sur
  cet ingrédient (repos) ou s'ouvre (#replie, refermé par le même toucher, le × ou Échap). Comme r4c.
Cockpit : non. Au repos, chaque ligne ajoute un seul signe gris ; le chiffre a l'air d'un nombre (sans cadre, souligné seulement au toucher ; au
survol souris, un pointillé). Ce qui ferait basculer en cockpit, et qui n'y est pas : un − + par ligne, un cadre de formulaire autour de chaque
masse, un « Annuler » permanent. Le seul élément lourd est le pilule noire « Annuler » (même poids que « Suivant ») : il dure 6 s, sous le doigt ;
je le signale, je ne le compte pas.

## 3. Les deux états du plateau (sans trancher : il choisit sur la page)
- **Repos** (r4d-repos, r4d-1280). Lui donne : le plateau de r4c, celui qu'il a choisi, toujours là ; − + et la piste du malt courant à un toucher,
  sans rien ouvrir ; l'écran rempli jusqu'au pied (0,93), à 8 lignes le plateau reste dans le premier écran (619–756, t4-huit). Lui coûte : 137 px
  de premier écran pris par un ingrédient qu'il ne touche pas forcément ; deux « courantes » pendant une frappe (n° 5) ; la corbeille du plateau fait
  double emploi avec le × (elle passe par le même retrait annulable, donc sans risque).
- **#replie** (r4d-replie, r4d-detail). Lui donne : une liste nue, rien ne s'ouvre tant qu'il ne le demande pas, c'est mot pour mot « sans ouvrir une
  sous-vue… mais si je click sur un » ; le pied remonte à 616 px, l'écran respire. Lui coûte : 228 px vides sous le pied à 3 lignes (n° 3, sa plainte
  de r4b) ; le détail s'ouvre loin de la ligne (346 px, n° 4) ; − + et la piste sont à un toucher de plus (le nom d'abord) ; un second toucher pour
  refermer. À 8 lignes, le vide disparaît et les deux états se valent.

## 4. La masse vidée au toucher, l'ancienne valeur en gris : juste.
Vérifié (t4-masse-fantome, t4-1280-fantome) : au toucher, « 1,5 » reste lisible en gris #8A8A8A, mono 16 px, souligné, curseur à droite ; ça se lit
« à remplacer », pas « effacé ». Échap rend 1,5 ; sortir sans frapper rend 1,5 (joué : ECHAP 1,5, BLUR-VIDE 1,5) : le chiffre n'est jamais perdu.
Pourquoi juste : une masse de pesée se retape (2 à 4 signes), elle ne se corrige pas au caractère ; « 1,5 → 2,5 » avec le curseur au bout demande
Retour arrière, deux touches et l'erreur du « 1,52,5 » ; le `select()` système qui ferait la même chose a été refusé en r4c (correction 6,
« lecture à 0 sans surbrillance système ») et le gris est son équivalent honnête, dans la convention du « 0 » ocre. Pour un petit ajustement, ↑ ↓ par
cran à l'ordinateur et − + du plateau au téléphone restent là. Garder tel quel ; ne rien dire sur la page, il le sentira sous le doigt.

## 5. La phrase qu'il dirait
« Là c'est ce que je voulais : je tape direct sur le kilo, la croix vire la ligne et je peux annuler, et si je clique sur le nom j'ai le plateau. Replié
ça fait vide en bas, je garde le plateau ouvert… mais quand je tape sur une ligne, le cadre reste sur l'autre, c'est bizarre. »

Verdict : **PRÊT À MONTRER**, après le n° 2 (une ligne, pilote) ; pas de relance. Les deux états vont côte à côte sur la page de choix, avec les
coûts du n° 3 et du n° 4 écrits en une ligne chacun. Le choix entre dans `choix/ecrans-app.json` après son accord (D208).

LEÇON PROPOSÉE : aucune
