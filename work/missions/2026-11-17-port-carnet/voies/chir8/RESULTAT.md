OK — 4 bloquants corrigés, 736/736 verts, commit 21450270a, captures 390 ouvertes

# Correctif chirurgical, critique 8 (18.11). Auteur Opus (1er agent à 200 k), reprise par un agent Opus neuf.

## Fichiers (worktree `port-carnet`, commit 21450270a « Port carnet : correctif chirurgical (critique 8) », par chemins)
- `src/domain/carnets/operations.ts` : n° 2 `axeLu` ; n° 4 `lienDuPlan`, `choisisEnAttente` ; (c) critère déjà là = effet renvoi `fusion`.
- `src/ui/carnets/CarnetsVue.tsx` : n° 1 `autreObjet` + `OBJETS_A_PART` + `CARNET_NEUF` ; n° 3 `typerVrac`, `vuesVrac` annonce critère.
- `src/ui/carnets/NoteEnVrac.tsx` : `resumeVrac` compte critères et façons (« 3 critères, pas d'achat », plus « 3 notes »).
- `src/ui/finance/UpgradeWorkspace.tsx` : n° 4, carte « du carnet <titre> · détaché », Ouvrir seulement si lié.
- `functions/src/carnetIA.ts` : consigne, formes génériques (décision b) : « doit tenir <température> », « <débit> au moins »,
  « Un objet d'une autre phrase n'est jamais un critère du carnet ouvert », sans nom d'objet. **Functions touchées : consigne seule.**
- Tests : `tests/unit/carnetsCritique8.test.ts` (neuf, 10 cas), `tests/unit/carnetsOperations.test.ts` (P11),
  `tests/integration/carnetsParcours.test.tsx` (corr2-L1). Captures et script : `voies/chir8/` (Brasserie).
- Non touchés : `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json` (modifié hors de moi, laissé), `functions/.env`,
  `firestore.rules`, `.firebaserc`. Pas de stash, ni push ni déploiement, Gemini jamais appelé.

## Critères
- `npx tsc --noEmit -p .` : 0 ; `npx tsc --noEmit -p functions` : 0.
- `npx vitest run tests/unit/carnet tests/unit/port-q tests/integration/carnet` : **47 fichiers, 736 verts, 1 todo, 0 rouge**.
- `npm run build` : exit 0, 3 « DRAPEAUX OK ».

## Les 8 rouges d'avant : cause et sort
- **C2 serveur** (consigne ne nomme aucun objet) : exemples réécrits en formes génériques (b). Test chir8 aligné.
- **critique4 P22 ×2 et P23, D2 parcours** : `autreObjet` envoyait en carnet neuf une pièce de l'appareil (« filtre à air G4 », « compresseur
  silencieux » dans le Frigo ; « système isobarique » dans l'Embouteillage). Le code avait tort, pas les tests : seul un objet qui vit à part
  (`OBJETS_A_PART` : évier, tuyau, sol, pompe, hotte, fût…) quitte le carnet ouvert. Tests inchangés, verts ; test neuf du cas.
- **critique6 n° 2** (`['critère',…]` contre `['note',…]`) : le pendant annonçait « note » (genre) quand la règle locale disait critère.
  `vuesVrac` annonce maintenant critère : pendant = après. Test inchangé, vert.
- **(c) critique6 n° 1, 2 lignes au lieu de 3** : cause : « Pour la hotte : tient 80 °C », devenu critère, est identique au critère
  « tient 80 °C » déjà dans la Ventilation ; P11 n'écrivait alors **aucun effet**, donc l'après (lu sur les effets) comptait 2. Correctif :
  effet renvoi `fusion` (texte, origine, message gardés ; Annuler et `remplacerRangement` ne retirent rien). Test P11 mis à jour (a) ;
  test neuf dans chir8.
- **corr2-L1** : voulait « 2 bacs pour laver » en note ; c'est une exigence, annoncée critère : l'attente lit notes ou critères (a).

## Captures 390 tactiles (build DEV de banc, `vite preview` 5447, IA simulée), clair et sombre, toutes ouvertes ou vues
- n° 1 `m390-clair-1-autre-objet-pendant.png` : « va dans Nouveau carnet Tuyau silicone », puces Nouveau carnet / Ici ; après : carnet
  « Tuyau silicone » créé, Ventilation intacte.
- n° 2 `m390-clair-2-seuil-debit-apres.png` : m³/h 1 800 / 1 200 / 1 500 / 1 100 gardés, la 120 cm 1re.
- n° 3 `m390-sombre-3-vrac-pendant.png` « 3 critères, pas d'achat » ; `m390-clair-3-vrac-apres.png` « 3 lignes rangées dans 2 carnets »,
  80 °C et 1 200 m³/h critères de la Ventilation, la résine dans « Sol du local ».
- n° 4 `m390-clair-4-a-venir-detache.png` : « du carnet ZZ TEST — Frigo de garde pour fûts · détaché », sans Ouvrir ; « Choisis, pas
  encore dans À venir · 2 » : Embouteillage et Densimètre, Frigo absent.
- Journal `journal-chir8.txt` ; seules erreurs console : réseau Google coupé exprès. Serveur arrêté, build de banc effacé.

## Doutes et limites
- n° 1 : dans le carnet neuf « Tuyau silicone », l'IA simulée range « Tuyau silicone 8 mm au moins » : « 5 m » n'y est pas en critère
  (seulement dans la phrase citée), et « au moins » est la convention P7 de la règle locale. Hors du correctif ; à juger.
- n° 1 : le bandeau dit « titre mis en forme par l'IA » alors que le titre vient de la règle locale (objet de la phrase).
- n° 2 : juste après l'envoi, la ligne Critère montre « tient 80 °C » seul : le critère débit, tout juste rangé, ne se dit que dans sa
  ligne rangée (règle critique 6, n° 14). Pas un effacement ; à confirmer par la critique.
- `OBJETS_A_PART` est un lexique fermé : un objet absent (ex. « compresseur d'air » autonome) reste dans le carnet ouvert ; la puce
  « Va dans » permet de corriger d'un toucher. La consigne serveur dit la même règle à Gemini en production.
- Note 390 collée d'un coup (setter natif + input) : la frappe touche par touche de puppeteer mêlait les lignes.

DÉCISION À PRENDRE : « 5 m » perdu dans le carnet neuf (critère à une seule mesure, P7). Options : A garder (le texte d'origine reste) ;
B critère à plusieurs mesures (« Ø 8 mm, 5 m ») dans la règle locale et l'IA simulée. Recommandation : B, lot à part avec ses tests.

CONNAISSANCE : la destination d'une phrase (quel carnet) est une règle locale même en production ; l'IA ne fait que typer et mettre en
forme. Un critère identique à un critère déjà là laisse maintenant un effet renvoi `fusion`, comme un critère précisé.
LEÇON PROPOSÉE : une règle qui détourne une phrase (« autre objet ») se juge sur les phrases des anciens tests avant de les déclarer
fausses : trois sur quatre étaient des pièces de l'appareil, et c'était la règle qui avait tort.
