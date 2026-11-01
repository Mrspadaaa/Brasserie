OK — r4e-a et r4e-b : VOLEE OK, GESTES OK

Voie p5 (concepteur, 31.10). Plainte D211 : « Mais ça inclus pas les besoins que j'ai à la volée ??? ». Plateau : « Toujours visible » (D212).
Base : `v3/r4d/etat.html` copiée telle quelle (v3 non touchée), puis seuls les gestes de la ligne changent ; `#replie` retiré (le plateau
est visible dans tous les états, contrôlé par les deux `capturer.mjs`, l'ancien `#replie` compris).

## Fichiers écrits
- `work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-a/etat.html`, `capturer.mjs`, 9 captures `r4e-a-*.png`
- `work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-b/etat.html`, `capturer.mjs`, 9 captures `r4e-b-*.png`
- ce fichier. Rien d'autre (outils de planche et de mesure des cibles dans le scratchpad, hors dépôt).

## Critères (rejoués depuis la racine après la dernière retouche)
| | r4e-a | r4e-b |
|---|---|---|
| G1 / G8 `controle-volee.mjs` | VOLEE OK (10) | VOLEE OK (10) |
| G2 / G9 `controle-gestes-ligne.mjs` | GESTES OK (8) | GESTES OK (8) |
| G3 / G10 `verifier-page.mjs` | PAGE OK (390 px, sans erreur) | PAGE OK |
| G4 / G11 `mots-premier-ecran.mjs` | 73 mots, MOTS OK | 76 mots, MOTS OK (r4d : 76) |
| G5 / G12 `controle-commun.mjs --sans=couleurs` | COMMUN OK | COMMUN OK |
| G6 / G13 `controle-contraste.mjs` | CONTRASTE OK, pire 4,85:1 (celui de r4d) | CONTRASTE OK, 4,85:1 |
| G7 / G14 `controle-hauteur.mjs` | HAUTEUR OK (1,04 écran) | HAUTEUR OK (1,04 écran) |
| G16 / G17 `capturer.mjs` | CAPTURES OK | CAPTURES OK |
Mesure hors GATES (script du scratchpad) : cibles de la liste, au repos, à 8 lignes (`#huit`), en `#fruit`, menu ouvert, couleur ouverte :
0 cible sous 24 px, 0 chevauchement, dans les deux (r4d : 0 / 0). G15 `systeme.mjs note --contient "D211,Toujours visible,captures"` : NOTE OK.

## r4e-a — le chiffre se tape, le mot ouvre son menu sous la ligne
- **Part** : « 19 » est un champ (16 px mono, comme la masse, `inputmode="decimal"`), suivi de « % du grain ». Un toucher : l'ancienne part
  en gris, la frappe la remplace ; la masse de la ligne suit pendant la frappe (à 10 g près), le total du grain change, les autres masses
  jamais. Échap, un champ vide ou une part impossible (100 %) rendent la masse d'avant, sans message. ↑ ↓ par 1 %.
- **Moment** : « empâtage ⌄ » est un bouton ; le menu (empâtage, ébullition, fermentation J+[3]) s'ouvre **dans** la ligne, sous elle, et
  pousse ce qui suit ; il se ferme au choix, à Échap, au toucher ailleurs (qui ne déplace pas le plateau). Le jour se tape dans le menu.
- **Couleur** : le « ? » devient un champ EBC à sa place ; la teinte remplit le champ pendant la frappe ; Entrée : la pastille prend la
  teinte, « 3 couleurs à renseigner » passe à 2. 1 à 1500, virgule acceptée ; hors plage, la valeur d'avant revient. Depuis le compte
  « N couleurs à renseigner », Entrée passe au « ? » suivant (Échap arrête).
- Captures ouvertes : `r4e-a-repos`, `-part-pendant` (Grain 9,29 kg, Pilsner 54 %), `-part-apres`, `-moment-pendant` (menu dans la ligne),
  `-moment-apres`, `-couleur-pendant` (« 8 » sur fond doré), `-couleur-apres`, `-retrait-apres`, `-1280`.

## r4e-b — la barre se tire, le mot tourne d'un toucher
- **Part** : la barre de la ligne (8 px, une encoche au bout du remplissage, cible 24 px, `role="slider"`) se tire au doigt : 0 à 100 % sur
  sa largeur, la masse suit au cran de la piste du plateau (50 g sous 1 kg, 100 g au-dessus) ; pendant, la barre s'épaissit et prend un
  pouce, la part et la masse passent en gras. Un toucher sans glisser ne change rien ; un défilement vertical rend la masse d'avant ;
  ← → au clavier.
- **Moment** : « empâtage ⇄ » (le signe du bouton de famille, qui tourne aussi) passe au suivant d'un toucher ; « Annuler » 6 s, à la
  place de la part, rend le moment d'avant la série de touchers. En fermentation, la pastille lit « J+[3] » : le jour s'y tape.
- **Couleur** : comme a.
- Captures ouvertes : `r4e-b-repos`, `-part-pendant` (doigt posé, pouce noir, 2,8 kg), `-part-apres`, `-moment-pendant` (« ébullition »
  et « Annuler »), `-moment-apres` (après 6 s), `-couleur-pendant`, `-couleur-apres`, `-retrait-apres`, `-1280`.

Chemins des captures : `work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-a/` et `.../v4/r4e-b/`.

## Écarts à r4d (chacun pour un geste)
- Le chiffre de la part passe à 16 px mono en a (texte saisi à 16 px, DESIGN.md) ; un chevron (a) ou ⇄ (b) après le moment.
- Les deux rangs de la ligne s'écartent de 7 px pour que le nom et le moment/part restent deux cibles de 24 px sans chevauchement :
  3 lignes, même hauteur de page (1,04) ; 8 lignes, 1,02 écran au lieu de 0,95 (plafond 1,05).
- « 3 couleurs à renseigner » ouvre le champ de la ligne au lieu du plateau. Le plateau garde − +, la piste, son moment et son EBC.

## En brasseur, entre a et b
a se lit sans apprendre : chaque chiffre de la ligne se tape, chaque mot ouvre ses trois choix ; c'est le plus sûr pour une recette
recopiée (« 30 % de blé »). b est plus rapide au doigt (un toucher pour l'ébullition, la barre pour doser au jugé), mais la barre ne fait
que 86 px à 390 et le cycle fait passer par fermentation pour revenir à l'empâtage. Je prendrais a pour la part et b pour le moment ;
c'est une greffe possible, à lui montrer côte à côte, pas à trancher ici.

Phrase prédite : « Là oui, je change tout sur la ligne sans ouvrir le plateau ; le pourcentage tapé c'est ce que je veux, la barre c'est
joli mais trop petite pour mon pouce. »

DÉCISION À PRENDRE : sur la page de choix, montrer a et b côte à côte (L24) ; une greffe a-part + b-moment est possible si le brasseur hésite.

CONNAISSANCE : une ligne qui porte deux rangs de cibles (nom, puis moment et part) demande 48 px de pas au moins pour des cibles de
24 px sans chevauchement ; la ligne serrée de r4d (40 px) ne suffit plus.

LEÇON PROPOSÉE : aucune
