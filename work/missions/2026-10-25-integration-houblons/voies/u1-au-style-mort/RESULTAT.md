OK — Cause trouvée : b68d7935 (a2, D84) cache l'entrée de l'analyse en production ; pas de correction sûre, fix décrit

## Cause (prouvée sur un rendu de production)

Commit : `b68d7935` « a2 (D158, D84) … entrée d'analyse provisoire cachée en production » (26.10, 11 h 30). Il est entre 49907352 (D82) et 9dba6971 (D95). Aucun autre commit de la liste ne touche ce geste.

Fichier : `src/ui/hopIndex/maBiere/index.tsx` (à s2), lignes 75 à 76 :

```
const enApp = !!useHote().allerWizard;
const analyse = !enApp || import.meta.env.DEV;
```

Dans l'app déployée, `enApp` est vrai et `DEV` est faux : `analyse = false`. Trois choses disparaissent en production :
- le bouton « Ouvrir l'analyse de ma bière » (ligne 174, variante B de D121) ;
- le toucher sur le panneau du profil (le `onClick` de la `<section data-element="etape-profil">`, ligne 128, ne fait rien sans `analyse`) ;
- la puce « + floral » (a2/D84, retirée à part : `demande.voulue`).

Confirmé sur le bundle réellement déployé (`deploy-63130965/dist/assets/EtapeHoublons-DJLBm3OS.js`) : `g=!!!be().allerWizard||!1`. Le texte « toucher pour ouvrir l'analyse » est sous `g&&`.

Pourquoi c'est volontaire, et pourquoi ça se voit quand même : la couche `hopBeer` (« Ma bière », l'analyse) n'a pas d'écran dans l'app. `HopToolLayer.tsx` la rend par `CoucheProvisoire` (« Écran provisoire : l'outil v4 viendra ici. Données du prototype, non réelles »). a2 a donc caché l'entrée. Le brasseur avait un bouton qui menait à un écran vide ; il a maintenant un panneau qui ne répond plus. Il écrit « plus le bouton pour ouvrir la vue » : il attend l'analyse, que personne n'a encore portée dans l'app (`RadarBiere.tsx` n'est importé par aucun écran de l'app ; la maquette du choix « onglet Ma bière » est dans `prototypes/houblons-v4/`).

Ce n'est ni le worker, ni le chargement paresseux, ni le pack de données, ni `CadreApp`/`hote.tsx` (i2, p5) : le moteur répond en production (Nugget, Mosaic : arômes chiffrés, « tropical 7/7 »), aucune erreur de page, aucune erreur de console hors Firestore bloqué.

## « Aucune info à jour » : les 12 familles hachurées

