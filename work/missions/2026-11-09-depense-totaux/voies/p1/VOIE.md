# Voie p1 — totaux en rouge, renvois utiles, défauts de la capture pharmacie, un seul bouton « Documents » (mission 2026-11-09-depense-totaux)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote
- Lis :
  - `CLAUDE.md`, `cerveau/LECONS.md` (L01, L03, L11, L12, L13, L17) ;
  - `.claude/rules/affinee-frontend.md`, `DESIGN.md` (§ « Les états et les alertes restent distincts » : erreur = rouge `alert`, attention = ambre) ;
  - la fin de `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (09.11, « Plusieurs Petit soucis… ») ; `work/refonte-frontend/decisions.md` D382 ;
    `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` DP-1 et DP-2 ;
  - ses captures, toutes à ouvrir : `../../captures-brasseur/5-pharmacie-2pages.jpg`, `6-bauhaus-photo.jpg`, `7-entree.jpg` ;
  - `../s1/RESULTAT.md` (état de l'écran, banc `../s1/banc/`, script `../s1/capturer-s1.mjs`).

## Objectif
Le code est déjà lu par le pilote ; les points d'entrée sont donnés. Un test qui échoue sur HEAD avant chaque correction (L13).

1. **Rouge pour les totaux faux.** Dans `src/ui/finance/controlesCroisesVue.tsx`, une rangée `verdict: 'ecart'` dont la clé est
   `articles`, `somme` ou `paye` s'affiche en rouge d'erreur (jetons `alert` : bordure, « ! », écart, geste), plus l'ambre. L'en-tête
   « À vérifier » passe en rouge dès qu'une de ces rangées est en écart. Les autres écarts (désaccord des lectures, Qté × prix, contrôles
   de la pièce) restent en ambre. Les deux thèmes, contraste lisible (DESIGN.md, `text-alert`).
2. **Renvois utiles** (`surRenvoi` dans `src/ui/finance/ExpenseSheet.tsx`, ~l. 1389 ; gestes dans `src/ui/finance/controlesCroises.ts`) :
   - `manquante` ne met plus le focus dans la recherche (clavier, « très étrange ») : le geste devient « Ajouter la ligne manquante » et
     ajoute la ligne (comme `ajouterManquante`, ~l. 1557), ouverte, nom à saisir ; son montant est prérempli avec le manque quand
     exactement un article manque (écart d'articles = −1), sinon vide.
   - `montants` (compte d'articles concordant, somme différente : son ticket piège BAUHAUS, 29 lignes lues = 277,60 contre 352,05
     imprimé et payé) n'ouvre plus la plus grosse ligne : si le contrôle `prix-plausible` désigne une ligne → « Ouvrir la ligne suspecte »
     (cette ligne) ; sinon → « Comparer à la photo » (renvoi `photo`, le justificatif ouvert). Le texte du geste dit ce qui arrive.
   - Le texte de chaque geste et l'action jouée concordent (test : pour chaque renvoi, le libellé et l'effet).
3. **Défauts de sa capture pharmacie** (2 pages Sun Store, 163,85) :
   - la rangée « Articles lus » et sa valeur longue (« 5 · 2 rabais · annoncé par la lecture ») se chevauchent à 390 : jamais de
     chevauchement ; la valeur passe sous le libellé ou se raccourcit (« 5 · 2 rabais », « annoncé » en note), à toute largeur ;
   - l'en-tête « À vérifier · Lectures · 2 pages » répète un libellé de rangée : il dit le problème (« 1 désaccord de lecture ») ;
   - relève toi-même les autres défauts de cette capture (pastille « ! 7 lignes », barre du bas qui coupe « prix unitaire … » et
     masque la liste, « Autres 6 · 4 pièces ») : corrige ceux qui sont des défauts réels et sûrs ; liste les autres dans RESULTAT.md
     avec ta lecture, sans les toucher.
4. **Un seul bouton « Documents »** (D382) : `EntreeFendue` (`src/ui/depense/Pages.tsx`) et ses usages (`ExpenseSheet.tsx` l. 1509 et
   1521) deviennent un seul bouton noir « Documents » (picto `Files`), qui ouvre un seul sélecteur `accept="application/pdf,image/*"
   multiple`, sans `capture`. Logique : un fichier (PDF ou image) → le chemin d'aujourd'hui (`attach`, lecture tout de suite) ; plusieurs
   images → les pages (`ajouterPages`, LO-7) ; un PDF parmi plusieurs fichiers → refusé et dit (LO-6), rien lu. Même règle au dépôt
   (glisser-déposer) et pour « Changer ». Variante discrète du formulaire : un seul bouton « Joindre des documents ».
   `MESSAGE_DEPOT` et tout texte qui nomme « Un document » ou « Plusieurs » sont mis à jour. « Photographier le ticket » et « Saisir
   sans justificatif » restent. Les tests qui supposaient les deux boutons sont adaptés, sans perdre ce qu'ils gardaient (LO-6, LO-7).

## Contrôles
- `npx tsc --noEmit -p .`
- `npx vitest run tests/unit/depense tests/unit/finance tests/integration/depense* tests/integration/finance --reporter=dot > work/missions/2026-11-09-depense-totaux/voies/p1/tests.txt`
  Recopie la ligne « Tests » dans RESULTAT.md. Zéro rouge dans la zone.
- `npm run build` vert.
- Banc : ajoute au banc de s1 (copie dans `voies/p1/banc/`) les cas `bauhaus-piege` (29 lignes = 277,60, total et payé 352,05, comptage
  non confirmé) et `bauhaus-piege-confirme` (comptage confirmé), et `pharmacie-2pages` (deux pages Sun Store, 163,85, un désaccord).
  Captures Chrome réel (puppeteer-core, serveur Vite `npx vite --port 5199 --strictPort` lancé en arrière-plan puis arrêté) : 390 tactile
  et 1280, clair et cave : bloc des contrôles au repos ; après le toucher de chaque pastille rouge ; l'entrée « Documents ». Mesure
  `document.activeElement` après chaque toucher (aucun champ sauf le nom de la ligne ajoutée). Dans `voies/p1/captures/`, toutes ouvertes.

## Possède
- `src/ui/finance/**`, `src/ui/depense/**`, `src/domain/finance/**` ;
- `tests/unit/depense/**`, `tests/unit/finance/**`, `tests/integration/depense*`, `tests/integration/finance/**` ;
- `work/missions/2026-11-09-depense-totaux/voies/p1/**`.

Rien dans `functions/`. Ni commit ni stash. Fichiers de travail : `voies/p1/` ou `os.tmpdir()`.

## Exigences transversales et acquis
- La maquette choisie de la Dépense reste la base ; seuls changent ce que D382 et DP-2 disent.
- Inconnu ≠ 0. Peu de texte au premier plan. Jamais `type="number"`.
- Aucune donnée réelle dans Git (le banc est anonymisé : « Brico Fictif SA », « Peinture fictive »).
- Une ligne mal classée garde sa bande (5 tests D306) ; « pièce · g · Kg · L · sachet » ; l'unité met 1 sans clavier (s1).

## Rendre (exigé par `.claude/hooks/garde-jetons.mjs`, L18)
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments : une limite de tours ne perd rien.
- La ligne « Tests » écrite dans un fichier (`--reporter=dot > …/p1/tests.txt`).
- Les captures 390 tactile et 1280, clair et cave, toutes ouvertes.

Réponse finale au pilote : une ligne.
