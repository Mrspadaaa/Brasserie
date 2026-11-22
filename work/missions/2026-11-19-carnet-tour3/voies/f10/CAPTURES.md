# Captures f10 (banc v3, PORT_BANC=5198, réponses Gemini enregistrées)

Dossier : `voies/f10/captures/`. Script : `voies/f10/g-f10.mjs` (journal : `$TEMP/.../scratchpad/f10-run.log`). Texte lu par `innerText`, sur la page ; les captures ne sont pas ouvertes ici, le concepteur les juge.

fichier | état | ce que montre le texte à l'endroit attendu
--- | --- | ---
f10-v35-0-390-clair.png | v3-lent, 390 clair, t≈1,2 s | pied : « Enregistrer » seul (droite 382 / 390)
f10-v35-1-390-clair.png | v3-lent, 390 clair, t≈2,0 s | pied : « Lectures » + « 3e lecture en cours… » (inactif), droite 382 / 390, entier
f10-v35-2-390-clair.png | v3-lent, 390 clair, t≈26,4 s (fin) | pied : « Lectures 3/3 d'accord » + « Confirmer », droite 382 / 390
f10-v35-0-390-cave.png | v3-lent, 390 cave, t≈0,5 s | pied : « Enregistrer » seul (droite 382 / 390)
f10-v35-1-390-cave.png | v3-lent, 390 cave, t≈1,2 s | pied : « 3e lecture en cours… » (inactif), droite 382 / 390, entier
f10-v35-2-390-cave.png | v3-lent, 390 cave, t≈25,7 s (fin) | pied : « Lectures 3/3 d'accord » + « Confirmer », droite 382 / 390
f10-v35-0-1280-clair.png | v3-lent, 1280 clair, t≈0,4 s | pied : « Enregistrer » seul (droite 1011 / 1280)
f10-v35-1-1280-clair.png | v3-lent, 1280 clair, t≈1,2 s | pied : « Lectures » (droite 454) + « 3e lecture en cours… » (inactif, droite 1241)
f10-v35-2-1280-clair.png | v3-lent, 1280 clair, t≈25,7 s (fin) | pied : « Lectures 3/3 d'accord » (droite 454) + « Confirmer » (droite 1241)
f10-v35-0-1280-cave.png | v3-lent, 1280 cave, t≈0,6 s | pied : « Enregistrer » seul (droite 1011 / 1280)
f10-v35-1-1280-cave.png | v3-lent, 1280 cave, t≈1,4 s | pied : « Lectures » (droite 454) + « 3e lecture en cours… » (inactif, droite 1241)
f10-v35-2-1280-cave.png | v3-lent, 1280 cave, t≈25,8 s (fin) | pied : « Lectures 3/3 d'accord » (droite 454) + « Confirmer » (droite 1241)
f10-doc2-entete-390-clair.png | reel-doc2, en-tête, 390 clair | en-tête : « Drs H. et I. Gauderon-Comment Sàrl - Médecins vétérinaires · 25.06.2026 · À confirmer · Total des lignes non vérifiable : 1 ligne(s) sans montant lisible » ; aucun « désaccord » dans l'en-tête
f10-doc2-lectures-390-clair.png | reel-doc2, bloc Lectures, 390 clair | « Lectures 3/3 d'accord · 3 · à contrôler 1 » ; « valeur en désaccord » : 0 occurrence
f10-doc2-entete-390-cave.png | reel-doc2, en-tête, 390 cave | même texte que 390 clair ; aucun « désaccord »
f10-doc2-lectures-390-cave.png | reel-doc2, bloc Lectures, 390 cave | « Lectures 3/3 d'accord » ; « valeur en désaccord » : 0
f10-doc2-entete-1280-clair.png | reel-doc2, en-tête, 1280 clair | même texte d'en-tête ; aucun « désaccord »
f10-doc2-lectures-1280-clair.png | reel-doc2, bloc Lectures, 1280 clair | « Lectures 3/3 d'accord » ; « valeur en désaccord » : 0
f10-doc2-entete-1280-cave.png | reel-doc2, en-tête, 1280 cave | même texte d'en-tête ; aucun « désaccord »
f10-doc2-lectures-1280-cave.png | reel-doc2, bloc Lectures, 1280 cave | « Lectures 3/3 d'accord » ; « valeur en désaccord » : 0
f10-lr17-390-clair.png | medicament, ligne 1 ouverte, prix vidé puis quantité 4, 390 clair | champ « Prix ligne 1 » : valeur 3,35 ; title = aria-describedby = « prix déduit : 13,40 ÷ 4 »
f10-lr17-390-cave.png | medicament, idem, 390 cave | title = aria-describedby = « prix déduit : 13,40 ÷ 4 » ; valeur 3,35
f10-lr17-1280-clair.png | medicament, idem, 1280 clair | title = aria-describedby = « prix déduit : 13,40 ÷ 4 » ; valeur 3,35
f10-lr17-1280-cave.png | medicament, idem, 1280 cave | title = aria-describedby = « prix déduit : 13,40 ÷ 4 » ; valeur 3,35
f10-e12-390-clair.png | saisie à la main, total 3, 390 clair (plein écran) | `article[data-purchase-line]` : 1 rangée (1 visible) ; texte d'ouverture « Type d'achat · Ingrédients · Emballages… »
f10-e12-390-cave.png | saisie à la main, total 3, 390 cave | 1 rangée (1 visible)
f10-e12-1280-clair.png | saisie à la main, total 3, 1280 clair | 1 rangée (1 visible)
f10-e12-1280-cave.png | saisie à la main, total 3, 1280 cave | 1 rangée (1 visible)

Attendus contrôlés par le texte : pied à 390, bouton principal entier (droite ≤ 390 : 382 et 373) ; doc2 « Lectures 3/3 d'accord », aucun « valeur en désaccord » ; lr17 title « prix déduit : 13,40 ÷ 4 » ; e12 1 rangée. Doute : le libellé « Lectures » du pied à 390 est à droite 373, « Confirmer » à 382 (dans la fenêtre). Les captures ne sont pas jugées visuellement ici.
