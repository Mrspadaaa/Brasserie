# Correction 2 (25.11)

Sources : critique-2.md, persona-ux-2.md, persona-ia-2.md. Chaque concepteur traite TOUS les problèmes (B et m) que les trois
citent pour sa maquette, plus les communs ci-dessous. L'idée propre de chaque maquette reste (M1 réécrit, M2 fiche au-dessus,
M3 marge, M4 deux vues) ; une bonne idée d'une autre peut être greffée. Les règles de CORRECTION-1.md tiennent toujours.

## Communs
- Rien n'est tranché sans preuve : une piste non vérifiée (la dalle) reste « ? à vérifier », jamais ✗ ni une phrase qui l'écarte.
- Le bouton IA (Ranger / Annoter) n'est plein que quand il est le geste principal ; dans un état où le geste principal est
  autre (Garder la tâche, Retenir, Résolu, relecture), il passe en secondaire. Un seul bouton plein par écran.
- Chaque maquette montre le geste de résoudre : la proposition de l'IA (« la flaque n'est pas revenue : résolu ? ») et le
  toucher qui l'accepte, puis l'état résolu.
- Relecture : chaque option se nomme en clair (jamais « Pourquoi A » seul).
- Au plus 3 tailles de texte ; pas de hachures ; un libellé d'état juste dans chaque état (hors ligne compris).
- Captures fraîches de chaque état, et les noms que la page montre refaits depuis les états actuels :
  mN-avant = état de saisie, mN-apres = état rangé, mN-annuler = feuille « Changé par l'IA ».

## Sortie
- Écrire `corrections/c2-mN.md` : tableau problème → fait (ou « non fait : raison »), puis la liste des captures.
- Ne pas toucher page.html ni RESULTAT.md (le pilote assemble).
