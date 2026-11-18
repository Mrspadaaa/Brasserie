OK — 28 captures Matériel et Articles au banc local, 390 et 1280, clair et cave.

Fichiers écrits :
- C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-materiel/banc/*.png (28 captures)
- C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-materiel/banc/INDEX.md
- C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-materiel/banc/journal-a0-vues.json, journal-a0-vide.json, journal-a0-tout.json (première passe, échecs corrigés)
- C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-materiel/voies/a0-banc/RESULTAT.md
- Hors périmètre, copie jetable : C:/Users/mrspa/AppData/Local/Temp/materiel-banc/src/data/seedData.ts (fixtures matériel, Malt Pilsner, drapeau VIDE_EQ) et scripts a0-capture.mjs, a0-recon.mjs, a0-debug.mjs dans la même copie. Rien dans src/ du dépôt, aucun commit.

Critères :
- G1 : `BANC OK 28` (seuil 24), 1 essai.
- G2 : `VUES OK`, 1 essai (les 12 vues ont leur capture 390 clair).
- G3 : `NOTE OK`, 1 essai (liste-390-cave, fiche-1280-clair, a-traiter-1280-cave, vide-390-clair présents dans INDEX.md).
- Demande complémentaire du pilote (Stocks › Articles) : ref-articles-390-clair, ref-articles-390-cave, ref-article-fiche-390-clair, ref-articles-1280-clair, une ligne chacune dans INDEX.md. Fixture « Malt Pilsner » ajoutée dans la copie seulement, car l'Articles était vide.

Essais utilisés : 3 passes de capture, corrections de sélecteur (champ de recherche Matériel = textarea ; vue fiche par recherche « pH-mètre », pH-mètre absent du premier rendu). Serveur 3427 arrêté.

Ce qui reste douteux :
- La liste Matériel ne rend que 9 lignes (390) et 10 à 11 (1280) sur 13 au premier rendu ; le pH-mètre, le Réfractomètre et le Moulin à malt n'apparaissent pas sans défilement ou recherche. Cause non vérifiée (rendu paresseux ou fenêtre de défilement).
- Les captures `fullPage` ne couvrent que la fenêtre quand le conteneur défile : la fin de la liste n'est pas dans les PNG.
- La feuille d'achat s'intitule « Acheter du matériel » (ouverte par « Enregistrer un achat ») : libellé à juger par le pilote, non jugé ici.
- Une seule vue `vide` (390 clair), comme demandé.

Tests : sans objet

CONNAISSANCE : le champ de recherche de Stocks › Matériel est un `<textarea name="entity_filter_search">` (EntityList), pas un `<input>` ; un sélecteur sur `input` ne le trouve pas.

LEÇON PROPOSÉE : avant d'écrire un sélecteur de capture, lire le type d'élément rendu dans le DOM (un `evaluate` sur `document.body.innerHTML`), et ne pas supposer `input` ; ici, deux passes perdues sur une hypothèse. Règle : un sélecteur se confirme sur le DOM rendu avant le lot.
