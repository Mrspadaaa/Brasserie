EN LIGNE PAQUET E — 2/4 OK (n° 2 non joué), 1 problème (1 bloquant), ZZ TEST retirés non (fête restante)

Site https://brasserie-l-affinee.web.app, tag en-ligne/2026-11-19-paquet-e. Critique Opus (Fable interdit).

## Conditions
- Claude in Chrome, onglet propre 1005988344. Fenêtre réelle 2560 × 1305 (capture 0,6 px par px CSS) : 390 émulé dans la page
  (règles @media réécrites à 390, hover none / pointer coarse, matchMedia, innerWidth, clientWidth ; body 390 × 1305 translateZ ; hauteur réelle gardée).
- Gestes souris réels (pas de vrai tactile).

## Gestes (au fil)
1. Bundle sans cache : `/index.html` no-store → `assets/index-CiyOyOPa.js`, script chargé identique. 0 service worker. OK.
2. Session : avatar « G », Finances avec données : session du brasseur active. OK.
3. « ZZ TEST — fête 3 j » créée en S49 (30 nov.), 3 j (puce S49, 3 j, nom, Ajouter en S49). Visible dans Fêtes.
4. « ZZ TEST — achat 1 j lié » (−1) créé en S49. Visible dans Achats (marque 28 × 28).
5. « ZZ TEST — vente 1 j » (+1) créée en S49. Visible dans Ventes (marque 28 × 28).
   (Un premier essai : toucher par ref sur « Ajouter dans Ventes » n'a pas ouvert la feuille ; texte tapé hors champ, sans effet visible.)

6. Achat lié à la fête par sa fiche → Lier → « ZZ TEST — fête 3 j » : toast « Liée à ZZ TEST — fête 3 j ».
7. N° 1, vente, vue Semaine (6 sem., colonne 61 px) : glisser réel souris (left_click_drag, un saut de 61 px) → 30 nov. S49 → 7 déc. S50.
   Message « À dépenser : −660 · S47 → −661 · S49 · Annuler ».
8. N° 1, achat : même glisser → 30 nov. → 7 déc. S50 (la marque suit à l'écran).
9. N° 4, fête glissée S49 → S50 (glisser réel) : message « ZZ TEST — fête 3 j : S49 → S50 · 1 achat lié reste au 7 déc. »,
   bouton « Le déplacer aussi » 131 × 44 + Annuler ; achat non écrit avant le bouton (7 déc.).
10. Toucher réel « Le déplacer aussi » → achat 7 déc. → 14 déc. S51 (+7 j = écart de la fête). Message ensuite
   « à dépenser inchangé · S50 : −660 → −659 · Annuler ».

11. Rechargement : fête 7 déc. S50, vente 7 déc. S50, achat 14 déc. S51 (aria-label) ; fiche de la vente « Semaine S50 · 7 – 13 déc. · Date 7 déc. » ;
   Finances › Prévisions : « ZZ TEST — vente 1 j +1, 07.12 », « ZZ TEST — achat 1 j lié −1, 14.12 ». N° 1 OK, n° 4 OK.
12. N° 3, vue Mois (menu → Mois, 6 mois, colonne 52,5 px) : glisser réel souris de la vente +55 px, +63 px, puis de l'achat +55 px :
   AUCUN effet (date inchangée, aucun message). Journal pointeur : pointerdown isTrusted sur la marque, gotpointercapture, 2 pointermove,
   pointerup sur la marque : le geste arrive bien. Pointeurs synthétiques par pas de 3 px (pointerId 7, isPrimary) : sans effet non plus
   (isTrusted probable). La même marque, même outil, se glisse en Semaine. N° 3 KO en ligne (souris) ; bulle « lâcher ici » non observable.

13. N° 2 paysage : émulation 844 × 390 dans la page sans effet (en-tête resté 366 px de large, 152 px de haut, mise en page portrait :
   l'app ne bascule pas en paysage sur l'émulation). N° 2 NON JOUÉ.
14. Nettoyage commencé à 2560 (sans émulation), vue Mois : fiches à ouvrir par toucher réel de la marque, puis « Retirer ».

## Verdict provisoire — combien et quels problèmes ?
Points : n° 1 OK, n° 4 OK, n° 3 KO, n° 2 non joué → 2/4 OK.
1. BLOQUANT — Vue Mois : une vente et un achat d'un jour ne se glissent pas au mois (souris réelle, geste capturé, +55 à +63 px pour une
   colonne de 52,5 px) : geste sans effet, aucune bulle ni message (n° 3 de RESULTAT non tenu en ligne). Piste : le glisser du banc était
   pas à pas ; en ligne l'outil saute (2 pointermove).
Doutes non comptés : message « à dépenser inchangé · S50 : −660 → −659 » (dit inchangé et montre un écart) ; puce « 3 j » choisie peu distincte.
Console : non relue (contexte de l'agent).

15. Nettoyage (2560, vue Mois) : vente RETIRÉE (toucher réel + Retirer), achat RETIRÉ (idem). La fête ne s'ouvre pas : 3 touchers réels
   (marque de 30 px à l'écran (564,275) capture, puis son nom) → aucune fiche, aucun « Retirer » (doute : fête non ouvrable en Mois à 2560).
Onglet 1005988344 fermé. Arrêt : contexte de l'agent proche de 200 k.

REPRISE : il reste EN LIGNE « ZZ TEST — fête 3 j » (7 déc., S50). À retirer : repasser en vue Semaine (menu « 6 mois » → Semaine),
toucher réel de la barre (div.cal-barre, aria-label « ZZ TEST — fête 3 j… ») puis « Retirer » ; recharger ; vérifier Calendrier et
Finances › Prévisions : aucun « ZZ TEST » ; lire la console (erreurs). N° 2 reste à jouer sur un vrai 844 × 390 (rotation impossible ici).

- Nettoyage final (19.11) : NETTOYAGE OK - 1 retiré (« ZZ TEST — fête 3 j », 7 déc. S50, via Calendrier Semaine > barre > Retirer, rechargé : Fêtes vide) - Calendrier S47 à S52 et Finances (Synthèse, Opérations, Prévisions) sans ZZ TEST - ZZ TEST restants 0.
