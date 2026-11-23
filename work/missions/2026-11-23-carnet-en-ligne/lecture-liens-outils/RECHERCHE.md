# Outils Google (et concurrents) pour lire une page produit à partir d'un lien

Recherche du 23.11.2026, sources officielles lues quand possible. Cas : lien d'un vendeur, site qui peut bloquer les robots ; sortie : nom, marque, prix, devise, TTC/HT, livraison vers la Suisse, photos, caractéristiques, rien d'inventé.

## 1. « Carbone, oxygène »

- **Carbone = Gemini 4 Carbon, confirmé.** Modèle phare de Google, lancé le 10.11.2026 (accès cyber deux semaines avant). Famille Gemini 4 nommée d'après des éléments : Argon, Carbon, Hydrogen, Neon (Neon sorti le 18.11). API via Google AI Studio (payant) ; 1 M de jetons de contexte. Prix : 2 $ entrée / 10 $ sortie par million de jetons jusqu'au 30.11, puis 4 $ / 20 $. Pas de palier gratuit.
  - https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-carbon-now-available/
  - Prix : https://aistudio.google.com/docs/pricing (ex ai.google.dev/gemini-api/docs/pricing)
- **Oxygène = « Gemini 4 Oxygen » : rumeur non confirmée.** Aucun produit officiel. Nom apparu le 15.11 sur des comptes sociaux, présenté comme un futur modèle « Flash » ; absent de la liste des modèles, des prix et du journal des versions (état au 19.11, selon ofox.ai, source tierce). Les sorties « Oxygen » vues sur Arena étaient étiquetées Hydrogen. Non confirmé par Google. Ne pas bâtir dessus.
  - https://ofox.ai/blog/gemini-4-upcoming-models/ (tiers)
- Deux autres noms circulent (Krypton, Helix) : aussi des rumeurs.
- Pour le grounding, Carbon n'a pas de fonction propre : c'est un modèle qui accepte les mêmes outils (Google Search, url_context, computer use). Les docs lues ne montrent pas qu'il lit mieux une page ; il raisonne plus, donc coûte plus. Hydrogen (1,50 $ / 7,50 $) et Gemini 3.5 Flash-Lite (0,30 $ / 2,50 $) acceptent aussi url_context et la recherche Google.

## 2. Tableau

