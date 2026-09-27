// The contract is injected by the native launcher, even with Claude safe-mode.
import { createHandoff, validateRequest } from './sol-handoff.mjs';
import { readFileSync } from 'node:fs';

// Private Claude role, injected by its own bridge even in safe-mode.
const claudeRole = readFileSync(new URL('../.claude/roles/expert.md', import.meta.url), 'utf8').trim();
if (!claudeRole) throw new Error('Le rôle Claude expert est vide.');

export function resolveSolThread(explicit, current) {
  if (explicit && current && explicit !== current) throw new Error('--sol-thread doit désigner le Sol appelant, pas un autre thread.');
  const id = explicit || current;
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id || '')) throw new Error('Identifiant du Sol existant requis (--sol-thread ou CODEX_THREAD_ID).');
  return id;
}

// Failures are recorded per task. A paid response is never discarded and a bad
// task never prevents the other tasks from reaching the same Sol.
export async function transferExpertTasks({ expertRecord, cwd, outputDir, sourceArtifacts, save,
  create = createHandoff }) {
  expertRecord.handoffErrors = [];
  for (const [taskIndex, task] of expertRecord.tasksForSol.entries()) {
    try {
      const { request } = validateRequest({ ...task, sourceArtifacts }, cwd);
      const handoff = await create({ request, targetThreadId: expertRecord.solThread, cwd,
        outputDir, delivery: 'returned_to_parent' });
      expertRecord.handoffs.push({ requestDir: handoff.requestDir, requestId: handoff.requestId,
        targetThreadId: expertRecord.solThread, deliveryStatus: handoff.deliveryStatus,
        workStatus: handoff.workStatus, taskIndex });
    } catch (error) {
      expertRecord.handoffErrors.push({ taskIndex, error: String(error.message),
        nextAction: 'Corriger localement la demande conservée dans tasksForSol ; ne pas relancer Claude.' });
    }
    expertRecord.transferStatus = expertRecord.handoffErrors.length ? 'incomplete' : 'returned_to_parent';
    await save(expertRecord);
  }
  return expertRecord;
}
export const expertSchema = {
  type: 'object', additionalProperties: false,
  required: ['status', 'decision', 'reasons', 'evidence', 'openQuestions', 'tasksForSol', 'reconsultWhen'],
  properties: {
    status: { type: 'string', enum: ['advice_ready', 'needs_sol', 'blocked'] },
    decision: { type: 'string' }, reasons: { type: 'string' },
    evidence: { type: 'array', items: { type: 'string' } },
    openQuestions: { type: 'array', items: { type: 'string' } },
    tasksForSol: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      required: ['objective', 'mode', 'ownedFiles', 'checks'],
      properties: {
        objective: { type: 'string' }, mode: { type: 'string', enum: ['review', 'implement'] },
        ownedFiles: { type: 'array', items: { type: 'string' } },
        checks: { type: 'array', items: { type: 'string' } },
      },
    } },
    reconsultWhen: { type: 'string' },
  },
};

export function validateExpertResponse(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Réponse experte structurée absente.');
  for (const key of expertSchema.required) if (!(key in value)) throw new Error(`Réponse experte : ${key} absent.`);
  if (!expertSchema.properties.status.enum.includes(value.status)) throw new Error('Statut expert invalide.');
  for (const key of ['decision', 'reasons', 'reconsultWhen']) {
    if (typeof value[key] !== 'string' || !value[key].trim()) throw new Error(`Réponse experte : ${key} vide.`);
  }
  for (const key of ['evidence', 'openQuestions']) {
    if (!Array.isArray(value[key]) || value[key].some(s => typeof s !== 'string' || !s.trim())) throw new Error(`Réponse experte : ${key} invalide.`);
  }
  if (!Array.isArray(value.tasksForSol)) throw new Error('Tâches Sol invalides.');
  if ((value.status === 'needs_sol') !== (value.tasksForSol.length > 0)) throw new Error('Statut et tâches Sol incohérents.');
  if (value.status === 'advice_ready' && !value.evidence.length) throw new Error('Avis sans preuve.');
  if (value.status === 'blocked' && !value.openQuestions.length) throw new Error('Blocage sans question ouverte.');
  for (const task of value.tasksForSol) {
    if (!task || typeof task.objective !== 'string' || !task.objective.trim()
      || !['review', 'implement'].includes(task.mode)
      || !Array.isArray(task.ownedFiles) || task.ownedFiles.some(p => typeof p !== 'string' || !p.trim())
      || !Array.isArray(task.checks) || !task.checks.length || task.checks.some(p => typeof p !== 'string' || !p.trim())
      || (task.mode === 'implement' && !task.ownedFiles.length)) throw new Error('Tâche Sol sans périmètre ou preuve attendue.');
  }
  return value;
}

export function expertInstructions(solThread, mode = 'review') {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(solThread || '')) throw new Error('Identifiant du Sol existant requis (--sol-thread ou CODEX_THREAD_ID).');
  return [`Sol destinataire existant : ${solThread}.`, `Mode de cette mission : ${mode}.`, claudeRole].join('\n\n');
}
