import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ConsoleFormatter,
  CommentFormatter,
  StatusCheckFormatter,
  ReportFormatter,
} from './formatters.js';
import { AnalysisResult, Insight, OutputConfig } from '../types/index.js';

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    bold: { blue: vi.fn((text: string) => text) },
    gray: vi.fn((text: string) => text),
    green: vi.fn((text: string) => text),
    red: vi.fn((text: string) => text),
    yellow: vi.fn((text: string) => text),
    blue: vi.fn((text: string) => text),
    cyan: vi.fn((text: string) => text),
    white: vi.fn((text: string) => text),
  },
}));

describe('OutputFormatters', () => {
  let mockResult: AnalysisResult;
  let mockConfig: OutputConfig;

  beforeEach(() => {
    mockConfig = {
      format: 'console',
      includeSummary: true,
      maxInsights: 10,
    };

    mockResult = {
      commit: {
        hash: 'abc12345',
        message: 'Test commit message',
        author: 'Test Author',
        date: new Date('2023-01-01T00:00:00Z'),
        diff: 'diff content',
        files: [
          {
            path: 'src/test.js',
            status: 'added',
            additions: 10,
            deletions: 2,
            diff: 'test diff',
          },
        ],
      },
      insights: [
        {
          id: 'test-insight',
          type: 'warning',
          title: 'Test Warning',
          message: 'This is a test warning message',
          confidence: 0.8,
          metadata: { test: true },
        },
      ],
      summary: {
        totalLines: 12,
        filesChanged: 1,
        testFilesChanged: 0,
        documentationFilesChanged: 0,
      },
    };
  });

  describe('ConsoleFormatter', () => {
    it('should format with colors enabled', () => {
      const formatter = new ConsoleFormatter(mockConfig, true);
      const result = formatter.format(mockResult);

      expect(result).toContain('🔍 Commit Coach Analysis for abc12345');
      expect(result).toContain('📊 Summary:');
      expect(result).toContain('💡 Insights:');
      expect(result).toContain('⚠️ Test Warning (80%)');
      expect(result).toContain('This is a test warning message');
    });

    it('should format without colors', () => {
      const formatter = new ConsoleFormatter(mockConfig, false);
      const result = formatter.format(mockResult);

      expect(result).toContain('🔍 Commit Coach Analysis for abc12345');
      expect(result).toContain('📊 Summary:');
      expect(result).toContain('💡 Insights:');
    });

    it('should handle no insights without colors', () => {
      const resultWithNoInsights = { ...mockResult, insights: [] };
      const formatter = new ConsoleFormatter(mockConfig, false);
      const result = formatter.format(resultWithNoInsights);

      expect(result).toContain('✅ No insights to report - great commit!');
    });

    it('should handle no insights', () => {
      const resultWithNoInsights = { ...mockResult, insights: [] };
      const formatter = new ConsoleFormatter(mockConfig, true);
      const result = formatter.format(resultWithNoInsights);

      expect(result).toContain('✅ No insights to report - great commit!');
    });

    it('should format different insight types', () => {
      const insights: Insight[] = [
        {
          id: 'error',
          type: 'error',
          title: 'Error',
          message: 'Error message',
          confidence: 0.9,
        },
        {
          id: 'warning',
          type: 'warning',
          title: 'Warning',
          message: 'Warning message',
          confidence: 0.8,
        },
        {
          id: 'suggestion',
          type: 'suggestion',
          title: 'Suggestion',
          message: 'Suggestion message',
          confidence: 0.7,
        },
        {
          id: 'info',
          type: 'info',
          title: 'Info',
          message: 'Info message',
          confidence: 0.6,
        },
      ];

      const resultWithMultipleInsights = { ...mockResult, insights };
      const formatter = new ConsoleFormatter(mockConfig, true);
      const result = formatter.format(resultWithMultipleInsights);

      expect(result).toContain('❌ Error (90%)');
      expect(result).toContain('⚠️ Warning (80%)');
      expect(result).toContain('💡 Suggestion (70%)');
      expect(result).toContain('ℹ️ Info (60%)');
    });

    it('should exclude summary when configured', () => {
      const configWithoutSummary = { ...mockConfig, includeSummary: false };
      const formatter = new ConsoleFormatter(configWithoutSummary, true);
      const result = formatter.format(mockResult);

      expect(result).not.toContain('📊 Summary:');
      expect(result).toContain('💡 Insights:');
    });
  });

  describe('CommentFormatter', () => {
    it('should format as markdown comment', () => {
      const formatter = new CommentFormatter(mockConfig);
      const result = formatter.format(mockResult);

      expect(result).toContain('## 🔍 Commit Coach Analysis');
      expect(result).toContain('### 📊 Summary');
      expect(result).toContain('### 💡 Insights');
      expect(result).toContain('**⚠️ Test Warning** (80%)');
      expect(result).toContain('This is a test warning message');
    });

    it('should handle no insights', () => {
      const resultWithNoInsights = { ...mockResult, insights: [] };
      const formatter = new CommentFormatter(mockConfig);
      const result = formatter.format(resultWithNoInsights);

      expect(result).toContain('### ✅ No Issues Found');
      expect(result).toContain('Great commit! No insights to report.');
    });

    it('should exclude summary when configured', () => {
      const configWithoutSummary = { ...mockConfig, includeSummary: false };
      const formatter = new CommentFormatter(configWithoutSummary);
      const result = formatter.format(mockResult);

      expect(result).not.toContain('### 📊 Summary');
      expect(result).toContain('### 💡 Insights');
    });

    it('should format different insight types', () => {
      const insights: Insight[] = [
        {
          id: 'error',
          type: 'error',
          title: 'Error',
          message: 'Error message',
          confidence: 0.9,
        },
        {
          id: 'warning',
          type: 'warning',
          title: 'Warning',
          message: 'Warning message',
          confidence: 0.8,
        },
      ];

      const resultWithMultipleInsights = { ...mockResult, insights };
      const formatter = new CommentFormatter(mockConfig);
      const result = formatter.format(resultWithMultipleInsights);

      expect(result).toContain('**❌ Error** (90%)');
      expect(result).toContain('**⚠️ Warning** (80%)');
    });
  });

  describe('StatusCheckFormatter', () => {
    it('should format success status for no errors', () => {
      const resultWithNoErrors = { ...mockResult, insights: [] };
      const formatter = new StatusCheckFormatter(mockConfig);
      const result = formatter.format(resultWithNoErrors);

      const parsed = JSON.parse(result);
      expect(parsed.state).toBe('success');
      expect(parsed.title).toBe('Commit Coach: No issues found');
      expect(parsed.summary).toBe('Great commit! No issues detected.');
    });

    it('should format failure status for errors', () => {
      const insights: Insight[] = [
        {
          id: 'error1',
          type: 'error',
          title: 'Error 1',
          message: 'Error message',
          confidence: 0.9,
        },
        {
          id: 'error2',
          type: 'error',
          title: 'Error 2',
          message: 'Error message',
          confidence: 0.8,
        },
        {
          id: 'warning',
          type: 'warning',
          title: 'Warning',
          message: 'Warning message',
          confidence: 0.7,
        },
      ];

      const resultWithErrors = { ...mockResult, insights };
      const formatter = new StatusCheckFormatter(mockConfig);
      const result = formatter.format(resultWithErrors);

      const parsed = JSON.parse(result);
      expect(parsed.state).toBe('failure');
      expect(parsed.title).toBe('Commit Coach: 2 error(s) found');
      expect(parsed.summary).toBe(
        'Found 2 error(s) and 1 warning(s) in this commit.'
      );
    });

    it('should format neutral status for warnings only', () => {
      const insights: Insight[] = [
        {
          id: 'warning1',
          type: 'warning',
          title: 'Warning 1',
          message: 'Warning message',
          confidence: 0.8,
        },
        {
          id: 'warning2',
          type: 'warning',
          title: 'Warning 2',
          message: 'Warning message',
          confidence: 0.7,
        },
      ];

      const resultWithWarnings = { ...mockResult, insights };
      const formatter = new StatusCheckFormatter(mockConfig);
      const result = formatter.format(resultWithWarnings);

      const parsed = JSON.parse(result);
      expect(parsed.state).toBe('neutral');
      expect(parsed.title).toBe('Commit Coach: 2 warning(s) found');
      expect(parsed.summary).toBe('Found 2 warning(s) in this commit.');
    });

    it('should include details in status check', () => {
      const formatter = new StatusCheckFormatter(mockConfig);
      const result = formatter.format(mockResult);

      const parsed = JSON.parse(result);
      expect(parsed.details).toContain('Commit: abc12345');
      expect(parsed.details).toContain('Author: Test Author');
      expect(parsed.details).toContain('Message: Test commit message');
      expect(parsed.details).toContain('Files changed: 1');
      expect(parsed.details).toContain('Lines changed: 12');
    });
  });

  describe('ReportFormatter', () => {
    it('should format as JSON report', () => {
      const formatter = new ReportFormatter(mockConfig);
      const result = formatter.format(mockResult);

      const parsed = JSON.parse(result);
      expect(parsed.commit).toMatchObject({
        hash: 'abc12345',
        message: 'Test commit message',
        author: 'Test Author',
        date: '2023-01-01T00:00:00.000Z',
      });
      expect(parsed.summary).toMatchObject({
        totalLines: 12,
        filesChanged: 1,
        testFilesChanged: 0,
        documentationFilesChanged: 0,
      });
      expect(parsed.insights).toHaveLength(1);
      expect(parsed.insights[0]).toMatchObject({
        id: 'test-insight',
        type: 'warning',
        title: 'Test Warning',
        message: 'This is a test warning message',
        confidence: 0.8,
        metadata: { test: true },
      });
      expect(parsed.generatedAt).toBeDefined();
    });

    it('should handle empty insights', () => {
      const resultWithNoInsights = { ...mockResult, insights: [] };
      const formatter = new ReportFormatter(mockConfig);
      const result = formatter.format(resultWithNoInsights);

      const parsed = JSON.parse(result);
      expect(parsed.insights).toHaveLength(0);
      expect(parsed.commit).toBeDefined();
      expect(parsed.summary).toBeDefined();
    });
  });
});
