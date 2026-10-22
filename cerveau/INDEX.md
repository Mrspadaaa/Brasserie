# Second cerveau — L'Affinée

Le savoir durable, partagé par toutes les sessions et tous les agents. Ce fichier et `LECONS.md`
sont chargés à chaque session par CLAUDE.md. Les notes se lisent à la demande.

## S'en servir

- **Avant une tâche** : les leçons sont en contexte. `node scripts/agents/systeme.mjs chercher <mots>`,
  puis ouvrir les notes utiles, pas toutes.
- **Une maison par fait** : un fait durable devient une note atomique, écrite par le pilote (une voie
  propose par `CONNAISSANCE : …`, une erreur de méthode par `LEÇON PROPOSÉE : …`). Ailleurs, un lien,
  jamais une copie : la copie vieillit et contredit l'original. Une règle remplacée va dans `REMPLACES.md`.
- **Élaguer** : au plafond, une entrée impose une sortie (fusion, ou note lue à la demande). Contrôles :
  `systeme.mjs cerveau`, `charge`, `remplaces` ; le hook rejoue `cerveau` après chaque écriture ici.
  Note : en-tête `name`, `description`, `type` (= dossier), `maj`, `sources` ; 50 lignes au plus.
- **Daté** : une note dit ce qui était vrai à sa date `maj`. Pour une décision actuelle, le code,
  PRODUCT.md, DESIGN.md et les dernières paroles du brasseur priment.

## Documents canoniques (hors cerveau)

- Paroles du brasseur, mot pour mot : `work/refonte-frontend/v4/SPEC-BRASSEUR.md`
- Défauts devenus contrôles : `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`
- Décisions numérotées : `work/refonte-frontend/decisions.md` ; état : `work/refonte-frontend/registre.md`
- Produit et design : `PRODUCT.md`, `DESIGN.md`, `docs/ui-compacte.md`, `docs/specs/houblons.md`
- Système d'agents (rôles, décisions, boucles) : `docs/agents/systeme.md` ; missions : `work/missions/`
- Tickets : issues GitHub `Mrspadaaa/Brasserie`

## Carte

### brasseur/ — comment le brasseur juge, ce qu'il aime et refuse
- [[penser-brasseur]] — α, rôle, arômes, moment avant l'IBU ; stock en icône
- [[pas-de-cockpit]] — premier plan léger, détails à un toucher, représentations modernes
- [[rien-de-fige]] — ébullition, dose, whirlpool, dry hop réglables ; minutes par 5′
- [[le-brasseur-choisit]] — chaque lot lui est montré ; le jury filtre, il ne choisit pas
- [[fil-de-fer-d-abord]] — exploration en fils de fer en planche ; fidélité pour la retenue
- [[exploration-v0-libre]] — v0 libres sur la baseline ; l'entonnoir : vaste panel minimaliste, classement, greffes, passes (M13)
- [[methode-ui-v3]] — tous les écrans, un ticket par sujet (#133)
- [[micro-correctifs]] — aller-retour rapide, capture si l'apparence est ambiguë

### metier/ — houblons, levures, eau, chimie, moteur
- [[descripteurs-hors-familles]] — pourquoi Nelson Sauvin paraît ordinaire et Motueka ultra fruité
- [[modele-brassage]] — moments de houblon typés, levure structurée, recette figée dans le brassin
- [[chimie-eau]] — AR en ppm d'ion, solveur plafonné, alcalinité à l'empâtage, chaux
- [[cout-calcul-moteur]] — simulerCas : 1,4 ms léger, 4 à 6 ms complet par cas ; une variante en direct, sans serveur

### produit/ — outils, écrans, état fini ou inachevé
- [[outils-houblons]] — une question = un outil : la carte à poser avant tout lot
- [[acquis-valides]] — ce que le brasseur a validé et qui doit survivre d'un lot à l'autre
- [[page-partagee]] — la page partagée ne montre que l'état à jour
- [[saisie-mobile]] — jamais type="number", densité pilotée par le clavier
- [[import-recette]] — le procédé vit dans le déroulé ; fiche de brassage éditable
- [[export-et-ia]] — fiches IA sur le stock, export texte avec l'eau, relecture consultative
- [[design-system-historique]] — historique et pièges UI ; règles actuelles dans DESIGN.md
- [[pictos-familles]] — pictos d'arômes au trait ; symboles pris ; « épicé » refusé trois fois, piment ou mot (r4c) à choisir
- [[socle-v01]] — socle Dexie et Firestore de la v0.1 (historique)

### agents/ — façon de travailler, outils, environnement
- [[agents-sans-openai]] — plus d'agent OpenAI depuis le 08.10
- [[controles-mecanises]] — leçons devenues contrôles, sorties de LECONS (plafond de 8 lignes)
- [[autonomie-decisions]] — pas de question bloquante ; l'irréversible attend l'utilisateur
- [[fermeture-et-quota]] — fermer sans bloquant ; paliers de quota ; session neuve au-delà de 450 k
- [[verification-locale]] — ?dev-local, scripts de contrôle locaux
- [[monkey-testing]] — trois règles, deux angles morts, le cumul de stock
- [[gemini-tests-reels]] — Gemini réel en test seulement, journalisé, jamais dans npm test
- [[poste-windows-msix]] — pièges Windows : MSIX, tâches planifiées, Bash et barres inverses

### sources/ — références externes
- [[moneaudebrassage]] — la référence visuelle de l'atelier de l'eau

### decisions/ — transcriptions du conseil
- [[2026-10-22-carte-outils-houblons]] — un facteur libre par écran ; Comparer seul au lot 22
