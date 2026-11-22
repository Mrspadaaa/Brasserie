OK — 4 mini maquettes « le geste et le temps », 4 cadres, clair et cave

## Variantes
- s2a (froide) — attente en frise d'étapes + chrono 28 px + jauge de durée du mode ; l'erreur réemploie la frise (où ça s'arrête). Images ouvertes : clair et cave oui. Défauts vus et corrigés : cadres à moitié vides (ajout « Tourne ailleurs », réponse précédente), replis centrés. Reste : ~80 px vides en bas de l'erreur.
- s2b (tiède) — réponse = gestes à cocher (geste · dose · jour), rappel daté jeu. 19.11 09:00, Citra J+2 marqué « pour la recette » (passé). Images ouvertes : clair oui (avant retouche) ; cave non. Défauts vus et corrigés : interrupteurs étirés, date de l'en-tête sur 2 lignes.
- s2c (chaude) — « Combien de temps as-tu ? », règle 0 → 3:40 (zones Auto, Approfondi), « Déjà calculé » pendant l'attente, la pile devient l'avant → après (171 → 134 g, 9,0 → 7,1 g/L). Images ouvertes : clair oui (avant retouche) ; cave non. Défauts vus et corrigés : interrupteurs étirés, « 3 min » et « 3:40 » superposés.
- s2d (chaude) — la conversation sur la frise J+0 → J+12 : doses en barres, « 2 j de marge » avant Galaxy, proposition dessinée sur la frise. Images ouvertes : clair oui (avant retouche) ; cave non. Défauts vus et corrigés : interrupteurs étirés, « 2 j de marge » sous la pastille de question.

## Fichiers écrits (tous dans voies/s2)
- `s2a/ s2b/ s2c/ s2d/` : `source.mjs`, `etat.html`, `<id>-clair.png`, `<id>-cave.png`, `NOTE.md`
- `outils/commun.mjs` (jetons DESIGN.md des deux thèmes, icônes au trait, cadre 390 × 760), `outils/construire.mjs` (construit et capture)
- `tests.txt`

## Critères (rejoués depuis la racine)
- G1 `controle-serie.mjs … s2a,s2b,s2c,s2d` → `SERIE OK` (après la correction du `\b` par le pilote ; avant : « aucune classe préfixée », car `\b` dans un gabarit JS est le caractère retour arrière).
- G2 à G5 `verifier-page.mjs <id>/etat.html` → `PAGE OK (1 images chargées, 390 px, sans erreur)` ×4. Pour l'obtenir : planche empilée sous 500 px, et une marque en image locale (data:, sans réseau).
- Construction : aucune erreur de script, aucune requête réseau, aucun débordement horizontal dans les 16 cadres.

## Captures
`work/missions/2026-11-14-compagnon/voies/s2/s2{a,b,c,d}/s2{a,b,c,d}-{clair,cave}.png`

## Prédiction
« s2c et s2d, là on parle de mon brassin et de mon temps : j'aime ; s2a c'est propre mais c'est la même chose en mieux rangé. »

## DEMANDE EXECUTANT
Contexte de l'agent au plafond (≈ 190 k) : les dernières captures n'ont pas été rouvertes après la passe de retouches.
1. Ouvrir en image `s2b-clair.png`, `s2c-clair.png`, `s2d-clair.png` (retouches : interrupteurs à 36 px, règle sans « 3 min », pastille au-dessus de « 2 j de marge »).
2. Ouvrir `s2b-cave.png`, `s2c-cave.png`, `s2d-cave.png` : contraste du texte coloré (hop, attention, eau) sur fond cave.
3. Au besoin, rejouer `node work/missions/2026-11-14-compagnon/voies/s2/outils/construire.mjs` puis les 5 critères. Sorties attendues : `SERIE OK`, et `PAGE OK` ×4.
Le jugement de ces images reste au concepteur ou au critique c1.

DÉCISION À PRENDRE : s2b introduit un rappel daté (notification à date fixe), une notion neuve hors de la base. Elle est à confirmer au port si le brasseur choisit s2b.

CONNAISSANCE : la proposition du banc (Citra J+2 85 → 70 g) vise le brouillon de recette alors que le brassin 31 est à J+4 : l'apport J+2 est passé. Une maquette doit dire « pour la recette », sinon le geste est faux (L14).

LEÇON PROPOSÉE : un contrôle écrit dans un gabarit JS avec `new RegExp(\`…\b…\`)` ne garde rien, car `\b` y devient un retour arrière. Il faut éprouver chaque contrôle neuf sur une page qui doit passer, pas seulement sur une page qui doit échouer (L13).
