# Voie fix28-serveur — constats du test en ligne du tour 28, côté lecture des pages (T28-5, 7, 8, 9, 12, 13, 14)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 100 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md, puis DOSSIER.md (même dossier) À LA PLACE des sources brutes ; ouvre une source seulement pour un point qu'il ne couvre pas.

## Économie
- Mécanique : aucune — le banc sans IA est un seul script déjà prêt ; la preuve visuelle se fait en ligne par le pilote.
- Gestes : un script par lot (banc avant/après en une commande, sortie filtrée), lectures par grep ciblé.

## À faire
1. T28-8 (B) : landi Schwerlastregal 180 × 160 × 60 cm → Hauteur 180 cm, Largeur 160, Profondeur 60 ; valeurs et libellés en français.
2. T28-5 : site qui répond mais page absente (404) → « la page n'existe plus (erreur 404) » ; « le site n'existe plus » seulement si le domaine ne répond pas.
3. T28-7 : « Poids net en kg 82 » → Poids 82 kg repris (comparaison comprise) ; aucune mention « non publié ».
4. T28-12, T28-13 : libellés et valeurs en français (anglais et allemand), nombres à la suisse (virgule décimale, unité) ; table des clés connues, ou l'appel IA existant rend en français (aucun appel en plus).
5. T28-9 : détails d'étapes en mots du brasseur (« prix 72,50 CHF », « frais de port 4,90 CHF »), jamais « schema.org », « microdata », « JSON-LD », « données embarquées ».
6. T28-14 : fiche d'un houblon : α, récolte, huiles totales (ml/100 g) en tête (FicheArticle.tsx).
Chaque défaut : test rouge sur la vraie page du banc, puis correction, puis vert.

## Critères
- `cd functions && npx tsc --noEmit` ; tests touchés verts ; banc sans IA : aucun recul (nom, prix, photo) sur les 63 liens.
- Gemini réel : 0. Commit par chemins ; fin : « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : functions/src/** ; src/ui/carnets/FicheArticle.tsx ; src/ui/carnets/fiche-article.css ; tests/unit/ (fichiers de lecture de liens que tu crées ou touches) ; ton dossier de voie.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre) : une ligne par constat (fait, test, commit).
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/fix28-serveur/tests.log 2>&1; tail -5 voies/fix28-serveur/tests.log`.
- Pas de captures locales : la preuve est faite en ligne par le pilote.
