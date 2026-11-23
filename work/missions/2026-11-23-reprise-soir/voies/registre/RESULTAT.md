OK — 30 lignes BL-4..15, GH-1..4, CALP-1..14 revérifiées et datées 23.11 ; BUGS OK (2101 bugs, 483 ouverts)

## Fait
- `work/missions/BUGS.md` : colonnes état, commit et preuve des 30 lignes citées, rien d'autre (git diff : 30 lignes). Script d'application : `voies/registre/appliquer-bugs.mjs` (relit le fichier avant d'écrire, refuse une ligne de forme inattendue). Contrôle : `node scripts/agents/controle-bugs.mjs` → `BUGS OK : 2101 bugs, 483 ouverts, 202 sources` (avant : 490 ouverts).
- Tour 26 : le tag `en-ligne/2026-11-23-tour26` est un objet annoté 1adabb6e4 qui pointe b44b191d3 ; paquet servi relevé en ligne : `index-Bl2OF9G2.js`. Les commits CALP cités (5902333fb, ec3fd3583…) ne sont plus ancêtres du tag : l'historique a été comprimé en 875751dcb (ancêtre, contient `controle-cal-passe.mjs`, `scripts/parcours/calendrier.mjs`, `distinguerHomonymes`…). Le code y est, la preuve est au rendu. Les fixes BL/GH (24099a754, 4edd21a15, 21bd69fd0, c33a68dc5, f558a6e28, b5598cd5f, d57aadea2, 7d86bf6b6, a2661212d) sont ancêtres.
- En ligne (Chrome 9222, onglet neuf 390 × 844 tactile, lecture seule) : captures prises ET ouvertes (c00, c01, c02b, c04, c05, c06, c07, c09, c10, c11, c12, c13, c14, c16) dans `voies/registre/en-ligne/` ; journal `en-ligne/journal.txt`. Aucun enregistrement : la feuille Modifier d'une fête a été fermée par « Fermer ». Aucun appel Gemini. Onglet fermé, `browser.disconnect()`, Chrome intact.
- Local : `scripts/parcours/calendrier.mjs` joué depuis la copie fix-t25 (= b44b191d3, la copie Brasserie n'a pas `vite-plugin-pwa` dans node_modules : build impossible ici) : 55 ok, ECHEC (3). Journal `voies/registre/parcours.log`, captures `parcours-tour26/`.

## Tableau (id, avant, après, preuve)
| id | avant | après (23.11) | preuve |
|---|---|---|---|
| GH-1 | corrigé (aiTask) | corrigé, vérifié en ligne tour 26 | gastro-held ECO 400 rangé, 5 à 10,6 s, tour26/L5-carte.txt |
| GH-2 | corrigé | corrigé, vérifié en ligne | 12 photos, tour26/RAPPORT.md |
| GH-3 | corrigé | corrigé, vérifié en ligne | nom entier, lien entier, L5-carte.txt |
| GH-4 | ouvert — présent | corrigé, vérifié en ligne (c33a68dc5) | « ✓ Article rangé ici » sans « page non lue » : L3, L5, L6, L7 |
| BL-4 | ouvert | corrigé, vérifié en ligne (c33a68dc5, 21bd69fd0) | mêmes bandeaux |
| BL-5 | ouvert | corrigé, vérifié en ligne | banc ia-9 liens 1 et 2 ; 12 photos en ligne |
| BL-6 | ouvert | corrigé, vérifié en ligne | caractéristiques 44/48 au banc ; 22 (gastro-held), 4 (brouwland), 8 (Galaxus) en ligne |
| BL-7 | ouvert | ouvert — non vérifiable en ligne | délai 8 s → 12 s (lireLien.ts:23) ; banc lit la page landi ; la lenteur serveur n'est pas rejouable sans coller (écrit) |
| BL-8 | ouvert | corrigé au banc rejoué, non recollé en ligne | ia-9 lien 15 : 879 EUR |
| BL-9 | ouvert | corrigé, vérifié en ligne | « Kibernetik KS240L » ; banc KS340L, Candy CNCQ2T518EB |
| BL-10 | ouvert | corrigé, vérifié en ligne sur un lien jumeau | même cause que GH-1 ; le lien Mastro n'a pas été recollé |
| BL-11 | ouvert | corrigé, vérifié en ligne | 1 990 € ≈ 1 828 CHF ; brouwland ≈147 CHF TTC ; HT gastro-held |
| BL-12 | ouvert | corrigé, vérifié en ligne | « retire », plus de « no-image » ; 4 vraies photos Galaxus |
| BL-13 | ouvert | **ouvert — présent** (cause précisée) | le vendeur coupe lui-même à 100 car. (curl du JSON de la page : « …Stick on Thermomet - KegLand ») ; `couper()` ne protège que nos coupures |
| BL-14 | ouvert | **ouvert — présent** | Bandeau.tsx:197 et :217 sans décodage ; seule `domaineEtChemin` décode |
| BL-15 | ouvert | corrigé, vérifié en ligne (reste T26-4) | L7-carte.txt : « page non lue : adresse introuvable » ; hornbach « retire » |
| CALP-1 | corrigé (non déployé) | corrigé, vérifié en ligne | poignée de début tirée : 23 nov. → 12 oct. → 3 août 2026 (c02b, c03) |
| CALP-2 | corrigé | corrigé, vérifié sur fixture (non joué en ligne : écrit) | parcours : barre au passé S45 → S41, Annuler S45 ; B8 S53 → S47 |
| CALP-3 | corrigé | corrigé, vu en ligne (critère c non rejoué) | c04 : aucun rond pointillé après un toucher de la courbe |
| CALP-4 | corrigé | corrigé, vérifié en ligne | menu x 8–308, durées sans chevauchement (c01) |
| CALP-5 | corrigé | ouvert — non vérifiable au code | l'étiquette de durée se juge au glisser d'une barre (écrit) ; critères e et b2 non rejoués |
| CALP-6 | corrigé | **ouvert — présent pour les brassins** | deux brassins « Jhhh » (5 et 7 sept.) = deux lignes identiques « Jhhh · coût à venir » (c05, c02b) ; `distinguerHomonymes` ne traite que les achats liés ; fixture : « ligne en double : aucune » |
| CALP-7 | corrigé | corrigé, vérifié sur fixture (non joué en ligne) | parcours : fête, vente, achat, papier, travaux écrits puis relus ; feuille Modifier en ligne à sa date (c07) |
| CALP-8 | corrigé | corrigé, vérifié en ligne | zone sous zéro, ligne 0, « −1 663 CHF à dépenser » (c00) |
| CALP-9 | corrigé | corrigé, vérifié en ligne | poignées x 36–80 et 310–354, 44 × 68 |
| CALP-10 | corrigé | corrigé en partie | semaine en cours teintée d'un bloc ; icône ventes et loyer non visibles dans ses données ; G3 « filtres au premier plan » toujours KO au parcours (décision du brasseur) |
| CALP-11 | corrigé | corrigé, vérifié en ligne (fête seule) | c06 fiche sur place, c07 feuille Modifier, Fermer ramène au Calendrier |
| CALP-12 | corrigé | corrigé, vérifié en ligne | c13 Finances (ventes, achats, travaux, papiers), c14 Brassins, c16 Bord › Agenda › Gérer (brassins, fêtes, activités) |
| CALP-13 | ouvert | **ouvert — présent** | Stocks › Matériel sans lien de section (c11b) ; seuls finances et brassins posés |
| CALP-14 | corrigé | **ouvert — présent** | `deploy-leger.sh` (D440) n'a plus de parcours ; le parcours rejoué : ECHEC (3) = controle-base G2 et G10, B9, C1-GLISSER |

## Essais, doutes, limites
- Essais : parcours `--ref` en échec 2 fois (build de la copie sans `vite-plugin-pwa`), réussi depuis fix-t25 au 3e. Aucun critère n'a passé trois essais.
- Je n'ai pas collé de lien en ligne (écrit dans un carnet) : les BL sont prouvés par les captures du tour 26 (carte, fiche, bandeaux), le banc 63 liens rejoué du 23.11 (`ia-9.json`) et le code. Le banc ne se rejoue pas ici : les pages `NN.html.gz` ne sont pas dans la copie.
- CALP-2, 5, 7 : gestes qui écrivent ; preuve sur fixture seulement. CALP-5 reste sans preuve du 23.11.
- Effets de bord en ligne (locaux au Chrome, sans écriture serveur) : la fenêtre locale de la frise (`laffinee.calendrier.fenetre-locale`) a été remise à sa valeur d'avant ; les onglets Finances (Opérations) et Brassins (Atelier › Carnet) ont été remis comme avant ; l'application s'ouvre maintenant sur Bord (dernier onglet).
- Défauts neufs versés dans les lignes existantes (pas de ligne créée, hors de mon périmètre) : CALP-6 (homonymes de brassins), BL-13 (cause : titre du vendeur), CALP-14 (parcours rouge, porte sans parcours).

DÉCISION À PRENDRE : CALP-14 — le parcours Calendrier échoue (3) sur le tour 26 et ne garde plus la porte (D440). Options : (a) le remplacer par les specs Playwright `e2e/calendrier` dans la porte, (b) le remettre à jour (G2, G10, B9, C1-GLISSER), (c) laisser tel quel. Recommandation : (a), les specs sont déjà la voie choisie (OUTILS.md du 23.11).

CONNAISSANCE : la copie Brasserie (worktree openai-clean-start/Brasserie) n'a pas `vite-plugin-pwa` dans node_modules : tout build y échoue ; builder depuis port-carnet, lot-cal ou fix-t25.
LEÇON PROPOSÉE : aucune
