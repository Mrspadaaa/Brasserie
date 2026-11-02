# Voie t-ecran-60a8 — test d'écran de 60a8c25f avant déploiement (D342, D344)

Agent : `critique` (Fable), neuf. Plafond : 30 tours.
Tu ouvres les images par lots de six, en un seul message, pour tenir dans le plafond.

## La question, et rien d'autre (D344)
Pour chaque capture : « combien et quels problèmes il y a ? ». Tu réponds par une liste numérotée. Tu regardes comme le brasseur : est-ce pratique, à sa place, est-ce que ça réagit juste ?
Calibrage : `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`. Ses mots : `work/refonte-frontend/v4/SPEC-BRASSEUR.md`, entrées du 02.11.

## Les captures
Version à déployer : **60a8c25f**, le lot g, qui corrige son ticket Bauhaus D328 à D337.
Elles sont au banc, dans `C:/Users/mrspa/AppData/Local/Temp/deploy-hosting-qr/work/missions/2026-10-31-ecran-depense/voies/g1-audit/`, dossiers `apres-G1` à `apres-G4` et `apres-A` à `apres-D`.

Choisis-en au moins 30, avec :
- les deux thèmes et les deux largeurs (390 et 1280) ;
- au moins 8 états : repos, puces et filtre, plié et déplié, plateaux, regroupé, lenteur (`lente-corrigees`), bandeau B, états (vide, chargement, erreur), doublon, revue et TVA, hors ligne, doc14.

Copie-les dans `work/missions/2026-10-31-ecran-depense/avant-deploiement/60a8c25f/`, **renommées sans nom d'article** : `<largeur>-<groupe>-<thème>-<n>.png`, par exemple `390-plateaux-clair-1.png`. Les noms d'origine portent ses produits.

## Déjà connu, à vérifier sur image et à classer
Le rejeu mécanique de g6 (`voies/g6-rejeu/RESULTAT.md`) laisse :
1. deux rangées de matériel sans unité encore « à contrôler » (M1) ;
2. en sombre sous filtre, le texte des rangées filtrées sur fond ambre, contraste 2,1 (M5) ;
3. le champ « à remplir » non mesuré (M11) ;
4. sur les cas existants : « Même achat » ne crée rien (doc6), et pas de pastille TVA sur une TVA juste (doc14).
Une voie de correction (g7) les traite en parallèle.

**Bloquant** veut dire : une régression contre la version en ligne, ou un défaut qui empêche d'enregistrer juste une dépense.
Un défaut qui était déjà en ligne, et que cette version ne rend pas pire, n'est pas bloquant : compte-le et nomme-le.

## Rendre
`avant-deploiement/60a8c25f/VERDICT.md`. Format exact, lu par `node scripts/agents/controle-avant-deploiement.mjs 60a8c25f` :
- `Version : 60a8c25f` sur sa propre ligne ;
- un tableau `| capture | thème | largeur | état | problèmes | bloquants |`, une rangée par capture copiée :
  - thème : `clair` ou `sombre` ;
  - largeur : `390` ou `1280` ;
  - problèmes et bloquants : des nombres ;
- sous le tableau, la liste numérotée des problèmes par capture ;
- une ligne `Bloquants : <n>`, le total.

N'écris pas « Pilote : vu » : c'est le pilote qui l'ajoute, après avoir regardé lui-même.
Aucune valeur de ses pièces dans le texte : ni nom d'article, ni fournisseur, ni montant. Dis « la 2e rangée des malts », pas son nom.

Rends une ligne : `OK — <n> captures, <n> problèmes, <n> bloquants` ou `ECHEC — <raison>`.
