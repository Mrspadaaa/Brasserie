OK — critères G1 à G8 rejoués verts par le pilote (01.11 nuit, journal scratchpad p3c-port-b-gates.log) ; l’agent s’est arrêté à 120 tours avant de réécrire cette ligne. Correctifs D261a (noms joints) et D262b (date au mois) ajoutés par le pilote, 91 fichiers et 1 539 tests verts.

## TEMOIN AVANT
**Capturer, avant toute correction** (scènes repos, defile, port ; trois modes ; copie isolée ; journal `%TEMP%/p3cb/avant.log`) : `P3C ECHEC 4`
- souris390 et tactile390 · TETE COMPACTE : haut de la première bande 388 px (maquette 321 px, écart 67, au plus 8)
- pc1280 · RECAP COLLANT : la liste a défilé de 144 px et le récap est sorti (-92 à 12, pied à 748)
- pc1280 · CHIP DU PIED : 994 px (au plus 160) ; à 390 le chip fait 104 px (ok)
**Mutation de B1** (`tri.test.tsx` C5/C14, assertion réelle : aucun `svg[class*="chevron"]` dans le `summary` ET `.dp-no-chevron` présent). Mutation d'une ligne : `src/ui/depense/Ligne.tsx:29` `className="dp-no-chevron hidden"` → `"dp-MUTATION hidden"`. Résultat, `copie.mjs "npx vitest run tests/unit/depense/ecran/tri.test.tsx -t C5"` : `FAIL … C5 … AssertionError: expected null not to be null (tri.test.tsx:118)`. Mutation retirée (Ligne.tsx remis à l'identique, relu).
Seconde garde contre le chevron : l'ancienne assertion `data-dp-chevron` ne pouvait pas échouer (le sélecteur n'existe nulle part).

## Corrigé
| Point | Fichier:ligne | Preuve |
|---|---|---|
| B1 assertion vide | `tests/unit/depense/ecran/tri.test.tsx:116-118` | mutation de `Ligne.tsx:29` : échec observé (TEMOIN AVANT) |
| M1 négation sur toute la rangée | `tests/unit/depense/stock/ecran.test.ts:85` | vitest vert |
| M2 phrase du tiroir de port retirée ; en-tête « Port · hors bandes · 8,50 » | `src/ui/finance/ExpenseSheet.tsx:729` | G5 ; capture `port` |
| M3 script d'émulateur : sélecteurs seulement | `scripts/check-invoice-journey-emulator.mjs:415-419, 546, 563, 633, 752` | `node --check` OK ; émulateurs non lancés (consigne) |
| D3, D4, D5, D6, D7 | voir « avant → après » | vitest vert |
| D6 (code) rond du compte = `data-dp-rond` | `src/ui/depense/Recap.tsx:65` | `ecran.test`, `tri.test` |
| D8 chips Lignes → liste | `ExpenseSheet.tsx:500` | `bande.test.tsx` (3 cas) |
| D11 T16, T17, invariant | `tests/unit/depense/ecran/p3c.test.tsx` | vitest vert |
| D12 « Qté × prix 23/23 lues » hors port | `ExpenseSheet.tsx:684` | `p3c.test.tsx` D12 |
| Critique 1 : colonne gauche collante à 1280 | `ExpenseSheet.tsx:790-815` (`data-dp="gauche"`, `lg:sticky`) | capturer RECAP COLLANT (scène `defile`) |
| Critique 2 : tête compacte à 390 | `Recap.tsx` (bandeau, rangées, propositions dans la preuve), `ExpenseSheet.tsx` (total 34 px, tuiles 42 px, justificatif sans marge fermé) | capturer TETE COMPACTE (écart ≤ 8 px) |
| Critique 3 : chip du pied ne s'étire plus | `src/ui/depense/Pied.tsx:23` (`max-w-[60%] flex-none`) | capturer CHIP DU PIED |
| Critique 4 : lecture = carte-frise | `ExpenseSheet.tsx` bloc `data-dp="lecture"`, `p3c.css` | capturer CARTE-FRISE, `ecran-qr.test` (lecture) |
| Critique 6 : α en double | `etat.ts` `sansAlphaDoublon`, `ExpenseSheet.tsx` prop `nom` | `finitions.test.tsx` |
| Critique 7 : levures sur une ligne, « = 2 sachets » | `etat.ts` `pastilleConversion`, `Ligne.tsx` | `finitions.test.tsx` ; capture |
| Critique 8 : ① du QR = tuile de la rangée | `Verdict.tsx` (`enTuiles`), `ExpenseSheet.tsx` `tuiles` | `ecran-qr.test` (rangée) ; capture `qr-ecart` |
| Critique 9 : chip « 30 ? », trois décimales | `Liste.tsx`, `ExpenseSheet.tsx` `prixImprime` | `finitions.test.tsx` |

