# Critique 1 — Planning porté dans le Carnet et le Calendrier (20.11)

Critique Opus (Fable interdit), banc local figé de port-carnet 31274df1b, `?preview=carnets&jeu=planning` et `?preview=calendrier&jeu=planning`, 390×844 tactile, 844×340, 1280×800, clair et sombre (Calendrier sombre : banc sans thème, non testé). Captures : `%TEMP%/planning-carnet-critique/`. Verdict : 14 problèmes, 1 bloquant. Montants et dates affichés justes contre la fixture.

| n° | Gravité | Constat | Suite |
|---|---|---|---|
| 1 | BLOQUANT | Calendrier : 3 étapes datées sur 17 visibles ; 13 commencent avant aujourd'hui, la fenêtre ne remonte pas avant la semaine courante ; T-15 hors horizon d'un an | corrigé pour les étapes en cours (T-13, T-19 : semaine de la migration) ; les 11 étapes finies avant le 20.11 restent au Carnet (le Calendrier ne montre pas le passé, choix du Calendrier) : question au brasseur, faites ou non ; T-15 paraîtra quand l'horizon l'atteindra |
| 2 | m | Deux idées la même semaine (S17 2027) : une seule ampoule, sans nombre ; le toucher n'ouvre que la première | PC-2 au registre (Calendrier, bande des semaines) |
| 3 | m | Banc : l'ampoule ouvre « l'Agenda » (le banc ne passe pas `onOpenCarnet`) | à vérifier en ligne (App.tsx le passe) |
| 4 | m | Ordre de la liste : T-10…T-24 puis T-6…T-9 (égalité départagée par id texte) | corrigé : ids à deux chiffres (T-06) |
| 5 | m | Aucune ligne ne montre coût ni date ; total 12 380 CHF nulle part | PC-5 au registre (carte de liste du Carnet : prix des articles seuls) |
| 6 | m | « Coller un lien » répété 19 fois, jalons et SAAV compris | PC-6 au registre |
| 7 | m | Pictos faux ou muets (« bac » → évier ; cible ; lettres) | PC-7 au registre |
| 8 | m | Jalons non distingués (lettre J, statut Idée) | titre « Jalon — … » gardé ; PC-8 au registre |
| 9 | m | Pastille « Idée · 20 nov. » = date de migration, lue comme date prévue | corrigé : création = celle de l'étape au Planning (03.09.2026) |
| 10 | m | Note « À faire du … » répétée sous le titre (ce qui vient ensuite) et en note | PC-10 au registre (dessin du Carnet) |
| 11 | m | « Critère : Budget prévu : … · de votre phrase » | corrigé : « Budget du Planning : 3 500 CHF » ; provenance « vous » gardée (son Planning) |
| 12 | m | 11 étapes à période finie restent « à faire » sans signe | question au brasseur (faites ?) ; rien d'inventé |
| 13 | m | Fiche de jalon : note « à faire », rubriques d'achat | corrigé : note simple « Jalon du Planning, sans date » ; rubriques : dessin du Carnet (PC-13) |
| 14 | m | Taper « évier » ne propose qu'un carnet | PC-14 au registre (rattacher, Carnet) |
