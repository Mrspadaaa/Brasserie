# Voie cv — Tableau de couverture de l'onglet Brassins

- Mission : 2026-11-14-brassins · Agent : auteur · Modèle : sonnet · Niveau : jugement · Plafond : 40 tours · Dépend de : — · Décideur : pilote

## Objectif
Le brasseur (14.11) : « J'ai l'impression que tout les écrans sous les boutons de ces Tabs ne sont pas traitées ??? ». Dresser le tableau
de couverture de l'onglet du bas « Brassins » (`src/components/BottomNav.tsx:34`, id `production`) : CHAQUE vue atteignable sous lui,
et pour chacune, la page de mini maquettes qui la traite (ou « aucune »).

## Entrées
- Code : `src/components/tabs/ProductionTab.tsx` (sous-onglets Brassins, Recettes, Atelier R&D, Volumes), `src/ui/production/*.tsx`,
  `src/ui/BatchDetailSheet.tsx` (rubriques Mesures, Carnet, Dossier ; états planifié, fermentation, garde, conditionné, clos ; saisies),
  `src/components/CreativeLabTab.tsx` (Matériel, Bières, Tarifs, Contacts, À faire), le module du sous-onglet Volumes (scaler),
  `src/App.tsx` (bouton d'action selon le sous-onglet, « Nouveau brassin » l. 541 ; filtre de période l. 171).
- Banc existant : `work/missions/2026-11-14-brassins/voies/a1-banc/TROUS.md` et les noms de `captures/`.
- Maquettes existantes, où chercher : `work/refonte-frontend/v4/choix/ecrans.json` (choix du brasseur), les tableaux « ## Pages » de
  `work/missions/*/MISSION.md` (adresses claude.ai/artifact/…), `work/refonte-frontend/registre.md`, `work/refonte-frontend/INVENTAIRE-ECRANS.md`,
  les pages `work/missions/2026-11-14-brassins/page/index.html` et `page2/index.html` (fiche en fermentation et liste des brassins seulement).
  Chercher aussi par mots (`grep -ril` sur `work/` : recette, carnet de recettes, atelier, matériel, tarif, volumes, scaler, adapter les volumes).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/cv/` (`COUVERTURE.md`, `RESULTAT.md`, `tests.txt`). Rien dans `src/`. Ni commit ni stash.

## Consignes
- `COUVERTURE.md` : ligne 1 `OK — <n> vues, <n> traitées, <n> partielles, <n> sans maquette` ; puis un tableau
  `| Vue | Sous-onglet | Code (fichier:ligne) | Atteinte par | Maquette (page ou adresse, ou « aucune ») | État |` où État vaut
  `traitée`, `partielle` (dire ce qui manque) ou `sans`. Une vue = un écran ou une feuille distincte : liste, liste vide, outils de liste
  (recherche, filtres, tri), menu d'une carte, analyses, chaque état de la fiche, chaque rubrique, chaque saisie (relevé, conditionnement,
  clôture, retour arrière), chaque ajout (nouveau brassin, nouvelle recette, nouvelle idée…). Pas une ligne par bouton.
- Puis `## Sans maquette, groupées` : les vues `sans` et `partielle` regroupées en écrans à maquetter (un groupe = ce qu'un brasseur voit
  ensemble), chacun avec ses vues et ce que la capture actuelle montre en une ligne (nom de capture a1 s'il y en a). Marquer `(autre session)`
  un groupe qu'une mission voisine porte déjà (assistant de recette, jour de brassage) en citant sa mission.
- Rien d'inventé : chaque adresse de page vient d'un fichier cité.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Lecture seule du code ; ses brassins réels jamais touchés.

## Critères
`work/missions/2026-11-14-brassins/voies/cv/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK, au même format
  que `--reporter=dot > …`.
- Voie d'écran : sans objet (lecture), captures a1 citées par nom.
Réponse finale au pilote : une ligne.
