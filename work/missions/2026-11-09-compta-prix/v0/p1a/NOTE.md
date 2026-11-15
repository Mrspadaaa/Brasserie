# p1a — Prévisions, froid : une réponse, une barre, trois mois

Chaleur : **froide** (la baseline Prévisions › Échéances, resserrée dans sa propre langue : horizon en segments, résumé, liste datée).
Idée : « Fin janvier, il restera 2 107,34 CHF » domine ; une barre dit ce qui part (violet charges fixes, jaune brassin, bleu matériel) ; la liste est groupée par mois avec le total du mois ; le fermenteur se compte ou non d'un interrupteur sur sa ligne.

## Ce qui est montré (écran 1, 90 jours)
- Titre « Ce qui va sortir » (l'onglet dit « Prévisions », pas de mot répété) + segments 30 j / 90 j / 12 mois + ⚙.
- Réponse : « Fin janvier, il restera » **2 107,34 CHF**, pastille « estimé · 1 limite › » ; barre de 4 181,60 : sorties 2 074,26 (1 260 charges fixes + 64,26 brassin + 750 matériel), le reste hachuré ; « Entrées : aucune prévue ».
- Trois mois : Novembre − 524,26 (Solde atelier 2025 **en retard**, Pale Ale ~ 64,26 estimé, Loyer 400) · Décembre − 400 · Janvier − 1 150 (Fermenteur 750 + interrupteur « compté », Loyer, Système de brassage « prix ? », idée hachurée).
- Ligne « Projets de matériel · 3 · 1 chiffré › » ; pli « Comparer les mois » ; action primaire « + Prévoir une sortie ».
- Annexe (état dessiné à côté) : solde de départ non confirmé → « À compléter », « Aujourd'hui ? », une seule action « Je confirme ».

## Problèmes de l'inventaire
24 (quatre intitulés → « Sorties » et une barre), 25 (« Comparer les mois » replié, sans jargon), 15 (la réponse dit « Entrées : aucune prévue » ; le matériel se compte ou non), 26 (une entrée « Projets de matériel » dans l'écran).
Baseline : horizon, résumé, case projets (devenue interrupteur sur la ligne), « Ajouter une prévision » (→ « Prévoir une sortie »), « Budget d'un brassin » (dans le +, à dire au port), Comparer les mois, Toutes mes prévisions (= la liste), Projets de matériel (ligne ›) : tout reste à un toucher.
Où vit l'écran : Finances › Prévisions, sans sous-onglets (Projets de matériel devient une ligne).

## Honnêteté
Chiffres de la fixture seulement ; « ~ » et « estimé » sur le budget du brassin ; « prix ? » et pastille hachurée pour l'idée sans prix ; 12 mois donnerait « il manquera 1 492,66 » (loyer × 12 = 4 800 + 60 + 64,26 + 750, sans ventes) : non dessiné, à dessiner en passe 2.

## Boosters UX (boosters-ux)
- horizon — choisir ; segments 30 j / 90 j / 12 mois ; la réponse, la barre et les mois changent.
- barre-sorties — lire ; barre empilée en couleurs de catégorie (DESIGN.md) sur la trésorerie ; le reste hachuré = ce qui reste.
- compter-projet — ajuster ; interrupteur sur la ligne du fermenteur ; janvier passe de − 1 150 à − 400, la réponse à 2 857,34.
- Statique (ses mots du 09.11 : « les manquette ont pas besoin d'être jouable ») : les gestes sont dessinés, pas joués ; un second état est à côté.
- B1 OK (3 boosters nommés, effet décrit) · B2 OK (la réponse à 28 px domine ; un seul primaire) · B3 ~ (8 éléments ; 83 mots hors données, > 60) · B4 OK · B5 non mesuré · B6 OK (3 tailles, mono pour les montants) · B7 OK (CONTRASTE OK, COULEURS OK) · B8 OK (annexe « À compléter ») · B9 s.o. (statique) · B10 OK (aucun type="number") · B11 OK (« il restera 2 107,34 CHF fin janvier ») · B12 OK (rayons 10/16, bordure 1 px) · B13 OK (interrupteur 36 × 22, segments 28 px, lignes 42 px).

## Contrôles
- `verifier-page` : PAGE OK · `capturer-1280` : OK · `controle-commun --profil=sans-houblons --sans=mots` (les 6) : **COMMUN OK**.
- `mots-premier-ecran --sans-donnees` : **83** (> 60, le brief ; la liste de 7 lignes et le chrome de l'app en font 20).
- `controle-panel` (les 6) : remplissage 0,519 ; PANEL ECHEC vient de p2a et p2b.

## Tient / casse
- Tient : il reconnaît l'écran d'aujourd'hui, mais la réponse arrive en premier et en un chiffre.
- Casse : l'interrupteur sur une ligne de liste est inhabituel ; « 1 limite › » est une pastille à ouvrir, pas un mot clair.
