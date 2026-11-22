OK — inventaire levure écrit et 5 captures ouvertes ; GATES.md absent, VOIE.md suivi seul.

Fichiers écrits (tous dans work/missions/2026-11-09-ecran-levure/inventaire/) :
- inventaire-levure.md (inventaire, 1 354 mots selon wc, tableau compris ; dépasse les 900 mots demandés)
- capturer-levure.mjs (copie adaptée de capturer-fermentescibles.mjs)
- captures/levure-choisie-390.png, captures/levure-geste-choisir-390.png, captures/levure-detail-390.png, captures/levure-vide-390.png, captures/levure-choisie-1280.png, captures/reference-malts-p6-b2-sucre-apres.png, captures/journal.json
Aucun fichier de src/ ni de deploy-bc70 modifié. Serveur Vite lancé sur le port 5641 puis arrêté (code 0). Vite a pu écrire son cache dans deploy-bc70/node_modules/.vite (non vérifié).

Critères (VOIE.md, GATES.md absent) :
- Inventaire écrit, lignes citées : OK (fichier présent, 48d16402).
- Captures 390 (choisie, sans levure, geste, détail) et 1280 : OK, ouvertes une à une. Journal : erreurs page 0, requêtes bloquées 0.
- Référence Malts/sucres 390 remplie : copiée de v6/p6-b2/p6-b2-sucre-apres.png, ouverte. Elle affiche « Fermentescibles 2/7 », pas « Malts/sucres ».

Essais : 2 passes de capture. La 1re a donné une capture « détail » identique à « choisie » (fiche sous le pli) ; corrigée par défilement, 2e passe OK.

Lecture des captures (une ligne chacune) :
- levure-choisie-390 : carte SafAle US-05 (Catalogue), champ « Changer », offres 3,40 CHF et 2,90 EUR « Prix à revérifier », bandeau Grain 0 kg · OG 1,066 · IBU 60 · EBC —.
- levure-geste-choisir-390 : champ « Changer » et liste repliée, « Parcourir les 1 734 références », « Fermer la recherche ».
- levure-detail-390 : fiche « Compléter ou corriger la fiche » ouverte (18–26 °C, 78–82 %, 9–11 % vol, floculation non renseignée).
- levure-vide-390 : « Levure · choisir », « Chercher un lot » et « Saisir une levure hors catalogue », « 1 point à vérifier », pas de bandeau.
- levure-choisie-1280 : fil avec libellés, carte levure, pied Retour / Suivant — Paliers épinglé.

Ce qui reste douteux :
- GATES.md n'existe pas dans le dossier de la voie ; seul VOIE.md a été lu.
- Stock levure vide dans le banc : état « en stock », liste de comparaison, essai de conduite, hors ligne et erreur non vus.
- Lien houblons (biotransformation) : non vérifié.
- Gemini derrière « Rechercher la fiche avec l'IA » (RecipeAutoComplete.tsx:519) : non cliqué, non vérifié.
- Référence : la voie disait « s1 sur p6-b2 » ; choix par lecture de p6-b2-sucre-apres.png, à confirmer.

CONNAISSANCE : aucune

LEÇON PROPOSÉE : Une voie lancée sans GATES.md (critères CHECK/EXPECT absents) ne peut être rejouée par le pilote ; la cause est une mission créée sans ses fichiers de critères. La règle : le pilote écrit GATES.md avant de lancer la voie, et contrôle sa présence.
