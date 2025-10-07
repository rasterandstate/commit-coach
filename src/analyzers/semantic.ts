import { CommitInfo, ChangedFile } from '../types/index.js';

export interface SemanticAnalysis {
  publicApiChanges: PublicApiChange[];
  testCoverage: TestCoverageInfo;
  documentationChanges: DocumentationChange[];
  featureFlags: FeatureFlag[];
  breakingChanges: BreakingChange[];
}

export interface PublicApiChange {
  type: 'function' | 'class' | 'interface' | 'type' | 'constant';
  name: string;
  file: string;
  action: 'added' | 'modified' | 'removed';
  signature?: string;
  isExported: boolean;
}

export interface TestCoverageInfo {
  testFilesAdded: string[];
  testFilesModified: string[];
  sourceFilesWithoutTests: string[];
  testCoverageRatio: number;
}

export interface DocumentationChange {
  type: 'readme' | 'api-docs' | 'comments' | 'changelog';
  file: string;
  action: 'added' | 'modified' | 'deleted' | 'renamed';
  hasNewFeatures: boolean;
}

export interface FeatureFlag {
  name: string;
  file: string;
  action: 'added' | 'modified' | 'removed';
  type: 'boolean' | 'string' | 'number' | 'object';
}

export interface BreakingChange {
  type: 'signature' | 'removal' | 'behavior';
  description: string;
  file: string;
  severity: 'major' | 'minor' | 'patch';
}

export class SemanticAnalyzer {
  private readonly testFilePatterns = [
    /\.test\.(js|ts|jsx|tsx)$/,
    /\.spec\.(js|ts|jsx|tsx)$/,
    /__tests__\//,
    /test\//,
    /tests\//,
  ];

  private readonly docFilePatterns = [
    /README/i,
    /CHANGELOG/i,
    /CONTRIBUTING/i,
    /docs?\//,
    /documentation\//,
  ];

  analyze(commit: CommitInfo): SemanticAnalysis {
    return {
      publicApiChanges: this.analyzePublicApiChanges(commit),
      testCoverage: this.analyzeTestCoverage(commit),
      documentationChanges: this.analyzeDocumentationChanges(commit),
      featureFlags: this.analyzeFeatureFlags(commit),
      breakingChanges: this.analyzeBreakingChanges(commit),
    };
  }

  private analyzePublicApiChanges(commit: CommitInfo): PublicApiChange[] {
    const changes: PublicApiChange[] = [];

    for (const file of commit.files) {
      if (this.isSourceFile(file.path)) {
        const fileChanges = this.extractPublicApiChanges(file);
        changes.push(...fileChanges);
      }
    }

    return changes;
  }

  private analyzeTestCoverage(commit: CommitInfo): TestCoverageInfo {
    const testFilesAdded: string[] = [];
    const testFilesModified: string[] = [];
    const sourceFilesWithoutTests: string[] = [];

    for (const file of commit.files) {
      if (this.isTestFile(file.path)) {
        if (file.status === 'added') {
          testFilesAdded.push(file.path);
        } else if (file.status === 'modified') {
          testFilesModified.push(file.path);
        }
      } else if (this.isSourceFile(file.path) && file.status !== 'deleted') {
        // Check if there's a corresponding test file
        const hasTestFile = this.hasCorrespondingTestFile(
          file.path,
          commit.files
        );
        if (!hasTestFile) {
          sourceFilesWithoutTests.push(file.path);
        }
      }
    }

    const totalSourceFiles = commit.files.filter(
      f => this.isSourceFile(f.path) && f.status !== 'deleted'
    ).length;

    const testCoverageRatio =
      totalSourceFiles > 0
        ? (totalSourceFiles - sourceFilesWithoutTests.length) / totalSourceFiles
        : 1;

    return {
      testFilesAdded,
      testFilesModified,
      sourceFilesWithoutTests,
      testCoverageRatio,
    };
  }

  private analyzeDocumentationChanges(
    commit: CommitInfo
  ): DocumentationChange[] {
    const changes: DocumentationChange[] = [];

    for (const file of commit.files) {
      if (this.isDocumentationFile(file.path)) {
        const docType = this.getDocumentationType(file.path);
        const hasNewFeatures = this.hasNewFeaturesInFile(file);

        changes.push({
          type: docType,
          file: file.path,
          action:
            file.status === 'deleted'
              ? 'deleted'
              : file.status === 'renamed'
                ? 'renamed'
                : file.status,
          hasNewFeatures,
        });
      }
    }

    return changes;
  }

