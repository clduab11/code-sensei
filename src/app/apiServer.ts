import express, { Request, Response } from 'express';
import { DashboardMetrics } from '../types';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory storage for demo purposes
// In production, use a proper database
const metricsStore: DashboardMetrics = {
  totalReviews: 0,
  averageScore: 0,
  issuesFixed: 0,
  securityVulnerabilitiesFound: 0,
  recentReviews: [],
};

// API Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'code-sensei' });
});

app.get('/api/metrics', (req: Request, res: Response) => {
  res.json(metricsStore);
});

app.post('/api/metrics/review', (req: Request, res: Response) => {
  const { prNumber, repository, score, issuesFound, autoFixed } = req.body;

  metricsStore.totalReviews += 1;
  metricsStore.averageScore = 
    (metricsStore.averageScore * (metricsStore.totalReviews - 1) + score) / 
    metricsStore.totalReviews;
  
  if (autoFixed) {
    metricsStore.issuesFixed += issuesFound;
  }

  metricsStore.recentReviews.unshift({
    prNumber,
    repository,
    timestamp: new Date().toISOString(),
    score,
    issuesFound,
    autoFixed,
  });

  // Keep only last 20 reviews
  metricsStore.recentReviews = metricsStore.recentReviews.slice(0, 20);

  res.json({ success: true });
});

app.post('/api/metrics/security', (req: Request, res: Response) => {
  const { count } = req.body;
  metricsStore.securityVulnerabilitiesFound += count;
  res.json({ success: true });
});

export function startAPIServer() {
  app.listen(PORT, () => {
    console.log(`API Server running on port ${PORT}`);
  });
}

export default app;
