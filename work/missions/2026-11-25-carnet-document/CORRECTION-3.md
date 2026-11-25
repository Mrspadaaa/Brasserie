# Correction 3 (25.11)

Sources : critique-3.md, persona-ux-3.md, persona-ia-3.md. Chaque concepteur traite TOUS les problèmes (B et m) que les trois
citent pour sa maquette, plus les communs ci-dessous. Idée propre gardée ; greffes permises (persona-ux-3 en propose sept).
CORRECTION-1.md et CORRECTION-2.md tiennent toujours.

## Communs
- Fidélité au carnet réel (tests/fixtures/c79/zz-ecoulement-qui-fuit.json) : tout ce qui n'y est pas (notes suivantes,
  « samedi », photo, lien) porte une marque visible et distincte de ses propres mots, par exemple un bandeau « suite imaginée
  pour la maquette » sur l'état, jamais « (exemple) » seul. Une note ajoutée n'est jamais citée comme « tes mots » ni
  « ta photo », et ne met jamais dans sa bouche une estimation de l'IA. Les dates d'état du chemin suivent le carnet réel
  (Je cherche : 25 nov., par lui).
- Hors ligne : n'afficher que ce que la lecture locale sait faire (src/domain/carnets/analyseLocale.ts, `etiquettesLocales` : montant, « pas trouvé »,
  « contacté », « piste » ; « estimé » seulement devant ≈, environ, ca.). Pas d'options ni de tâche inventées hors ligne.
  Modèle : M4 (dernière vue de l'IA, datée ; la note nouvelle citée ; « l'IA te le proposera »).
- Feuille « Changé par l'IA » : aucune ligne dont le retour remettrait une valeur fausse ; si l'IA a corrigé une lecture
  locale fausse, la ligne le dit et le retour n'est pas proposé (ou la ligne est retirée, comme M4).
- Dalle : « pas trouvée · ? à vérifier » aussi dans la vue d'ensemble.
- Cibles ≥ 44 px pour tout bouton (annulation comprise) ; une seule couleur pour le bouton plein, la même dans les 4 états.

## Sortie
- `corrections/c3-mN.md` : tableau problème → fait (ou « non fait : raison »), liste des captures.
- mN-avant / mN-apres / mN-annuler refaits depuis les états actuels. Ne pas toucher page.html ni RESULTAT.md.
