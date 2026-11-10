# Étape 2 des voies d1, d3, f1 : coder après la revue

Revue faite : `REVUE-A.md` (métier) et `REVUE-B.md` (code), verdict « OK avec réserves » pour les trois plans.

1. Traite chaque constat de ta voie (D1-*, D3-*, F1-*) des deux revues : une ligne dans PLAN.md, retenu ou écarté avec sa raison.
2. Décisions du pilote :
   - **Usure comptée une seule fois** (bloquant pour d3, utile à d1). Le coût du litre prend l'usure **linéaire** (P2). Un projet futur
     porte une usure estimée (linéaire, durée saisie, défaut 100 ÷ taux linéaire AFC de la catégorie). À l'achat, l'usure linéaire de
     l'actif du registre la remplace. Jamais les deux ; jamais l'AFC dégressif pour le litre (l'AFC reste dans l'Annuel). Un test le prouve.
   - d3 : tes trois écarts au PLAN-METIER sont acceptés ; test 10 corrigé (seuil 150 000 → mars). Le test non chargé (firebase-admin)
     sera rejoué sur le poste principal : note-le.
   - d1 : vérifie à la source le barème LIB (RS 641.411 art. 14 : 16,88 / 25,32 / 33,76 CHF/hl, bornes °P) et la réduction OIBi ;
     écris la source dans PLAN.md.
   - f1 : F1-1 `toCents` en arrondi entier, testé sur le balayage des x,xx5 ; F1-2 le gabarit « 1000 Ville » du seed et tout champ
     vide refusent le QR (P7). QR en PNG dans jsPDF (P4), aucune dépendance neuve. IBAN de test public de la norme seulement, marqué test.
3. Code ; tests rouges d'abord puis verts (`--reporter=dot > voies/<id>/tests.txt`) ; `npx tsc --noEmit` vert. Reste dans ton Possède.
   RESULTAT.md au fil. Aucun commit, pas de `git stash`. Rends une ligne.
