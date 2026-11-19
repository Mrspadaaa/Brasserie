# Voie t1

- TL-16 | ouvert | — | accord requis : alerte d'eau rouge à l'ouverture d'une recette enregistrée (l'alerte est vraie). Options : (a) la garder, (b) recalculer à l'ouverture avec « Annuler », (c) ambre « à recaler » avec le bouton en tête ; toute lecture change l'écran Eau choisi ; recommandation : (c). Hors zone aussi (BrewWizard, moteur d'eau)
- TL-31 | corrigé | e01140e95 | déjà corrigé : page r1 portée, le « + » est dans le pied de la fiche à côté de « Préparer un brassin » ; mesure 390 et 1280, clair et cave : aucun chevron ni contrôle recouvert au repos ni en fin de défilement
- BR-28 | corrigé | e01140e95 | déjà corrigé : Récap v1 portée, « Texte » et « Relire » sont des puces au milieu de la page, le « + » flotte seul plus bas (mesure 390 clair et cave, 0 recouvert)
- BR-89 | corrigé | 794085d65 | déjà corrigé : Eau w1b portée, « + au pied » à côté de « Suivant » ; « Acide lactique 80 % — à l'empâtage 5,9 mL » en fin de défilement est libre (390 clair et cave)
- BR-91 | ouvert | — | hors voie : src/pages/BrewWizard.tsx (STEPS : label « Eau et sels » contre shortLabel « Eau » ; le titre dit « Eau et sels 6/7 », le rail « Eau », confirmé aux captures 390 clair et cave). Même remède que B1-10 (un seul nom, « Eau »). « Total des additifs nécessaires » est le titre d'un tableau (WaterSummary), pas un nom d'écran
- BR-103 | corrigé | e01140e95 | déjà corrigé : même cause que TL-31, la fiche garde ses valeurs du bord droit (« 0 min », « 21 j ») hors du « + », qui est dans le pied ; mesure 390 et 1280 clair et cave : 0 recouvert
- BR-106 | écarté | — | sans objet sur la fiche mesurée : un seul nom, « New England IPA 19 L », à 390 et à 1280 (captures clair et cave) ; « 8 recettes » n'y figure plus. Non rejoué avec la liste réelle derrière (aucune donnée en local)
- BE-13 | corrigé | 794085d65 | doublon de BR-89 : voir BR-89
- BE-15 | ouvert | — | hors voie : src/pages/BrewWizard.tsx ; doublon de BR-91
- BE-56 | corrigé | e01140e95 | doublon de BR-103 : voir BR-103
- BE-59 | écarté | — | doublon de BR-106 : un seul nom sur la fiche mesurée
- LR1-NOTE-5 | corrigé | c6c06c282 | la recherche retrouve une écriture par son montant (« 17,50 » ne trouvait rien : la valeur n'était pas indexée) ; seules les écritures l'indexent (« 12 » ne ramène pas le stock). « Cascade Pellets » et « Versandkosten » passent par le détail et les mots-clés déjà indexés. Reste en ligne (données ZZ, retrait, lecture en 4 s) : non jouable en local, à rejouer en ligne par le pilote
- LR2-NOTE-3 | corrigé | ded371959 | déjà corrigé : focus du champ repris au toucher ; joué à 390 tactile (tap sur la loupe) et 1280, frappe réelle « 17,50 Cascade » entre dans le champ, focus vrai, idem par Ctrl+K « Versandkosten »
- LR3-NOTE-2 | écarté | — | par conception : seules les écritures d'une année rangée demandent « Inclure les archives » ; une écriture non rangée sort sans (test bugs-t1-recherche). Aucun état « annulée » dans l'index : doute non reproductible
- EAU-4 | écarté | — | recouvrement passager propre au « + » flottant choisi (b1s-a, « toujours flottant ») ; sur l'onglet Eau « à part » est libre au repos et en fin de défilement (captures 390 clair et cave), la fin du contenu réserve la place du bouton

Tests : npx vitest run tests/unit/bugs-t1-recherche.test.tsx tests/integration/CommandPalette.test.tsx tests/unit/recherche-modele.test.ts tests/unit/commandSearch.test.ts → 31 passés, 0 échoué (voir tests.txt). Le test du montant a échoué avant le correctif (aucune option trouvée).
Captures (voies/t1/captures/, toutes ouvertes) : recette 390 et 1280, clair et cave (fiche : « + » dans le pied, rien dessous, un seul nom) ; wizard Eau 390 clair et cave, Récap 390 clair, étape Levure 1280 clair (« + » dans le coin du pied, « Suivant » libre) ; palette 390 tactile (feuille, champ rempli « 17,50 Cascade », focus). Non rejoué : wizard Eau et Récap à 1280 (le clic sur le rail échoue au banc, étape Levure capturée à la place) et cave de la palette.
Banc : build `--mode development` servi en statique (3111), `banc.mjs` et `palette.mjs` dans voies/t1/ ; `vite dev` partagé rechargeait la page à chaque écriture des autres sessions. L'assistant du banc `?preview=brew&view=assistant` plante (« Cannot read properties of undefined (reading 'beermaverick-citra') ») : hors voie, signalé.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : un banc `vite dev` dans un dépôt partagé se casse sous les écritures des autres sessions ; servir un build `--mode development` avec NODE_ENV=development (sinon `import.meta.env.DEV` est faux et ?preview disparaît).
