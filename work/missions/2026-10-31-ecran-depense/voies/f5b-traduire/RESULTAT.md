OK — traduction en français par appel texte seul écrite au banc : simulée OK, estimée 0,26 CHF au pire, passes prêtes

Voie f5b-traduire, 01.11 (suite de f5, D279). Aucune passe payante lancée, rien dans `functions/` ni `src/`, aucun commit. Réglage de la consigne : **pas encore retouché**, faute de passe payante (voir « Réglage »).

## Fichiers écrits
- `scripts/banc-noms-fr.ts` (neuf) : le banc de la traduction (plans, corps, lecture de la réponse, appels, juge, simulation, estimation, ligne de commande).
- `tests/unit/banc-noms-fr-texte.test.ts` (neuf, 47 tests).
- `scripts/banc-lecture-facture.ts` (exports et lexique seulement) : le lexique s'enrichit des mots restés en allemand en D279 (supplément, emballage, expédition, blé, orge, spécial, clair, foncé, fût, malts composés, silicone…) ; `UNITE_SUFFIXE` ne prend plus la virgule décimale d'un « 0,5 Kg » pour un séparateur ; la garde « lancé comme script » ignore `banc-noms-fr` (sinon l'import du banc de lecture lançait son propre `main` sous `--simuler`). Aucune variante existante n'est changée.
- `scripts/banc-lecture-facture-juger.ts` : la même garde, rien d'autre.
- `work/missions/2026-11-01-banc-lecture/GESTES.md` : une ligne « Désignation en français, texte seul ».
- Ce fichier.

## Ce que fait le banc
Source : les lignes finales de `banc-d272b-hl` (la production rejouée, `Csv8+N`, 14 pièces, 1 tirage), donc la lecture ne bouge pas : aucune perte possible sur les champs ou les lignes. Pour chaque ligne, `lireOptions(name, variant, unit).base` ; les bases sont dédoublonnées par pièce (forme canonique : minuscules, sans accent, espaces réduits). **Un appel texte seul par pièce et par modèle** (`gemini-3.5-flash-lite`, `gemini-3.8-flash`), réflexion LOW (le plus bas du banc), température 0, schéma strict `{ noms: [{ i, nameFr }] }` (les deux champs requis), plafond de sortie `600 + 36 × noms` jetons. Entrée par ligne : `{ i, base, kind, stockCategory }`, rien d'autre (ni image, ni montant, ni quantité). Un `i` absent, inconnu, répété ou vide = pas de traduction, la base reste.
Réutilisé du banc de lecture (importé) : `Budget` et son plafond de passe, `appendJournal` et `spentInJournal`, `realTransport`, `--confirm-paid-ai`, les modèles, `jugerNomFr`, `jetonsGardes`, le lexique, le prêt d'appels (`--reprendre <sortie>` : un appel déjà payé, même pièce, même modèle, mêmes entrées, n'est ni refait ni payé ni journalisé).
La consigne (`SYSTEME_NOMS_FR`) : français ; marque, nom propre, variété de houblon, souche et code de levure, ®/™, références, nombres, dimensions et contenances gardés ; mots ordinaires traduits (liste de la voie) ; déjà français ou nom propre seul = identique ; rien d'ajouté ou retiré ; même désignation, même traduction ; `kind` et `stockCategory` seulement pour lever une ambiguïté. Cinq exemples **inventés** ; un test vérifie qu'aucune désignation citée par D279 n'y figure.

