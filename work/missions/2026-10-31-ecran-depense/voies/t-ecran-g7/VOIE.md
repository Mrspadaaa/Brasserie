# Voie t-ecran-g7 — test d'écran de 7945555e avant déploiement (D342, D344)

Agent : `critique` (Fable), neuf. Plafond : 30 tours.
Tu ouvres les images par lots de six, en un seul message, pour tenir dans le plafond.

## La question, et rien d'autre (D344)
Pour chaque capture : « combien et quels problèmes il y a ? ». Réponds par une liste numérotée. Regarde comme le brasseur : est-ce pratique, à sa place, est-ce que ça réagit juste ?
- Calibrage : `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`.
- Ses mots : `work/refonte-frontend/v4/SPEC-BRASSEUR.md`, entrées du 02.11.

## Les captures
La version à déployer est **7945555e**. Elle contient :
- le lot g, qui corrige son ticket Bauhaus D328 à D337 ;
- g7-reste, qui corrige M1, M5, M11, D354, D357 et D358 (`voies/g7-reste/RESULTAT.md`).

Les captures sont au banc : `C:/Users/mrspa/AppData/Local/Temp/deploy-hosting-qr/work/missions/2026-10-31-ecran-depense/voies/g1-audit/`, dossiers `apres2-G1` à `apres2-G4` et `apres2-A` à `apres2-D`. Le rejeu mécanique est résumé dans `voies/g6-rejeu/RESULTAT.md`, section « Rejeu 2 ».

Choisis-en au moins 30 :
- les deux thèmes et les deux largeurs (390 et 1280) ;
- au moins 8 états : repos, puces et filtre, plié et déplié, plateaux, regroupé et rétabli, lenteur (`lente-corrigees`), bandeau B, états (vide, chargement, erreur), doublon, revue et TVA, hors ligne, doc14.

Copie-les dans `work/missions/2026-10-31-ecran-depense/avant-deploiement/7945555e/`, **renommées sans nom d'article** : `<largeur>-<groupe>-<thème>-<n>.png`, par exemple `390-plateaux-clair-1.png`. Les noms d'origine portent ses produits.

## À vérifier sur image en particulier
1. Le texte des rangées filtrées en sombre (M5) ; `390-…-g-brassage-sombre-puce-neuf-liste` en est l'exemple.
2. Les rangées de matériel sans unité sur la pièce de rénovation : plus de jaune (M1).
3. « Regrouper en une dépense » : un lien discret au bout de « Détail », hors de la rangée de « + Ajouter une ligne » (D357, « Toujours trop accessible, visible »). « ↶ Rétablir » après le regroupement.
4. L'arrondi à 5 centimes : sa propre ligne neutre à la fin des lignes, et le détail égal au total, sans jaune (D358, « Montant inégale ???? »).
5. Après « Tout valider », plus de bleu ni d'ancienne valeur barrée (D354).
6. Restent connus et hors de cette version : « Même achat » ne crée rien (doc6) ; pas de pastille TVA sur une TVA juste (doc14).

**Bloquant** veut dire : une régression contre la version en ligne, ou un défaut qui empêche d'enregistrer juste une dépense. Un défaut déjà en ligne, que cette version ne rend pas pire, n'est pas bloquant : compte-le et nomme-le.

## Rendre
`avant-deploiement/7945555e/VERDICT.md`, au format exact que lit `node scripts/agents/controle-avant-deploiement.mjs 7945555e` :
- `Version : 7945555e` sur sa propre ligne ;
- un tableau `| capture | thème | largeur | état | problèmes | bloquants |`, une rangée par capture copiée :
  - thème : `clair` ou `sombre` ;
  - largeur : `390` ou `1280` ;
  - problèmes et bloquants : des nombres ;
- sous le tableau, la liste numérotée des problèmes de chaque capture ;
- une ligne `Bloquants : <n>`, le total.

N'écris pas « Pilote : vu » : le pilote l'ajoute, après avoir regardé lui-même.
Aucune valeur de ses pièces dans le texte : ni nom d'article, ni fournisseur, ni montant. Écris « la 2e rangée des malts », pas son nom.

Rends une ligne : `OK — <n> captures, <n> problèmes, <n> bloquants` ou `ECHEC — <raison>`.
