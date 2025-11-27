# Deployment Guide

This guide walks you through deploying Code Sensei to production.

## Prerequisites

- Node.js 18 or higher
- GitHub App credentials
- Anthropic (Claude) API key
- A hosting platform (Heroku, AWS, GCP, Azure, or self-hosted)

## Step 1: Create a GitHub App

1. Go to GitHub Settings → Developer settings → GitHub Apps
2. Click "New GitHub App"
3. Fill in the details:
   - **Name**: Code Sensei (or your custom name)
   - **Homepage URL**: Your deployment URL
   - **Webhook URL**: `https://your-domain.com/api/github/webhooks`
   - **Webhook Secret**: Generate a secure random string

4. Set permissions:
   - **Repository permissions**:
     - Checks: Read & Write
     - Contents: Read & Write
     - Issues: Read & Write
     - Pull requests: Read & Write
     - Statuses: Read & Write
   
5. Subscribe to events:
   - Check run
   - Check suite
   - Pull request
   - Pull request review
   - Pull request review comment
   - Status

6. Save and generate a private key (download the .pem file)

## Step 2: Get Claude API Key

1. Sign up at https://console.anthropic.com/
2. Generate an API key
3. Save it securely

## Step 3: Environment Configuration

Create a `.env` file with your credentials:

```env
# GitHub App Configuration
GITHUB_APP_ID=your-app-id
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=your-webhook-secret
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret

# Claude API Configuration
ANTHROPIC_API_KEY=your-anthropic-api-key

# Feature Configuration
AUTO_FIX_ENABLED=true
AUTO_MERGE_ENABLED=false
AUTO_MERGE_MIN_SCORE=80

# Application Configuration
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

## Step 4: Deploy to Platform

### Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create code-sensei-your-name

# Set environment variables
heroku config:set GITHUB_APP_ID=your-app-id
heroku config:set GITHUB_PRIVATE_KEY="$(cat private-key.pem)"
heroku config:set GITHUB_WEBHOOK_SECRET=your-webhook-secret
heroku config:set ANTHROPIC_API_KEY=your-api-key
# ... set other variables

# Deploy
git push heroku main
```

### AWS (EC2 or Elastic Beanstalk)

1. **EC2**:
   ```bash
   # SSH into your EC2 instance
   ssh -i your-key.pem ec2-user@your-instance
   
   # Clone repository
   git clone https://github.com/clduab11/code-sensei.git
   cd code-sensei
   
   # Install dependencies
   npm install
   
   # Build
   npm run build
   
   # Set up environment variables
   nano .env
   # (paste your configuration)
   
   # Install PM2 for process management
   npm install -g pm2
   
   # Start application
   pm2 start dist/index.js --name code-sensei
   pm2 startup
   pm2 save
   ```

2. **Elastic Beanstalk**:
   ```bash
   # Install EB CLI
   pip install awsebcli
   
   # Initialize
   eb init -p node.js code-sensei
   
   # Create environment
   eb create code-sensei-prod
   
   # Set environment variables
   eb setenv GITHUB_APP_ID=your-app-id ANTHROPIC_API_KEY=your-api-key
   
   # Deploy
   eb deploy
   ```

### Docker

```dockerfile
# Create Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

```bash
# Build image
docker build -t code-sensei .

# Run container
docker run -d -p 3000:3000 \
  -e GITHUB_APP_ID=your-app-id \
  -e GITHUB_PRIVATE_KEY="$(cat private-key.pem)" \
  -e ANTHROPIC_API_KEY=your-api-key \
  --name code-sensei \
  code-sensei
```

### Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: code-sensei
spec:
  replicas: 2
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
        image: your-registry/code-sensei:latest
        ports:
        - containerPort: 3000
        env:
        - name: GITHUB_APP_ID
          valueFrom:
            secretKeyRef:
              name: code-sensei-secrets
              key: github-app-id
        # ... other environment variables
---
apiVersion: v1
kind: Service
metadata:
  name: code-sensei
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: code-sensei
```

## Step 5: Update GitHub App

1. Go back to your GitHub App settings
2. Update the Webhook URL to your deployment URL
3. Test the webhook delivery

## Step 6: Install on Repositories

1. Go to your GitHub App page
2. Click "Install App"
3. Select repositories where you want Code Sensei to work
4. Confirm installation

## Step 7: Verify Deployment

1. Create a test pull request in an installed repository
2. Check that Code Sensei posts a review
3. Monitor logs for any errors

```bash
# Heroku logs
heroku logs --tail

# PM2 logs
pm2 logs code-sensei

# Docker logs
docker logs -f code-sensei

# Kubernetes logs
kubectl logs -f deployment/code-sensei
```

## Monitoring and Scaling

### Health Check Endpoint

```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "code-sensei"
}
```

### Metrics

Access metrics dashboard at:
```
https://your-domain.com/dashboard
```

### Scaling

- **Heroku**: `heroku ps:scale web=2`
- **AWS**: Adjust Auto Scaling group
- **Kubernetes**: `kubectl scale deployment code-sensei --replicas=3`
- **Docker**: Use Docker Swarm or Compose for orchestration

## Troubleshooting

### Webhook not receiving events
- Check webhook URL is correct and accessible
- Verify webhook secret matches
- Check firewall/security group settings

### API Rate Limits
- Monitor GitHub API rate limits
- Implement request caching
- Use conditional requests when possible

### Claude API Errors
- Check API key is valid
- Monitor usage limits
- Implement fallback review mechanism

### High Memory Usage
- Monitor Node.js heap size
- Adjust instance size if needed
- Implement request queuing for high-volume repos

## Maintenance

### Updates

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Rebuild
npm run build

# Restart service
pm2 restart code-sensei  # or your deployment method
```

### Backup Configuration

Regularly backup:
- Environment variables
- GitHub App private key
- API keys
- Configuration files

### Security

- Rotate GitHub App private key periodically
- Rotate API keys regularly
- Keep dependencies updated: `npm audit fix`
- Monitor security advisories
- Use HTTPS only
- Implement rate limiting

## Support

For issues or questions:
- GitHub Issues: https://github.com/clduab11/code-sensei/issues
- Documentation: See README.md and ARCHITECTURE.md
