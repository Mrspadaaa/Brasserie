// Outils communs des contrôles B2 (correctifs du critique Dépense, 07.11). Chaque contrôle joue le geste exact sur un build figé et imprime `<MOT> OK` ou `<MOT> ECHEC <raisons>`.
// Usage depuis un contrôle : const { nav, ouvrir, verdict } = await demarrer(); const p = await ouvrir('3', 't390', 'clair');
// Sélecteurs : les champs sont des `textarea` à une ligne, `aria-label` « Quantité|Prix|Montant ligne N » (N = numéro de ligne de la pièce, pas l'index).
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { ouvrirEtat, dormir } from './scenes.mjs';
export { dormir };
const puppeteer = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json')('puppeteer-core');

/** Le dossier construit : argument 1 du contrôle (sinon le dernier build `depense-b2-apres`). Capture éventuelle : argument 2 = dossier de sortie. */
export function arguments_() {
  const [construit, sortie] = process.argv.slice(2);
  if (sortie) fs.mkdirSync(sortie, { recursive: true });
  return { construit: construit ?? path.join(process.env.TEMP, 'depense-b2-apres'), sortie };
}

export async function demarrer() {
  const { construit, sortie } = arguments_();
  const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const raisons = [];
  return {
    nav, raisons, sortie, construit,
    ouvrir: (etat, mode = 't390', theme = 'clair') => ouvrirEtat(nav, construit, etat, mode, theme),
    /** Capture nommée si un dossier de sortie est donné. */
    cap: async (p, nom) => { if (sortie) await p.screenshot({ path: path.join(sortie, nom + '.png') }); },
    verdict: async (mot, infos) => { await nav.close(); if (infos) console.log(JSON.stringify(infos).slice(0, 1500)); console.log(raisons.length ? `${mot} ECHEC ${raisons.join(' ; ')}` : `${mot} OK`); },
  };
}

/** Ouvre le plateau d'une ligne par un mot de son nom ; rend l'id (data-dp-ligne) ou null. */
export const ouvrirLigne = async (p, nom) => {
  const id = await p.evaluate(n => {
    const a = [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes(n));
    if (!a) return null;
    const bande = a.closest('[hidden]'); if (bande) bande.hidden = false; // une sous-famille repliée
    if (!a.querySelector('details').open) a.querySelector('summary').click();
    a.scrollIntoView({ block: 'start' });
    return a.dataset.dpLigne;
  }, nom);
  await dormir(500); return id;
};
/** Formulaire manuel : ouvre le plateau de la ligne N (ses champs ne se tapent que ligne ouverte ; un seul plateau reste ouvert à la fois). */
export const ouvrirLigneN = async (p, n) => { await p.evaluate(n => { const d = document.querySelector(`[aria-label="Libellé ligne ${n}"]`)?.closest('details'); if (d && !d.open) d.querySelector(':scope > summary')?.click(); }, n); await dormir(400); };
/** Le texte de la rangée (summary) d'une ligne. */
export const rangee = (p, nom) => p.evaluate(n => { const a = [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes(n)); return a?.querySelector('summary')?.innerText.replace(/\s+/g, ' ').trim(); }, nom);
/** Le numéro de ligne N des aria-label d'une ligne (par un mot de son nom). */
export const numeroLigne = (p, nom) => p.evaluate(n => { const a = [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes(n)); return a?.querySelector('[aria-label^="Quantité ligne"]')?.getAttribute('aria-label').replace(/\D+/g, ''); }, nom);
/** Les valeurs des trois champs d'une ligne. */
export const champs = (p, n) => p.evaluate(n => Object.fromEntries(['Quantité', 'Prix', 'Montant'].map(c => [c, document.querySelector(`[aria-label="${c} ligne ${n}"]`)?.value ?? null])), n);
/** Un clic sur une case du segment d'unité d'une ligne (par un mot de son nom). */
export const uniteChoisir = async (p, nom, mot) => { const ok = await p.evaluate((n, m) => { const a = [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes(n)); const b = [...(a?.querySelectorAll('[data-dp-unite-segments] button') ?? [])].find(b => b.innerText.trim() === m) ?? [...(a?.querySelectorAll('[data-dp-cases-unite] button') ?? [])].find(b => b.querySelector('b')?.innerText.trim() === m); b?.click(); return !!b; }, nom, mot); await dormir(450); return ok; };
/** Tape une valeur dans un champ (sélecteur CSS), valide par Tab. */
export async function saisir(p, sel, valeur) {
  const h = await p.$(sel); if (!h) return 'absent';
  await h.evaluate(e => e.scrollIntoView({ block: 'center' })); await dormir(120); // le pied fixe ne doit pas recouvrir le champ cliqué
  await h.click({ clickCount: 3 }); await p.keyboard.down('Control'); await p.keyboard.press('a'); await p.keyboard.up('Control'); await p.keyboard.press('Backspace');
  if (valeur !== '') await h.type(String(valeur), { delay: 15 });
  await p.keyboard.press('Tab'); await dormir(350);
  return p.evaluate(s => document.querySelector(s)?.value, sel);
}
