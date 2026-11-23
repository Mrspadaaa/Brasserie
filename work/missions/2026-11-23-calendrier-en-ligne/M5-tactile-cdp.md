# M5 — Gestes au vrai tactile émulé (Chrome DevTools Protocol) — Calendrier en ligne

Date : 22.11.2026. App : https://brasserie-l-affinee.web.app/ (tour 10). Testeur : agent Opus (M5).

## Méthode

- Référence : test de gestes au niveau de l'événement d'entrée (CDP `Input.dispatchTouchEvent`), comme un banc
  d'automatisation tactile Android (UiAutomator / Espresso `GeneralSwipeAction`) : vrais `touchStart` / `touchMove` /
  `touchEnd`, minutage réel, aucun événement synthétique JS.
- Outil : Node + puppeteer-core connecté au second Chrome du brasseur (`http://127.0.0.1:9222`), session déjà ouverte.
  Mon onglet seul, ouvert dans sa propre fenêtre (`Target.createTarget newWindow`, nécessaire : un onglet caché ne
  reçoit pas les touchers), fermé à la fin ; l'onglet du brasseur n'a jamais été touché ; `browser.disconnect()` seul.
- Émulation : 390 × 844, `isMobile`, `hasTouch`, DPR 3, UA Chrome Android 14, `setTouchEmulationEnabled` (5 points).
  Thème clair.
- Gestes (scripts dans le dossier temporaire de session) : moves tous les 12 ms ; tremblement ±1 px (16 ms) ;
  glisser lent 1 s et rapide 150 ms ; doigt amené au bord puis tenu 3 s SANS move ; appui long 900 ms ; double toucher
  50/90/50 ms ; pincement 2 doigts 400 ms ; flick vertical 200 ms ; glisser hors frise (en-tête, onglets).
- Oracles après chaque geste (DOM en appui, capture regardée) : période de l'app (`.pr-ce`) inchangée ; étiquette du
  cadre = pastille d'échelle = graduations ; boîtes de texte de l'en-tête sans intersection ni rognage ; fantôme
  « lâcher ici » absent après le lever ; journal `pointerdown/up/cancel/lostpointercapture`.
- Données : une seule chose créée, « ZZ TEST — M5 — barre » (Fêtes, 23 nov. → 13 déc.), supprimée à la fin (toast
  « Supprimée », 0 occurrence dans la frise et la Liste après rechargement). Vraies choses : relevé `data-chose-id` +
  `aria-label` (date) avant / après chaque série : 13, 14, 19, 12, 12 choses communes, **0 changée**. Aucun geste sur
  une vraie chose. Fenêtre du Calendrier remise à « 6 sem. · S44 – S49 » (état trouvé).
- Captures : `captures-M5/` (en-tête seul 390 × 250 pour la frise, page entière ailleurs). Planches regardées :
  `M-a-6sem.png`, `M-b-2_sem.png`, `M-b-3_mois.png`, `M-b-6_mois.png`, `M-b-An.png`, `M-c-loin.png`, `M-c-pince.png`,
  `M-e-1.png`, `M-e-2.png`, `M-g.png`, `M-h.png`, `M-k.png`, `M-m.png`, plus `00-accueil`, `01-menu-periode`,
  `d02-menu-plus`, `d03-poser-fete`, `d05-fete-nom`.

## Couverture

