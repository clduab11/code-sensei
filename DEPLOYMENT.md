# Deployment Guide

This guide covers deploying Code Sensei to production environments.

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Domain name with SSL certificate
- GitHub App configured
- Anthropic API key

## Deployment Options

### Option 1: Docker (Recommended)

#### 1. Build the Docker image

```bash
docker build -t code-sensei:latest .
```

#### 2. Run with Docker Compose

```bash
# Create .env file with production values
cp .env.example .env
# Edit .env

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f app

# Scale app instances
docker-compose up -d --scale app=3
```

### Option 2: Kubernetes

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: code-sensei
spec:
  replicas: 3
  selector:
    matchLabels:
      app: code-sensei
  template:
    metadata:
      labels:
        app: code-sensei
    spec:
      containers:
      - name: code-sensei
        image: code-sensei:latest
        ports:
        - containerPort: 3000
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: production
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: code-sensei-secrets
              key: database-url
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: code-sensei-secrets
              key: anthropic-api-key
```

Deploy:
```bash
kubectl apply -f k8s/
```

### Option 3: Cloud Platforms

#### Heroku

```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create code-sensei-prod

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Add Redis
heroku addons:create heroku-redis:premium-0

# Set environment variables
heroku config:set GITHUB_APP_ID=your_id
heroku config:set ANTHROPIC_API_KEY=your_key

# Deploy
git push heroku main

# Scale
heroku ps:scale web=3
```

#### AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p docker code-sensei

# Create environment
eb create code-sensei-prod

# Deploy
eb deploy

# Configure environment variables
eb setenv GITHUB_APP_ID=your_id ANTHROPIC_API_KEY=your_key
```

#### Google Cloud Run

```bash
# Build container
gcloud builds submit --tag gcr.io/PROJECT_ID/code-sensei

# Deploy
gcloud run deploy code-sensei \
  --image gcr.io/PROJECT_ID/code-sensei \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GITHUB_APP_ID=your_id
```

## Environment Configuration

### Production Environment Variables

```env
NODE_ENV=production
PORT=3000
APP_URL=https://code-sensei.yourdomain.com

# GitHub App
GITHUB_APP_ID=your_app_id
GITHUB_PRIVATE_KEY_PATH=/app/secrets/private-key.pem
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# Database
DATABASE_URL=postgresql://user:pass@host:5432/code_sensei
REDIS_URL=redis://host:6379

# AI
ANTHROPIC_API_KEY=your_api_key

# Security
JWT_SECRET=long_random_string
SESSION_SECRET=another_long_random_string

# Monitoring
SENTRY_DSN=your_sentry_dsn
```

## SSL/TLS Configuration

### Using nginx as reverse proxy

```nginx
server {
    listen 443 ssl http2;
    server_name code-sensei.yourdomain.com;

    ssl_certificate /etc/ssl/certs/code-sensei.crt;
    ssl_certificate_key /etc/ssl/private/code-sensei.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Database Setup

### Migrations

The database schema is automatically created when the application starts. For manual migrations:

```bash
# Run migrations (initializes database tables)
npm run db:migrate

# Rollback (placeholder - manual intervention required)
npm run db:rollback
```

Note: The current implementation automatically creates/verifies all required tables on startup. Migration scripts are provided for manual control if needed.

### Backup

```bash
# Automated backups
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup.sql
```

## Monitoring

### Health Checks

Configure health check endpoints:
- App: `GET /health`
- Database: Checked in health endpoint
- Redis: Checked in health endpoint

### Logging

Logs are written to:
- `logs/error.log` - Error level
- `logs/all.log` - All levels
- Console output (captured by Docker/K8s)

### Metrics

Prometheus metrics available at `/metrics`

Key metrics:
- `code_sensei_reviews_total`
- `code_sensei_review_duration_seconds`
- `code_sensei_issues_found_total`
- `code_sensei_quality_score`

## Scaling

### Horizontal Scaling

Code Sensei is stateless and can be scaled horizontally:

```bash
# Docker Compose
docker-compose up -d --scale app=5

# Kubernetes
kubectl scale deployment code-sensei --replicas=5
```

### Database Connection Pooling

Configure in `DATABASE_URL`:
```
postgresql://user:pass@host:5432/db?pool_size=20&max_overflow=10
```

### Redis Clustering

For high availability, use Redis Cluster or Sentinel.

## Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Set secure environment variables
- [ ] Rotate secrets regularly
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Use helmet.js middleware
- [ ] Keep dependencies updated
- [ ] Enable audit logging
- [ ] Set up firewall rules
- [ ] Use least privilege access

## Troubleshooting

### Common Issues

**App won't start**
- Check environment variables
- Verify database connection
- Check private key path

**Webhooks not working**
- Verify webhook URL is accessible
- Check webhook secret
- Review GitHub App permissions

**High memory usage**
- Adjust Node.js heap size: `--max-old-space-size=4096`
- Scale horizontally instead of vertically
- Review code for memory leaks

## Support

For deployment help:
- Email: devops@code-sensei.dev
- Discord: #deployment channel
- Enterprise: Dedicated support available
