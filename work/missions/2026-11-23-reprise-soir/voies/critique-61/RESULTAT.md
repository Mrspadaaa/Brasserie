OK — 7 problèmes, 2 bloquants

RESULTAT critique-61 : 7 problèmes (B 2, m 5, D 0) — corrigés rejoués 12/14 — carnet identique oui — BUGS OK

Version : index-CHXDhK_A.js (curl ?nocache, et `maj.mjs` : l'onglet neuf est sur CHXDhK_A).
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK : 2279 bugs, 518 ouverts, 202 sources).
Couvert : thème clair, 390 × 844, deviceScaleFactor 2, au toucher (CDP). Chrome de débug 9222, mon onglet seulement ; fin par page.close() puis disconnect, le navigateur reste ouvert. Non couvert : 1280 et sombre (DOSSIER).

## À savoir d'abord (pilote)
- **Son carnet « Houblons citra » a changé pendant le test, sans que je l'aie touché.**
  - Le document CARNET-d2126204 passe de updateTime 15:47:31Z à 18:17:30Z.
  - Ajout sur l'article Citra 13.6% : « Particulièrement adapté pour : amerikanische Ales und IPA's » (luLe 18:17:26Z). Le prix reste vide.
  - À 18:17Z, mon onglet saisissait les écritures ZZ dans Finances (`ecrire.mjs`, ecr.log clos à 18:18:16Z). Aucun de mes scripts n'a ouvert ce carnet ni son lien depuis le lot 1 (lecture, 17:4x).
  - Cause probable : un geste du brasseur (Relire) ou un autre appareil. À confirmer. La valeur en allemand est le n° 7.
  - Tout le reste de mon relevé est identique (`avant.json` / `apres.json`) : 21 champs sur 21, Chambre froide comprise (texte et 2 documents Firestore, 837 et 9 086 o).
  - Sur 3 255 documents hors ZZ, 2 seulement ont changé : Houblons citra (ci-dessus) et `financialSync/state`. Ce dernier vient de mes écritures ZZ puis de leur annulation.
  - Les 20 documents neufs sont à moi : 6 journaux de suppression des carnets ZZ, les marques de suppression de leurs messages et 2 annulations VOID des écritures ZZ.
- **Coût IA ≈ 0,058 CHF** (9 lignes au journal, plus une note).
  - Payants : 3 rangements, 1 Relire et 5 lectures de lien, tout sur ZZ TEST.
  - Joint et tuyau : IA bloquée dans mon onglet. C59-2 : réponse « plafond » simulée dans mon onglet. Aucun appel n'est parti pour ces trois-là.
  - Aucun appel IA sur ses carnets.
- **Nettoyage** :
  - 6 carnets ZZ supprimés au toucher, avec la garde « Ajouter à ZZ TEST… » ;
  - 2 écritures ZZ annulées (« plus de ZZ ») ;
  - la barre ZZ de la frise supprimée (`KS après []`) ;
  - période remise (localStorage identique).
- Le carnet « Houblons » cité par le DOSSIER n'existe pas. Ses carnets à comparer sont Chambre froide et Houblons citra (Tous 21, avant comme après).

## Son relevé : avant = après
- À dépenser −463 (S53). En caisse 1 145,00. Synthèse 0,00 / 265,40. Opérations 265,40 / 0,00 / 265,40. Départ 1 145,00. Mon mois et HABITUELS identiques.
- Période : 6 sem., du 23 nov. 2026 au 3 janv. 2027.
- Ses 16 choses de la frise ont des aria identiques. Puces : Tous 21, Local 10, Brasserie 5, Meuble 4, Papiers 2.
- LE-1, guetté par MutationObserver et requêtes Firestore Write : aucun « Enregistrement sur le serveur… » ni aucune écriture.
  - C'est vrai à l'ouverture de Chambre froide, Houblons citra et Frigo + congel, de leurs Articles, Comparer et fiches, pendant les relevés avant et après et pendant vueH2.

## Corrigés rejoués : 12 sur 14 vérifiés, 1 rouvert, 1 en cours
- **C59-1 (R35) vérifié** — en ligne index-CHXDhK_A.js.
  - Joint et tuyau ZZ en échec. Relire du joint fait un appel : la note « Joint torique 20 mm » est rangée dans le joint.
  - Le tuyau garde son message et son bandeau (RJ-0, RJ-t25, EZ4 : planche P-R35).
- **C59-2 vérifié** — en ligne index-CHXDhK_A.js.
  - « IA en pause : plafond de dépenses atteint : rangé sur l'appareil, votre message est gardé. » s'affiche, puis le bandeau « IA en pause : … 1 message rangé tel quel [Relire] ».
  - Un seul appel à la création et un seul au Relire : aucune boucle (C7-fin, RP-0, RP-t25).
