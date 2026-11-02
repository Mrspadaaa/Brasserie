# Reprise — 02.11, soir (lot g, son ticket Bauhaus, et le plateau)

## Objectif
Corriger tout ce qu'il a vu sur son ticket Bauhaus (D328 à D337). Refaire la vue détail d'une ligne sur mini maquettes (D345). Puis
redéployer, mais seulement après le rejeu de son ticket sur le nouveau code et le test d'écran du critique
(`node scripts/agents/controle-avant-deploiement.mjs <sha>` → AVANT-DEPLOIEMENT OK, D342).

## Règles nouvelles (ses mots dans SPEC-BRASSEUR, 02.11 soir)
- D343 : tester d'abord par la vision, sur de vraies pièces ; Vitest pour les règles de calcul seulement ; peu de fixtures.
- D344 : le test d'écran du critique se réduit à « combien et quels problèmes il y a ? », une liste numérotée par capture.
- D341 : retrait des tests inutiles accordé (fait, g5). D346 : c'est nous qui codons ; un port retire ce que sa maquette n'a pas (L03).
- D347 : « À 90% d'usage hebdo, terminé tes tâches ». Lu à 83 % vers 21 h. À 90 % : rien de neuf, état écrit, commit.
- D348 : la diversité du panel plateau se juge sur le plateau seul (liste p3c-3 imposée). D349 : « ✓ au centime », « ✓ 8 lignes » et la
  boîte cochée des rangées reliées restent (sa maquette p3c-3) ; « sûr = rien » ne vaut que pour les ✓ ajoutés.

## Commits locaux (aucun poussé)
ee5e973d, 9f01a55b, 34111348 (méthode, D328 à D347), c7069922 (code du lot g : 2 267 tests verts, tsc, build), 60a8c25f (sorties de tests
retirées de l'index, fichiers gardés sur le disque).

## État des voies
- g2a, g2b, g5 : finis, commités (c7069922). g3-ecarts : fini (`voies/g3-ecarts/ECARTS.md`).
- **g1-audit** : ECHEC partiel (plafond de tours), RESULTAT.md écrit. Sur b3ab392e, M1 à M13 KO comme attendu (M2, M7 non reproduits sur
  doc14). Existants : 122 OK, 4 KO (défauts en ligne : doc6 « Même achat » ne crée rien ; doc14 sans pastille TVA). ~15 captures sur 160
  ouvertes. Sorties : `deploy-hosting-qr/work/missions/2026-10-31-ecran-depense/voies/g1-audit/avant-G1..G4/`. CONNAISSANCE et LEÇON
  PROPOSÉE (mesurer après les animations ; un cas se pose sur le défaut de sa plainte) à traiter à la signature.
- **g6-rejeu** (Haiku) : en cours. `deploy-hosting-qr` détachée par le pilote sur **60a8c25f**, functions/lib reconstruit,
  `scripts/g-banc.mjs` copié. G1 à G4 « apres », puis existants A à D. Rend M1 à M13 avant | après.
- **Plateau** : 16 v0 rendues (pg, pa, pz, pu), tri pt (critique) : classement pu4, pz4, pu3… ; candidates pu4, pz2, pa1.
  Page v0 publiée : https://claude.ai/artifact/HxaxpDdzztLYPrCCnwnMAs (source `choix-plateau/index.html`, images `choix-plateau/img/`,
  non versionnées). Passe 2 rendue : `plateau/v1/pu4b`, `pz2b`, `pa1b`. Verdict du critique en cours → `plateau/critique/RESULTAT.md`.

## Prochaine action, dans l'ordre
1. Verdict passe 2 : relancer ou écarter chaque REJET (2 fois au plus) ; puis page v1, artefact neuf daté (`choix-plateau-v1/`),
   `verifier-page.mjs --page-lot`, ligne dans « ## Pages ». Lien à lui : il choisit.
2. Retour de g6 : rejouer `resumer-mesures.mjs` ; ouvrir moi-même les captures « après » des états touchés ; puis le critique en test
   d'écran (VERDICT.md dans `avant-deploiement/60a8c25f/`), « Pilote : vu », garde. Déployer seulement sur AVANT-DEPLOIEMENT OK
   (étapes de déploiement : summary de la conversation ; copie `deploy-hosting-qr`, `--only hosting` puis `--only functions:aiTask`).
3. Restes : l'écran vide de 18 h 04, D326 (3) à (8), le Malt Vienne, doc6 et doc14 (g1 § 4), la signature de la mission, les lignes
   LEÇON PROPOSÉE et CONNAISSANCE des RESULTAT (g1, pg, pu, pa, pz, pt).

## Risques ouverts
- Le visuel des corrections n'est prouvé qu'après g6 et le test d'écran du critique.
- La vue détail sera refaite après son choix : les corrections du plateau d'aujourd'hui sont provisoires.
- Le `.gitignore` des missions laisse passer les `.json` : les sorties de banc qui portent ses valeurs sont en `.json.txt` ; ne jamais
  `git add -f` un dossier de banc.
