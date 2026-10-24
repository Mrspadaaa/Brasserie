// Le témoin négatif de check:engine passe de l'environnement du test (V4_TEMOIN_NEGATIF=bande…) au moteur, qui ne
// lit plus process.env (B3, voie p8). À importer en tête de chaque fichier de test : Vitest isole les modules par
// fichier, chaque fichier pose donc le témoin pour sa propre copie du moteur.
import { poserTemoinNegatif } from '../src/engine/temoin';

poserTemoinNegatif(process.env.V4_TEMOIN_NEGATIF);
