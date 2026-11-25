OK — jouable J1 : 8/8 bloquants corrigés (B7 en partie), gestes 22/22, 20/20 ≤ 30 mots

Contrat : CORRECTION-J1.md. Détail par bloquant : CORRECTION-J1-FAIT.md ; mesures et gestes : CAS.md.

Fichiers (tous dans work/missions/2026-11-25-carnet-passe4/jouable/) :
- p4.html (assemblé par fragments/build.mjs ; collision 0, doublons 0, un seul script, syntaxe vérifiée)
- fragments/j1.js (neuf : toast lié au carnet, pouce, lecture locale, comparaison, période, courbe, agrandissement), fragments/j1-css.txt (neuf)
- fragments/organise.js, ouvrir.js, liste.js, valider.js (tache.option, comparaison.variete, prix « ? »), consigne.js, build.mjs
- reponses/ecrire.mjs → 19 réponses + 2 relectures « après sa note » (*.apres-1.json), index.json
- cap.mjs (réponse selon les lignes, ligne « auto », délai réglable, 5 gestes neufs, vide mesuré), cap/ (66 captures), cap/resultats.json
- CAS.md, CORRECTION-J1-FAIT.md

Sorties décisives (dernier passage de cap.mjs) :
- GESTES 22/22 · ERREURS PAGE 0 · LISTE 14 lignes, 82 %
- B1 : « aucun toast du rangement sur À faire » ; « le toast « Choisi » de Citra n'a pas suivi »
- B2 : « Changer le joint » / « prix du joint ? Noter » / « Réparer ≈ 1 déc. » → « Réglé » → « Rouvrir » / « Commander · MotlerHops »
- B3 : tout de suite « 6 CHF noté » et « ✓ prix du joint : 6 CHF · noté · l'IA relit » ; après l'IA « 6 CHF », 0 manque ; « Starter lancé » → tâche proposée faite → au retour, jeton starter ✓ et « Ensemencer »
- B4 : hors ligne, lecture gardée, « lu 25 nov. 22:51 · l'IA relira au retour du réseau »
- B5 : couronne seule sur « 410 CHF » ; « 504 CHF + 🚚 ? » ; « ≤ 400 » ne couvre pas 600 ; citra « 3,72 € ? », variété au-dessus
- B6 : aucune carte « fût.EST », ligne gardée dans Mes notes
- B7 : vide médian 94 px ; 3 cas courts gardent 226 à 332 px (bar, cave, embouteillage), sans mot ajouté
- B8 : auj. à 26 px, début de la barre et fin de sa date à 269 px
- Mots au repos : max 30 (frigo, levure lente, 600) ; IA en erreur 29 ; info utile 52 à 107 px

Captures : cap/ (01 à 63, dont neuves 32a, 41b, 41c ; org-*-1 par cas). Toutes ouvertes (planches de trois à 390 px) après le dernier passage.

Prédiction : « Là ça suit enfin : je retiens, le bouton change ; je note le prix, la case se remplit. Mais l'embouteillage, c'est encore bien vide. »

DÉCISION À PRENDRE : aucune.

CONNAISSANCE : une lecture locale des lignes écrites depuis la dernière lecture IA (manque « libellé : valeur », participe passé + mot de la tâche) donne un effet immédiat et hors ligne ; l'IA confirme ensuite. Le banc rejoue une réponse IA selon les lignes de la consigne (`si`, ligne « auto »).

LEÇON PROPOSÉE : un jouable à réponses rejouées doit rejouer la réponse qui suit chaque note, et tout contrôle d'état transitoire se lit avant la capture (une capture DPR 2 peut durer plus que la réponse simulée : faux KO intermittent).
