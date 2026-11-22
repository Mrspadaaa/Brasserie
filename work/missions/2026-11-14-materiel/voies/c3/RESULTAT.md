OK — c3 : banc réutilisable, 2 bloquants = banc, problèmes 3 à 12 corrigés (070d5268) ; captures finales à juger

W = `C:/Users/mrspa/AppData/Local/Temp/materiel-port`, branche claude/materiel-port. **sha final : 070d5268** (parent 059a8511). M = `work/missions/2026-11-14-materiel`.

## Banc réutilisable
`M/avant-deploiement/capt-avant.mjs <sha> [états…]` → `M/avant-deploiement/<sha>/<état>-<390|1280>-<clair|sombre>.png`.
13 états : repos, traiter, fiche, apres-etalonne, annule, fiche-pompe, ajout, gestion, vide, payer, fait-refroidisseur, reparee, etalonne-traiter.
- Fixtures (13 appareils za3 ; pH-mètre sans `calibration`, rythme mois, QUATRE étalonnages 08.07 / 10.08 / 12.09 / 11.10 avec lectures ; dépenses 24,90 et 12,50 ; pompe en panne depuis le 05.11 ; refroidisseur au brassin avec 5 brassins ; densimètre sans historique) **injectées dans la page** : la requête de `/src/data/seedData.ts` est interceptée et le module de Vite est repris avec trois exports remplacés. `W/src/data/seedData.ts` n'est jamais touché (sha256 inchangé `7bce7a08…`, fichier ignoré par Git).
- Date figée au 14.11.2026 10 h (shim `Date`), requêtes hors localhost coupées (aucun Gemini, aucune donnée réelle), serveur Vite 3477 arrêté dans un `finally`.
- Chaque geste est un vrai clic (souris à 1280, toucher à 390) précédé d'un test « l'élément est-il sous le doigt ? » ; chaque feuille, menu ou toast attendu doit être visible avant la capture, sinon `ECHEC` explicite et capture `ECHEC-…png`. Sortie : `CAPTURES OK n`.
- Deux artefacts du banc local masqués avant la capture : le toast « Base initialisée… » (attendu) et la coque « Compagnon hors connexion · mode local » (cachée ; absente en ligne, non vérifiable ici).

## Les 2 bloquants : cause = le banc, pas le code
- Bloquant 1 (ajout 1280 sombre) : avec attente de la feuille (`.mt-feuille` visible), le geste « Matériel déjà possédé » ouvre la feuille en sombre à 1280 (`base/ajout-1280-sombre.png`, ouverte). L'ancienne capture avait été prise sans attente.
- Bloquant 2 (⋯ à 1280) : le menu Modifier / Vendu / Réformé / Supprimer s'ouvre à 1280 clair et sombre (`base/gestion-1280-clair.png`, ouverte). Même cause. Aucun code changé pour ces deux.

