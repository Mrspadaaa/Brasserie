# Jouable passe 4, correction 1 (nuit du 25.11)

Juges : juge-critique-j1.md (7, 7 B), juge-action-j1.md (7,4, 6 B), juge-produit-j1.md (7,3, 6 B). Direction validée ; à corriger avant publication.
Bloquants (union des trois) :
1. Toast / Annuler qui suit d'un carnet à l'autre : un toast meurt quand on quitte le carnet ; Annuler n'agit que sur son carnet.
2. Le pouce après une décision : après Retenir / Fait / Choisir / Réparer, la zone du pouce montre la prochaine action réelle (celle de l'option
   retenue, ou « ✓ Réglé » / « Rouvrir »), jamais celle d'une option écartée, jamais vide.
3. Ce qu'il vient d'écrire est repris : après « Noter » (ex. « prix du joint : 6 CHF »), la case concernée montre sa valeur tout de suite,
   marquée « noté · l'IA relit », et la tâche qu'une note règle (« Starter lancé ») passe à fait-proposé ; la vraie relecture IA confirme.
4. Hors ligne : l'Organisé déjà lu reste affiché (daté), avec « l'IA relira au retour du réseau » ; jamais remplacé par « rien à lire ».
5. Comparaison : règles du gagnant — pas de couronne si le total est inconnu ou si l'offre ne couvre pas le besoin (400 sur 600) ; le total
   inclut une livraison connue et marque « + livraison ? » si inconnue ; Citra : ce qui dépend de la variété (arômes, origine) est commun aux
   offres, pas rangé par fournisseur ; un prix ambigu (plusieurs poids sur la page) n'est jamais affiché comme sûr (« 3,72 € ? »).
6. Une ligne cassée de ses notes (« fût.EST — ranger la cave ») n'est jamais mise en carte de tête ; elle reste dans Mes notes telle quelle.
7. Plus de grands vides entre le contenu et le pouce (le contenu remonte, ou la zone du pouce se resserre).
8. Embouteillage : le repère « aujourd'hui » à sa vraie place (avant le début si la période commence dans 157 j).
Mineurs : traite ceux que les trois juges citent en commun (icônes sans légende au premier usage, dates intermédiaires d'À faire, coût de l'IA).

Contrat : possède jouable/ (p4.html, fragments/, cap/, reponses/, CAS.md, RESULTAT.md, CORRECTION-J1-FAIT.md). Rien d'autre.
Tests : aucun test unitaire ; la preuve est la vision.
Gestes : chaque bloquant rejoué en geste (toucher, décider, noter, hors ligne, ouvrir un autre carnet après une décision).
Captures 390 : 390 × 844 (deviceScaleFactor 2), puppeteer-core sur le Chrome de débug 9222, ton onglet, page.close() puis browser.disconnect(),
jamais browser.close(). Captures 1280 : aucune. Ouvre chaque capture. Mots ≤ 30 au repos, info utile ≤ 120 px, rejoués.
Commit local de jouable/ seul. Si ton contexte approche 350 k : REPRISE.md à jour, rends « REPRISE : <fichier> ».
