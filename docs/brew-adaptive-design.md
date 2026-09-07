# Assistance aux écarts de brassage

## Réflexion à la cuve

Préparer, atteindre une consigne, maintenir un palier et constater une fin sont
quatre faits différents. Un changement de vue ou une rampe de chauffe ne vaut
jamais validation. Les horaires sont des repères ; seuls les relevés et gestes
confirmés décrivent le brassin. Une horloge restée ouverte la veille exige une
reprise explicite, pas une fin inventée. La recette conserve ses durées prévues.

| Situation | Aide immédiate | Données / limite |
| --- | --- | --- |
| Eau osmosée indisponible ou mauvais mélange | Coupe réelle, ions, remplacement ou appoint avant grain, priorité au pH | Analyse de source, volume réel, sels déjà versés ; jamais retirer de maische pour corriger une coupe |
| Concassage, grain manquant | Masse réelle, remplacement déjà disponible, contrôle de circulation | Potentiel et couleur connus ; effet exact sur rendement non inventé |
| Chauffe lente | Rampe distincte du maintien, vitesse observée, fenêtre d'arrivée et rappel de mesure | 67 → 80 °C en 30 min = 0,43 °C/min indicatif ; le mashout reste à la consigne de recette |
| Empâtage | Température, pH refroidi, durée supplémentaire passée dans les zones enzymatiques | Pas de conversion automatique des minutes en atténuation ; contrôler conversion et homogénéité |
| Rinçage | Température de l'eau près du volume ; volume et densité collectés | Comparer les deux sur le même moût refroidi / corrigé, vérifier pH des dernières eaux |
| Ébullition modifiée | IBU par horaire réel, concentration, volume et durée restante | Minutes écoulées et minutes avant fin explicites ; évaporation mesurée ou hypothèse affichée |
| Whirlpool | Durée et température de contact ; maintien au chaud signalé | Les IBU restent une estimation, les arômes ne se quantifient pas précisément |
| Refroidissement | Projection à partir des relevés, limite du fluide froid, détection du ralentissement | Loi de refroidissement exponentielle avec température du fluide renseignée ; jamais d'ETA fiable sur un seul point |
| Ensemencement | OG + volume, comparaison à la consigne et plage connue de la levure | Pas de déclaration de sécurité ou de perte de brassin sur la seule température |

## UI avant réalisation

Conserver fond malt #12100e, surface #1a1613, texte #f5f0ea, paille #f2c14e,
eau #a7cee4 et vert houblon #b4d8a1. Source Sans 3 pour lire, IBM Plex Mono pour
comparer les quantités. Une ligne « Aide à cette étape » ouvre les calculateurs.
Un seul rappel de relevé pertinent peut rester visible. Sonnerie et notifications
vivent dans les options. Tout est aligné à gauche, cibles tactiles de 44 px.

```
étape / consigne / maintien
relevé conseillé [Mesurer]
[Aide à cette étape] [badge si écart]
ingrédients du moment
```

Relecture : le brasseur a déjà validé cette interface. Les nouvelles aides ne
doivent pas repousser ses produits sous une pile de panneaux. Les scénarios
sont consultatifs ; consigner un écart reste une action distincte. L'IA reçoit
les hypothèses et calculs visibles, seulement à la demande, avec une réponse
courte et invalidée si les mesures changent.

## Sources consultées

Les échanges servent à identifier les situations rencontrées, les références
techniques à encadrer les conseils. Aucun commentaire de forum n'est une
prescription de durée, d'acide ou de température.

