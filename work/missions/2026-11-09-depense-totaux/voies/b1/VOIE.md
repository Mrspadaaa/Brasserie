# Voie b1 — quatre pièces pièges au banc de lecture (mission 2026-11-09-depense-totaux)

- Agent : auteur · Modèle : sonnet · Plafond : 100 tours · Décideur : pilote
- Suis le skill `banc-lecture` (`.claude/skills/banc-lecture/SKILL.md`). Lis `cerveau/LECONS.md` (L20, L28, L29), la fin de
  `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (09.11, « le total match pas, c'est justement un piège »).

## Objectif
Les quatre photos `../../pieces/` (hors Git : données réelles, dont un nom et une adresse) entrent au banc, par l'entrée de l'app
(photo d'origine). Vérité du pilote (premier lecteur ; toi, second lecteur sur la photo en plein format, écarts signalés) :
- `sunstore-1` : 2 lignes (Paracétamol 5,40 ; Ibuprofène 9,20), total 14,60, reçu 14,60, TVA 2,6 % 0,37 ; « Total EFT CHF 163,85 » = le
  paiement TWINT commun aux deux tickets Sun Store (piège : 163,85 ≠ 14,60).
- `sunstore-2` : 3 articles (Vaxigrip 26,68 rabais −0,68 ; H21 vaccination ×2 50,00 ; Comirnaty 75,15 rabais −1,90), brut 151,83,
  rabais −2,58, total 149,25, TVA 0 % ; EFT 163,85 (piège : 14,60 + 149,25 = 163,85). Les rabais ne sont pas des articles.
- `bauhaus-tache` : 29 lignes, somme 277,60, total imprimé 352,05, payé TWINT 352,05 : écart 74,45. « Montant en EUR 370,92 » n'est pas un article.
- `bauhaus-copie` : 22 lignes (6,95 … 9,95), somme 136,65, total 352,05 : écart 215,40.
Joue la vraie lecture de l'app (aiTask, Gemini réel ; appels réels permis par le brasseur pour ces pièces : 12 appels au plus, journalisés
selon le skill), et rends par pièce :
- lignes lues contre la vérité ;
- totaux lus (imprimé, payé) ;
- ce que l'écran Dépense montrerait aux contrôles ;
- chaque défaut, avec sa cause.

## Contrôles
- Journal des appels, coût en CHF.
- Tableau pièce × (lignes vérité, lignes lues, somme lue, total lu, payé lu, drapeau attendu, drapeau vu), dans RESULTAT.md.
- Une capture de l'écran de lecture par pièce, au banc local, 390 clair, ouverte.
- Si un test unitaire est ajouté, son résultat va dans `voies/b1/tests.txt` (ligne « Tests », `--reporter=dot`). Gemini y est toujours simulé.

## Possède
- `work/missions/2026-11-09-depense-totaux/voies/b1/**` ;
- les fichiers du banc que le skill désigne : réponses rejouées anonymisées, pas les photos.
Pas de code de l'app : ce qui est à corriger, tu le proposes (la voie t1 tient `ExpenseSheet.tsx`). Ni commit ni stash ; aucune photo ni
donnée personnelle dans Git.

## Rendre (exigé par `.claude/hooks/garde-jetons.mjs`, L18)
- `RESULTAT.md` tenu au fil, mis à jour à chaque pièce : une limite de tours ne perd rien.
- La ligne « Tests » écrite dans un fichier (`--reporter=dot > …/b1/tests.txt`) si un test est écrit.
- Les captures ouvertes.
Réponse finale au pilote : une ligne.
