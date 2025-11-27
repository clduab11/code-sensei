# Code Sensei Features

## Overview

Code Sensei is a comprehensive AI-powered GitHub bot that provides automated code review, security scanning, and auto-fix capabilities for modern software development teams.

## Core Features

### 1. GitHub App Integration

#### Webhook Handlers
- **Pull Request Events**: Automatically triggered on PR open, synchronize, and reopen
- **Status Checks**: Real-time updates on code quality and review status
- **Check Runs**: Integration with GitHub's checks API for native PR UI
- **OAuth Authentication**: Secure GitHub App authentication flow

#### Auto-Merge Functionality
- Label-based triggering (add `auto-merge` label to enable)
- Configurable minimum score threshold
- Requires PR approval before merging
- Automatic squash merge with descriptive commit message
- Safety checks for passing CI/CD status

### 2. Code Analysis Engine

#### Multi-Language Support
Code Sensei analyzes code in multiple languages with language-specific best practices:

**Python**
- Bare except clause detection
- eval()/exec() security warnings
- Wildcard import detection
- TODO/FIXME comment tracking
- print() vs logging recommendations

**TypeScript/JavaScript**
- console.log detection
- `any` type usage warnings
- == vs === enforcement
- var vs let/const recommendations
- Empty catch block detection
- TODO/FIXME tracking

**Go**
- Error handling verification
- Naked return warnings
- panic() usage detection
- Goroutine safety checks
- TODO/FIXME tracking

**Rust**
- unwrap() usage warnings
- expect() recommendations
- unsafe block detection
- Unnecessary clone() detection
- println! vs logging recommendations
- TODO/FIXME tracking

#### Code Complexity Metrics

**Cyclomatic Complexity**
- Measures number of linearly independent paths through code
- Counts decision points (if, while, for, case, etc.)
- Helps identify overly complex functions

**Cognitive Complexity**
- Measures how difficult code is to understand
- Considers nesting levels and control flow
- More human-centric than cyclomatic complexity

**Maintainability Index**
- Holistic score combining multiple metrics
- Based on Halstead volume, cyclomatic complexity, and LOC
- Scale of 0-100 (higher is better)

**Lines of Code (LOC)**
- Non-comment, non-blank lines
- Useful for estimating code size and complexity

### 3. Security Scanning

Code Sensei includes comprehensive security vulnerability detection:

#### SQL Injection (CWE-89)
- Detects string concatenation in SQL queries
- Flags dynamic query construction
- Recommends parameterized queries

#### Cross-Site Scripting - XSS (CWE-79)
- Detects innerHTML usage
- Flags dangerouslySetInnerHTML in React
- Recommends proper sanitization

#### Hardcoded Secrets (CWE-798)
- Detects hardcoded passwords
- Finds API keys in source code
- Identifies tokens and private keys
- Recommends environment variables

#### Weak Cryptography (CWE-327)
- Detects MD5/SHA1 usage
- Recommends stronger algorithms (SHA-256, SHA-3)

#### Command Injection (CWE-78)
- Detects unsafe command execution
- Flags exec/system/spawn with string concatenation
- Recommends parameterized APIs

#### Path Traversal (CWE-22)
- Detects file operations with user input
- Identifies ../ patterns
- Recommends path validation and sanitization

### 4. AI-Powered Review (Claude Opus)

#### Architecture Analysis
- Identifies design patterns
- Evaluates code structure
- Assesses modularity and separation of concerns
- Reviews API design decisions

#### Best Practices
- Language-specific idioms
- Framework conventions
- Industry standards
- Team coding guidelines

#### Code Smell Detection
- Long methods/functions
- Duplicated code
- Large classes/files
- Feature envy
- Data clumps
- Primitive obsession

#### Refactoring Suggestions
- **Priority Levels**: High, Medium, Low
- **Effort Estimation**: Small, Medium, Large
- **Before/After Code**: When available
- **Location**: File and line references
- **Description**: Clear explanation of benefits

