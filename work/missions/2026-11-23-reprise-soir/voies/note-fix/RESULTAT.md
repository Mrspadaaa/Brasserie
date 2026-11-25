OK — noteRegles 40/40 : note rattachée à son article (fait, vérifier, détacher) et lien d'information jamais article (hash dans la réponse finale)

# RESULTAT note-fix

## Plan (par règle : endroit → correctif)
- **N1 contexte** : `functions/src/carnetIA.ts` (`CarnetCompact.articles` : `id`, `domaine`, `vendeur` ; schéma `articleId` ; `CHAINES` ; consigne « une note qui parle d'UN article… ») ; `src/domain/carnets/ia.ts` `contexteModele` envoie l'id, le domaine et le vendeur ; `lignesRegles.ts` `pourIA` les tire du carnet.
- **N1 garde** : `src/domain/carnets/noteSurArticle.ts` `articleVise` : l'`articleId` de l'IA n'est gardé que s'il est celui d'un article du carnet ET que la citation (sous-chaîne exacte de son message) ne désigne que lui (vendeur, mot de l'adresse, pays du site par la fin de l'adresse). Deux sites .fr : aucun rattachement. Branché dans `lireReponse` (`LigneCarnet.articleId`).
- **N2 fait** : `modele.ts` `Article.notesSur[]` (`NoteSurArticle` : `messageId`, `mots` = SA phrase, `le`, `sujet`, `origine`) lu par `lireArticle` ; `operations.ts` `noterSurArticle` / `detacherNoteArticle` ; écrit dans `poserSuiviIA` (`rangementCarnets.ts`), donc annulé avec le rangement du message. Écran : `FaitNote.tsx` (+ `fait-note.css`) sur la carte (`CarteClassee`, `CarteMatiere`, avec `data-article`), la fiche (`FaitsNoteFiche` + « Détacher ma note », placé après « je prends » : un « % » juste après « ta note » aurait fait lire un score) et la tête de colonne de Comparer.
- **N3** : le fait montre `mots` (sa phrase, sans « ZZ TEST — »), jamais le `texte` réécrit de l'IA ; libellé « dispo douteuse / qualité douteuse / délai à vérifier » ; aucun pourcentage ni confiance. Sujet lu dans SES mots (`sujetDeNote`), absent si aucun des trois : jamais inventé.
- **N4** : `PropositionSuivi.sorte = 'verifier'` (+ `articleId`) posée par `poserSuiviIA` (« Vérifier la dispo chez MotlerHops » ; « le délai » ; rien pour la qualité) ; carte du fil (`FilCarnet.tsx`) avec « Relire » (`BoutonRelire`) et « Non » ; `ecransCarnet.tsx` `verifier` : relit la page de l'article (même `relire` que la fiche : un geste, une lecture), puis la carte part. Rien ne part seul (gardes verts).
- **N5** : (a) `lireReponse` : une ligne « article » dont la page lue n'a ni prix, ni offre, ni photo, ni dispo, ni caractéristique (`pageSansProduit`), sans prix écrit dans le message, devient une note qui garde le lien ; (b) `lireLien.ts` : une page sans fiche produit dont le titre est « Frais d'envoi / livraison / conditions de vente… » (`TITRE_INFORMATION`) rend son montant en `livraison` (port), plus en `prix` (avant : « Frais d'envoi » devenait un article à 7,50 €, lu « sous le titre de la page ») ; (c) `operations.ts` `poserPortDuVendeur` : le port s'applique aux articles du carnet du MÊME site qui n'ont pas déjà le leur, les autres rien (inconnu, jamais 0) ; (d) Comparer dit « port 7,50 EUR » sous le prix rendu de la colonne concernée (`portDit`).

## Fichiers écrits
functions/src/carnetIA.ts, functions/src/lireLien.ts, src/domain/carnets/{ia,modele,operations}.ts, src/domain/carnets/noteSurArticle.ts (neuf), src/ui/carnets/{CarteArticle,Comparer,EtatIA,FicheArticle,FilCarnet,carnetOuvertTypes,ecransCarnet,lignesRegles,rangementCarnets}.ts(x), src/ui/carnets/FaitNote.tsx et fait-note.css (neufs), ce dossier (tests.log, tests-porte.log, tests-porte2.log).
Modèle inchangé (aucune ligne de modèle touchée) ; le paramètre `--modele` du banc n'est pas touché.

## Sortie décisive
- `npx vitest run tests/unit/noteRegles.test.tsx` : 40 passed (40) (tests.log) ; 30 rouges au départ.
- Porte : noteRegles, carnets*, c48 à c59, c6*, c70 à c72 (dont c70RangementIA, c68Realises), lot3CarnetOuvert, rejeu-649b/virgule-transversale, proprietes, integration/stocksMaterielUneRangee, lienNavigateur : 94 fichiers, 2203 passed, 3 skipped (tests-porte.log). Plus tests/integration/carnet*, lot11Carnet, planning-*-carnet, prixRendu, px* : 20 fichiers, 180 passed (tests-porte2.log).
- `npx tsc --noEmit -p .` : les 2 erreurs connues seulement (seedData GanttTask, virtual:pwa-register) ; `functions` : aucune erreur.
- `node scripts/agents/controle-bugs.mjs` : BUGS OK (2389 bugs). Le registre `work/missions/BUGS.md` ne contient aucune ligne « NOTE-n » (NOTE-EXPLOITEE / LIEN-PAS-PRODUIT n'y sont pas versés) : rien à passer à « corrigé en local » ; à verser par le pilote avec le hash.

## Essais
Trois cycles de tests sur noteRegles (34/40, 38/40, 40/40) ; une régression que j'ai causée (Comparer, `portDit` sur un article absent : 114 rouges) corrigée au tour suivant ; une seconde (carnetsRangement P1 : « ventilateur 189,90 CHF » lu sans prix sur la page simulée devenait une note) : un prix écrit dans le message garde la ligne en article.

## Doutes et limites
- **Hors porte, rouges d'une autre voie** : tests/unit/c74Regles.test.tsx R89 et R91 (18 rouges, annoncés par c74-tests, liste des domaines) : non touchés.
- **Pages réelles** : N5 (b) ne lit un port que sur une page dont le titre commence par un mot de frais/livraison/conditions ET qui n'a pas de fiche produit. Les conditions de vente et un guide restent « illisibles » à la lecture réelle (pas de montant à lire) ; seule la lecture du titre et du premier montant est déterministe. Un port écrit autrement (tableau par pays, JavaScript) demanderait l'IA sur le texte de la page : non fait (coût Gemini, pas d'appel réel ici). Aucune page réelle relevée (DEMANDE RELEVE de note-tests inchangée).
- **Pas d'IA réelle** : le contrat `articleId` + `citation` n'a jamais été joué par Gemini ; la consigne l'exige mais seul un relevé le dira. Le garde client est strict (une citation qui ne désigne pas un article seul est ignorée) : l'IA peut donc rater des rattachements, jamais en inventer.
- **Où montrer le fait** (badge, ligne, sous l'article) et le poids du doute sur le rang : laissés à lui (mini maquettes). Choix provisoire : une ligne sous la dispo sur la carte, un bloc sur la fiche après « je prends », sous le nom dans la tête de colonne de Comparer. Le rang n'est pas touché.
- **Hors périmètre non couvert** : le tableau principal du carnet (`TableauCarnet`) et la carte `CarteArticle` (variantes complète et compacte) ne disent pas encore le fait.
- Un `%` suivant « ta note » dans les 200 caractères aurait fait lire un score (test N3) : l'emplacement de la fiche en tient compte ; à revoir si la fiche change.
- Aucune capture : pas de capture locale (VOIE.md) ; preuve en ligne par le pilote et le critique.

## Test qui me paraît faux
Aucun.

DÉCISION À PRENDRE : où montrer « ta note » (carte, fiche, Comparer) et combien le doute pèse sur le rang (rien, signe seul, rétrograde) : mini maquettes pour le brasseur (règle n° 1). Recommandation : pas de rétrogradation tant qu'il n'a pas choisi.
CONNAISSANCE : une page « Frais d'envoi » sans fiche produit se lisait comme un produit à 7,50 € (prix « lu sous le titre de la page ») : le titre fait la différence ; la lecture réelle ne sait toujours rien d'une page sans titre explicite.
LEÇON PROPOSÉE : aucune
