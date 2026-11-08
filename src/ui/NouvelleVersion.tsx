import { useEffect, useState } from 'react';

// 08.11, test en ligne : « Pourquoi sur la vrai app, j'ai pas EXACTEMENT cette même vue??? ». Une app restée ouverte garde l'ancienne version
// après un déploiement, sans rien dire. Elle compare donc son script principal à celui que sert le site, et propose de recharger. Jamais de
// rechargement automatique : une saisie en cours (dépense, recette) serait perdue.

const SCRIPT = /\/assets\/index-[\w-]+\.js/;

/** Le script principal servi par le site diffère-t-il de celui que la page exécute ? Faux quand l'un des deux est inconnu. */
export function versionDiffere(htmlServi: string, srcCourant: string | null | undefined): boolean {
  const servi = htmlServi.match(SCRIPT)?.[0], courant = srcCourant?.match(SCRIPT)?.[0];
  return Boolean(servi && courant && servi !== courant);
}

const DIX_MINUTES = 10 * 60 * 1000;

export function NouvelleVersion() {
  const [neuve, setNeuve] = useState(false);
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    const courant = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/index-"]')?.getAttribute('src');
    if (!courant) return;
    let fini = false;
    const verifier = async () => {
      if (fini || document.visibilityState !== 'visible') return;
      try {
        const reponse = await fetch('/index.html', { cache: 'no-store' });
        if (reponse.ok && versionDiffere(await reponse.text(), courant) && !fini) setNeuve(true);
      } catch { /* hors réseau : on réessaiera */ }
    };
    const surVisible = () => { void verifier(); };
    document.addEventListener('visibilitychange', surVisible);
    window.addEventListener('focus', surVisible);
    const minuterie = window.setInterval(surVisible, DIX_MINUTES);
    return () => { fini = true; document.removeEventListener('visibilitychange', surVisible); window.removeEventListener('focus', surVisible); window.clearInterval(minuterie); };
  }, []);
  if (!neuve) return null;
  return <div role="status" data-nouvelle-version className="px-4 py-1.5 text-center text-xs text-ebc-straw bg-ebc-straw/5">
    Nouvelle version de l’app
    <button type="button" onClick={() => window.location.reload()} className="ml-2 min-h-touch px-3 font-semibold underline underline-offset-2">
      Recharger
    </button>
  </div>;
}
