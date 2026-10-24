# Voie a-cerveau-memoire — verser la mémoire locale dans le second cerveau

- Mission : 2026-10-22-essai-voies
- Agent : executant
- Modèle : haiku
- Niveau : mécanique
- Plafond : 40 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Convertir 24 notes de la mémoire locale de Claude en notes du second cerveau (`cerveau/`), au format
du cerveau, sans perdre un fait, une date, un chiffre ni une citation du brasseur.

## Entrées
- `C:/Users/mrspa/.claude/projects/C--Users-mrspa-Documents-Brasserie/memory/` — les notes source
  (lecture seule, hors dépôt ; ne rien y écrire).
- `cerveau/INDEX.md` — le format d'une note (section « S'en servir »).
- `cerveau/produit/acquis-valides.md` — exemple d'une note au bon format.
- `cerveau/LECONS.md` — les leçons existantes, pour remplacer les liens vers les notes non versées.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
Les 24 fichiers de la colonne « Destination » ci-dessous, et rien d'autre. Pas `cerveau/INDEX.md`
(le pilote l'écrit), pas `cerveau/LECONS.md`, pas la mémoire source.

## Correspondance

| Source (mémoire) | Destination |
|---|---|
| affinee-penser-brasseur.md | cerveau/brasseur/penser-brasseur.md |
| affinee-brasseur-choisit.md | cerveau/brasseur/le-brasseur-choisit.md |
| affinee-ui-pas-cockpit.md | cerveau/brasseur/pas-de-cockpit.md |
| affinee-variables-dynamiques.md | cerveau/brasseur/rien-de-fige.md |
| affinee-fil-de-fer-d-abord.md | cerveau/brasseur/fil-de-fer-d-abord.md |
| affinee-methode-ui-v3.md | cerveau/brasseur/methode-ui-v3.md |
| affinee-exploration-v0-libre.md | cerveau/brasseur/exploration-v0-libre.md |
| affinee-micro-correctifs.md | cerveau/brasseur/micro-correctifs.md |
| affinee-brassage-modele.md | cerveau/metier/modele-brassage.md |
| affinee-chimie-eau-corrections.md | cerveau/metier/chimie-eau.md |
| affinee-saisie-mobile.md | cerveau/produit/saisie-mobile.md |
| affinee-import-recette.md | cerveau/produit/import-recette.md |
| affinee-export-et-ia.md | cerveau/produit/export-et-ia.md |
| affinee-design-system.md | cerveau/produit/design-system-historique.md |
| affinee-decisions-v01.md | cerveau/produit/socle-v01.md |
| affinee-page-partagee-a-jour.md | cerveau/produit/page-partagee.md |
| affinee-reference-eau.md | cerveau/sources/moneaudebrassage.md |
| affinee-agents-sans-openai.md | cerveau/agents/agents-sans-openai.md |
| affinee-autonomie-decisions.md | cerveau/agents/autonomie-decisions.md |
| affinee-fermeture-et-quota.md | cerveau/agents/fermeture-et-quota.md |
| affinee-gemini-tests-reels.md | cerveau/agents/gemini-tests-reels.md |
| affinee-verification-locale.md | cerveau/agents/verification-locale.md |
| poste-claude-desktop-msix.md | cerveau/agents/poste-windows-msix.md |
| affinee-monkey-testing.md | cerveau/agents/monkey-testing.md |

Notes **non versées**, car une leçon les porte déjà. Un lien vers elles devient le texte entre
parenthèses : affinee-portee-decisions (leçon L01), affinee-partir-de-l-actuel (leçon L02),
affinee-reprendre-tout-l-element (leçon L03), affinee-exigence-transversale (leçon L05),
affinee-baseline-plancher (leçon L07), affinee-travaux-inacheves (leçon L11),
affinee-geste-se-voit (leçon L12), affinee-plainte-devient-controle (leçon L13).
Non versée et sans lien : poste-reseau-realtek-dhcp (le réseau du PC, hors projet).

## Consignes
- En-tête de chaque note, dans cet ordre :
  `name` (nom du fichier sans .md), `description` (une ligne, reprise de la source et ajustée),
  `type` (le dossier : brasseur, metier, produit, sources ou agents), `maj: 2026-10-22`,
  `sources` (« mémoire locale <fichier source> » plus les chemins du dépôt que la note cite).
- Corps : garder tous les faits, dates, chiffres, citations entre guillemets et chemins. Titres
  « Why » et « How to apply » → `**Pourquoi**` et `**Comment l'appliquer**`. 50 lignes au plus :
  si la source est plus longue, résumer les exemples, jamais les règles ni les chiffres.
- Liens : un lien vers une autre source de la table devient le nom de sa destination entre doubles
  crochets ; un lien vers une note non versée devient « (leçon Lnn) ». Aucun autre lien.
- Ne rien inventer. Un passage incompris se recopie tel quel.

## Exigences transversales et acquis
Sans objet (voie de conversion) ; les citations du brasseur restent mot pour mot, fautes comprises.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent. Réponse finale au pilote : une ligne.
