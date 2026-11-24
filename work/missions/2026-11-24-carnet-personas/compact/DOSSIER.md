# Dossier compact — persona : concepteur UX mobile, densité et hiérarchie

## Sa demande (24.11, mot pour mot)
« Assez bof... Et le prix... https://www.motlerhops.fr/collections/tous-nos-houblons/products/citra-us https://www.brauundrauchshop.ch/citra-136-2 Il y a encore beaucoup de problèmes de mise en page. Et les écrans du carnet sont trop parasité par tout le reste. Un exemple ici je vois quasiment rien car la donnée réel est à peine 50% de mon écran... Aussi dans les comparaisons on voit pas qui gagne quoi. Fait passer les critiques avec les bon persona sur ce carnet. C'est pas assez compact, d'autres vue sont mal faites, globalement ça fonctionne mais il manque quelques truc, et pas mal aussi de classification ou de sous catégories »
Ses captures : work/missions/2026-11-23-reprise-soir/plaintes/2026-11-24-carnet-1.jpg à -5.jpg (ouvre-les toutes). Défauts écrits : work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md § CARNET-DONNEE-PREMIER-PLAN, COMPARER-QUI-GAGNE, LIEN-PRIX-JUSTE. Ses choix du Carnet (règle n° 1 : les respecter, proposer les écarts comme variantes) : work/missions/maquettes-carnet/CHOIX.md, work/missions/2026-11-23-reprise-soir/voies/carnet-q/decisions-D435-D437.txt.

## Où
- https://brasserie-l-affinee.web.app dans le Chrome de débug : puppeteer-core connect 127.0.0.1:9222, ton onglet neuf, 390 × 844, deviceScaleFactor 2, toucher. Fin : page.close() de ton onglet, browser.disconnect(). JAMAIS browser.close(). Jamais Claude in Chrome. Paquet servi : curl ?nocache=<aléa>, noté.
- Ses carnets (Houblons, Chambre froide, et 2 ou 3 autres de genres différents) : REGARDER SEULEMENT ; feuilles ouvertes puis fermées sans valider ; aucun appel IA ; aucune donnée écrite. Chaque vue : liste des carnets (puces de domaine), carnet ouvert, Articles, fiche d'article, Comparer, Choisir, Quand, notes, recherche.

## Rendu
- RESULTAT.md tenu au fil : ligne 1 « RESULTAT <persona> : N problèmes (B x, m y, D z) — K propositions ». Puis « combien et quels problèmes ? » en liste numérotée (gravité, vue, capture), puis tes PROPOSITIONS (ce qui changerait l'écran), chacune marquée « dans ses choix » ou « écart à ses choix : à lui montrer en variantes ». Captures dans cap/ (390, ouvertes avant verdict).
- Ne verse rien à BUGS.md (le pilote fera la synthèse). Aucun fichier de src/ modifié.
- Tests : aucun test unitaire ; « Tests : sans objet (test d'écran) ».

## Ton regard
- MESURE, vue par vue, à 390 × 844 : part verticale de l'écran occupée par la donnée du carnet contre le « chrome » (onglets Articles/Recompter/Courses/Fûts/Matériel, sous-onglets Parc/À venir/Carnets/Réalisés, fil d'Ariane, champ « Ajouter à… », bouton +, barre du bas, marges, cartes dans des cartes) ; tableau par vue ; contrôle CARNET-DONNEE-PREMIER-PLAN (≥ 70 %).
- Mise en page : textes coupés, retours à la ligne, alignements, chiffres en police à chasse fixe espacée (« 2 697,74 », « 0 à 8 °C »), photo qui prend la place, cartes trop hautes, défilement horizontal.
- Comparer : comment montrer « qui gagne quoi » (marque par ligne, couleur, rang) sans alourdir.
- Propositions concrètes et compactes (ce qui se replie, se fond, disparaît en mode carnet ouvert, ce qui monte en premier plan), chacune avec le gain mesuré estimé.
