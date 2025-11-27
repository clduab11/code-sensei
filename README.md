# 🥋 Code Sensei

> Intelligent GitHub bot for automated code review with AI-powered analysis and auto-fixes

Code Sensei is a comprehensive code review automation platform that combines static analysis, security scanning, and AI-powered insights using Claude Opus to provide thorough, actionable code reviews.

## 🌟 Features

### 🤖 AI-Powered Reviews
- **Claude Opus Integration**: Deep code understanding and contextual analysis
- **Architecture Pattern Recognition**: Identifies and validates design patterns
- **Best Practices Enforcement**: Ensures adherence to industry standards
- **Code Smell Detection**: Catches anti-patterns early
- **Naming Convention Analysis**: Maintains consistent code style

### 🔍 Code Analysis Engine
- **Multi-Language AST Parsing**: Supports Python, TypeScript, Go, Rust, Java
- **Cyclomatic Complexity**: Measures code complexity
- **Maintainability Index**: Tracks code maintainability
- **Performance Profiling**: Suggests optimization opportunities
- **Test Coverage Analysis**: Identifies untested code paths

### 🔒 Security Scanning
- **Vulnerability Detection**: OWASP Top 10 coverage
- **Secret Detection**: Prevents hardcoded credentials
- **SQL Injection**: Identifies unsafe database queries
- **XSS Prevention**: Catches cross-site scripting vulnerabilities
- **Dependency Scanning**: Checks for known vulnerabilities

### 🛠️ Auto-Fix System
- **Automated Corrections**: Fixes common issues automatically
- **Smart Refactoring**: Suggests code improvements with diffs
- **Format Enforcement**: Maintains consistent code style
- **Type Annotations**: Adds missing type hints
- **Documentation Updates**: Keeps docs in sync with code

### 📊 Dashboard & Analytics
- **Real-time Metrics**: Track code quality trends
- **Team Performance**: Monitor review statistics
- **Issue Tracking**: Identify recurring problems
- **Quality Trends**: Visualize improvements over time
- **Technical Debt**: Measure and track debt

### 🔌 Integrations
- **Slack**: Real-time review notifications
- **Jira**: Automatic issue creation
- **Linear**: Seamless task management
- **CI/CD**: Pipeline integration support

### 🎯 Learning & Customization
- **Team-Specific Rules**: Custom style guides
- **False Positive Learning**: Adapts to feedback
- **Developer Preferences**: Personalized settings
- **Severity Customization**: Adjustable thresholds
- **Historical Pattern Analysis**: Learns from past reviews

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- GitHub App credentials
- Anthropic API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/code-sensei.git
cd code-sensei
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. **Start development server**
```bash
npm run dev
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app
```

## 💬 Bot Commands

Comment on any pull request with these commands:

- `@code-sensei review` - Trigger a fresh review
- `@code-sensei fix` - Apply auto-fixes
- `@code-sensei explain <file:line>` - Explain specific code
- `@code-sensei ignore <issue-id>` - Ignore an issue
- `@code-sensei help` - Show help message

## 🏗️ Architecture

```
code-sensei/
├── src/
│   ├── index.ts              # Main entry point
│   ├── config/               # Configuration
│   ├── github/               # Webhook handlers
│   ├── analysis/             # Code analysis
│   ├── ai/                   # Claude integration
│   ├── services/             # Business logic
│   ├── dashboard/            # Web dashboard
│   ├── integrations/         # External integrations
│   ├── database/             # Database layer
│   └── monitoring/           # Metrics
├── Dockerfile
└── docker-compose.yml
```

## 🧪 Testing

```bash
npm test                  # Run tests
npm run test:coverage     # With coverage
npm run lint              # Lint code
```

## 💰 Pricing Tiers

### Free
- Public repositories
- Basic code review
- Up to 3 repositories

### Pro - $19/month per user
- Private repositories
- Advanced AI review
- Unlimited repositories
- Auto-fix capabilities
- Custom rules
- Analytics dashboard
- Integrations

### Enterprise - Custom Pricing
- Self-hosted option
- SSO/SAML
- Dedicated support
- SLA guarantees
- Custom integrations

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 📞 Support

- Documentation: [DEPLOYMENT.md](DEPLOYMENT.md)
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)
- Issues: [GitHub Issues](https://github.com/your-org/code-sensei/issues)

---

Made with ❤️ by the Code Sensei team
