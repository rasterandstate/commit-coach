import { CommitInfo, Insight, AnalysisResult } from '../types/index.js';
import { SemanticAnalysis, SemanticAnalyzer } from '../analyzers/semantic.js';
import { CoachConfig } from '../types/index.js';

export class InsightGenerator {
  private semanticAnalyzer: SemanticAnalyzer;
  private config: CoachConfig;

  constructor(config: CoachConfig) {
    this.semanticAnalyzer = new SemanticAnalyzer();
    this.config = config;
  }

  generateInsights(commit: CommitInfo): AnalysisResult {
    const semanticAnalysis = this.semanticAnalyzer.analyze(commit);
    const insights = this.generateInsightsFromAnalysis(
      commit,
      semanticAnalysis
    );

    return {
      commit,
      insights: this.filterAndRankInsights(insights),
      summary: this.generateSummary(commit, semanticAnalysis),
    };
  }

  private generateInsightsFromAnalysis(
    commit: CommitInfo,
    analysis: SemanticAnalysis
  ): Insight[] {
    const insights: Insight[] = [];

    // Test coverage insights
    insights.push(
      ...this.generateTestCoverageInsights(commit, analysis.testCoverage)
    );

    // Public API insights
    insights.push(
      ...this.generatePublicApiInsights(commit, analysis.publicApiChanges)
    );

    // Documentation insights
    insights.push(
      ...this.generateDocumentationInsights(
        commit,
        analysis.documentationChanges
      )
    );

    // Feature flag insights
    insights.push(
      ...this.generateFeatureFlagInsights(commit, analysis.featureFlags)
    );

    // Breaking change insights
    insights.push(
      ...this.generateBreakingChangeInsights(commit, analysis.breakingChanges)
    );

    // General commit insights
    insights.push(...this.generateGeneralInsights(commit));

    return insights;
  }

  private generateTestCoverageInsights(
    commit: CommitInfo,
    testCoverage: SemanticAnalysis['testCoverage']
  ): Insight[] {
    const insights: Insight[] = [];

    if (testCoverage.sourceFilesWithoutTests.length > 0) {
      const files = testCoverage.sourceFilesWithoutTests.slice(0, 3);
      const moreFiles = testCoverage.sourceFilesWithoutTests.length - 3;

      insights.push({
        id: 'missing-tests',
        type: 'warning',
        title: 'Missing Test Coverage',
        message: `You added/modified ${files.join(', ')}${moreFiles > 0 ? ` and ${moreFiles} more files` : ''} but didn't add corresponding tests. Consider adding tests to maintain code quality.`,
        confidence: 0.8,
        metadata: {
          filesWithoutTests: testCoverage.sourceFilesWithoutTests,
          testCoverageRatio: testCoverage.testCoverageRatio,
        },
      });
    }

    if (testCoverage.testFilesAdded.length > 0) {
      insights.push({
        id: 'tests-added',
        type: 'info',
        title: 'Tests Added',
        message: `Great! You added tests for ${testCoverage.testFilesAdded.length} file(s). This helps maintain code quality.`,
        confidence: 1.0,
        metadata: {
          testFilesAdded: testCoverage.testFilesAdded,
        },
      });
    }

    return insights;
  }

  private generatePublicApiInsights(
    commit: CommitInfo,
    apiChanges: SemanticAnalysis['publicApiChanges']
  ): Insight[] {
    const insights: Insight[] = [];

    const removedApis = apiChanges.filter(
      change => change.action === 'removed' && change.isExported
    );
    if (removedApis.length > 0) {
      insights.push({
        id: 'public-api-removed',
        type: 'warning',
        title: 'Public API Removed',
        message: `You removed ${removedApis.length} public API(s): ${removedApis.map(api => api.name).join(', ')}. Make sure no downstream consumers depend on these APIs.`,
        confidence: 0.9,
        metadata: {
          removedApis: removedApis,
        },
      });
    }

    const addedApis = apiChanges.filter(
      change => change.action === 'added' && change.isExported
    );
    if (addedApis.length > 0) {
      insights.push({
        id: 'public-api-added',
        type: 'info',
        title: 'New Public APIs',
        message: `You added ${addedApis.length} new public API(s): ${addedApis.map(api => api.name).join(', ')}. Consider documenting these in your API documentation.`,
        confidence: 0.8,
        metadata: {
          addedApis: addedApis,
        },
      });
    }

    return insights;
  }

  private generateDocumentationInsights(
    commit: CommitInfo,
    docChanges: SemanticAnalysis['documentationChanges']
  ): Insight[] {
    const insights: Insight[] = [];

    const newFeatures = docChanges.filter(change => change.hasNewFeatures);
    if (newFeatures.length > 0) {
      insights.push({
        id: 'documentation-updated',
        type: 'info',
        title: 'Documentation Updated',
        message: `You updated documentation for new features. This is great for maintainability!`,
        confidence: 0.9,
        metadata: {
          documentationChanges: newFeatures,
        },
      });
    }

    // Check if new features were added but no documentation was updated
    const hasNewFeatures = commit.files.some(
      file => file.additions > 50 && this.isSourceFile(file.path)
    );

    const hasDocUpdates = docChanges.length > 0;

    if (hasNewFeatures && !hasDocUpdates) {
      insights.push({
        id: 'missing-documentation',
        type: 'suggestion',
        title: 'Consider Updating Documentation',
        message: `You added significant new code (${commit.files.reduce((sum, f) => sum + f.additions, 0)} lines). Consider updating README or API documentation to reflect the changes.`,
        confidence: 0.6,
        metadata: {
          totalAdditions: commit.files.reduce((sum, f) => sum + f.additions, 0),
        },
      });
    }

    return insights;
  }

