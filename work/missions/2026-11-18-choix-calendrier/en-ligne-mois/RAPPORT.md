EN LIGNE MOIS — 3/3 OK, 2 problèmes (0 bloquant), ZZ TEST retirés non (fête « ZZ TEST — fête mois » restée dans Sans date)

Site https://brasserie-l-affinee.web.app, tag en-ligne/2026-11-19-mois, bundle attendu index-EgcLvZG2.js. Critique Opus (Fable interdit).
Claude in Chrome, onglet propre 1005988348. Gestes souris réels.

## Gestes (au fil)
1. Bundle sans cache : `/index.html` no-store → `assets/index-EgcLvZG2.js`, script chargé identique, 0 service worker. OK.
2. Session : avatar « G », « saisie au nom de Gaëtan », Finances avec données : session du brasseur. OK. Aucun « ZZ TEST » préexistant.
3. Fenêtre réelle 2560 × 1305 (capture 0,6 px par px CSS), sans émulation. Calendrier → menu → Échelle Mois → « 3 mois »
   (période 14 déc. → 13 mars : 4 colonnes déc., janv., févr., mars de 218 px ; le menu dit « 3 mois »).
4. « ZZ TEST — vente mois » +1 créée (+ Ventes, montant 1, Autre nom, S51) : marque `cal-marque cal-t-ventes cal-ponctuel` 28 × 28,
   aria « 14 déc., S51, +1 ». « ZZ TEST — fête mois » 3 j créée (+ Fêtes, Jours actifs 3 j, Nom, S51) : `cal-barre cal-t-fetes` 47 × 26, « 14 déc., S51 ».
5. Premier glisser raté par ma faute (coordonnées périmées après fermeture de la feuille : départ sur « Masquer Achats », sans effet). Non compté.
6. N° 1, vue 3 mois / Mois : vrai left_click_drag de la vente, +218 px (une colonne). Journal : pointerdown isTrusted sur la marque,
   gotpointercapture, 2 pointermove, pointerup, lostpointercapture, click. Marque → aria « 14 janv., S2, +1 » (déplacée d'un mois, colonne janv.).
   Messages : « Enregistrement sur le serveur… » puis « à dépenser reste −660 · S51 : −659 → −660 · Annuler ». N° 2 OK (dit « reste » et le vrai
   changement de S51, la vente +1 quittant S51). Aucune fiche ouverte par le click final.
7. Rechargement : marque « ZZ TEST — vente mois, 14 janv., S2, +1 » ; fiche (toucher réel) « Semaine S2 · 11 – 17 janv. · Date 14 janv. ·
   Libre de la semaine −659 » ; Finances › Prévisions : « ZZ TEST — vente mois +1, 14.01 ». La date en base suit. N° 1 OK.
   Après rechargement, l'échelle était revenue à Semaine (colonnes S51…S10) avec la plage « 3 mois » gardée : remise en Mois par le menu.
8. N° 3, vue Mois (3 mois, colonnes déc.–mars) : toucher réel de la barre de la fête (`div.cal-barre cal-t-fetes`, role=button, 47 × 26,
   elementFromPoint = la barre). Journal : pointerdown, gotpointercapture, pointerup, lostpointercapture, click, tous isTrusted, non empêchés.
   Fiche ouverte : « Semaine S51 · 14 – 20 déc. · Date 14 déc. → 20 déc. · Fenêtre S51 → S51 · Jours actifs 3 j · Ouvrir dans l'agenda ·
   Modifier · Lier · Retirer ». N° 3 OK. (La vente s'ouvre aussi au toucher en vue Mois.)
9. Nettoyage : fête → « Retirer » : message « Retirée de S51 · Sans date › · Annuler » ; vente → « Retirer » : « Annulé · S2 : −659 → −660 ·
   Finances › · Annuler ». Aucune boîte alert/confirm.
10. Rechargement : Calendrier daté sans « ZZ TEST » (0 marque) ; Finances Synthèse, Opérations, Prévisions, Annuel : aucun « ZZ TEST ».
    MAIS menu → « Sans date · 11 » contient encore « ZZ TEST — fête mois », et des restes d'anciens tests : « ZZ TEST — fête 3 j » ×2,
    « ZZ TEST — Foire » ×3, « Verre 3 dl pour ZZ TEST client » (Activités). Non supprimés : aucune suppression définitive sans accord.
11. Console : lecture des erreurs après le dernier rechargement (le suivi ne démarre qu'au premier appel, donc les gestes précédents
    ne sont pas couverts) : aucune erreur.
Onglet 1005988348 fermé.

## Verdict — combien et quels problèmes ?
Points : n° 1 OK, n° 2 OK, n° 3 OK → 3/3 OK.
1. « Retirer » une fête ne l'efface pas : elle part dans « Sans date ». Les nettoyages « ZZ TEST » en ligne laissent donc des restes
   (7 « ZZ TEST » dans Sans date, dont 6 des tests précédents, que le nettoyage du paquet E disait à 0). Pas bloquant pour l'écran ;
   bloquant pour la consigne de nettoyage. Il faut un vrai « Supprimer » depuis Sans date (accord du brasseur pour retirer ces 7).
2. Après rechargement, l'échelle Mois n'est pas gardée (retour à Semaine), alors que la plage « 3 mois » l'est.
Doutes non comptés : le menu dit « 3 mois » mais montre 4 colonnes (déc.–mars, période 14 déc. → 14 mars) ; la fiche d'une fête de 3 j dit
« Date 14 déc. → 20 déc. » (la semaine, pas les 3 jours) ; même verbe « Retirer » pour deux effets (fête → Sans date, vente → « Annulé »).

## Nettoyage final (19.11)
NETTOYAGE ECHEC — 0 supprimé — 7 restants — geste de suppression : non.
Site https://brasserie-l-affinee.web.app, session du brasseur, onglet propre 1005988350. Calendrier › menu de la période › « Sans date · 11 ».
Les 7 restes « ZZ TEST » sont toujours là : « ZZ TEST — fête mois », « ZZ TEST — fête 3 j » x2, « ZZ TEST — Foire » x3, « Verre 3 dl pour ZZ TEST client ».
Fiches ouvertes (fête mois, Verre 3 dl) : seulement Date « Sans date », « Poser » et « Fait ». Aucun « Supprimer » ni « Retirer définitivement ».
« Fait » n'est pas une suppression et n'a pas été touché ; rien effacé en base. Aucune alert/confirm. Aucun autre élément touché.
Reste à décider : ajouter un vrai geste « Supprimer » dans « Sans date », ou accord du brasseur pour un retrait direct en base des 7 éléments.
Onglet 1005988350 fermé.