Ce n'est pas une régression de 9dba6971. Même recette, même résultat sur les deux commits :
- recette à 5 houblons ordinaires (Magnum 60′, Citra 20′, Mosaic whirlpool, Citra dry hop, Hallertau 10′) : **12 hachurées sur 49907352 ET sur 9dba6971**, alerte « Au style » (pas de « trop marqué » sans valeur) ;
- les raisons lues au survol (title des barres et des puces « arôme ? ») : « ébullition 20′ : le moteur simule l'arôme à 60′ et 10′ seulement », « houblon absent des fiches du moteur », « moment d'ajout inconnu », « température de whirlpool inconnue : IBU incalculable », « α inconnu ». C'est l'honnêteté voulue (inconnu ≠ 0, D40) : tant qu'aucun ajout n'est simulé, aucune famille n'est située. Sa capture montre « Au style » vert + 12 hachurures : c'est ce cas (recette dont aucun ajout n'est simulé) ;
- recette de la maquette (Nugget 60′) : 5 hachurées sur 49907352, **1 sur 9dba6971** (D90/g2c : plus d'info, pas moins).

Limite : sa recette réelle n'est pas lisible d'ici (données Firestore). La lecture « aucun de ses ajouts n'est simulé » reste une hypothèse très probable, pas une preuve sur sa recette. Pour le confirmer : lui demander les moments de ses ajouts, ou survoler une barre.

Piste D79 (pack cassé en production) : écartée, le pack se charge en production.

## Reproduction (rejouable)

Le serveur de dev ne reproduit pas : `import.meta.env.DEV` y est vrai, donc `analyse` aussi. Il faut un build de production. Méthode : deux worktrees temporaires (9dba6971 et 49907352) hors du dépôt, `node_modules` en jonction, `.env` et `seedData.ts` copiés, `import.meta.env.DEV` remplacé par `true` partout SAUF dans `maBiere/index.tsx` (pour garder `?dev-local` dans un bundle de production), `VITE_HOP_V4=on npx vite build`, `vite preview`. Les captures sont de ces builds. Scripts dans le dossier de la voie : `repro.mjs <port> <étiquette> <maquette|vide|reelle>` et `raisons.mjs <port> <mode>`.

| Scénario (390 × 844) | 49907352 | 9dba6971 |
| --- | --- | --- |
| Recette sans houblon : bouton « Ouvrir l'analyse » | présent | absent |
| Recette sans houblon : toucher le panneau | ouvre « Écran provisoire » | rien |
| Recette de la maquette (1 houblon) : bouton | présent | absent |
| Recette de la maquette : hachurées | 5 sur 12 | 1 sur 12 |
| Recette ordinaire à 5 ajouts : hachurées | 12 sur 12 | 12 sur 12 |
| Console, erreurs de page | aucune | aucune |

Captures ouvertes et regardées : `img/prod4990-maquette-1-etape.png` (bouton noir « Ouvrir l'analyse de ma bière » et puce « + floral »), `img/prod4990-maquette-2-apres-toucher.png` (l'écran provisoire), `img/prod9dba-maquette-2-apres-toucher.png` (ni bouton ni réaction), `img/prod9dba-reelle-1-etape.png` (l'équivalent de sa capture : « Au style » vert, 12 hachurées, Retour / Suivant — Levure / « + »), `img/prod9dba-vide-1-etape.png`.

## Correction : non faite

Pas de test, pas de code. Raison : la seule correction « petite » rétablirait `analyse = true`, ce qui rend le bouton qui mène à « Écran provisoire… données du prototype, non réelles » : c'est défaire D84, dans un fichier de s2, et le brasseur le verrait comme le même défaut (écran vide). Un test qui exigerait le bouton contredirait D84. La correction juste est de porter l'écran, ce qui n'est pas petit.

Correction exacte proposée (quand l'écran d'analyse existe) :
1. `src/ui/hopIndex/HopToolLayer.tsx` : ajouter avant `return <CoucheProvisoire …>` un cas `route.view === 'hopBeer'` qui charge à la demande l'écran « Ma bière » (comme `EcranComparer`, dans un `Suspense`), construit sur `maBiere/RadarBiere.tsx` et la maquette « base v4.10, onglet Ma bière » (`work/refonte-frontend/v4/ecran-1/base/captures/consolide-biere-390.png`, registre `ecrans.json` route `biere`).
2. `src/ui/hopIndex/maBiere/index.tsx` lignes 75 à 76 : remplacer par `const analyse = true;` (et supprimer `enApp`, plus lu ici ; vérifier qu'aucun autre usage ne subsiste : il n'y en a pas dans ce fichier).
3. Test : en jsdom avec `vi.stubEnv('DEV', false)`, l'étape rendue par `EtapeHoublons` (hôte avec `allerWizard`) montre `[data-role="pont-biere"]` et un toucher sur le profil appelle `ouvrirCouche({ view: 'hopBeer' })`. Il échoue sur HEAD (aucun bouton), il passe après.

## Fichiers écrits
- `voies/u1-au-style-mort/RESULTAT.md`, `repro.mjs`, `raisons.mjs`, `img/` (15 captures).
- Aucun fichier du dépôt modifié. Worktrees temporaires supprimés (`git worktree remove --force`, jonctions `node_modules` retirées, `node_modules` du dépôt intact : 704 entrées). Serveurs arrêtés. Le message `failed to delete …/worktrees/head: Permission denied` de `git worktree prune` vient d'un autre worktree, pas des miens.

## Essais, doutes
- 1 essai de build raté (dev-local n'ouvrait pas la fixture : d'autres `DEV` verrouillent Firestore) ; corrigé en remplaçant tous les `DEV` sauf celui de la cause.
- Doute : les builds temporaires ont `DEV = true` ailleurs que dans `maBiere/index.tsx` (crochets de dev de `substituer/donnees.ts`, `devHook.ts`). Sans effet sur l'étape Houblons ; le bundle déployé confirme la cause.
- Pas de git bisect : la cause est datée par `git log -S"const analyse = "` (un seul commit) ; le comportement des deux extrémités est rejoué.

DÉCISION À PRENDRE : que voit le brasseur à la place de l'analyse en attendant l'écran ? Options : (A) laisser tel quel (panneau muet, son retour) ; (B) rétablir le bouton vers l'écran provisoire (défait D84, il l'a déjà jugé inutile) ; (C) porter l'onglet « Ma bière » dans l'app tout de suite (T-suivante : concepteur Opus, base v4.10, `RadarBiere` déjà dans l'app). Recommandation : C, et en attendant A avec une ligne dans le journal de déploiement disant que l'entrée a disparu volontairement. Dans tous les cas, lui répondre : « Au style + tout hachuré » veut dire qu'aucun ajout de sa recette n'est encore simulé (moments hors 60′/10′, whirlpool sans température, houblon hors fiches) ; survoler une barre donne la raison.

CONNAISSANCE : le serveur de dev ne montre pas ce que le brasseur voit en production quand un écran dépend de `import.meta.env.DEV` ; pour le reproduire, bâtir un worktree temporaire 9dba et rouvrir `?dev-local` dans un build de production (méthode ci-dessus). Tout ce qui est « caché en production » doit se rejouer sur un build, pas sur `npm run dev`.

LEÇON PROPOSÉE : cacher en production une entrée qui existait dans la version déployée (a2, D84) est une régression visible pour le brasseur, même si l'écran visé est provisoire. Avant le déploiement, lister « ce qui disparaît pour lui » et lui dire ; contrôler le parcours sur un build de production, pas sur le serveur de dev (rôles : pilote, auteur ; contrôle : un test avec `vi.stubEnv('DEV', false)` sur les entrées gardées par `DEV`).
