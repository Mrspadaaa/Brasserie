# Dossier c72-tests — règles de critique-72 (voies/critique-72/RESULTAT.md)

Lignes : `grep -n "^| C72-" work/missions/BUGS.md`.
- R87 (C72-1, B, 3e retour : C67-4, C68-2) : le coût en tête d'un problème = la retenue s'il y en a une ; sinon la fourchette MIN–MAX des pistes ouvertes (180 et 450 → « 180 à 450 CHF », jamais « 180 à 630 ») ; une option écartée sort du calcul AUSSITÔT (ventilateur écarté → « 450 CHF ») ; une seule piste → son prix seul. Teste par le composant (écran du problème) ET par la fonction, avec 1, 2, 3 pistes, une écartée, une retenue, une sans prix. Cherche (grep) TOUTES les surfaces qui disent ce coût (en-tête, ligne de la liste, jetons, Quand) : chacune a son test.
- R88 : C72-2..6 (m), chacun par le composant.
