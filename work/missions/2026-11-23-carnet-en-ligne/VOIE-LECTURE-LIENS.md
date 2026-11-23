# Lecture des liens — contrat (une page)

Base : banc-liens/ (RAPPORT, defauts BL-4 à BL-15, verite/). Copie : lecture-liens. Décisions D446 (cascade schema.org → HTML →
Flash-Lite → 3.8 Flash + url_context ; désaccord signalé, rien inventé ; banc permanent rejouable sans l'app), D447 (prix hors CHF
converti + frais : douane, TVA d'import, port, envoi ; lus sur la page si donnés, sinon « + douane et port non comptés »).

Ajout 23.11 (ses mots : « Tu peux même en ajouter et être un peu plus difficile ») : porter le banc à 50 liens au moins, avec
des cas plus durs : variantes de produit (taille, couleur) avec prix différents, prix barré et promo, prix « dès », lot ou
pack, prix au kg/litre, rupture de stock, page multilingue, pages JS lourdes (rendu client), marketplaces (Amazon.de, Ricardo,
eBay), sites suisses de brasserie (Hopfen und Malz, Brauwelt, Maltomat…), liens raccourcis et partagés depuis une appli,
EUR sans TVA suisse, livraison vers la Suisse payante ou refusée. Vérité écrite pour chacun (page ouverte, champ par champ).
Mesure avant/après chaque changement ; objectif prix et photo affichés ≥ 90 %, caractéristiques ≥ 70 %, zéro invention.
Cycle inchangé : PRÊT → EN LIGNE → rejeu en ligne dans des carnets ZZ ouverts, retirés ensuite ; budget IA 1,5 CHF au total.

Ajout 23.11 (« C'est vraiment les bon outil Ia, tu es sûr ? ») : le choix d'outil se MESURE sur le banc (L20), pas par défaut :
comparer sur les mêmes 50 liens (a) la cascade avec Flash-Lite, (b) Gemini 3.8 Flash avec url_context ET ancrage Google Search
(retrouve prix/caractéristiques ailleurs quand la page bloque), (c) une API d'extraction produit dédiée (Zyte, Diffbot) —
(c) demande un compte externe : préparer seulement la comparaison sur leur offre d'essai SANS créer de compte, le pilote
demandera l'accord. Tableau : justesse par champ, temps, coût par lien. Choix écrit dans « ## État de l'art ».

Ajout 23.11 (« Regarde les autres IA, outils Google... ») : élargir la comparaison, d'abord sur dossier (doc officielle, prix,
compte nécessaire, ce qu'on peut tester sans compte), puis mesurer ce qui est testable sans nouveau compte :
- Google : Custom Search JSON API / Programmable Search (pagemap schema.org Product de l'index Google, contourne les blocages),
  Gemini grounding Google Search, url_context, Vertex AI Search, Merchant/Shopping (probablement hors cas : marchand requis).
- Autres IA : Claude (Haiku/Sonnet, API Anthropic), Mistral, modèles ouverts ; GPT seulement pour la comparaison écrite.
- Outils d'extraction : Zyte, Diffbot, Firecrawl, Jina Reader (r.jina.ai : lecture de page en texte, gratuit sans clé),
  navigateur sans tête (Puppeteer en fonction serveur).
Tableau final : justesse par champ sur les 50 liens (mesurée, ou « non testé : compte requis »), temps, coût par lien, compte
requis oui/non, risque. Recommandation ; tout nouveau compte ou service payant attend l'accord du brasseur (pilote).

## Ajout du 23.11 : outils Google à mesurer (RECHERCHE.md, commit 86ede5202)
- « Carbone » = Gemini 4 Carbon (10.11, 2/10 $ par M jusqu'au 30.11) ; « Oxygen » = rumeur, ignorer.
- Ajouter au comparatif mesuré, sur les 50 liens, dans le budget de 1,5 CHF : Gemini 4 Hydrogen (1,50/7,50 $) et Carbon, chacun avec url_context (+ google_search en repli) ; vérifier d'abord que leurs identifiants sont listés par notre clé (models.list), sinon le noter.
- Computer use de Gemini (navigateur Playwright local) : mesurer sur les seuls liens en JavaScript ou bloqués que la cascade rate ; jamais de CAPTCHA contourné.
- Écarter : Custom Search JSON API (fermée), Merchant API (son propre catalogue seulement).
- Chaque appel réel au journal ia-journal.jsonl.
- 23.11, ses mots : « carbon sera trop lent ». Carbon retiré du comparatif ; Hydrogen reste, temps de réponse mesuré pour chaque outil.
- 23.11 : ajouter Gemini 4 Neon (sorti le 18.11, 3/15 $), chronométré, coupé s'il dépasse le temps de 3.8 Flash. Argon : écarté, même gamme que Carbon.
- 23.11 (IA-ETAPES-VISIBLES, ses mots : « découper les tâches en sous tâches. Et voir si tu es correcte ») : la cascade est découpée en sous-tâches nommées (page lue, données structurées, prix, devise et frais, photos, caractéristiques, contrôle), chacune rend un statut contrôlé (trouvé / absent / douteux) et le serveur l'écrit au fil de l'eau pour que l'app l'affiche ; testé au banc.
- 23.11, mesure Gemini (5e8297d2a, liens 26–41) : url_context plafonne à 81 % sur le prix (mêmes échecs 27, 32, 36), 0 photo, caractéristiques 79 % (Hydrogen, 5,1 s médian) ; Neon coupé (10,7 s) ; 0,988 CHF pour 0,8 permis (pages de 111 k jetons). Décision du pilote : plus d'url_context sur page brute ; prix et photos par schema.org et HTML, l'IA (Flash-Lite, Hydrogen en escalade) lit seulement le texte nettoyé, tronqué, avec le coût réservé avant chaque envoi. Reste du budget de comparaison : 0,25 CHF.
- 23.11 : Diffbot écarté pour l'instant (pas de compte). Les 28 liens sans prix JSON-LD se lisent par la 2e marche : microdonnées et méta (itemprop, og:price, product:price), puis texte visible nettoyé (prix près de CHF/EUR, format 1.000,00), puis l'IA sur ce texte. Objectif inchangé : prix ≥ 90 % sur les 63.
- 23.11, ses mots : « non 90% sur les échecs ». Objectif : prix juste ≥ 90 % sur les 28 liens sans JSON-LD, mesuré à part (et ≥ 90 % sur les 63). Marche 3 = la façon dont Claude lit une page : HTML converti en texte propre (markdown, bibliothèque standard type Readability + turndown), puis l'IA extrait de ce texte. Parser HTML (htmlparser2) pour la marche 2.
- 23.11, ses mots : « Caractéristiques, c'est vraiment aussi important ». Objectif des caractéristiques relevé à 90 %, comme le prix et la photo (sur les 63 et sur les liens sans JSON-LD).
- 23.11 (pilote) : marche « plateforme » avant l'IA, sans compte : données de boutique exposées par la plateforme (Shopify /products/<handle>.js, WooCommerce /wp-json/wc/store/products, Shopware, Magento), données embarquées dans la page (__NEXT_DATA__, __NUXT__, window.__INITIAL_STATE__), onglets « Technische Daten » rendus par Chrome sans écran si absents du HTML, fiche technique PDF liée lue en dernier. Mesuré au banc.
