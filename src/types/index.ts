export type PillarKey = 'seiri' | 'seiton' | 'seiso' | 'seiketsu' | 'shitsuke' | 'safety' | 'quality';

export interface AuditQuestion {
  id: string;
  text: string;
}

export interface Pillar {
  id: PillarKey;
  name: string;
  description: string;
  questions: AuditQuestion[];
}

export interface LocationGroup {
  id: string;
  name: string;
}

export interface Location {
  id: string;
  name: string;
  groupId: string;
}

export interface CorrectiveAction {
  id: string;
  description: string;
  locationId: string;
  pillarId: PillarKey;
  createdAt: string;
  completedAt?: string;
  status: 'pending' | 'completed';
}

export interface ImprovementSuggestion {
  id: string;
  description: string;
  locationId: string;
  pillarId: PillarKey;
  createdAt: string;
  implementedAt?: string;
  status: 'pending' | 'implemented';
}

export interface PillarEvaluation {
  pillarId: PillarKey;
  score: number;
  comment: string;
  questionAnswers?: Record<string, boolean>;
  correctiveActions: CorrectiveAction[];
  improvementSuggestions: ImprovementSuggestion[];
}

export interface LocationAudit {
  locationId: string;
  date: string;
  evaluations: PillarEvaluation[];
  completed: boolean;
  overallScore?: number;
  year: number;
  groupId?: string;
  auditorVisa?: string;
}

export interface GroupScore {
  groupId: string;
  score: number;
}

export interface MonthlyAudit {
  month: string; // Format: YYYY-MM
  locationAudits: LocationAudit[];
  completed: boolean;
  overallScore?: number;
  groupScores: GroupScore[];
  year: number;
}

export interface AuditHistory {
  audits: MonthlyAudit[];
}