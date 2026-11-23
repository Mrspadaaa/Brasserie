# Matériel et volumes utiles

La cuve de 45 L est la version déclarée par le propriétaire. Le [lien Royal Catering](https://www.expondo.ch/royal-catering-braukessel-mit-isolierung-40-l-2500-w-10-100-0c-edelstahl-lcd-anzeige-timer-10012888) décrit une version 40 L : il ne confirme pas la capacité utile de son exemplaire. Le [fermenteur indiqué](https://www.brauundrauchshop.ch/g%C3%A4rtank-30-liter-rund-mit-deckel) est annoncé 30 L. Une capacité totale ne constitue pas une consigne de remplissage. Les [besoins en eau de Brewer’s Friend](https://docs.brewersfriend.com/recipe-builder/quick-water-requirements) distinguent aussi eau, grain et capacité de la cuve.

Réglages dans **Paramètres → Brasserie → Matériel, capacités et eau**, repliés par défaut. Le profil est partagé dans Firestore. Les recettes enregistrent les hypothèses utilisées ; les journaux et snapshots existants ne sont pas redimensionnés.

- Cuve totale 45 L, limite utile provisoire 35 L, eau chaude et grain compris. À confirmer avec le panier et le repère MAX.
- Fermenteur total 30 L, réserve choisie de 20 %, soit 24 L de moût et 6 L pour la mousse. Cette marge est réglable et ne garantit pas l’absence de débordement pour toutes les levures.
- Sparger 18 L à chaud : charges d’au plus 17,4 L à froid avec une dilatation estimée de 3 %. Plusieurs charges conservent la totalité de l’eau nécessaire.
- Osmosée par packs de 5 L : arrondir le nombre de packs achetés, jamais le volume versé ni le pourcentage de dilution.
- Repères à calibrer : évaporation 3 L/h à chaud, absorption 0,96 L/kg, déplacement du grain 0,67 L/kg, rétraction de 4 %, chauffe de 13/30 °C/min. Les valeurs ne sont pas présentées comme des mesures fabricant.

Le modèle utilise des litres froids pour les eaux dosées et le bilan volume × densité. Le volume à ébullition est affiché séparément. Avec `c = 1 − rétraction`, le volume chaud avant ébullition vaut `(volume fermenteur + pertes froides) / c + évaporation chaude`. L’eau froide totale vaut `volume chaud × c + absorption`. Réduire l’empâtage pour faire tenir le grain augmente le rinçage ; cela ne retire pas de litres du bilan. Sans rinçage, le modèle conserve toute l’eau et signale un dépassement.

La v2 de la stout est adaptée à 24 L : 7,28 kg de grain, 27,7 L d’empâtage, 8,7 L de rinçage, 29,4 L collectés à froid / 30,6 L à ébullition, environ 33,4 L occupés pendant l’empâtage. La coupe de 20 % demande 7,28 L d’osmosée : 5,54 + 1,74 L ; deux packs laissent 2,72 L. Ingrédients redimensionnés et traitement d’eau ajusté par volume de chaque eau. Les notes libres ont été réécrites pour éviter les anciens volumes.

Validation : 55 fichiers / 1 584 tests passants, dont bilan chaud–froid, capacité avec grain, absence de rinçage, remplissages multiples, 1 001 cas de packs, conservation de l’original, traitement d’eau, import/export du profil, réglages persistés et adaptation explicite dans l’assistant. Dix captures supplémentaires couvrent 320/390 px, paysage et ordinateur.
