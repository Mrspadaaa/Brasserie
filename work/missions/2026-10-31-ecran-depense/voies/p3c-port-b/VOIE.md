# Voie p3c-port-b — corriger le port de p3c-3 (relecture du code et verdict du critique)

- Mission : 2026-10-31-ecran-depense
- Agent : auteur neuf ; modèle : sonnet ; niveau : jugement (l'écran qui écrit une dépense)
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : p3c-port (code non commité dans le worktree ; ses critères rejoués verts par le pilote le 01.11)
- Décideur en cas de doute : pilote ; l'option prudente et réversible

## Objectif
L'écran Nouvelle dépense est déjà p3c-3 dans l'app (voie p3c-port). Deux relectures demandent des corrections avant de le lui
montrer. Tu les fais toutes, **sans rien refaire d'autre** :
- la relecture du code : `work/missions/2026-10-31-ecran-depense/voies/p3c-port/REVUE-code.md` (B1, M1 à M3, D1 à D12) ;
- le verdict du critique : `work/missions/2026-10-31-ecran-depense/critique/VERDICT-p3c-port.md` (points 1 à 9).

Lis d'abord ces deux fichiers en entier. Puis `voies/p3c-port/VOIE.md` (décisions du pilote 1 à 8, règle n° 1, « Rien ne se perd ») et
`voies/p3c-port/RESULTAT.md` (ce qui a été fait). Lis le code au fil des corrections ; ne relis pas toute la voie p3c-port.

## Ce qu'il faut faire
**Tests (L13 : un test qui ne peut pas échouer ne prouve rien)**
1. B1 `tests/unit/depense/ecran/tri.test.tsx:116` : remplacer l'assertion vide par une assertion sur un élément réel. **Témoin** :
   montre qu'elle échoue quand on fausse le code (une mutation d'une ligne, essayée puis retirée), et écris la mutation et l'échec dans
   RESULTAT.md.
2. M1 `tests/unit/depense/stock/ecran.test.ts:85` et D3 (tri R1 mouture, `expenseSheetMouture.test.tsx`) : la négation porte sur toute la
   rangée, pas sur un sous-élément.
3. D4 (`unites.test.ts`), D5 (restaurer `Element.prototype.scrollIntoView`), D6 (`data-dp-chip` en double : un nom par rôle), D7 (le test
   fait le geste et vérifie son effet, pas un état ouvert d'office).
4. D11 : écrire T16 (liste vide) et T17 (plafond de 35), et un test de l'invariant « Σ bandes + dont port = Σ du brouillon » **sur
   l'écran rendu**.
5. D1, D2, D9, D10 : changements voulus par la maquette. Garde-les, mais écris chacun dans RESULTAT.md, avant → après, avec la raison.

**Code**
6. M2 et critique 5 : retirer la phrase du tiroir de port (`ExpenseSheet.tsx:729`). Un en-tête court, « Port · hors bandes · 8,50 », sans
   phrase.
7. M3 : `scripts/check-invoice-journey-emulator.mjs`. Seuls les sélecteurs s'adaptent au nouvel écran (« Détails de la lecture »,
   `/proposé :/` dans le `summary`, lignes 417, 419, 546, 633, 752) ; les contrôles restent les mêmes. `node --check` doit passer ; tu ne
   lances pas les émulateurs.
8. D8 : les chips `lignes-perdues`, `lignes-annoncees` et `lignes-non-rapprochees` mènent à un élément qui existe dans la disposition
   lecture.
9. D12 : « Qté × prix » compte les lignes lues hors port (R2).
10. Critique 1 à 3, à corriger avant tout :
    - à 1280, la colonne de gauche est collante comme dans la maquette ;
    - à 390, la tête est aussi compacte que la maquette, au pixel près ;
    - à 1280, le chip « ① TVA » du pied ne s'étire pas.
11. Critique 4 et 6 à 9, finitions :
    - la lecture en cours prend la carte-frise de la maquette ;
    - l'α n'apparaît plus en double dans le nom : affichage seul, le nom imprimé entier reste au plateau, et rien d'enregistré ne
      change ;
    - les levures tiennent sur une ligne, avec « 2 sachets » au pluriel ;
    - le point ① du QR est une tuile dans la rangée ;
    - le chip « 30 ? » revient ;
    - trois décimales pour un prix sous 0,10.

**Le contrôle d'abord (L13)** : ajoute à `voies/p3c-port/capturer-p3c.mjs` les contrôles des points critiques 1 à 3 :
- récap visible après défilement à 1280 ;
- haut de la première bande à 390 au plus à 8 px de la maquette ;
- largeur du chip du pied à 1280 au plus 160 px.

Lance-le **avant** de corriger : il doit échouer, et tu écris cet échec dans RESULTAT.md (TEMOIN AVANT). Puis corrige, et il doit
passer.

## Ce qui ne change pas
Le business est juste à 100 % (relecture : `src/services`, `src/domain` et `functions` sans diff). Ne touche ni l'enregistrement, ni
l'appariement, ni la lecture, ni le critère du port (`lignesDePort`, D258). Ne retire aucune assertion. Rien de ce qui est listé dans
`voies/p3c-port/VOIE.md` § Objectif, point 3, ne se perd.

## Où l'on joue
Tests, `tsc`, build et Chrome se jouent dans la copie isolée, par
`node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs <commande>` depuis la racine du worktree. Jamais de serveur dans
`C:/Users/mrspa/Documents/Brasserie`, jamais d'installation dans la jonction.

## Possède
- `src/ui/finance/ExpenseSheet.tsx`
- `src/ui/finance/InvoiceScanReview.tsx`
- `src/ui/depense/**`
- `src/ui/ModalShell.tsx`
- `tests/integration/expenseSheet.test.tsx`
- `tests/integration/expenseSheetMouture.test.tsx`
- `tests/integration/jus0Journey.test.tsx`
- `tests/unit/depense/ecran/**`
- `tests/unit/depense/qr/**`
- `tests/unit/depense/fiche/ecran.test.tsx`
- `tests/unit/depense/stock/ecran.test.ts`
- `tests/unit/depense/stock/unites.test.ts`
- `scripts/check-invoice-journey-emulator.mjs`
- `work/missions/2026-10-31-ecran-depense/voies/p3c-port/capturer-p3c.mjs`
- `work/missions/2026-10-31-ecran-depense/voies/p3c-port/captures/**`
- `work/missions/2026-10-31-ecran-depense/voies/p3c-port-b/**`

Et la copie isolée (`%TEMP%/qr-app-copie`, par `copie.mjs`).

## Interdits
- `src/services/**`, `src/domain/**`, `functions/`, `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`, et les
  tests hors Possède (ils restent verts sans être modifiés).
- Aucun déploiement, aucun commit, pas de `git stash`, aucun appel Gemini.
- Aucun fichier écrit par heredoc ni par `node -e` : utilise l'outil Write ou Edit.
- Chemins absolus dans Bash.

## Critères
`GATES.md`, même dossier. Ne le modifie pas.

## Rendre
`RESULTAT.md`, écrit **section par section dès le début** (L18) :
- ligne 1 : `OK — …` ou `ECHEC — …` ;
- « TEMOIN AVANT : … » (capturer en échec, et la mutation de B1) ;
- une table « Corrigé », un point par ligne : point, fichier:ligne, preuve ;
- « avant → après » pour chaque test modifié ;
- « Rien ne se perd » ;
- les captures ouvertes : repos à 390, défilé à 1280, port, lecture, QR écart ;
- `LEÇON PROPOSÉE : …`.

Puis une ligne au pilote.
