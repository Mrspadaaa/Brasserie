# Lot g — son ticket Bauhaus, « un enfer » (02.11, soir) — commun aux voies g1, g2a, g2b, g3

## Ses mots (SPEC-BRASSEUR, 02.11 soir, mot pour mot ; lire les entrées D328 à D334 en fin de fichier)
« J'ai testé avec ce ticket, c'est un enfer... C'est très peu fiable, il y a énormément de problème... » ; « Pourquoi il y a pas Tout valider »,
et une à une […] version B que j'ai voulu ??? » ; « le filtre d'erreur rouge n'apparaît pas, et il est sur la famille et sous familles mais jamais sur
l'item en question ??? La partie la plus importante n'est jamais montré ??? Il y a des dizaines de problème de UX, UI de ce type.... » ; « Les filtre
fonctionne assez bien, mais on voit pas lequel on sélectionne. Tu as fait des vrais screenshots de l'app ? » ; « Ce bouton est irréversible ??? »
(Regrouper en une dépense) ; « Plié, déplié ne fait rien » ; « J'ai un champs à remplir, je sais même pas lequel ???? » ; « MAIS QU'EST-CE QUI A ÉTÉ
TESTÉ ?????????? ».

## Ses pièces (hors Git, jamais une valeur dans un fichier suivi, un RESULTAT ou une page)
- Sa lecture réelle, servie par aiTask le 02.11 (cache « Lecture déjà disponible ») : `C:/Users/mrspa/AppData/Local/Temp/bauhaus-0211/final.json`
  (17 lignes, LISEZ-MOI.txt à côté). La photo : `C:/Users/mrspa/.claude/uploads/16fc09ec-4e69-48a9-9744-5912b6ef6552/8a27f106-image.jpg`.
- Ses 14 captures du téléphone (thèmes clair puis sombre, 17 h 57 à 18 h 30) : même dossier, `81c355ea`, `4f176d1a`, `d62b966e`, `24f2b307`,
  `0bf79d32`, `872aef16`, `2d7a0305`, `186b72fa`, `a944b729`, `b3d668ba`, `22eb12fe`, `d0d355d4`, `c071c688`, `46589caa` (segment Nature vide, D335) (suffixe `-image.jpg`). Les ouvrir.
- Les autres pièces réelles du banc : le manifeste `work/finalisation-tickets-2026-10-08/H13-reels/jus0/rejeu-k6.json` (commandes de brassage).

## Ce qui fait foi
Règle n° 1 : ses maquettes choisies restent la base (dossiers `choix-*` de la mission, `ecrans.json`) ; on corrige, on ne redessine pas. D277 (trois
niveaux : sûr = rien, repris = jaune, il contrôle, inconnu = rouge, il remplit). D271 (la désignation imprimée reste telle quelle). D311 (son choix E :
« ce bouton lock rien, juste un shortcut »). D313 et D316 (son choix B : bandeau au pouce, une ligne à la fois « 1/N », « ↻ Tout valider », Garder,
Retirer). D317 (plus de page de choix : défaut du pilote, il juge dans l'app). `.claude/rules/affinee-frontend.md` (densité utile, premier plan),
DESIGN.md, PRODUCT.md, docs/ui-compacte.md. Exigences transversales : tout ce qui manque se voit d'abord sur la rangée et le champ fautifs ; les
deux thèmes ; 390 tactile et 1280 ; aucun nombre rogné ; aucun texte sous 4,5 de contraste.

## Défauts déjà établis (DEFAUTS-RECURRENTS D328a à D334, causes lues dans le code)
D328a « 15 à contrôler » : règle 17 `piece-defaut` (`src/ui/depense/confiance.ts`) en `repris` hors matériel et emballage. D328b « 1 ? » sur les
natures hors stock (`maintenance`, `other`) : unité « sans objet » montrée « ? » et comptée rouge dans les en-têtes. D328c nettoyants et rubans lus
`stock` → Ingrédient, en stock, « 2 nouveaux » ; la bande dit Nettoyage, le type d'achat Ingrédients (`scanKind`, `src/ui/depense/finale.ts:35`).
D328d « ✕ Toutes les lignes » blanc sur blanc en clair (`src/theme/themes.css`, `.bg-ebc-straw *`). D328e récap rogné « Somme = impri… 202,… ».
D328f « 2 Désaccord ». D328g faux français (casse, ordre) sur un ticket déjà en français. D328h « 9,5 » au lieu de « 9,50 ». D329 « Tout valider » absent
pour les changements de la 3e lecture. D330 le rouge sur la famille, jamais sur la rangée. D331 la puce de filtre active sans style (`aria-pressed`
seul, `Comptes` de `src/ui/depense/Recap.tsx`). D332 « Regrouper en une dépense » sans retour. D333 « Plié » ne plie pas (`toutPlierGroupes`,
`src/ui/finance/ExpenseSheet.tsx:1032`, saute les sous-familles « à vérifier »). D334 le champ à remplir ni nommé ni marqué.

## Outils
- Tests, tsc, build : `node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "<commande>"` (copie isolée `%TEMP%/qr-app-copie`,
  resynchronisée à chaque appel ; le worktree n'a pas `zxing-wasm`).
- Banc Chrome : `scripts/check-invoice-journey-emulator.mjs` par `work/missions/2026-10-31-ecran-depense/voies/e-bout/lancer.sh <sortie> <cas>
  390,1280 [manifeste]` ; les émulateurs ont des ports fixes : un banc à la fois (lancer.sh attend).
- Aucun appel réel à Gemini, aucune donnée réelle, aucun déploiement, aucun commit. Fichiers de travail : la voie ou `os.tmpdir()`.
