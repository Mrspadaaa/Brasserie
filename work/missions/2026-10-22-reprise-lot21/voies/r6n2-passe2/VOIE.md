# Voie r6n2-passe2 — r6n2 corrigée des défauts relevés par le critique

- Mission : 2026-10-22-reprise-lot21
- Agent : concepteur (l'agent de r6n2-reprise-toucher, relancé par SendMessage)
- Modèle : opus
- Niveau : conception
- Étape : passe 2
- Plafond : 60 tours ; 3 essais par critère
- Dépend de : r6nc-critique
- Décideur en cas de doute : brasseur (il choisit entre r6n1 et r6n2) ; pilote pour le contrat

## Lire d'abord
Dans `work/refonte-frontend/v4/SPEC-BRASSEUR.md`, le § 0 « Ce qui vaut aujourd'hui », puis seulement la section de ton
sujet. Au lieu de DEFAUTS-RECURRENTS.md en entier : `work/refonte-frontend/v4/DEFAUTS-COURT.md`.

## Objectif
Corriger r6n2 des défauts vérifiables relevés par le critique (`work/missions/2026-10-22-reprise-lot21/voies/r6nc-critique/RESULTAT.md`), sans perdre ce
qui tient (les 37 éléments de l'inventaire, un seul facteur libre, les acquis, 80 mots au plus). Régénère la page avec
la planche à jour : le picto « épicé » est désormais celui qu'il a choisi, cannelle et clou croisés (`p-spice`).

## Les défauts
1. La quatrième colonne (« + » Nelson Sauvin) coupe le texte : « Casca », « Galax », « Tropicau » ; la plage
   « 9,5–14,9 % » d'Idaho 7 déborde sur l'α de Cascade. À quatre colonnes : noms sur deux lignes, α en « 9,5–15 »,
   libellés de famille en picto seul, ou défilement horizontal des colonnes.
2. La feuille Souche n'apprend rien (« Pomona change ≈ 0 » sur dix familles, vrai après fermentation) : l'aperçu au dry
   hop actif (agrumes 13,9 → 26,9), ou la phrase « après fermentation, Pomona ne change rien ; en dry hop actif,
   agrumes ~+0,4 ». Calculer l'écart avant de dessiner (M07).
3. La feuille Frise, « jour après jour », est plate : dire « le moteur ne distingue pas 1 à 7 j à cette dose », ou montrer
   la seule chose qui bouge.
4. Signalé sans règle : sur « par tropicaux », le cadre reste sur Idaho 7 alors que la réponse nomme Galaxy.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n2/**` et `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n2-*.png`
- `work/missions/2026-10-22-reprise-lot21/voies/r6n2-passe2/RESULTAT.md`
Fichiers de travail dans ton dossier ou dans `os.tmpdir()` ; copie ton générateur avant une retouche scriptée.

## Critères
Les mêmes que ta voie d'origine, dans `GATES.md` du même dossier. Ne pas le modifier.

## Rendre
`RESULTAT.md` : ligne 1, par défaut ce qui a changé (avant → après), les sorties décisives, les captures ouvertes par
leur nom, ta prédiction de sa réaction, `CONNAISSANCE : …` et `LEÇON PROPOSÉE : …`. Ajoute à ta NOTE une section
`## Passe 2`. Réponse finale : une ligne.
