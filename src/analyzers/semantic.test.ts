import { describe, it, expect, beforeEach } from 'vitest';
import { SemanticAnalyzer } from './semantic.js';
import { CommitInfo } from '../types/index.js';

describe('SemanticAnalyzer', () => {
  let analyzer: SemanticAnalyzer;
  let mockCommit: CommitInfo;

  beforeEach(() => {
    analyzer = new SemanticAnalyzer();
    mockCommit = {
      hash: 'abc123',
      message: 'Add new feature',
      author: 'Test Author',
      date: new Date(),
      diff: '',
      files: [],
    };
  });

  describe('analyzeTestCoverage', () => {
    it('should detect missing test files', () => {
      mockCommit.files = [
        {
          path: 'src/utils/helper.js',
          status: 'added',
          additions: 50,
          deletions: 0,
          diff: 'export function helper() {}',
        },
      ];

      const analysis = analyzer.analyze(mockCommit);

      expect(analysis.testCoverage.sourceFilesWithoutTests).toContain(
        'src/utils/helper.js'
      );
      expect(analysis.testCoverage.testCoverageRatio).toBe(0);
    });

    it('should detect corresponding test files', () => {
      mockCommit.files = [
        {
          path: 'src/utils/helper.js',
          status: 'added',
          additions: 50,
          deletions: 0,
          diff: 'export function helper() {}',
        },
        {
          path: 'src/utils/helper.test.js',
          status: 'added',
          additions: 30,
          deletions: 0,
          diff: 'describe("helper", () => {})',
        },
      ];

      const analysis = analyzer.analyze(mockCommit);

      expect(analysis.testCoverage.sourceFilesWithoutTests).toHaveLength(0);
      expect(analysis.testCoverage.testCoverageRatio).toBe(1);
    });

    it('should detect modified test files', () => {
      mockCommit.files = [
        {
          path: 'src/utils/helper.test.js',
          status: 'modified',
          additions: 10,
          deletions: 5,
          diff: 'describe("helper", () => {})',
        },
      ];

      const analysis = analyzer.analyze(mockCommit);

      expect(analysis.testCoverage.testFilesModified).toContain(
        'src/utils/helper.test.js'
      );
      expect(analysis.testCoverage.testFilesAdded).toHaveLength(0);
    });
  });

  describe('analyzePublicApiChanges', () => {
    it('should detect exported function additions', () => {
      mockCommit.files = [
        {
          path: 'src/api.js',
          status: 'modified',
          additions: 10,
          deletions: 0,
          diff: '+export function newFunction() {}\n-export function oldFunction() {}',
        },
      ];

      const analysis = analyzer.analyze(mockCommit);

      expect(analysis.publicApiChanges).toHaveLength(2);
      expect(analysis.publicApiChanges[0]).toMatchObject({
        type: 'function',
        name: 'newFunction',
        action: 'added',
        isExported: true,
      });
      expect(analysis.publicApiChanges[1]).toMatchObject({
        type: 'function',
        name: 'oldFunction',
        action: 'removed',
        isExported: true,
      });
    });

    it('should detect exported class changes', () => {
      mockCommit.files = [
        {
          path: 'src/class.js',
          status: 'modified',
          additions: 5,
          deletions: 0,
          diff: '+export class NewClass {}',
        },
      ];

      const analysis = analyzer.analyze(mockCommit);

      expect(analysis.publicApiChanges).toHaveLength(1);
      expect(analysis.publicApiChanges[0]).toMatchObject({
        type: 'class',
        name: 'NewClass',
        action: 'added',
        isExported: true,
      });
    });

    it('should detect exported interface changes', () => {
      mockCommit.files = [
        {
          path: 'src/types.ts',
          status: 'modified',
          additions: 5,
          deletions: 0,
          diff: '+export interface NewInterface {}',
        },
      ];

      const analysis = analyzer.analyze(mockCommit);

      expect(analysis.publicApiChanges).toHaveLength(1);
      expect(analysis.publicApiChanges[0]).toMatchObject({
        type: 'interface',
        name: 'NewInterface',
        action: 'added',
        isExported: true,
      });
    });
  });

  describe('analyzeFeatureFlags', () => {
    it('should detect feature flag additions', () => {
      mockCommit.files = [
        {
          path: 'src/config.js',
          status: 'modified',
          additions: 5,
          deletions: 0,
          diff: '+const FEATURE_NEW_UI = true;\n+const ENABLE_ANALYTICS = false;',
        },
      ];

      const analysis = analyzer.analyze(mockCommit);

      expect(analysis.featureFlags).toHaveLength(2);
      expect(analysis.featureFlags[0]).toMatchObject({
        name: 'NEW_UI',
        action: 'added',
        type: 'boolean',
      });
      expect(analysis.featureFlags[1]).toMatchObject({
        name: 'ANALYTICS',
        action: 'added',
        type: 'boolean',
      });
    });
  });

  describe('analyzeDocumentationChanges', () => {
    it('should detect README changes', () => {
      mockCommit.files = [
        {
          path: 'README.md',
          status: 'modified',
          additions: 10,
          deletions: 2,
          diff: '+## New Feature\n+This is a new feature.',
        },
      ];

      const analysis = analyzer.analyze(mockCommit);

      expect(analysis.documentationChanges).toHaveLength(1);
      expect(analysis.documentationChanges[0]).toMatchObject({
        type: 'readme',
        file: 'README.md',
        action: 'modified',
      });
    });

    it('should detect different documentation types', () => {
      mockCommit.files = [
        {
          path: 'CHANGELOG.md',
          status: 'modified',
          additions: 5,
          deletions: 0,
          diff: '+## New version',
        },
        {
          path: 'docs/api.md',
          status: 'added',
          additions: 20,
          deletions: 0,
          diff: '# API Documentation',
        },
        {
          path: 'CONTRIBUTING.md',
          status: 'modified',
          additions: 3,
          deletions: 0,
          diff: '+## Contributing guidelines',
        },
      ];

      const analysis = analyzer.analyze(mockCommit);

      expect(analysis.documentationChanges).toHaveLength(3);
      expect(analysis.documentationChanges[0].type).toBe('changelog');
      expect(analysis.documentationChanges[1].type).toBe('api-docs');
      expect(analysis.documentationChanges[2].type).toBe('comments'); // CONTRIBUTING.md falls back to 'comments'
    });
  });

  describe('analyzeBreakingChanges', () => {
    it('should detect removed public APIs', () => {
      mockCommit.files = [
        {
          path: 'src/api.js',
          status: 'modified',
          additions: 0,
          deletions: 5,
          diff: '-export function removedFunction() {}',
        },
      ];

      const analysis = analyzer.analyze(mockCommit);

      expect(analysis.breakingChanges).toHaveLength(1);
      expect(analysis.breakingChanges[0]).toMatchObject({
        type: 'removal',
        severity: 'major',
      });
    });
  });
});
