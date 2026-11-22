# Voie d3-drive-fond — plan : l'envoi au Drive en arrière-plan, et l'échec qui ramène à la facture

Agent : auteur (Sonnet). Plafond : 50 tours. Pilote : Opus. Date : 01.11. Décision : D235. **Plan seulement : aucun code.**

## Ses mots (01.11, mot pour mot)
« Finalement, pour la logistique d'envoi sur le drive, c'est invisible, c'est à la fin en arrière plan. Et si ça fail. Grosse notification,
renvoie sur la facture pour upload le justificatif ou/et réparé le lien drive »

## Ce qu'on sait (ne pas le refaire)
- `diagnostic/d2/DIAGNOSTIC.md` (DR1 à DR5, LE5) et la voie s2-enregistrement (`voies/s2-enregistrement/`) : comment le justificatif part
  aujourd'hui (`src/services/driveFileStore.ts`, `src/services/financeDocuments.ts`, `src/services/purchaseEntry.ts`), le reçu, l'état
  Drive au pied (« Drive prêt »), 6391816f (l'accès Drive n'est plus lu au montage sans justificatif).
- Le hors ligne et le brouillon sont des acquis (Dexie) : rien ne doit s'y perdre.

## À écrire : `voies/d3-drive-fond/PLAN.md`
1. **Aujourd'hui**, lu dans le code (chemins et lignes) : quand l'envoi part, s'il retient l'écran, ce qui se passe s'il échoue
   (hors ligne, jeton expiré, Drive déconnecté, quota, fichier trop lourd), où l'échec se voit, s'il est repris.
2. **Le parcours voulu** : « Confirmer » enregistre la dépense et ferme l'écran tout de suite ; l'envoi part en arrière-plan (file
   persistante, reprise au retour du réseau, nombre d'essais) ; réussite : la pièce porte son lien, rien à l'écran ; échec : un état
   durable sur la dépense (« justificatif à renvoyer ») et une notification visible partout dans l'app, qui ne part pas seule, avec
   « Renvoyer le justificatif » (rouvre la dépense sur le justificatif, fichier gardé localement) et « Reconnecter Drive ». La forme de la
   notification est un axe des maquettes p3 : le plan donne seulement le point d'accroche (quel composant, quel état global).
3. **Les cas** : fermeture de l'app pendant l'envoi ; deux dépenses en file ; fichier gardé où, combien de temps, effacé quand ; une
   dépense supprimée avant l'envoi ; le même justificatif envoyé deux fois (aucun doublon dans le Drive).
4. **Les tests** qui échoueront sur le code d'aujourd'hui (L13) : unitaires (file, reprise, échec typé) et un contrôle Chrome sur fixtures
   (Drive simulé en échec : la notification apparaît, le renvoi rouvre la dépense).
5. **Les fichiers touchés et le risque** (schéma Firestore ? règles ? fonctions ?) : tout ce qui demanderait un accord (déploiement de
   fonctions ou de règles, données réelles) est listé à part.

## Possède
`work/missions/2026-10-31-ecran-depense/voies/d3-drive-fond/**` seulement. Lecture du code permise partout. Aucun appel Drive ni Gemini,
aucun serveur, aucun commit. Ne touche jamais `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `functions/.env`.

## Retour
Une ligne : `D3 OK — <résumé du plan>` ou `D3 ECHEC — <raison>`. `LEÇON PROPOSÉE : …` au besoin.
