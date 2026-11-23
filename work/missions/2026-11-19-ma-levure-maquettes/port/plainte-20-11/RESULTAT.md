OK — plainte levure 20.11 : plan A à D et 390 commités (211739212, b791554b6), non déployé

## Fichiers (worktree port-carnet, branche claude/port-carnet-1711)
- 211739212 : src/ui/etapeLevure/{dose.ts, CarteDose.tsx, MaLevure.tsx, apercuDev.ts}, src/ui/FermentationTemperatureChart.tsx,
  src/ui/YeastRecipePlan.tsx, tests/integration/etapeLevure/{plainte2011 (neuf, 13 tests), maLevure1911, etapeDose}.test.tsx.
- b791554b6 (390) : CarteDose.tsx, maLevure.css, FermentationTemperatureChart.tsx.
- etapeDose « liquide sans cellules » réaligné : rien n'est écrit au choix (qty indéfinie), la carte propose des packs estimés (> 0, jamais 0).
- Commit par chemins, sans push ni déploiement.

## Preuves
- `npx tsc --noEmit` : 0 erreur.
- vitest tests/integration/etapeLevure + tests/unit/levureMontage.test.tsx + tests/integration/monkey.test.tsx : 19 fichiers verts (monkey compris, vert ce tour).
- Vision : `node vision-apres.mjs` sur le banc ml-banc (b3af06b83 + fichiers de la voie), 390×844 et 1280×900, clair et cave :
  0 erreur console, 0 débordement relevé, gestes joués (+, −, remède → 22 g, Caler à 11 °C, US-05 +, palier ↕ et ↔ tirés, changer → Munich à 1280).
- Captures ouvertes : apres/clair-390-munich-1-repos.png, cave-390-munich-2-plus.png, clair-390-munich-2-plus.png, clair-390-munich-5-caler.png,
  cave-390-munich-5-caler.png, clair-390-us05-3-conduite-tiree.png, cave-390-us05-3-conduite-tiree.png, cave-1280-us05-3-conduite-tiree.png.

## Plans E et F
Aucun plan E ni F n'est écrit dans REPRISE.md ni dans la mission. Je n'ai rien inventé ; à préciser par le pilote s'ils existent ailleurs.

## Combien et quels problèmes restent ? 7
1. 390, état après avec stock manquant : « 100 % du be… », car « du besoin » passe en ellipse pour laisser la puce « manque 22 g » entière.
   Lisible, mais pas propre. Piste : dire « 100 % » seul quand la puce est là, puisque le repère « besoin lager 22 g » est juste au-dessus.
2. Hors plage pendant le geste : à 390 (J0–J11, environ 142 px), « · sous la plage » ne s'affiche pas, car la règle demande un segment > 150 px.
   Seuls la couleur et la puce « À vérifier » le disent. En cave, la couleur attention (ambre) se distingue mal du trait paille.
3. 1280 : le ↔ tiré de 500 px finit en « Geste annulé · palier 1 inchangé ». C'est probablement la course du script, qui sort du graphe.
   À rejouer avec une course plus courte avant de conclure ; le journal dit « tirée ».
4. « 14.5 °C » n'est corrigé qu'à l'affichage. La source est functions/src/fermentationContext.ts l. 52, hors voie (DÉCISION pilote).
5. Problème n° 6 (fabricant sous la barre, D391) : non touché, par décision.
6. Problème n° 7 (floculation US-05 inconnue) : donnée hors voie.
7. Problème n° 5 : la conduite reste ale pour une lager ; « Caler à 11 °C » est proposé et joué, mais la conduite lager n'est pas imposée.

Prédiction : « La dose en grammes, je comprends tout de suite ; le "du be…" et la couleur hors plage, c'est encore à finir. »

DÉCISION À PRENDRE : correction de la décimale à la source (functions/src/fermentationContext.ts), hors de cette voie.
CONNAISSANCE : une brique sèche (500 g, par exemple White Labs Munich Lager 500 g) se dose en grammes : besoin ≈ cellules ÷ 13 Md/g, sur-dosage signalé au-delà de 2× le besoin.
LEÇON PROPOSÉE : aucune
