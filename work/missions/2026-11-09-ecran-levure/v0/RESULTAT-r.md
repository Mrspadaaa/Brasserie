OK — série r : 4 concepts Levure (r1 froid, r2 tiède, r3 et r4 chauds), COMMUN OK

## Fichiers écrits (tous dans v0/r*/)
- `v0/r1/etat.html`, `NOTE.md`, `capturer-r.mjs` (captures 1280 et un geste par concept, pour les quatre)
- `v0/r2/etat.html`, `NOTE.md` · `v0/r3/etat.html`, `NOTE.md` · `v0/r4/etat.html`, `NOTE.md`
- Captures, par concept : `<id>-haut.png` (premier écran 390), `<id>-page.png` (page entière avec annexe), `<id>-1280.png`, `<id>-geste-avant.png`, `<id>-geste-apres.png`

## Les quatre
- **r1, froid** : la levure en ligne p6-b2 (« 2–3 sachets » à la place des kg), champ « Catalogue ⇄ » + puces, panneau de trois pistes (atténuation avec FG et alcool, température avec la conduite, floculation à renseigner), carte Dose − + avec une règle en grammes.
- **r2, tiède** : le nom est le champ ; des sachets dessinés (2 pleins, 1 hachuré) ; une jauge g/hL de la plage du fabricant, où ② tombe dans la plage et ③ au-dessus ; les repères en 4 pastilles.
- **r3, chaud** : un établi sombre avec trois instruments : un densimètre (1,066 → 1,012–1,015, 78–82 %, 6,8–7,1 % vol), un thermomètre (fiche 18–26, conduite 18–20), une éprouvette (« à renseigner ») ; les sachets en segments 1–4.
- **r4, chaud** : l'étiquette du sachet (en-tête or dentelé, tableau à filets et jauges), la dose dans un tampon ; « ⇄ Comparer » ajoute une colonne sur place ; l'étagère de mini-sachets sous un champ.

## Sorties décisives
- `controle-commun.mjs v0 r1 r2 r3 r4 --page=etat.html --profil=sans-houblons` : **COMMUN OK** (mots, couleurs, survol, blocs, contraste, standard, parlant et brutes OK ; au-style, fiche, trait et légende sautés par le profil).
- `mots-premier-ecran.mjs … --max=80` : **MOTS OK**, r1 75, r2 77, r3 80, r4 76.
- `verifier-page.mjs` : **PAGE OK** × 4. `capturer-r.mjs` : CAPTURES OK. Toutes les captures ont été ouvertes et regardées.
- `controle-panel.mjs` sur les 4 `-haut.png` : **PANEL ECHEC** sur le remplissage. La médiane est de 0,53 pour 0,55 visé ; r2 est à 0,49, sous le plancher de 0,50. La diversité est bonne : ressemblance 0,81, 0 paire identique. La cause est le blanc entre le pied et le +, et les écarts entre blocs de r2. Ce contrôle n'est pas exigé par le BRIEF ; je le signale.
- Honnêteté : la dose est toujours en plage (2–3 sachets, 15–24 g, fiche 50–80 g/hL × 30 L, arrondie au sachet supérieur). FG et alcool sont en plage, calculés de 78–82 %. La floculation est « à renseigner », la biotransformation « non documentée », les esters « faibles ». Aucun prix, aucun « Brouillon », aucun `type="number"`. Le stock est une icône. Pour le second état (puce Nottingham), les données viennent de la fiche du catalogue (`LalBrew Nottingham`).
- Non fait : le thème cave, et les mesures B5 et B9 (rythme, délai des gestes). Les skills `impeccable` et `ui-design-system` n'ont pas été chargés, faute de tours ; `boosters-ux` l'a été.

## Prédiction
Il s'arrêtera sur r3 (« ça c'est parlant ») ou sur r2 pour ses sachets, et dira de r1 « c'est juste la base ».

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : avec la plage du fabricant (50–80 g/hL × 30 L), 2 sachets de US-05 tombent dans la plage (77 g/hL) et 3 au-dessus (115 g/hL). La plage « 2–3 sachets » arrondie aux deux bouts cache que le haut sort de la plage du fabricant : une jauge le montre.
LEÇON PROPOSÉE : aucune.
