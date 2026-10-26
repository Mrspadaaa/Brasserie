# cmz1 · Comparer, dans la brasserie

Série cmz (libre, brief minimal). **Chaleur : tiède** (la forme de l'approche : le « quand » est un lieu de la brasserie).
Base : l'écran Comparer de la maquette jouable (règle n° 1, sa capture `captures/brasseur-base-reprise.jpg`), reprise
en entier : coquille (croix, onglets), titre-question, contexte 16D · 4 g/L · US-05, « ~ simulé », Au style | Absolu, radar
r2 à 12 axes, colonne Ta stout (♣ ↓, ❀ ↑, ton Nugget en pointillé, ＋), têtes (nom, α du lot ou des fiches, rôle, familles
marquées grandes, ~✓ dans / ~⚠ hors, « lui seul »), ⇄ et × sous chaque tête, rangées l5b des familles avec Floral ↑ et
Résineux ↓ chiffrés, « inconnus, pas zéro », réponse ★, « Placer <retenu> › », dock Défi · Égaler · Valeurs · Preuve · Frise · Souche.

## L'idée (une seule) — `data-greffe="schema-brasserie"`
Sous le contexte, la brasserie dessinée au trait : la cuve d'ébullition et sa flamme (deux minuteries : 60′, 10′), le
whirlpool (tourbillon), le fermenteur qui bulle (dry hop actif, 3 j) et le fermenteur calme (dry hop après, 3 j). Chaque
station est un toucher ; la station choisie se remplit de la couleur du houblon retenu, et un point à la couleur du
houblon qui mène le floral s'allume sous chaque station (rien à 60′ : égalité). Le radar, les têtes (verdict dans /
hors, « lui seul »), les rangées et la réponse passent à ce moment. Ce que ça apprend sans toucher : Galaxy mène à chaud
(10′, whirlpool) mais sort de ta 16D dès le whirlpool ; Idaho 7 mène au dry hop.

## Ce qu'il a demandé, et où c'est
1. **Choisir quand** : le schéma, `[data-role="quand-comparer"]`, cinq moments (60′, 10′, whirlpool, actif, après).
2. **Hors 16D bien montrés** : le chip noir sous chaque tête, `[data-role="hors-16d"]` : « citron vert », « orange +4 »,
   « ◇cannabis +4 » ; ◇ = hors des 12 familles ; la liste entière dans le libellé et dans la fiche (appui long).
3. **Les huiles** : `data-greffe="huiles"` dans chaque tête : goutte, barre sur 0–5 mL/100 g, plage des fiches (Galaxy
   1,8–5, Cascade 0,5–2,6, Idaho 7 1–3). Galaxy se voit « hyper aromatique » d'un coup d'œil.
4. **Moins de texte** : 93 mots au premier écran (base : 114). « Ses mots » et le panel OSU ne sont plus au premier écran
   (le panel reste au dock « Preuve », non joué dans cette mini maquette).
5. Ses autres commentaires : retirer ×, remplacer ⇄, chercher ＋ (recherche sur tout le catalogue, D137) ; ton Nugget en
   référence au même moment (pointillé dans chaque barre, D107) ; « ~ simulé » explique à un toucher (D122) ; radar r2
   superposé gardé tel quel (« on va en parler »).

## Données (moteur de la maquette, 25.10, `donnees-moteur.ts` dans ce dossier, lancé par vite-node)
`lireColonnes` de `parcours/src/ecrans/comparer/calcul.ts`, 4 g/L, US-05, aux cinq moments où le moteur simule l'arôme
(60′, 10′, whirlpool, dry hop actif 3 j, après 3 j ; 30′ et 0′ rendent 0 = non simulé, donc absents). Floral gagné en
crans : Cascade 0,07 / 0,51 / 0,53 / 0,83 / 0,89 ; Idaho 7 0,11 / 0,73 / 0,74 / 1,21 / 1,25 ; Galaxy 0,13 / 0,94 / 0,94 /
0,85 / 0,85. IBU 60′ : 52 / 101 / 137 ; 10′ : 19 / 37 / 50 ; whirlpool : 8 / 15 / 21 ; à froid : « ? », jamais 0. Huiles,
α et mots : `valeurs.ts`, `sesMots`. Motueka et Nelson Sauvin (sa capture) : mêmes sources, `captures/cmz1-nelson.png`.

## Ce qui tient
- La base jouable est intacte au premier plan ; l'ajout coûte 120 px et se lit en trois secondes (une cuve, une flamme).
- Les quatre gestes marchent : × retire, ⇄ remplace à la même place, ＋ cherche « nelson » et ajoute, toucher une station
  change radar, rangées et verdicts (contrôlé : GESTES OK, QUAND OK).

## Ce qui casse ou reste douteux
- Le dessin de la brasserie est le mien : à lui de dire si la cuve et le fermenteur se reconnaissent.
- Le dock est présent mais ses feuilles (Défi, Égaler…) ne sont pas jouées : un toucher le dit. Le Défi n'affiche plus de
  score (la base calcule 2/4 ; ici il serait inventé).
- L'α du Nugget n'est pas au premier écran (comme la base, D40 bis) : appui long sur « Nugget » ouvre sa fiche avec α 13,0 %.

## Contrôles (joués une fois, depuis la racine)
- `mots-premier-ecran --max=100` : 93 mots, MOTS OK. `controle-pictos-trait` : 45 pictos, 0 faute, TRAIT OK.
- `controle-quand-comparer` : OK — 4 moments (60′, 10′, wp′, dry hop), les valeurs changent. QUAND OK.
- `controle-hors-16d --min=3 --premier-ecran` : HORS-16D OK (citron vert ; orange +4 ; ◇cannabis +4).
- `controle-panel` (cmz1 à cmz4) : remplissage médian 0,65, ressemblance 0,89, 0 paire identique : PANEL OK.
- `controle-commun --sans=mots` : couleurs, au-style, survol, blocs, contraste, fiche, trait, légende, parlant, brutes OK ;
  standard ECHEC (indicatif, voir RESULTAT). `controle-alpha` : ALPHA OK sur cmz1.
- Gestes joués au doigt (script dans le dossier temporaire) : GESTES OK ; largeur 390, 0 erreur de page.

Captures : `captures/cmz1.png` (repos, dry hop après), `cmz1-moment.png` (10′ touché), `cmz1-long.png`, `cmz1-nelson.png`
(Motueka face à Nelson Sauvin), `cmz1-plus.png` (＋ ouvert, recherche « nelson »).
