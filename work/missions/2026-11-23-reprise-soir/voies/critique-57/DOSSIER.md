# Dossier — test en ligne du tour 57 (index-JrS2YtfY.js), 24.11

Ses mots : « Parcontre le fait que maintenant tout est au bord, l'actionnable est du coup plus difficile sur mobile. Rentre la zone plus accessible » (capture work/missions/2026-11-23-reprise-soir/plaintes/2026-11-24-poignee-bord.jpg : fin de la barre « Fruty » au bord droit). Et Q-4 : « Trop lente sur le calendrier » (défilement au bord).

## Où
- https://brasserie-l-affinee.web.app dans le Chrome de débug : puppeteer-core connect 127.0.0.1:9222, ton onglet neuf, 390 × 844, deviceScaleFactor 2, TOUCHER (événements tactiles, pas souris). Fin : page.close() de ton onglet, browser.disconnect(). JAMAIS browser.close(). Jamais Claude in Chrome. Aucun appel IA.
- Paquet : vérifie index-JrS2YtfY.js (curl ?nocache=<aléa>) ; ancien paquet → recharge.

## À jouer (voies/poignees/RESULTAT.md)
- Une barre « ZZ TEST » qui finit au bord droit (et une au bord gauche) : attraper sa fin par un toucher à 10-20 px du bord ET à 30 px vers l'intérieur : la poignée se prend ; le dessin reste bord à bord (aucun bord autour du calendrier, traits continus).
- Plein écran, « + » de Fêtes et autres boutons proches d'un bord : faciles à toucher.
- Vitesse : tenir une barre ZZ au bord droit 2 s : combien de semaines défilent (avant : ~3 colonnes/s ; attendu ~×2,5), montée progressive avec la profondeur ; idem fenêtre de l'en-tête. Barre tenue au bord : la frise s'agrandit (son choix CAL-BARRE-BORD) : rien de cassé.
- Rejeu, en regardant : frise bord à bord, traits continus, menu +, centimes (C46-5), marche nommée (C54-1).

## Verdict
« combien et quels problèmes ? », liste numérotée, gravité B/m/D ; chaque problème à BUGS.md (préfixe K57-). Non couvert : 1280, thème sombre.
