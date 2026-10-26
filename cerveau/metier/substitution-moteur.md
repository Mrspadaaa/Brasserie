---
name: substitution-moteur
description: Ce que mesure le score de substitutes() selon le moment (60′, 10′, whirlpool), et pourquoi Substituer ne répond pas à « moins résineuse » sur la stout.
type: metier
maj: 2026-10-26
sources: https://beermaverick.com/your-hop-substitutions-are-wrong/ (lu le 26.10) ; work/missions/2026-10-25-integration-houblons/voies/e1-banc-eval/resultats/rapport.md ; RESULTAT.md des voies p1-ma-biere, sb-a, sb-b, sb-c, sb-d, sb-u, sb-z, r6-substituer de work/missions/2026-10-23-maquette-parcours/voies/ ; work/refonte-frontend/v4/ecran-1/fils24-substituer/
---

Relevé par le lot Substituer (D125, 24.10 ; u4 choisi, D34).

- **Le score à 60′** (poids amertume 0,6, arôme 0,2, huiles 0,2) : l'« arôme » de `substitutes()` mesure l'absence
  d'arôme étranger, pas la ressemblance. Nelson Sauvin vaut 100 en perdant six familles, Magnat 99 avec une autre
  silhouette. Ne jamais l'afficher seul comme une ressemblance (honnêteté, « arôme 100 »).
- **Stout 16D, Nugget** : aucun remplaçant en stock ne baisse le résineux de plus de ~1 point (il reste hors style, 82 à
  85). Substituer y répond sur l'amertume, la matière et le stock, pas sur « moins résineuse ».
- **Le moment change tout** : au 60′, 137 remplaçants très proches ; dès 10′ (arôme 0,6), 8, et Nelson Sauvin passe de
  86 à 42. Au whirlpool l'ordre s'inverse : Target 86, Idaho 7 82, Magnat 77, Nelson Sauvin 42 ; sur 318, Nelson passe de
  la 73e à la 236e place ; Target (94, 213e) et Citra cryo (88, 215e) sont « chers pour amériser ».
- **Outil** : `vite-node --root C:/Users/mrspa <script.ts>` fait tourner `substitutes()` hors du projet (le root large
  lève la garde `server.fs`).
- **Banc du 26.10** (`scripts/eval-hop/banc-eval.ts`, voie e1-banc-eval, contre les substituts Beer Maverick, référence
  imparfaite : réciproque à 25 %, elle suit l'α plus que l'arôme). `substitutes()` n'a que deux classements, 60′ et arôme (10′,
  whirlpool et dry hop identiques) ; rappel à 10 de 10 à 11 %, MRR 0,12, environ trois fois le hasard. Nelson Sauvin faux :
  Hallertau Blanc 155e. Les mots hors famille, pondérés par leur rareté et mêlés à l'arôme (λ 0,25), le remontent au 2e rang et
  portent le MRR à 0,18–0,20. Suggérer ne départage pas les houblons qui citent les mêmes familles : un seul groupe, rangé par
  ordre alphabétique (l'effet d'une famille citée ne dépend pas de la variété).
- **Suite du 26.10** (D77) : jugé sur une moitié de contrôle, le gain des « mots » tient à λ = 0,25, pas à λ = 0. La variante
  « mots hors famille seuls » n'apporte rien : le gain vient des mots fins rattachés à une famille (grapefruit, lime, mojito). La
  garde « au moins 2 mots partagés » écarte 86 % des remontées par un mot rare, sans perte. Une IA qui reclasse une fenêtre de 20
  ne remonte jamais ce que la liste a rejeté : vérifier que le cas clé tient dans la fenêtre avant tout appel payant. Sur la
  liste de l'option 1, Flash-Lite ajoute +0,10 de MRR (60 cas), p95 2,2 s, 0,003 CHF par geste. Le brasseur juge sur les listes
  (`voies/m2-listes-substituts/`) ; ses mots : « pas forcé d'utiliser l'ai » si l'algorithme suffit.
- **La méthode de Beer Maverick** (article « Your Hop Substitutions are Wrong! », 02.11.2020, lu le 26.10 dans le Chrome du
  brasseur) : une corrélation de Pearson sur 70 nombres par houblon. Ces nombres : α, β et cohumulone (moyenne, min, max) ; huile
  totale ; myrcène, humulène, caryophyllène et farnésène ; usage codé 1 à 3 ; pays par palier ; tags populaires codés ; radar à
  9 axes. Deux jeux de poids, arôme et amertume (le mixte est leur somme), tirés d'articles de recherche. Seuils : 0,94 acceptable,
  0,98 très proche. Conséquence pour notre banc : juger contre ses substituts, c'est en partie juger la ressemblance à sa propre
  formule. Ses faiblesses : un Pearson sur des unités mêlées, des codes arbitraires (pays, tags) lus comme des nombres, des zéros
  de radar qui veulent dire « pas de donnée ».
