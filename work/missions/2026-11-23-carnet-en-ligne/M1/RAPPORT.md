# M1 — Tests exploratoires en sessions : le Carnet en ligne (tour 12)

Date : 23.11.2026, 02:43 à 03:15 (UTC). App : https://brasserie-l-affinee.web.app/, paquet **index-zpcbYIem.js**
(vérifié avant chaque série). Testeur : agent M1 (Opus). Défauts : `defauts.jsonl` (28). Captures : `captures/` (83,
dont 44 ouvertes et regardées ; seules celles-là sont citées).

## Méthode

Session-Based Test Management (James et Jonathan Bach, 2000 ; Hendrickson, *Explore It!*) : une charte « Explorer
<zone> avec <ressource> pour découvrir <risque> », une session minutée, un journal, puis les défauts et les questions.
Après chaque geste : capture regardée, « combien et quels problèmes ? », mesure DOM ou réponse réseau en appui.

Outil : Node + playwright-core `connectOverCDP('http://127.0.0.1:9222')` sur son Chrome ; MON onglet dans une fenêtre
neuve (`Target.createTarget newWindow`), émulation Pixel 7 390 × 844 (puis 390 × 544 clavier simulé, 390 × 660,
844 × 340), DPR 3, UA Android, `setTouchEmulationEnabled` ; chaque toucher, appui long et glisser par CDP
`Input.dispatchTouchEvent` (un vrai doigt minuté) ; saisie au clavier. Petit serveur local qui garde la page et reçoit
les gestes. Fin : `page.close()` puis déconnexion, jamais `browser.close()` ; l'onglet du brasseur n'a pas été touché.

Limite de préparation : son service worker servait le **tour 11** (index-Cmzen8eH.js) même après un rechargement sans
cache ; le serveur, lui, sert zpcbYIem. J'ai contourné le service worker pour MON onglet seulement
(`Network.setBypassServiceWorker`) : tout ce qui suit est joué sur le tour 12 (CA12-M1-20).

Données : seulement « ZZ TEST — M1 — fermenteur conique inox 30 L, budget… », créé, enrichi, placé, puis supprimé
avec son plan (disparition vérifiée dans Carnets, la recherche, À venir et le Calendrier de janvier 2027). Vraies pièces :
deux vrais liens ggmgastro.com copiés du carnet Chambre froide ; une vraie capture de la page produit comme photo.
Aucune note envoyée depuis le champ général sauf la création (réponse IA : `carnetNeuf`, aucun `carnetId`) ; après
l'avertissement du pilote, contrôle du vrai carnet Chambre froide : aucune trace de mes mots (son critère « 2,6 m³ ·
de votre phrase » ne vient pas de moi ; vérifié au texte de la page).

IA réelle : 8 appels `rangerCarnet` (gemini-3.8-flash, tier fast) + 2 `lireLien` (sans modèle) ; ≈ 0,06 CHF estimés,
tous journalisés dans `../ia-journal.jsonl`. Un appel a été coupé au plafond de sortie après 32 s (CA12-M1-1).

## Session 1 — Créer un carnet et l'enrichir (02:44 à 02:52)

**Charte.** Explorer la création par le champ « Une idée, un besoin… » puis l'enrichissement (note, prix, lien, photo)
avec le doigt, l'IA réelle et de vraies pièces, pour découvrir une perte de donnée, un rangement faux ou une vue instable.

**Journal.**
- 02:44 Brassins › Atelier › Carnet au repos (01). Lecture seule de Chambre froide : 2 articles, un lien ggmgastro
  (03) ; « Tôle d&#039;acier » brut sur l'article du 21.11 (04, CA12-M1-16). Retour du navigateur : sort de l'app
  (noté, rejoué en session 4).
- 02:46 Saisie « ZZ TEST — M1 — fermenteur conique inox 30 L, budget 400 CHF » : aperçu « Nouveau carnet · Idée ·
  votre phrase en titre » (05). Ajouter : à 1 s, la liste le montre en « À comparer · 1 article · 400 CHF » (06), puis
  la fiche s'ouvre seule, Idée, aucun article (07) : CA12-M1-11. Titre « …30 L, budget » (CA12-M1-12). IA 4,6 s.
- 02:47 Note « doit tenir 2 bar…, vanne papillon en bas » : deux critères, attributions fausses (09, 10 ; CA12-M1-13).
- 02:48 Lien 1 collé : « Arrive ici, dans Articles · lecture de la page… » (13). lireLien rend nom, 2 763,65 CHF,
  photo ; rangerCarnet coupé après 32 s ; l'article reste « lecture… » (14), même après rechargement (16) : **B**
  CA12-M1-1. La photo lue est bloquée par la CSP (console) : CA12-M1-2.
