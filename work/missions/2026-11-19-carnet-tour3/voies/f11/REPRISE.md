# REPRISE f11 (contexte 151 k, 20.11) — rien commité

Code modifié (port-carnet, non commité, fichiers de f11 seulement) :
- src/domain/carnets/comparer.ts : `avecArticleTypo` (avecArticle + l’ typographique).
- src/ui/carnets/CarnetsVue.tsx : `libelleProposee` via avecArticleTypo (v7-1) ; `depuisIA` pose `luLe` ISO sur les valeurs d'une page lue (PCN-110).
- src/domain/carnets/operations.ts : accepterProposition, critère « la température mini » via avecArticleTypo (v7-1).
- src/ui/carnets/pictos.tsx : picto `pot` (résine, peinture, vernis, sol, détergent…) + dessin + LIBELLE (v7-2).
- src/ui/carnets/ListeCarnets.tsx : `cn-carnet-long` aussi si citation > 28 signes (v7-3 : « Coller un lien » passe dessous).
- src/ui/carnets/carnets.css l. 46 : `.cn-sous > .cn-mut { font-weight: 400; font-size: 14px; }` (PCN-110, comme h01-6).
- tests/unit/carnetsTour3F11.test.tsx (10 tests) : rouge 6/9 (tests-rouge.txt) puis CSS 1/10 (tests-rouge-css.txt), vert 10/10 (tests-vert.txt).
- tests-final.txt : 53 fichiers, 751 verts (avant la règle CSS) ; tsc propre.

Captures (f11/captures, script captures.mjs [lu|puce|liste], PORT_BANC=5199, serveur : vite --config ../v3/vite.v3.config.mjs --port 5199) :
- v7-1 : DOM « Comparer sur la température mini (°C) », « le volume », « le bruit » (app ?dev-local) — captures non ouvertes.
- v7-2 : DOM picto `pot` sur « Résine pour le sol du local » — capture non ouverte.
- v7-3 : v7-3-390-clair ouverte : citation entière sur 2 lignes, bouton dessous. OK.
- PCN-110 : pcn110-390-sombre ouverte : « lues sur la fiche du vendeur, 19 nov. » PARAÎT, mais encore en gras et sur sa propre ligne :
  la règle `.cn-sous > .cn-mut` ne s'applique pas (vérifier dans le DOM la classe réelle du h3 / une règle plus forte), la corriger
  pour la mettre maigre, 14 px, à la suite de « Caractéristiques » comme h01-6 (work/missions/2026-11-17-carnet-retouches/maquettes/page2/img/h01-6.webp).

Prochaine action : corriger le style PCN-110, recapturer `node captures.mjs lu` et ouvrir ; ouvrir v7-1/v7-2 (390 et 1280, deux thèmes) ;
rejouer tests-final + tsc ; arrêter le serveur 5199 ; commit par chemins (6 fichiers src + test) ; RESULTAT.md (une ligne par id).
