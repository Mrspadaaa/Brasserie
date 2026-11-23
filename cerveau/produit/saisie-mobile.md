---
name: saisie-mobile
description: Règles de saisie mobile L'Affinée (livrées le 04.09.2026) — jamais type="number", densité pilotée par le clavier, sélection tactile au relâchement.
type: produit
maj: 2026-10-24
sources: mémoire locale affinee-saisie-mobile.md ; src/ui/numericInput.ts ; src/ui/useViewport.ts
---

Refonte de la prise de données mobile livrée le 04.09.2026, à la demande de Gaëtan (« sur mobile le clavier laisse très peu de place », « les dropdowns se ferment tout seuls »).
- **Plus jamais `<input type="number">`.** Il refuse la virgule du clavier français en renvoyant une chaîne VIDE, que les `parseFloat(v) || 0` transformaient en zéro : « 12,50 » s'enregistrait à 0.00 CHF. Tout passe par `NumberInput` / `NumericField` / `useNumericDraft` (`src/ui/numericInput.ts`), qui gardent une CHAÎNE pendant la frappe et ne remontent qu'un nombre lisible. Les bornes `min`/`max` s'appliquent à la SORTIE du champ, jamais à la frappe (sinon 15 est inatteignable quand le minimum vaut 10).
- **`NumberInput` ne borne QUE si on le lui demande.** Sans `min`, il accepte les négatifs : constaté le 04.09.2026 en pilotant l'app, un volume d'empâtage de −30 L passait et l'écran affichait « Doses totales pour -30 L ». 24 bornes posées dans l'atelier de l'eau, l'analyse et l'assistant. Tout nouveau champ numérique doit porter sa borne.
- **Étiquette et champ partagent un identifiant.** `Field` pose `htmlFor`, mais `NumberInput` et `Combobox` ne reçoivent l'`id` que si on le passe. Reste à faire hors atelier de l'eau : 13 `Combobox` sans `id` (`StockDetailSheet` 3, `BrewWizard` 3, `QuickActionModal` 2, `StocksTab` 2, `StockPreview` 2, `KegSheet` 1).
- **Piloter par script : React écoute `focusout`, pas `blur`.** `el.blur()` ne déclenche pas `onBlur` quand le document n'a pas le focus ; utiliser `el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))`.
- **Une liste ne se sélectionne jamais sur `pointerdown`** : un défilement commence par un `pointerdown` sur une option. On valide au `pointerup`, si le doigt a bougé de moins de 12 px. Le `preventDefault` n'est gardé que pour la souris.
- **Le clavier virtuel ne réduit NI `vh`, NI `dvh`, NI `window.innerHeight`.** Seul `visualViewport` bouge. Tout conteneur ancré en bas (`Sheet`, `ModalShell`, `PageShell`) retranche `useKeyboardInset()`, sinon le bouton d'enregistrement passe dessous.
- **Densité pilotée par le clavier** (`useDensity`, `src/ui/useViewport.ts`) : `comfortable` / `compact` / `tight`. En `tight` (téléphone + clavier ouvert), sous-titres, explications et rembourrages cèdent ; le `SegmentedControl` en grille passe sur une ligne défilante. Ce qui ne bouge jamais, à la date du 04.09 (DESIGN.md prime aujourd'hui) : le plancher typographique à 14 px et les cibles à 48 px (voir [[design-system-historique]]).
- **Certains champs n'ouvrent pas le clavier du système** : `readOnly` + `inputMode="none"` au pointeur grossier, remplacé par `NumPad` (pavé intégré, ~210 px contre ~300). `readOnly` est le seul moyen respecté par tous les navigateurs. Le pavé se `scrollIntoView` lui-même à l'ouverture, sinon il naît hors écran sur un champ en bas de formulaire.
- **`MoneyField` branché** sur la saisie de dépense et de vente (`QuickActionModal`) : on tape le TTC du ticket, le HT est déduit par `splitTva`. Le champ demandait auparavant un montant HT, le calcul de tête que le composant existait pour supprimer.
- **`?keyboard=330`** simule un clavier en développement, comme les `?preview=` ; éliminé du paquet de production (vérifié dans `dist/`).
- **Code mort repéré, non touché** : `AddStockItemModal`, `EditStockItemModal` et `components/ui/Stepper` ne sont importés par aucun écran.
- Vérification : `npm test` (320 tests), `npx tsc --noEmit`, `npm run build`.
- Un voile de fermeture sous le doigt reçoit le `click` synthétisé à la fin d'un appui long et referme la feuille à peine ouverte : un appui long qui ouvre une feuille ignore le click suivant (600 ms ; fl-z, 24.10).

Voir [[socle-v01]] et [[modele-brassage]].
