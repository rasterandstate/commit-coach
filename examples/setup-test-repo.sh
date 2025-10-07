#!/bin/bash

# Setup a test repository to demonstrate Commit Coach

echo "🚀 Setting up test repository for Commit Coach demo..."

# Create a temporary directory
TEST_DIR="commit-coach-test-repo"
rm -rf "$TEST_DIR"
mkdir "$TEST_DIR"
cd "$TEST_DIR"

# Initialize git repository
git init
git config user.name "Commit Coach Demo"
git config user.email "demo@commit-coach.dev"

# Create initial files
echo "# Test Repository" > README.md
echo "console.log('Hello World');" > src/index.js
echo "module.exports = { helper: () => 'test' };" > src/utils.js

git add .
git commit -m "Initial commit with basic structure"

# Create a commit with missing tests (should trigger insight)
echo "export function newFeature() { return 'new feature'; }" >> src/index.js
echo "export class NewClass { constructor() { this.value = 'test'; } }" >> src/index.js

git add src/index.js
git commit -m "Add new feature without tests"

# Create a commit with feature flags (should trigger insight)
echo "const FEATURE_NEW_UI = true;" > src/config.js
echo "const ENABLE_ANALYTICS = false;" >> src/config.js

git add src/config.js
git commit -m "Add feature flags"

# Create a large commit (should trigger insight)
for i in {1..10}; do
  echo "function function$i() { return 'function $i'; }" >> src/large-file.js
done

git add src/large-file.js
git commit -m "Add large file"

# Create a commit with tests (should be positive)
echo "const { helper } = require('./utils');" > src/utils.test.js
echo "test('helper function', () => {" >> src/utils.test.js
echo "  expect(helper()).toBe('test');" >> src/utils.test.js
echo "});" >> src/utils.test.js

git add src/utils.test.js
git commit -m "Add tests for utils"

# Create a commit with short message (should trigger insight)
echo "// Small fix" >> src/index.js
git add src/index.js
git commit -m "fix"

echo "✅ Test repository created in $TEST_DIR"
echo "📁 Repository structure:"
echo "   - README.md"
echo "   - src/index.js (with new features, no tests)"
echo "   - src/utils.js"
echo "   - src/utils.test.js (with tests)"
echo "   - src/config.js (with feature flags)"
echo "   - src/large-file.js (large file)"
echo ""
echo "🔍 You can now run Commit Coach on this repository:"
echo "   cd $TEST_DIR"
echo "   pnpm dlx commit-coach analyze"
echo "   pnpm dlx commit-coach analyze --commit HEAD~1"
echo "   pnpm dlx commit-coach analyze --commit HEAD~2"
echo ""
echo "📊 Each commit should trigger different insights!"
