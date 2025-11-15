import React, { useRef, useEffect } from 'react';
import { useAudit } from '../../context/AuditContext';
import Chart from 'chart.js/auto';
import { TrendingUp, Target, CheckCircle, Lightbulb } from 'lucide-react';

const DashboardCharts: React.FC = () => {
  const { currentMonthAudit, auditHistory, isLoading, locations, pillars, locationGroups } = useAudit();
  const trendChartRef = useRef<HTMLCanvasElement>(null);
  const pillarChartRef = useRef<HTMLCanvasElement>(null);
  const actionsChartRef = useRef<HTMLCanvasElement>(null);
  const locationsChartRef = useRef<HTMLCanvasElement>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const allAudits = [...auditHistory.audits, currentMonthAudit];
  const recentAudits = allAudits
    .filter(audit => audit.completed || audit.locationAudits.some(la => la.completed))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);

  // Calculate total actions and suggestions
  const totalActions = currentMonthAudit.locationAudits.reduce((total, audit) => {
    return total + audit.evaluations.reduce((evalTotal, evaluation) => {
      return evalTotal + (evaluation.correctiveActions?.length || 0);
    }, 0);
  }, 0);

  const completedActions = currentMonthAudit.locationAudits.reduce((total, audit) => {
    return total + audit.evaluations.reduce((evalTotal, evaluation) => {
      return evalTotal + (evaluation.correctiveActions?.filter(action => action.status === 'completed').length || 0);
    }, 0);
  }, 0);

  const totalSuggestions = currentMonthAudit.locationAudits.reduce((total, audit) => {
    return total + audit.evaluations.reduce((evalTotal, evaluation) => {
      return evalTotal + (evaluation.improvementSuggestions?.length || 0);
    }, 0);
  }, 0);

  const implementedSuggestions = currentMonthAudit.locationAudits.reduce((total, audit) => {
    return total + audit.evaluations.reduce((evalTotal, evaluation) => {
      return evalTotal + (evaluation.improvementSuggestions?.filter(suggestion => suggestion.status === 'implemented').length || 0);
    }, 0);
  }, 0);

  const actionCompletionRate = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;
  const suggestionImplementationRate = totalSuggestions > 0 ? (implementedSuggestions / totalSuggestions) * 100 : 0;

  // Create trend chart data
  const createTrendData = () => {
    return {
      labels: recentAudits.map(audit => {
        const [year, month] = audit.month.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      }),
      datasets: [{
        label: 'Score Global',
        data: recentAudits.map(audit => audit.overallScore || 0),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true
      }]
    };
  };

  // Create pillar performance data
  const createPillarData = () => {
    const pillarAverages = pillars.map(pillar => {
      const scores = currentMonthAudit.locationAudits
        .filter(audit => audit.completed)
        .map(audit => {
          const evaluation = audit.evaluations.find(e => e.pillarId === pillar.id);
          return evaluation ? evaluation.score : 0;
        });
      
      return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    });

    return {
      labels: pillars.map(pillar => pillar.name.split(' ')[0]),
      datasets: [{
        label: 'Score Moyen',
        data: pillarAverages,
        backgroundColor: [
          'rgba(239, 68, 68, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(147, 51, 234, 0.7)',
          'rgba(236, 72, 153, 0.7)',
          'rgba(14, 165, 233, 0.7)'
        ],
        borderWidth: 1
      }]
    };
  };

  // Create actions/suggestions data
  const createActionsData = () => {
    return {
      labels: ['Actions Correctives', 'Suggestions d\'Amélioration'],
      datasets: [{
        label: 'En cours',
        data: [totalActions - completedActions, totalSuggestions - implementedSuggestions],
        backgroundColor: 'rgba(245, 158, 11, 0.7)'
      }, {
        label: 'Terminées',
        data: [completedActions, implementedSuggestions],
        backgroundColor: 'rgba(34, 197, 94, 0.7)'
      }]
    };
  };

  // Create locations performance data
  const createLocationsData = () => {
    const locationScores = locations.map(location => {
      const audit = currentMonthAudit.locationAudits.find(
        audit => audit.locationId === location.id && audit.completed
      );
      return audit?.overallScore || 0;
    });

    return {
      labels: locations.map(loc => loc.name),
      datasets: [{
        label: 'Score',
        data: locationScores,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }]
    };
  };

  useEffect(() => {
    let trendChart: Chart | null = null;
    let pillarChart: Chart | null = null;
    let actionsChart: Chart | null = null;
    let locationsChart: Chart | null = null;

    // Trend Chart
    if (trendChartRef.current && recentAudits.length > 0) {
      const ctx = trendChartRef.current.getContext('2d');
      if (ctx) {
        trendChart = new Chart(ctx, {
          type: 'line',
          data: createTrendData(),
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, max: 10 }
            },
            plugins: {
              title: { display: true, text: 'Évolution des Scores' }
            }
          }
        });
      }
    }

    // Pillar Chart
    if (pillarChartRef.current) {
      const ctx = pillarChartRef.current.getContext('2d');
      if (ctx) {
        pillarChart = new Chart(ctx, {
          type: 'radar',
          data: createPillarData(),
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              r: { beginAtZero: true, max: 10 }
            },
            plugins: {
              title: { display: true, text: 'Performance par Pilier' }
            }
          }
        });
      }
    }

    // Actions Chart
    if (actionsChartRef.current) {
      const ctx = actionsChartRef.current.getContext('2d');
      if (ctx) {
        actionsChart = new Chart(ctx, {
          type: 'bar',
          data: createActionsData(),
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { stacked: true },
              y: { stacked: true, beginAtZero: true }
            },
            plugins: {
              title: { display: true, text: 'Actions et Suggestions' }
            }
          }
        });
      }
    }

    // Locations Chart
    if (locationsChartRef.current) {
      const ctx = locationsChartRef.current.getContext('2d');
      if (ctx) {
        locationsChart = new Chart(ctx, {
          type: 'bar',
          data: createLocationsData(),
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, max: 10 }
            },
            plugins: {
              title: { display: true, text: 'Performance par Local' }
            }
          }
        });
      }
    }

    return () => {
      if (trendChart) trendChart.destroy();
      if (pillarChart) pillarChart.destroy();
      if (actionsChart) actionsChart.destroy();
      if (locationsChart) locationsChart.destroy();
    };
  }, [currentMonthAudit, auditHistory]);

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-6">Dashboard 6S - {formatMonth(currentMonthAudit.month)}</h2>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Score Global</p>
              <p className="text-2xl font-bold text-blue-900">
                {currentMonthAudit.overallScore?.toFixed(1) || '-'}/10
              </p>
            </div>
            <TrendingUp className="text-blue-500" size={24} />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Taux Actions</p>
              <p className="text-2xl font-bold text-green-900">
                {actionCompletionRate.toFixed(0)}%
              </p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Taux Suggestions</p>
              <p className="text-2xl font-bold text-purple-900">
                {suggestionImplementationRate.toFixed(0)}%
              </p>
            </div>
            <Lightbulb className="text-purple-500" size={24} />
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Locaux Audités</p>
              <p className="text-2xl font-bold text-orange-900">
                {currentMonthAudit.locationAudits.filter(audit => audit.completed).length}/{locations.length}
              </p>
            </div>
            <Target className="text-orange-500" size={24} />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="h-64">
            <canvas ref={trendChartRef}></canvas>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="h-64">
            <canvas ref={pillarChartRef}></canvas>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="h-64">
            <canvas ref={actionsChartRef}></canvas>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="h-64">
            <canvas ref={locationsChartRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;