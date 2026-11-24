# RESULTAT k57

(tenu au fil)

## Plan (cause, fichier:ligne, correctif)

- K57-1, règle : tout défilement au bord du Calendrier a la même vitesse plafonnée (8 colonnes/s), une borne, et rien après le lâcher.
  - Cause : `Fenetre.tsx:371-381` (bord du cadre de l'en-tête) fait grandir la vue par `span × (1 + vitesse × 0,6 × dt)` : croissance EXPONENTIELLE
    (vitesse ×2,5 depuis Q4-1 : ×7 par seconde à 4 px du bord) ; seul le plafond de la courbe entière (1,3 × total) l'arrête. Le corps (`s.pan += vitesse × span × dt`) et
    `DureeFenetre.tsx:149-169` (`pas = vitesse × span × dt`, durée de la fiche) n'ont aucun plafond. Seules les barres (`usePointeur.ts:93`) en ont un.
  - Correctif : `frise/defileBord.ts` `plafondFenetre(span0, dt)` = 8 colonnes/s, une colonne = le sixième de l'échelle prise au début du geste ; appliqué aux 3 endroits
    (cadre : grandir et corps ; durée : pas). Croissance linéaire, bornée par `total` (poserPlage) comme avant. `COLONNES_MAX_PAR_S` déménage dans defileBord.ts (usePointeur le réexporte).
- K57-2, règle : saisir une poignée ne change rien ; le bord suit le DÉPLACEMENT du doigt depuis le point de prise.
  - Cause : `usePointeur.ts:303` `joursJusquAuDoigt(axe, xPrec + corr, bout)` : le bout va au jour sous la position ABSOLUE du doigt ; `corr` (POI-1) ne rattrapait que le
    décalage à la zone d'avant (22 px), pas le décalage au bout : un doigt à 15 px du bout saute de 2 jours, à 30 et 60 px de 3.
  - Correctif : `alignement.ts` `correctionAuBout(axe, x0, bout)` = x du milieu du jour du bout − x de la prise ; `usePointeur.ts` pose ce `corr` à la prise (fin ET début,
    jalon compris). Le toucher bref de la part rentrée garde son drapeau (`rentree`), séparé de `corr`.
- Endroits semblables (grep) : `joursJusquAuDoigt` (un seul appelant), `vitesseCalendrier` (3 : usePointeur, Fenetre, DureeFenetre), poignées de `src/ui/geste` (partagé : non touché).