| Outil | Ce qu'il fait pour ce cas | Prix | Compte / clé | Suisse / Europe | Test tout de suite avec la clé Gemini ? | Doc officielle |
|---|---|---|---|---|---|---|
| **url_context (Gemini API)** | Donne jusqu'à 20 URL au modèle ; lit HTML, JSON, PDF, images. Cherche d'abord dans un index (cache), sinon fetch en direct. Paywall non lu ; pas de rendu JS documenté. | Aucun supplément : jetons d'entrée du contenu lu, au tarif du modèle (ex. 3.5 Flash-Lite 0,30 $/M entrée). | Clé Gemini API existante. | Suisse listée dans les pays de l'API ; UE : États membres listés un à un. | **Oui.** | https://aistudio.google.com/docs/url-context |
| **Ancrage Google Search (google_search)** | Le modèle cherche et répond avec citations (url_citation). Utile pour retrouver une page, vérifier un prix ou des frais ailleurs ; pas pour lire une page précise. Combinable avec url_context. | Gemini 3+ : 5 000 requêtes/mois gratuites, puis 14 $ / 1 000 ; plafond 1 500/jour (palier payant). Gemini 2.5 : 35 $ / 1 000 prompts. | Clé Gemini ; palier payant pour dépasser le gratuit. | Doc sans restriction régionale propre (non confirmé). | **Oui** (3.x et 4 supportés). | https://aistudio.google.com/docs/google-search |
| **Computer use (Gemini)** | Un agent pilote un vrai navigateur (clics, défilement, formulaires) : seul moyen documenté pour un site en JavaScript ou à clics (choisir « Suisse » pour la livraison). Modèles : 3.5 Flash et plus, 4 Hydrogen/Argon/Carbon. | Tarif des jetons du modèle, sans frais séparé. GA fin octobre selon une source tierce ; la page officielle lue ne le dit pas. | Clé Gemini API ou Gemini Enterprise Agent Platform. Navigateur à fournir soi-même (Playwright) dans un bac à sable. | Régions non précisées. | **Oui pour le principe**, mais demande une boucle de code et un navigateur : plus lourd. Les CAPTCHA ne se contournent pas (interdit par les conditions). | https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/computer-use |
| **Gemini 4 Carbon / Argon / Neon / Hydrogen** | Modèles, pas des outils d'ancrage. Les 4 acceptent url_context, google_search, computer use. | Carbon et Argon 2/10 $ (4/20 $ dès le 1.12), Neon 3/15 $, Hydrogen 1,50/7,50 $, par M de jetons. | Clé Gemini ; pas de palier gratuit sauf Hydrogen. | Idem API. | Oui si l'identifiant apparaît dans le compte (à vérifier : un rapport du 1.11 ne trouvait pas Carbon dans l'API ; le blog du 10.11 dit disponible). | Prix ci-dessus |
| **Vertex AI / Gemini Enterprise Agent Platform : ancrage** (Google Search, Web Grounding for Enterprise, Maps, Agent Search ex Vertex AI Search, RAG Engine, Parallel web search) | Même idée côté Google Cloud. « Agent Search » ancre sur *vos* sites ou documents, pas sur un site tiers au hasard. Web Grounding for Enterprise : index web avec contrôles de conformité. | Recherche Google : par requête (5 000 gratuites/mois, 14 $/1 000 selon une page ; une page plus ancienne donne 35 $/1 000 : incohérence non tranchée). Prix Agent Search : non lus. | Projet Google Cloud + facturation ; pas la clé Gemini simple. | Régions Europe : non confirmé. | Non (autre compte). | https://docs.cloud.google.com/vertex-ai/generative-ai/docs/grounding/overview |
| **Grounding API / check grounding** | Page non lue : non confirmé. D'après son nom, elle vérifie qu'une réponse est soutenue par des sources fournies : utile en contrôle final, pas en lecture. | Non confirmé | Cloud | Non confirmé | Non | Non retrouvé |
| **Merchant API (Google Shopping)** | Sert à gérer *son propre* catalogue dans Merchant Center ; rien n'indique qu'elle lise les produits d'un autre vendeur. Content API for Shopping arrêtée le 18.08.2026. | Non précisé | Compte Merchant Center | — | Non | https://developers.google.com/merchant/api/guides/products/overview |
| **Custom Search JSON API (pagemap)** | Résultats de recherche ; pagemap non confirmé par la page lue. **Fermée aux nouveaux clients ; fin pour les clients existants le 1.1.2027.** À écarter. | 100 req./jour gratuites, puis 5 $/1 000 (clients existants) | Moteur de recherche programmable | — | Non | https://developers.google.com/custom-search/v1/overview |
| **Web fetch d'Anthropic (concurrent)** | Récupère une URL donnée, HTML et PDF, avec citations. Ne rend pas le JavaScript ; refuse selon robots.txt (url_not_allowed) : un site qui bloque les robots échouera. | Aucun supplément, jetons seulement (page moyenne ≈ 2 500 jetons). | Clé Anthropic (distincte). | Disponible sur API Claude, AWS, Google Cloud, Foundry ; régions non précisées. | Non (autre clé). | https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-fetch-tool |
| **web_search OpenAI (concurrent)** | Recherche + actions open_page / find_in_page (modèles de raisonnement). | Facturé par appel, montant non lu | Clé OpenAI | Non couvert | Non | https://developers.openai.com/api/docs/guides/tools-web-search |

Non évalués faute de lecture : Perplexity Sonar, Firecrawl, Jina Reader, Browserbase et autres extracteurs ou navigateurs distants.

## 3. Ce que je n'ai pas pu confirmer

- Aucune doc lue ne dit comment url_context se comporte face à un site qui bloque les robots, ni si la lecture en direct passe un anti-bot. Elle dit seulement : index d'abord, fetch en direct sinon. Seul un essai le dira.
- Compatibilité url_context + sortie JSON imposée (schéma) : non précisée ; la doc mentionne l'appel de fonctions avec Gemini 3 et 4.
- Disponibilité de Carbon dans l'API de notre clé : à vérifier dans la liste des modèles.
- Régions de Vertex et du computer use ; prix d'Agent Search ; page « check grounding » ; statut GA exact du computer use.
- Aucun prix ou restriction propre à la Suisse ou à l'UE dans les pages lues.
- TTC/HT et frais vers la Suisse : aucun outil ne les fournit seul ; ils dépendent du contenu de la page.

## 4. Recommandation

1. **Premier essai (aujourd'hui, clé existante) : url_context sur Gemini 3.8 Flash ou 3.5 Flash-Lite**, sortie en schéma JSON avec valeur « absent » explicite pour ce qui manque (TTC/HT, livraison Suisse) et un extrait de texte source par champ, pour vérifier qu'on n'invente rien. Mesurer sur les 50 liens du banc ; noter les sites en échec.
2. **Pour les échecs : ancrage Google Search combiné à url_context** (5 000 requêtes/mois gratuites) : retrouver la page chez le fabricant ou ailleurs ; marquer « trouvé ailleurs », jamais « lu sur la page ».
3. **Pages en JavaScript ou à clics (livraison Suisse) : computer use** avec Playwright en bac à sable, modèle 3.5 Flash ou Hydrogen ; plus coûteux, réservé au repli. Pas de contournement de CAPTCHA.
4. Carbon et Argon ne sont probablement pas nécessaires pour de l'extraction (à mesurer). Oxygen : ignorer.
5. À écarter : Custom Search JSON (fermée), Merchant API (catalogue du vendeur lui-même), Vertex (autre compte, gain non démontré).
