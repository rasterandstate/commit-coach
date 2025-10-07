export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: Date;
  diff: string;
  files: ChangedFile[];
}

export interface ChangedFile {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  diff: string;
}

export interface Insight {
  id: string;
  type: 'warning' | 'suggestion' | 'info' | 'error';
  title: string;
  message: string;
  confidence: number; // 0-1
  metadata?: Record<string, unknown>;
}

export interface AnalysisResult {
  commit: CommitInfo;
  insights: Insight[];
  summary: {
    totalLines: number;
    filesChanged: number;
    testFilesChanged: number;
    documentationFilesChanged: number;
  };
}

export interface CoachConfig {
  rules: RuleConfig[];
  output: OutputConfig;
  integrations: IntegrationConfig;
  thresholds: ThresholdConfig;
}

export interface RuleConfig {
  id: string;
  enabled: boolean;
  severity: 'error' | 'warning' | 'info' | 'suggestion';
  conditions: string[];
  message: string;
  metadata?: Record<string, unknown>;
}

export interface OutputConfig {
  format: 'comment' | 'status-check' | 'report' | 'console';
  includeSummary: boolean;
  maxInsights: number;
}

export interface IntegrationConfig {
  github?: GitHubConfig;
  gitlab?: GitLabConfig;
  console?: ConsoleConfig;
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  prNumber?: number;
  commentOnPR: boolean;
  createStatusCheck: boolean;
}

export interface GitLabConfig {
  token: string;
  projectId: string;
  mergeRequestId?: number;
  commentOnMR: boolean;
}

export interface ConsoleConfig {
  colorize: boolean;
  verbose: boolean;
}

export interface ThresholdConfig {
  minConfidence: number;
  maxInsightsPerType: Record<string, number>;
  skipOnSmallChanges: boolean;
  smallChangeThreshold: number;
}

// Additional interfaces for semantic analysis
export interface DocumentationChange {
  type: 'readme' | 'api-docs' | 'comments' | 'changelog';
  file: string;
  action: 'added' | 'modified' | 'deleted' | 'renamed';
  hasNewFeatures: boolean;
}
