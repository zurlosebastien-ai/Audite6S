import React, { useRef, useEffect } from 'react';
import { useAudit } from '../../context/AuditContext';
import Chart from 'chart.js/auto';
import { TrendingUp, Target, CheckCircle, Lightbulb, Clock, AlertTriangle, Award } from 'lucide-react';

const DashboardCharts: React.FC = () => {
  const { currentMonthAudit, auditHistory, isLoading, locations, pillars, locationGroups } = useAudit();
  const trendChartRef = useRef<HTMLCanvasElement>(null);
  const pillarChartRef = useRef<HTMLCanvasElement>(null);
  const actionsChartRef = useRef<HTMLCanvasElement>(null);
  const locationsChartRef = useRef<HTMLCanvasElement>(null);
  const monthlyTrendRef = useRef<HTMLCanvasElement>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
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

  // Calculate average processing time for completed actions
  const completedActionsWithTime = currentMonthAudit.locationAudits.flatMap(audit =>
    audit.evaluations.flatMap(evaluation =>
      evaluation.correctiveActions?.filter(action => action.status === 'completed' && action.completedAt) || []
    )
  );

  const averageProcessingTime = completedActionsWithTime.length > 0
    ? completedActionsWithTime.reduce((sum, action) => {
        const created = new Date(action.createdAt);
        const completed = new Date(action.completedAt!);
        return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
      }, 0) / completedActionsWithTime.length
    : 0;

  // Calculate annual score
  const currentYear = new Date().getFullYear();
  const yearlyAudits = allAudits.filter(audit => audit.year === currentYear && audit.completed);
  const annualScore = yearlyAudits.length > 0
    ? yearlyAudits.reduce((sum, audit) => sum + (audit.overallScore || 0), 0) / yearlyAudits.length
    : 0;

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
        borderColor: 'rgba(99, 102, 241, 1)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
        fill: true,
        borderWidth: 3,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6
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
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgba(99, 102, 241, 1)',
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2
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
        backgroundColor: 'rgba(251, 191, 36, 0.8)',
        borderColor: 'rgba(251, 191, 36, 1)',
        borderWidth: 1
      }, {
        label: 'Terminées',
        data: [completedActions, implementedSuggestions],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1
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
        backgroundColor: locationScores.map(score => {
          if (score >= 8) return 'rgba(34, 197, 94, 0.8)';
          if (score >= 6) return 'rgba(251, 191, 36, 0.8)';
          return 'rgba(239, 68, 68, 0.8)';
        }),
        borderColor: locationScores.map(score => {
          if (score >= 8) return 'rgba(34, 197, 94, 1)';
          if (score >= 6) return 'rgba(251, 191, 36, 1)';
          return 'rgba(239, 68, 68, 1)';
        }),
        borderWidth: 2
      }]
    };
  };

  // Create monthly trend data for all locations
  const createMonthlyTrendData = () => {
    const datasets = locations.map((location, index) => {
      const colors = [
        'rgba(99, 102, 241, 1)',
        'rgba(34, 197, 94, 1)',
        'rgba(239, 68, 68, 1)',
        'rgba(251, 191, 36, 1)',
        'rgba(147, 51, 234, 1)',
        'rgba(236, 72, 153, 1)',
      ];
      
      const data = recentAudits.map(monthAudit => {
        const locationAudit = monthAudit.locationAudits.find(
          audit => audit.locationId === location.id && audit.completed
        );
        return locationAudit?.overallScore || null;
      });
      
      return {
        label: location.name,
        data,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length].replace('1)', '0.1)'),
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      };
    });
    
    return {
      labels: recentAudits.map(audit => {
        const [year, month] = audit.month.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      }),
      datasets
    };
  };

  useEffect(() => {
    let trendChart: Chart | null = null;
    let pillarChart: Chart | null = null;
    let actionsChart: Chart | null = null;
    let locationsChart: Chart | null = null;
    let monthlyTrendChart: Chart | null = null;

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
            plugins: {
              title: { 
                display: true, 
                text: 'Évolution du Score Global',
                font: { size: 16, weight: 'bold' }
              },
              legend: { display: false }
            },
            scales: {
              y: { 
                beginAtZero: true, 
                max: 10,
                grid: { color: 'rgba(0, 0, 0, 0.1)' },
                ticks: { font: { size: 12 } }
              },
              x: {
                grid: { color: 'rgba(0, 0, 0, 0.1)' },
                ticks: { font: { size: 12 } }
              }
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
            plugins: {
              title: { 
                display: true, 
                text: 'Performance par Pilier 6S',
                font: { size: 16, weight: 'bold' }
              },
              legend: { display: false }
            },
            scales: {
              r: { 
                beginAtZero: true, 
                max: 10,
                grid: { color: 'rgba(0, 0, 0, 0.1)' },
                pointLabels: { font: { size: 12 } },
                ticks: { font: { size: 10 } }
              }
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
            plugins: {
              title: { 
                display: true, 
                text: 'Suivi des Actions et Suggestions',
                font: { size: 16, weight: 'bold' }
              }
            },
            scales: {
              x: { stacked: true },
              y: { 
                stacked: true, 
                beginAtZero: true,
                grid: { color: 'rgba(0, 0, 0, 0.1)' }
              }
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
            plugins: {
              title: { 
                display: true, 
                text: 'Performance par Local',
                font: { size: 16, weight: 'bold' }
              },
              legend: { display: false }
            },
            scales: {
              y: { 
                beginAtZero: true, 
                max: 10,
                grid: { color: 'rgba(0, 0, 0, 0.1)' }
              },
              x: {
                grid: { display: false }
              }
            }
          }
        });
      }
    }

    // Monthly Trend Chart
    if (monthlyTrendRef.current && recentAudits.length > 0) {
      const ctx = monthlyTrendRef.current.getContext('2d');
      if (ctx) {
        monthlyTrendChart = new Chart(ctx, {
          type: 'line',
          data: createMonthlyTrendData(),
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: { 
                display: true, 
                text: 'Évolution par Local',
                font: { size: 16, weight: 'bold' }
              }
            },
            scales: {
              y: { 
                beginAtZero: true, 
                max: 10,
                grid: { color: 'rgba(0, 0, 0, 0.1)' }
              },
              x: {
                grid: { color: 'rgba(0, 0, 0, 0.1)' }
              }
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
      if (monthlyTrendChart) monthlyTrendChart.destroy();
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
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-3xl font-bold mb-8 text-gray-900">Dashboard 6S - {formatMonth(currentMonthAudit.month)}</h2>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Score Global</p>
              <p className="text-3xl font-bold">
                {currentMonthAudit.overallScore?.toFixed(1) || '-'}/10
              </p>
              <p className="text-blue-100 text-xs mt-1">Ce mois-ci</p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Taux Actions</p>
              <p className="text-3xl font-bold">
                {actionCompletionRate.toFixed(0)}%
              </p>
              <p className="text-green-100 text-xs mt-1">{completedActions}/{totalActions} actions</p>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Temps Moyen</p>
              <p className="text-3xl font-bold">
                {averageProcessingTime.toFixed(0)}j
              </p>
              <p className="text-purple-100 text-xs mt-1">Traitement actions</p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Score Annuel</p>
              <p className="text-3xl font-bold">
                {annualScore.toFixed(1)}/10
              </p>
              <p className="text-orange-100 text-xs mt-1">{currentYear}</p>
            </div>
            <div className="bg-orange-400 bg-opacity-30 rounded-full p-3">
              <Award size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Additional KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Taux Suggestions</p>
              <p className="text-3xl font-bold">
                {suggestionImplementationRate.toFixed(0)}%
              </p>
              <p className="text-indigo-100 text-xs mt-1">{implementedSuggestions}/{totalSuggestions} suggestions</p>
            </div>
            <div className="bg-indigo-400 bg-opacity-30 rounded-full p-3">
              <Lightbulb size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium">Locaux Audités</p>
              <p className="text-3xl font-bold">
                {currentMonthAudit.locationAudits.filter(audit => audit.completed).length}/{locations.length}
              </p>
              <p className="text-teal-100 text-xs mt-1">Ce mois-ci</p>
            </div>
            <div className="bg-teal-400 bg-opacity-30 rounded-full p-3">
              <Target size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm font-medium">Taux de Clôture</p>
              <p className="text-3xl font-bold">
                {totalActions > 0 ? ((completedActions / totalActions) * 100).toFixed(0) : 0}%
              </p>
              <p className="text-pink-100 text-xs mt-1">Actions fermées</p>
            </div>
            <div className="bg-pink-400 bg-opacity-30 rounded-full p-3">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl shadow-inner">
          <div className="h-64">
            <canvas ref={trendChartRef}></canvas>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl shadow-inner">
          <div className="h-64">
            <canvas ref={pillarChartRef}></canvas>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl shadow-inner">
          <div className="h-64">
            <canvas ref={actionsChartRef}></canvas>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl shadow-inner">
          <div className="h-64">
            <canvas ref={locationsChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* Full width chart for monthly trends */}
      {recentAudits.length > 1 && (
        <div className="mt-8">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl shadow-inner">
            <div className="h-80">
              <canvas ref={monthlyTrendRef}></canvas>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCharts;