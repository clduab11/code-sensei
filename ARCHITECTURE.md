# Code Sensei Architecture

## Overview

Code Sensei is built as a GitHub App using Probot framework, with AI-powered code review capabilities via Claude Opus API.

## System Architecture

```
┌─────────────────┐
│   GitHub API    │
└────────┬────────┘
         │ Webhooks
         ▼
┌─────────────────────────────────────────┐
│         Probot Application              │
│  ┌───────────────────────────────────┐  │
│  │      Event Handlers               │  │
│  │  - PR Handler                     │  │
│  │  - Status Check Handler           │  │
│  │  - Auto-Merge Handler             │  │
│  └───────────┬───────────────────────┘  │
│              │                           │
│              ▼                           │
│  ┌───────────────────────────────────┐  │
│  │      Service Layer                │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  Code Analysis Service      │  │  │
│  │  │  - Python Analyzer          │  │  │
│  │  │  - TypeScript Analyzer      │  │  │
│  │  │  - Go Analyzer              │  │  │
│  │  │  - Rust Analyzer            │  │  │
│  │  │  - Complexity Analyzer      │  │  │
│  │  │  - Security Scanner         │  │  │
│  │  └─────────────────────────────┘  │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  AI Review Service          │  │  │
│  │  │  - Claude API Integration   │  │  │
│  │  │  - Response Parser          │  │  │
│  │  └─────────────────────────────┘  │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  Auto-Fix Service           │  │  │
│  │  │  - Fix Application          │  │  │
│  │  │  - Commit Creation          │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         Express API Server              │
│  - Metrics Endpoints                    │
│  - Dashboard API                        │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│       React Dashboard (Next.js)         │
│  - Metrics Visualization                │
│  - Review History                       │
└─────────────────────────────────────────┘
```

## Component Details

### 1. Event Handlers

**Pull Request Handler** (`pullRequestHandler.ts`)
- Listens to PR events: opened, synchronize, reopened
- Orchestrates the review process
- Creates check runs
- Posts review comments
- Triggers auto-fix if enabled

**Status Check Handler** (`statusCheckHandler.ts`)
- Manages GitHub check runs and check suites
- Handles re-run requests
- Updates check status

**Auto-Merge Handler** (`autoMergeHandler.ts`)
- Monitors check suite completion
- Validates merge criteria
- Executes merge when conditions are met

### 2. Analysis Services

**Code Analysis Service** (`codeAnalysisService.ts`)
- Coordinates language-specific analyzers
- Aggregates analysis results
- Manages complexity metrics

**Language Analyzers**
- Pattern-based static analysis
- Language-specific issue detection
- Best practice validation

**Security Scanner** (`securityScanner.ts`)
- SQL injection detection
- XSS vulnerability scanning
- Secret detection
- Cryptography validation
- Command injection prevention
- Path traversal detection

**Complexity Analyzer** (`complexityAnalyzer.ts`)
- Cyclomatic complexity calculation
- Cognitive complexity measurement
- Maintainability index computation

### 3. AI Services

**AI Review Service** (`aiReviewService.ts`)
- Claude Opus API integration
- Context preparation for AI
- Response parsing and structuring
- Fallback review generation

### 4. Auto-Fix Services

**Auto-Fix Service** (`autoFixService.ts`)
- Applies automated fixes
- Creates fix commits
- Manages file updates via GitHub API

### 5. API & Dashboard

**API Server** (`apiServer.ts`)
- Express-based REST API
- Metrics collection and storage
- Dashboard data endpoints

**Dashboard** (`dashboard/pages/index.tsx`)
- React-based UI
- Real-time metrics display
- Review history visualization

## Data Flow

### PR Review Flow

1. **Webhook Received**
   - GitHub sends PR webhook to Probot app
   - Event handler validates and routes the event

2. **Analysis Phase**
   - Fetch PR files from GitHub API
   - Run language-specific analyzers
   - Calculate complexity metrics
   - Perform security scanning

3. **AI Review Phase**
   - Prepare context from analysis results
   - Send to Claude Opus API
   - Parse and structure AI response

4. **Feedback Phase**
   - Post inline comments for issues
   - Create PR comment with AI review summary
   - Update check run status

5. **Auto-Fix Phase** (if enabled)
   - Filter auto-fixable suggestions
   - Apply fixes via GitHub API
   - Create commit with fixes
   - Post confirmation comment

6. **Metrics Phase**
   - Record review metrics
   - Update dashboard statistics

## Security Considerations

- GitHub App private key stored securely
- API keys in environment variables
- OAuth token rotation
- Webhook signature verification
- Input validation on all endpoints
- Rate limiting on API calls

## Scalability

- Stateless design for horizontal scaling
- Webhook queue for high-volume repos
- Caching of analysis results
- Background job processing for auto-fixes
- Database for metrics persistence (future)

## Error Handling

- Try-catch blocks around all async operations
- Graceful degradation when AI API fails
- Fallback reviews when parsing fails
- Error logging and monitoring
- User-friendly error messages in PR comments

## Future Enhancements

- Database integration (PostgreSQL)
- Advanced caching layer (Redis)
- Machine learning for custom rules
- Real-time dashboard updates (WebSocket)
- Multi-language test generation
- Advanced refactoring engine
- Team analytics and insights
- Custom rule configuration per repo
