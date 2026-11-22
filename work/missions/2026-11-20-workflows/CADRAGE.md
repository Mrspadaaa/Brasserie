# Cadrage : simplicité par les workflows (20.11)

Source : ses messages du 20.11, mot pour mot, à la fin de `work/refonte-frontend/v4/SPEC-BRASSEUR.md`. Ce document les recontextualise pour éviter le sur-ajustement. Il ne remplace pas ses mots.

## 1. Ce qu'il dit, en une phrase
La simplicité se juge sur ce qu'une action **déclenche**, sur la **justesse de la saisie** et sur le **retour immédiat**, d'un bout à l'autre du travail. Elle ne se juge pas écran par écran, ni plainte par plainte.

## 2. Pourquoi la passe du 15-16.11 l'a manqué (diagnostic, pas reproche)
- **Elle partait des plaintes datées** : cinq problèmes, chacun lié à un écran (facture, effets, créer, mesure, besoin). Ce qui ne s'était jamais plaint n'a jamais été regardé. C'est le cas du projet du Carnet, de la vente et de la date d'une recette.
- **Elle comptait des touchers sur l'existant** sans demander ce que le brasseur cherche à obtenir, ni ce qui devrait suivre seul.
- **Ses mini maquettes dessinaient des écrans.** Au port, la règle n° 1 (« sa maquette telle quelle ») a fait reprendre leur dessin. Exemples : la pile de pa1 placée au-dessus de la feuille réelle, la couleur cuivre, les puces de pb1 contre la grille de d1b. Le geste choisi est passé au second plan, derrière l'image. C'est le risque qu'il nomme.

## 3. Les règles générales (ses exemples en sont des cas, pas la liste)
1. **Une action pose toutes ses suites sûres.** Créer, vendre, brasser, payer : chaque action place, date, chiffre et met à jour ce qui en découle naturellement. Chaque suite est juste, se défait et n'est jamais inventée. Ses cas : le projet qui arrive au calendrier à la date du jour avec son prix, la vente qui s'inscrit au calendrier, le brassin qui met tout à jour. Brique existante : la règle L9 (geste → effets → Annuler).
2. **La précision de la saisie suit celle de la connaissance.** Une intention se date en horizons (aujourd'hui, 1 mois, 3 mois, 6 mois, 1 an, plus tard) et se reporte d'un geste. Le jour exact n'est demandé que là où il compte : brassage, échéance, mesure. La règle vaut aussi pour les quantités et les prix : une estimation est permise et dite comme telle.
3. **Le geste sur la représentation passe avant le formulaire.** Exemples : étirer un graphe dont l'échelle suit, glisser une barre sur la frise. Au téléphone, il faut éviter le sélecteur de date au jour près, le texte libre et le champ numérique.
4. **Chaque réglage montre tout de suite ce qu'il change.** Le modèle est celui du temps de houblon qui fait bouger l'IBU. À chercher partout où un réglage a une conséquence calculable : coût, caisse, cuve, stock, date de fin, densité.
5. **Peu à la fois, dans l'ordre de la décision.** Au premier plan, seulement les champs qu'on remplit presque toujours ; le reste est replié, rien ne se perd.
6. **Une vue spécialisée par action fréquente.** La référence est l'épicerie du stock : visuelle, actionnable, comprise d'un coup d'œil. Le texte en dur reste quand il est nécessaire, en dernier recours.
7. **Pousser l'existant avant d'ajouter.** Les actionneurs de haut niveau déjà présents (frise du temps, graphe d'ébullition, épicerie, curseurs) sont à finir, à affiner ou à étendre à d'autres écrans, plutôt que d'en créer d'autres à côté.

## 4. Garde-fous contre le sur-ajustement et les biais
- **Méthode d'inventaire, pas d'exemples injectés.** On dresse la table des actions de l'app : chaque objet (projet, recette, brassin, vente, achat, fût, mesure…) croisé avec chaque verbe (créer, dater, chiffrer, lancer, finir, défaire). Pour chaque case, on note quatre choses :
  - l'intention ;
  - les suites naturelles (règle 1) ;
  - la précision juste (règle 2) ;
  - le retour attendu (règle 4).
- **Ses exemples servent de témoins.** La méthode doit retrouver seule le projet, la vente, le brassin et la recette de Noël. Elle doit aussi produire des cas qu'il n'a pas nommés : c'est le test de généralisation.
- **Tri par fréquence × friction**, mesurées dans l'app : gestes comptés en local et usage réel quand on l'a. Aucune fréquence inventée.
- **Ses refus restent des refus.** Sont refusés pa3, pe2, pe5 (la vue « toute ta chaîne ») et pb4. La règle 1 parle du mécanisme (les effets se produisent), pas d'une vue qui les liste ; rien ici ne la ramène.
- **Le gel décidé le 20.11 prime.** Aucune nouvelle fonction tant que les écrans ne sont pas réparés un par un, dans l'ordre Calendrier, Carnet, Recette, Brassins, Stocks, Finances. Ce cadrage sert à analyser et à proposer. Ses choix entrent au passage de leur écran, dans l'ordre du gel.
- **Pas de doublon** avec la mission parallèle `2026-11-20-moins-de-gestes` (suggestions par style, v03 classée 1). Elle couvre la règle 1 côté recette, elle est à reprendre telle quelle.

## 5. Mini maquettes de workflow, pas de visuel
- **Forme** : un scénario en étapes, chacune dite « geste → ce qui change, où ». Fil de fer gris, sans couleur ni style, avec les gestes comptés avant et après. Chaque planche porte la mention « workflow, pas le dessin ».
- **Ce qu'il choisit, c'est l'enchaînement.** Au port, le visuel reste celui de l'écran qu'il a déjà choisi : la règle n° 1 s'applique à sa maquette d'écran, le workflow s'y greffe. Une forme d'écran neuve ne vient que d'une demande de maquette d'écran à part.
- **Regards avant la page** (skill `jury`) : le Brasseur pour ce qui suit naturellement, un expert UX/UI pour les actionneurs, la précision et le retour, puis le critique calibré. Méthode des maquettes (skill `maquettes`, chantier `simplicite`), en mode basse fidélité.

## 6. Axes ouverts (variantes, jamais bloquants)
- **« Estimer directement un prix »** : depuis l'historique, le catalogue, l'IA bon marché, ou une simple fourchette. À montrer en variantes.
- **Les horizons de date** : la liste exacte, et quand « dans 3 mois » se change en jour précis.
- **Le projet ajouté au calendrier** : la page bascule au calendrier, ou il reste sur place avec un lien.

## 7. Prochaine étape
Une session par passage d'écran (ordre du gel) applique l'inventaire de la section 4 à son écran, puis montre les mini maquettes de workflow de la section 5. Rien n'est codé avant son choix.