- **C59-3, C58-4 et C50-5 vérifiés** — le compromis dit la perte.
  - Son carnet : « …mais la 2e a le volume 4,06 m³ au lieu de 2,6 m³ » (A-comparer-5).
  - Cellule ZZ : « …289,77 CHF de moins que la 2e ; la 2e a le volume 4,06 m³ au lieu de 2,6 m³ ».
- **C59-4 (R36) vérifié** — Le critère « Marmite de brassage 50 L » classe le Maischekessel 50 L 1er et le frigo 242 L 2e (M-comparer-0, M-articles-0). Le dessin des jauges reste faux : voir le n° 6.
- **C59-5 vérifié** — Le lien retour se lit « ZZ TEST — marmite de brassage » / « 50 L », dans l'ordre (M-comparer-0).
- **C59-7 (R37) vérifié** — Un seul « ≈4 » pour CITRA® (US) : tableau, feuille Articles (« ≈4 CHF rendu »), Comparer et fiche. La carte du tableau garde « 3,72 € » à côté (le converti, D447) : ça ne gêne pas, la devise diffère.
- **C59-9 vérifié** — « Arômes : citron vert, mangue, fruits tropicaux ».
- **C59-10 vérifié** — La jauge s'arrête avant « Veiller ».
- **C58-3 vérifié** — L'avis « L'IA n'a pas répondu » ne s'affiche que dans le joint et le tuyau.
- **LE-1 vérifié** — Voir plus haut. Il reste le bandeau faux après une lecture finie (n° 2).
- **C59-8 rouvert** — n° 3.
- **C59-6 en cours** — Tenu dans le carnet, la feuille et Comparer (« – », « CHF ? », « ? »). Il reste la liste des carnets (n° 1) et le prix sans quantité (n° 5).
- Rejeu, en regardant :
  - Tiennent K57-1, K57-2, Q4-1 et POI-1. Les chiffres sont identiques à ceux du tour 59 :
    - poignée à 2 et 4 px : rien ; à 6 px : 1 jour ;
    - barre tenue : S48 → S12 à 30 px, S48 → S20 à 4 px ;
    - cadre à 4 px : 8 → 44 sem. ;
    - toucher bref : la fiche (cal.log).
  - Tiennent C46-1 (« 400 CHF · budget » en blanc sur vert), C46-2 (« frigorifique » cité en entier) et C46-5 (−79,95 / −80 / −159,95 partout).
  - Tiennent C54-1 à C54-3 (« achat rond + 1 autre −159,95 » sur la marche S50) et C53-5 (bulle du 08.12 dans Prévisions).
  - Tiennent C53-1 et C53-2 : pellets ZZ hopfenmarkt. La fiche donne Alpha 12,8 %, Bêta, Cohumulone, Récolte, Huiles totales, puis les huiles en ordre décroissant ; la carte : « Alpha 12,8 % · Récolte 2025 · 2,5 ml/100 g ».
  - Tient C53-4. Tiennent C55-1 et C55-3. Tiennent C56-1, C56-3 (Variantes « 50 g · 100 g (affichée) · 250 g · 500 g · 1 kg », sans unité orpheline) et C56-6 (prix, dispo, vendeur, puis la ligne qui classe).
  - Tiennent C52-1 à C52-3 et C58-1, C58-2, C58-5, C58-6. Tiennent C48-1 à C48-6 et C50-1 à C50-9 (cellule et marmite ZZ relues, son carnet).
  - Le rangement a réussi au premier essai pour cellule, marmite et pellets (C56-4 : non possédé, non modifié).

## Combien et quels problèmes ? 7
1. **B — C61-1** — La liste des carnets dit « Houblons citra · 2 articles · dès 0,10 CHF » (avant-carnets).
   - Dans le carnet, Citra 13.6% n'a plus de prix, et le seul prix est ≈4 CHF.
   - Le brasseur : « 0,10 le houblon ? Dans le carnet il y a plus de prix. »
   - Attendu : le prix du carnet (« dès ≈4 CHF »), ou rien.
2. **B — C61-2** — Chaque lien lu jusqu'au bout laisse « Lecture de lien interrompue : 1 à reprendre [Reprendre] » juste au-dessus de « Lu · 6 étapes sur 6 ».
   - Vu sur la cellule, la marmite et les pellets ZZ ; le bandeau revient à chaque réouverture (H1-fin, M-articles-0, EZ0).
   - Reprendre relancerait une lecture payante déjà faite.
   - La cause probable est le correctif LE-1 : la lecture gardée n'est pas effacée quand elle finit.
   - Le brasseur : « Interrompue ? Elle dit Lu juste en dessous. »
3. **m — C59-8 rouvert** — Sur la fiche « Citra 13.6% », on lit toujours « Citra 13,6 % », pas « Alpha », et c'est la 2e ligne (H-F2-0).
   - Sur la fiche CITRA® (US), « Taux d'acides alpha 10 % - 15 % » est la 3e ligne, après Origine et Poids (H-F1-0).
   - Le brasseur : « L'alpha d'abord, et appelle-le alpha. »
