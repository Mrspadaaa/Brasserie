// VI-5 (rejeu b47cd90b n° 5) : au premier moût, la carte de houblon montrait un carré hachuré « ? » suivi de « arôme » : un picto sans phrase, qu'on lit comme
// une image manquante. Le mot dit maintenant ce que le picto signale : l'arôme de cet ajout n'est pas simulé (la raison reste au survol et au lecteur d'écran).
// Testé par la source de la carte : sa mise en page demande tout le moteur et la recette de démonstration ; le rendu a été jugé sur la capture du banc.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const carte = readFileSync(`${process.cwd()}/src/ui/hopIndex/maBiere/Carte.tsx`, 'utf8');

describe('Ma bière, carte : l’arôme non simulé s’écrit en toutes lettres', () => {
  it('le picto « inconnu » est suivi de « arôme non simulé », pas de « arôme » seul', () => {
    expect(carte).toMatch(/<Inconnu raison=\{nonSimule\.raison\} \/>arôme non simulé<\/span>/);
    expect(carte).not.toMatch(/<Inconnu raison=\{nonSimule\.raison\} \/>arôme<\/span>/);
  });
});
