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
    it('should generate security insights for XSS risks', () => {
      mockCommit.diff = `
        <div id="content"></div>
        <script>
          document.getElementById('content').innerHTML = userInput;
        </script>
      `;

      const result = generator.generateInsights(mockCommit);

      const xssInsight = result.insights.find(insight => insight.id === 'xss-risk');
      expect(xssInsight).toBeDefined();
      expect(xssInsight?.type).toBe('error');
      expect(xssInsight?.title).toBe('Potential XSS Risk');
      expect(xssInsight?.confidence).toBe(0.6);
    });

    it('should not generate XSS insight when textContent is used', () => {
      mockCommit.diff = `
        <div id="content"></div>
        <script>
          document.getElementById('content').innerHTML = userInput;
          document.getElementById('content').textContent = safeInput;
        </script>
      `;

      const result = generator.generateInsights(mockCommit);

      const xssInsight = result.insights.find(insight => insight.id === 'xss-risk');
      expect(xssInsight).toBeUndefined();
    });

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

    it('should generate debug code insights', () => {
      mockCommit.diff = `
        console.log('Debug message');
        debugger;
        alert('Debug alert');
      `;

      const result = generator.generateInsights(mockCommit);

      const debugInsight = result.insights.find(insight => insight.id === 'debug-code');
      expect(debugInsight).toBeDefined();
      expect(debugInsight?.type).toBe('warning');
      expect(debugInsight?.title).toBe('Debug Code Detected');
      expect(debugInsight?.confidence).toBe(0.9);
    });

    it('should generate large file insights', () => {
      mockCommit.files = [
        {
          path: 'src/large-file.js',
          status: 'added',
          additions: 1500,
          deletions: 0,
          diff: '// Large file content...',
        },
      ];

      const result = generator.generateInsights(mockCommit);

      const largeFileInsight = result.insights.find(insight => insight.id === 'large-file-addition');
      expect(largeFileInsight).toBeDefined();
      expect(largeFileInsight?.type).toBe('warning');
      expect(largeFileInsight?.title).toBe('Large File Added');
    });

    it('should generate missing error handling insights', () => {
      mockCommit.diff = `
        async function riskyFunction() {
          const data = await fetch('/api/data');
          const result = data.json();
          return result;
        }
      `;

      const result = generator.generateInsights(mockCommit);

      const errorHandlingInsight = result.insights.find(insight => insight.id === 'missing-error-handling');
      expect(errorHandlingInsight).toBeDefined();
      expect(errorHandlingInsight?.type).toBe('warning');
      expect(errorHandlingInsight?.title).toBe('Missing Error Handling');
    });

    it('should generate TypeScript any type insights', () => {
      mockCommit.files = [
        {
          path: 'src/utils.ts',
          status: 'modified',
          additions: 5,
          deletions: 0,
          diff: 'function processData(data: any): any { return data.someProperty; }',
        },
      ];
      mockCommit.diff = `
        function processData(data: any): any {
          return data.someProperty;
        }
      `;

      const result = generator.generateInsights(mockCommit);

      const anyTypeInsight = result.insights.find(insight => insight.id === 'typescript-any-type');
      expect(anyTypeInsight).toBeDefined();
      expect(anyTypeInsight?.type).toBe('warning');
      expect(anyTypeInsight?.title).toBe('TypeScript Any Type Usage');
    });

    it('should generate hardcoded secrets insights', () => {
      mockCommit.diff = `
        const apiKey = 'sk-1234567890abcdef';
        const password = 'mypassword123';
      `;

      const result = generator.generateInsights(mockCommit);

      const secretsInsight = result.insights.find(insight => insight.id === 'hardcoded-secrets');
      expect(secretsInsight).toBeDefined();
      expect(secretsInsight?.type).toBe('error');
      expect(secretsInsight?.title).toBe('Potential Hardcoded Secret');
    });

    it('should generate merge conflict markers insights', () => {
      mockCommit.diff = `
        function example() {
          return 'hello';
        }
        <<<<<<< HEAD
        const newFeature = 'added';
        =======
        const oldFeature = 'removed';
        >>>>>>> branch
      `;

      const result = generator.generateInsights(mockCommit);

      const conflictInsight = result.insights.find(insight => insight.id === 'merge-conflict-markers');
      expect(conflictInsight).toBeDefined();
      expect(conflictInsight?.type).toBe('error');
      expect(conflictInsight?.title).toBe('Merge Conflict Markers');
    });
  });
});
