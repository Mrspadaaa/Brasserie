**1. Hôte.** Contre (c). Le brouillon vit déjà dans `localStorage` (`src/services/recipeDraft.ts:547`). Un second brouillon dans Dexie ferait deux sources de vérité, ce qui reproduit sa plainte D139 : « un choix sur un endroit, semble pas toujours être reporté partout ». Il faut (b), des couches au-dessus du wizard monté, et une seule porte d'écriture qui reprend la discipline de `applyHopV55Change` (`BrewWizard.tsx:1410-1436`) : contrôles `draftReadOnly` et `draftId`, puis « Storage is the commit point ». Avec (a), `App.tsx` démonte le wizard (R6) et la clé de brouillon devient un pari.

**2. Calcul.** C'est la donnée qui trompe. Le décalage qu'il ressent se mesure à ×1, et il ne vient pas d'un calcul trop gros (t2, `RESULTAT.md`) :
- `hopDescriptorEvidence` pèse 417 ms sur 880, avec un cache indexé par l'identité du tableau ;
- `toLocaleString` représente 21 % d'un glisser ;
- le p95 de 121 ms de Dryhopper vient « du rendu, pas du moteur ».

Un worker n'y change rien. De plus, l'écart de ×9 avec `cout-calcul-moteur.md` reste inexpliqué. Il faut donc d'abord T5 et ces caches, puis remesurer, et seulement ensuite (b).

**3. Données.** Le hors ligne des chunks n'existe déjà pas pour l'app : aucun service worker de code, et `BrewWizardEntry` est déjà chargé à la demande. Promettre (a) « hors ligne » est faux sans preuve réseau coupé. Les « écoutes par écran » (T10) relanceraient `configurerDonnees` à chaque ouverture, donc des calculs à froid de 90 à 380 ms (R5d). T8 doit passer avant T10. Fusionner les catalogues touche à `hopIndex`, qui est fini et branché : c'est une suppression, donc une décision de l'utilisateur. R9 (12 variétés) aussi.

**4. V5.5.** (a), mais avec un trou : deux éditeurs qui écrivent les mêmes `hops`. Si v4 remplace un houblon, les `hopV55Applications` pointent vers une ligne disparue. Il faut un test d'aller-retour qui alterne v4 et V5.5. Le retrait final revient à l'utilisateur.

**5. Ordre.** Faire T1, puis T14 avant tout portage (R8, règle n° 1), avec un témoin négatif. T17 en 17e position contredit L13 : on n'écrit pas le contrôle de fluidité après les écrans.

Position : autre voie : (b) pour l'hôte, avec une seule porte d'écriture ; T1 puis T14 et T5 avec ses caches avant tout worker ; T8 avant T10.

LEÇON PROPOSÉE : avant de choisir une architecture de performance, attribuer le temps mesuré dans le navigateur (profil) à sa cause. Une extrapolation ×10 ne doit pas décider à la place d'un profil ×1 qui montre des caches ratés et du rendu.
