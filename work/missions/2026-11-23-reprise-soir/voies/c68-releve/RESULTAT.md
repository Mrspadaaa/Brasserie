RELEVE 6 réponses carnet identique oui

# RESULTAT c68-releve (25.11, 2e passage, sous l'Autorisation du DOSSIER)

Paquet en ligne : index-BRxcNYiQ.js (curl ?nocache et onglet, avant comme après). Chrome de débug 9222, onglet neuf, 390×844, fermé par page.close() + disconnect.
Script unique : `releve.mjs` (copies locales de `outil.mjs`, `liste.mjs`, `nav.mjs` de critique-68), un seul lancement, code 0. Journal : `journal.txt`.
Tests : sans objet (relevé de données, aucun test lancé).
Coût IA : 6 appels `aiTask` / `rangerCarnet` (gemini-3.8-flash, fast, 4,1 à 7,2 s), ≈ 0,012 CHF, 6 lignes ajoutées à `work/missions/2026-11-23-carnet-en-ligne/ia-journal.jsonl` (voie c68-releve ; fichier hors OWNS, non commité ici).

## Ses données : identiques
- Avant / après : onglet « Carnets 32 » / « Carnets 32 » ; cache Firestore : 3 401 documents hors ZZ avant, tous présents après, même updateTime et même empreinte (0 changé, 0 manquant, 0 neuf). Les 12 entrées neuves du cache sont des tombes (sans document) : les 6 carnets ZZ et leurs 6 notes, défaits par Annuler.
- Chaque carte « rangé pour toi » annulée par son bouton Annuler ; après chaque Annuler, la phrase n'est plus dans la liste. Ménage : aucun carnet c68 restant (`menage` vide, liste après sans c68, cap/apres-liste.png).
- avant.json et apres.json (titres réels, chemins de documents) gardés hors dépôt, dans le scratchpad de la session.

## Fixtures produites (tests/fixtures/c68/)
Format : { phrase, source, requete, reponse, carte } ; requête et réponse brutes de l'appel callable (corps JSON, sans en-têtes) ; `carte` = texte de la feuille affichée.
Anonymisation : ses 14 carnets réels → « Carnet réel n », leurs critères, notes, « derniers » et articles → « Note réelle n.k » etc. (valeurs d'articles vidées) ; les 90 identifiants (carnets, notes) → alias stables `CARNET-REEL-n`, `CARNET-ZZ-n`, `NOTE-n`, appliqués aussi aux réponses. Contrôle : aucun identifiant d'origine, aucun email, aucun prénom ; seul texte commun restant : « Achat prévu fin du mois. », présent dans un carnet ZZ TEST (donnée de test).
- rangement-1.json — vapeur : réponse = note dans un carnet existant (`CARNET-ZZ-…` « trop de vapeur au brassage », `doublonDe`, étiquette constat).
- rangement-2.json — fusible : `carnetNeuf` « Fusible plaque saute avec la pompe », problème, Brassage › Électricité, état noté.
- rangement-3.json — sol époxy (mémo) : réponse = note dans `CARNET-REEL-3` (un carnet PLANNING réel).
- rangement-4.json — étiquettes : `carnetNeuf` « Étiquettes qui se décollent au frigo », problème, Conditionnement › Étiquettes, état cherche, constat.
- rangement-5.json — fermenteur : `carnetNeuf` « Deuxième fermenteur 30 L », genre a-acheter, achat, Fermentation, quantité 1, caractéristique volume, tâche proposée (mois).
- rangement-6.json — bière de Noël : sorte idee, `carnetNeuf` et `titre` « Bière de Noël à la cannelle », Brassage › Recettes.

## Écarts réponse réelle → carte (constatés, à verser par le pilote ; non jugés ici)
1. Vapeur (cap/carte-1.png) : l'IA range dans le carnet ZZ existant ; la carte montre « nouveau carnet · idée », la phrase en titre, « Local ».
2. Sol époxy (cap/carte-3.png) : l'IA vise un carnet PLANNING réel ; la carte montre « nouveau carnet · idée », phrase en titre, « Local » (la cible a été écartée, l'IA a choisi un carnet de planning pour un mémo).
3. Fermenteur (cap/carte-5.png) : `carnetNeuf` « Deuxième fermenteur 30 L » ignoré, la phrase reste le titre (chemin, genre achat et tâche repris).
4. Bière de Noël (cap/carte-6.png) : `carnetNeuf`/`titre` « Bière de Noël à la cannelle » ignorés, la phrase reste le titre (chemin repris, genre idée).
Fusible et étiquettes (cap/carte-2.png, carte-4.png) : titre court, chemin et genre problème repris tels que l'IA les rend.

Captures ouvertes (390, demi-échelle) : avant-liste, carte-1 à carte-6, apres-liste.

CONNAISSANCE : la réponse réelle de `rangerCarnet` porte `lignes[]` avec soit `carnetId` (+ `doublonDe`), soit `carnetNeuf` (+ `raisonCarnet`, `chemin`, `genreCarnet`, `etatPropose`, parfois `titre`, `tachePropose`, `caracteristique`) ; l'app n'applique pas toujours `carnetId` ni `carnetNeuf` (4 sur 6 ici).

LEÇON PROPOSÉE : aucune
