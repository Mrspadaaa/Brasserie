# Voie r6n1-passe2 — r6n1 corrigée des défauts relevés par le critique

- Mission : 2026-10-22-reprise-lot21
- Agent : concepteur (l'agent de r6n1-reprise-tout, relancé par SendMessage)
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
Corriger r6n1 des défauts vérifiables relevés par le critique (`work/missions/2026-10-22-reprise-lot21/voies/r6nc-critique/RESULTAT.md`), sans perdre ce
qui tient (les 37 éléments de l'inventaire, un seul facteur libre, les acquis, 80 mots au plus). Régénère la page avec
la planche à jour : le picto « épicé » est désormais celui qu'il a choisi, cannelle et clou croisés (`p-spice`).

## Les défauts
1. « IBU ? ▨ 10′ ≈37 » au premier écran : un moment 10′ qui sort de nulle part (« On a un 10' qui sort de null part »,
   18.10 ; la table des IBU par moment de g1 : « Inutile »). Mets la jauge de **sa stout** comme dans le Défi de r6n2
   (« Nugget 60′ · 46 g | + ? à cru ») ; l'IBU à 10′ seulement sous Preuve, nommé « si tu le passais à 10′ ».
2. Le radar : neuf chevrons roses au bout des axes ont la forme des flèches de sa demande (h4). Le « // » de r6n2 pour
   « coupé » ; la flèche réservée à la demande, verte comme h4.
3. « Tire 20 » pose vingt points sur la barre d'Idaho 7 : points sous la barre et le compte en mot (« 4 sur 20 »), ou le
   tirage dans Preuve.
4. Le pont Levure est muet (deux barres jaunes) : « US-05 | Pomona » écrit, ou un chiffre (« Pomona ~+0,4 agrumes »,
   au dry hop actif).
5. Des signes neufs sans mot au premier écran (fiole, « = », traits gris, chariot) : un mot court, ou les retirer du
   premier plan. La colonne « Ta stout » de r6a a disparu : la rendre si la place le permet (« ça suit plus r6a »).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n1/**` et `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n1-*.png`
- `work/missions/2026-10-22-reprise-lot21/voies/r6n1-passe2/RESULTAT.md`
Fichiers de travail dans ton dossier ou dans `os.tmpdir()` ; copie ton générateur avant une retouche scriptée.

## Critères
Les mêmes que ta voie d'origine, dans `GATES.md` du même dossier. Ne pas le modifier.

## Rendre
`RESULTAT.md` : ligne 1, par défaut ce qui a changé (avant → après), les sorties décisives, les captures ouvertes par
leur nom, ta prédiction de sa réaction, `CONNAISSANCE : …` et `LEÇON PROPOSÉE : …`. Ajoute à ta NOTE une section
`## Passe 2`. Réponse finale : une ligne.
