import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
import {
  CoachConfig,
  RuleConfig,
  OutputConfig,
  IntegrationConfig,
  ThresholdConfig,
} from '../types/index.js';

export class ConfigLoader {
  private static readonly CONFIG_FILES = [
    'commit-coach.yml',
    'commit-coach.yaml',
    '.commit-coach.yml',
    '.commit-coach.yaml',
    'commit-coach.json',
    '.commit-coach.json',
  ];

  static loadConfig(projectRoot: string = '.'): CoachConfig {
    const configPath = this.findConfigFile(projectRoot);

    if (configPath) {
      return this.loadFromFile(configPath);
    }

    return this.getDefaultConfig();
  }

  private static findConfigFile(projectRoot: string): string | null {
    for (const configFile of this.CONFIG_FILES) {
      const fullPath = join(projectRoot, configFile);
      if (existsSync(fullPath)) {
        return fullPath;
      }
    }
    return null;
  }

  private static loadFromFile(configPath: string): CoachConfig {
    try {
      const content = readFileSync(configPath, 'utf-8');
      const isYaml =
        configPath.endsWith('.yml') || configPath.endsWith('.yaml');

      const rawConfig = isYaml ? parse(content) : JSON.parse(content);

      return this.mergeWithDefaults(rawConfig);
    } catch (error) {
      console.warn(`Failed to load config from ${configPath}: ${error}`);
      return this.getDefaultConfig();
    }
  }

  private static mergeWithDefaults(
    userConfig: Record<string, unknown>
  ): CoachConfig {
    const defaultConfig = this.getDefaultConfig();

    return {
      rules: (userConfig.rules as RuleConfig[]) || defaultConfig.rules,
      output: {
        ...defaultConfig.output,
        ...((userConfig.output as Partial<OutputConfig>) || {}),
      },
      integrations: {
        ...defaultConfig.integrations,
        ...((userConfig.integrations as Partial<IntegrationConfig>) || {}),
      },
      thresholds: {
        ...defaultConfig.thresholds,
        ...((userConfig.thresholds as Partial<ThresholdConfig>) || {}),
      },
    };
  }

  static getDefaultConfig(): CoachConfig {
    return {
      rules: this.getDefaultRules(),
      output: this.getDefaultOutputConfig(),
      integrations: this.getDefaultIntegrationConfig(),
      thresholds: this.getDefaultThresholdConfig(),
    };
  }

  private static getDefaultRules(): RuleConfig[] {
    return [
      {
        id: 'missing-tests',
        enabled: true,
        severity: 'warning',
        conditions: ['sourceFilesWithoutTests.length > 0'],
        message: 'Consider adding tests for new/modified source files',
      },
      {
        id: 'public-api-removed',
        enabled: true,
        severity: 'warning',
        conditions: ['removedApis.length > 0'],
        message: 'Public API removed - check for downstream dependencies',
      },
      {
        id: 'large-commit',
        enabled: true,
        severity: 'info',
        conditions: ['totalLines > 200'],
        message: 'Large commit - consider breaking into smaller changes',
      },
      {
        id: 'missing-documentation',
        enabled: true,
        severity: 'suggestion',
        conditions: ['hasNewFeatures && !hasDocUpdates'],
        message: 'Consider updating documentation for new features',
      },
      {
        id: 'feature-flags-added',
        enabled: true,
        severity: 'suggestion',
        conditions: ['featureFlags.length > 0'],
        message: 'Document new feature flags and their purpose',
      },
      {
        id: 'breaking-changes',
        enabled: true,
        severity: 'error',
        conditions: ['breakingChanges.length > 0'],
        message: 'Breaking changes detected - update version and changelog',
      },
      {
        id: 'short-commit-message',
        enabled: true,
        severity: 'suggestion',
        conditions: ['messageLength < 10'],
        message: 'Consider adding more context to commit message',
      },
    ];
  }

  private static getDefaultOutputConfig(): OutputConfig {
    return {
      format: 'console',
      includeSummary: true,
      maxInsights: 10,
    };
  }

  private static getDefaultIntegrationConfig(): IntegrationConfig {
    return {
      console: {
        colorize: true,
        verbose: false,
      },
    };
  }

  private static getDefaultThresholdConfig(): ThresholdConfig {
    return {
      minConfidence: 0.5,
      maxInsightsPerType: {
        error: 5,
        warning: 8,
        suggestion: 10,
        info: 15,
      },
      skipOnSmallChanges: true,
      smallChangeThreshold: 10,
    };
  }

  static createSampleConfig(): string {
    return `# Commit Coach Configuration
# This file configures the commit analysis and insight generation

rules:
  - id: missing-tests
    enabled: true
    severity: warning
    conditions: ["sourceFilesWithoutTests.length > 0"]
    message: "Consider adding tests for new/modified source files"
  
  - id: public-api-removed
    enabled: true
    severity: warning
    conditions: ["removedApis.length > 0"]
    message: "Public API removed - check for downstream dependencies"
  
  - id: large-commit
    enabled: true
    severity: info
    conditions: ["totalLines > 200"]
    message: "Large commit - consider breaking into smaller changes"

output:
  format: console  # console, comment, status-check, report
  includeSummary: true
  maxInsights: 10

integrations:
  github:
    token: "\${GITHUB_TOKEN}"
    owner: "your-org"
    repo: "your-repo"
    commentOnPR: true
    createStatusCheck: true
  
  console:
    colorize: true
    verbose: false

thresholds:
  minConfidence: 0.5
  maxInsightsPerType:
    error: 5
    warning: 8
    suggestion: 10
    info: 15
  skipOnSmallChanges: true
  smallChangeThreshold: 10
`;
  }
}
