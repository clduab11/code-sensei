# 🎓 Code Sensei

Ohayo, sensei-sama! Your AI-powered GitHub bot for automated code review & auto-fix commits.

Code Sensei is a comprehensive GitHub App that leverages Claude Opus AI to provide intelligent code reviews, automated fixes, security scanning, and actionable insights for your pull requests.

## ✨ Features

### 1. GitHub App Integration
- **Webhook Handlers**: Automatic PR event processing (opened, synchronize, reopened)
- **OAuth Authentication**: Secure GitHub App authentication
- **Status Checks**: Real-time code review status in PRs
- **Auto-Merge**: Intelligent auto-merge based on review scores and checks

### 2. Code Analysis
- **AST Parsing**: Deep code analysis for Python, TypeScript, JavaScript, Go, and Rust
- **Linter Integration**: 
  - ESLint for TypeScript/JavaScript
  - Pylint for Python
  - Language-specific best practices
- **Security Scanning**: 
  - SQL injection detection
  - XSS vulnerability detection
  - Hardcoded secrets scanning
  - Weak cryptography detection
  - Command injection prevention
  - Path traversal detection
- **Complexity Metrics**:
  - Cyclomatic complexity
  - Cognitive complexity
  - Lines of code analysis
  - Maintainability index

### 3. AI Review (Claude Opus)
- **Architecture Analysis**: Pattern recognition and design evaluation
- **Best Practices**: Industry-standard recommendations
- **Code Smell Detection**: Identification of problematic patterns
- **Refactoring Suggestions**: Prioritized improvement recommendations
- **Overall Scoring**: 0-100 code quality score

### 4. Auto-Fix Engine
- **Automated Fix Commits**: Apply high-priority fixes automatically
- **Test Generation**: Suggest and add tests for new code
- **Code Formatting**: Language-specific formatting
- **Type Annotations**: Add missing type hints

### 5. Web Dashboard
- **Metrics Visualization**: Track review statistics
- **Recent Reviews**: View PR review history
- **Security Analytics**: Monitor vulnerability trends
- **Score Tracking**: Average code quality over time

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- GitHub App credentials
- Anthropic (Claude) API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/clduab11/code-sensei.git
cd code-sensei
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. Build the project:
```bash
npm run build
```

5. Start the development server:
```bash
npm run dev
```

### Configuration

Create a `.env` file with the following variables:

```env
# GitHub App Configuration
GITHUB_APP_ID=your-app-id
GITHUB_PRIVATE_KEY=your-private-key
GITHUB_WEBHOOK_SECRET=your-webhook-secret
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret

# Claude API Configuration
ANTHROPIC_API_KEY=your-anthropic-api-key

# Feature Flags
AUTO_FIX_ENABLED=true
AUTO_MERGE_ENABLED=false
AUTO_MERGE_MIN_SCORE=80

# Application Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
```

## 📖 Usage

### As a GitHub App

1. Install Code Sensei on your repository
2. Open a pull request
3. Code Sensei will automatically:
   - Analyze code changes
   - Run security scans
   - Provide AI-powered review
   - Post comments on issues
   - Update check status
   - (Optional) Apply auto-fixes

### Manual Review

Trigger a review by:
- Opening a new PR
- Pushing new commits to an existing PR
- Re-running failed checks

### Auto-Merge

Enable auto-merge by:
1. Set `AUTO_MERGE_ENABLED=true` in `.env`
2. Add the `auto-merge` label to your PR
3. Ensure PR has approvals and passes all checks
4. Code Sensei score meets minimum threshold

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## 🛠️ Development

### Project Structure

```
code-sensei/
├── src/
│   ├── index.ts                 # Main Probot app entry
│   ├── types/                   # TypeScript type definitions
│   ├── handlers/                # GitHub event handlers
│   │   ├── pullRequestHandler.ts
│   │   ├── statusCheckHandler.ts
│   │   └── autoMergeHandler.ts
│   ├── services/
│   │   ├── analysis/            # Code analysis services
│   │   │   ├── codeAnalysisService.ts
│   │   │   ├── analyzers/       # Language-specific analyzers
│   │   │   └── scanners/        # Security scanners
│   │   ├── ai/                  # AI review service
│   │   │   └── aiReviewService.ts
│   │   └── autofix/             # Auto-fix engine
│   │       └── autoFixService.ts
│   ├── utils/                   # Utility functions
│   ├── app/                     # Express API server
│   └── dashboard/               # React dashboard
│       ├── pages/
│       └── components/
├── app.yml                      # GitHub App manifest
├── package.json
├── tsconfig.json
└── jest.config.js
```

### Adding New Analyzers

To add support for a new language:

1. Create analyzer in `src/services/analysis/analyzers/`
2. Implement the `analyze()` method
3. Add language detection in `codeAnalysisService.ts`
4. Add tests

### Linting

Run ESLint:
```bash
npm run lint
```

Format code:
```bash
npm run format
```

## 🔒 Security

Code Sensei includes comprehensive security scanning for:
- SQL Injection (CWE-89)
- Cross-Site Scripting (CWE-79)
- Hardcoded Secrets (CWE-798)
- Weak Cryptography (CWE-327)
- Command Injection (CWE-78)
- Path Traversal (CWE-22)

All security issues are reported with:
- Severity level
- CWE classification
- Detailed recommendations

## 📊 API Endpoints

### Health Check
```
GET /api/health
```

### Metrics
```
GET /api/metrics
```

### Record Review
```
POST /api/metrics/review
Body: {
  prNumber: number,
  repository: string,
  score: number,
  issuesFound: number,
  autoFixed: boolean
}
```

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Probot](https://probot.github.io/)
- Powered by [Claude (Anthropic)](https://www.anthropic.com/)
- Code analysis tools: ESLint, Pylint, tree-sitter
- Security scanning: Pattern-based detection

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review example configurations

---

Made with ❤️ by the Code Sensei team
