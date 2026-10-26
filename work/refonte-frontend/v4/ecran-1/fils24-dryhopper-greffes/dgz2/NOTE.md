# dgz2 — « Trois plans, un moment chacun » (voie dgz, 24.10 soir)

**Chaleur : chaude.** Greffe `trois-plans-w2` : les trois plans de w2 (« Ça c'est vraiment très intéressant »), Sage ·
Franc · Osé côte à côte, entre la figure de p4b2f et les 12 barres.

## La base, gardée
L'écran Dryhopper de la maquette jouable, tel qu'il se joue : même shell, même bundle, même moteur, mêmes gestes ; greffe
injectée après le rendu (`window.__parcours.moteur`, `envoyer({ type: 'moment' … })`). Rien de la base n'est retouché.

## L'idée
Dans w2, chaque plan variait dose, jours, moment et levure ; ici l'outil n'a qu'un facteur libre, le moment (D98, L10) : les
trois plans sont **trois moments**, et rien d'autre ne bouge.
- **Sage** (vert) : 0′, feu coupé — « ≈ interpolé entre 10′ et whirlpool », IBU ~60, floral ≈+14.
- **Franc** (noir, ★) : actif · 2 j — « mesuré linalol 38 µg/L », floral ~+22, IBU 60+?.
- **Osé** (violet) : après · 3 j — floral ~+23, résineux ~+20 **hors style**, « mesuré 1 h ≈ 96 h ».
Chaque carte : moment, floral en gros (18 px), baies et résineux (orangé quand hors style), IBU (orangé si trop amer), une
ligne d'honnêteté. Toucher une carte pose le rail à ce moment ; la carte tenue porte ✓ et son liseré ; le rail et les
sauts d'étape de p4b2f reposent la carte en retour.

## Ce qui tient
Capture `dgz2-geste.png` : Osé touché → rail à après · 3 j, bandeau ~+23 · ~+23 · ~+20, « contre ★ : floral ~+1 · résineux
~+6 », pied « mesuré 1 h ≈ 96 h au nez (Titus 2021, sur Cascade) ».

## Ce qui casse
- Les cartes prennent ≈ 150 px : trois barres seulement restent au premier écran (le reste défile).
- Les trois moments sont choisis par moi (0′, ★, après 3 j) : en passe 2, le brasseur pourrait vouloir ses propres repères.

## Contrôles
| critère | sortie |
|---|---|
| `variantes.mjs` (G1) | VARIANTES-BIEN-4 |
| `controle-pictos-trait --page=etat.html` (G2) | TRAIT OK (26 pictos, 0 faute) |
| `controle-commun --sans=mots` | COMMUN OK |
| `controle-une-question` | UNE-QUESTION OK (libres : moment ; 12 contrôles, les trois plans dans `data-libre="moment"`) |
| `mots-premier-ecran --max=80 --sans-donnees` | MOTS OK |
| `controle-panel` (4 captures) | remplissage médian 0,73 ; DIVERSITÉ ECHEC (ressemblance 0,95) : base commune par contrat |
| `controle-choix --ecran=dryhopper` (base jouable) | CHOIX OK |

Captures ouvertes : `captures/dgz2.png`, `captures/dgz2-geste.png`.
