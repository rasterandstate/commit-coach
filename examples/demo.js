#!/usr/bin/env node

/**
 * Demo script showing how to use Commit Coach programmatically
 */

import { GitAnalyzer } from '../src/core/git.js';
import { InsightGenerator } from '../src/insights/generator.js';
import { ConfigLoader } from '../src/config/loader.js';
import { ConsoleFormatter } from '../src/output/formatters.js';

async function runDemo() {
  console.log('🚀 Commit Coach Demo\n');

  try {
    // Load configuration
    const config = ConfigLoader.getDefaultConfig();
    console.log('✅ Loaded default configuration');

    // Initialize components
    const gitAnalyzer = new GitAnalyzer('.');
    const insightGenerator = new InsightGenerator(config);
    const formatter = new ConsoleFormatter(config.output, true);

    // Check if we're in a git repository
    if (!(await gitAnalyzer.isRepository())) {
      console.log(
        '❌ Not a git repository. Please run from a git repository root.'
      );
      return;
    }

    // Get the latest commit
    console.log('📊 Analyzing latest commit...');
    const commitInfo = await gitAnalyzer.getCurrentCommit();

    console.log(`   Commit: ${commitInfo.hash.substring(0, 8)}`);
    console.log(`   Author: ${commitInfo.author}`);
    console.log(`   Message: ${commitInfo.message}`);
    console.log(`   Files: ${commitInfo.files.length}`);

    // Generate insights
    console.log('\n🔍 Generating insights...');
    const result = insightGenerator.generateInsights(commitInfo);

    // Display results
    console.log('\n' + formatter.format(result));

    // Show some statistics
    console.log('\n📈 Analysis Statistics:');
    console.log(`   Total insights generated: ${result.insights.length}`);
    console.log(
      `   Error insights: ${result.insights.filter(i => i.type === 'error').length}`
    );
    console.log(
      `   Warning insights: ${result.insights.filter(i => i.type === 'warning').length}`
    );
    console.log(
      `   Suggestion insights: ${result.insights.filter(i => i.type === 'suggestion').length}`
    );
    console.log(
      `   Info insights: ${result.insights.filter(i => i.type === 'info').length}`
    );
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo
runDemo();
