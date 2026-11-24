PRÊT À METTRE EN LIGNE 77f0fa60d — C46-5 : tout montant d'une chose du Calendrier et d'À venir dit ses centimes

## 1. Inventaire : qui écrit un montant, avec quel formateur (avant / après)

Règle : un montant (d'une chose ou d'une somme de choses) s'écrit avec ses centimes dès qu'il y en a (79,95), sans s'il est rond (80). Formateurs du domaine : `francs`/`francsSignes` (arrondis, avant) ; `francsExacts`/`francsSignesExacts` (exacts, après).

| Endroit | Fichier | Avant | Après |
| --- | --- | --- | --- |
| Bulle de la ligne Achats (et toutes les rangées) : `texte`, `conf`, `lecture` (aria) | frise/Rangee.tsx `pastille()` | francsSignes (« −80 ») | francsSignesExacts (« −79,95 ») |
| Montant à côté d'une barre | frise/Barre.tsx `montantBarre` | francsSignes | francsSignesExacts |
| Montant d'une marque (achat d'un jour) | frise/Marque.tsx `montantDe` | francsSignes | francsSignesExacts |
| Rangées de la Liste | frise/VueListe.tsx `montantDe` | francsSignes | francsSignesExacts |
| Frais d'une chose (carte) | frise/DetailChose.tsx `texteFrais` | francsSignes | francsSignesExacts |
| Montant de la carte | frise/DetailChose.tsx l.249 | francsSignesExacts (déjà) | inchangé |
| Feuille d'ajout : « Oui, 80 CHF », « Garder … », confirmation | frise/FeuilleAjout.tsx | francs | francsExacts |
| Hypothèses de la courbe (solde de départ, budget repris, tendance) | useDonneesCalendrier.ts | francs / francsSignes | francsExacts / francsSignesExacts |
| Bande des semaines (mouvement de la semaine, aria), lecture au doigt (variation, mouvements, « la semaine »), tendance, écart du glisser, étiquettes de la courbe | entete/Courbe.tsx `sg` (utilisé par BandeSemaines, LectureCourbe, DetailCreux, zoom) | francsSignes | francsSignesExacts |
| Causes du creux (« Table −79,95 ») | entete/DetailCreux.tsx | chf (arrondi) | `chfExact` (nouveau) |
| Mouvement nommé sur la courbe, « mis de côté » | entete/Courbe.tsx `sgExact`, l.247 | exact (déjà) | inchangé |
| À venir (carte, Total, Achats liés, axe) | finance/UpgradeWorkspace.tsx `chf0`, `francsExacts` | exact (voie e47) | inchangé ; test ajouté |

## 2. Restent arrondis (repères ou soldes, pas le montant d'une chose)

- `chf` (Courbe.tsx) : solde libre et « CHF à dépenser » (en-tête, creux, paliers « ensuite … dès S12 », niveau « Solde … », niveaux de la grande courbe), graduations d'axe (Courbe.tsx l.851, GrandeCourbe l.207), « avant → après » du « si tu lâches » (deux soldes), creux de BandeAnnee.
- DetailChose l.423 « Libre de la semaine » (un solde).
- Raison : un solde est un cumul avec le départ ; les écrire au centime élargirait l'en-tête à 390 px (légende « CHF à dépenser » déjà au plancher, L-58) sans que ce soit le montant d'une chose. Si le brasseur veut aussi les soldes au centime : voir DÉCISION.
- Garde dans le test : `calendrierCentimes.test.tsx` liste les seuls appels arrondis restants dans src/ui/calendrier (Courbe.tsx : 1 ; DetailChose.tsx : 1). Un nouveau `francs(`/`francsSignes(` fait échouer le test.
- Contre une décision écrite de la voie e47 (commentaire de Courbe.tsx : « les totaux (solde, écarts, semaines) gardent les francs entiers ») : la bulle de la ligne et la semaine sont des SOMMES DE CHOSES ; le critique 49 a vu « −80 » au-dessus de « −79,95 ». Commentaire remplacé.

## 3. Hors OWNS, formateurs arrondis du domaine (non touchés)

