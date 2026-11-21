// V4 — la fiche d'un article : gestes et justesse.
// STM-2 (Retour, Échap, X jettent la saisie), STM-5 (Enregistrer toujours actif), STM-6 (Entrée dans Seuil), STM-7 (Entrée sur Nom ouvre la liste de catégories),
// STM-9 (« 0 » lu « sans seuil »), STM-12 (pavé gris derrière « 500 », cave), STM-13 (refus loin du bouton), STM-15 (rien ne dit que c'est écrit),
// STC-6 (axe : date répétée, mots sur le graphe), STC-7 (barre pleine sans échelle), STC-19 (« 200 pièce »).
// Rouge sur tour8, vert sur l'arbre. Se joue à 390 tactile (clair et cave) et à 1280 souris (Échap, STC-14).
export const passes = ['390-clair', '390-cave', '1280-clair'];

const SEUIL = '#stock-min';
/** Ouvre la fiche : « Ouvrir <nom> » (390) ou, à 1280 où le tableau n'a pas ce bouton, un coup sur le nom écrit. */
const ouvrir = async (c, nom) => {
  try { await c.ouvrirFiche(nom); } catch {
    const pos = await c.mesure((n) => {
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let t;
      while ((t = w.nextNode())) if (t.textContent.includes(n.replace(/^ZZ TEST /, '')) && t.parentElement && !t.parentElement.closest('input,textarea')) {
        t.parentElement.scrollIntoView({ block: 'center' }); const r = document.createRange(); r.selectNodeContents(t); const b = r.getBoundingClientRect();
        if (b.width > 0 && b.height > 0) return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
      }
      return null;
    }, nom);
    if (!pos) throw new Error(`« ${nom} » est introuvable dans la liste`);
    await c.sleep(200); await c.frapper(pos.x, pos.y);
  }
};
/** Cherche un article ; à 1280 le premier champ texte n'est pas la recherche de la liste : on vise son texte indicatif. */
const cherche = async (c, q) => {
  await c.chercher(q);
  const v = await c.mesure(() => document.querySelector('input[placeholder^="Rechercher"]')?.value ?? null);
  if (v === q) return;
  const pos = await c.mesure(() => { const e = document.querySelector('input[placeholder^="Rechercher"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  if (pos) { await c.frapper(pos.x, pos.y); await c.taper(q); await c.sleep(500); }
};
const rouvrirCryo = async (c) => { await c.demarrer(); await c.versStocks(); await cherche(c, 'Cryo'); await ouvrir(c, c.fx.ids.nomCryo); await c.sleep(500); };
const ficheOuverte = (c) => c.mesure(() => !!document.querySelector('[data-fiche-page]'));
const texteFiche = (c) => c.mesure(() => (document.querySelector('[data-fiche-page]')?.innerText ?? '').replace(/\s+/g, ' '));
/** Un champ touché au doigt (ou à la souris), puis ce qu'on y tape ; le contenu est sélectionné au focus, la saisie le remplace. */
const saisir = async (c, sel, t) => { await c.toucherSel(sel); await c.sleep(200); if (t) await c.taper(t); };
const bouton = (c) => c.mesure(() => { const b = document.querySelector('.sfp-b1'); return b ? { off: b.disabled } : null; });
const confirmation = (c) => c.mesure(() => /abandonner/i.test(document.body.innerText));

export default async function (c) {
  // la fixture n'a ni « Bouteille 33 cl » ni mouvements : deux articles de plus et trois mouvements (ZZ TEST), posés dans l'étape (comme mur.mjs)
  await c.p.evaluateOnNewDocument(() => {
    const k = 'parcours-chaines:fixture'; const e = JSON.parse(localStorage.getItem(k) || '[]');
    if (e.some((x) => x.id === 'ZZ-BOUT')) return;
    const poser = (name, id, data) => e.push({ name, id, data: { ...data, id } });
    poser('stockItems', 'ZZ-BOUT', { ref: 'ZZ-BOUT', name: 'ZZ TEST Bouteille 33 cl', category: 'Emballage', unit: 'pièce', currentStock: 200, reorder: false, supplier: 'ZZ TEST' });
    [['2026-04-27', 100, 150], ['2026-04-27', 150, 120], ['2026-11-14', 120, 200]].forEach(([date, avant, apres], i) =>
      poser('movements', `ZZ-MV${i}`, { type: 'inventory-adjustment', stockItemRef: 'ZZ-BOUT', stockKind: 'rawMaterials', unit: 'pièce', previousStock: avant, delta: apres - avant, newStock: apres, reasonCode: 'comptage', reason: 'Inventaire physique', date, createdAt: `${date}T10:0${i}:00.000Z` }));
    localStorage.setItem(k, JSON.stringify(e));
  });

  await c.etape('STM-5 STM-9 STM-6 le seuil : Enregistrer, « 0 », Entrée', async () => {
    await rouvrirCryo(c);
    const au_repos = await bouton(c);
    c.controle('STM-5', au_repos !== null && au_repos.off === true, `fiche ouverte sans rien changer : Enregistrer ${au_repos?.off ? 'grisé' : 'ACTIF'}`);
    await saisir(c, SEUIL, '0');
    const zero = await c.mesure(() => document.querySelector('.sfp-seuil p')?.innerText.trim() ?? '');
    await c.cap('fiche-seuil-zero');
    c.controle('STM-9', !/sans seuil/i.test(zero), `seuil « 0 » saisi : la ligne dit « ${zero} » (0 est un seuil écrit, pas « sans seuil »)`);
    await c.p.keyboard.press('Backspace'); await c.sleep(250);
    const vide = await c.mesure(() => ({ p: document.querySelector('.sfp-seuil p')?.innerText.trim() ?? '', v: document.querySelector('#stock-min')?.value ?? '' }));
    c.controle('STM-9', /sans seuil/i.test(vide.p) && vide.v === '', `seuil vidé : champ « ${vide.v} », la ligne dit « ${vide.p} »`);
    await c.taper('7');
    const apres = await bouton(c);
    c.controle('STM-5', apres !== null && apres.off === false, `seuil 7 tapé : Enregistrer ${apres?.off ? 'GRISÉ' : 'actif'}`);
    await c.entree();
    const e = await c.mesure(() => ({ actif: document.activeElement?.id ?? document.activeElement?.tagName ?? '', v: document.querySelector('#stock-min')?.value ?? '' }));
    await c.cap('fiche-seuil-entree');
    c.controle('STM-6', e.actif !== 'stock-min' && e.v === '7', `Entrée dans Seuil : focus sur « ${e.actif} », valeur « ${e.v} » (attendu : le clavier se ferme, la valeur reste)`);
    await saisir(c, '#stock-compte', '3'); await c.entree();
    const e2 = await c.mesure(() => ({ actif: document.activeElement?.id ?? document.activeElement?.tagName ?? '', v: document.querySelector('#stock-compte')?.value ?? '' }));
    c.controle('STM-6', e2.actif !== 'stock-compte' && e2.v === '3', `Entrée dans « Il en reste » : focus sur « ${e2.actif} », valeur « ${e2.v} »`);
  });

  await c.etape('STM-2 Retour, Échap et ✕ avec une saisie', async () => {
    // sans saisie : Retour ferme tout de suite
    await rouvrirCryo(c);
    await c.toucherSel((await c.mesure(() => getComputedStyle(document.querySelector('.sfp-back')).display !== 'none')) ? '.sfp-back' : '.sfp-x'); await c.sleep(600);
    c.controle('STM-2', !(await ficheOuverte(c)) && !(await confirmation(c)), 'sans saisie, Retour ferme la fiche sans rien demander');
    // avec une saisie : Retour demande
    await rouvrirCryo(c); await saisir(c, SEUIL, '7');
    await c.toucherSel((await c.mesure(() => getComputedStyle(document.querySelector('.sfp-back')).display !== 'none')) ? '.sfp-back' : '.sfp-x'); await c.sleep(600);
    const demande = await confirmation(c); const ouverte = await ficheOuverte(c);
    await c.cap('fiche-retour-saisie');
    c.controle('STM-2', ouverte && demande, `seuil 7 tapé puis Retour : fiche ${ouverte ? 'ouverte' : 'FERMÉE'}, confirmation ${demande ? 'dite' : 'ABSENTE'}`);
    // Annuler garde la saisie ; Échap demande de nouveau ; Abandonner ferme
    if (demande) {
      await c.toucher('Annuler', { exact: true }); await c.sleep(500);
      const garde = await c.mesure(() => document.querySelector('#stock-min')?.value ?? null);
      c.controle('STM-2', garde === '7', `Annuler garde la saisie : seuil « ${garde} »`);
      await c.toucherSel(SEUIL); await c.p.keyboard.press('Escape'); await c.sleep(600);
      const echap = await confirmation(c);
      c.controle('STM-2', echap && (await ficheOuverte(c)), `Échap avec une saisie : confirmation ${echap ? 'dite' : 'ABSENTE'} (STC-14)`);
      await c.toucher('Abandonner', { exact: true }); await c.sleep(600);
      c.controle('STM-2', !(await ficheOuverte(c)), 'Abandonner ferme la fiche');
    }
  });

  await c.etape('STM-7 STM-15 Entrée sur Nom : pas de liste ; un signe que c\'est écrit', async () => {
    await rouvrirCryo(c);
    await c.toucher('Plus', { exact: true }); await c.sleep(400); await c.toucher('Modifier la fiche'); await c.sleep(600);
    await c.toucherSel('#stock-label'); await c.p.keyboard.press('End'); await c.taper(' X');
    await c.p.keyboard.press('Enter'); await c.sleep(450);
    const liste = await c.mesure(() => {
      const visible = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      return [...document.querySelectorAll('[role=listbox],[role=combobox][aria-expanded=true],input[aria-expanded=true]')].filter(visible).length;
    });
    await c.cap('fiche-nom-entree');
    c.controle('STM-7', liste === 0, `Entrée sur Nom : ${liste} liste(s) de catégories ouverte(s)`);
    const signe = await c.mesure(() => [...document.querySelectorAll('[role=status],[data-ecrit]')].map((e) => e.innerText.trim()).filter((t) => /enregistr|écrit/i.test(t)));
    c.controle('STM-15', signe.length > 0, `après l'enregistrement (nom changé) : ${signe.length ? `« ${signe[0].slice(0, 80)} »` : 'AUCUN signe visible'}`);
  });

  await c.etape('STM-13 le refus d\'une perte, près du bouton', async () => {
    await rouvrirCryo(c);
    await c.toucher('+1', { exact: true }); await c.sleep(300);
    await c.toucher('Perte', { exact: true }); await c.sleep(500);
    const m = await c.mesure(() => {
      const b = document.querySelector('.sfp-b1'); const rb = b.getBoundingClientRect();
      const alertes = [...document.querySelectorAll('[data-fiche-page] [role=alert]')].filter((e) => e.getBoundingClientRect().height > 0).map((e) => ({ t: e.innerText.replace(/\s+/g, ' ').trim(), loin: Math.round(rb.top - e.getBoundingClientRect().bottom) }));
      return { off: b.disabled, alertes };
    });
    await c.cap('fiche-perte-refus');
    const a = m.alertes[0];
    c.controle('STM-13', m.off && !!a && a.loin <= 90 && !/Inventaire physique/.test(a.t) && /Compté/.test(a.t),
      `+1 puis Perte : Enregistrer ${m.off ? 'grisé' : 'ACTIF'} ; refus ${a ? `« ${a.t.slice(0, 110)} » à ${a.loin} px au-dessus du bouton` : 'ABSENT'} (attendu : près du bouton, avec les mots Compté / Perte / Autre)`);
  });

  await c.etape('STC-7 barre de stock sans échelle ; STM-12 pavé gris', async () => {
    await rouvrirCryo(c);
    const b = await c.mesure(() => {
      const axe = document.querySelector('.sfp-axe')?.innerText ?? '';
      const barre = document.querySelector('[data-barre=stock] .sfp-seg');
      const g = barre ? barre.getBoundingClientRect() : null; const t = barre?.parentElement.getBoundingClientRect();
      return { axe: axe.replace(/\s+/g, ' ').trim(), plein: g && t ? Math.round(100 * g.width / t.width) : null, barre: !!barre };
    });
    await c.cap('fiche-barre-cryo');
    const echelle = /seuil\s+\d|besoin\s+\d/.test(b.axe);
    c.controle('STC-7', echelle || !b.barre, `Cryo (1 Pck, sans seuil, besoin inconnu) : barre ${b.barre ? `remplie à ${b.plein} %` : 'absente'} ; axe « ${b.axe} »`);
    if (c.theme === 'cave') {
      const p = await c.mesure(() => ['#stock-min', '#stock-compte'].map((s) => {
        const e = document.querySelector(s); if (!e) return { s, absent: true };
        const cs = getComputedStyle(e); const lab = e.closest('.sfp-inp'); const cl = lab ? getComputedStyle(lab) : null;
        return { s, fond: cs.backgroundColor, image: cs.backgroundImage.slice(0, 40), ombre: cs.boxShadow.slice(0, 40), fondLabel: cl?.backgroundColor ?? '', fondPage: getComputedStyle(document.querySelector('.sfp')).backgroundColor };
      }));
      const pave = (x) => !x.absent && !/rgba\(0, 0, 0, 0\)|transparent/.test(x.fond) || (!x.absent && x.ombre !== 'none' && /inset/.test(x.ombre));
      c.controle('STM-12', p.every((x) => !pave(x)), `champs de la fiche en cave : ${p.map((x) => `${x.s} fond ${x.fond} ombre ${x.ombre} (étiquette ${x.fondLabel}, page ${x.fondPage})`).join(' ; ')}`);
      await c.cap('fiche-cave-champs');
    }
  });

  await c.etape('STC-19 STC-6 Bouteille : « 200 pièces », l\'axe, les mots du graphe', async () => {
    await c.demarrer(); await c.versStocks(); await c.sousOnglet('Autres stocks'); await c.chercher('Bouteille');
    await ouvrir(c, 'ZZ TEST Bouteille 33 cl');
    await c.sleep(500);
    const titre = await c.mesure(() => document.querySelector('[data-fiche-page] .sfp-nom')?.textContent ?? '');
    if (!/Bouteille 33 cl/.test(titre)) throw new Error(`la fiche ouverte n'est pas celle de Bouteille 33 cl mais « ${titre} »`);
    const g = await c.mesure(() => ({
      dates: [...document.querySelectorAll('.sfp-escd')].map((e) => e.textContent.trim()),
      mots: [...document.querySelectorAll('[data-escalier] text')].map((e) => e.textContent.trim()).filter((x) => /aucun besoin|seuil à fixer/.test(x)),
      courbe: !!document.querySelector('[data-escalier]')
    }));
    await saisir(c, SEUIL, '100'); await c.entree();
    const t = await texteFiche(c);
    const pieces = [...t.matchAll(/\d[\d\s\u00a0\u202f,]*\s+pièces?(?![\p{L}])/gu)].map((m) => m[0]);
    const faux = pieces.filter((x) => /pièce$/.test(x) && Number(x.replace(/\s*pièce$/, '').replace(/[\s\u00a0\u202f]/g, '').replace(',', '.')) >= 2);
    await c.cap('fiche-bouteille');
    c.controle('STC-19', pieces.length > 0 && faux.length === 0, `quantités en pièces dans la fiche : ${pieces.slice(0, 4).join(' | ') || 'aucune lue'} ; au singulier à tort : ${faux.join(' | ') || 'aucune'}`);
    if (!g.courbe) throw new Error('la courbe « Ce qui a bougé » n\'est pas tracée pour Bouteille (mouvements de la fixture non lus)');
    c.controle('STC-6', new Set(g.dates).size === g.dates.length, `dates sous les marches : ${g.dates.join(' · ')}`);
    c.controle('STC-6', g.mots.length === 0, `mots écrits sur le graphe : ${g.mots.join(' | ') || 'aucun'}`);
  });
}
