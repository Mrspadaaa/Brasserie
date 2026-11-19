# Test en ligne, passe 3 : 19.11, https://brasserie-l-affinee.web.app/ (tag en-ligne/2026-11-19-tour2)

Méthode : Claude in Chrome (session du brasseur, connectée à Google, rien saisi). La fenêtre Chrome reste à 2560 × 1305 (`resize_window` sans effet) : tailles émulées par une iframe `srcdoc` de même origine (base `https://brasserie-l-affinee.web.app/`), servie depuis l'onglet `/brew-alerts-sw.js` pour ne pas faire tourner une deuxième app. La taille se change en redimensionnant l'iframe (sans recharger) ; le thème par `localStorage['laffinee.theme']` (clair / cave), relu par l'app à l'événement `storage`. Clics réels par coordonnées (souris, pas de toucher émulé : l'iframe ne permet pas l'émulation tactile). Captures regardées en zoom.

Limites du banc (doutes, non comptés) :
- Le premier clic réel après le chargement de l'iframe est perdu (pointerdown sur le bouton, pointerup sur la barre de titre, aucun `click`) ; le deuxième passe. Vu 3 fois (barre Ttt, Plein écran ×2). À rejouer sur un vrai téléphone avant d'en faire un défaut.
- Le plein écran est refusé par Chrome dans l'iframe pilotée (même avec `allow="fullscreen"`, activé au clavier) : « plein écran puis retour » n'est pas jouable ici.
- Après plusieurs ouvertures de l'app dans le même onglet, le moteur de rendu s'est figé (> 2 min, onglet fermé) ; dans le second onglet, Finances › Opérations a eu des tâches longues de 11 à 15 s environ 1 min après l'ouverture (« Préparation du registre comptable… »). Banc chargé (plusieurs instances successives) : à mesurer sur téléphone.

## Tableau

