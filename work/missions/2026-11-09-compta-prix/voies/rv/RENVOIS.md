# Règle transversale : chaque manque est un renvoi (CP-18, 10.11)

Ses mots, dans l'ordre du jour : « il faudrait un renvoi et une explication » (Prix) ; « Pas de renvoi sur la densité, texte inutile » ;
« Ça semble pas vraiment fonctionné ?? » ; « Pas de renvoi ? Ou mettre les valeurs pour avoir les données ?? » (coût du brassin) ;
« Pas de renvoi ???? » (Limites de cette prévision) ; « Pas de renvoi ??? / Bref il en manque plein... » (Annuel, « Stock au 31 déc. ? »).

## La règle
Partout dans la compta (Finances : Synthèse, Opérations, Prévisions + Limites, Annuel + Clôture ; Clients : Prix, Impôt bière ; Brassins :
fiche › Argent, coût du brassin, feuille Impôt bière ; la caisse), tout manque VISIBLE — « ? », « à compléter », « à noter », « à confirmer »,
« à renseigner », « à indiquer », « à corriger », « à compter », « à estimer », « illisible », un montant hachuré — est :
1. **un renvoi** : un bouton ou un lien (cible ≥ 24 px) qui ouvre directement l'endroit où saisir la donnée (la fiche du brassin sur la bonne
   rubrique, la pièce, le tarif, la feuille du solde avec ses paramètres dépliés, l'inventaire du bon côté et de la bonne nature, le registre
   du matériel, le journal filtré…) ;
2. **expliqué en peu de mots** : ce qui manque et ce que ça empêche (« sans lui, pas de coût du litre ») — une petite ligne, pas un paragraphe.
Forme : celle de la maquette choisie de l'écran (règle n° 1) — le « ? » hachuré reste, il devient touchable ; une puce de texte devient une
ligne-tâche « … › » (acquis : « Confirmer les paiements (n) › »). Jamais un nouveau composant si un état de la maquette le porte.
Exemptions possibles, chacune écrite dans le code (`data-renvoi="aucun"` + raison en commentaire) : un « ? » de légende, un manque déjà
porté par un renvoi voisin dans la même ligne.

## Le contrôle commun
`tests/integration/renvoisPartout.test.tsx` (écrit par la voie rvA) : rend chaque écran sur un jeu clairsemé qui imite ses données
(solde non confirmé, brassins sans litres ni densité, ingrédients sans prix, projets non datés, paiements à confirmer, pièce sans date,
inventaires vides) et, pour chaque nœud texte visible qui correspond à `/\?|à compléter|à noter|à confirmer|à renseigner|à indiquer|à corriger|à compter|à estimer|illisible/`,
exige un ancêtre `button`, `a`, `[role=button]`, `summary` ou un `data-renvoi="aucun"`. Il liste les fautes par écran. Rouge sur acc39f7a.
Chaque voie fait passer les écrans de son Possède ; les autres fautes restent listées (le pilote les répartit).

Commun : lis `voies/COMMUN.md` (acquis, « remplacer, jamais fusionner »). Aucun commit, pas de `git stash`, Gemini jamais appelé, aucune
donnée réelle. Captures 390 tactile (clair et cave) des écrans de ton Possède sur `?dev-local&finance-demo=reel`, avant et après, ouvertes (L12).
