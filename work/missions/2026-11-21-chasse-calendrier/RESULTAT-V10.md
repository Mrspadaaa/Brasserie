OK — V10 : CHD-2, CHV-16, CHV-17 corrigés dans Courbe.tsx et entete.css ; contrôles rouges sur tour8, verts sur l'arbre (commit 06b215e72)

## Fichiers (commit 06b215e72, par chemins, index temporaire)
- `src/ui/calendrier/entete/Courbe.tsx`, `src/ui/calendrier/entete/entete.css`
- `tests/unit/calCourbeV10.test.ts` (7 tests, neufs)
- `scripts/parcours/chaines-v10.mjs` (bloc distinct, comme V7 ; étapes CH-D2, CH-V16, CH-V17)
- `work/missions/BUGS.md` : mes 3 lignes passées à « corrigé | 06b215e72 » ; `controle-bugs.mjs` : BUGS OK (1617 bugs, 165 ouverts).

## Ce qui change
- CHD-2 : `placerNoms` additionne les mouvements de même nom DANS la semaine nommée (deux « Emballage · Jhhh » de −45) : une étiquette « Emballage ×2 −90 » (infobulle « Emballage · Jhhh ×2 »). Un récurrent d'une autre semaine reste nommé une fois, à sa première semaine, sans « ×2 ». Deux mouvements opposés qui s'annulent ne font pas d'étiquette.
- CHV-16 : décision « supprimé » : `.ent-pt` n'est plus peint (`fill: none`). Les cercles restent dans le DOM comme repères de position (3 tests les lisent : B3, n° 25, n° 11).
- CHV-17 : (a) `geometrie` laisse au moins 7 px sous la valeur la plus basse d'un solde négatif (avant : 6 % = 3,8 px en 2 sem., le trait touchait le cadre ; en paysage de 60 px le tracé garde 30 px d'étendue) ; (b) quand aucun mouvement n'est nommé, `placerNiveau` écrit « Solde −1 103 » (la semaine du milieu du cadre), hors du tracé et des exclusions. L'étiquette est un texte `data-niveau-courbe`, sans `data-nom-courbe`.

## Preuves
- `node scripts/parcours/chaines-v10.mjs <dir> --ref en-ligne/2026-11-21-tour8 --caps --largeurs 390,1280` : 12/12 KO (D2 : « Emballage −45 » ; V16 : 57 cercles gris sans légende ; V17 : trait à 3,1 px, aucune étiquette, cadre à 93-99 % d'une couleur).
- Même commande sur l'arbre : « CHAINES V10 OK » (D2, V16, V17 × 390/1280 × clair/cave = 12/12). V17 : part de couleur dominante du cadre 78-86 % (seuil 90 %).
- Captures ouvertes (arbre) : `CH-V17-390-clair-2s(-courbe).png`, `CH-V17-1280-cave-2s-courbe.png` (« Solde −1 103 » lisible au-dessus du trait, trait à ~8 px du bas du cadre), `CH-D2-390-cave-6s-courbe.png` (« Emballage ×2 −90 » sur sa marche), `CH-V16-390-clair-an.png`. Dossiers : %TEMP%/cv10-tour8, cv10-arbre, cv10-final.
- `tsc --noEmit` propre ; vitest : calCourbeV10, calFrisePrixNoms, calendrierCaisse, calendrierEntete (110), calendrierLotB, calendrier-onglet verts après le dernier changement (calendrierEntete et LotB rejoués après le réglage à 7 px).

## Doutes et limites
- « Cadre non uniformément rose » est mesuré en pixels (couleur dominante < 90 %), pas par la zone sous zéro : la teinte sous zéro est voulue (CAL-PASSE) et couvre tout le cadre d'un solde entièrement négatif ; ce qui change, c'est le trait visible, le niveau écrit et la teinte plus claire sous le trait.
- Le test calendrierEntete n° 11 (paysage 60 px, étendue ≥ 30 px) a fait reculer mon premier réglage (10 px) à 7 px.
- Les cercles `ent-pt` non peints restent du code mort côté rendu (tests seuls) : à retirer si le pilote préfère réécrire ces trois tests.
- Fenetre.tsx, EnTete.tsx (V8) non touchés ; `git status` les montre modifiés par V8 seulement. Parcours pas fusionné dans chaines.mjs (le pilote fusionne).

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
