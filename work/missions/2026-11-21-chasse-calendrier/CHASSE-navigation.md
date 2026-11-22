# Chasse Calendrier — regard « navigation et périodes » (21.11)

Version jugée : tag `en-ligne/2026-11-21-tour8` (build de test `vite.parcours.config.mjs`, `?dev-local&finance-demo=parcours-calendrier`, fixture ZZ TEST, jamais Gemini).
Jeu : 390×844 tactile (CDP `touchStart/Move/End` et `touchscreen.tap`), 1280×800 souris, thème clair puis cave (attribut `data-theme="cave"`). Échelles jouées : 2 sem., 6 sem., 3 mois, 6 mois, An, vue Liste. « 17 sem. » n'existe pas dans le menu (2 sem., 6 sem., 3 mois, 6 mois, An, plus Jour/Semaine/Mois) : on ne l'atteint qu'en tirant le cadre. Aujourd'hui du banc : samedi 21 nov. 2026 (S47).

Résultat : **13 défauts : 1 bloquant, 6 gênants, 6 mineurs.** Rien de ce qui suit n'est dans les lignes CAL-* de DEFAUTS-RECURRENTS (CH-navigation-2 est la forme encore présente de CAL-PERIODE-LIBRE, cité pour mémoire).

Les captures citées sont dans
`C:\Users\mrspa\AppData\Local\Temp\claude\2574149e6fd34767\16fc09ec-4e69-48a9-9744-5912b6ef6552\scratchpad\nav-nav\caps\` (désignées ci-dessous par `caps/…`). Les scripts rejouables sont dans le dossier au-dessus (`nav-nav\t1.mjs` à `t24.mjs`, `lib.mjs`).

Vocabulaire : la « barre » est la barre du haut de l'app (« ‹ Nov. › » + loupe), période de TOUTE l'app ; la « pastille » est le bouton noir « Nov. ▾ » de l'en-tête du Calendrier ; le « cadre » est le rectangle de période sur la courbe.

---

## CH-navigation-1 — bloquant — Les flèches ‹ › de la barre sortent de l'horizon du Calendrier : la barre dit une période, le Calendrier en montre une autre, sans un mot

- **Geste** : Calendrier, 390 tactile. (a) Choisir « An » ; toucher ‹ deux fois. (b) Choisir « 6 sem. » ; toucher › trente fois. (c) « 6 sem. », ‹ quatre fois.
- **Attendu** : la frise et la barre disent la même période ; au bout des données, la flèche s'éteint ou le Calendrier le dit.
- **Constaté** :
  - (a) barre « 26.11.24–24.11.25 » (puis 2023, 2022 en continuant), pastille « An », mais le Calendrier montre J F M A M J J A S O N D de 2026 et le cadre « janv. – nov. 2027 » ; bandeau « Période : 26 nov. 2024 → 24 nov. 2025 · toute l'app ». Le menu, lui, dit « 5 janv. 2026 → 3 janv. 2027 ». Capture `caps/t3-an-prec2.png`, et `caps/t24-An-regle.png` (barre 25.11.25–23.11.26, courbe vide à gauche).
  - (b) barre « Septembre 2029 » ; le Calendrier est passé tout seul à « 2 sem. · S44 – S45 2027 », rangées vides avec leurs grandes pistes vides. Aucun message. Capture `caps/t19-01-butee-avant.png`.
  - (c) barre « 24 nov. 2025 → 4 janv. 2026 », Calendrier resté à S2–S7 (5 janv. – 15 févr. 2026). Même chose en 6 mois (barre « 27 mai → 24 nov. 2025 », frise S2–S22).
  - Le pas n'est pas le même selon le genre de période : un mois (« Nov. ») avance sans borne (septembre 2029), une plage (6 sem., 3 mois, 6 mois, An) butte en silence à environ +1 an (An : 1er › passe de « 26 oct. 2026 → 24 oct. 2027 » à « 24 nov. 2026 → 22 nov. 2027 », les suivants ne font plus rien, 6 mois bute à « 25 mai → 22 nov. 2027 » sur 25 semaines au lieu de 26) et recule sans borne.
  - Flèche jamais désactivée (`disabled=false`) ni muette aux bornes.
- **Fichier probable** : `src/components/periode/periode.ts:122-137` (`pas`, sans borne ni lien avec l'horizon) ; `src/ui/calendrier/entete/Fenetre.tsx:31-49` (`fenetreDePeriode` écrête au premier lundi, ou rend `null` et laisse l'ancienne fenêtre) ; `src/components/periode/PastillePeriode.tsx:47` (`disabled={!ok}`).
- Cela vaut aussi à 1280 (mêmes valeurs lues).

## CH-navigation-2 — gênant — En « An », l'étiquette du cadre de la courbe ne dit pas la période choisie (forme encore présente de CAL-PERIODE-LIBRE)

- **Geste** : Calendrier, choisir « An » (390 ou 1280) ; lire le cadre sur la courbe ; toucher › puis ‹.
- **Attendu** : le cadre dit la période de la barre (26 oct. 2026 → 24 oct. 2027), et change avec elle.
- **Constaté** : « janv. – nov. 2027 » partout, fixe, alors que la bande de mois dessous est « O N D J F M A M J J A S O » (puis « N D J… N », puis « J F M… D »). Valeurs lues : `t24` (cadre `janv. – nov. 2027` avant, après › et après ‹). Captures `caps/t3-an-suiv.png`, `caps/t16-An.png` (1280 cave). En 2, 6 sem., 3 et 6 mois l'étiquette est juste (« S44 – S16 2027 »).
- **Fichier probable** : `src/ui/calendrier/entete/Fenetre.tsx` (composant du cadre, `CadreProps`, autour de la ligne 62).

## CH-navigation-3 — gênant — « 2 sem. » ne pose pas deux semaines autour d'aujourd'hui, et pas deux fois la même

- **Geste** : Calendrier au repos (barre « Nov. », 6 sem. S44–S49) ; pastille ▾ › « 2 sem. ». Puis, séparément, « An » puis « Jour »/« 2 sem. ».
- **Attendu** : le choix pose la fenêtre à cette durée, à un endroit qui contient aujourd'hui (S47) ; toujours la même règle.
- **Constaté** : depuis « Nov. » la fenêtre est « 26 oct. → 8 nov. » (S44–S45) : aujourd'hui, la semaine en cours, le « Maintenant » et le jour 21 nov. sont hors champ ; une seule ligne montrée, trois retards au-dessus. Depuis « An » la même touche donne « 16 → 29 nov. » (autre règle). Depuis « Mois » puis › puis « Jour » : « 26 avr. → 9 mai 2027 » (conserve la date de départ). Capture `caps/t16-2sem.png` (1280 cave : S44/S45, bandeau « Échelle Jour : période 6 sem. → 2 sem., Finances aussi »).
- Les autres durées (6 sem., 3 mois, 6 mois, An) contiennent aujourd'hui dans ce parcours, mais seulement parce que la fenêtre de départ le faisait ; une fenêtre déjà avancée garde sa date de début (« 6 sem. » depuis « 24 août → 22 nov. 2027 » = S34–S39 2027).
- **Fichier probable** : le rappel de la pastille dans `src/components/tabs/CalendrierTab.tsx` (autour des lignes 212-228, `fenetre`/`periodeLocale`) et `src/ui/calendrier/entete/MenuPeriode.tsx:128-135` (`onChoisir`, `onEchelle('jour')`).

## CH-navigation-4 — gênant — Les boutons de l'en-tête déplacent toute la frise (±, règle, Trier) : forme neuve de CAL-ENTETE / VUE-SAUTE

- **Geste** : Calendrier 390 tactile, 6 sem. Mesurer le haut de la frise (`[data-frise]`) ; toucher ± ; retoucher ± ; puis la règle ; puis pastille ▾ › « Trier les rangées ».
- **Attendu** : un réglage d'affichage ne bouge pas le calendrier sous le doigt (CAL-ENTETE : « des tailles fixes car SI non ça fait bouger le calendrier »).
- **Constaté** (haut de la frise en px) : repos 210 ; ± allumé 222 (+12) ; règle allumée 232 (+22) ; la frise redescend de la même valeur à l'extinction. « Trier les rangées » insère un segment « Urgent / Date / Montant » au-dessus des rangées : le premier « Brassins » passe de y ≈ 223 à y ≈ 275 (lu sur la capture). Choisir « 2 sem. » grandit l'en-tête de 149 à 166 px. Captures `caps/t5-03-regle-on.png` (règle : courbe et libellés plus hauts, frise descendue), `caps/t22-01-trier.png`.
- **Fichier probable** : `src/ui/calendrier/entete/EnTete.tsx:698-730` (boutons, hauteur de la courbe et de la bande qui suit leur état), `entete.css`.

## CH-navigation-5 — gênant — Carnet › « Au calendrier » arrive sur un Calendrier où le projet n'est pas montré

- **Geste** : onglet Brassins › Atelier › Carnet › ouvrir « ZZ TEST Projet chambre froide » (daté +3 mois) › « Au calendrier ›».
- **Attendu** (K2 : « ça nous transférer sur le calendrier ») : le Calendrier s'ouvre sur sa semaine, la chose posée, visible.
- **Constaté** : le Calendrier s'ouvre en « Févr. » (S5–S8), tout est « vide », le projet n'est nulle part : ni barre, ni jalon, ni fiche, ni sélection. Seule une petite ampoule sous « S7 » existe, et seulement après avoir touché ± (réglage caché). Vérifié en 3 mois, An, vue Liste : le texte « chambre froide » n'apparaît nulle part. Captures `caps/t12-02-au-calendrier.png` (ampoule absente) et `caps/t13-pm.png` (ampoule sous S7 avec ±).
- Le contrôle `parcours/calendrier.mjs` étape K2 ne regarde que la colonne de la semaine, pas la chose.
- **Fichier probable** : `src/ui/carnets/CarnetsVue.tsx:1386-1391` (`auCalendrier` : événement `{ date }` sans identifiant de chose) ; `src/App.tsx:984-988` (`ouvrirChoseCalendrier`) ; `src/domain/calendrier.ts:906` (`iconesIdees`, l'idée n'est qu'une icône de bande).

## CH-navigation-6 — gênant — Le saut vers une chose change la période de TOUTE l'app, et elle y reste au retour

- **Geste** : même parcours que CH-navigation-5, puis geste retour du téléphone.
- **Attendu** : revenir au Carnet comme on l'a quitté ; la période de l'app ne change pas pour un simple coup d'œil.
- **Constaté** : avant, barre « Nov. » ; après « Au calendrier », « Févr. » ; au retour, l'écran Brassins › Atelier porte « ‹ Févr. › » (liste filtrée sur un mois sans rien, Finances aussi). La même chose avec la loupe : « Marché de Noël » › Entrée : barre « Déc. » partout. Capture `caps/t12-03-back.png` (barre « Févr. » sur Brassins), `caps/t9-03-apres-enter.png` (Calendrier en Déc., la fête non sélectionnée).
- **Fichier probable** : `src/App.tsx:984-988` (`setGlobalTimeFilter` dans `ouvrirChoseCalendrier`).

## CH-navigation-7 — gênant (à rejouer en ligne) — Hors ligne : un retard touché échoue, recharger donne la page « dinosaure »

- **Geste** : Calendrier chargé, `setOfflineMode(true)` ; pastille, ‹ ›, ±, œil de courbe : tout répond. Puis compteur de retards › toucher « Hefe ».
- **Attendu** (règle « préserver le hors ligne ») : l'écran du brassin s'ouvre, ou un message clair avec la donnée locale ; le rechargement hors ligne rend l'app.
- **Constaté** : bandeau « Impossible de charger cet écran. Vérifie la connexion puis recharge l'application. Recharger l'appli » (le morceau de code de Brassins n'a pas encore été chargé) ; rechargement : page Chrome « Appuyez sur le dinosaure », `ERR_INTERNET_DISCONNECTED` (`caps/t15-04-reload-offline.png`). `public/` ne contient que `brew-alerts-sw.js` (alarmes) : pas de cache de l'application par un service worker (`src/services/brewAlarms.ts:22`).
- **Limite** : mon banc sert le build par un petit serveur sans en-têtes de cache ; sur l'hébergement réel le cache HTTP peut garder les morceaux déjà visités. À rejouer en ligne : premier lancement, puis hors ligne sans avoir jamais ouvert Brassins.

## CH-navigation-8 — mineur — Un retard touché fait quitter le Calendrier ; la croix ne le rend pas, le retour du téléphone oui

- **Geste** : compteur de retards (horloge « 3 ») › toucher la ligne « Hefe » › fiche du brassin › croix en haut à droite.
- **Attendu** : on est parti du Calendrier, on y revient (comme « Ouvrir le brassin », CAL-PASSE/CT4A-12).
- **Constaté** : la croix laisse sur la liste Brassins (barre « 26.10–06.12 »), le Calendrier n'est plus là ; le retour du téléphone le rend. Deuxième retour : quitte l'application (l'historique ne contient que la page ; les onglets ne posent pas d'entrée). Capture `caps/t7-03-apres-croix.png`.
- Le compteur lui-même est juste : 3 retards, « Reporter demain » sur Hefe donne « 2 en retard » et Hefe au 22 nov. au retour.
- **Fichier probable** : `src/ui/calendrier/entete/Retards.tsx` / `EnTete.tsx:709` (la ligne ouvre le brassin sans `poserRetour('calendrier')` côté croix).

## CH-navigation-9 — mineur — Le réglage ± n'est pas gardé au rechargement, alors que les autres le sont

- **Geste** : 3 mois, ± allumé, courbe cachée, œil « Masquer Fêtes » ; recharger la page.
- **Attendu** : mêmes règles pour tous ces réglages d'affichage.
- **Constaté** : période, courbe cachée, rangée masquée reviennent ; ± retombe à éteint (`aria-pressed=false`).
- **Fichier probable** : `src/components/tabs/CalendrierTab.tsx:229` (`useState(false)`) à côté de `useEtatGarde` (lignes 230-233).

## CH-navigation-10 — mineur — Plein écran en portrait : la barre ‹ › et la loupe disparaissent, un bandeau couvre la dernière ligne

- **Geste** : 390 tactile, 6 sem., bouton plein écran (coin droit de l'en-tête).
- **Attendu** : pouvoir encore changer de période d'un toucher ; rien de couvert.
- **Constaté** : l'en-tête de l'app passe à 0 px (ni ‹ ›, ni loupe) ; la période ne se change plus que par la pastille ; le bandeau noir « Tourne le téléphone : 13 semaines » couvre « Loyer du local » et reste à l'écran sans geste. Capture `caps/t14-01-plein.png`. En portrait, « Échap » ne rend pas la main (seul le bouton bleu, bien visible, le fait ; à vérifier sur vrai Chrome, l'automate n'envoie pas la touche au navigateur).
- **Fichier probable** : `src/ui/calendrier/pleinEcran.ts`, `EnTete.tsx:725`.

## CH-navigation-11 — mineur — Au défilement, ‹ › et la loupe partent, la pastille reste : reculer d'un mois oblige à remonter tout en haut

- **Geste** : 6 sem., défiler de 268 px (fin de page) ; chercher ‹.
- **Constaté** : l'en-tête de l'app est à `top = −268` (non collé) ; l'en-tête du Calendrier reste collé (top 0) avec la pastille, mais sans flèches. Capture `caps/t21-01-scroll400.png`.
- **Fichier probable** : en-tête de `src/App.tsx` (non `sticky`).

## CH-navigation-12 — mineur — La recherche mène au bon mois mais ne montre pas la chose

- **Geste** : loupe › « Marché » › Entrée (la ligne « Marché de Noël · Calendrier · 22.12 · fête »).
- **Constaté** : le Calendrier passe en « Déc. » (S49–S53), la fête est dans la rangée Fêtes, mais ni sélectionnée, ni fiche ouverte, ni surlignée : même défaut qu'en CH-navigation-5. La palette n'est pas une recherche du Calendrier (« Calendrier » apparaît comme simple pastille de contexte). Capture `caps/t9-03-apres-enter.png`.
- **Fichier probable** : `src/App.tsx:975-988` (`ouvrirDateRef`/`ouvrirChoseCalendrier`, date seule, sans identifiant).

## CH-navigation-13 — mineur — Le menu de période double ses réglages et sa pastille se lit mal

- **Geste** : pastille ▾ ; choisir « 2 sem. », « Jour », puis « Mois ».
- **Constaté** : deux rangées pour la même chose : « Jour » et « 2 sem. » sont cochés ensemble, « Semaine » et « 6 sem. » aussi, « Mois » et « 6 mois » ; choisir « Mois » change la durée en 6 mois (bandeau « Échelle Mois : période 6 sem. → 6 mois, Finances aussi ») et retire la bande des semaines ; la pastille en 2 sem. dit « 2 sem. · j » (le « j » n'est pas un mot du brasseur). Le menu ouvert dit « Nov. · S44 – S49 · 26 oct. → 6 déc. » en tête, et la barre dit une troisième forme (« Novembre 2026 », « 26 oct. → 6 déc. », « 26.10–06.12 » selon l'endroit). Captures `caps/t1-02-menu.png`, `caps/t23-01-mois.png`.
- **Fichier probable** : `src/ui/calendrier/entete/MenuPeriode.tsx:128-146` (la ligne « Échelle » au-dessus des durées).

---

## Ce qui tient (rien à reprocher)

- Mémoire de la période au rechargement : la barre, la pastille, la fenêtre (2 sem., 3 mois, An, après › sur 2 sem.), la courbe cachée et l'œil des rangées reviennent (`t8`).
- Passage Finances / Brassins / Calendrier par la barre d'onglets : période et échelle gardées (3 mois, 6 sem.).
- « Calendrier de l'argent » et « Calendrier des brassins » : rangées de la section, « Tout le calendrier » ; le retour du téléphone ramène à l'écran d'origine (Finances, Brassins).
- Compteur de retards : trois lignes cohérentes avec la frise, la liste, « Reporter demain » (compte 2 au retour).
- Taps rapides sur › : quatre taps, quatre mois (« Nov. » › « Mars 2027 »), sans perte.
- Bouton œil de rangée : « Masquer »/« Afficher » nommé, « 2 choses cachées », gardé.
- Filtre par type : « Ventes seules · 6 rangées masquées · Tout afficher », non gardé au rechargement (voulu, E39).

## REPRISE (agent arrêté à 200 k, hook jetons)

Fait : 13 défauts écrits et prouvés par captures ouvertes (liste ci-dessus). Restent, pour le pilote ou un exécutant Haiku :
1. Retirer les jonctions AVANT le worktree (sinon `git worktree remove --force` peut suivre la jonction) :
   `cmd //c "rmdir C:\Users\mrspa\AppData\Local\Temp\chasse-nav\node_modules"` puis `cmd //c "rmdir C:\Users\mrspa\AppData\Local\Temp\chasse-nav\functions\node_modules"` ;
   puis `git worktree remove --force C:/Users/mrspa/AppData/Local/Temp/chasse-nav`, `git worktree prune`, et supprimer `C:\Users\mrspa\AppData\Local\Temp\chasse-nav-build`.
   Vérifier ensuite que `C:\Users\mrspa\.codex\worktrees\openai-clean-start\port-carnet\node_modules` existe toujours.
2. Commit par chemins : `git add -f work/missions/2026-11-21-chasse-calendrier/CHASSE-navigation.md` puis `git commit -m "Chasse Calendrier : regard navigation et periodes (13 defauts)" -- <ce chemin>`, message terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ».

## Limites et tours

- Tours : parcours principal (menu, ‹ ›, ±, règle, œil, retards, plein écran, loupe, onglets, retour, rechargement, hors ligne) ; deuxième tour (bornes, An/6 mois, section, Carnet, Liste, Trier, Filtrer, Mois/Jour) ; troisième tour (étiquettes du cadre par échelle, cave 390) : plus de défaut neuf, seulement des confirmations. Arrêt.
- Non joués : paysage 844×390 (autre regard), vrai téléphone, « Sans date » (0 dans la fixture, la ligne du menu n'apparaît pas), glisser du cadre et des barres (autres chasseurs), thème cave en 390 pour chaque échelle (un seul passage : `caps/t24-00-cave390.png`, ouvert, rien de neuf).
- Banc sans service worker ni en-têtes de cache : CH-navigation-7 à confirmer sur l'hébergement.
