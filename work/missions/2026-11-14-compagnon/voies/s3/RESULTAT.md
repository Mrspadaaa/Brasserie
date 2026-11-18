ECHEC — G1 : regex du contrôle de série cassée (\b en gabarit) ; copie corrigée : SERIE OK

## Fichiers écrits (tous dans work/missions/2026-11-14-compagnon/voies/s3)
- `fabrique.mjs` (jetons des deux thèmes, icônes SVG inline, écran du brassin estompé ; préfixe `@-` → `<id>-` par split/join, L26), `capture.mjs` (puppeteer-core, page entière, facteur 2, requêtes http bloquées et comptées : 0).
- Par variante `s3a` à `s3d` : `corps.html`, `style.css`, `etat.html` (assemblé), `<id>-clair.png`, `<id>-cave.png`, `NOTE.md` (≤ 14 lignes).
- `tests.txt` (sortie du contrôle de série).

## Critères
- G1 `controle-serie.mjs … s3a,s3b,s3c,s3d` → `SERIE ECHEC` : « aucune classe préfixée s3x- » pour les quatre. Cause : ligne 26, `new RegExp(\`class=["'][^"']*\b${id}-\`)` ; dans un gabarit, `\b` devient le caractère U+0008 (retour arrière), la regex ne peut jamais réussir (vérifié : `r.test('<div class="s3a-x">')` → false). Même contrôle avec `\\b` (copie dans os.tmpdir) → **SERIE OK** (fichiers, captures > 20 ko, NOTE ≤ 14 lignes, aucun nom de modèle, pas de type="number", aucun appel réseau, 4 cadres).
- G2 s3a → `PAGE OK (4 images chargées, 390 px, sans erreur)` ; G3 s3b, G4 s3c, G5 s3d → idem.
- Texte sous 12 px : 0 dans les quatre pages (mesure de capture.mjs) ; réseau : 0 requête.

## Variantes (id, idée, images ouvertes, défauts vus)
- s3a (froide) — la base, chrome sur une ligne, mode dans le champ ; cadre 1280 en plus (panneau latéral 420 px). Clair et cave ouverts. Défauts : nombres monospace un peu larges dans la phrase ; bas du panneau 1280 vide.
- s3b (tiède) — représentations : feu tricolore, barres avant → après en pointillés, jours en carrés, 9,0 → 7,1 g/L, modes et limites en jauges, jauge de durée 2:29 sur 3:40, chemin coupé hors ligne. Clair et cave ouverts. Défauts : légende de la pile de dry hop à l'étroit ; bas de la réponse peu rempli.
- s3c (tiède) — conversations d'abord : question d'ici en tête, fil à statuts, réponse en cinq lignes-résumés dépliables. Clair ouvert ; cave **non ouverte**. Défauts : bas d'accueil et de réponse peu remplis.
- s3d (chaude) — la cuve parle : on demande en touchant la cuve, le dry hop se redessine dedans. Clair ouvert ; cave **non ouverte**. Défauts : ~300 px vides en bas de l'accueil, de l'attente et de l'erreur ; « 19 °C » collé au bord.
- Les captures finales ont été refaites après un dernier changement mineur du socle (petit logo dans l'écran estompé, mise en page à 390 px pour verifier-page) ; elles n'ont pas été rouvertes.

## Captures
`work/missions/2026-11-14-compagnon/voies/s3/s3a/s3a-clair.png`, `…/s3a/s3a-cave.png`, `…/s3b/s3b-clair.png`, `…/s3b/s3b-cave.png`, `…/s3c/s3c-clair.png`, `…/s3c/s3c-cave.png`, `…/s3d/s3d-clair.png`, `…/s3d/s3d-cave.png`.

Prédiction : « La b me parle, les barres 85 → 70 g et le feu, ça se lit sans lire ; la cuve, c'est une idée, mais l'écran est à moitié vide. »

DÉCISION À PRENDRE : corriger `outils/controle-serie.mjs` ligne 26 (`\b` → `\\b`, ou `String.raw`) ; hors de mon OWNS. Sans cette correction, aucune série (s1, s2, s3) ne peut rendre SERIE OK.

DEMANDE EXECUTANT :
1. Après correction du contrôle : `node work/missions/2026-11-14-compagnon/outils/controle-serie.mjs work/missions/2026-11-14-compagnon/voies/s3 s3a,s3b,s3c,s3d > work/missions/2026-11-14-compagnon/voies/s3/tests.txt` → attendu `SERIE OK`.
2. Ouvrir en image `s3c/s3c-cave.png` et `s3d/s3d-cave.png` (non ouvertes, contexte de l'agent plafonné), puis les huit captures finales, et signaler tout texte illisible ou débordement.

CONNAISSANCE : `verifier-page.mjs` sans option exige au moins une image chargée (`--min-images 1` par défaut) et aucun débordement à 390 px : une planche de cadres côte à côte doit passer en colonne sous 600 px et porter une image (data URI suffit).
LEÇON PROPOSÉE : un contrôle neuf s'éprouve sur un témoin qui doit réussir autant que sur un témoin qui doit échouer (ici, la regex échouait sur tout).
