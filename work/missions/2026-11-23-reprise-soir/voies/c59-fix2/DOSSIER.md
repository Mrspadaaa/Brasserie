# Dossier c59-fix2 — finir la voie c59-fix (voies/c59-fix/RESULTAT.md, dernier commit 400643d26)

- Fait par c59-fix : R35 (C59-1, Relire n'écrit que dans son carnet) et C59-2 (« IA en pause : plafond de dépenses atteint ») verts. Ne pas les casser.
- Restent rouges (npx vitest run tests/unit/c48Regles.test.tsx tests/unit/c59Regles.test.tsx) :
  - c48Regles R4 « compromis sans critère, rangé par le prix seul : les prix et dimensions du tableau ne se redisent pas » : RÉGRESSION de c59-fix (vert avant). Le compromis dit gain ET perte (R32, sa réponse « Oui ») par ÉCARTS (« +289,77 CHF pour +1,46 m³ »), jamais en recopiant une valeur du tableau : les deux tests tiennent ensemble.
  - R36 (C59-4) : un critère qui parle d'une marmite classe d'abord la bonne famille ; un frigo de 50 L pile ne passe pas 1er devant une marmite de 45 L.
  - R37 (C59-7) : un seul prix par article, la même valeur « ≈ n CHF » dans Comparer, la feuille Articles et la fiche (MotlerHops 3,72 €).
  - R38 (C59-8) : sur un houblon, « Citra : 13,6 % » devient « Alpha 13,6 % » et l'alpha passe en tête (cerveau/brasseur/penser-brasseur.md : α d'abord) ; (C59-9) les arômes se disent en français, à la lecture serveur et à l'affichage (« Limette, Mango, tropische Früchte » → « citron vert, mangue, fruits tropicaux »).
- Puis : suites tests/unit/c4*, c5*, carnets*, proprietes vertes ; registre C59-n, C58-3, C58-4, C50-5 → « corrigé en local <hash> » ; BUGS OK.
