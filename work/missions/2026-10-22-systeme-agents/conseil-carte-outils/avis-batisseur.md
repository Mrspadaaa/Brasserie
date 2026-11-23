**Bâtisseur**

**Compute : pas un frein, abandonner le repli.** Le moteur est pur : `prototypes/houblons-v4/src/engine/index.ts` annonce « pure, typée, sans réseau ni stockage ». Il n'y a pas de backend à craindre. Le « 1,8 Mo » est un fichier de maquette. Dans `donnees/profils-simules.json`, 41 cas pèsent environ 980 ko et la grille d'environ 520 ko ne couvre que 6 houblons. L'app calculera à la demande. Les données utiles du moteur font environ 0,5 Mo (`pack-fiches.json` 350 ko, `composes-houblon.json` 80 ko). `simulerCas` a un mode léger (`complet:false`) pour les listes et un mode complet (11 jours plus mesures) pour la comparaison ouverte. Le repli « dry hop seulement si trop lourd » ne se justifie pas. Je n'ai pas chronométré : c'est le premier geste.

**Carte : B comme navigation, trois écrans à construire.** Chaque question garde son entrée titrée (L10), mais `simulerCas` sert toutes les questions, seul l'axe qui varie change.
- **Suggérer** : liste classée, le « + » envoie vers Comparer (s5).
- **Comparer** : « Cascade, Idaho 7 ou Galaxy dans ma stout ? » Une brique A contre B contre C, avec radar, chimie et vraies valeurs de v1b, la manière de w2 et le panel OSU de y3. Substituer en est la même brique, préchargée avec le houblon manquant. Levure en est un interrupteur (« voir ce que la levure change », a2b).
- **Quand** : y1b. L'évolution de ma bière devient sa frise (+1, +2 dry hops).

Option C, un seul écran de recette, est le but de l'app. Elle est trop chère à explorer en fil de fer maintenant.

**Lot 22 : Comparer seul, environ 12 variantes.** C'est la première plainte du brasseur : « ça nous aide pas à choisir si cascade, idaoh7, galaxy est mieux ». Il ne faut pas relancer 40 variantes (L18 : 130 à 350 k jetons par auteur).

**Au brasseur de trancher :** Levure et Évolution restent-elles des portes à part ou des raccourcis ?

**Premier geste :** écrire les contrôles « à écrire » de L06 (radar, panel OSU, vraies valeurs présents) et de L10 (une question dans le titre). Puis chronométrer `simulerCas` léger sur tout le catalogue, dans un script qui n'écrit aucun fichier.

Position : autre voie : B en navigation (six entrées titrées), trois écrans réels, lot 22 = Comparer seul, sans repli de calcul.

LEÇON PROPOSÉE : Ne pas chiffrer le coût de calcul d'une app avec le poids des fichiers de maquette. Mesurer d'abord le moteur, puis décider d'un repli (registre 20.10 : « grille 1,8 Mo » lue comme un coût).
