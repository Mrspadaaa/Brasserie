# Dossier ia (voie 2)

Sources : PLAN.md § Ce que l'IA lit et écrit ; maquettes3/CADRAGE.md § « Ce que l'IA fait seule » et « Ce qui reste au
brasseur » ; maquettes3/src/v01.mjs : écrans `saisie` (carte « rangé pour toi » : titre, catégorie › sous-catégorie,
nouveau problème, état, tâche proposée), `vapeur`, `fuite`, `co2`, `malt` (jetons sous les bulles, « tâche proposée »),
`epreuve` (« À ranger », photo seule) ; DEFAUTS-RECURRENTS § MESSAGE-RESTE-DANS-SON-CARNET (C64-8).

Code de départ :
- functions/src/carnetIA.ts : `RANGER_CARNET_SCHEMA` (l. 109, `propertyOrdering` : garder rangement et montants avant les
  champs libres), consigne `RANGER_CARNET.system`, `assainirRangerCarnet` (l. 217), `contexteRangerCarnet` (l. 283),
  `LIGNES_MAX` 12, `CARNETS_MAX` 30, `maxOutputTokens` 4000 (L-3 : ne pas l'augmenter sans mesure).
- src/domain/carnets/ia.ts : `contexteModele`, `lireReponse` (garde : nombres du texte seulement), `critereTireDe`.
- src/ui/carnets/envoiRegles.ts : `destinationDans`, `sansAutreSujet` (lieu de C64-8, corrigé par c64-fix : lire son diff).
- iaSimulee.ts : réponses simulées du banc et des tests.

Champs neufs par ligne : `etiquette` (énumération de PLAN), `option` (nom), `genreCarnet`, `chemin` (tableau de 1 à 2
chaînes), `etatPropose`, `tachePropose { texte, quand: 'semaine'|'mois'|'un-jour', prix }`, `citation`.
Consigne : générale (B23) ; aucun exemple de ses cas (vapeur, écoulement, fusible) dans la consigne ; des exemples neutres
inventés et marqués comme tels si besoin. Le chemin reprend un chemin existant fourni quand il convient.

Gardes à tester (Vitest, IA simulée) :
1. `citation` absente du message → retirée ; présente → gardée telle quelle.
2. Montant d'étiquette `cout`/`devis` ou prix de tâche : seulement s'il est écrit ; « ≈ » garde `estime`.
3. Chemin : > 2 niveaux tronqué ; > 30 caractères refusé ; rapproché du vocabulaire (fonction de la voie domaine).
4. Étiquette hors énumération → ignorée ; état proposé hors énumération → ignoré.
5. Depuis un carnet ouvert : toute ligne visant un autre carnet reste dans `depuis` et produit une proposition `deplacer`
   (C64-8 rejoué) ; depuis la liste : rattachement appliqué avec Annuler, citation gardée.
6. `retenir`, `dater`, `resoudre`, `veiller`, `tache` : rendus en propositions, aucune écriture d'état.
7. Repli local sans IA : `cout`/`devis` sur un montant écrit, `pas-trouve`, `contact` ; rien d'autre ; message gardé.
8. Cas neufs (B23) : « fête de la brasserie en juin, il faut une tireuse » ; « assurance RC à renouveler » ; « truc à voir » ;
   un message sans rapport avec aucun carnet → À ranger ou problème neuf, jamais rattaché à tort.
9. Contexte compact : borné (30 carnets, 3 messages par carnet, 160 caractères) ; aucune photo envoyée.

Déploiement des functions : geste du pilote avec accord. Compatibilité à tester : client neuf + réponse ancienne (sans
champs neufs) → repli local, aucune erreur.
