# Dossier note — que doit faire l'IA d'une note du brasseur dans un carnet ?

Ses mots (24.11) : « J'ai ajouté une notre, l'ia devrait en faire qqch » puis « Et aussi elle a plus d'action sur ma note, catégorisé, classifie, ectt.. lance un critique, besoin et autres Persona là dessus pour voir ce que l'on peut faire de cette note ».
Capture : work/missions/2026-11-23-reprise-soir/plaintes/2026-11-24-note-ia.jpg (carnet « Houblons citra », 2 articles : CITRA® (US) MotlerHops 3,72 € et Citra 13.6 % Brau- und Rauchshop ; note « Semble difficile à obtenir sur le site français » ; elle reste à part, « note · modifiée · 24 nov. », rien ne change).
Défaut : work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md § NOTE-EXPLOITEE.
Code : rangement d'une phrase par l'IA : functions/src/carnetIA.ts (sortes idee/critere/facon/article/note ; genres a-acheter/a-faire/question/conseil/note) ; affichage : src/ui/carnets/ (LigneNote.tsx, FeuilleNote.tsx, CarnetOuvert.tsx), src/domain/carnets/.
Ses choix (règle n° 1) : work/missions/maquettes-carnet/CHOIX.md ; D435 (Q-2 C : la recherche fouille les notes), D437 (domaines posés par l'IA).

Rends au pilote, en 250 mots au plus : (1) ce que ton regard voit comme besoin réel derrière cette note ; (2) 3 à 5 actions concrètes de l'IA sur une note (rattacher à un article, devenir un fait ou un critère, une question à vérifier, une tâche, classer, catégoriser, alerter, influer sur le classement…), chacune avec un exemple sur CETTE note et le risque ; (3) ce qu'il ne faut PAS faire ; (4) ta recommandation n° 1.
