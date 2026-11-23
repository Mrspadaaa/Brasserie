# REPRISE — test en ligne 2 du carnet (critique Opus, arrêté à 200 k par le hook)

Mission : rejouer en ligne avec l'IA réelle (brief du pilote : en-ligne-1/RAPPORT.md, plafond 30 envois, seulement des carnets « ZZ TEST », pas d'alert/confirm, supprimer ses carnets par l'app à la fin, lister les messages restants). Sortie attendue : `en-ligne-2/RAPPORT.md` + ligne « EN LIGNE CARNET 2 — n problèmes (n bloquants), n envois IA, carnets retirés oui/non ».

## Fait (preuves dans journal-ia.md)
- Bundle vérifié : index-LFrF18w0.js servi (fetch no-store), CarnetsVue-BykaRzxl.js, plus de mode figé « eteint ». aiTask réel appelé (gemini-3.8-flash).
- 12 envois IA sur 30 (15 appels aiTask). alert/confirm interceptés dans l'onglet : 0 appel.
- Onglet de travail : Claude in Chrome tab 1005988330 (encore ouvert ; le fermer à la fin). Interception fetch posée dans window.__ai (perdue si rechargement).

## Carnets créés (à supprimer par l'app : Plus › Supprimer l'idée)
1. ZZ TEST — Fermenteur conique inox (critère double paroi, note Réfractomètre ATC 0-32 °Brix, article brouwland)
2. ZZ TEST — Prochain brassin (critère vanne)
3. ZZ TEST — pompe de transfert pour le moût chaud (critère 80 °C)
4. doit tenir 80 °C (SANS préfixe ZZ TEST — créé par l'app à partir de mon envoi)
5. Tuyau silicone (SANS préfixe ZZ TEST — créé par l'app)
6. ZZ TEST — hotte d'extraction pour la salle de brassage (critère 1 200 m³/h, 2 articles galaxus/ricardo)

## Problèmes constatés (à reporter au RAPPORT)
1. (bloquant) Note en vrac : la réponse juste de l'IA (2 carnets, vanne au fermenteur) est écrasée par la découpe locale (`ecrireIA`, branche `vrac`, CarnetsVue.tsx ~L601 : « l'IA ne change pas la cible ») ; la vanne reste dans « Prochain brassin » (test 1 n° 3 rejoué).
2. (bloquant) La ligne pompe de la note en vrac disparaît : le carnet Pompe est annoncé puis supprimé, l'IA l'ayant typée « idee » (filtrée par `utiles`).
3. (bloquant) « doit tenir 80 °C » écrit dans Pompe : aperçu « va dans doit tenir 80 °C », retour « ✓ Rangé ici », Pompe reste vide (test 1 n° 2 rejoué). Marche seulement en touchant « Ici ».
4. (bloquant) Phrase sans objet depuis la liste → carnet titré par le critère (« doit tenir 80 °C ») alors que l'IA rangeait dans Pompe ; aperçu proposait « Prochain brassin ».
5. (bloquant) « tuyau silicone 8 mm, 5 m » écrit dans Pompe → carnet neuf « Tuyau silicone » vide ; la note (5 m, à acheter) perdue ; l'IA la gardait dans Pompe.
6. (bloquant) Prix en CHF perdus sur 3 liens sur 3 (489, 320, 289) : l'IA ne rend pas de prix, l'article n'en a pas. Test 1 les gardait (régression).
7. (bloquant) Après le 2e lien, le 1er article perd son nom (« Lien sans aperçu · à relire ») ; les deux ne s'ouvrent plus ; Choisir hors d'atteinte (test 1 n° 7 rejoué autrement).
8. (bloquant) Comparer avec 2 articles : « Le tableau naît au 2e article lu : collez un 2e lien » ; aucun tableau ; galaxus « lecture… » sans fin.
9. (moyen) Champ vendeur rempli de raisonnement / balises cassées du modèle (300 car.) — non affiché, mais stocké.
10. (moyen) Note « double paroi » devenue « Critère : Vérifier s'il existe avec double paroi » (type local imposé à une tâche ; l'IA disait note à faire).
11. (moyen) Réfractomètre reste dans le Fermenteur, menu sans « Déplacer » (test 1 n° 6 rejoué).
12. (moyen, geste sans effet) Dans la liste, le premier toucher sur un carnet ne l'ouvre pas quand le champ a le focus : le cadre « Créer » se replie et la liste saute (~120 px) sous le doigt. Vu 3 fois.
13. (faible) Les titres de carnets neufs perdent « ZZ TEST — » quand la phrase n'en a pas (attendu) ; la liste reste sur la liste après création au lieu d'ouvrir le carnet (doute).
Doutes : bandeau « Enregistrement sur le serveur… » resté affiché de 14:17 à 14:21+ (à revérifier après rechargement) ; erreurs console seulement Firestore « update time in the future » (1 ms, comme test 1) ; page galaxus lue = un sécateur (mon id inventé) sans alerte de l'IA.
Modifier une note : agit (« Note modifiée · Annuler »). Supprimer puis Annuler : agit, sans dialogue.

## Reste à faire
1. Tester Choisir → « Envoyer dans À venir » → « Garder le plan sans ce carnet » : il faut un article à page « lue » seul dans un carnet (ex. Pompe : « pompe vue à 189 CHF https://www.galaxus.ch/fr/s1/product/pompe-24467310 », la page lue sera le sécateur Darlac). Si un plan ZZ TEST arrive dans À venir, le retirer par l'app (À venir comptait 3 plans réels avant).
2. Rejouer test 1 n° 10 (confirmation de suppression « Il est vide » sur un carnet non vide) en supprimant chaque carnet ; n° 4 (titre coupé) non revu.
3. Supprimer les 6 carnets par l'app ; recharger ; vérifier « Carnets 0 ».
4. Lister les ids `carnet-message` ZZ TEST restants (cache Firestore IndexedDB ou MCP firestore en lecture seule `creativeItems` type carnet-message) sans les effacer.
5. Écrire RAPPORT.md, fermer l'onglet 1005988330, rendre la ligne.