- [Retours de brasseurs sur les rampes lentes](https://homebrewtalk.com/threads/slowly-ramping-mash-temp.576948/).
- [Bru'n Water : eau, dilution, alcalinité et mesure du pH](https://www.brunwater.com/water-knowledge).
- [Brewer's Friend : estimation de l'amertume](https://www.brewersfriend.com/ibu-calculator/).
- [White Labs : maîtrise de la température de fermentation](https://blog.whitelabs.com/fermentation-controls-temperature).
- [Fermentis : SafAle US-05, plage idéale 18–26 °C](https://fermentis.com/fr/produit/safale-us-05/).
- [AHA : collecte et rinçage par bacs](https://www.homebrewersassociation.org/wp-content/uploads/How-To-Batch-Sparge.pdf).
- [Web Push : clés VAPID stables et envoi chiffré](https://github.com/web-push-libs/web-push).
- [Firebase : tâches serveur](https://firebase.google.com/docs/functions/task-functions).

La nouvelle version de « Mon super stout » garde les ingrédients et le palier
de 75 min de l'originale. La rampe est renseignée séparément, le mashout conserve
76 °C / 10 min, l'eau de rinçage 76 °C, et l'ensemencement vise les 20 °C déjà
prévus pour sa fermentation. L'historique du lot n'est pas réécrit.

## Relecture de la demande et validation

- Sonnerie et test placés dans les options repliées ; son local alterné de 30 s conservé.
- Web Push natif avec clé publique obtenue du serveur, paire VAPID privée stable,
  tâches absolues et reprogrammation depuis le document du brassin. Les livraisons
  relisent le programme courant, ignorent les événements périmés et dédupliquent.
- Journal transactionnel : révisions, identifiants d’opérations, file locale persistante,
  reprise après réponse perdue et conflit explicite entre appareils. Les heures des
  événements saisis hors ligne sont conservées. Les modifications ordinaires d’un
  brassin ne peuvent pas écraser son journal migré.
- Aide repliée pour eau, pesée, chauffe, collecte, premier moût, ébullition,
  whirlpool, refroidissement et ensemencement. Les scénarios n’acquittent aucun ajout.
- IBU et concentration, coupes d’eau par bilan volumique, refroidissement exponentiel,
  vitesse de chauffe observée et exposition thermique sont calculés localement.
  L’IA reçoit le journal, les hypothèses, la recette et les stocks seulement à la demande.
- Relevés de volume, densité, pH refroidi et température proposés au moment utile.
  Consigne de rinçage visible près de son eau. Recette prévue séparée des durées du jour.
- Version 2 créée dans la base ; lecture de contrôle de l’originale : date de modification
  inchangée. Les versions conservent leur provenance à la duplication et à l’édition.

Validation locale : 53 fichiers de tests, 1 572 tests passants. Contrôles ciblés repassés
après les derniers ajustements. Build TypeScript, Vite et fonctions réussi. Trois scripts
Chrome couvrent 45 captures et 51 contrôles de disposition, dont 320 px, paysage,
clavier simulé, eau réelle, refroidissement, ancienne échéance et menus tactiles.
Les captures sont conservées localement dans `.codex-remote-attachments/`.

Seconde passe sur les conditions réelles : bilan des sucres ajoutés après le prélèvement,
appoint avant ébullition corrigé de l’évaporation, invalidation des relevés incompatibles,
détection d’un plateau récent et distinction entre consigne atteinte, dépassement et
température trop basse. Les avertissements thermiques utilisent une couleur dédiée.
Le début physique du maintien reste immuable malgré les pauses. Les horaires confirmés
par le serveur sont répercutés dans les gestes encore en attente, y compris les références
aux relevés de pH. Une réservation par navigateur empêche deux onglets d’écraser leur
file locale ; le second reste consultable et reprend après fermeture du premier.
Les tests couvrent aussi le double montage React et les brouillons de simulation :
les données suivent le brassin tant que le brasseur n’a pas commencé un scénario.

Limite vérifiable : les tests serveur vérifient programmation, chiffrement confié à
web-push, invalidation, expiration et retries avec les services externes simulés.
La réception sur le téléphone physique reste à vérifier par « Tester écran fermé » ;
les permissions, le réseau et les restrictions Android restent propres à l’appareil.
