# Voie d99-apport-c-defaut : activer par défaut l'option c (débordement compté seulement si marqué) au dry hop

Agent : auteur (Sonnet). La voie change le moteur par défaut. Elle s'arrête au code, aux tests, au build et à la mesure.

## La décision du pilote (D99, 26.10)
La voie g2d (`voies/g2d-apport-minoritaire/RESULTAT.md` et `rapport.md`, commit 34eae4a7) a mesuré l'option **c** : au dry hop, le
débordement de style ne compte dans le rang que pour une famille **marquée**, c'est-à-dire citée par au moins la moitié des fiches
(D90).

Mesure sur la 21C, « plus d'agrumes », dry hop actif, k3 :

| Houblon | Rang avant | Rang avec c |
|---|---|---|
| Citra | 54 | 2 |
| Mosaic | 134 | 20 |
| Hallertau Blanc | 138 | 26 |
| Nelson Sauvin | 107 | 31 |
| Galaxy | 2 | 3 |

Aucune barre ne change sur les 44 à 66 mesurées, et le temps de calcul ne bouge pas (0 ms). Cela répond à D167 et au principe du
brasseur : ne pas exclure ni trier trop tôt (D175).

## À faire
1. Activer c par défaut, aux moments où g2d le recommande (dry hop actif et après). Pour les autres moments, lis la recommandation de
   g2d et dis ce que tu fais.
2. Mettre à jour les empreintes de `tests/unit/hopIndexV4/moteurInchange.test.ts` et de `prototypes/houblons-v4/tests/client-async.test.ts`
   et `worker-calculs.test.ts`. Chaque test reçoit une ligne de raison « D99 ».
3. Ajouter un test : avec le défaut, sur la 21C au dry hop, « plus d'agrumes », Citra, Mosaic et Nelson Sauvin sont dans le premier tiers
   de la liste. C'est le contrôle de D167. Il doit échouer sur HEAD.
4. Vérifier que les barres restent inchangées voie par voie, à chaque moment et pas seulement au dry hop (leçon g2d).
5. Lancer `npx vitest run tests/unit/hopIndexV4 prototypes/houblons-v4/tests`, puis `npm run build`.
   - Deux tests de `sourcesLignes.test.tsx` peuvent être rouges à cause de la voie s2 en cours. Dis-le, mais ne les touche pas.
   - La reconstruction de la maquette et le rejeu des états seront faits par une voie mécanique.

## Possède
- `src/domain/hopIndex/v4/voies.ts`, `minoritaire.ts` et `palier.ts`.
- Les trois tests d'empreinte nommés à l'étape 2.
- Un test neuf.
- `work/missions/2026-10-25-integration-houblons/voies/d99-apport-c-defaut/`.

Ne touche pas `src/ui/` : les voies s2 et p6 sont en cours. N'écris aucun code par heredoc ni par `node -e`. Pas de `git stash`. Rends une
ligne.
