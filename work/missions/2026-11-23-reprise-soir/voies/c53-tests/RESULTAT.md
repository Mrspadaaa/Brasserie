# RESULTAT c53-tests

(en cours — tenu au fil)

## Endroits où chaque règle s'applique (grep)

- R16 (ordre par groupes)
  1. fiche, grille « Caractéristiques » : `FicheArticle.tsx` → `trierParDecision` (functions/src/lienFusion.ts, `rangDeDecision` : ORDRE de 14 familles, « performance » rang 11 après les dimensions, « porte » après, couleur) puis `ordreHoublon` (fiche seule : alpha, récolte, huiles totales, puis suite fixe pays, type, farnésène, caryophyllène, humulène, myrcène, bêta ; cohumulone absente de la suite = au nom).
  2. résumé de la carte : `CarteArticle.tsx` (2 endroits, l. 165 et 216) → `valeursLuesOrdonnees` (comparer.ts) → `trierParDecision` : AUCUN ordre houblon, donc « Alpha · Bêta · Caryophyllène · +10 ».
  3. lecture serveur : `lireLien.ts` l. 185 → `prioriserValeurs` (lienLibelles.ts : ESSENTIEL puis `rangDeDecision` puis nom).
  4. article déjà rangé : `lireCarnet` → `modele.ts` `valeursEnFrancais` → `prioriserValeurs(…, false)`.
  5. non retenus : `valeursLuesDe` (base de Comparer, ordre de la page voulu, CRB-14) ; `TableauCarnet` (choisit UNE valeur par ligne).
- R17 (prix unitaire jamais coupé)
  1. tableau du carnet : `TableauCarnet.tsx` l. 198, `<small class="cn-tab-q">{quantite} · {parUnite}</small>` (CSS : `.cn-tab-q{display:block}`, pas de nowrap).
  2. pastille de prix : `PrixPastille.tsx` l. 67 `cn-pastille-qte` (`.cn-pastille-prix small{display:flex}`, pas de nowrap) ; réemployée par `CarteArticle` (`.cn-classee-prix`) et `FeuilleCartes`.
  3. détail du prix : `PrixRenduDetail` (PrixPastille.tsx l. 133-135, parts jointes par « · »), dans la fiche.
  4. Comparer : `Comparer.tsx` l. 350, `<small>{quantite} · {parUnite}</small>`.
  5. déjà juste : valeurs de colonne `ValeurCarnet` (espaces insécables, C48-6).
  6. non testé volontairement : la pastille empile « 520 » puis « CHF » (maquette B1, D419, choix du brasseur : règle n° 1).
- R18 (marche nommée avec son montant)
  1. Finances › Prévisions : `src/ui/finance/previsions/EscalierSvg.tsx` (`texteLot`, `placerEtiquettes`, repli `compacts` réservé aux projets de matériel).
  2. Calendrier, courbe de l'en-tête : `src/ui/calendrier/entete/Courbe.tsx` `placerNoms` (K51-1 : fusion « + N autre », repli « 2 mouvements »).
  3. Finances › Analyse › Caisse : `src/ui/finance/analyse/Escalier.tsx` (`tronque(libelle, 15)`, une bulle par paiement, pas de fusion du même jour).
  4. non testé : `annuel/Etapes.tsx` (escalier annuel, pas de bulles d'événements).
