# Dossier note-tests — NOTE-EXPLOITEE et LIEN-PAS-PRODUIT

Règles : work/missions/2026-11-24-carnet-personas/note/SYNTHESE.md (N1..N5, lis-la en entier) ; défauts : work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md § NOTE-EXPLOITEE et § LIEN-PAS-PRODUIT ; ses mots : « J'ai ajouté une notre, l'ia devrait en faire qqch », « elle a plus d'action sur ma note, catégorisé, classifie… », « un lien peut être ajouté dans que ce soit un produit à comparer, comme l'a pas l'exemple un lien sur les frais d'envoi ».
Le port D451 (en ligne tour 73) a déjà le fil, les étiquettes et la provenance « ta note » (C67-8) : regarde ce qui existe avant d'écrire (grep etiquettes, provenance, rattache) ; un test déjà vert est un garde, pas un rouge.
- N1..N4 : par le composant (carnet houblons ZZ aux 2 articles, note « le site français semble ne plus avoir de stock »), avec une réponse IA de la forme de functions/src/carnetIA.ts (marque-la simulée ; aucune réponse réelle relevée pour ce cas : écris DEMANDE RELEVE).
- N5 : un lien d'information (page frais d'envoi d'un vendeur, fixture HTML anonyme) n'entre jamais dans Articles ni Comparer ; il devient un fait du vendeur appliqué au prix rendu de ses articles.
- Pas de surapprentissage : 3 notes neuves de formes différentes (dispo, qualité, délai), pas seulement l'exemple.