4. **m — C61-3** — Le Comparer de ses deux Citra n'aligne que dispo, vendeur et « Origine : États-Unis / USA » (H-comparer-0).
   - Ni l'alpha ni les arômes ne sont côte à côte, et le même pays est écrit de deux façons.
   - Le brasseur : « Je compare deux houblons et y a pas l'alpha ? »
5. **m — C61-4** — Le prix de CITRA® (US) est « dès ≈4 CHF rendu » (3,72 €) pour des poids de 50, 250 et 500 g : pour combien de grammes ? Il n'y a pas de CHF/kg, alors que la marmite a ses CHF/L (H-articles-0, H-F1-0).
   - Le brasseur : « 4 balles les 50 g ou les 500 ? »
6. **m — C61-5** — Marmite ZZ, avec une cible de 50 L.
   - La 1re (50 L pile) a une jauge presque vide, et le frigo 242 L une jauge pleine et verte. Dans Comparer, « 242 » est en vert (M-articles-0, M-comparer-0).
   - Le dessin dit « plus grand = mieux », le rang dit « au plus près ».
   - Le brasseur : « Elle est 1re mais sa barre est vide ? »
7. **m — C61-6** — Sur sa fiche Citra 13.6%, une ligne neuve se lit en allemand : « Particulièrement adapté pour : amerikanische Ales und IPA's » (H2-F1-0). Elle a été écrite à 18:17Z, pas par moi (voir plus haut).
   - Le brasseur : « Encore de l'allemand. »

Bloquants : 2.
- n° 1 : une valeur fausse.
- n° 2 : un état faux qui pousse à relancer une lecture payante.

Aucun élément de maquette ne manque.

### Doutes (non comptés)
- Le voile blanc 1 à 2 s après avoir lâché une poignée ou le cadre revient (P30-apres, VC4-lache). Déjà vu au tour 59.
- Après Annuler sur une barre tirée à 5 px, la barre mesure 49–383 (« PAS REMIS »), puis revient. C'est transitoire, déjà vu.
- Compromis de la marmite ZZ : « la 2e, 302 CHF, soit 218 CHF de moins que la 1re ; le volume 242 L au lieu de 50 L ». Sans « mais », on ne voit pas si c'est un gain ou une perte. C'est aussi un frigo comparé à une marmite : ce sont mes données de test.
- Pellets hopfenmarkt : l'Offre dit « 6,70 CHF » ; le conditionnement de 100 g n'apparaît que plus bas, dans les caractéristiques.
- Après le Relire du joint, le tuyau ZZ dit « Ensuite : l'IA cherche les façons » alors qu'il est en échec (EZ4).
- La barre ZZ s'affiche « Travaux · S48ZZ TEST — barre D ». C'est probablement le nom par défaut, non effacé par mon script.
- Déjà vus : « Horizon : jusqu'au 23 nov. 2031 » dans les causes, et la bulle « achats ≥ 2,40, 13.12 » dans Prévisions.

## Table (captures 390 ouvertes)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| avant-carnets | clair | 390 | liste des carnets (lecture) | 1 (n° 1) | 1 |
| A-carnet, A-comparer-5 | clair | 390 | son Chambre froide, Comparer, compromis | 0 | 0 |
| H-carnet, H-articles-0, H-comparer-0, H-F1-0, H-F2-0, H2-F1-0 | clair | 390 | son Houblons citra (lecture) | 4 (n° 3, 4, 5, 7) | 0 |
| C7-fin, RP-0 | clair | 390 | création et Relire, IA en pause simulée | 0 | 0 |
| P-R35 (RJ-0, RJ-t25, EZ4, EZ0) | clair | 390 | Relire du joint, tuyau, cellule | 1 (n° 2) | 1 |
| H1-fin, P-F1-0, P-F1-1 | clair | 390 | pellets ZZ lus, fiche | 1 (n° 2) | 0 |
| M-comparer-0, M-articles-0, M-F1-0 | clair | 390 | marmite ZZ | 1 (n° 6) | 0 |
| Z-comparer-0 | clair | 390 | cellule ZZ | 0 | 0 |
| P-P-cal1 (F0-haut, D1-causes, V2-previsions, VC4-lache) | clair | 390 | en-tête, causes, Prévisions, cadre lâché | 0 | 0 |
| P-P-cal2 (P30-pendant, P30-apres, B1-achats, L1-liste) | clair | 390 | barre tirée, achat ZZ, Liste | 0 | 0 |

LEÇON PROPOSÉE : le relevé avant/après prend l'empreinte et l'updateTime de TOUS les documents du cache hors ZZ (`fstout.mjs`), pas seulement le carnet désigné. Ici, seul ce relevé large a vu son carnet Houblons citra changer pendant le test. Un guet posé sur un onglet persistant se remet à zéro à chaque vue : sinon, il rapporte des écritures d'un lot précédent.
