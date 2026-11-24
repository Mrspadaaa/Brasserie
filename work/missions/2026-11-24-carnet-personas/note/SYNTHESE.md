# Synthèse des personas sur sa note (24.11) — brasseur, besoin, IA et données

Accord des trois : la note « Semble difficile à obtenir sur le site français » est un FAIT sur l'article MotlerHops (lien .fr), qui contredit « en stock · 3,72 € » classé 1er. Pas une catégorie de plus.

Retenu (règles pour les tests) :
- N1 : l'IA rattache une note à l'article dont elle parle, en CITANT le passage qui le prouve (« site français » ↔ motlerhops.fr) ; aucun rattachement si deux articles correspondent. Prérequis technique : envoyer l'id et le domaine des articles dans le contexte (functions/src/carnetIA.ts l. 83 n'envoie que {nom, valeurs}) et un champ articleId vérifié côté client.
- N2 : le rattachement devient un fait visible sur la ligne de l'article, la fiche et Comparer : « dispo douteuse · ta note, 24 nov. », à côté de « en stock » lu sur la page (les deux gardés, sa parole en avant), annulable d'un toucher.
- N3 : sa phrase n'est jamais réécrite ; « semble » ne devient jamais une certitude ; aucun score de confiance affiché.
- N4 : une question à vérifier est proposée (« Vérifier la dispo chez MotlerHops ») avec Relire de la page, jamais lancée seule (facturée).
- N5 (même mécanisme, LIEN-PAS-PRODUIT) : un lien d'information (frais d'envoi, conditions) est rangé comme fait du vendeur et appliqué à ses articles (prix rendu), jamais comme article.
- À LUI (mini maquettes) : où montrer le fait (badge, ligne, sous l'article) et combien un doute pèse sur le rang (rien, signe seul, rétrograde).
