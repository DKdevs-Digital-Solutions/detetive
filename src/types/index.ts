export type Screen =
  | 'home'
  | 'assistant'
  | 'news'
  | 'quiz'
  | 'checklist'
  | 'ai-errors'
  | 'certificate'
  | 'admin';

export type BadgeId = 'assistant' | 'news' | 'quiz' | 'checklist' | 'ai-errors';

export type VoiceStatus = 'idle' | 'listening' | 'analyzing' | 'responding';

export type ConfidenceLevel = 'green' | 'yellow' | 'red';

export type GestureType =
  | 'open_hand'
  | 'thumbs_up'
  | 'thumbs_down'
  | 'pointing_up'
  | 'circular'
  | 'two_hands'
  | null;

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AnalysisResult {
  level: ConfidenceLevel;
  riskLabel: string;
  title: string;
  explanation: string;
  suspiciousPoints: string[];
  positivePoints: string[];
  recommendation: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface UsageStats {
  visitors: number;
  questions: number;
  newsAnalyzed: number;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  quizAvgScore: number;
  startedAt: string;
}
