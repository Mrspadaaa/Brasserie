/**
 * CT4-A-12 (suite) : une fiche ouverte depuis le calendrier (un jalon de Papiers) passe par Finances ; en revenant, le calendrier se remonte et
 * la page repartait en haut. À 844 × 340 Papiers est sous le pli : on remet le défilement d'avant le toucher.
 * `memoriserDefilement` au départ, `restaurerDefilement` au retour : la frise se monte un instant après, on attend (image par image, 1 s au plus)
 * que la page soit assez haute, sans sauter dans le vide. La mémoire sert une seule fois.
 */
let memoire = 0;
let attente: number | null = null;

export function memoriserDefilement(): void {
  memoire = Math.max(0, Math.round(window.scrollY || 0));
}

export function restaurerDefilement(): void {
  const cible = memoire; memoire = 0;
  if (cible <= 0) return;
  if (attente !== null) cancelAnimationFrame(attente);
  let essais = 0;
  const pas = () => {
    attente = null; essais += 1;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max >= cible) { window.scrollTo(0, cible); return; }
    if (essais < 60) attente = requestAnimationFrame(pas);
  };
  attente = requestAnimationFrame(pas);
}