## Problème → correction (un seul commit 070d5268, tests rouges avant, verts après)
- 3 (à jour redemande l'étalonnage) : `Detail.tsx` : un appareil `avenir` replie formulaire, tolérance et bouton principal ; le pied propose « Étalonner quand même » / « Faire quand même » (secondaire) qui rouvre le formulaire et « Étalonné » / « Fait ». Test `3 — …`.
- 4 (vert du geste recouvert) : `list.css` : `.mt-ar.mt-flash.mt-choisi` garde le vert ; la barre de sélection est un `::after` droit au bord de la liste (plus d'ombre intérieure arrondie).
- 5 (historique) : cause = **fixture** du banc (une seule lecture) ; le code lisait déjà tout. Banc : 4 étalonnages ; fiche : 4 lignes (test) ; fil 1280 : les points qui tiennent (12.09 et 11.10, comme za3 ; 10.08 et 08.07 sont hors du haut du fil à 3,5 px/j).
- 6 (« pH 7 ») : cause = fixture (`calibration` aux libellés « pH 7 »). Code durci : `etiquetteTampon` lit la valeur attendue → « pH 7,00 », même pour un étalonnage enregistré « pH 7 ». Test.
- 7 (icône) : `Boxes` (icône de l'onglet Stocks) à la place du cône de houblon.
- 8 (anneau du ⋯) : focus au conteneur du menu à l'ouverture au toucher ou à la souris (`event.detail > 0`), au premier choix seulement au clavier ; anneau `:focus-visible` seulement. Test.
- 9 (ajout étiré à 1280) : `list.css` ≥ 1024 px : dialogue de 560 px centré (`::after` de Vaul retiré) ; « Dernier fait » reste à côté d'« Entretien » (2 colonnes).
- 10 (Dernier fait avec « aucun ») : masqué sans rythme. Test.
- 11 (fil de la pompe vide à 1280) : `filPanneau` pose le point de la panne (05.11, cause) et celui d'aujourd'hui (« Réparer »). Test.
- 12 (texte double) : le titre dit la cause ; à droite de « 14.11 Réparer », plus rien ; la fiche à 390 gagne le point « 05.11 En panne » (sans la cause). Test.
- Doute « rail sur les pictos » : `.mt-rappel` passait au-dessus du picto décalé ; `z-index` sous les pictos (`.mt-ar` à 1). Vu corrigé sur `wip/apres-etalonne-1280-clair.png`.
- Doutes non refaits : ⋮ de l'en-tête de l'app (hors écran Matériel) ; pictos « Réparée » / « Projets » (clé plate, écart minime).

## Critères
- `npx tsc --noEmit` : aucune sortie.
- Tests (`voies/c3/tests.txt`) : 6 fichiers, **120 verts**. Preuve rouge avant : sources de 059a8511 remises, `equipmentAvantDeploiement.test.tsx` = **6 rouges sur 8** ; sources du commit restaurées (copie vérifiée), 8 verts.
- `VITE_HOP_V4=on npm run build` : vert, DRAPEAUX OK.
- `git -C W status --short` : vide après le commit.
- Captures du nouveau sha : voir la section suivante.

## Captures du nouveau sha (070d5268)
- `node capt-avant.mjs 070d5268` : **CAPTURES OK 52** (13 états x 390/1280 x clair/sombre), 0 ECHEC, dans `M/avant-deploiement/070d5268/`.
- Ouvertes en image par moi : `ajout-1280-sombre` (feuille ouverte, dialogue 560 px centré, plus d'aplat sous le bord, pas de Dernier fait), `gestion-390-sombre` (menu ouvert, aucun anneau sur Modifier, icône Stocks, 4 étalonnages, pH 7,00), `fiche-pompe-390-clair`. Avec le sha de travail `wip` (même code, hors la règle ::after) : `ajout-1280-sombre`, `fiche-pompe-1280-clair` (points 05.11 et 14.11 Réparer), `apres-etalonne-1280-clair` (ligne verte à 14.12, barre droite, rail sous les pictos, « Étalonner quand même »). Avant le correctif, `base/gestion-1280-clair` et `base/ajout-1280-sombre` montraient déjà les bloquants 1 et 2 ouverts.
- Non rouvertes cette fois (à juger par le pilote ou un exécutant) : `apres-etalonne-390`, `annule`, `traiter`, `payer`, `fait-refroidisseur`, `reparee`, `vide`, `etalonne-traiter`, les captures 1280 de `fiche` et `gestion`.

## Doutes et limites
- `W/src/data/seedData.ts` contient encore des fixtures anciennes (un étalonnage, `calibration` « pH 7 ») laissées par un banc précédent ; il est ignoré par Git, je ne l'ai pas modifié. Le banc ne s'en sert plus (module remplacé dans la page). À remplacer par `seedData.example.ts` avant un build qui ne doit pas les embarquer (les builds de preuve de cette voie l'ont embarqué : sans effet sur le code).
- « À jour » replie l'étalonnage aussi pour les appareils au rythme `brassin` ou `mois` à jour (Frigo : « Faire quand même ») : choix de ma lecture du verdict, à confirmer.
- `e.detail === 0` vaut « clavier » ; un lecteur d'écran qui clique par code ouvre aussi sur « Modifier » (voulu).

DÉCISION À PRENDRE : « Faire quand même » sur les appareils à jour (Frigo, Déshumidificateur) : garder (recommandé, cohérent avec « Étalonner quand même »), ou garder « Fait » en principal pour ceux sans mesure.
CONNAISSANCE : une capture de banc qui n'attend pas la feuille avant de la photographier fabrique un faux « geste sans effet » ; le banc échoue maintenant en nommant ce qui manque. Un historique « réduit à une ligne » ou des tampons « pH 7 » venaient de la fixture, pas du code.
LEÇON PROPOSÉE : un verdict de capture qui dit « le geste est sans effet » se rejoue d'abord avec une attente explicite de l'élément (et un test « sous le doigt ») avant de toucher au code.
