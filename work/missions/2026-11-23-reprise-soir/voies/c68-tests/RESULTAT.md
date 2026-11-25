TESTS ROUGES 27 rouges / 56 total (R70 à R76, chacune au moins un rouge) — tests/unit/c68Regles.test.tsx

# RESULTAT c68-tests (25.11)

## Fichiers écrits
- `tests/unit/c68Regles.test.tsx` (nouveau) ; `tests/fixtures/c68/` (6 fixtures, déjà commitées par c68-releve, non modifiées) ; ce dossier (`tests-rouge.log`).
- Aucun fichier de `src/` ni `functions/` touché par cette voie (les `M`/`??` de `src/` vus dans `git status` datent d'avant la voie : `UpgradeWorkspace.tsx`, `src/asset`, `src/data/hopSources`).
- c48Regles : le seul `.skip` du cas R4 (« avec critère ») porte déjà sa raison et son critère de remplacement (CADUC c56-tests, remplacé par R30 de c56Regles) ; laissé tel quel.

## Sortie décisive
`npx vitest run tests/unit/c68Regles* --reporter=dot > voies/c68-tests/tests-rouge.log` : `Tests 27 failed | 29 passed (56)`, 1 fichier, 15 s.
Par règle (rouges) : R70 6 · R71 3 · R72 3 · R73 1 · R74 5 · R75 6 · R76 3.

## Méthode (point clé)
- R70 : `CarnetsVue` monté, phrase tapée dans le champ de la liste (Entrée), appel `ranger` simulé qui RENVOIE `reponse.result.data` des fixtures `rangement-1..6.json` ; jamais `iaSimulee`. Le magasin est reconstruit depuis `requete.data.context.carnets` (30 carnets réels anonymisés), donc le `carnetId` désigné par la vraie réponse existe. La requête envoyée est vérifiée (`texte` = la phrase).
- Une assertion par champ : titre, chemin, genre, état, tâche proposée, carnet existant désigné ; plus C68-12 (OK pose la tâche).
- R71 à R76 : l'état du problème « vapeur » reconstruit tel que relevé en ligne (cap/C6-options.txt : UNE option, la hotte ; condenseurs A et B devenus ARTICLES ; jetons de montant A et B sans option visée ; ni catégorie ni domaine posés), jeu de gestes par le composant (Écarter, Veille, Relire, ‹, menu du domaine, filtre du coup d'œil, À faire).

## Rouges et pourquoi (lus dans le log, aucun rouge de harnais)
R70 : fermenteur et bière de Noël, titre = la phrase (`carnetNeuf`/`titre` de l'IA ignorés) ; vapeur, la carte dit « nouveau carnet · idée » au lieu du carnet désigné (CARNET-ZZ-7) ; fermenteur, OK ne pose pas la tâche.
R71 : somme 143 000 centimes (690 + 540 + 200), encore avec la hotte écartée.
R72 : « Rangé : À ranger » (`cheminAffiche` appelle `domaineDe(c)` sans le repli par les mots, que la carte utilise) ; ni retenue ni « pas pris » pour les condenseurs.
R73 : « à comparer · 540 CHF » sur un résolu.
R74 : raison tapée jamais affichée ; veille, écarter, reprendre : 2 événements de veille (le domaine aussi : `veille,veille,option`) ; « condenseur A/B » restent des articles ; « aucun article encore » sous la hotte.
R75 : pas de ligne « essayé » ; catégorie « À ranger » ; ‹ renvoie à la liste ; menu du domaine = 5 domaines sans sous-domaine ; arbre : un carnet « Je cherche » sans dernier pas (2 tests).
R76 : « Hotte recyclage » sans coût ; projet du Planning fini en septembre dans « Cette semaine » ; appui long au toucher sans effet après `pointercancel`.

## Verts justifiés (déjà juste ou garde-fou, jamais comptés comme preuve d'une règle)
- R70 rangement-2 et rangement-4 (fusible, étiquettes) : cartes déjà conformes en ligne (relevé c68-releve : « titre court, chemin et genre repris »).
- R70 rangement-3 (sol époxy) : VERT dans le rejeu, alors que la carte en ligne était « nouveau carnet · idée / Local ». Cause non reproduite : l'anonymisation a retiré ce qui faisait écarter la cible (j'ai remis une note de Planning sur « Carnet réel 3 », sans effet). Le test reste comme garde-fou ; la fixture réelle 3 ne suffit pas à rejouer le défaut.
- R71 retenue (hotte à 200) : pas de somme en tête ; R72 « Brassage › Vapeur » catégorie posée et « raison de l'écart redite » : déjà justes (R60 de c67 les tient) ; R75 « problème » dit le constat et repli des « carnets à comparer » : gardes-fous.

## Doutes et limites
- R75 arbre : les carnets « Je cherche » du relevé (`etat: cherche`) sont rejoués avec leur genre posé (`achat`, `idee`) ; « un dernier pas » est exigé comme le dit D451 ; si le brasseur veut qu'un achat sans note n'ait pas de dernier pas, ce test est à nuancer.
- R76 appui long : jsdom ne produit pas un vrai toucher ; le test joue `touchstart`, `pointerdown` (touch), `pointercancel`, puis attend 800 ms. Le correctif peut être un minuteur tenu après `pointercancel` ou un écouteur `touchstart` ; à confirmer en ligne.
- R76 coût de « Hotte recyclage » : la note « Budget 200 CHF » est ma reconstruction ; le correctif choisit sa source (note, plan lié) ; le test ne dit que « 200 CHF dans la ligne ».
- Retiré : le test « pas de groupe Plus loin », contraire à la règle écrite d'`afaireRegles` (« Plus loin » = les mois suivants).
- C68-13 (« Réalisés 0 » avec 6 résolus) non testé : l'onglet vit dans `StocksTab` / `App` (hors `src/ui/carnets`, interdit à c68-fix) ; à confier à la voie onglets.
- Tests lents : 15 s au total (maquettes de 30 carnets), timeouts de 20 à 30 s par test.

DÉCISION À PRENDRE : C68-13 (Réalisés compte les résolus) et C68-11 (repli à plat des carnets « Autres » sans sous-domaine : choix de conception d'`ArbreCarnets`, « lus à plat » vs maquette « repliés ») : qui tranche ? Recommandation : C68-13 à la voie onglets avec son propre test ; C68-11 à la maquette choisie v01-liste (règle n° 1), le pilote vérifie la capture.

CONNAISSANCE : `cheminAffiche` (filRegles.ts) lit `domaineDe(c)` sans `domaineParMots`, alors que la carte « rangé pour toi » (`cheminDit`) le passe : même carnet, « Brasserie » sur la carte, « À ranger » au Résolu et dans la relecture (C68-3, C68-8).
LEÇON PROPOSÉE : aucune