## Le juge (comptes seulement dans le tableau ; paires dans le fichier privé)
`jugerNomFr` sur la base (langue, marque, option, unité, long), plus : **manquant** (pas de traduction), **chiffre** (un nombre de 1 à 3 chiffres de la base coupé : « … Spezial 3 » → « … » ), **identité** (une base déjà en français, sans mot du lexique étranger, rendue modifiée), **cohérence** (la même base rend le même français d'une pièce à l'autre ; une voix par pièce, la plus fréquente fait référence, la première à égalité). Ce que la base porte déjà (deux-points d'un texte libre, « , 10gr » imprimé) n'est pas une faute de la traduction qui le recopie. Le tableau (`RESULTAT-NOMS-FR-TEXTE.md`) : lignes sans défaut, défauts par code, durée et jetons médians, coût, par pièce et par genre ; les paires (base, français) vont dans `noms-fr-texte-paires.json` de la sortie (H13-reels, hors Git).

## Sorties décisives
- `npx tsx scripts/banc-noms-fr.ts --simuler` : `NOMS FR TEXTE SIMULE OK — 14/14 fausses traductions fabriquées retrouvées, aucune autre ligne accusée, aucun réseau.` Sept fautes fabriquées sur 7 pièces, les deux modèles : mot allemand resté, marque perdue, suffixe d'unité, chiffre coupé, désignation française retouchée, même base traduite autrement, entrée absente. Témoin négatif dans les tests (un défaut que le juge ne voit pas est « manqué »).
- `npx tsx scripts/banc-noms-fr.ts --estimer` (14 pièces, deux modèles) : `BANC ESTIME 0.2557 CHF 28 appels` (flash-lite 0,0596 + 3.8 0,1962, réserve au pire, sortie au plafond). Impaires seules : `0.1149 CHF 14 appels` ; paires seules : `0.1409 CHF 14 appels`. Dépense probable : bien plus bas (la simulation, jetons estimés et non mesurés, donne 0,014 + 0,052 CHF pour les 14 pièces).
- `npx vitest run tests/unit/banc-lecture-facture.test.ts tests/unit/banc-lecture-k5.test.ts tests/unit/banc-lecture-noms-fr.test.ts tests/unit/banc-noms-fr-texte.test.ts --maxWorkers=2` : 4 fichiers, 246 tests verts. Aussi verts : `tests/unit/depense/banc-k6`, `port`, `options`, `invoiceScanVote` (12 fichiers, 232 verts, 3 ignorés). La simulation de Csv8F (f5) reste `BANC SIMULE OK`. `tsc --strict` propre sur le script et le test.
- `git status --short` : mes fichiers sont les trois scripts, les deux tests, `GESTES.md` et ce dossier ; les autres lignes sont celles d'autres voies et du pilote.

## LES PASSES PAYANTES (à lancer par le pilote, journaliser ; aucune ne dépasse 0,30 CHF réservé)
Le réglage se choisit sur les pièces impaires, se juge sur les paires (L20). Depuis la racine :

1. Réglage (impaires, réserve 0,1149 CHF) :
`npx tsx scripts/banc-noms-fr.ts --payant --budget-chf 24.5 --plafond-passe 0.3 --lot impaires --out work/finalisation-tickets-2026-10-08/H13-reels/banc-f5b-impaires --confirm-paid-ai`
→ imprime par modèle les lignes sans défaut, les défauts par code, la durée médiane et le coût ; écrit le tableau et `noms-fr-texte-paires.json` dans la sortie. Le pilote ouvre les paires (base, français) de cette sortie et me les renvoie (ou renvoie les codes de défaut) : **je retouche alors la consigne** (une seule fois) et je le dis dans le RESULTAT.
2. Jugement (paires, réserve 0,1409 CHF), avec la consigne retouchée :
`npx tsx scripts/banc-noms-fr.ts --payant --budget-chf 24.5 --plafond-passe 0.3 --lot paires --out work/finalisation-tickets-2026-10-08/H13-reels/banc-f5b-paires --confirm-paid-ai`
3. Rejuger sans réseau (après un ajout au lexique) : `npx tsx scripts/banc-noms-fr.ts --juger <sortie>`.
Cumul prévu : 8,5 CHF journalisés + au plus 0,26 CHF. `--budget-chf` reste plafonné à 24,5 par le code.
Une passe unique des 14 pièces (`--lot toutes`, `--plafond-passe 0.4`) est possible si le pilote renonce à la séparation impaires/paires.

## Réglage : lequel a été retouché
- **Consigne et plafond de sortie** : écrits avant toute mesure, d'après la liste de D279 ; **non retouchés**, aucune réponse de modèle n'existe encore.
- **Juge et lexique** : retouchés en simulation en regardant les 14 bases (les noms de pièces, pas des réponses de modèle) : trois fausses accusations venaient du juge et non d'un modèle (deux-points d'un texte libre, suffixe « , 10gr » imprimé, virgule décimale d'un « 0,5 Kg »). Ce sont des réglages du juge, vus sur les 14 pièces ; ils ne jugent pas un modèle.

## En production, où le brancher (recommandation, rien fait)
Les temps ci-dessous sont des ordres de grandeur tirés des appels du banc (une 3.8 de 277 jetons de sortie avec image : 4,8 s ; une Flash-Lite de 400 jetons : 3 s) ; la passe payante les mesure : texte seul et 300 à 700 jetons de sortie, je m'attends à 2 à 4 s pour flash-lite et 3 à 6 s pour la 3.8.

**(a) Dans `scanInvoice` d'aiTask, après le vote, sur les lignes finales.** Le temps s'ajoute à la lecture (médiane 17,6 s) : +2 à 6 s sur le chemin de l'utilisateur (+11 à 34 %), l'écran n'a rien avant. Hors ligne : sans objet (la lecture est déjà en ligne). Cache : celui de lecture d'aiTask (D274) garderait aussi les noms, mais il ne sait pas qu'une base est déjà traduite ou déjà reliée au stock : tout repart à chaque lecture. Fichiers : `functions/src/ai.ts` (`scanInvoiceSafely`), `invoiceScanVote.ts`, `invoiceScanCore.ts` (`CoreItem`, `normalizeInvoiceScan`), `prompts.ts`, `src/services/geminiScanner.ts` (type et normalisation), tests de production. Plus de fichiers, et un champ de ligne neuf (la leçon de Csv8F : tout ce qui touche la lecture se mesure à part).

**(b) Une tâche `aiTask` à part, appelée par le client après la lecture, sans attendre — recommandé.** La lecture ne change pas (0 s ajoutée) ; les lignes s'affichent avec le nom imprimé, et les noms français arrivent 2 à 6 s plus tard (plus un démarrage à froid éventuel) sans bloquer la saisie ; un échec laisse le nom imprimé, sans effet sur les totaux. Hors ligne : aucun appel, le nom imprimé reste (marqué « non traduit »), la traduction se fera à la reconnexion. Cache et économie : une table locale « base canonique → français » (remplie à chaque traduction, corrigeable par le brasseur) ; une base déjà dans la table, ou déjà reliée à un article du stock (dont le nom est déjà français), n'appelle rien : les appels baissent avec l'usage (un seul appel par pièce, seulement pour les bases inconnues) ; coût ≈ 0,003 à 0,011 CHF par pièce selon le modèle, contre 0,044 pour la lecture. Cette voie réutilise le chemin générique d'`aiTask` (`def.system`, `def.schema`, `def.maxOutputTokens`, `geminiAttempts`).
Fichiers à changer pour (b) :
1. `functions/src/prompts.ts` : `TaskId` + `traduireNoms` dans `TASKS` (`system` = `SYSTEME_NOMS_FR`, `schema` = `NOMS_SCHEMA`, `acceptsFile: false`, `maxOutputTokens` ≈ 4 000) ;
2. `functions/src/models.ts` : si Flash-Lite est retenu, `traduireNoms: 'low'` dans `LITE_ROUTES` (sinon la 3.8, par défaut) ;
3. `src/services/aiClient.ts` : `AiTaskId` + `'traduireNoms'` ;
4. nouveau `src/services/nomsFr.ts` : bases dédoublonnées (même `cleBase`), table locale (Dexie, dans le fichier de schéma de la base locale), saut des bases déjà reliées au stock (`stockLineMatching`), appel, fusion de `nameFr` dans les lignes, échec silencieux ;
5. `src/ui/depense/etat.ts` / la voie de l'écran : afficher `nameFr` quand il existe, garder `name` comme preuve ; le nom de l'article neuf = `nameFr` ;
6. tests : le schéma, la consigne, le saut de cache, l'échec silencieux, le hors ligne.
`aiTask` est redéployé (accord déjà donné pour `nameFr`, D278 ; la bascule d'une tâche neuve attend le sien après la mesure).

## Doutes et limites
- Le juge est un indice (lexique allemand, anglais, italien, court ; pas de dictionnaire) ; le verdict final est la lecture des paires par le pilote. Il ne voit pas un mot étranger hors lexique (anglais courant d'une ligne de service, par exemple), ni un nom propre « traduit » sans mot du lexique.
- Le comptage de lignes inclut les lignes de service ou de frais : la traduction de leur texte libre (dates, noms de domaine) n'a pas de sens, la consigne les fait recopier.
- 14 pièces, 1 tirage : un indice, pas une preuve. Pas de mesure de temps réelle avant la passe.
- La cohérence entre pièces n'est garantie que dans une pièce (les bases y sont dédoublonnées) ; entre pièces, seule la table locale de (b) la garantit : à mesurer.

DÉCISION À PRENDRE : modèle de la traduction (flash-lite ou 3.8) et branchement (a) ou (b) ; recommandation : (b), modèle choisi sur la passe des pièces impaires (le moins cher des deux sans défaut de langue ni de marque de plus que l'autre).
CONNAISSANCE : aucune
LEÇON PROPOSÉE : un module importé d'un script du banc lance son propre `main` si sa garde ne regarde que `process.argv.includes('--simuler')` : toute garde « lancé comme script » doit aussi regarder le nom du script (`process.argv[1]`).
