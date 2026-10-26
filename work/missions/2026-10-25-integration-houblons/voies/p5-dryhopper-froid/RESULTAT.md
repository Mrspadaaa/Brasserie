OK — son choix D (trois mini graphes) porté dans Dryhopper, au dry hop, sur les valeurs de froid.ts

## Fichiers écrits
Mes lignes (nouveaux, dans `src/ui/hopIndex/dryhopper/`) :
- `FroidDryhopper.tsx` (les trois cellules et les trois feuilles, classes `pq-dry-froid-…`), `froidVue.ts` (fonction pure : range les valeurs de froid.ts pour le dessin), `froid.css`.
- `tests/unit/hopIndexV4/froidDryhopper.test.ts` (14 tests), `tests/integration/controle-froid-dryhopper.mjs`.
- `work/refonte-frontend/v4/choix/etats/dryhopper.json` : `etat-dryh-repos`, max_mots 98 → 104, note avant/après.
- Voie p5 : `fidelite/comparer.mjs`, `mesures.json`, `app-*.png`, `cote-a-cote-*.png`, `cote-a-cote-zone-*.png`, `maquette-dryhopper-repos.png`, `maquette-dryhopper-1280.png`.
- `inventaire.md` : NON écrit (tours épuisés) ; son contenu est dans « Ce que le port reprend » ci-dessous.

