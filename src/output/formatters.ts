import chalk from 'chalk';
import { AnalysisResult, Insight, OutputConfig } from '../types/index.js';

export abstract class OutputFormatter {
  protected config: OutputConfig;

  constructor(config: OutputConfig) {
    this.config = config;
  }

  abstract format(result: AnalysisResult): string;
}

export class ConsoleFormatter extends OutputFormatter {
  private colorize: boolean;

  constructor(config: OutputConfig, colorize: boolean = true) {
    super(config);
    this.colorize = colorize;
  }

  format(result: AnalysisResult): string {
    const lines: string[] = [];

    // Header
    lines.push(this.formatHeader(result));

    // Summary
    if (this.config.includeSummary) {
      lines.push(this.formatSummary(result));
    }

    // Insights
    if (result.insights.length > 0) {
      lines.push(this.formatInsights(result.insights));
    } else {
      lines.push(this.formatNoInsights());
    }

    return lines.join('\n');
  }

  private formatHeader(result: AnalysisResult): string {
    const commit = result.commit;
    const header = `🔍 Commit Coach Analysis for ${commit.hash.substring(0, 8)}`;

    if (this.colorize) {
      return chalk.bold.blue(header);
    }
    return header;
  }

  private formatSummary(result: AnalysisResult): string {
    const { summary } = result;
    const lines: string[] = [];

    lines.push('\n📊 Summary:');
    lines.push(`  • ${summary.totalLines} lines changed`);
    lines.push(`  • ${summary.filesChanged} files modified`);
    lines.push(`  • ${summary.testFilesChanged} test files changed`);
    lines.push(
      `  • ${summary.documentationFilesChanged} documentation files changed`
    );

    if (this.colorize) {
      return chalk.gray(lines.join('\n'));
    }
    return lines.join('\n');
  }

  private formatInsights(insights: Insight[]): string {
    const lines: string[] = [];

    lines.push('\n💡 Insights:');

    for (const insight of insights) {
      lines.push(this.formatInsight(insight));
    }

    return lines.join('\n');
  }

  private formatInsight(insight: Insight): string {
    const icon = this.getInsightIcon(insight.type);
    const confidence = `(${Math.round(insight.confidence * 100)}%)`;

    let formatted = `\n${icon} ${insight.title} ${confidence}`;
    formatted += `\n   ${insight.message}`;

    if (this.colorize) {
      const color = this.getInsightColor(insight.type);
      return color(formatted);
    }

    return formatted;
  }

  private formatNoInsights(): string {
    const message = '\n✅ No insights to report - great commit!';

    if (this.colorize) {
      return chalk.green(message);
    }
    return message;
  }

  private getInsightIcon(type: Insight['type']): string {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'suggestion':
        return '💡';
      case 'info':
        return 'ℹ️';
      default:
        return '📝';
    }
  }

  private getInsightColor(type: Insight['type']) {
    switch (type) {
      case 'error':
        return chalk.red;
      case 'warning':
        return chalk.yellow;
      case 'suggestion':
        return chalk.blue;
      case 'info':
        return chalk.cyan;
      default:
        return chalk.white;
    }
  }
}

export class CommentFormatter extends OutputFormatter {
  format(result: AnalysisResult): string {
    const lines: string[] = [];

    // Header
    lines.push('## 🔍 Commit Coach Analysis');
    lines.push('');

    // Summary
    if (this.config.includeSummary) {
      lines.push('### 📊 Summary');
      lines.push('');
      lines.push(`- **${result.summary.totalLines}** lines changed`);
      lines.push(`- **${result.summary.filesChanged}** files modified`);
      lines.push(`- **${result.summary.testFilesChanged}** test files changed`);
      lines.push(
        `- **${result.summary.documentationFilesChanged}** documentation files changed`
      );
      lines.push('');
    }

    // Insights
    if (result.insights.length > 0) {
      lines.push('### 💡 Insights');
      lines.push('');

      for (const insight of result.insights) {
        lines.push(this.formatInsight(insight));
      }
    } else {
      lines.push('### ✅ No Issues Found');
      lines.push('');
      lines.push('Great commit! No insights to report.');
    }

    return lines.join('\n');
  }

  private formatInsight(insight: Insight): string {
    const icon = this.getInsightIcon(insight.type);
    const confidence = `(${Math.round(insight.confidence * 100)}%)`;

    return `**${icon} ${insight.title}** ${confidence}\n\n${insight.message}\n\n`;
  }

  private getInsightIcon(type: Insight['type']): string {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'suggestion':
        return '💡';
      case 'info':
        return 'ℹ️';
      default:
        return '📝';
    }
  }
}

export class StatusCheckFormatter extends OutputFormatter {
  format(result: AnalysisResult): string {
    const errorCount = result.insights.filter(i => i.type === 'error').length;
    const warningCount = result.insights.filter(
      i => i.type === 'warning'
    ).length;

    let status: 'success' | 'failure' | 'neutral';
    let title: string;
    let summary: string;

    if (errorCount > 0) {
      status = 'failure';
      title = `Commit Coach: ${errorCount} error(s) found`;
      summary = `Found ${errorCount} error(s) and ${warningCount} warning(s) in this commit.`;
    } else if (warningCount > 0) {
      status = 'neutral';
      title = `Commit Coach: ${warningCount} warning(s) found`;
      summary = `Found ${warningCount} warning(s) in this commit.`;
    } else {
      status = 'success';
      title = 'Commit Coach: No issues found';
      summary = 'Great commit! No issues detected.';
    }

    return JSON.stringify({
      state: status,
      title,
      summary,
      details: this.formatDetails(result),
    });
  }

  private formatDetails(result: AnalysisResult): string {
    const lines: string[] = [];

    lines.push(`Commit: ${result.commit.hash.substring(0, 8)}`);
    lines.push(`Author: ${result.commit.author}`);
    lines.push(`Message: ${result.commit.message}`);
    lines.push('');
    lines.push(`Files changed: ${result.summary.filesChanged}`);
    lines.push(`Lines changed: ${result.summary.totalLines}`);
    lines.push('');

    if (result.insights.length > 0) {
      lines.push('Insights:');
      for (const insight of result.insights) {
        lines.push(`- ${insight.type.toUpperCase()}: ${insight.title}`);
      }
    }

    return lines.join('\n');
  }
}

export class ReportFormatter extends OutputFormatter {
  format(result: AnalysisResult): string {
    const report = {
      commit: {
        hash: result.commit.hash,
        message: result.commit.message,
        author: result.commit.author,
        date: result.commit.date.toISOString(),
      },
      summary: result.summary,
      insights: result.insights.map(insight => ({
        id: insight.id,
        type: insight.type,
        title: insight.title,
        message: insight.message,
        confidence: insight.confidence,
        metadata: insight.metadata,
      })),
      generatedAt: new Date().toISOString(),
    };

    return JSON.stringify(report, null, 2);
  }
}
