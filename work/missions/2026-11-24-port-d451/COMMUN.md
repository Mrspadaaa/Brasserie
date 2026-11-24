# Commun aux voies du port D451

À lire avant DOSSIER.md. Le plan : PLAN.md, même dossier que ce fichier (modèle de données, interfaces figées, ce qui disparaît, risques).

## Exigences transversales (L05 : recopiées ici pour chaque voie)
1. Règle n° 1 : la maquette est la base, reprise telle quelle (structure, ordre, libellés, jetons, couleurs d'état). Un port
   retire ce qu'elle n'a pas, garde ce qu'elle a (L03). Plancher à enrichir (L07) : un défaut de la maquette se corrige
   (VERDICT § Retouches), une idée neuve ne s'ajoute pas.
2. Gardé tel quel dans l'app : barre de lecture d'un lien et ses 5 états (CHOIX.md), Escalader (D449), accord champs/IA
   (D450), Relire, prix HT, CHF et frais (D447), barre du bas, + volant, hors ligne.
3. Densité : « ça manque un peu de compact, c'est pas assez dense » (CHOIX.md) ; docs/ui-compacte.md, DESIGN.md ;
   donnée ≥ 70 % de l'écran (B5) mesurée sur vraies pièces.
4. Honnêteté : l'inconnu est absent, jamais 0 ni « ? » inventé ; un exemple est marqué « exemple » ; l'IA ne cite que ses
   mots (citation = sous-chaîne exacte) ; jamais `type="number"` (saisie mobile : `inputMode`).
5. Ne pas surapprendre ses exemples (B23, « Il faut pas overfiter au exemple ») : aucune règle, regex ni libellé taillé sur
   vapeur, écoulement, fusible, Citra ; les tests emploient aussi des cas neufs (fête, assurance, photo seule, chambre froide).
6. Chaque proposition de l'IA s'annule d'un toucher ; retenir, dater, résoudre, veiller restent à lui (carte OK · Non).
   MESSAGE-RESTE-DANS-SON-CARNET : un message tapé dans un carnet ouvert reste dans ce carnet.
7. Téléphone d'abord : 390 × 844 en défilant, puis 1280 ; clair et sombre ; 390 × 660 et 844 × 340 pour le champ.
8. En ligne (pilote et critique) : chaque actionneur joué sur un carnet « ZZ TEST — … », Enregistrer compris, puis retiré ;
   un constat n'existe que versé à work/missions/BUGS.md.

## Tenue
- N'écris que dans ton Possède (VOIE.md) et ton dossier de voie. `git status --short` avant de rendre.
- Tests : `npx vitest run <fichiers> --reporter=dot > <dossier de voie>/tests.log 2>&1; tail -5 <…>/tests.log`.
- Tests existants : une assertion ne se modifie que si elle porte sur un élément de « Ce qui disparaît » (PLAN.md), avec
  `// D451 disparaît n° k`, listée dans RESULTAT.md. Tout autre rouge se corrige dans le code.
- Gemini jamais réel dans un test ordinaire ; IA simulée (`iaSimulee.ts`).
- Pas de captures locales obligatoires : preuve en ligne par le pilote et le critique ; une capture prise se regarde.
- Code écrit avec Write ou Edit, jamais par un heredoc ou `sed` (barres inverses perdues).
- Commit par chemins à la fin, message « D451 <voie> : … » ; fin de RESULTAT : « PRÊT <hash> » ou ECHEC.
