/**
 * Réponse IA SIMULÉE du banc `?dev-local` (jamais en production : drapeau `src/config/rangerNoteIA.ts`). Tirée de la maquette ks4
 * (passe 4) : elle a la forme exacte de la tâche serveur `rangerNote`, et passe par le même garde (`lireReponse`). L'écran la marque
 * « exemple ». Une autre phrase rend une réponse vide : la note reste brute (rien n'est deviné à la place du modèle).
 */
import { JOURS } from '../../domain/rangerNote';

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** Le prochain `jour`/`mois` (1-12) à partir de la saisie, comme le modèle le résout. */
function prochain(saisie: Date, jour: number, mois: number): Date {
  const d = new Date(saisie.getFullYear(), mois - 1, jour, 12);
  return d < new Date(saisie.getFullYear(), saisie.getMonth(), saisie.getDate(), 12) ? new Date(saisie.getFullYear() + 1, mois - 1, jour, 12) : d;
}

export function reponseSimulee(note: string, saisie: Date, contacts: readonly string[]): unknown {
  const n = note.toLowerCase();
  const carnotzet = contacts.find((c) => c.toLowerCase().includes('carnotzet'));
  if (n.includes('fûts') && n.includes('carnotzet')) {
    const d = prochain(saisie, 12, 12);
    return {
      effets: [
        { sorte: 'tache', titre: 'Livrer 2 fûts de 20 L', date: iso(d), jour: JOURS[d.getDay()], nombre: 2, contenanceL: 20 },
        carnotzet ? { sorte: 'contact', titre: carnotzet, contact: carnotzet } : { sorte: 'contact', titre: 'Le Carnotzet', lieu: 'Le Carnotzet' },
        { sorte: 'client', titre: 'Il commande : convertir en client' }
      ]
    };
  }
  if (n.includes('goûter') && n.includes('carnotzet')) {
    return {
      effets: [
        carnotzet ? { sorte: 'contact', titre: carnotzet, contact: carnotzet } : { sorte: 'contact', titre: 'Le Carnotzet', lieu: 'Le Carnotzet', personne: 'Stéphane' },
        { sorte: 'tache', titre: 'Faire goûter la NEIPA' }
      ]
    };
  }
  if (n.includes('pils') && n.includes('nelson')) {
    return { effets: [{ sorte: 'idee-biere', titre: "Pils d'été au Nelson Sauvin", texte: note.trim() }] };
  }
  return { effets: [] };
}