- 02:49 Rechargement : retour sur Stocks › Matériel, fiche de mise en page différente, « votre phrase en titre » seul
  (16, CA12-M1-24).
- 02:50 Prix tapé dans le champ : devient une note, l'article reste sans prix (17, CA12-M1-6, CRW-2).
- 02:51 Photo (vraie capture de la page produit) : vignette « non lue », aucun appel IA, toucher sans effet (23,
  CA12-M1-5).

**Bilan.** Créer marche et ouvre la fiche ; la note marche. Lien : perdu une fois sur deux ; photo : jamais lue ; prix :
impossible à poser. TBS ≈ 60/30/10.

## Session 2 — Le relier : Quand, Au calendrier, Placer, Matériel › À venir (02:52 à 03:00)

**Charte.** Explorer les ponts du carnet (puces Quand et Prix estimé, Au calendrier, Choisir puis Placer, glisser au
doigt dans le Calendrier, Stocks › Matériel › À venir) pour découvrir un chiffre qui ne suit pas, un pont qui mène
ailleurs ou une date fausse.

**Journal.**
- Menu « … » du carnet : Renommer, Supprimer (pas de Placer : il n'apparaît qu'après un choix, vu dans le paquet).
- Quand › 1 mois : « vers déc. » ; « Aujourd'hu » coupé sous « Au calendrier » (27, 28 ; CA12-M1-21). Prix estimé :
  100 à 5 000, ni 400 ni le prix lu (29, CA12-M1-22). 500 CHF puis Au calendrier : Calendrier ouvert, achat −500 au
  21 déc., Achats « −1 030 probable », solde baissé de 500 : **T10-26 corrigé** (31). Titre de la fiche rogné ; Ouvrir
  → Stocks › Matériel › Carnets (31 ; CA12-M1-25, T11-7, T11-18).
- À venir : mois sans année, juil./août/sept. avant nov./déc./janv. (33, 34, 48 ; CA12-M1-10) ; ligne M4 rognée
  (CA12-M1-26).
- Lien 2 (vrai) : lu et rangé en 45 s : nom, 2 495,6 CHF, caractéristiques ; tableau à 390 avec deux colonnes « CHF »
  et prix coupé (37, CA12-M1-14) ; photo bloquée (39).
- Choisir : feuille « Pourquoi · proposé : En stock. », aucune alerte contre « Budget max 400 CHF » (42, CA12-M1-17).
  Choisi : « Dans À venir · Voir » et **Placer** (44). Placer ouvre le Calendrier sur l'achat **toujours à −500**
  (45) ; À venir : 500 CHF, « prix ou devis, à chercher » (48, 75) : CA12-M1-3.
- Glisser au doigt l'achat de S52 à S1 (appui 700 ms, 40 pas) : « 21 déc. → 11 janv. · Annuler » (47) : OK.

**Bilan.** Au calendrier et le glisser au doigt marchent ; le prix du choix ne suit pas jusqu'au plan. TBS ≈ 55/35/10.

## Session 3 — Retrouver et trier ses carnets (03:00 à 03:05)

**Charte.** Explorer la liste des carnets (groupes, filtres À comparer / Idée / Choisi, recherche avec accents, casse,
faute de frappe, mots des carnets Faits) dans les deux entrées, pour découvrir un carnet introuvable ou un compte faux.

**Journal.**
- Liste Stocks › Matériel › Carnets (49) : À comparer 1, Idée 18, Choisi 2, Faits 5 ; mêmes comptes dans Brassins ›
  Atelier › Carnet. Aucun tri au choix : groupes par état, les plus récents en tête.
- Recherche : « évier », « evier », « EVIER » identiques (accents et casse OK), mais 1 carnet sur 4 (51) ;
  « étagères », « Refaire » : « Aucun carnet ne correspond » alors que des carnets Faits les portent (57) ;
  « fermanteur » : aucun, avec un message clair (53) : CA12-M1-9 (**PNC-14 toujours KO**).
- Filtres : un ou plusieurs à la fois, pressés en vert (55, 56) ; Choisi montre le prix « 2 495.60 » en chasse fixe
  (CA12-M1-15).

**Bilan.** Filtres corrects ; la recherche oublie les carnets Faits et le contenu. TBS ≈ 65/25/10.

## Session 4 — Ce qui semble fragile (03:05 à 03:15)

**Charte.** Explorer Retour du téléphone, hors ligne, double toucher, rechargement pendant l'IA, clavier, paysage,
renommer à vide et suppression d'un carnet lié, pour découvrir une perte, un doublon ou un geste qui sort de l'app.

**Journal.**
- Retour (history.back) depuis un carnet : l'app est quittée (61 ; **G** CA12-M1-4).
- Hors ligne : « Hors ligne : rangé sur l'appareil, tel quel · Annuler » ; retour du réseau : « 1 message rangé tel
  quel · Ranger maintenant », deux bandeaux empilés (63, CA12-M1-23) ; Ranger maintenant : rangé « à acheter » : OK.