| Écran | 390 clair | 390 sombre | 844×340 clair | 844×340 sombre | 1280 clair | 1280 sombre |
|---|---|---|---|---|---|---|
| Calendrier : axe | KO T2-1 / T2B-2 (« déc. » seul en haut, semaines dessous) | KO idem | KO idem (« déc. », « janv. » en haut) | KO idem | KO idem | KO idem |
| Calendrier : toucher un brassin | OK : la barre Ttt ouvre son détail (2e clic, voir banc) ; détail KO T3-1, T3-2 | non rejoué | non rejoué | non rejoué | non rejoué | non rejoué |
| Calendrier : frise | KO T3-3 (Emballage · Jhhh ×2) | KO T3-3 | KO T2-5 : frise à 164 px sur 340 (48 %) | KO T2-5 | KO T3-3 | KO T3-3 |
| Calendrier : plein écran + retour | Invitation « Tourne le téléphone : 13 semaines » OK ; plein écran non jouable (banc) | non joué | KO T3-4 : aucun effet ni message | non joué | non joué | non joué |
| Finances › Opérations : période, « 0 opération » | KO T2-3 (joué à 2560 px, clair) : oct. « 31 jours · 0 opération » avec la ZZ TEST à payer du 19.11 dans la liste | non joué | non joué | non joué | non joué | non joué |
| Finances › fiche à payer, paiement, retrait (2560 px, clair) | KO T2-4 : « Noter un paiement » (pas « Confirmer le paiement ») ; la feuille « Payer … ✓ Payer 1,00 » marche, nov. passe à « 1 opération, payé 1,00 » ; « Retirer cette écriture » (dans « Corriger une erreur de saisie ») demande confirmation, inverse le paiement, nov. revient à 0 | — | — | — | — | — |
| Nouvelle dépense (2560 px, clair) | KO T3-6, T3-7 | — | — | — | — | — |
| Stocks › Courses (2560 px, clair) | T2-6 non reproduit (plus de « Rien à commander » ni « Étagère » ; « 24 à commander » = pastille 24) ; KO T3-5 | — | — | — | — | — |
| Recette ZZ TEST : Identité, Malts, Houblons, Levure, Eau (2560 px, clair) | KO T2B-3 : Levure 7,9 s, 5,6 s, 3,7 s (Houblons 0,1 s, Eau 0,3 s, Malts 0,6 s) ; Malts et Eau et sels s'affichent, « à corriger » clairs ; T2-8 non vérifiable à l'écran | — | — | — | — | — |
| Brassins › planifier depuis une recette | T2B-1 non rejoué : 200 g de grain (le curseur glissé n'a pas bougé), la recette n'a pas pu s'enregistrer (« 2 valeurs à corriger ») ; brouillon abandonné | — | — | — | — | — |
| Carnet (dépense, justificatifs) | non joué (budget) | — | — | — | — | — |

## Combien et quels problèmes ? 7 neufs

1. T3-1 : Calendrier 390, détail d'un brassin (barre Ttt) : la phrase « pas brassée · brassage prévu le 8 sept. · prête le 4 déc. au plus tôt » est hachée en quatre colonnes (« pas brassée · brassage prévu » / « le 8 sept. · » / « prête » / « le 4 déc. au plus tôt »), illisible d'un coup d'œil.
2. T3-2 : même détail : « Brassage 8 sept. · pas brassée », puis « Fermentation 20 nov. », « Dry hop 22 nov. », « Garde 29 nov. », « Conditionnement 4 déc. » : un brassage passé non fait et des étapes recalées sur aujourd'hui, sans dire que le brassage est en retard ni le proposer à aujourd'hui.
3. T3-3 : Calendrier (390, 1280, clair et sombre) : la ligne « Emballage · Jhhh » paraît deux fois de suite dans la rangée Brassins.
4. T3-4 : Calendrier 844×340 : « Plein écran » quand le navigateur refuse le plein écran (iPhone Safari, iframe) : aucun effet, aucun message (l'invitation n'existe que téléphone droit, `EnTete.tsx` `telephoneDroit`). Le geste paraît mort.

5. T3-5 : Stocks › Courses : la ligne des recettes d'un article répète la même recette (Lotus et Flocons d'avoine : « neipa v3 prévu » sept fois, date sur deux seulement ; Malt Maris Otter : « Jhhh prévu le 05.09.2026 » deux fois), illisible.
6. T3-6 : Nouvelle dépense : après « Enregistrer », la feuille reste ouverte : « Confirmation de cette écriture en attente… vérifie la synchronisation sans la recréer », bouton « Vérifier la synchronisation », alors que l'écriture est déjà dans la liste (une fois, page figée pendant le clic).
7. T3-7 : Nouvelle dépense à payer de 1,00 : la pastille « Mon mois » dit « +1,00 » (signe d'un gain pour une dépense).

Défauts du registre : T2-1 et T2B-2 confirmés (toutes tailles, deux thèmes) ; T2-5 confirmé (48 %) ; T2-2 infirmé sur une barre normale (pas de barre minuscule à 6 sem.) ; T2-3 confirmé ; T2-4 confirmé (libellé) ; T2B-3 confirmé, plus lent (3,7 à 7,9 s) ; T2-6 non reproduit ; T2B-1, T2-7, T2-8 non rejoués. Le banc a figé l'onglet à trois reprises (deux dans l'iframe, une en page directe pendant Enregistrer) : à mesurer sur téléphone (T3-NOTE-1).

## Données ZZ TEST

- Écriture « ZZ TEST — opération à payer » (1,00 CHF, Brassage, autre, sans pièce) : créée, payée (« ✓ Payer 1,00 », banque), puis retirée (« Retirer cette écriture » › « Confirmer le retrait ») : paiement inversé, novembre revenu à 0 opération. Elle reste dans « Écritures annulées » (une écriture ne se supprime jamais).
- Recette « ZZ TEST — recette » : brouillon jamais enregistré, abandonné ; plus aucun « ZZ TEST » dans la page.
- Aucune donnée réelle modifiée (brassin Ttt lu seulement), aucun envoi à l'IA, aucune suppression définitive. Thème de l'appareil laissé à « clair » (valeur d'origine).

## Non joués (à reprendre)

Carnet ; T2B-1 (recette ZZ TEST avec 5 kg de grain, puis « Enregistrer et préparer un brassin ») ; 844×340 et 1280 sombre hors Calendrier ; Finances, Courses, Recette en 390, 844 et sombre ; plein écran et retour (refusé par le banc) ; toucher réel.