## avant → après (tests modifiés)
- **B1** `tri.test.tsx:116-118` (C5/C14) : `expect(resume.querySelector('svg[data-dp-chevron]')).toBeNull()` (vide, ne pouvait pas échouer) → `expect(resume.querySelector('svg[class*="chevron"]')).toBeNull()` ET `expect(resume.querySelector('.dp-no-chevron')).not.toBeNull()` (le marqueur réel qui neutralise le chevron global). Mutation : voir TEMOIN AVANT (échec observé).
- **M1** `stock/ecran.test.ts:85` : `summaries(view)[0].querySelector('[data-dp-stock]').textContent` `.not.toContain('proposé')` → `summaries(view)[0].textContent` (toute la rangée, comme HEAD).
- **D3** `tri.test.tsx` (R1 mouture, 2 négations) : `prixKg(view,1)` `.not.toMatch(/avec mouture/)` (passait d'office : `prixKg` rend `''` si absent) → helper `sansPrixMouture` : pas de `[data-dp-prixkg]`, pas de `[aria-label*="avec mouture"]`, et rien de la forme `/[\d,]+\/\S+ avec mouture/` dans le texte de toute la rangée (l'en-tête « avec mouture » du tableau du plateau n'est pas un prix). `expenseSheetMouture.test.tsx` : + `querySelector('[aria-label*="avec mouture"]')` nul sur la rangée (le `textContent` ne voit pas un `aria-label`).
- **D4** `stock/unites.test.ts` (D214) : titre et vérification alignés : la rangée REPLIÉE (`summary`) contient « unité ? », la proposition est signalée au-dessus de la liste (« 1 proposée par la lecture, à vérifier »), le plateau dit « proposé » et « unité à préciser » (écart annoncé, gardé).
- **D5** `ecran/bande.test.tsx:105` : `Element.prototype.scrollIntoView = vise` jamais restauré → descripteur d'origine sauvé et remis dans un `finally`.
- **D6** `ecran/ecran.test.tsx`, `tri.test.tsx` : `data-dp-chip` en double → le rond numéroté d'un compte est `data-dp-rond` (`Recap.tsx:65`), la chip qu'on touche reste `data-dp-chip`. Le test des chips lit les deux, trie par numéro ET vérifie que les numéros courent de 1 à n sans trou, et qu'aucun `[data-dp-chip][role="img"]` ne reste.
- **D7** `expenseSheet.test.tsx` (« conserve les divergences… ») : clic sur la pastille sans effet vérifié → la preuve ouverte d'office est dite telle (assertion avant le geste), puis le clic est joué avec `scrollIntoView` espionné (et restauré) et l'assertion porte sur son effet : la liste `[data-dp="liste"]` est amenée à l'écran.

- **D1** `fiche/ecran.test.tsx:206` : `/scroll-mt-(9|10|11|12)\b/` → `/(^|\s)scroll-mt-9(\s|$)/` (valeur exacte). **Écart de valeur gardé (voulu par la maquette)** : HEAD `scroll-mt-12` (sous une bande de 40 px) → `scroll-mt-9` (36 px sous l'en-tête de bande de 28 px de p3c-3, `.p3a3-gh{height:28px}`, `.p3a3-li{scroll-margin-top:30px}`) : la tête de la ligne reste sous la bande, mesuré par le capturer (scène `defile`).
- **D2** `tri.test.tsx` (« critique R3 ») : quatre assertions retirées (relié = `bg-attention`, mouture = `bg-hop`, noir réservé à « sans stock »), remplacées par « teinte par catégorie + hachure ». **Changement voulu par la maquette, gardé** : p3c-3 teinte la barre par CATÉGORIE (malt, houblon, levure ; D245/D248 « les bandes teintées … quasiment rien ne doit être changé ») ; le lien au stock vit au picto de chaque rangée (assertions du picto : `ecran.test`, `tri` C5, `Pictos`) et dans les comptes. À faire valider par le pilote.
- **Adaptés par le verdict (assertions gardées, sélecteur ou valeur suivant la maquette)** : `ecran-qr.test.tsx` « sans sceau » : `toContain('space-y-1')` → `toMatch(/space-y-/)` (le bandeau est en pile, pas en grille : même chose vérifiée ; la classe est devenue `space-y-[3px]`, les 3 px de la maquette). `fiche/ecran.test.tsx` n° 16 : `expect(compte()).toMatch(/\d+ nouveau(?!x)|\d+ nouveaux/)` (un « 0 nouveau » était affiché au départ) → `.not.toMatch(/\b0 nouveau/)` : le verdict (critique 2) demande de ne plus afficher un compte à zéro ; les assertions suivantes du test (« 1 nouveau », « 2 nouveaux ») sont inchangées. `ecran-qr.test.tsx` (« deux tuiles ; la chip ① Total ») : + « ① Total » est dans la rangée de la tuile Règlement. Ajoutées, rien retiré : `finitions.test.tsx` (7 tests).
- **D8** `bande.test.tsx` (3 cas ajoutés, un par code) : la chip « Lignes » amène à `[data-dp="liste"]` (pas à la preuve, pas à `[data-purchase-lines]`).
- **D9** (aucun test modifié) `ExpenseSheet.tsx:240` : « Le détail des lignes doit correspondre… » sans ligne invalide : le focus va au champ `#purchase-total` (HEAD : le résumé de la liste). **Gardé** : le détail de la liste n'est plus un `summary` focalisable ; quand toutes les lignes sont valides et que le détail ne correspond pas, c'est le total qui reste à corriger ou à confirmer (le focus s'y pose, `issueTarget`). Comportement changé, déclaré ici ; non couvert par un test (aucun test d'avant ne visait ce focus).
- **D10** (aucun test modifié) `Recap.tsx:48` : « Lectures : désaccord sur certains points » → « Lectures » + coche ou « n lectures » / « n/n ». **Gardé** : p3c-3 n'a pas la phrase (la rangée tient en une ligne) ; le désaccord reste porté par la chip « Désaccord » (point `lectures-divergentes`, enjeu info) et par la croix manquante. Information un peu plus pauvre, déclarée.
- **D11** `p3c.test.tsx` : T16 (a l'écran : une lecture sans ligne reçoit une rangée vide, « Ajouter » actif ; b la `Liste` seule sans ligne dit « Aucune ligne » et garde « Ajouter » actif), T17 (34 lignes en bandes + 1 port = 35 : « Ajouter » désactivé, titre « 35 lignes au plus, port compris » ; l'écran à 23 lignes reste actif), invariant sur l'écran rendu pour les états `3` et `port` : Σ sous-totaux des bandes + « dont port » = Σ des `Montant ligne n` du brouillon = Total = « Détail ». **Constat** : « Aucune ligne » est une branche défensive de `Liste` que l'écran n'atteint pas (une lecture vide donne une rangée vide, « Retirer » est caché à une seule ligne) : T16 la prouve donc sur le composant.
- **D12** `p3c.test.tsx` : `Qté × prix` = `a/b lues` hors port (a = `controls.lines.checked` moins les lignes de port lues ; b = lignes affichées) : « 23/23 lues » avec ou sans le port (HEAD : `24/24` en état `port`).

## Rien ne se perd

## captures

## Non fait

LEÇON PROPOSÉE : aucune pour l'instant
