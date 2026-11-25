TESTS ROUGES 38 rouges / 43 au total (R98..R102, vrais documents de tests/fixtures/c75)

# RESULTAT c75-tests (25.11)

## Fait
- `tests/unit/c75Regles.test.tsx` : 43 tests, un bloc `describe` par règle (R98, R99, R100, R101, R102). Chaque test monte `CarnetsVue` avec les VRAIS documents de `tests/fixtures/c75/*.json` chargés tels quels (carnet + messages + plan, aucune retouche, aucune fixture « à la forme »). Magasin mémoire : `magasin.ecritures` prouve « rien n'est écrit sans le toucher ». Aucun réseau, Gemini jeté s'il est appelé.
- Aucun fichier de `src/` ni `functions/` modifié (le `git status` de `src/ui/finance/UpgradeWorkspace.tsx` et des `src/data/hopSources` était déjà là au départ). `npx tsc --noEmit -p .` : aucune erreur dans le fichier de test.
- Le `.skip` du cas R4 avec critère de `c48Regles.test.tsx` était déjà en place (c56-tests, CADUC, remplacé par R30) : rien à changer.

## Sortie décisive (`tests-rouge.log`)
`npx vitest run tests/unit/c75Regles* --reporter=dot` : **38 failed | 5 passed (43)**.

| Règle | Rouges | Verts (gardes) |
|---|---|---|
| R98 reclasser (malt pilsner 6, pompe 5) | 11 | 1 : Citra bien rangé, aucune carte à tort |
| R99 l'erreur n'est pas un fait | 6 | 0 |
| R100 Citra | 6 | 1 : tableau ≈73,9 et « à relire » déjà justes |
| R101 Embouteillage | 3 | 1 : « 2 500 CHF » déjà écrit avec l'espace |
| R102 autres | 12 | 2 : note/bulle conservées (R73-6), Brau n'envoie plus 10 centimes (R73-3) |

Chaque règle a au moins un test rouge. Les 5 verts sont des gardes d'un endroit déjà juste sur ces documents, pas des tests vides.
Cause de chaque rouge vérifiée dans la sortie JSON : message de l'assertion, texte réel de l'écran dedans (ex. « Quand · S26 · 2 500 CHF estimé », « Choisir · MotlerHops, 1 kg », montant écrit 0 centime, « Critère : La pompe… · calculé sur place », « Articles 1 · … 4 CHF », liste « … fournisseur 4 CHF »).

## Ce que les tests exigent (le contrat que lit celui qui corrige)
- R98 : sur ZZ malt pilsner et ZZ pompe, une carte « Reclasser ce carnet ? » (titre en texte ou `aria-label`) qui contient un bouton dont le nom commence par « Reclasser » ; texte de la carte : malt : article, « +4 CHF », « le sac », note ou piste, « commandé », « fait » ; pompe : critère, constat, résolu, idée, problème. Aucune écriture avant le toucher. Un toucher : malt : 0 article, « +4 CHF » gardé en note ou en piste, la note « Commandé » n'est plus `a-acheter` ; pompe : 0 critère, la phrase « brûlante » gardée, `suiviDe(c).etat` = `resolu`, `genreDe(c)` = `probleme`, plus de note « Résolu » seule, la note « vanne » reste. Un bouton dont le nom commence par « Annuler » rend `articles, notes (texte, genre), critères, genre, état, pistes` à l'identique.
- R99 : malt avant toucher : ni « Veille du prix » ni « Poser le prix », ni « Articles 1 », aucun Choisir en touchant la phrase, pas « 4 CHF » en prix dans la liste ; pompe : ni « Critère : La pompe… » ni « calculé sur place » collé à un critère.
- R100 : fiche MotlerHops : aucun « 1 kg » (bouton, Comparer compris) ; table : « 50 g » avec 3,72 € et un prix CHF, « 250 g » et « 500 g » « prix à relire » ; un bouton Relire ; « Choisir » nomme 50 g ; Choisir dit « Part dans À venir » avec ≈ 3,6x CHF ; plan écrit entre 366 et 372 centimes (3,72 € × 0,9183 × 1,081 ≈ 369).
- R101 : Quand dit « 1 mai 2027 » (ou « 26 avr. – 4 juil. 2027 »), jamais `S\d+` ; même date que À faire (« dès le 1 mai 2027 », qui est déjà juste).
- R102 : R73-6 (note sur la fiche), R73-7, R73-11 (« 5 différents »), R73-13 (Choisir de Comparer en `cn-action-vert`), R73-9 (« en stock » une fois, « MotlerHops » deux fois au plus au Choisir), R75-4 (tableau ≈73,9 contre fiche 73,80), R75-5 (Choisir de Brau dit « prix à relire », pourquoi ≠ nom du vendeur), R75-6 (aucun mot en `.cn-mono`), R73-23 (titre et « (Planning, Équipements) » une fois), R73-24 (pas « Idée · 3 sept. » sur un carnet Dans À venir ; coup d'œil « décidés » ≥ 1).

## Non couvert, avec raison
- Mise en page, jsdom ne mesure rien : R73-8 (vide du bloc Offre), R73-10, R73-12, R73-14, R73-15, R73-18, R75-3 : à voir en ligne.
- Aucun document relevé : R73-17 et R75-7 (liens de Frigo et armoire malte), R73-19 à R73-21 (ZZ à retirer), R73-31 (Anciennes notes).
- R75-8 : deux écritures de Quand, couvert par R101 (forme unique, année) ; l'espace de « 2 500 » est déjà juste (garde).
- Doute D2 de reel-75 (réglette Quand sans année) non compté, donc non testé.

## DÉCISION À PRENDRE : R73-30 (ordre de la liste)
Question : sur ces documents, les ZZ TEST (modifiés le 24.11 à 20:28 et 20:30) sont PLUS récents que Houblons citra (18:29). « Le carnet le plus récemment touché en tête » les laisserait donc en tête : le test écrit à la lettre du registre serait faux. Options : (a) « un ZZ TEST ne passe jamais devant un carnet réel » (règle de test, pas de brassage) ; (b) priorité posée à la main (R91) ; (c) ne pas tester. Recommandation : (b), déjà prévue par la plainte `carnet-priorite` (« dépasser »). Je n'ai écrit aucun test.

## Doutes
- Le nom exact des boutons (« Reclasser », « Annuler ») et le titre « Reclasser ce carnet ? » viennent du DOSSIER ; le contenu de la carte est testé par mots-clés (article, +4 CHF, fait, constat…), pas par une phrase figée.
- Montant À venir : 366 à 372 centimes. Si le brasseur veut un autre arrondi, ce test seul change.
- Essais : 3 passes de lancement (écriture, correction de 4 regex qui laissaient passer à tort 3 tests, garde `carteOuEchec`).

CONNAISSANCE : aucune
LEÇON PROPOSÉE : un test de carte qui n'existe pas encore doit échouer sur une assertion qui nomme l'absence (`carteOuEchec`), pas sur « Unable to fire a click » ; et chaque regex d'un « n'affiche pas » se rejoue sur le texte réel (textContent colle les mots : `\b` échoue entre « 1 » et « Autre »).