  private analyzeFeatureFlags(commit: CommitInfo): FeatureFlag[] {
    const flags: FeatureFlag[] = [];

    for (const file of commit.files) {
      if (this.isSourceFile(file.path)) {
        const fileFlags = this.extractFeatureFlags(file);
        flags.push(...fileFlags);
      }
    }

    return flags;
  }

  private analyzeBreakingChanges(commit: CommitInfo): BreakingChange[] {
    const changes: BreakingChange[] = [];

    for (const file of commit.files) {
      if (this.isSourceFile(file.path)) {
        const fileChanges = this.extractBreakingChanges(file);
        changes.push(...fileChanges);
      }
    }

    return changes;
  }

  private isSourceFile(path: string): boolean {
    return /\.(js|ts|jsx|tsx|py|java|cpp|c|go|rs|php|rb)$/.test(path);
  }

  private isTestFile(path: string): boolean {
    return this.testFilePatterns.some(pattern => pattern.test(path));
  }

  private isDocumentationFile(path: string): boolean {
    return this.docFilePatterns.some(pattern => pattern.test(path));
  }

  private hasCorrespondingTestFile(
    sourcePath: string,
    allFiles: ChangedFile[]
  ): boolean {
    const baseName = sourcePath.replace(/\.(js|ts|jsx|tsx)$/, '');

    return allFiles.some(
      file => this.isTestFile(file.path) && file.path.includes(baseName)
    );
  }

  private getDocumentationType(
    path: string
  ): 'readme' | 'api-docs' | 'comments' | 'changelog' {
    if (/README/i.test(path)) return 'readme';
    if (/CHANGELOG/i.test(path)) return 'changelog';
    if (/docs?\//.test(path)) return 'api-docs';
    return 'comments';
  }

  private hasNewFeaturesInFile(file: ChangedFile): boolean {
    // Simple heuristic: look for common feature-related keywords
    const featureKeywords = ['feature', 'new', 'add', 'implement', 'support'];
    return featureKeywords.some(keyword =>
      file.diff.toLowerCase().includes(keyword)
    );
  }

  private extractPublicApiChanges(file: ChangedFile): PublicApiChange[] {
    const changes: PublicApiChange[] = [];
    const lines = file.diff.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for exported functions, classes, interfaces
      if (line.startsWith('+') || line.startsWith('-')) {
        const content = line.substring(1);

        // Function exports
        const funcMatch = content.match(
          /export\s+(?:async\s+)?function\s+(\w+)/
        );
        if (funcMatch) {
          changes.push({
            type: 'function',
            name: funcMatch[1],
            file: file.path,
            action: line.startsWith('+') ? 'added' : 'removed',
            isExported: true,
          });
        }

        // Class exports
        const classMatch = content.match(/export\s+class\s+(\w+)/);
        if (classMatch) {
          changes.push({
            type: 'class',
            name: classMatch[1],
            file: file.path,
            action: line.startsWith('+') ? 'added' : 'removed',
            isExported: true,
          });
        }

        // Interface exports
        const interfaceMatch = content.match(/export\s+interface\s+(\w+)/);
        if (interfaceMatch) {
          changes.push({
            type: 'interface',
            name: interfaceMatch[1],
            file: file.path,
            action: line.startsWith('+') ? 'added' : 'removed',
            isExported: true,
          });
        }
      }
    }

    return changes;
  }

  private extractFeatureFlags(file: ChangedFile): FeatureFlag[] {
    const flags: FeatureFlag[] = [];
    const lines = file.diff.split('\n');

    for (const line of lines) {
      if (line.startsWith('+') || line.startsWith('-')) {
        const content = line.substring(1);

        // Look for common feature flag patterns
        const flagPatterns = [
          /FEATURE_(\w+)/,
          /ENABLE_(\w+)/,
          /USE_(\w+)/,
          /featureFlags\.(\w+)/,
          /flags\.(\w+)/,
        ];

        for (const pattern of flagPatterns) {
          const match = content.match(pattern);
          if (match) {
            flags.push({
              name: match[1],
              file: file.path,
              action: line.startsWith('+') ? 'added' : 'removed',
              type: 'boolean', // Default assumption
            });
          }
        }
      }
    }

    return flags;
  }

  private extractBreakingChanges(file: ChangedFile): BreakingChange[] {
    const changes: BreakingChange[] = [];
    const lines = file.diff.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('-')) {
        const content = line.substring(1);

        // Look for removed public APIs
        if (content.includes('export') && content.includes('function')) {
          changes.push({
            type: 'removal',
            description: `Removed exported function: ${content.trim()}`,
            file: file.path,
            severity: 'major',
          });
        }
      }
    }

    return changes;
  }
}
