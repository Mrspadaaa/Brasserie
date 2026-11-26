/**
 * PUCE-OUVRE-CLAVIER (25.11, « SI je choisis ici le mal, ça m'ouvre le clavier ») : un geste du doigt qui ajoute ou règle (une puce, un − / +) ne
 * donne pas le curseur à un champ de saisie : au téléphone, le clavier couvrirait la moitié de l'écran sans qu'il l'ait demandé. La quantité se règle
 * au curseur, ou d'un toucher volontaire sur son chiffre.
 *
 * Le curseur part quand même dans le champ suivant :
 * - si le clavier est déjà ouvert (un champ de saisie a le focus : nom tapé puis Entrée, D230) ;
 * - si le geste vient de la souris ou du clavier (ordinateur : aucun clavier virtuel ne s'ouvre).
 */
let dernierPointeur = '';

if (typeof window !== 'undefined') {
  // Phase de capture : lu avant tout gestionnaire de l'app, même ceux qui arrêtent la propagation.
  window.addEventListener('pointerdown', (e) => { dernierPointeur = e.pointerType; }, { capture: true, passive: true });
  window.addEventListener('keydown', () => { dernierPointeur = 'clavier'; }, { capture: true, passive: true });
}

const champSaisie = (e: Element | null): boolean =>
  !!e && (e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement || (e as HTMLElement).isContentEditable === true);

/** Vrai quand donner le focus à un champ n'ouvrira pas un clavier que personne n'a demandé. */
export function clavierPermis(): boolean {
  if (dernierPointeur !== 'touch' && dernierPointeur !== 'pen') return true;
  return champSaisie(document.activeElement);
}

/** Pour les tests : oublier le dernier geste. */
export function oublierPointeur(): void { dernierPointeur = ''; }
