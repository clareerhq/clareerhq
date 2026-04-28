// ─────────────────────────────────────────────────────────────────────────────
//  ClareerHQ Match Scoring Algorithm
//  Produces a 0.0–1.0 fit score between a user's ratings and an occupation
// ─────────────────────────────────────────────────────────────────────────────

import type { DomainRatings, AssessmentResult, AssessmentDomain, UserRating, RatedElement } from '@/types/onet';
import { RATING_TO_ONET_LEVEL } from '@/types/onet';

// How much each domain contributes to the overall score
const DOMAIN_WEIGHTS: Record<AssessmentDomain, number> = {
  skills: 0.30,
  knowledge: 0.20,
  abilities: 0.20,
  work_styles: 0.10,
  interests: 0.05,
  work_activities: 0.05,
  work_context: 0.05,
  technology_skills: 0.05,
};

/**
 * Computes how well a user's rating for a single element matches the O*NET requirement.
 *
 * - If user meets or exceeds: full credit (importance-weighted)
 * - If user is below: penalised proportionally to the gap AND the importance of the element
 *
 * Returns a value 0.0 – 1.0 representing this element's contribution to domain score.
 */
function scoreElement(
  userRating: UserRating,
  onetImportance: number, // 1–5
  onetLevel: number       // 1–7
): number {
  // Rating 0 means "None" — no credit regardless of the element's level
  if (userRating === 0) return 0;

  const userLevel = RATING_TO_ONET_LEVEL[userRating]; // 3, 5, or 7

  // Normalised importance weight (0–1)
  const importanceWeight = (onetImportance - 1) / 4;

  if (userLevel >= onetLevel) {
    // User meets or exceeds requirement — full credit
    return importanceWeight;
  } else {
    // Gap: user is below requirement
    const gap = onetLevel - userLevel;
    const maxGap = 6; // max possible gap (7 - 1)
    const gapPenalty = (gap / maxGap) * importanceWeight;
    return Math.max(0, importanceWeight - gapPenalty);
  }
}

/**
 * Scores a single domain.
 * Returns 0.0–1.0 representing how well the user's ratings match this domain.
 */
function scoreDomain(domainRatings: DomainRatings): number {
  const { elements } = domainRatings;
  if (!elements || elements.length === 0) return 0;

  const totalPossible = elements.reduce(
    (sum, el) => sum + (el.onetImportance - 1) / 4,
    0
  );
  if (totalPossible === 0) return 0;

  const achieved = elements.reduce(
    (sum, el) => sum + scoreElement(el.rating, el.onetImportance, el.onetLevel),
    0
  );

  return Math.min(1, achieved / totalPossible);
}

/**
 * Computes the full assessment result for one occupation.
 */
export function computeFitScore(
  ratings: DomainRatings[],
  occupationCode: string,
  occupationTitle: string
): AssessmentResult {
  const domainScores: Partial<Record<AssessmentDomain, number>> = {};
  let weightedSum = 0;
  let totalWeight = 0;

  for (const domainRatings of ratings) {
    const domain = domainRatings.domain;
    const weight = DOMAIN_WEIGHTS[domain] ?? 0.1;
    const score = scoreDomain(domainRatings);

    domainScores[domain] = score;
    weightedSum += score * weight;
    totalWeight += weight;
  }

  const fitScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Find gaps (elements where user is below requirement, sorted by gap magnitude × importance)
  const allElements = ratings.flatMap((d) => d.elements);

  const gaps: RatedElement[] = allElements
    .filter((el) => RATING_TO_ONET_LEVEL[el.rating] < el.onetLevel)
    .sort((a, b) => {
      const gapA = a.onetLevel - RATING_TO_ONET_LEVEL[a.rating];
      const gapB = b.onetLevel - RATING_TO_ONET_LEVEL[b.rating];
      return gapB * b.onetImportance - gapA * a.onetImportance;
    })
    .slice(0, 5);

  // Find strengths (user meets or exceeds, sorted by importance)
  const strengths: RatedElement[] = allElements
    .filter((el) => RATING_TO_ONET_LEVEL[el.rating] >= el.onetLevel && el.rating >= 2)
    .sort((a, b) => b.onetImportance - a.onetImportance)
    .slice(0, 5);

  return {
    occupationCode,
    occupationTitle,
    fitScore,
    domainScores: domainScores as Record<AssessmentDomain, number>,
    gaps,
    strengths,
  };
}

/**
 * Provides a human-readable label for a fit score.
 */
export function getFitLabel(score: number): string {
  if (score >= 0.85) return 'Excellent Match';
  if (score >= 0.70) return 'Strong Match';
  if (score >= 0.55) return 'Good Match';
  if (score >= 0.40) return 'Fair Match';
  return 'Developing';
}

export function getFitColor(score: number): string {
  if (score >= 0.85) return 'text-accent-600';
  if (score >= 0.70) return 'text-brand-600';
  if (score >= 0.55) return 'text-blue-500';
  if (score >= 0.40) return 'text-yellow-500';
  return 'text-gray-400';
}

// ─────────────────────────────────────────────────────────────────────────────
//  Skill-Print scoring
//  Converts raw 0–3 element ratings into category-level pip values (0–3)
// ─────────────────────────────────────────────────────────────────────────────

export type PipValue = 0 | 1 | 2 | 3;

export interface SkillPrintCategory {
  key: string;
  label: string;
  pip: PipValue;
  elements: Array<{ id: string; name: string; pip: PipValue }>;
}

// The 8 display categories shown on a Skill-Print, in order
export const SKILLPRINT_CATEGORIES: Array<{ key: AssessmentDomain; label: string }> = [
  { key: 'skills',            label: 'Skills' },
  { key: 'knowledge',         label: 'Knowledge Areas' },
  { key: 'work_styles',       label: 'Work Styles' },
  { key: 'abilities',         label: 'Abilities' },
  { key: 'interests',         label: 'Interests' },
  { key: 'work_activities',   label: 'Work Activities' },
  { key: 'work_context',      label: 'Work Context' },
  { key: 'technology_skills', label: 'Technology Skills' },
];

/**
 * Converts a domain's element ratings into a single 0–3 pip value.
 * Only counts elements the user actively rated (> 0) to avoid
 * skipped items dragging down the category average.
 */
function domainToPip(domainRatings: DomainRatings | undefined): PipValue {
  if (!domainRatings || domainRatings.elements.length === 0) return 0;
  const rated = domainRatings.elements.filter(el => el.rating > 0);
  if (rated.length === 0) return 0;
  const avg = rated.reduce((sum, el) => sum + el.rating, 0) / rated.length;
  return Math.min(3, Math.round(avg)) as PipValue;
}

/**
 * Builds the Skill-Print category breakdown from raw domain ratings.
 * Returns the 5 display categories, each with a category-level pip
 * and a sorted list of individual rated elements with their pip values.
 */
export function computeSkillPrint(ratings: DomainRatings[]): SkillPrintCategory[] {
  const byDomain = Object.fromEntries(ratings.map(r => [r.domain, r]));

  return SKILLPRINT_CATEGORIES.map(({ key, label }) => {
    const domain = byDomain[key];
    const pip = domainToPip(domain);

    const elements = (domain?.elements ?? [])
      .filter(el => el.rating > 0)
      .sort((a, b) => b.rating - a.rating)
      .map(el => ({
        id: el.elementId,
        name: el.elementName,
        pip: el.rating as PipValue,
      }));

    return { key, label, pip, elements };
  });
}