src/domain/calendrierCaisse.ts (`libelleMouvement`, `lectureSemaine.tete`/`lignes.texte`, palier `texte`), calendrierAjout.ts `libelleMontant` (puces de l'ajout), calendrierGestes.ts l.106 et l.540, calendrier.ts l.567/639/657/1216 (textes de détail, « échéance … · 80 CHF »). Leur rendu visible : `libelleMontant` (puces « +80 » à toucher dans la feuille d'ajout) et `lectureSemaine.lignes` (UI les remplace par `sg`). À traiter par une voie qui possède src/domain/calendrier*.ts : ils ne sont pas dans mon OWNS.

## 4. Test rouge puis vert

- `tests/unit/calendrierCentimes.test.tsx` (11 tests : pastille, somme de deux achats, montantBarre, Marque, VueListe, `sg`, LectureDetail, DetailCreux, `chf0` d'À venir, repère `chf`, garde de source).
- Rouge LANCÉ avant correction : `voies/frise-centimes/tests-rouge.log` — 9 échecs sur 11 (« expected '−80' to be '−79,95' », « −160 » pour −159,95, …) ; les 2 verts d'alors : `chf0` (déjà corrigé par e47) et le repère `chf`. Le test DetailCreux a été revérifié rouge en remettant `chf` un instant, puis rétabli.
- Vert : `tests.log` 11/11.

## 5. Critères

- tsc : 2 erreurs connues seulement (seedData GanttTask, virtual:pwa-register) — `tsc.log`.
- Tests calendrier (29 fichiers touchés ou liés) : 1 échec trouvé (`calendrierAjout.test.ts` : regex attendait « −157 » entier ; le texte dit maintenant « −157,85 », la règle) ; regex élargie à `(?:,\d\d)?`. Voir `tests-cal.log`.
- `npx vitest run tests/unit/proprietes` : 8 fichiers, 76 tests verts (`tests-prop.log`).
- Suite complète tests/unit (`tests-tout.log`) : 12 311 verts, 5 échecs sans lien avec les montants du Calendrier : `hopReclasserIA`, `designTokens` (degré de palette), `gemini38LiveProof`, `geminiModelRouting`, `stock/murDonnees` (ordre Fumé/Sucres, src/domain/stock : interdit). `rejeu-649b/virgule-transversale` : 29 violations dont les miennes sont `francsExacts(…) CHF` (FeuilleAjout x3, useDonneesCalendrier x1) mais aussi `chf(…) CHF`, `francs(r.cents) CHF` du domaine, EssaiPrix, murAutres : le contrôle ne reconnaît pas ces formateurs de centimes, il échouait déjà avant (mêmes lignes de `chf`/`francs`) ; non repris ici.
- Registre : `node scripts/agents/controle-bugs.mjs` → BUGS OK : 2221 bugs, 510 ouverts, 202 sources ; C46-5 « corrigé en local 94ef0d465 ».
- Commits : 94ef0d465 (code, test, RESULTAT), 77f0fa60d (ligne C46-5 de BUGS.md seule).
- Pas de capture locale (consigne de la voie) : preuve en ligne par le pilote et le critique : ouvrir le Calendrier, un achat à 79,95 CHF, frise : bulle Achats « −79,95 » au-dessus de la carte « −79,95 » ; en-tête « CHF à dépenser » sans débordement.

## Doutes et limites

- Largeur : « −79,95 » est plus large que « −80 » : barres, marques et pastille de rangée à 390 px peuvent tronquer plus tôt. Les mesures de mise en page (`largeurEtiquette`, `couperNom`) lisent la même fonction `montantBarre`, donc cohérentes ; à regarder en ligne (non vérifié visuellement ici).
- Une somme avec beaucoup de centimes (−1 234,56) allonge la pastille ; non mesuré.

DÉCISION À PRENDRE : les soldes (« CHF à dépenser », creux, paliers, niveau de la courbe) restent-ils en francs entiers ? Option A (retenue) : entiers, ce sont des repères ; option B : au centime comme les choses (risque de débordement de l'en-tête à 390). Recommandation : A, car aucune chose n'a ce montant ; si le critique le relève, B se fait en changeant `chf` seul (une ligne, Courbe.tsx l.21) et la garde du test.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : un correctif de formatage se fait sur la règle (grep de tous les formateurs `francs(` d'un dossier) et se garde par un test de source qui liste les appels arrondis autorisés ; e47 avait corrigé la cible, pas la règle (C46-5 rouvert au tour 49).
