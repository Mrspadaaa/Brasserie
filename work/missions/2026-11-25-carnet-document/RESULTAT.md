OK — 4 maquettes « carnet, pas un chat » sur le vrai carnet ; page de choix PAGE OK

## Fichiers écrits (tous dans work/missions/2026-11-25-carnet-document/)
- `maquettes/m1-reecrit.html` · `m2-fiche.html` · `m3-marge.html` · `m4-deux-vues.html` (statiques, 390 px, trois états chacune : `#avant`, `#apres`, `#annuler`)
- `cap/m1-…m4-{avant,apres,annuler}.png` (12 captures 780 × 1688, Chrome 9222, onglet à moi, fermé, `disconnect`)
- `page.html` (les 4 côte à côte, une phrase chacune) ; `cap/page-{haut,page,ordinateur}.png`

Cas : `tests/fixtures/c79/zz-ecoulement-qui-fuit.json`, ses 6 messages mot pour mot (« (exemple) » et « entreprise X » gardés). Rien d'inventé côté données, sauf le lien du presse-papiers `entreprise-x.ch` (fictif, pour montrer « Coller ») et le jour « ven. » de M3 (une proposition de l'IA). Devis inconnu : « attendu », jamais 0.

## Références (lecture 25.11 ; « de mémoire » = connaissance au 06.2026, pas relue : la recherche web était bloquée, captcha)
1. **Granola** (de mémoire). Notes brèves pendant la réunion, puis l'IA les « améliore ». Ses mots restent en noir, ce que l'IA ajoute est en gris. On bascule entre « mes notes » et la version enrichie. → encre distincte (M3), deux vues (M4).
2. **Notion AI** (de mémoire). Sur une sélection : améliorer, corriger, résumer. Le résultat s'affiche en aperçu, avec Remplacer, Insérer dessous ou Annuler. Le mode « suggérer » montre le barré et l'ajouté, à accepter ou à rejeter. → le barré de M1, les cases de M2.
3. **Apple Notes avec Apple Intelligence** (de mémoire). « Relire » souligne chaque correction et passe de l'une à l'autre ; « Revenir » rend l'original. « Réécrire » remplace le texte, avec Annuler. → le bandeau Annuler et Refaire de M1.
4. **Reflect** (page lue). « Notes with an AI assistant », résume, « improve your writing ». « Ask your notes : answers linked to source notes » : chaque réponse cite ses notes. → chaque élément renvoie à sa note (M2, M4).
5. **Mem** (page lue). Rangement automatique en collections. « Mem is shutting down » (16.11.2026) : le rangement invisible n'a pas tenu. → ce que l'IA fait doit se voir et se défaire.
6. **Craft** (page lue). Journal du jour qui « tient les fragments de la journée » ; la structure s'adapte ; assistant IA dans le document. → M1.
7. **Obsidian avec Smart Connections ou Copilot** (de mémoire). L'IA vit dans un panneau à côté et n'écrit dans la note que sur « insérer ». Les notes restent des fichiers texte à soi. → marge (M3), « Mes notes » intouchable (M4).
8. **Google Keep avec Gemini** (de mémoire). « Help me create a list » fait une liste neuve, à garder ou à jeter ; la note existante n'est jamais réorganisée. → plancher : proposer, ne pas écraser.

## Critique comme le brasseur (PORTRAIT) : combien et quels problèmes ?
Une correction faite, captures rouvertes après.
- **M1 · Le carnet se range** : 3 problèmes.
  1. Avant et annuler à moitié vides, car le cas réel est court.
  2. L'annulation reprend tout ou rien : impossible de refuser une seule correction.
  3. La réécriture déplace ses lignes. C'est sa crainte du chat (« ça s'efface et édité mal »), adoucie par Annuler.
  - Note prédite : 7.
- **M2 · La fiche au-dessus** : 5 problèmes, dont 2 corrigés.
  1. Corrigé : tuile Devis incohérente sous la feuille d'annulation.
  2. Corrigé : notes 1 à 4 cachées, sans indice.
  3. La fiche prend la moitié haute et pousse ses notes sous le pli.
  4. Trois « nouveau », un peu bavards.
  5. Reste proche de la fiche actuelle : il peut la trouver peu neuve.
  - Note prédite : 7.
- **M3 · Dans la marge** : 5 problèmes, dont 3 corrigés.
  1. Corrigé : texte hors des lignes du papier.
  2. Corrigé : lien coupé.
  3. Corrigé : « Remettre « attente » » cassé.
  4. Marge de 138 px en 14 px gras : lecture serrée, risque de « difficile à lire ».
  5. Une croix sur chaque note en mode gomme : chargé.
  - Note prédite : 6,5.
- **M4 · Deux vues** : 4 problèmes, dont 2 corrigés.
  1. Corrigé : barre d'estimation à 62 %, qui sortait de nulle part.
  2. Corrigé : bloc Devis en double à l'annulation.
  3. Le bas d'« Organisé » reste vide (cas court).
  4. « Mes notes » ne montre pas ce que l'IA a déjà utilisé.
  - Note prédite : 7,5, la plus fidèle à sa parole du 25.11.

## Sorties décisives
- `node scripts/agents/verifier-page.mjs page.html --page-lot --captures cap/page` → `PAGE OK (12 images chargées, lisible à 390 et 1280 px, sans erreur)`.
- Captures ouvertes : les 12 états, les états corrigés rouverts en planche, `page-haut.png` et `page-ordinateur.png`.
- Tests : sans objet (maquettes) ; rien dans src/.

Prédiction : « M4 pas mal, c'est ça l'idée ; je prendrais la marge de M3 dans Mes notes », M2 jugée trop proche de l'actuel.

DÉCISION À PRENDRE : aucune de mon ressort. Le choix entre M1 et M4, ou leur mélange, revient au brasseur sur `page.html`.
CONNAISSANCE : Mem a fermé le 16.11.2026 (page officielle lue le 25.11). La recherche web par DuckDuckGo est bloquée par un captcha depuis l'agent : lire directement les pages officielles.
LEÇON PROPOSÉE : aucune.
