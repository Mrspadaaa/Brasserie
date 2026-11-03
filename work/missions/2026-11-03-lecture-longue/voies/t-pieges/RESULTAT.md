OK — générateur et vérificateur de pièces piégées : 11 fixes (11/11) et 200 au hasard (200/200), vérité + masque exact

Fichiers écrits (OWNS) : `work/missions/2026-11-03-lecture-longue/pieges/generer.mjs`, `verifier.mjs`, `README.md` ; et ce RESULTAT.md.
Sorties de test : `C:/Users/mrspa/AppData/Local/Temp/claude/C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/pieges` (11 pièces), `.../scratchpad/hasard` (200 pièces, 113 Mo, hasard.json), hors dépôt.

Critères (rejoués de bout en bout sur la version finale) :
- `generer.mjs <dossier>` puis `verifier.mjs <dossier>` -> `PIÈGES OK 11/11` (5 s).
- `generer.mjs <dossier> --hasard 200 --graine 1` puis `verifier.mjs` -> `PIÈGES OK 200/200` (≈ 3 min 30 à générer).
- Reproductibilité : graine 1, 5 pièces regénérées, vérités et masques identiques octet pour octet à celles des 200.
- Le vérificateur échoue bien : masque d'une autre taille, vérité modifiée (ligne -> article faux, total faussé) -> `PIÈGES ÉCHEC`, code 1.
- `git status --short` : seulement `?? work/missions/2026-11-03-lecture-longue/pieges/` (les 3 fichiers OWNS) ; RESULTAT.md dans le dossier de la voie.
- Images ouvertes en vrai (crops pleine taille) : tache-jonctions, tout, pli (crease + coin replié), flou-fort, tache-totale, facture-zebre, penche, et h0007, h0100, h0150 du hasard. Elles ressemblent à des photos (grain, marbrures, dégradé, ombre de téléphone, table, flou).

Essais : 3 corrections de bug (canvas libéré trop tôt, remise absente quand la suite l'écarte, taches trop dessinées/stries du lavis), puis 2 retouches de distribution (densité/nombre d'articles). Aucun critère n'a dépassé 3 essais.

Choix de conception (à connaître) :
- Masque : correspondance inverse calculée à la main (rotation, perspective, recadrage) en plus proche voisin, donc couleurs exactes ; la photo utilise la même fonction (bilinéaire). Une ligne sous une tache garde sa couleur de masque.
- Les pièces 1 à 10 portent le même ticket (135 articles) : pour isoler l'effet d'un défaut, comparer à `papier-gris`. Les pièces hasard ont chacune leur contenu.
- Convention `lignes[i]` = rang de l'article en base 0 (écrit dans `convention` de chaque vérité).
- Mode hasard : pas de pièce fixe dans le dossier (pour que « 200/200 » compte exactement 200). Les factures (≥ 900 px) ont un tableau à colonnes ; une sur deux est un scan sans bruit. Un tirage sur 3 de tache est sur une jonction probable (article n° multiple de 20 à 30), un sur 3 pile sur une ligne.
- Taille bornée à ≈ 5 M px par pièce hasard (nombre d'articles ou densité réduits, au moins 40 articles) ; observé 17 pièces à 40–49 articles, 5 à 200+.

Doutes et limites :
- Photos synthétiques : pas de vraie courbure du papier, de reflets ni de flou de mise au point variable ; la perspective est un trapèze horizontal.
- Largeurs de ticket jusqu'à 1 300 px : le montant est loin de la désignation (volontaire, c'est un piège, mais peu réaliste).
- La police est Courier New (tickets) et Arial (factures) : le poste doit les avoir (présentes sous Windows).
- Les tests de contenu du vérificateur sont structurels ; il ne juge pas la lisibilité du texte sous une tache.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
