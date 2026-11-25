# Dossier r54

- Tests à rendre verts : les cas R54 et R51 de tests/unit/c66Regles.test.tsx restés à la voie liste (voir work/missions/2026-11-24-port-d451/voies/liste/RESULTAT.md et voies/c66-fix/RESULTAT.md) ; ajoute un test par le composant : fiche houblon, cocher 1 kg (62,20), bouton Choisir, écran Choisir, valider : l entrée À venir porte 1 kg et 62,20 ; Retirer depuis la feuille Articles : Annuler visible et rend l article.
- Possède : src/domain/carnets/modele.ts (champ quantité du choix), operations.ts (choisir), src/ui/carnets/prixChoisi.ts, FicheArticle.tsx, Choisir.tsx, ecransCarnet.tsx (passage de la quantité), FeuilleCartes.tsx, CarnetOuvert.tsx (bandeau Annuler au-dessus de la feuille) ; tests c66Regles et carnetsR54*.
- Garder carnets*, c48..c66Regles, lot3CarnetOuvert, virgule-transversale, proprietes verts. Aucune donnée réelle.
