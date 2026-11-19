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
| Finances › Opérations : période, « 0 opération » | T2-3 non reproduit : oct. et nov. disent « 0 opération » et « Aucune opération trouvée », cohérents | non joué | non joué | non joué | non joué | non joué |

## Combien et quels problèmes ? (en cours)

1. T3-1 : Calendrier 390, détail d'un brassin (barre Ttt) : la phrase « pas brassée · brassage prévu le 8 sept. · prête le 4 déc. au plus tôt » est hachée en quatre colonnes (« pas brassée · brassage prévu » / « le 8 sept. · » / « prête » / « le 4 déc. au plus tôt »), illisible d'un coup d'œil.
2. T3-2 : même détail : « Brassage 8 sept. · pas brassée », puis « Fermentation 20 nov. », « Dry hop 22 nov. », « Garde 29 nov. », « Conditionnement 4 déc. » : un brassage passé non fait et des étapes recalées sur aujourd'hui, sans dire que le brassage est en retard ni le proposer à aujourd'hui.
3. T3-3 : Calendrier (390, 1280, clair et sombre) : la ligne « Emballage · Jhhh » paraît deux fois de suite dans la rangée Brassins.
4. T3-4 : Calendrier 844×340 : « Plein écran » quand le navigateur refuse le plein écran (iPhone Safari, iframe) : aucun effet, aucun message (l'invitation n'existe que téléphone droit, `EnTete.tsx` `telephoneDroit`). Le geste paraît mort.

Défauts du registre : T2-1 et T2B-2 confirmés (toutes tailles, deux thèmes) ; T2-5 confirmé (48 %) ; T2-2 infirmé sur une barre normale (pas de barre minuscule à 6 sem.) ; T2-3 non reproduit (aucune opération à payer en base pour le rejouer).

## Données ZZ TEST

- Aucune créée à ce stade. Aucune donnée réelle modifiée, aucun envoi à l'IA. Thème de l'appareil remis à « clair » (valeur d'origine).
