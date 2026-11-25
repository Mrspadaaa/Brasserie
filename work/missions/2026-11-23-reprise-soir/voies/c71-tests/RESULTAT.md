TESTS ROUGES 30 rouges / 40 total (R84 17, R85 13, R86 0 : sans objet) — tests/unit/c71Regles.test.tsx

## Fichiers écrits
- tests/unit/c71Regles.test.tsx (40 tests) ; voies/c71-tests/tests-rouge.log (sortie vitest --reporter=dot) ; ce RESULTAT.md.
- Aucun fichier de src/ ni functions/ modifié (`git status` : seul `src/ui/finance/UpgradeWorkspace.tsx` est modifié, il l'était avant la voie ; non touché, non commité).
- Le .skip du cas R4 de c48Regles.test.tsx n'a pas eu besoin d'être touché (déjà `it.skip` avec son critère dans le commentaire « CADUC (c56-tests) »).

## Sortie décisive (tests-rouge.log)
`Tests 30 failed | 10 passed (40)`. Rouges par règle : R84 « maintenant » × 6 dates (12) + lignes du 25.11 (5) ; C71-2 (1) ; C71-3 (4) ; C71-4 (2) ; C71-5 (2) ; C71-6 (1) ; C71-7 (2) ; C71-8 (1).
Vérifiés rouges pour la bonne raison (message lu) : par ex. au 25.11 « mi-mois (2026-12-07) vue sous « Fin du mois », attendu « Un jour » » ; « Frigo + congel » sous « Cette semaine » ; carte de l'article « ≈4 CHF · 50 g · 73,80 CHF/kg » reproduite en jsdom ; « bandeau ✓ Carnet créé… titre tiré de votre phrase » avant OK ; pictoDe('Condenseur de buées à eau froide') = frigo ; titre « la condensation de l'ébullition fait goutter » (44 car.).

## R84 (C71-1, B) : plusieurs « maintenant »
Oracle écrit à la main en UTC, sans les helpers du domaine. Dates : lundi 2 nov. (début), dimanche 15 nov. (milieu), mercredi 25 nov. (test en ligne), lundi 30 nov. (fin), mardi 29 déc. (décembre → janvier), dimanche 31 janv. 2027.
Par date : 3 tests (groupe de chaque tâche ; aucun 4e groupe ; date dite sur la ligne sous « Un jour » pour ce qui dépasse le mois). Plus les lignes réelles du 25.11 (Installation 27A 2027, Embouteillage 2027, 2ème évier 2027, hotte « avant le 12 décembre », Frigo + congel) et un garde-fou vert (tâche de cette semaine, tâche de fin novembre).
Verts (10) : « aucun 4e groupe » ×6 (déjà juste : `groupesDeLaMaquette`), garde-fou R84, garde-fou picto frigo, 2 gardes R86.
Tolérance écrite : le jour qui suit dimanche mais ≤ 7 jours peut aller dans Cette semaine ou Fin du mois (DOSSIER « ≤ 7 jours » contre le domaine « jusqu'au dimanche »).

## R85 : composant par composant
- C70-5 : couvert par R84 (la tâche « avant le 12 décembre », semaine du 7 déc., doit être sous « Un jour » avec sa date) ; C70-6 aussi (groupes de la maquette, déjà verts, + date dite).
- C71-2 : composant CarnetsVue, réponse IA simulée (option + étiquette « retenu » + tâche) sur le problème vapeur où le condenseur est déjà retenu : la bulle « à retenir ? » ne doit pas paraître.
- C71-3 : `questionPourquoi` (pure), écran du problème (« Tes notes ne le disent pas »), `ficheResolu` (« pourquoi » repris de la raison d'écart ; essayé « ventilateur (non) »).
- C71-4 : arbre monté avec des carnets sans catégorie de Local, Meuble, Papiers (titres inventés) : aucun groupe replié « Autres », chaque groupe replié dit des noms. Le cas « Brasserie Autres 1 » n'est pas reproduit (le carnet en cause est inconnu ; ses mots matchent une partie dans mon jeu).
- C71-5 : `titreCourt` sur la phrase du test en ligne (avec et sans la marque ZZ TEST) : ≤ 40 caractères (la maquette : 33-35), pas de mot-outil final, « condensation » gardé.
- C71-6 : phrase neuve dans la liste, réponse IA rejouée (tests/fixtures/c68/rangement-2.json, `carnetNeuf`) : la carte est posée, aucun bandeau « Carnet créé » ni « titre tiré de votre phrase » hors de la carte avant OK.
- C71-7 : `pictoDe` + tuile d'option montée (`data-picto`) : pas « frigo » pour « eau froide » ; garde-fou : chambre froide, frigo, vitrine réfrigérée restent « frigo ».
- C71-8 : carnet « Choisi » 1 kg (choix.quantite R54) à un seul article : la carte de la rubrique « Articles 1 » dit 1 kg et ≈40 CHF, jamais 50 g / ≈4 CHF.

## R86 : sans objet (justifié)
critique-71/RESULTAT.md ne liste pas « une lecture part seule » parmi ses 8 problèmes ; il relève seulement, en LEÇON PROPOSÉE, que coller deux liens a coûté 3 appels aiTask. Lecture du code (`rangement.ts`) : une lecture par lien (`appels.lire`, au geste Entrée) + une reprise de suivi du jeton sur le 1er lien (`appelsReels.lire`) = 3 appels pour 2 liens : voulu. Deux gardes VERTS ajoutés (aucune lecture sans Entrée ; une lecture par lien, jamais deux fois le même).

## Essais, doutes, limites
- Essais : C71-8 réécrit 2 fois (le carnet « Choisi » ne montre sa carte article qu'avec un seul article : sinon tableau) ; un `sed`/`node` à barre inverse a cassé une apostrophe, corrigé à l'Edit ; aucun critère n'a dépassé trois essais.
- Doute : « Frigo + congel » (tâche dérivée du Planning « du 01.08.2026 au 01.05.2027 ») doit-il aller sous « Un jour » ? Le test exige seulement : ni « Cette semaine », ni « Fin du mois », et « mai » dit sur la ligne. Le correcteur choisit où (Un jour ou ailleurs) tant que la date de mai 2027 est dite.
- Limite : jsdom ne mesure aucune boîte ; C71-5 et C71-6 se jugent sur le texte, pas sur la mise en page. Le « titre court » est borné à 40 caractères d'après la maquette (33-35), un seuil arbitraire mais écrit.

DÉCISION À PRENDRE : aucune bloquante. Si le pilote juge qu'une tâche dérivée du Planning en cours (début passé, fin en 2027) reste « Cette semaine », retirer le test « Frigo + congel » (1 test) avant c71-fix.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
