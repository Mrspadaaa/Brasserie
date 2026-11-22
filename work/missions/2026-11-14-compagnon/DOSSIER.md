# Dossier de conception — compagnon brasseur (14.11)

Lire ce dossier à la place des sources ; ouvrir seulement les captures citées et DESIGN.md (sections « Deux régimes », « Dimensions compactes », « Cibles », « Do's and Don'ts »).

## La question de l'écran
Le brasseur, les mains occupées, demande quoi faire : agir maintenant, mesurer d'abord, ou laisser faire ? Le compagnon répond par **un geste court**, son **impact**, puis **le prochain contrôle** ; les calculs, limites et sources restent repliés (`docs/compagnon-brasseur.md`). Ses mots : « surtout regarde pour l'aide au brasseur » (14.11) ; « Met le à la place de 3.8 pas beaucoup plus long et pas mal mieux » (l'analyse tourne désormais sur un modèle plus fin : 13 à 20 s en Auto, jusqu'à 220 s au plus). Et : « J'ai l'impression que tout les écrans sous les boutons de ces Tabs ne sont pas traitées ??? » — chaque vue et chaque état doit avoir sa maquette.

## La base (ce qu'il a aujourd'hui, plancher à enrichir, L07)
Feuille du bas (`Sheet`) : titre « Compagnon brasseur » + nom de la recette ; ligne de contexte « Brouillon en cours · contexte actualisé à chaque question » + icônes « Mes conversations » et « Réinitialiser » ; « Me notifier à la réponse » ; « Limites IA » repliable ; accueil « On regarde ça ensemble. » + 3 questions suggérées ; en pied : segment Rapide / Auto / Approfondi, champ « Décris ce que tu observes… », Envoyer. Une réponse : bulle de question, carte « Compagnon · date », titre (résumé), action, pourquoi, « Prochain contrôle », question de suivi, fournisseurs, proposition applicable (cases, avant/après, « Écarter » / « Valider N modifications »), détails « Conseil relu · calculs et sources », « Garder dans les notes du journal » (brassin).

Captures (dossier `work/missions/2026-11-14-compagnon/analyse/cap/`) : `planche-390-clair.png` (les 17 états), `e09-390-clair.png`, `e11-390-clair.png`, `e06-390-clair.png`, `e17-390-clair.png`, `e01-390-cave.png`.

**À garder** (acquis du fonctionnement) : rien n'est appliqué sans cases cochées puis validation explicite ; question gardée sur l'appareil hors ligne ; « Tu peux continuer ailleurs » (la réponse reste dans le fil) ; trois modes (rapide, auto, approfondi) ; questions suggérées selon l'écran et la phase ; remise à zéro confirmée ; « Mes conversations » ; notification à la réponse ; limites de dépense réglables ; « Reformuler » et « Relancer » sur une erreur.

## Défauts à corriger (`ANALYSE.md`, 14 points)
Les plus lourds : (1) noms de modèle et de fournisseur à l'écran — **interdit** ; (2) chrome de 5 rangées avant la conversation, mode toujours affiché ; (3) l'accueil s'ouvre sur les limites dépliées ; (4) attente longue muette (un chrono et « Cette étape prend du temps ») ; (5) réponse sans hiérarchie de décision, mur de texte de même poids ; (7) avant/après en colonnes de texte ; (9) trois erreurs identiques (serveur, budget, réseau) ; (10) hors ligne non annoncé avant l'envoi ; (11) « Mes conversations » sans état, corbeilles rouges au premier plan.

