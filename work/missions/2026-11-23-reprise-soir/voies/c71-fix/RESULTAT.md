FIX 40/40 tsc OK 645b55c71 — c71Regles vert (30 rouges corrigés) ; PRÊT À METTRE EN LIGNE 645b55c71

## Plan (par règle, chaque endroit et son correctif)
- R84 / C71-1 (B), C70-5, C70-6 : `groupesDeLaMaquette` (src/ui/carnets/afaireRegles.ts) ne fusionne plus « Plus loin » dans « Fin du mois » : ce qui dépasse le dernier jour du mois (décembre, 2027) va sous « Un jour », trié par date ; `quandDite` écrit la date sur la ligne (« sem. du 7 déc. », « fin mars 2027 ») ; AFaire.tsx la montre sous « Un jour ». Tâche dérivée du Planning commencée mais qui court au-delà du mois (« Frigo + congel », fin mai 2027) : sous « Un jour », « jusqu’au 1 mai 2027 » (cas accepté par le pilote).
- C71-2 : « à retenir ? » d'une option déjà retenue : filtré dans FilCarnet.tsx (affichage, index des gestes gardé) et dans `filDe` (domain/carnets/fil.ts).
- C71-3 : `raisonDEcart` + `pourquoiDe` (domain/carnets/suivi.ts) : la raison écrite à l'écart (≥ 4 mots ; « non, en fait », « pas pris » ne comptent pas) est un « pourquoi » ; `ficheResolu` (filRegles.ts) dit « ventilateur (non) » pour l'essayé écarté par lui.
- C71-4 : `sousDomaineParMots(texte, domaine)` (domaineMots.ts) lit des parties pour Local (Eau, Électricité, Air et chaleur, Sécurité, Bâtiment), Meuble, Papiers, Outils ; `arbreDe` les déduit pour tout domaine ; le groupe sans partie s'appelle « Sans catégorie » (plus « Autres ») et nomme ses carnets repliés (ArbreCarnets.tsx, listeRegles.ts).
- C71-5 : `titreCourt` (domain/carnets/titreCourt.ts) : 40 caractères au plus, jamais un mot-outil final.
- C71-6 : CarnetsVue.tsx : tant que la carte « rangé pour toi » est posée, le bandeau « Carnet créé · titre tiré de votre phrase » ne paraît pas.
- C71-7 : pictos.tsx : « condenseur » → échangeur ; « eau froide » n'est plus un frigo (chambre froide, frigo, vitrine gardent le frigo).
- C71-8 : CarteArticle.tsx + ArticlesCarnet.tsx : prop `choisie` : la carte de l'article choisi dit 1 kg et ≈40 CHF (choix.quantite, R54), jamais 50 g / ≈4 CHF.
- R86 : sans objet (déjà justifié par c71-tests), deux gardes verts.

## Fichiers écrits
src/domain/carnets/{arbre,fil,suivi,titreCourt}.ts ; src/ui/carnets/{AFaire,ArbreCarnets,ArticlesCarnet,CarnetsVue,CarteArticle,FilCarnet,afaireRegles,domaineMots,filRegles,listeRegles,pictos}.ts(x) ; tests/unit/carnetsAFaireVue.test.tsx (1 ligne, voir ci-dessous) ; lignes C71-1..8 de BUGS.md ; ce dossier (tests.log, tsc.log). Commit 645b55c71 par chemins ; src/ui/finance/UpgradeWorkspace.tsx (modifié avant la voie) non touché.

## Sortie décisive
- `npx vitest run tests/unit/c4 c5 c6 c70 c71 carnets lot3CarnetOuvert virgule-transversale proprietes stocksMaterielUneRangee --reporter=dot` : Test Files 89 passed (89), Tests 2080 passed | 3 skipped. c71Regles : 40/40.
- `npx tsc --noEmit` : 2 erreurs, les connues (seedData.ts GanttTask ; enregistrerPwa.ts virtual:pwa-register). functions/ non touché.
- `node scripts/agents/controle-bugs.mjs` : BUGS OK : 2374 bugs, 556 ouverts.

## Essais, doutes, limites
- Un test hors c48..c71 écrit pour l'ancien comportement a dû changer : carnetsAFaireVue (« Fin du mois 4 » → « Fin du mois 3 ») : la 4e tâche, au-delà du mois, est maintenant sous « Un jour » (R84 remplace la décision C70-6 « Plus loin sous Fin du mois »). Rien dans c48..c71Regles n'a été touché.
- Les tests carnetsProblème / carnetsSuiviProjections disent « non, en fait » = pas de pourquoi : d'où le seuil « ≥ 4 mots » pour une raison d'écart. Seuil arbitraire, écrit.
- Le Bash du poste a encore perdu une barre inverse (`\p{L}`) dans un script : corrigé à l'Edit ; les autres regex ajoutées sont écrites à Write/Edit.
- C71-8 : seule `CarteArticle` dit la quantité choisie ; la feuille des cartes (`FeuilleCartes`/`CarteClassee`) et le tableau n'ont pas été relus pour ce défaut (le test ne les couvre pas).
- C71-4 : les parties de Local/Meuble/Papiers/Outils sont des mots de SENS (comme celles de la brasserie), pas des exemples ; un carnet sans mot reconnu (« Chariot de manutention ») va sous « Sans catégorie » avec ses noms. Le cas « Brasserie Autres 1 » du relevé en ligne n'est pas reproduit (carnet inconnu).
- Aucune capture locale (VOIE.md) : preuve en ligne par le pilote et le critique.

DÉCISION À PRENDRE : « Sans catégorie » au lieu de « Autres » (nom du groupe sans partie) : libellé à confirmer par le brasseur ; recommandation : le garder (il dit pourquoi le groupe est à part).
CONNAISSANCE : aucune
LEÇON PROPOSÉE : un test d'un autre fichier qui fige l'ancien comportement (carnetsAFaireVue, « Fin du mois 4 ») ne se voit qu'en rejouant toute la famille carnets*, pas seulement c71 : la porte de la voie le fait déjà.