  private generateFeatureFlagInsights(
    commit: CommitInfo,
    featureFlags: SemanticAnalysis['featureFlags']
  ): Insight[] {
    const insights: Insight[] = [];

    if (featureFlags.length > 0) {
      const addedFlags = featureFlags.filter(flag => flag.action === 'added');
      if (addedFlags.length > 0) {
        insights.push({
          id: 'feature-flags-added',
          type: 'suggestion',
          title: 'New Feature Flags Added',
          message: `You added ${addedFlags.length} new feature flag(s): ${addedFlags.map(flag => flag.name).join(', ')}. Consider documenting these flags and their purpose in your configuration documentation.`,
          confidence: 0.7,
          metadata: {
            featureFlags: addedFlags,
          },
        });
      }
    }

    return insights;
  }

  private generateBreakingChangeInsights(
    commit: CommitInfo,
    breakingChanges: SemanticAnalysis['breakingChanges']
  ): Insight[] {
    const insights: Insight[] = [];

    if (breakingChanges.length > 0) {
      const majorChanges = breakingChanges.filter(
        change => change.severity === 'major'
      );
      if (majorChanges.length > 0) {
        insights.push({
          id: 'breaking-changes',
          type: 'error',
          title: 'Breaking Changes Detected',
          message: `This commit contains ${majorChanges.length} breaking change(s). Consider updating the version number and changelog accordingly.`,
          confidence: 0.9,
          metadata: {
            breakingChanges: majorChanges,
          },
        });
      }
    }

    return insights;
  }

  private generateGeneralInsights(commit: CommitInfo): Insight[] {
    const insights: Insight[] = [];

    const totalLines = commit.files.reduce(
      (sum, file) => sum + file.additions + file.deletions,
      0
    );
    const largeCommit = totalLines > 200;

    if (largeCommit) {
      insights.push({
        id: 'large-commit',
        type: 'info',
        title: 'Large Commit',
        message: `This is a large commit with ${totalLines} lines changed across ${commit.files.length} files. Consider breaking this into smaller, more focused commits for better code review.`,
        confidence: 0.7,
        metadata: {
          totalLines,
          fileCount: commit.files.length,
        },
      });
    }

    // Check for commit message quality
    const messageLength = commit.message.length;
    if (messageLength < 10) {
      insights.push({
        id: 'short-commit-message',
        type: 'suggestion',
        title: 'Short Commit Message',
        message: `Your commit message is quite short (${messageLength} characters). Consider adding more context about what changed and why.`,
        confidence: 0.6,
        metadata: {
          messageLength,
        },
      });
    }

    // Check for TODO/FIXME comments
    const hasTodos =
      commit.diff.includes('TODO') || commit.diff.includes('FIXME');
    if (hasTodos) {
      insights.push({
        id: 'todo-comments',
        type: 'info',
        title: 'TODO/FIXME Comments',
        message: `This commit contains TODO or FIXME comments. Make sure to track these items and address them in future commits.`,
        confidence: 0.8,
        metadata: {
          hasTodos: true,
        },
      });
    }

    return insights;
  }

  private filterAndRankInsights(insights: Insight[]): Insight[] {
    // Filter by confidence threshold
    const filteredInsights = insights.filter(
      insight => insight.confidence >= this.config.thresholds.minConfidence
    );

    // Sort by confidence and type priority
    const typePriority = { error: 4, warning: 3, suggestion: 2, info: 1 };

    return filteredInsights
      .sort((a, b) => {
        const priorityDiff = typePriority[b.type] - typePriority[a.type];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      })
      .slice(0, this.config.output.maxInsights);
  }

  private generateSummary(commit: CommitInfo, _analysis: SemanticAnalysis) {
    const totalLines = commit.files.reduce(
      (sum, file) => sum + file.additions + file.deletions,
      0
    );
    const testFilesChanged = commit.files.filter(file =>
      this.isTestFile(file.path)
    ).length;
    const documentationFilesChanged = commit.files.filter(file =>
      this.isDocumentationFile(file.path)
    ).length;

    return {
      totalLines,
      filesChanged: commit.files.length,
      testFilesChanged,
      documentationFilesChanged,
    };
  }

  private isSourceFile(path: string): boolean {
    return /\.(js|ts|jsx|tsx|py|java|cpp|c|go|rs|php|rb)$/.test(path);
  }

  private isTestFile(path: string): boolean {
    return (
      /\.(test|spec)\.(js|ts|jsx|tsx)$/.test(path) ||
      /__(tests|test)__/.test(path) ||
      /(test|tests)\//.test(path)
    );
  }

  private isDocumentationFile(path: string): boolean {
    return (
      /README/i.test(path) ||
      /CHANGELOG/i.test(path) ||
      /docs?\//.test(path) ||
      /documentation\//.test(path)
    );
  }
}
