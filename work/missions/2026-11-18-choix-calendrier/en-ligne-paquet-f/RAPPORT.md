EN LIGNE PAQUET F — 5/5 OK, 2 problèmes (0 bloquant), ZZ TEST restants 0

Site https://brasserie-l-affinee.web.app, tag en-ligne/2026-11-19-paquet-f, bundle attendu index-BrOgcht-.js. Critique Opus (Fable interdit). Claude in Chrome, gestes souris réels.

## Gestes (au fil)
1. Bundle sans cache : `/index.html` no-store → `assets/index-BrOgcht-.js`, script chargé identique, 0 service worker. OK.
2. Session : « Plus : saisie au nom de Gaëtan », données réelles présentes : session du brasseur. Fenêtre 2560 × 1305.
3. Calendrier › menu « Période, liste, tri et filtre » › « Sans date · 11 » : 4 choses réelles (non touchées) + les 7 « ZZ TEST » attendus.
4. N° 1 : toucher réel de « Verre 3 dl pour ZZ TEST client » → fiche « Date Sans date · Poser · Fait · Supprimer » (Supprimer en rouge).
   Toucher réel de Supprimer → « Enregistrement sur le serveur… » puis « Supprimée : Verre 3 dl pour ZZ TEST client · Annuler » ; liste « Sans date · 10 ». Aucune alert/confirm.
5. Annuler : « ZZ TEST — fête 3 j » supprimée (toucher réel) puis Annuler (toucher réel) → revenue dans la liste (2 « fête 3 j », Sans date · 10). OK.
6. Reste du nettoyage (6 « ZZ TEST » : fête 3 j ×2, fête mois, Foire ×3) par le même geste Supprimer (clics scriptés, le geste réel étant prouvé en 4) :
   6 × « Supprimée : … · Annuler ». « Sans date · 4 » : les 4 choses réelles seules. N° 1 OK.
7. N° 4 : menu › Échelle Mois → la plage passe d'elle-même de « 3 mois » à « 6 mois » (14 déc. → 13 juin, 6 colonnes déc.–mai). Menu › « 3 mois » :
   période 14 déc. → 14 mars, 3 colonnes déc., janv., févr. de 291 px, puce « 3 mois ». N° 4 OK.
8. N° 3 : rechargement → toujours Mois, 3 colonnes déc.–févr. Puis Jour (la plage passe à « 2 sem. · j », 14 → 27 déc.) ; rechargement → toujours Jour. N° 3 OK.
9. N° 5 (en Jour) : + Fêtes, 3 j, S51, « ZZ TEST — fête F » (gestes réels). Barre `cal-barre cal-t-fetes` 434 px = toute la semaine 14–20 déc., avec 3 points
   (`cal-pts`) répartis à x 966, 1105, 1243 (≈ 15, 17/18, 19 déc.). Fiche (toucher réel) : « Semaine S51 · 14 – 20 déc. · Date 3 j entre le 14 déc. et le 20 déc. ·
   Fenêtre S51 → S51 · Libre de la semaine −660 · Ouvrir dans l'agenda · Modifier · Lier · Ranger sans date ». Fiche juste (aucun jour inventé). N° 5 OK.
   N° 2 (fête) : « Ranger sans date » OK. La feuille d'ajout ne propose que des semaines, même en échelle Jour.
10. N° 2 (vente) : + Ventes, 1 CHF, « ZZ TEST — vente F », S51 (gestes réels) → marque « 14 déc., S51, +1 ». Fiche (toucher réel) : « Facturer · Modifier · Lier ·
    Annuler la vente ». Annuler la vente → « Enregistrement sur le serveur… » puis « Vente annulée · S51 : −659 → −660 · Finances › · Annuler ». N° 2 OK.
    Fête : « Ranger sans date » (toucher réel) → « Rangée sans date, plus en S51 · Sans date › · Annuler ». Puis Sans date › fête F › Supprimer → « Supprimée : ZZ TEST — fête F · Annuler ».
11. Remise de l'état trouvé : échelle Semaine, plage « 3 mois » (14 déc. → 14 mars).
12. Rechargement : Calendrier 0 « ZZ TEST » ; Sans date · 4 (les 4 choses réelles) ; Finances Synthèse, Opérations, Prévisions, Annuel : 0 « ZZ TEST ».
13. Console (après le dernier rechargement ; le suivi ne couvre pas les gestes d'avant) : aucune erreur. Aucune alert/confirm. Onglet 1005988352 fermé.

## Verdict — combien et quels problèmes ?
Points : 1 OK, 2 OK, 3 OK, 4 OK, 5 OK → 5/5.
1. En échelle Jour, la barre d'une fête de 3 j couvre toute la semaine (14–20 déc.) avec 3 points répartis (≈ 15, 17/18, 19 déc.) : ils ont l'air de vrais jours
   alors qu'aucun jour n'a été choisi (la feuille ne propose que des semaines, même en Jour). La fiche, elle, est juste. Non bloquant ; rejoint la DÉCISION n° 5 (b).
2. Changer d'échelle change la plage de toute l'app sans le dire : Mois fait passer « 3 mois » à « 6 mois », Jour fait passer à « 2 sem. » (période de Finances comprise).
   Non bloquant.
Doutes non comptés : le bouton du menu n'a pas de nom accessible propre (son texte seul : « 3 mois », « 2 sem. · j ») ; aria de la période « 14 → 27 déc.. » (point doublé) ;
3 mois depuis le 14 déc. montre déc.–févr. alors que la plage finit le 14 mars (les 14 jours de mars sans colonne).