## Données réelles à utiliser (vraies valeurs, pas de lorem)
- Recette « New England IPA », 19 L, brassin 31 en fermentation J+4 à 19 °C ; dry hop Citra J+2 85 g, Galaxy J+6 43 g, Mosaic J+9 43 g (171 g, 9,0 g/L) ; pH de maische visé 5,3 ; DF relevée 1,012.
- Question : « La fermentation est à 19 °C depuis 36 h et la pression monte doucement : que faire ? » ; 2e question en file : « Et combien de jours de garde à 18 °C ? »
- Réponse attention : résumé « Dry hop chargé : réduis le dernier apport. » ; action « Passe Mosaic J+9 de 43 g à 21 g. » ; pourquoi (6 phrases sur l'herbacé, 9,0 g/L, la garde) ; prochain contrôle « Goût et odeur à la purge, à J+9 : note si l'herbacé apparaît. » ; question « Veux-tu que je prépare la proposition de réduction du dernier apport ? »
- Proposition : Citra J+2 85 → 70 g ; Mosaic J+9 43 → 21 g ; durée du dry hop 2 → 3 j.
- Urgent : « La cuve dépasse 24 °C : refroidis maintenant. » ; action « Ouvre la circulation de glycol et contrôle la température toutes les 30 min. »
- Fournisseurs : Citra T90 pellets 100 g, Houblons Suisses SA, 9,50 CHF, annoncé en stock ; Galaxy T90 100 g, Brasserie Service Romand, 11,20 CHF, indisponible.
- Finances : bouton « Vérifier mes opérations » (onglet Opérations) ; question « Vérifie les incohérences de mes opérations enregistrées : doublons possibles, paiements, classement du matériel et pièces à compléter. » Autres entrées : Comprendre mes dépenses, Préparer un achat de matériel, Prévoir mes prochains paiements, Préparer l'année 2026.
- Mes conversations : New England IPA (réponse prête), Brassin 31 · Blonde de garde (en cours 0:40), Brassin 29 · Stout (échec, à relancer), Mes finances (réponse prête).
- Attente : étapes réelles du serveur — lire le brassin et le journal, calculer (recette, IBU, dry hop, pH), chercher des sources (si besoin), rédiger, relire (deux relectures pour achats, finances, propositions, gestes sensibles). Durée typique Auto 15 à 30 s ; Approfondi 1 à 3 min ; borne 220 s.
- Limites : 4 questions aujourd'hui sur 120 ; budget du mois 2,10 CHF sur 15 CHF ; « Suspendre l'IA ».

## Exigences (obligatoire, et rien d'autre)
1. **Aucun nom de modèle ni de fournisseur d'IA** (ni Gemini, Google, Hydrogen, Flash, Pro, 3.8…), ni « USD ». Les modes se disent par ce qu'ils font. La relecture se dit par ce qu'elle a contrôlé (« calculs refaits », « 3 sources lues », « relu deux fois »). Le plafond se dit « Budget IA du mois atteint » avec sa sortie (régler les limites), sans lien externe.
2. **Premier plan léger, détail à un toucher** (DESIGN.md « Deux régimes ») : chrome compact (la conversation prend au moins 70 % de la feuille à 390 hors clavier), lecture claire (réponse 14 px au moins, titre 16 à 18 px). Pas de paragraphe d'explication permanent.
3. **Penser en brasseur** : la réponse commence par le verdict et le geste, avec ses nombres et unités ; le niveau (info / attention / urgent) se lit sans lire.
4. **Au doigt à 390 px** ; cibles selon DESIGN.md « Cibles » ; jamais `type="number"` ; saisie en pied de feuille, police 16 px. Virgule décimale partout (9,50 CHF).
5. **Deux thèmes** : clair et cave, mêmes jetons (DESIGN.md : cave-950 #12100E, cave-900 #1A1613, cave-800 #2C2521, cave-400 #9A8A7E, cave-200 #D8CEC5, cave-50 #F5F0EA ; hop #6E9B5B ; attention #E3B55D ; alert #D6453D ; area-finances #86B9E6). Police Source Sans 3 puis pile système, aucune police chargée du réseau ; IBM Plex Mono (ou monospace) pour les nombres lus.
6. **Honnêteté** : « Conseil relu » = seconde analyse IA, pas une garantie ; stock « annoncé », jamais confirmé ; rien d'appliqué sans validation.
7. Icônes au trait d'une seule famille (SVG inline, style lucide), pas d'emoji.
8. Interdits techniques : page statique, aucun appel réseau, classes préfixées par l'id (`a1-…`), script éventuel dans une fonction immédiate (L26).

## Indicatif
- Boosters UX possibles : pastille de niveau, frise d'étapes pendant l'attente, jauge de durée, bascule de mode compacte dans le champ, avant → après en barres, puce « Prochain contrôle » gardée au journal en un geste, fil de conversations à statuts, bandeau hors ligne avant l'envoi.
- À 1280 : la feuille peut devenir un panneau latéral ; facultatif en v0.

## Cadres exigés
Une page `etat.html`, cadres de 390 × 760 côte à côte (un téléphone chacun, la feuille ouverte sur un fond d'écran estompé), chacun marqué `data-cadre="…"` :
- v0 : `accueil` (depuis le jour de brassage, fermentation J+4), `attente` (2:29, une 2e question en file), `reponse` (réponse attention longue + proposition applicable, détails repliés), `erreur` (hors ligne : envoi à confirmer).
- passe 2 (candidates) : en plus `finances` (entrée « Vérifier mes opérations »), `conversations`, `plafond`, `urgent`, `fournisseurs`, `limites` (réglages ouverts), `zero` (repartir à zéro).

Captures : `<id>-clair.png` et `<id>-cave.png` de la page entière (deviceScaleFactor 2 ; cave = `data-theme="cave"` sur `<html>`), toutes ouvertes avant de rendre. Rendu : `node scripts/agents/verifier-page.mjs <etat.html>` doit rendre PAGE OK.