- Double toucher sur Ajouter (70 ms) : un seul appel, une seule ligne : OK.
- Rechargement 0,7 s après Ajouter : la note survit (texte brut) : OK.
- Clavier simulé 390 × 544 : dernière note hors vue, chevauchement (67, CA12-M1-8). Paysage 844 × 340 : le champ passe
  sous la barre du bas (69, CA12-M1-7). 390 × 660 : capturé, non jugé (68 non ouverte).
- « Enregistrement sur le serveur… » affiché d'environ 02:53 à 03:05 (CA12-M1-18).
- Renommer vide puis Entrée : refusé sans perte, mais le champ garde « Ajouter à… » (71, CA12-M1-27).
- Supprimer le carnet lié à un plan : « Supprimer » grisé, sans dire pourquoi (73, CA12-M1-19) ; plan supprimé dans
  À venir (« Oui, supprimer »), puis carnet supprimé (« Carnet supprimé · … · Annuler »). Disparition vérifiée.

**Bilan.** Hors ligne, double toucher et rechargement tiennent ; Retour, paysage et la suppression liée sont fragiles.
TBS ≈ 55/30/15.

## Rejeu des lignes ouvertes du registre (BUGS.md, mon périmètre)

| Ligne | Verdict | Preuve |
|---|---|---|
| PCN-7 (« ✓ Rangé ici · Annuler » absent) | OK | 06, 09 |
| PCN-8 (lien lu sans photo ni valeurs) | KO en partie : valeurs et prix OK au 2e lien ; photo bloquée par la CSP ; 1er lien perdu | 37, 39, 14 |
| PCN-13 (article ouvert : photo, Choisir noir) | KO en partie : Choisir vert OK ; photo absente | 39 |
| PCN-15 (critère absurde) | non reproduit (attributions fausses à la place, CA12-M1-13) | 10 |
| PCN-21 (photo sans trace) | KO en partie : vignette « non lue » OK ; jamais lue | 23 |
| PCN-24 (scénario de zéro) | joué en partie (créer → choisir → placer → supprimer), pas le scénario embouteillage | — |
| PCN-44, PCN-50 (chiffre perdu ou inventé) | non reproduit : « 400 CHF », « 2 bar », « 12 mm » gardés | 10 |
| PNC-5 (aucun coût ni date sur les cartes) | KO : Idée sans prix ni date ; Choisi avec prix | 49, 55 |
| PNC-6 (« Coller un lien » partout) | non reproduit | 49 |
| PNC-7 (pictos en lettres) | KO : « M », « C », « E », « I », « J » | 49, 56 |
| PNC-8 (jalons par le seul titre) | KO : picto « J » et titre « Jalon — » | 01 |
| PNC-14 (« évier ») | KO : 1 sur 4 | 51 |
| CRU-3, CRN-CREATION-VUE (vue qui change à la création) | KO en partie : la fiche s'ouvre seule ; la liste montre un état faux à 1 s ; mise en page différente selon l'entrée | 06, 07, 16 |
| CRW-2 (prix d'article impossible) | KO | 17 |
| CRW-5 (« Commander ») | KO : absent de la vue Choisi | 44 |
| T10-26 (Au calendrier ne compte pas) | OK (−500 compté) ; message de suppression encore en fragment | 31 |
| T11-7 (titre rogné, fiche du Calendrier) | KO | 31 |
| T11-18 (deux entrées, Ouvrir mène à Stocks) | KO | 31, 35 |
| Plainte du 21.11 « si on clic là ça renvoie même pas sur le carnet » | OK : 2e toucher sur l’onglet actif rend la liste (le 1er, depuis À venir, rouvre la dernière fiche) | 35 (2e toucher : texte de la page) |
| CRB-*, CRU-1/5/11/13, CRW-6 (Comparer, facture) | non joués | — |

## Couverture

Jouée : 4 chartes sur 4 ; création, note, deux liens, prix, photo, Quand, Prix estimé, Au calendrier, Choisir, Placer,
glisser au doigt, À venir, liste, filtres, recherche, Retour, hors ligne, double toucher, rechargement, clavier simulé,
paysage, Renommer, Supprimer lié. Non jouée : Comparer à deux articles lus, Écarter, Veille du prix, Dicter, Annuler
après « Rangé ici », thème Cave, 1280, vrai clavier Android. Couverture estimée **75 %**.

## Questions au pilote

1. Le service worker de son Chrome sert le tour 11 après un rechargement : le brasseur voit-il la bonne version ?
2. Un prix choisi doit-il remplacer l'estimation du plan, ou rester à côté (« estimé 500 · choisi 2 495,6 ») ?
3. La recherche doit-elle couvrir Faits, articles et notes ?
