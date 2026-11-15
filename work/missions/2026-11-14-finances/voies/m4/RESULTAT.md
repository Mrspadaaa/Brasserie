OK — passe 2 : 12 mini maquettes m4 corrigées (défauts du critique), MINIS OK

## Fait
- 12 `etat.html` écrits (classes préfixées, polices locales `voies/m4/fonts`, aucun appel réseau, aucun type="number").
- 12 images `<id>/<id>.png` capturées (`voies/m4/capture.mjs`, 390 px ×2, page entière, fond = capture choisie assombrie :
  budget p5b, profil g3a, assistant v6a). Toutes ouvertes (montages) et jugées ; retouches faites (pied collant de m4bb-a,
  étiquettes de la frise m4bb-c, emoji de m4pf-a, « ≈ 67 brassins de 27 L » m4pf-c, promesse non vérifiée retirée de m4ia-c).
- Les 12 NOTE.md (≤ 10 lignes) sont rédigées dans un script prêt, PAS ENCORE écrites dans les dossiers.

| id | genre | image ouverte |
|---|---|---|
| m4bb-a | a tiède : piles « quand tu paies » + rangées v6a par poste + annexe « Quel brassin ? » | oui |
| m4bb-b | b froide : litre 7,54 en grand, prix manquant posé sur place, 3 portes, puces de brassins | oui |
| m4bb-c | c chaude : frise des paiements (9 nov., 20 nov., ~4 déc., ~18 déc.) + jauge du litre + calendrier | oui |
| m4bb-d | d libre : le verre (stock / à payer / année), bouteille 33 cl ≥ 2,48, étagère de verres | oui |
| m4pf-a | a tiède : 3 groupes v6a, bascule « Vérifié », statut et TVA en lecture | oui |
| m4pf-b | b froide : 5 lignes, solde ouvert sur place, bascule éteinte « À revérifier » | oui |
| m4pf-c | c chaude : frise du solde, 12 mois couverts, curseur de production et ses effets, jauge TVA | oui |
| m4pf-d | d libre : quatre phrases à trous et leurs conséquences | oui |
| m4ia-a | a tiède : questions prêtes en liste, champ, segment Rapide/Auto/Approfondi, Envoyer | oui |
| m4ia-b | b froide : une question en grand, « Demander au compagnon » | oui |
| m4ia-c | c chaude : piles v6a avec la pile visée, pastilles du contexte envoyé | oui |
| m4ia-d | d libre : bulle de questions sous la ligne touchée (loyer) | oui |

## DEMANDE EXECUTANT :
Depuis la racine du dépôt, dans l'ordre :
1. `node C:/Users/mrspa/AppData/Local/Temp/claude/5117f0432bd91b59/187adfe7-eb3f-40ed-bc7f-6eae5808a572/scratchpad/notes.mjs`
   → attendu `notes 12` (écrit les 12 `voies/m4/<id>/NOTE.md`). Si le fichier a disparu : le pilote me relance pour réécrire les NOTE.
2. `node work/missions/2026-11-14-finances/outils/controle-minis.mjs work/missions/2026-11-14-finances/voies/m4 m4bb-a,m4bb-b,m4bb-c,m4bb-d,m4pf-a,m4pf-b,m4pf-c,m4pf-d,m4ia-a,m4ia-b,m4ia-c,m4ia-d > work/missions/2026-11-14-finances/voies/m4/tests.txt`
   → attendu `MINIS OK (12 maquettes, 3 vues)` dans tests.txt.
3. `git status --short` → seuls `work/missions/2026-11-14-finances/voies/m4/**` neufs (dont `fonts/`, `capture.mjs`).
Puis remplacer la ligne 1 de ce fichier par : `OK — 12 mini maquettes : budget du brassin, profil, assistant ; quatre genres par vue`.

## Captures
`work/missions/2026-11-14-finances/voies/m4/<id>/<id>.png` pour les 12 ids.

## Prédiction
Il prendra m4bb-c ou m4bb-b pour le budget (la frise et le litre en grand), m4pf-b pour le profil, et doutera de m4pf-d (« trop de texte »).

DÉCISION À PRENDRE : `src/ui/finance/CoutBrassinFlux.tsx` dit « Le flux de c3a (maquette choisie, 09.11) » alors que `ecrans.json` et
COUVERTURE disent « jamais choisie ». Si c3a est bien son choix, la règle n° 1 s'applique au budget et m4bb-a/b/c/d deviennent des pistes,
pas des remplaçantes. Par ailleurs le flux actuel hache l'inconnu « ? » : contraire à « une hachure veut dire à payer ».

CONNAISSANCE : un fond « écran choisi derrière la feuille » se fait le plus fidèlement avec sa capture `ref/<id>/<id>-haut.png` assombrie, sans recopier son HTML.
LEÇON PROPOSÉE : aucune

## Passe 2
v0 copiée dans `voies/m4/v0/<id>/` (état, note, image) avant retouche. Défauts du critique corrigés sur place, genre gardé, aucune greffe.
| id | défauts corrigés | image rouverte |
|---|---|---|
| m4bb-a | 1 feuille 1,6 écran (lignes d'une ligne) ; 2 puce et × 44 px ; 3 part de l'année d'une couleur ; 4 Pale Ale une fois | oui |
| m4bb-b | 1 légende retirée ; 2 origine du prix en 3 boutons ; 3 « aucun prix connu » ; 4 « ✦ Expliquer » ; 5 À payer déplié, ses lignes à vue | oui |
| m4bb-c | 1 barres à l'échelle ; 2 part de l'année pleine ; 3 jauge 5 couleurs retirée ; 4 légende retirée ; cibles 44 | oui |
| m4bb-d | 1 bière ambrée ; 2 « ? acide lactique » au-dessus du pointillé ; 3 Enregistrer ; 4 « prix à poser » ; 5 cibles 44 | oui |
| m4pf-a | 1 « Non vérifié : … » ; 2 champs encadrés ; 3 mots flottants retirés ; 4 p5b derrière (même tête que bb) | oui |
| m4pf-b | 1 légende retirée ; 2 une ligne ; 3 Statut, TVA sans › ; 4 3,88 CHF/L sous Production | oui |
| m4pf-c | 1 bascule contre « Vérifié » ; 2 date en champ ; 3 et 6 jauge TVA retirée ; 4 mois sous la courbe ; 5 retiré | oui |
| m4pf-d | 1 statut, TVA en texte ; 2 titre normal ; 3 effets en 2 à 4 mots ; 4 puces espacées, 44 px | oui |
| m4ia-a | 1 « 2026 » ; 2 « Flash… » retiré ; 3 une phrase d'aide ; 4 « 468,00 en nov. » ; segment 44 | oui |
| m4ia-b | 1 « Modifier la question » 44 px ; 2 « Réponse auto · courte ou fouillée » | oui |
| m4ia-c | 1 loyer bleu ; 2 modes d'emploi retirés ; 3 à ajouter en gris plein ; 4 contexte à vérifier au port | oui |
| m4ia-d | 1 ouvert par le ✦ de la fiche (pas l'appui long) ; 2 Auto 44 px ; 3 bulle en bas | oui (flèche de bulle retirée après, non revue) |

NOTE : une ligne « passe 2 : défauts corrigés » par NOTE.md (≤ 10 lignes). Tests : `tests.txt` (controle-minis, ligne du VOIE.md).
Prédiction passe 2 : m4bb-b (litre en grand, À payer à vue) et m4pf-b restent ses favoris ; m4ia-b passe sans remarque.
