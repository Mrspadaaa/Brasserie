# Vision d1280, 2e passe — carnet porté (1280 × 800, clair et sombre)

Banc : worktree `port-carnet`, `npm run build` vert (exit 0, commit 0fea5f478). Dev `vite` sur `http://127.0.0.1:5191/?preview=carnets`
(le banc est DEV seulement, § Vérification « Bancs » ; `vite preview` ne le sert pas). Variables `VITE_FIREBASE_*` fictives
(projet `banc-fictif`), fixture « ZZ TEST — … », IA simulée. Thèmes : `&theme=clair`, `&theme=sombre`.
Scripts : `scratchpad/vision2.cjs` (passe 1), `vision2b.cjs` (liste et attente de chargement), `vision2c.cjs` (diagnostic menu et volant).
Logs : `scratchpad/vision2-log.json`, `vision2b-log.json`, `vision2c-diag.json`.
Passe 0 écartée : sans variables Firebase, l'app ne démarre pas (`auth/invalid-api-key`), zéro état utile.

Constat de base : `work/missions/2026-11-17-port-carnet/CRITIQUE-1.md` est absent (seul `2026-11-17-port-calendrier/CRITIQUE-1.md` existe).
La liste de référence est donc celle des 7 constats de `vision-1/RAPPORT-d1280.md`.

## États (n° du § Vérification) → fichier → ce qui se voit → agit

Ouvert = image ouverte et regardée ; texte = seulement le texte de page relevé, image non ouverte.

