FIX 40/40 c66Regles, 4/4 carnetsR54Choisir, 82 fichiers 1815 verts — code 5d275fc10

# RESULTAT r54

## Plan (par règle : endroit → correctif)
- R54 / C66-4 (restait à faire : « Choisir » de la fiche gardait 1 kg → 62,20 jusqu'à la fiche, puis À venir recevait 6,70) :
  - `modele.ts` : `Choix.quantite {kg, libelle}` et `Choix.prixCentimes` (francs), lus par `lireChoix` (clés connues).
  - `operations.ts` : `choisir` accepte `quantite` et `prixCentimes` (les deux ou aucun) ; `planDepuisChoix` et `planSuitChoix` lisent le prix par `prixCentimesDuChoix` (la quantité cochée d'abord, sinon l'article en francs : comportement d'avant) ; l'entrée À venir porte la quantité en note (« 1 kg »).
  - `src/domain/carnets/prixChoisi.ts` (le fichier est dans le domaine, pas dans src/ui comme dit le dossier) : `prixCentimesDuChoix`, `prixChoisiCentimes` lisent le prix du choix.
  - `FicheArticle.tsx` : `onChoisir(quantite?)` porte le conditionnement coché (kg, libellé, centimes en francs ; euros convertis comme le bloc Offre, « ≈ rendu »).
  - `carnetsTypes.ts` / `ecransCarnet.tsx` : la vue `choisir` garde `articleId` et `quantite` ; l'écran Choisir ouvre l'article de la fiche (avant : toujours le 1er du tableau du domaine), passe la quantité à `choisir`.
  - `Choisir.tsx` : prop `quantite` : le prix du haut et « Part dans À venir » disent 62,20 pour 1 kg ; la ligne « Prix » des places (6,70, rang sur le sachet) se tait pour ne pas contredire.
  - `Comparer.tsx` : `onChoisir(articleId)` : le bouton nomme le 1er du classement au kilo ; Choisir ouvre cet article (avant : le 1er du domaine, donc Hopfenmarkt quand le bouton disait MotlerHops).
- R51 / C66-1 : correctif de c66-fix tenu (la feuille se ferme avant Retirer/Déplacer, Annuler visible). Ajouté : un test par le composant (`carnetsR54Choisir`, bloc R51) : Retirer depuis la feuille Articles, feuille fermée, Annuler visible, l'article revient. Aucun code changé.

## Fichiers écrits
src/domain/carnets/{modele,operations,prixChoisi}.ts ; src/ui/carnets/{Choisir,Comparer,FicheArticle,ecransCarnet}.tsx, carnetsTypes.ts ; tests/unit/carnetsR54Choisir.test.tsx (4 tests : fiche 1 kg → écran Choisir 62,20 sans 6,70 → valider : choix et plan écrit à 6220 + note « 1 kg », estimatedCost 62,2 ; Choisir sans quantité : 670 d'avant ; plan déjà posé suit le choix ; Retirer / Annuler) ; BUGS.md (C66-4 et C66-1) ; ce dossier (tests.log, tests-large.log, liste.txt).
Aucun test existant modifié ; src/domain/stock, src/ui/stock non touchés.

## Sorties décisives
- `npx vitest run tests/unit/c66Regles.test.tsx` : 40 passed (déjà vert au départ : c66-fix).
- `carnetsR54Choisir` : 4 passed (tests.log). Un premier passage rouge : la ligne « Prix 6,70 · 1er sur 2 » de l'écran Choisir contredisait 62,20 ; masquée quand une quantité est cochée.
- Large (c48..c66Regles, carnets*, lot3CarnetOuvert, lot11Carnet, virgule-transversale, port-q4-carnet, proprietes) : 82 fichiers, 1815 passed, 3 skipped, 0 rouge (tests-large.log).
- `npx tsc --noEmit` : 2 erreurs connues (seedData GanttTask, virtual:pwa-register) ; functions/ : aucune.
- `node scripts/agents/controle-bugs.mjs` : BUGS OK.

## Essais
Boucle courte : 2 passages sur le test neuf (1 correctif), 1 passage large.

## Doutes et limites
- Aucune capture (consigne de la voie) : à voir en ligne par le pilote et le critique, ZZ TEST : fiche Hopfenmarkt à 1 kg, Choisir, écran Choisir, valider, À venir à 62,20 « 1 kg ».
- Dans À venir, la quantité n'est dite qu'en note du plan (`notes` : « 1 kg ») ; le Calendrier et la liste À venir ne l'affichent peut-être pas : écran du plan hors périmètre.
- Un prix en euros coché : le choix emporte le CHF rendu arrondi au franc (« ≈40 » dans la fiche), même chiffre que le bloc Offre ; jamais le sachet de 50 g.
- Choix pris sans fiche (Comparer, Retenir une façon) : sans quantité, prix de l'article comme avant. Seul Comparer nomme maintenant l'article du bouton.
- R51 : la feuille se ferme au Retirer ; plusieurs retraits d'affilée demandent de rouvrir la feuille. Le « bandeau au-dessus de la feuille » (CarnetOuvert) n'est pas fait : il demanderait un Annuler monté hors de la page, et la fermeture tient la règle. La capture en ligne reste le juge.
- Le dossier cite `src/ui/carnets/prixChoisi.ts` : le fichier est `src/domain/carnets/prixChoisi.ts`.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
