# Voie domaine — modèle du suivi, lecteur tolérant, intentions et projections (port D451, voie 1)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 120 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md, ../../PLAN.md (§ État de l'art, § Modèle de données, § Interfaces), puis DOSSIER.md.
- Prérequis : c64-fix commité (git log). Sinon rends « ECHEC — prérequis c64-fix non commité ».

## Économie
- Mécanique : aucune.
- Gestes : sans écran (voie de domaine) ; la preuve est Vitest et tsc.

## À faire
1. Plan court en tête de RESULTAT.md : chaque type et fonction de PLAN § Interfaces, son fichier, son test.
2. D'abord le passe-plat : `lireDonneesCarnet`, `lireFacon`, `lireArticle`, `lireNote`, `lireMessage` gardent les clés inconnues
   (lecteur tolérant) ; test : un champ inconnu survit à lire → intention → écriture. Commit séparé « D451 domaine : passe-plat »
   (il part en ligne seul et d'abord, PLAN § Risques 1).
3. Puis les types et lecteurs neufs (genre, categorie, suivi, facons[].suivi, taches, etiquettes, rattache, propositions
   étendues), les dérivations pour un carnet sans `suivi`, les intentions avec inverse, les projections.
4. Fixture : 3 histoires et 3 usages de la maquette, plus 4 cas neufs (fête, assurance, photo seule, chambre froide sans
   suivi), tous marqués « exemple » et préfixés « ZZ TEST — » ; rien ne vient de ses données réelles.

## Critères
- tsc (racine et functions/) : aucune erreur neuve (2 connues) ; tests/unit/carnetsSuivi*.test.ts verts (au moins les cas de
  DOSSIER § Tests) ; tests/unit/carnets* et c48..c64Regles verts ; `npm run build` vert ; `git status --short` : rien hors
  Possède ; deux commits par chemins ; fin « PRÊT <hash passe-plat> <hash suivi> ».

OWNS : src/domain/carnets/modele.ts, operations.ts, domaines.ts, fixture.ts ; neufs src/domain/carnets/suivi.ts, fil.ts,
taches.ts, arbre.ts ; neufs tests/unit/carnetsSuivi*.test.ts ; assertions D451 des tests existants (COMMUN § Tenue) ; ton
dossier de voie. Ne touche pas src/ui, functions/, ia.ts, analyseLocale.ts. Aucun appel Gemini réel ; ne déploie rien.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run <fichiers> --reporter=dot > work/missions/2026-11-24-port-d451/voies/domaine/tests.log 2>&1; tail -5 …/tests.log