| État | Fichier clair / sombre | Ce qui se voit | Agit | Ouvert |
|---|---|---|---|---|
| 1 liste au repos | `d1280-clair-01-liste-repos.png` / `d1280-sombre-01-liste-repos.png` | Stocks › Matériel, « À venir 1 · Carnets 4 · Réalisés 0 », sections À comparer, Idée, Choisi, En veille ; champ en bas | n/a | clair oui (après attente de chargement : la passe 1 était figée sur « Chargement de la brasserie… ») ; sombre non |
| 2 liste vide | `…-02-liste-vide.png` | Texte : « Aucun carnet encore. Par exemple : Frigo de garde, Ventilation… » | n/a | non |
| 3 créer · avant | `…-03-creer-avant.png` | Liste, champ « Une idée, un besoin… » sans cadre | n/a | non |
| 4 créer · pendant (carnet proche) | `…-04-creer-pendant.png` | Cadre pointillé « Nouveau carnet · Idée », titre « ZZ TEST — Ventilation cuisine, 2 ventilateurs », « Déjà un carnet proche : Ventilation de la salle de brassage », « Y ajouter en façon », « arrive ici » ; bouton d'envoi vert | oui | clair oui ; sombre non |
| 5 créer · pendant, suite | `…-05-creer-pendant-suite.png` | Phrase tapée au clavier, titre allongé « …plus de condensation au plafond, 300 mm » | oui | non |
| 6 créer · pendant, sans carnet proche | `…-06-creer-pendant-sans-proche.png` | Texte : « Nouveau carnet · Idée arrive ici », titre « ZZ TEST — Chariot élévateur pour fûts… » ; présence de « Déjà un carnet proche » non relevée (texte tronqué) | oui | non |
| 7 créer · après | `…-07-creer-apres.png` | **Aucun bandeau « Carnet créé »**, liste identique à l'avant (À venir 1, Carnets 4), aucune carte nouvelle, champ vidé. La phrase n'apparaît nulle part à l'écran | **non** (défaut : envoi sans retour) | clair oui ; sombre non (texte identique) |
| 8 créer · après, annulé | `…-08-creer-apres-annule.png` | Identique à 7 : « Annuler » introuvable, car le bandeau n'existe pas | non | non |
| 9 carnet ouvert, repos | `…-09-carnet-ouvert.png` | Texte : « Ventilation de la salle de brassage », « Ce qui compte », Façons, Articles, tableau « Comparer » | oui (liste → carnet) | non |
| 10 ajouter · avant | `…-10-ajouter-avant.png` | Champ « Ajouter à … » focus sur le carnet | oui (md5 différent) | non |
| 11 texte · pendant | `…-11-texte-pendant.png` | Cadre « ↓ va atterrir ici · tiré de votre phrase · ✕ », « Ce qui compte : fond de bac 38 cm minimum », ligne « les articles seront rangés sur le fond de bac, 38 cm au moins ». **Puces « Va dans · Ce qui compte · Note · Façon » présentes** en bas, champ « fond de bac 38 cm minimum » + « Ajouter » | oui (frappe → cadre et puces) | clair oui ; sombre non |
| 13 texte · après | `…-13-texte-apres.png` | Bandeau « ✓ Rangé dans Évier inox, à l'instant · Annuler » (texte de page) | oui | non |
| 15 lien · avant | `…-15-lien-avant.png` | Champ vide, focus | n/a | non |
| 16 lien · pendant | `…-16-lien-pendant.png` | Cadre « Arrive ici, dans Articles · exemple.invalid/hotte-murale-100-cm · ✻ lecture de la page… », squelette, « nom, prix, photo, cotes : rien d'affiché avant d'être lu ». Titre du carnet : **« exemple.invalid »** (domaine seul ; l'URL complète en citation italique) | oui | clair oui ; sombre oui (même structure, thème sombre lisible) |
| 18 lien · après | `…-18-lien-apres.png` | Bandeau « ✓ Rangé dans Ventilation de la salle de brassage, à l'instant · Annuler », « votre message : « https://… » ». Carte « exemple.invalid » ; compteur 6 → 7 articles, cohérent avec « Rangé » | oui | clair oui ; sombre non |
| 19 2e lien · après | `…-19-lien-2e-apres.png` | Bandeau « Rangé dans … » (texte de page) | oui | non |
| 21 lien illisible | `…-21-lien-illisible.png` | Texte : « ✓ Carnet créé » ; citation « https://exemple.invalid/page-introuvable » ; titre « exemple.invalid » ; pas de nom ni prix relevés | oui | non |
| 22 note · pendant | `…-22-note-pendant.png` | Texte : « ✓ Rangé dans Évier inox, à l'instant · Annuler · votre message : « Acheter 2 vannes inox ; … » » | oui | clair oui ; sombre non |
| 23 note · après | `…-23-note-apres.png` | Idem 22 (bandeau de rangement) | oui | non |
| 25 cartes d'article | `…-25-cartes-article.png` | Carnet « Ventilation », articles listés (texte : « Carnets », « écarté », « moins bien partout ») | oui | non |
| 26 article ouvert | `…-26-article-ouvert.png` | « Articles · Ventilation… 2e sur 5 · Hotte murale 100 cm » | oui | non |
| 27 comparer | `…-27-comparer.png` | Tableau « Côte à côte 5 », « rangé par : tient 80 °C d'abord, puis le débit », 1re à 5e, « moins bien partout » (4e), **colonne « écarté » et ligne « Écarté » visibles**, coupées au bord droit (« Ventilateur de p… »), bouton « Choisir » plein | oui (carnet → tableau) | sombre oui ; clair non |
| 28 choisir | `…-28-choisir.png` | Texte : retour au comparateur « À comparer », « 2 600 Inox Broye · CH en stock · Ouvrir » ; état « choisi » non visible | oui (md5 différent ; contenu non vérifié) | non |
| 30 À venir | `…-30-a-venir.png` | Onglet « À venir 1 », bouton « + Besoin » en haut à droite, carte « PROCHAIN ACHAT · D'abord · prix trouvé · ZZ TEST — Frigo de garde pour fûts 4 900 » (« Ouvrir le carnet », « Modifier »), « Caisse fin de mois ». **Carte collée au bord gauche (x = 0), colonne 680 px, « + Besoin » touche le bord droit** | oui | clair oui ; sombre non |
| 31 Réalisés | `…-31-realises.png` | Texte : « Archives · Tes projets réalisés · Marque un projet comme réalisé pour le retrouver ici » (vide) | oui | non |
| 35 carnet avant suppression | `…-35-carnet-avant-supprimer.png` | **Liste, pas le carnet** : la passe 2c n'a pas ouvert la fiche « Frigo de garde » | n/a | oui (liste) |
| 35 menu ouvert | `…-35-carnet-menu-ouvert.png` | **Liste** : le clic sur le « ··· » (985, 104) n'ouvre rien ; bouton « ··· » non trouvé par son texte ni son aria-label | non joué | oui (liste) |
| 36 supprimer une idée | `…-36-supprimer-idee.png` | **Liste** : « Supprimer » introuvable. Passe 1 (écrasée) : fiche « Frigo de garde » avec pastille « À venir · ZZ TEST — Frigo de garde pour fûts » et « Choisi : Chambre froide en kit 2 m³ » | non joué | passe 1 oui (écrasée) |
| 37 supprimé | `…-37-supprime.png` | Liste, identique : geste non joué | non joué | non |
| 41 IA en échec | `…-41-ia-echec.png` | « ✓ Carnet créé, en tête des Carnets · Annuler », « L'IA n'a pas répondu : rangé sur place, rien n'est perdu. », « Ce qui compte : rien encore », « Façons : aucune », « Articles : aucun : collez un lien » | oui | clair oui ; sombre non |
| 42 IA éteinte | `…-42-ia-eteint.png` | Texte : « ✓ Carnet créé · Annuler », carte « ZZ TEST — Test IA éteinte » | oui | non |
| 43 hors ligne | `…-43-hors-ligne.png` | Texte : « ✓ Carnet créé · Annuler », carte « ZZ TEST — Hors ligne » ; retour réseau non rejoué | oui | non |
| 45 + volant, avant | `…-45-liste-avant-plus.png` | Liste (ouverte pour le geste) | n/a | oui (liste) |
| 46 + volant, après | `…-46-liste-plus-volant.png` | **Bouton « + » du volant absent du banc** (aucun bouton bas-droite) ; liste identique | non joué (non rendu dans le banc) | non |
| 51 aides éteintes | `…-51-aides-eteintes.png` | Texte : carnet « Ventilation de la salle de brassage » ouvert, « À comparer 1 » ; contenu des aides (G11, G25 à G27, G33) non comparé à 51 avec aides | n/a | non |
| 54 tâches | `…-54-taches.png` | Bandeau « Tâche 1 / 5 · Créer « embouteillage » · 0.0 s · 0 geste · ✓ Fait » au-dessus de la liste | n/a | oui |

Non joués, faute de geste dans le banc ou de matériel : 12 (doublon), 14 (ligne éclairée), 17 (lien collé depuis la liste), 20,
24, 29, 32 à 34 (modifier, renommer, IA sur note), 38 (lien qui retient), 39 (clavier 300 px), 40 (IA en cours), 44 (photo),
45 (dictée), 47 (segment Stocks, vu seulement en en-tête), 48 (scénario CARNET-COEUR), 49, 50 (suppression v2 et plan réalisé),
52, 53 (page de choix de la voie E), 55 (pastilles, vues en passe 1 seulement), 56, 57 (calendrier, `?dev-local` non lancé : émulateurs absents).

## Erreurs console

- Passe 2 (clair et sombre, toutes les captures) : 0 erreur `console.error`, 0 `pageerror`.
- Passe 1 (sans variables Firebase, écartée) : `auth/invalid-api-key`, à cause de la config absente, pas du carnet.

## Constats (7 de vision-1, état actuel)

1. Créer · après (7, 8) : **non corrigé**. Pas de bandeau, pas de carte nouvelle, phrase perdue à l'écran. Défaut majeur à relancer.
2. Lien · après (18) : **corrigé en partie**. Le bandeau dit « Rangé dans … », compteur 6 → 7 cohérent.
3. Titre de lien (16) : **partiel**. Le titre est le domaine « exemple.invalid », non l'URL brute ; l'URL reste en citation.
4. Puces « Va dans » (11) : **corrigé**. Présentes en bas, « Ce qui compte » sélectionné.
5. Écartés absents (27) : **corrigé**. Colonne « écarté » et ligne « Écarté » visibles ; coupées au bord droit (défilement non vérifié).
6. Supprimer et Réalisés : **Réalisés** joué (31, vide). **Supprimer** non joué (menu « ··· » non atteint).
7. Captures non regardées : 13 images ouvertes sur 72 (clair et sombre) ; le reste lu par texte ou non ouvert.

## Problèmes relevés (question « combien et quels problèmes ? »)

1. Créer · après : envoi sans retour, carte absente, phrase perdue (7, 8 ; clair et sombre). Défaut.
2. Comparer : colonne « écarté » coupée au bord droit du tableau (27 sombre ; clair à vérifier).
3. Lien · pendant : titre = domaine seul (16 clair et sombre).
4. À venir (30) : carte collée au bord gauche (x = 0) et « + Besoin » au bord droit. Hors carnet, mais dans la même vue.
5. Volant « + » absent du banc (46) : à vérifier en `?dev-local`.
6. Suppression : geste non atteint (35 à 37) ; à rejouer.

Total : 35 états numérotés couverts, dont 28 vus, 2 avec défaut (7, 8), 5 non atteints (35 à 37, 45, 46), sur 56.
Captures : 72 PNG d1280 (36 clair, 36 sombre), dans ce dossier, sans toucher aux fichiers m390 ni emu.