Fichiers partagés, mes lignes seulement (celles d'i2 intactes) :
- `dryhopper/index.tsx` : l'import de `FroidDryhopper` et 3 lignes `{p.seg >= 2 && <FroidDryhopper …/>}` après `{graphe}`.
- `dryhopper/hote.tsx` (mes lignes) : `import type { HopKnowledge }`, le champ facultatif `connaissances` de `HoteOutil`, le crochet `useConnaissances`. Non touchés : la prop `droite` de `CadreOutilProps` (i2).
- `dryhopper/outilApp.tsx` : lecture des connaissances du brasseur (`lireConnaissances`, tolère un stockage de test sans cette lecture), passées à l'hôte.
- `dryhopper/CadreApp.tsx` : aucune ligne de moi ; le `droite` rendu après le `h1` est à i2.
- `prototypes/houblons-v4/maquettes/parcours/` : reconstruite par `construire.mjs` (CONSTRUIT OK, 9 pages).

## Ce que le port reprend de D (inventaire)
- Repos : sous la bande IBU, côté ébullition, 3 cellules de 72 / 44 / 56 px, hauteur 56 px (le rail descend de 18 px, fixe). amer : « amer ? », plage hachurée (essais Cascade en plein, avec Centennial en hachuré), trait noir à l'IBU à chaud, 3 nombres (22, 28, 34). creep : jauge de 3 crans (2 allumés) et « moyen » en noir. limite : 4 colonnes sous une ligne de limite en pointillés (végétal, herbacé en orange avec flèche ; résineux, floral au-dessous), pictos à 12 px.
- Feuilles (toucher ouvre sous la zone et repousse le rail ; second toucher referme) : Amertume (plage légendée, « Signe non établi », Maye 2016, 39 mots) ; Hop creep (pourquoi, effets, publié +0,6 à +1,3 % vol. à 10 g/L, ce brassin « ? », niveau « 2/6 : une convention, pas une mesure », inconnus, H68, H84) ; Limites (4 barres avec borne, 20,6 / 5, 13,5 / 5, 27,5 / 30, 24,4 / 30).
- Seulement au dry hop (actif, après). Le jour tenu fait suivre le creep (7 j : 3 points au lieu de 2) et dit un contact hors des essais (1 à 5 j) ; la dose et le moment changent les valeurs, jamais la hauteur.

## Critères
- `controle-froid-dryhopper.mjs` : ROUGE sur HEAD (« FROID ECHEC 8 » : cellules absentes, code 1, avec le point d'insertion neutralisé), puis `FROID OK`. Il couvre : 3 cellules, aucun chevauchement entre elles ni avec la légende « levure active », rail en dessous, 3 feuilles qui repoussent le rail et se referment, 4 jours sans saut (rail à 252,7 px pour 1, 2, 3, 7 j), aucun dessin à l'ébullition, creep qui suit le jour.
- `controle-etoile-dryhopper.mjs` : `ETOILE OK`.
- `npx vitest run tests/unit/hopIndexV4 tests/unit/designTokens.test.ts` : 588 verts sur 589. Le seul échec est `moteurInchange > le classement des substituts de 12 houblons est inchangé` (moteur de substitution, voie g2a/i2 en cours ; pas Dryhopper).
- `npm run build` : vert (sans et avec `VITE_HOP_V4=on`).
- `check-hop-budget.mjs --dist dist --chunk-outils profil-simule` (build `VITE_HOP_V4=on`) : B5 tenu (157,7 ko ≤ 160) ; **B1 (921 ko, budget 350) et B2 (773 ko, budget 150) DÉPASSÉS**. Mon code est seulement dans le chunk paresseux `EcranApp-*.js` (grep sur dist), pas dans le démarrage ni l'étape Houblons ; je n'ai pas pu bâtir HEAD pour prouver que le dépassement existait déjà (un worktree de HEAD manque seedData et firebase-admin). À confirmer par le pilote sur un HEAD propre.
- `controle-etats.mjs` : `etat-dryh-repos` OK après mise à jour (104 mots) ; 5 échecs sur 138 hors Dryhopper (Suggérer : « Comparer (3) », « 20 g », « East Kent Goldings »), voie g2a.

## Fidélité (390 × 844, 21C, Cascade 4 g/L, après, 3 j) : captures ouvertes
- `comparer.mjs` redessine la couche de m5 (sa fonction `injecter` lue telle quelle dans son capturer.mjs) puis le composant, même page, et mesure chaque boîte depuis le haut du dessin. `FIDELITE OK`.
- Écart maximal : repos 0,1 px, feuille Amertume 0,1 px, feuille Limite 0,1 px (cellules, plage, jauge, colonnes, pictos, étiquettes, nombres, lignes de la feuille). Tolérance 4 px.
- Écart voulu, écrit à part : la feuille Hop creep est plus haute de 17 px (une ligne de plus : « 2/6 : une convention, pas une mesure ») ; le rail dessous descend d'autant. m5 ne disait pas la convention ; il l'a demandée.
- Ouvertes : `cote-a-cote-amer.png`, `cote-a-cote-zone-limite.png`, `cote-a-cote-zone-creep.png`, `cote-a-cote-zone-repos.png`, `repos.png` et `ouvert-limite.png` du contrôle, la maquette en 390 (Idaho 7, stout 16D : amer 40–60 hachuré seul, « moyen », limite avec 4 colonnes) et en 1280 (cellules petites dans la zone, sans chevauchement). `cote-a-cote-creep.png` et `cote-a-cote-limite.png` en plein écran n'ont pas été rouverts, seulement leurs zones recadrées.
- Défauts trouvés et corrigés en route : échelle de la plage (7 au lieu de 6,5), noms longs de familles (« Végétal vert ») au lieu des courts, jauge de la feuille Creep, +0,39 de H35 inclus à tort dans le publié à 10 g/L, texte « levure possible » en trop.

## Honnêteté des données
- Aucune valeur inventée ; « ? » pour l'inconnu : le signe de l'amertume (« ? » tant que l'écart passe de part et d'autre de 0, « − » ou « + » sinon), l'ampleur du creep pour ce brassin, la plage « de la variété » absente quand les essais n'ont pas cette variété (Nugget : l'enveloppe seule, jamais celle d'un autre houblon).
- Amertume non calculée (« ? » et la raison) si : modèle incomplet (dose > 7,73 g/L), α du lot ou densité inconnus, science désactivée par le brasseur (lue via `getHopKnowledge`, désactivée comprise).
- Doute : froid.ts calcule l'IBU à chaud avec l'α du catalogue, pas l'α du lot du bandeau (`alphaLot`) ; si l'écart dépasse 0,5 IBU, la feuille ajoute « à chaud : α du catalogue ». Sur la recette de m5 : 27,9 contre 28, sans écart.

## Essais
1 par critère ; un second passage de `comparer.mjs` après les corrections de la feuille Creep. Un worktree temporaire de HEAD (essai de preuve du budget) a laissé un dossier `.git/worktrees/head` que le système refuse de supprimer (Permission denied) : à purger par `git worktree prune`.

## Passe 2 (pilote : b0474128 commité) : 18 px réservés aux moments chauds, et la bulle du pouce
Décision du pilote (option b) : aux moments chauds (ébullition, WP) la zone reste vide, rien n'est dessiné, mais ses 18 px du bas sont réservés (`div.pq-dry-froid-reserve`, `index.tsx` + `froid.css`). Le rail ne bouge plus sous le doigt (D149).
- Contrôle ajouté (`controle-froid-dryhopper.mjs`, § 4) : y du rail identique (±1 px, depuis le haut du dessin) à ébullition, WP, actif et après. ROUGE sur b0474128 (« FROID ECHEC 2 » : rail à 234,7 au lieu de 252,7 à l'ébullition et au WP), puis `FROID OK`.
- Capture `ebullition.png` du contrôle, ouverte : zone vide sous la bande IBU, rien de dessiné, rail à sa place.

Plainte du brasseur (« Pas super la superposition ici ») : la bulle « ● 3 j » du pouce recouvrait le haut du bouton « 7 j ». Lecture étroite : écart vertical seul (L01), ni la place horizontale ni le contenu.
- Cause mesurée : la bulle (20 px de haut) était à 28 px sous le haut du pouce ; elle finissait 6 px sous le haut de la rangée des jours.
- Correction : `.pq-dry-pl { top: 28px }` devient `20px` (`dryhopper.css`, une valeur). La bulle tient entre le rail et la rangée, à environ 2 px au-dessus d'elle, comme p4b2f. Cette ligne CSS est dans mon lot ; la voie i2 n'y a rien écrit.
- Contrôle ajouté (§ 5) : la boîte de la bulle ne coupe aucun bouton de jour et ne remonte pas sur le rail ; 390 et 1280 px ; ébullition, actif et après ; 1, 2, 3 et 7 j (26 cas). ROUGE sur b0474128 (« FROID ECHEC 24 », par ex. « 390 px, après, 3 j : la bulle (503,7 à 523,7) coupe le bouton « 7 j » (haut 517,7) »), puis `FROID OK`.
- Capture de sa scène (21C, Cascade 4 g/L, après, 3 j), ouverte recadrée : `fidelite/bulle-apres-3j-zoom.png` (entière : `bulle-apres-3j.png`). La bulle est entre le rail et la rangée, sans toucher « 7 j ».
- Rejoués après la passe : `froidDryhopper.test.ts` 14/14, `npm run build` vert, `construire.mjs` (CONSTRUIT OK), `controle-etats.mjs --ecran=dryhopper` : ETATS OK (20/20), `controle-etoile-dryhopper.mjs` : ETOILE OK.
- Note : `fidelite/cote-a-cote-*.png` (prises avant la passe) montrent encore l'ancienne bulle ; la fidélité des cellules (écarts ≤ 0,1 px) n'est pas touchée par ces deux changements.
- Poste : le lien `node_modules` du dépôt de travail avait disparu (après mon essai de worktree de HEAD) ; je l'ai recréé vers `C:/Users/mrspa/Documents/Brasserie/node_modules`.

DÉCISION À PRENDRE : aucune (la décision (b) du pilote est appliquée).

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune (sauf mécanisation : un contrôle de mise en page doit lire les hauteurs depuis le haut du dessin, un clic de jour défile la page).
