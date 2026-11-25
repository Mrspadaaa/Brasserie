# RESULTAT c75-fix (tenu au fil, 25.11)

## Plan (par règle, chaque endroit de c75-tests/RESULTAT.md)
- R98 / R99 : nouveau `src/domain/carnets/reclasser.ts` (proposition PURE + `reclasser` annulable + vue sans l'erreur) ; carte `CarteReclasser.tsx` ; branchée dans `CarnetOuvert` (via `rappels.reclasser`, `actionsCarnet.rappelsDe`) ; vue sans erreur dans `useDonneesCarnets` (liste ET carnet).
- R100 : `prixUnitaire.poidsLus`, `tableauRegles` (kilo du sachet, `quantiteDuChoix`, `centimesRendus`, `sachetsSansPrix`), `FicheArticle` (table « prix à relire » + Relire), `Comparer` (Choisir porte le sachet).
- R101 : `CarnetOuvert` (projet du Planning reconnu à sa note) + `RubriqueQuand` (date du début avec l'année).
- R102 : R73-6 `noteSurArticle.avecFaitsDesNotes` ; reste en cours (R73-7, R73-11, R73-13, R73-9, R75-5, R75-6, R73-23, R73-24).
