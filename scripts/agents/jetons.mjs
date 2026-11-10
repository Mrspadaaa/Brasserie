// Économie de jetons des sessions Claude : mesure le gaspillage dans les transcripts (.jsonl), sans rien envoyer.
// Usage : node scripts/agents/jetons.mjs [heures=24] [--seuil-sortie=8000]
// Signale par session : jetons produits, sorties d'outil > seuil (contexte gonflé), erreurs d'outil, appels répétés à l'identique.
// Agents (10.11) : les transcripts subagents/ de chaque session sont comptés à part ; un agent dont le contexte passe 200 k est signalé.
// Code de sortie 1 si une session dépasse un plafond de gaspillage : la session de suivi le relit à chaque lot.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';

const heures = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 24);
const seuil = Number((process.argv.find((a) => a.startsWith('--seuil-sortie=')) ?? '=8000').split('=')[1]);
const racine = path.join(os.homedir(), '.claude', 'projects');
const depuis = Date.now() - heures * 3600e3;
const PLAFONDS = { grossesSorties: 15, erreurs: 15, repetes: 8, agentsGros: 0 };
const AGENT_PIC = 200000;

const fichiers = fs.readdirSync(racine).filter((d) => /Brasserie/i.test(d)).flatMap((d) => {
  const dir = path.join(racine, d);
  return fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl')).map((f) => path.join(dir, f));
}).filter((f) => fs.statSync(f).mtimeMs >= depuis);

const taille = (c) => typeof c === 'string' ? c.length : Array.isArray(c) ? c.reduce((n, x) => n + (x.text?.length ?? 0), 0) : 0;
const lignes = [];
let alerte = false;
const lire = async (f) => {
  const s = { titre: '', sortie: 0, entree: 0, cache: 0, grossesSorties: 0, plusGrosse: 0, erreurs: 0, repetes: 0, appels: 0 };
  const vus = new Map();
  for await (const l of readline.createInterface({ input: fs.createReadStream(f), crlfDelay: Infinity })) {
    if (!l) continue;
    let e; try { e = JSON.parse(l); } catch { continue; }
    if (e.timestamp && Date.parse(e.timestamp) < depuis) continue;
    if (e.type === 'summary' && e.summary) s.titre = e.summary;
    const m = e.message;
    if (!m) continue;
    if (e.type === 'assistant' && m.usage) {
      s.sortie += m.usage.output_tokens ?? 0;
      s.entree += (m.usage.input_tokens ?? 0) + (m.usage.cache_creation_input_tokens ?? 0);
      s.cache += m.usage.cache_read_input_tokens ?? 0;
      s.pic = Math.max(s.pic ?? 0, (m.usage.input_tokens ?? 0) + (m.usage.cache_creation_input_tokens ?? 0) + (m.usage.cache_read_input_tokens ?? 0));
    }
    for (const b of Array.isArray(m.content) ? m.content : []) {
      if (b.type === 'tool_use') {
        s.appels++;
        const cle = b.name + JSON.stringify(b.input);
        vus.set(cle, (vus.get(cle) ?? 0) + 1);
        if (vus.get(cle) === 2) s.repetes++;
      }
      if (b.type === 'tool_result') {
        const t = taille(b.content);
        if (t > seuil) s.grossesSorties++;
        s.plusGrosse = Math.max(s.plusGrosse, t);
        if (b.is_error) s.erreurs++;
      }
    }
  }
  return s;
};
for (const f of fichiers) {
  const s = await lire(f);
  const dirAg = path.join(f.slice(0, -6), 'subagents');
  s.agents = 0; s.agentsCache = 0; s.agentsGros = 0; s.agentsPic = 0;
  if (fs.existsSync(dirAg)) for (const a of fs.readdirSync(dirAg).filter((x) => x.endsWith('.jsonl'))) {
    const fa = path.join(dirAg, a); if (fs.statSync(fa).mtimeMs < depuis) continue;
    const sa = await lire(fa); if (!sa.appels) continue;
    s.agents++; s.agentsCache += sa.cache; s.agentsPic = Math.max(s.agentsPic, sa.pic ?? 0);
    if ((sa.pic ?? 0) > AGENT_PIC) s.agentsGros++;
  }
  if (!s.appels && !s.agents) continue;
  const trop = Object.entries(PLAFONDS).filter(([k, v]) => s[k] > v).map(([k]) => k);
  if (trop.length) alerte = true;
  lignes.push({ session: path.basename(f, '.jsonl').slice(0, 8), dossier: path.basename(path.dirname(f)).replace(/^.*worktrees-/, '').slice(0, 28), ...s, trop });
}
lignes.sort((a, b) => b.cache + b.agentsCache - (a.cache + a.agentsCache));
const k = (n) => `${Math.round(n / 1000)} k`;
for (const x of lignes)
  console.log(`${x.trop.length ? '⚠' : '·'} ${x.dossier} ${x.session} : sortie ${k(x.sortie)}, entrée neuve ${k(x.entree)}, cache ${k(x.cache)} ; ${x.appels} appels, ${x.grossesSorties} sorties > ${seuil} car. (max ${k(x.plusGrosse)}), ${x.erreurs} erreurs, ${x.repetes} appels répétés ; ${x.agents} agents, cache ${k(x.agentsCache)}, pic ${k(x.agentsPic)}, ${x.agentsGros} au-delà de 200 k${x.trop.length ? ' — au-delà : ' + x.trop.join(', ') : ''}`);
console.log(`${lignes.length} sessions sur ${heures} h ; plafonds ${JSON.stringify(PLAFONDS)}`);
process.exit(alerte ? 1 : 0);
