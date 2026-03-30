// ─────────────────────────────────────────────────────────────────────────────
//  O*NET Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface OnetOccupation {
  code: string;
  title: string;
  description?: string;
  tags?: {
    bright_outlook?: boolean;
    green?: boolean;
    apprenticeship?: boolean;
  };
}

export interface OnetSearchResult {
  keyword: string;
  start: number;
  end: number;
  total: number;
  occupation: OnetOccupation[];
}

export interface OnetElement {
  id: string;
  name: string;
  description: string;
  scale?: {
    id: string;
    name: string;
    minimum: number;
    maximum: number;
  };
  score?: {
    value: number;
    important?: boolean;
    level?: number;
  };
}

export interface OnetDomainData {
  occupation: {
    code: string;
    title: string;
  };
  element: OnetElement[];
}

// The domains we assess across
export type AssessmentDomain =
  | 'skills'
  | 'knowledge'
  | 'abilities'
  | 'work_styles'
  | 'interests'
  | 'work_activities'
  | 'work_context'
  | 'technology_skills';

// Maps our domain keys to O*NET Online API v2 endpoint segments
// Used with: /online/occupations/{code}/summary/{endpoint}
export const DOMAIN_ENDPOINT: Record<AssessmentDomain, string> = {
  skills: 'skills',
  knowledge: 'knowledge',
  abilities: 'abilities',
  work_styles: 'work_styles',
  interests: 'interests',
  work_activities: 'work_activities',
  work_context: 'work_context',
  technology_skills: 'technology_skills',
};

export const DOMAIN_LABELS: Record<AssessmentDomain, string> = {
  skills: 'Skills',
  knowledge: 'Knowledge',
  abilities: 'Abilities',
  work_styles: 'Work Styles',
  interests: 'Interests',
  work_activities: 'Work Activities',
  work_context: 'Work Context',
  technology_skills: 'Technology Skills',
};

// User's 0–3 rating
export type UserRating = 0 | 1 | 2 | 3;

export const RATING_LABELS: Record<UserRating, string> = {
  0: 'None',
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
};

// Maps our 0-3 scale to O*NET's 1-7 level scale
export const RATING_TO_ONET_LEVEL: Record<UserRating, number> = {
  0: 1,
  1: 3,
  2: 5,
  3: 7,
};

export interface RatedElement {
  elementId: string;
  elementName: string;
  rating: UserRating;
  onetImportance: number; // 1-5 from O*NET
  onetLevel: number;      // 1-7 from O*NET
}

export interface DomainRatings {
  domain: AssessmentDomain;
  elements: RatedElement[];
}

export interface AssessmentResult {
  occupationCode: string;
  occupationTitle: string;
  fitScore: number;          // 0.0 – 1.0
  domainScores: Record<AssessmentDomain, number>;
  gaps: RatedElement[];      // top elements where user is below requirement
  strengths: RatedElement[]; // top elements where user meets/exceeds requirement
  altOccupations?: Array<{ code: string; title: string; fitScore: number }>;
}
