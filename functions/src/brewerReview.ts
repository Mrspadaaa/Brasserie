type ReviewBody = Record<string, any>;

export interface BrewerReviewerResult {
  role: 'technical' | 'practical';
  approved: boolean;
  proposalApproved?: boolean;
  issues: string[];
}

export interface BrewerReviewResult {
  approved: boolean;
  proposalApproved?: boolean;
  issues: string[];
  reviewers: BrewerReviewerResult[];
}

const PRACTICAL_REVIEW = `Tu assures une seconde relecture indépendante, centrée sur l’utilité concrète pour ce brasseur. Applique les mêmes règles de validation et le même schéma JSON. Vérifie seulement la réponse actuelle et les éléments fournis, sans ajouter de préférence, d’audit ou de recherche hors de la demande.
Pour un achat, contrôle la pertinence de chaque produit affiché : variété, forme, conditionnement et URL exacte vérifiée. Une alternative doit être expliquée. Une unité de commande au poids (par exemple 10 g) ne prouve pas un sachet individuel : refuse un nombre d’emballages non documenté. Prix, disponibilité et économies doivent être justifiés par les preuves fournies ; une donnée absente reste inconnue. Ne réclame pas de stock certain quand la réponse indique honnêtement son absence.
Pour les comptes, prévisions et investissements, distingue données réelles, hypothèses, paiement futur et amortissement. Ne refais aucun calcul de tête pour contredire un outil. Un conseil conditionnel utile reste acceptable.
La prochaine action doit être compréhensible et réalisable dans le contexte du brasseur. Ne refuse pas pour une préférence de style ou une information facultative manquante. Signale uniquement des corrections concrètes et fondées. Tu ne disposes d’aucun verdict d’un autre réviseur et dois conclure indépendamment.`;

function invalidReview(role: BrewerReviewerResult['role']): BrewerReviewerResult {
  return {
    role,
    approved: false,
    proposalApproved: false,
    issues: [`Format de la relecture ${role === 'technical' ? 'technique' : 'pratique'} invalide : une validation JSON explicite est nécessaire.`]
  };
}

function uniqueIssues(issues: string[]): string[] {
  const seen = new Set<string>();
  return issues.map(issue => issue.trim().replace(/\s+/g, ' ').slice(0, 800)).filter(issue => {
    const key = issue.toLocaleLowerCase('fr');
    if (!issue || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);
}

function parseReview(payload: any, role: BrewerReviewerResult['role']): BrewerReviewerResult {
  try {
    const parts = payload?.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts)) return invalidReview(role);
    const text = parts.filter(part => !part?.thought && typeof part?.text === 'string')
      .map(part => part.text).join('').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const review = JSON.parse(text);
    if (!review || Array.isArray(review) || typeof review !== 'object'
      || typeof review.approved !== 'boolean'
      || (review.proposalApproved !== undefined && typeof review.proposalApproved !== 'boolean')
      || !Array.isArray(review.issues)
      || !review.issues.every((issue: unknown) => typeof issue === 'string' && issue.trim().length > 0)) {
      return invalidReview(role);
    }
    const issues = uniqueIssues(review.issues);
    return {
      role,
      approved: review.approved && issues.length === 0,
      ...(review.proposalApproved !== undefined ? { proposalApproved: review.proposalApproved } : {}),
      issues
    };
  } catch {
    return invalidReview(role);
  }
}

/** The caller chooses and budgets the model. Reviewers share evidence, never verdicts. */
export async function reviewBrewerAdvice(
  body: ReviewBody,
  generateReview: (body: ReviewBody) => Promise<unknown>,
  options: { parallel: boolean }
): Promise<BrewerReviewResult> {
  const roles: BrewerReviewerResult['role'][] = options.parallel ? ['technical', 'practical'] : ['technical'];
  const requestedOutput = body.generationConfig?.maxOutputTokens;
  const maxOutputTokens = typeof requestedOutput === 'number' && Number.isFinite(requestedOutput) && requestedOutput >= 1
    ? Math.min(2000, Math.floor(requestedOutput)) : 2000;
  const settled = await Promise.allSettled(roles.map(async role => {
    const request = {
      ...body,
      ...(role === 'practical' ? {
        systemInstruction: {
          ...body.systemInstruction,
          parts: [...(body.systemInstruction?.parts ?? []), { text: PRACTICAL_REVIEW }]
        }
      } : {}),
      generationConfig: { ...body.generationConfig, maxOutputTokens }
    };
    return parseReview(await generateReview(request), role);
  }));
  // Await every paid request before returning an error; never retry from this helper.
  const failure = settled.find((result): result is PromiseRejectedResult => result.status === 'rejected');
  if (failure) throw failure.reason;
  const reviewers = settled.map(result => (result as PromiseFulfilledResult<BrewerReviewerResult>).value);
  const proposalApproved = reviewers.some(review => review.proposalApproved === false) ? false
    : reviewers.every(review => review.proposalApproved === true) ? true : undefined;
  return {
    approved: reviewers.every(review => review.approved),
    ...(proposalApproved !== undefined ? { proposalApproved } : {}),
    issues: uniqueIssues(reviewers.flatMap(review => review.issues)),
    reviewers
  };
}
