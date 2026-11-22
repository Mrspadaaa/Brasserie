# Sessions : état (lecture des derniers messages, sans horodatage ; « depuis 12 h » non vérifiable)
Les 9 sessions sont idle. Aucune ne pose de question marquée « needs the user » au brasseur, sauf Simplicité (oui/pas encore).

- Finances : mineurs 22-26 et échec coutBrassinRenvois corrigés, en ligne (b658b838), 4 tags `en-ligne/*-finances` poussés, 198 tests verts. Jeu ZZ TEST fait : 11 problèmes FN-30 à FN-40 (3 graves : FN-33 double toucher paie+annule, FN-35 baisse sous le payé fait disparaître 2,00, FN-37 trop-payé compté dans « dépensé »). ZZ retirés. Attend : déploiement des fonctions (« Il faut les déployer depuis la session de l'Aide au brasseur ou depuis le pilote ») -> PILOTE. Reste : corriger FN-30..40 ; non joués : 390, Prévisions, budget brassin, compagnon, apport ; totaux « Tout » non relus.
- Atelier : 11 corrigé (en ligne depuis 4067e777), 13 testé (Flash-Lite dès 3 mots), commit a42e9255. Jeu en ligne ZZ TEST NON fait : « l'app demande une connexion Google que je ne peux pas faire, il revient au pilote » -> PILOTE. Reste : 16 non reproduit au banc (45/45), « noter le geste exact » ; 13 non joué en ligne. Vente de 5 695,00 non touchée.
- Menu (Recherche, menu, réglages) : transversaux-2 joué en ligne dans Chrome à 2560 seulement (390 et 1280 impossibles), commit a84896c7. 34 tenu (« Partout » sur 5 écrans). 32 non reproduit ; cause par le code (ProductionCatalog.tsx:57), couverte par 43f0ce40. Aucun ZZ créé, console propre. Rien en attente. Reste : 390 tactile non vérifié ; tag en ligne non lisible. Dernier message visible = un Bash, pas de récap final : à confirmer.
- Recette : matin en ligne, tag LOCAL `en-ligne/2026-11-16-recette-matin` (49b1b497), non poussé ; conflit PlusSheet résolu (« Partout » gardé). Pas de capture du « + », pas de jeu en ligne ZZ TEST (36, 37 non rejoués). Attend : rien d'explicite ; PILOTE pour pousser le tag et jouer en ligne. Note : futs3, déployé après, avait retiré recette-matin du site ; stock-37 l'a repris (voir Stock) -> vérifier que recette-matin est bien servi.
- Fûts : en ligne `en-ligne/2026-11-16-futs3` (1ea65ff1), joué sur fût ZZ TEST retiré (parc F-001..F-004 intact) : 28, 29, 30 faits, futs2 rejoué. Rien en attente. Reste : 390 px et « Trop de fûts » (test seul) non vérifiés.
- Stock : fiche Stock = manque de la recette (6,6 kg au lieu de 67,1), stock négatif « à corriger ». 513 tests verts, build vert, c431036a en ligne, tag `en-ligne/2026-11-16-stock-37`, commit dd23c5d5 ; reprend futs3 et recette-matin. Joué en ligne sur « ZZ TEST — Recette » (capture). Rien en attente. Reste : 390 non vu en ligne.
- Simplicité : choix du brasseur (pa1 pa2 pe1 pe3 pe4 pb1 pb2 pb3 pm1 pl1 pl2) inscrit au registre + SPEC (cd8fd232) ; règle « chaque geste décompte ce qu'il use » en priorité 1 (fd33beba, REGLE-CONSOMMATION.md). Rien codé. Contrôle du registre en échec (captures manquantes pour toutes les entrées). Attend, sa phrase : « Je la code ici maintenant (oui / pas encore) ? » -> pilote/brasseur ; point ouvert : table « pré-remplie » vs pe4 (pas de dose inventée), lu « articles pré-remplis, doses demandées une fois ».
- Besoins : mission close (56af6a4b), pas de passe 9, calendrier passe à fb ; genere-fixture.mjs refuse d'écraser la fixture de 40 éléments. Pas de jeu en ligne mentionné. Rien en attente. Reste : fb9 et liens-app reprennent `besoins-cloture-16-11.md`.
- Brassins : constats 2 à 5 corrigés avec test rouge puis vert (c5783fdf), 1 et 6 non reproduits ; calendrier de la feuille « Brasser » corrigé ; en ligne `en-ligne/2026-11-16-brassins-nuit` ; BUGS.md marqué. Jeu en ligne de la correction NON refait. Reste : échec neuf coutBrassinRenvois (fichiers Finances) ; 2 erreurs tsc dans functions/ ; fiche courte « Préparer » : vide sous les boutons « à juger ».

## Attend le brasseur
- Simplicité : « Je la code ici maintenant (oui / pas encore) ? » (le pilote peut trancher : défaut prudent = pas encore, non bloquant).
- Aucune autre question au brasseur.

## À relancer par le pilote
1. Déployer les fonctions (texte serveur compagnon, Finances).
2. Jeu en ligne ZZ TEST avec connexion Google : Atelier (11, 13, 16), Recette (36, 37, bouton « + »), Brassins (correction calendrier).
3. Finances : corriger FN-33, FN-35, FN-37 puis FN-30..40 ; jouer 390, Prévisions, budget brassin, compagnon, apport.
4. Pousser le tag recette-matin ; vérifier qu'il est servi après stock-37.
5. 390 tactile et 1280 en ligne : Menu, Fûts, Stock, Atelier (fenêtre Chrome bloquée à 2560).
6. Simplicité : réponse oui/pas encore ; réparer les captures du registre.
7. Corriger coutBrassinRenvois, 2 erreurs tsc functions/ ; BUGS.md du checkout openai-clean-start à tenir à jour.
8. Menu : confirmer son état final.
