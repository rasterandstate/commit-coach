/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigLoader } from './loader.js';
import { readFileSync, existsSync } from 'fs';
import { parse } from 'yaml';

// Mock fs and yaml
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

vi.mock('yaml', () => ({
  parse: vi.fn(),
}));

// Type the mocked functions
const mockReadFileSync = readFileSync as any;
const mockExistsSync = existsSync as any;
const mockParse = parse as any;

describe('ConfigLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadConfig', () => {
    it('should load config from YAML file', () => {
      const mockConfig = {
        rules: [
          {
            id: 'test-rule',
            enabled: true,
            severity: 'warning',
            conditions: ['test'],
            message: 'Test message',
          },
        ],
        output: {
          format: 'console',
          maxInsights: 5,
        },
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('rules:\n  - id: test-rule');
      mockParse.mockReturnValue(mockConfig);

      const result = ConfigLoader.loadConfig('.');

      expect(mockExistsSync).toHaveBeenCalled();
      expect(mockReadFileSync).toHaveBeenCalled();
      expect(mockParse).toHaveBeenCalled();
      expect(result.rules).toHaveLength(1);
      expect(result.rules[0].id).toBe('test-rule');
    });

    it('should load config from JSON file', () => {
      const mockConfig = {
        rules: [],
        output: { format: 'console' },
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('{"rules": []}');
      mockParse.mockReturnValue(mockConfig);

      const result = ConfigLoader.loadConfig('.');

      expect(result).toBeDefined();
    });

    it('should handle JSON config files', () => {
      const mockConfig = {
        rules: [
          {
            id: 'test-rule',
            enabled: true,
            severity: 'warning',
            conditions: ['test'],
            message: 'Test message',
          },
        ],
        output: {
          format: 'console',
          maxInsights: 5,
        },
      };

      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('commit-coach.json');
      });
      mockReadFileSync.mockReturnValue('{"rules": [{"id": "test-rule"}]}');
      mockParse.mockReturnValue(mockConfig);

      const result = ConfigLoader.loadConfig('.');

      expect(mockExistsSync).toHaveBeenCalled();
      expect(mockReadFileSync).toHaveBeenCalled();
      expect(result.rules).toHaveLength(1);
      expect(result.rules[0].id).toBe('test-rule');
    });

    it('should return default config when no config file exists', () => {
      mockExistsSync.mockReturnValue(false);

      const result = ConfigLoader.loadConfig('.');

      expect(result.rules).toHaveLength(7); // Default rules count
      expect(result.output.format).toBe('console');
      expect(result.thresholds.minConfidence).toBe(0.5);
    });

    it('should handle config loading errors gracefully', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const result = ConfigLoader.loadConfig('.');

      // Should fall back to default config
      expect(result.rules).toHaveLength(7);
    });

    it('should merge user config with defaults', () => {
      const userConfig = {
        output: {
          format: 'comment',
          maxInsights: 15,
        },
        thresholds: {
          minConfidence: 0.8,
        },
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('output:\n  format: comment');
      mockParse.mockReturnValue(userConfig);

      const result = ConfigLoader.loadConfig('.');

      expect(result.output.format).toBe('comment');
      expect(result.output.maxInsights).toBe(15);
      expect(result.thresholds.minConfidence).toBe(0.8);
      expect(result.rules).toHaveLength(7); // Default rules should still be there
    });
  });

  describe('findConfigFile', () => {
    it('should find YAML config files', () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('commit-coach.yml');
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (ConfigLoader as any).findConfigFile('.');

      expect(result).toContain('commit-coach.yml');
    });

    it('should find JSON config files', () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('commit-coach.json');
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (ConfigLoader as any).findConfigFile('.');

      expect(result).toContain('commit-coach.json');
    });

    it('should return null when no config file exists', () => {
      mockExistsSync.mockReturnValue(false);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (ConfigLoader as any).findConfigFile('.');

      expect(result).toBeNull();
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default configuration', () => {
      const config = ConfigLoader.getDefaultConfig();

      expect(config.rules).toHaveLength(7);
      expect(config.output.format).toBe('console');
      expect(config.output.includeSummary).toBe(true);
      expect(config.output.maxInsights).toBe(10);
      expect(config.thresholds.minConfidence).toBe(0.5);
      expect(config.thresholds.skipOnSmallChanges).toBe(true);
      expect(config.thresholds.smallChangeThreshold).toBe(10);
    });

    it('should include all default rules', () => {
      const config = ConfigLoader.getDefaultConfig();
      const ruleIds = config.rules.map(rule => rule.id);

      expect(ruleIds).toContain('missing-tests');
      expect(ruleIds).toContain('public-api-removed');
      expect(ruleIds).toContain('large-commit');
      expect(ruleIds).toContain('missing-documentation');
      expect(ruleIds).toContain('feature-flags-added');
      expect(ruleIds).toContain('breaking-changes');
      expect(ruleIds).toContain('short-commit-message');
    });
  });

  describe('getDefaultRules', () => {
    it('should return default rules with correct structure', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rules = (ConfigLoader as any).getDefaultRules();

      expect(rules).toHaveLength(7);
      rules.forEach((rule: Record<string, unknown>) => {
        expect(rule).toHaveProperty('id');
        expect(rule).toHaveProperty('enabled');
        expect(rule).toHaveProperty('severity');
        expect(rule).toHaveProperty('conditions');
        expect(rule).toHaveProperty('message');
        expect(['error', 'warning', 'info', 'suggestion']).toContain(
          rule.severity
        );
      });
    });
  });

  describe('getDefaultOutputConfig', () => {
    it('should return default output configuration', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const output = (ConfigLoader as any).getDefaultOutputConfig();

      expect(output.format).toBe('console');
      expect(output.includeSummary).toBe(true);
      expect(output.maxInsights).toBe(10);
    });
  });

  describe('getDefaultIntegrationConfig', () => {
    it('should return default integration configuration', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const integrations = (ConfigLoader as any).getDefaultIntegrationConfig();

      expect(integrations.console).toBeDefined();
      expect(integrations.console.colorize).toBe(true);
      expect(integrations.console.verbose).toBe(false);
    });
  });

  describe('getDefaultThresholdConfig', () => {
    it('should return default threshold configuration', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const thresholds = (ConfigLoader as any).getDefaultThresholdConfig();

      expect(thresholds.minConfidence).toBe(0.5);
      expect(thresholds.skipOnSmallChanges).toBe(true);
      expect(thresholds.smallChangeThreshold).toBe(10);
      expect(thresholds.maxInsightsPerType).toBeDefined();
      expect(thresholds.maxInsightsPerType.error).toBe(5);
      expect(thresholds.maxInsightsPerType.warning).toBe(8);
      expect(thresholds.maxInsightsPerType.suggestion).toBe(10);
      expect(thresholds.maxInsightsPerType.info).toBe(15);
    });
  });

  describe('createSampleConfig', () => {
    it('should create sample configuration', () => {
      const sample = ConfigLoader.createSampleConfig();

      expect(sample).toContain('# Commit Coach Configuration');
      expect(sample).toContain('rules:');
      expect(sample).toContain('output:');
      expect(sample).toContain('integrations:');
      expect(sample).toContain('thresholds:');
      expect(sample).toContain('missing-tests');
      expect(sample).toContain('public-api-removed');
    });
  });

  describe('mergeWithDefaults', () => {
    it('should merge user config with defaults', () => {
      const userConfig = {
        output: {
          format: 'comment',
          maxInsights: 15,
        },
        thresholds: {
          minConfidence: 0.8,
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (ConfigLoader as any).mergeWithDefaults(userConfig);

      expect(result.output.format).toBe('comment');
      expect(result.output.maxInsights).toBe(15);
      expect(result.output.includeSummary).toBe(true); // From default
      expect(result.thresholds.minConfidence).toBe(0.8);
      expect(result.thresholds.skipOnSmallChanges).toBe(true); // From default
      expect(result.rules).toHaveLength(7); // Default rules
    });

    it('should handle empty user config', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (ConfigLoader as any).mergeWithDefaults({});

      expect(result.rules).toHaveLength(7);
      expect(result.output.format).toBe('console');
      expect(result.thresholds.minConfidence).toBe(0.5);
    });
  });
});
