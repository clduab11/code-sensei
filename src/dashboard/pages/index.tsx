import React, { useEffect, useState } from 'react';
import { DashboardMetrics } from '../../types';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Failed to load metrics</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">
          🎓 Code Sensei Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Reviews"
            value={metrics.totalReviews}
            icon="📊"
          />
          <MetricCard
            title="Average Score"
            value={`${metrics.averageScore.toFixed(1)}/100`}
            icon="⭐"
          />
          <MetricCard
            title="Issues Fixed"
            value={metrics.issuesFixed}
            icon="✅"
          />
          <MetricCard
            title="Security Vulnerabilities"
            value={metrics.securityVulnerabilitiesFound}
            icon="🔒"
          />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Recent Reviews</h2>
          <div className="space-y-4">
            {metrics.recentReviews.map((review) => (
              <ReviewCard key={`${review.repository}-${review.prNumber}`} review={review} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
}

function MetricCard({ title, value, icon }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

interface ReviewCardProps {
  review: {
    prNumber: number;
    repository: string;
    timestamp: string;
    score: number;
    issuesFound: number;
    autoFixed: boolean;
  };
}

function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">
            {review.repository} #{review.prNumber}
          </h3>
          <p className="text-gray-600 text-sm">
            {new Date(review.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Score</p>
            <p className={`text-2xl font-bold ${getScoreColor(review.score)}`}>
              {review.score}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Issues</p>
            <p className="text-2xl font-bold">{review.issuesFound}</p>
          </div>
          {review.autoFixed && (
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              Auto-fixed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}