#### Overall Scoring
- 0-100 quality score
- Based on multiple factors:
  - Issue count and severity
  - Security vulnerabilities
  - Code complexity
  - Best practice adherence
  - Architecture quality

### 5. Auto-Fix Engine

#### Automated Fixes
- Applies high-priority, low-effort fixes automatically
- Creates commits with descriptive messages
- Tracks modified files
- Posts confirmation comments on PR

#### Fix Types Supported
- Code formatting
- Simple refactorings
- Pattern replacements
- Import organization
- Type annotations (future)

#### Safety Features
- Only applies fixes with high confidence
- Creates separate commits for tracking
- Includes fix description in commit message
- User can review before merge

### 6. Web Dashboard

#### Metrics Visualization
- **Total Reviews**: Count of all PRs reviewed
- **Average Score**: Mean quality score across all reviews
- **Issues Fixed**: Total number of auto-fixed issues
- **Security Vulnerabilities**: Total security issues found

#### Recent Reviews Display
- PR number and repository
- Review timestamp
- Quality score with color coding
- Issues found count
- Auto-fix status indicator

#### Dashboard API
- RESTful API for metrics
- Health check endpoint
- Review submission endpoint
- Security metrics endpoint

## Configuration Options

### Environment Variables

```env
# Feature Toggles
AUTO_FIX_ENABLED=true|false
AUTO_MERGE_ENABLED=true|false
AUTO_MERGE_MIN_SCORE=0-100

# Application Settings
PORT=3000
NODE_ENV=development|production
LOG_LEVEL=debug|info|warn|error
```

### GitHub App Manifest (app.yml)

```yaml
permissions:
  checks: write
  contents: write
  issues: write
  pull_requests: write
  statuses: write

events:
  - check_run
  - check_suite
  - pull_request
  - pull_request_review
  - status
```

## Integration Capabilities

### GitHub Check Runs
- Native GitHub UI integration
- Status badges on PRs
- Detailed check run output
- Re-run capability

### PR Comments
- Inline code comments (when applicable)
- Summary comment with review details
- Formatted with markdown
- Includes emoji indicators

### Status Checks
- Required status check support
- Blocks merge on critical issues
- Provides quick status overview

## Performance

### Analysis Speed
- Typical PR review: 10-30 seconds
- Depends on file count and size
- Parallel analysis where possible

### API Limits
- GitHub API: Respects rate limits
- Claude API: Handles rate limiting gracefully
- Implements exponential backoff

### Resource Usage
- Memory: ~200-500MB typical
- CPU: Burst during analysis, idle otherwise
- Network: Dependent on PR size

## Extensibility

### Adding New Languages
1. Create analyzer in `src/services/analysis/analyzers/`
2. Implement `analyze()` method
3. Add language detection in `codeAnalysisService.ts`
4. Add tests

### Custom Rules
1. Add rule to appropriate analyzer
2. Define issue severity
3. Provide clear message
4. Add test cases

### Additional Security Checks
1. Add check method in `securityScanner.ts`
2. Define CWE classification
3. Provide remediation advice
4. Test with vulnerable code samples

## Roadmap

### Planned Features
- [ ] Database integration for persistent metrics
- [ ] Advanced caching layer
- [ ] Machine learning for custom rules
- [ ] Real-time dashboard updates (WebSocket)
- [ ] Multi-language test generation
- [ ] Advanced refactoring engine
- [ ] Team analytics and insights
- [ ] Custom rule configuration per repo
- [ ] GitLab and Bitbucket support
- [ ] Slack/Discord notifications
- [ ] Code coverage analysis
- [ ] Performance profiling suggestions

## Support

For feature requests or bug reports:
- Open an issue on GitHub
- Check existing documentation
- Review architecture guide
- Contact maintainers

## License

MIT License - see LICENSE file for details
