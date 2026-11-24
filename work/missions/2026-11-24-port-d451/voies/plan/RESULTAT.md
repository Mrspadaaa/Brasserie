OK — PLAN.md, 7 voies de port à périmètres disjoints, VOIE.md et DOSSIER.md écrits

# RESULTAT plan

## Fichiers écrits (tous dans work/missions/2026-11-24-port-d451/)
- PLAN.md : état de l'art, modèle de données champ par champ, IA lue et écrite, voies et ordre, ce qui disparaît (vérifié
  dans le code), risques, une décision.
- COMMUN.md : exigences transversales recopiées (L05) et tenue commune.
- voies/{domaine,ia,greffe-p2,probleme,afaire,liste,onglets}/VOIE.md et DOSSIER.md (forme de c64-fix/VOIE.md).
Aucun fichier de src/ ni functions/ modifié.

## Critères du DOSSIER
1. État de l'art : PLAN § État de l'art (problème type, examiné, décision ; une ligne par problème : machine à états à
   graphe complet, chemin matérialisé, fil d'activité en projection, appliquer+Annuler / proposer sans écrire, changement
   parallèle avec lecteur tolérant, dates en lundi + précision). Aucune bibliothèque neuve (XState refusé).
2. Modèle : PLAN § Modèle ; tout facultatif, dérivé à la lecture, `VERSION_CARNET` reste 1 ; MESSAGE-RESTE-DANS-SON-CARNET
   écrit dans § Ce que l'IA lit et écrit.
3. Voies : domaine → (greffe-p2 ∥ ia) → (probleme ∥ afaire) → liste (branchement) → en ligne → onglets.
4. Ce qui disparaît : 8 points vérifiés (fichier, lignes). « Archivé le … » introuvable tel quel dans src/ (le plus proche :
   « Plan archivé dans À venir », EtatIA.tsx l. 52, et le groupe « Faits ») ; les voies le comparent aux captures actuelles.
   Hors Carnet : n° 1 seul (StocksTab), voie onglets, dernière, drapeau révocable.
5. Risques : PLAN § Risques (9 points).

Vérifié : les 31 captures citées dans les DOSSIER existent.

## Doutes et limites
- Constat clé : `lireDonneesCarnet` (modele.ts l. 392-400) jette les clés inconnues. Sans passe-plat en ligne d'abord, un
  appareil resté sur l'ancienne version effacerait les champs neufs d'un carnet qu'il réécrit.
- Les voies tournent dans la même copie : en parallèle, un tsc rouge peut venir de la voie voisine. Paires seulement.
- `systeme.mjs mission` attend un MISSION.md ; il n'existe pas ici (au pilote). Le bloc « ## État de l'art » de PLAN.md est
  au format attendu (Problème type, Examiné, Décision).
- Tâches : un seul plan À venir par carnet (clé `PLAN-CARNET-<id>`, existant) ; les autres achats restent des tâches.
- Tâches anciennes : les notes « à faire » existantes ne deviennent pas des tâches (rien n'est inondé) ; seules les notes du
  Planning deviennent des tâches, et seulement à la lecture.
- La veille « qui sonne » attend la relève réelle (accord) : en ligne, « demandée · pas encore relevée ».

DÉCISION À PRENDRE : la photo seule sans texte (écran Imprévus, « On dirait un tuyau qui goutte »). (A) l'IA lit la photo
(lève l'accord du 17.11, coût image) ; (B) proposer le problème ouvert touché en dernier, sans lire la photo ; (C) aucune
proposition. Recommandation : B.

CONNAISSANCE : le carnet n'a pas de Dexie ; c'est Firestore avec un cache persistant, document par document
(src/services/carnetsStore.ts), et le lecteur tolérant de modele.ts jette les clés inconnues : une évolution de schéma
doit passer par le passe-plat en ligne d'abord.
LEÇON PROPOSÉE : aucune.