Jouée (≈ 190 gestes, ≈ 150 relevés) :
- Frise, pour chaque entrée du menu (2 sem., 6 sem., 3 mois, 6 mois, An ; le menu n'a plus 1 / 7 / 30 sem.) et les
  échelles intermédiaires nées des poignées (3, 4, 8, 11, 12, 14, 18, 20, 22, 36 sem.) : tremblement, glisser lent,
  glisser rapide, cadre tenu 3 s au bord gauche puis droit, poignée gauche et droite, appui long, double toucher,
  glisser sur la bande des semaines (11 gestes × 5 échelles).
- Recul loin (12 glissers rapides + bord tenu 2 × 3 s) et retour, avance loin (12 glissers + bord tenu 4 × 3 s), à
  6 sem. et à An ; pincement écarter / serrer sur les rangées ; bouton « Aligner » ; rechargement.
- Barre ZZ : glisser lent / rapide ±1 sem., Annuler (×4), bord gauche (x = 4 et 20, levé tout de suite, tenu 1 et 3 s),
  bord droit tenu 3 s, tirée vers l'en-tête, vers les onglets, glisser vertical, appui long (menu), double toucher,
  tremblement (fiche), toucher après accrochage.
- Calendrier global : menu du + (ouvert, « Poser une fête » joué jusqu'au bout), feuille d'ajout (durée au doigt),
  fiche v02 (date de début au doigt : tremblement, rapide, bord droit et gauche tenus 3 s, appui long), Liste (flick
  haut / bas, balayage horizontal, appui long, toucher sur la ligne ZZ), Supprimer.

Pas jouée : grains Jour / Semaine / Mois choisis directement (vus seulement via les échelles), plein écran, « Cacher
la courbe », « ± », retards (⏱7), Sans date, Trier, Filtrer, pincement sur la courbe de l'en-tête, les six autres
genres du + (créer une vente, un achat… aurait écrit des montants). Couverture estimée : **70 %** des gestes de la
frise et du Calendrier.

## Ce qui tient (non-défauts constatés)

- CAL-PERIODE-APP-FIXE : « Période : Novembre 2026 » inchangée après les ≈ 150 relevés, tous gestes confondus.
- CAL-RETOUR-PASSE : on recule de plus de 52 semaines par chaque geste (cadre glissé, bord tenu) ; butée à S47 2025.
- CAL-FICHE-FRISE / GESTE-DATE-PARTOUT (dans le périmètre joué) : la date de la fiche et la durée de la feuille
  d'ajout se règlent par la même réglette `cal-f-duree` ; date au doigt validée avec « Annuler ».
- Annuler (message) remet la barre à sa date (g10, g12, g14) ; pincement → échelle + « Annuler » (c18, c19) ;
  glisser hors frise (haut, bas, vertical) = `pointercancel`, rien ne bouge (g15 à g17) ; tremblement ±1 px = toucher
  (lecture de la semaine, fiche) ; rechargement : la fenêtre est gardée.

## Défauts

### T10-M5-1 — B — Frise : une barre tirée vers le bord gauche reste accrochée après le lever du doigt
- Geste : 6 sem., barre ZZ (x = 44, rangée Fêtes) glissée jusqu'à x = 4 en 480 ms (40 moves de 12 ms), doigt levé
  aussitôt ; aussi levé après 1 s ou 3 s de tenue immobile ; aussi x = 20 tenue 3 s. Reproduit 5 / 5 (g01, g03, g05,
  g07, h01 ; déjà vu en e08).
- Attendu : au lever, la chose se pose à la date montrée (ou rien ne bouge) et la frise redevient normale.
- Observé : fantôme « S23 · 6 juin · lâcher ici » (selon l'essai S23 à S39) laissé dans la rangée, en-tête figé sur
  « avant / si tu lâches en S23 », cadre disparu ; la fenêtre continue de dézoomer seule après le lever (6 sem. →
  14 → 21 / 22 sem. → 6 mois). Un toucher ailleurs ne libère rien (h02, la fenêtre passe à 21 sem.) ; seul un
  rechargement rend la main. La chose n'a pas été écrite (date inchangée), mais l'écran est inutilisable.
- Cause probable (journal d'événements) : `lostpointercapture` arrive PENDANT le geste (x ≈ 23 à 29), puis le
  `pointerup` tombe sur un autre élément (`cal-lane`, conteneur) que la barre n'écoute plus. Au bord droit, la capture
  tient (g09). Un doigt qui sort de l'écran par la gauche (x < 0, e04) donne le même état.
- Captures : `captures-M5/g01-bord-g-x4-3s.png`, `g05-bord-g-x4-0s.png`, `h01-accroche.png`, `h02-accroche-puis-toucher.png`
  (planches `M-g.png`, `M-h.png`, `M-e-2.png`).

### T10-M5-2 — G — Frise : étiquettes de la courbe empilées, sur la poignée gauche et sur l'étiquette du cadre
- Geste : choisir 3 mois, 6 mois ou An (menu), puis n'importe quel geste du cadre.
- Attendu (CAL-FRISE-ETIQUETTES, CAL-AN-390) : aucune étiquette ne croise une poignée, une autre étiquette ni la
  pastille du cadre.
- Observé : 6 mois / 36 sem. : « Achats −13 » posé deux fois l'un sur l'autre, illisible « A·A·Achats ±13 », sur la
  poignée gauche (b27 à b33). An : « Achats −13 », « ZZ TEST — M3 — achat −37 » et le doublon « A A Achats −13 » se
  chevauchent et touchent la pastille « nov. 2026 – nov. 2027 » (b34 à b44 ; 6 à 12 intersections de boîtes au DOM).
  3 mois / 18–20 sem. : « Achats −13 » coupé par la poignée gauche (b17 à b22).
- Régression de CAL-FRISE-ETIQUETTES et CAL-AN-390.
- Captures : `captures-M5/b27-6_mois-bord-g-3s.png`, `b34-An-depart.png`, `b18-3_mois-poignee-g-40.png`
  (planches `M-b-6_mois.png`, `M-b-An.png`, `M-b-3_mois.png`).

### T10-M5-3 — G — Frise : le cadre ne couvre pas les semaines de son étiquette
- Geste : 6 sem. au départ, puis poignée gauche −40 px, puis poignée droite +40 px.
- Attendu (CAL-ECHELLE-COHERENTE) : étiquette du cadre = dessin du cadre = graduations.
- Observé : le cadre garde la même taille (x 68 → 322) pour 6, 8 et 11 semaines ; sous « S44 – S49 », il couvre de la
  fin de S44 au début de S49 des graduations affichées juste dessous (qui, elles, vont de S44 à S49 sur toute la
  largeur) ; « S42 – S52 » est dessiné sur S43 → S50. La courbe a donc un autre axe que les graduations qui la
  soulignent. Avec « Aligner » allumé, le cadre disparaît (c21). À confirmer par le pilote : si cet axe de contexte est
  voulu, les graduations sous la courbe ne la décrivent pas.
- Captures : `captures-M5/a01-6_sem.-depart.png`, `a07-6_sem.-poignee-g-40.png`, `a08-6_sem.-poignee-d_40.png` (`M-a-6sem.png`).

### T10-M5-4 — G — En-tête : la pastille « −683 CHF à dépenser · S50 » ne suit pas le cadre
- Geste : cadre tenu 3 s au bord gauche (6 sem. → S3 – S8 ; An → S47 2025 – S46 2026).
- Attendu (CAL-AN-390 : « pastille = ce que montre le cadre ») : la pastille parle de la fenêtre montrée.
- Observé : la pastille reste « S50 » (2026) quelle que soit la fenêtre (a05, b16, c02). Son aria dit « sur tout
  l'horizon de la courbe » : choix voulu, mais même symptôme que la plainte de CAL-AN-390.
- Captures : `captures-M5/a05-6_sem.-bord-g-3s.png`, `c02-6sem-recul12.png`.

### T10-M5-5 — m — Bord droit : une barre ne va pas au-delà de la fenêtre ; comportement asymétrique
- Geste : 6 sem., barre ZZ amenée à x = 386 en 480 ms, doigt tenu immobile 3 s, levé (g09).
- Attendu : comme au bord gauche, la frise s'élargit ou défile pour poser plus loin dans l'avenir.
- Observé : rien ne défile ; la barre se pose sur la dernière semaine visible (23 nov. → 28 déc., S53). Au bord
  gauche, la frise dézoome (« si tu lâches en S23 », T10-M5-1). Un seul essai propre ; dans e06 (départ depuis 22 sem.,
  après accrochage), le bord droit a dézoomé jusqu'à 6 mois et posé au 4 oct. 2027 (+45 sem.) : comportement instable.
- Captures : `captures-M5/g09-bord-d-x386-3s.png`, `e06-bord-d-3s.png`.

### T10-M5-6 — m — Cadre tenu au bord : défilement trop rapide pour viser, butée muette à ± 1 an
- Geste : cadre amené au bord gauche ou droit en 600 ms, tenu 3 s.
- Observé : 6 sem. : 35 semaines en 3 s (S38 → S3) ; 3 mois : S47 2025 → S31 2027 (+88 sem.) en 3 s (b16, b17).
  Butée à S47 2025 et S45 2027 : 12 glissers de plus ne bougent rien, sans message ni signe (c02, c09).
- Captures : `captures-M5/b17-3_mois-bord-d-3s.png`, `c02-6sem-recul12.png`, `c09-6sem-avance12.png`.

### T10-M5-7 — m — Libellés de courbe rognés par « … »
- Geste : 2 sem. ou An, cadre au bord gauche (b05, b36, b38, b40, c02).
- Observé : « Vêtements et s… −132 ». Régression CAL-AN-390 (aucun texte rogné à 390).
- Capture : `captures-M5/b05-2_sem.-bord-g-3s.png`.

### T10-M5-8 — m — Échelle An : étiquette et poignée incohérentes
- Observé : même échelle « An », étiquette « nov. 2026 – nov. 2027 » (b34) ou « S47 – S45 2027 » (c01) selon le
  chemin. À An, la poignée gauche tirée −40 px déplace la fenêtre (« juin 2026 – mai 2027 », toujours « An », b40) au
  lieu de l'étirer comme aux autres échelles (6 → 8 sem., a07).
- Captures : `captures-M5/b34-An-depart.png`, `c01-6sem-depart.png`, `b40-An-poignee-g-40.png`.

### T10-M5-9 — d — Années absentes sur des dates d'une autre année
- Observé : fiche, réglette de date : « 18 mai +179 j » (2027, k03) et « 25 mai » (2026, k04) s'écrivent pareil ;
  menu + avec la fenêtre en 2027 : « Noter une idée en S15 », « Poser un brassin S15 · prête le 10 mai » (d02).
- Captures : `captures-M5/k03-fiche-date-bord-d-3s.png`, `k04-fiche-date-bord-g-3s.png`, `d02-menu-plus.png`.

### T10-M5-10 — d — Brouillon de la feuille « Poser une fête » perdu au rechargement
- Geste : + → Poser une fête → durée tirée à 3 sem., nom « ZZ TEST — M5 — barre » tapé (d05), puis rechargement
  de la page (comme un téléphone qui recharge l'onglet).
- Observé : feuille fermée, nom et durée perdus (rien d'enregistré, pas de doublon).
- Capture : `captures-M5/d05-fete-nom.png`.

## Retour

M5 tactile CDP : 10 défauts (B 1, G 3), couverture 70 % — work/missions/2026-11-23-calendrier-en-ligne/M5-tactile-cdp.md
