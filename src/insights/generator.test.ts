import { describe, it, expect, beforeEach } from 'vitest';
import { InsightGenerator } from './generator.js';
import { CoachConfig, CommitInfo } from '../types/index.js';

describe('InsightGenerator', () => {
  let generator: InsightGenerator;
  let config: CoachConfig;
  let mockCommit: CommitInfo;

  beforeEach(() => {
    config = {
      rules: [],
      output: {
        format: 'console',
        includeSummary: true,
        maxInsights: 10,
      },
      integrations: {},
      thresholds: {
        minConfidence: 0.5,
        maxInsightsPerType: {
          error: 5,
          warning: 8,
          suggestion: 10,
          info: 15,
        },
        skipOnSmallChanges: true,
        smallChangeThreshold: 10,
      },
    };

    generator = new InsightGenerator(config);

    mockCommit = {
      hash: 'abc123',
      message: 'Add new feature',
      author: 'Test Author',
      date: new Date(),
      diff: '',
      files: [],
    };
  });

  describe('generateInsights', () => {
    it('should generate insights for missing tests', () => {
      mockCommit.files = [
        {
          path: 'src/utils/helper.js',
          status: 'added',
          additions: 50,
          deletions: 0,
          diff: 'export function helper() {}',
        },
      ];

      const result = generator.generateInsights(mockCommit);

      expect(result.insights).toHaveLength(1);
      expect(result.insights[0]).toMatchObject({
        id: 'missing-tests',
        type: 'warning',
        title: 'Missing Test Coverage',
      });
    });

    it('should generate positive insights for added tests', () => {
      mockCommit.files = [
        {
          path: 'src/utils/helper.test.js',
          status: 'added',
          additions: 30,
          deletions: 0,
          diff: 'describe("helper", () => {})',
        },
      ];

      const result = generator.generateInsights(mockCommit);

      const testInsight = result.insights.find(i => i.id === 'tests-added');
      expect(testInsight).toMatchObject({
        id: 'tests-added',
        type: 'info',
        title: 'Tests Added',
      });
    });

    it('should generate insights for large commits', () => {
      mockCommit.files = [
        {
          path: 'src/large-file.js',
          status: 'added',
          additions: 250,
          deletions: 0,
          diff: '// Large file content...',
        },
      ];

      const result = generator.generateInsights(mockCommit);

      // Should generate multiple insights: missing tests, large commit, missing docs
      expect(result.insights.length).toBeGreaterThan(0);
      const largeCommitInsight = result.insights.find(
        i => i.id === 'large-commit'
      );
      expect(largeCommitInsight).toMatchObject({
        id: 'large-commit',
        type: 'info',
        title: 'Large Commit',
      });
    });

    it('should generate insights for short commit messages', () => {
      mockCommit.message = 'fix';
      mockCommit.files = [
        {
          path: 'src/fix.js',
          status: 'modified',
          additions: 5,
          deletions: 2,
          diff: '// Small fix',
        },
      ];

      const result = generator.generateInsights(mockCommit);

      // Should generate insights including short commit message
      expect(result.insights.length).toBeGreaterThan(0);
      const shortMessageInsight = result.insights.find(
        i => i.id === 'short-commit-message'
      );
      expect(shortMessageInsight).toMatchObject({
        id: 'short-commit-message',
        type: 'suggestion',
        title: 'Short Commit Message',
      });
    });

    it('should generate insights for public API removals', () => {
      mockCommit.files = [
        {
          path: 'src/api.js',
          status: 'modified',
          additions: 0,
          deletions: 5,
          diff: '-export function removedFunction() {}',
        },
      ];

      const result = generator.generateInsights(mockCommit);

      // Should generate insights including public API removal and breaking changes
      expect(result.insights.length).toBeGreaterThan(0);
      const apiRemovedInsight = result.insights.find(
        i => i.id === 'public-api-removed'
      );
      expect(apiRemovedInsight).toMatchObject({
        id: 'public-api-removed',
        type: 'warning',
        title: 'Public API Removed',
      });
    });

    it('should generate insights for feature flags', () => {
      mockCommit.files = [
        {
          path: 'src/config.js',
          status: 'modified',
          additions: 5,
          deletions: 0,
          diff: '+const FEATURE_NEW_UI = true;',
        },
      ];

      const result = generator.generateInsights(mockCommit);

      // Should generate insights including feature flags
      expect(result.insights.length).toBeGreaterThan(0);
      const featureFlagInsight = result.insights.find(
        i => i.id === 'feature-flags-added'
      );
      expect(featureFlagInsight).toMatchObject({
        id: 'feature-flags-added',
        type: 'suggestion',
        title: 'New Feature Flags Added',
      });
    });

    it('should generate summary statistics', () => {
      mockCommit.files = [
        {
          path: 'src/file1.js',
          status: 'added',
          additions: 50,
          deletions: 0,
          diff: '// File 1',
        },
        {
          path: 'src/file2.js',
          status: 'modified',
          additions: 25,
          deletions: 10,
          diff: '// File 2',
        },
      ];

      const result = generator.generateInsights(mockCommit);

      expect(result.summary).toMatchObject({
        totalLines: 85,
        filesChanged: 2,
        testFilesChanged: 0,
        documentationFilesChanged: 0,
      });
    });

    it('should filter insights by confidence threshold', () => {
      config.thresholds.minConfidence = 0.9;
      generator = new InsightGenerator(config);

      mockCommit.files = [
        {
          path: 'src/small-file.js',
          status: 'added',
          additions: 5,
          deletions: 0,
          diff: '// Small change',
        },
      ];

      const result = generator.generateInsights(mockCommit);

      // Should have fewer insights due to higher confidence threshold
      expect(result.insights.length).toBeLessThanOrEqual(1);
    });

    it('should limit insights by maxInsights', () => {
      config.output.maxInsights = 2;
      generator = new InsightGenerator(config);

      mockCommit.files = [
        {
          path: 'src/large-file.js',
          status: 'added',
          additions: 250,
          deletions: 0,
          diff: '// Large file',
        },
      ];
      mockCommit.message = 'fix';

      const result = generator.generateInsights(mockCommit);

      expect(result.insights.length).toBeLessThanOrEqual(2);
    });
  });
});
