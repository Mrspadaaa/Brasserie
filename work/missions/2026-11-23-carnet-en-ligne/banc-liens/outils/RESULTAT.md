OK — OUTILS.md (14 outils, sources datées) + mesures Jina et Chrome sur 63 liens : OUTILS OK jina=63/63 chrome=63/63

## Fichiers écrits
- `banc-liens/OUTILS.md` : tableau, mesures, limites, 3 conclusions, sources.
- `banc-liens/outils/jina/NN.html.gz` (63) + `mesures.json`; `outils/chrome/NN.html.gz` (63) + `mesures.json`.
- `outils/controle-outils.mjs` (critère), `outils/reclasse.mjs` (bloquée/vide, règles v2), `outils/analyse.mjs` + `analyse.json`.
- Travail : scratchpad `.../scratchpad/outils/` (scripts de mesure `jina.mjs`, `chrome.mjs`, `commun.mjs`, `docs/` = pages de doc lues).

## Sortie décisive
```
OUTILS OK jina=63/63 chrome=63/63
pages bloquées : jina=7 chrome=0
```
Jina : 7 bloquées (6, 7, 14, 21, 24, 25, 56) et 7 coquilles vides (8, 16, 18, 57–60). Serveur actuel : 5 bloquées. Chrome : 0.

## Essais
- Critère unique : tenu au 1er passage du contrôle final. Deux corrections en route : (1) règle « bloquée » v1 avait raté bauhaus (« Sicherheitsprüfung ») et jumbo (771 octets) → v2 dans `reclasse.mjs` ; (2) 4 liens du navigateur (6, 7, 14, 15) refaits avec lecture à 3 essais, premiers résultats gardés en `premierEssai`.
- Une regex de prix cassée par le Bash (barres inverses perdues) refaite avec Edit, puis éprouvée par 6 cas dans `analyse.mjs`.

## Doutes et limites
- IP du poste, pas celle de Google Cloud : le 0/63 du navigateur est optimiste ; liens 6 et 14 ont cédé à la 2e visite seulement (cookie). Une mesure depuis Cloud est nécessaire avant de bâtir Puppeteer.
- Coûts de modèle = calculs sur 15 000 e / 1 500 s, pas des mesures. Computer use : estimation grossière (0,12 à 0,24 CHF).
- Non lus : prix `web_search` Mistral, jetons OpenAI, palier Cloud Run de Zurich, conditions d'usage complètes de Zyte/Diffbot/Firecrawl, conditions d'affichage de l'ancrage Google (`search_suggestions`). `url_context` et `web_fetch` face à Cloudflare : aucun comportement documenté.
- Pas de relecture page à page des 126 fichiers : jugement par JSON-LD, prix de la vérité, og:image.
- Ma page Chrome (window.name « outils-liens ») est fermée (0 restante) ; les autres onglets du port 9222 ne sont pas à moi.

## DÉCISION À PRENDRE : tester Diffbot (gratuit, sans carte) et/ou Firecrawl (1 000 crédits gratuits) sur les 28 liens sans prix JSON-LD ?
Options : (a) non, rester sur cascade + Gemini ; (b) inscription Diffbot seule, 63 liens = 63 crédits, 0 CHF ; (c) Diffbot + Firecrawl. Recommandation : (b), car seul outil d'extraction produit gratuit sans carte ; ne rien intégrer avant mesure. Inscription = compte externe : accord du brasseur via le pilote.

## DÉCISION À PRENDRE : mesure du navigateur depuis Google Cloud
Options : (a) fonction Cloud jetable lisant les 63 liens (coût de quelques centimes, un déploiement, hors mon périmètre) ; (b) se fier au poste. Recommandation : (a) avant tout choix de Puppeteer.

CONNAISSANCE : Jina Reader (sans clé) fait moins bien que le fetch simple du serveur sur ce banc (7 bloquées + 7 vides contre 5 bloquées) ; Chrome réel passe les 5 liens bloqués du serveur, dont 3 fiches avec prix ; 28 pages sur 63 n'ont aucun prix en JSON-LD, d'où le besoin d'extraction HTML/IA.
LEÇON PROPOSÉE : un script qui écrit du code par Bash perd les barres inverses (L26 revenu) ; passer par Edit/Write dès la première ligne de regex.
