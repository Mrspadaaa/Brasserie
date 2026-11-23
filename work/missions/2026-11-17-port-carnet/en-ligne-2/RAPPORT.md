# Rapport — test en ligne 2 du carnet (18.11)

Source : REPRISE.md (critique arrêté à 200 k) ; nettoyage fait par le pilote Sonnet. Bundle servi : index-LFrF18w0.js, CarnetsVue-BykaRzxl.js, aiTask réel (gemini-3.8-flash).
Volume : 12 envois IA (sur 30 autorisés), 15 appels aiTask. alert/confirm : 0 appel.

## Problèmes (13 : 8 bloquants, 4 moyens, 1 faible)
1. (bloquant) Note en vrac : la bonne réponse de l'IA (2 carnets, vanne au fermenteur) est écrasée par la découpe locale (`ecrireIA`, branche `vrac`, CarnetsVue.tsx ~L601) ; la vanne reste dans « Prochain brassin ».
2. (bloquant) La ligne pompe d'une note en vrac disparaît : carnet Pompe annoncé puis supprimé, l'IA l'ayant typé « idee » (filtré par `utiles`).
3. (bloquant) « doit tenir 80 °C » écrit dans Pompe : aperçu « va dans doit tenir 80 °C », retour « ✓ Rangé ici », Pompe reste vide. Marche seulement en touchant « Ici ».
4. (bloquant) Phrase sans objet depuis la liste : carnet titré par le critère alors que l'IA rangeait dans Pompe.
5. (bloquant) « tuyau silicone 8 mm, 5 m » dans Pompe : carnet neuf « Tuyau silicone » vide ; la note (5 m, à acheter) perdue.
6. (bloquant) Prix CHF perdus sur 3 liens sur 3 (489, 320, 289) ; test 1 les gardait (régression).
7. (bloquant) Après le 2e lien, le 1er article perd son nom (« Lien sans aperçu · à relire ») ; les deux ne s'ouvrent plus ; Choisir hors d'atteinte.
8. (bloquant) Comparer avec 2 articles : « Le tableau naît au 2e article lu » ; aucun tableau ; galaxus « lecture… » sans fin.
9. (moyen) Champ vendeur rempli de raisonnement / balises cassées du modèle (300 car.), stocké, non affiché.
10. (moyen) Note « double paroi » devenue « Critère : Vérifier s'il existe avec double paroi » (type local imposé à une tâche).
11. (moyen) Réfractomètre reste dans le Fermenteur, menu sans « Déplacer ».
12. (moyen, geste sans effet) Dans la liste, le premier toucher sur un carnet ne l'ouvre pas quand le champ a le focus : le cadre « Créer » se replie, la liste saute de ~120 px. Vu 3 fois.
13. (faible) Titres neufs sans « ZZ TEST — » quand la phrase n'en a pas (attendu) ; la liste reste sur la liste après création (doute).

Doutes : bandeau « Enregistrement sur le serveur… » resté affiché de 14:17 à 14:21+ (revu brièvement à l'écran pendant le nettoyage) ; erreurs console seulement Firestore « update time in the future » ; page galaxus lue = un sécateur (id inventé) sans alerte de l'IA.
Fonctionne : modifier une note (« Note modifiée · Annuler ») ; supprimer puis Annuler ; confirmation de suppression in-app (« Il part avec 1 article et 1 note », sans dialogue).
Non testés (critique arrêté) : Choisir → « Envoyer dans À venir » → « Garder le plan sans ce carnet » ; test 1 n° 4 (titre coupé).

## Carnets retirés (6, par l'app : Plus › Supprimer l'idée › Supprimer)
ZZ TEST — Fermenteur conique inox ; ZZ TEST — hotte d'extraction pour la salle de brassage ; ZZ TEST — Prochain brassin ; ZZ TEST — pompe de transfert pour le moût chaud ; « Tuyau silicone » ; « doit tenir 80 °C » (ces deux derniers créés par l'app pendant le test).
Vérifié après rechargement : Carnets 0 ; À venir 3 (inchangé).

## Messages restants (non effacés)
Les messages `carnet-message` survivent à la suppression des carnets (19 dans le cache Firestore local de l'onglet, tous du 18.11 et du test ; 6 portent « ZZ TEST », 13 n'en portent pas, car découpés par l'app). Ceci est aussi un défaut : la suppression d'un carnet laisse ses messages orphelins.
Avec « ZZ TEST » :
MSG-429a1afe-c9f4-43dc-934b-8431386debcd, MSG-e8eb5ed0-b93c-47ec-8613-a12cc7908d27, MSG-4583dfed-a542-4e3d-8116-de7153575333, MSG-233109b8-cc1a-4224-9a95-49c3eaf3f677, MSG-3445b462-e07c-4097-9a7f-6c43cca53828, MSG-21ffb2bc-c165-47ab-a869-c0911dbd1a38
Sans le préfixe, mêmes séries (critères, liens, notes du test) :
MSG-4c93b0b9-206a-4d74-9ff9-d6fd5df213a6, MSG-4c76157c-f9ee-4d90-a02c-561de00ae725, MSG-631b7e3a-8886-45f4-9aa1-dbbd8af73f1c, MSG-4aacdf3d-0b1e-4bee-be66-ed97c2aa3b19, MSG-3784be85-bb25-4816-ba44-3aa88fd9a2f1, MSG-6eb607a0-3bbc-4d09-a777-73324bf5fbd2, MSG-2b20afd2-7761-4d17-a6b8-af041ec0a9c5, MSG-d50a19ff-88b5-4457-aea2-15ce169c39b6, MSG-dc831a79-482e-4b51-bd23-bdc30bf0fa58, MSG-9fbb515d-ab99-4802-9c81-852500c41f3c, MSG-d760863c-5456-4560-9bf5-718e052db378, MSG-7e230c95-29c3-4050-945c-9ee2e3a36653, MSG-90d41e71-5af6-44a3-872b-306c0bc77ced
Lus dans le cache de l'onglet (peut compter aussi des messages d'avant ; l'horodatage 18.11 14:00-14:19 relie la plupart au test). À vérifier côté serveur avant effacement.
