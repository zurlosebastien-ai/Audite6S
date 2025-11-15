import React, { useRef, useEffect } from 'react';
import { useAudit } from '../../context/AuditContext';
import Chart from 'chart.js/auto';
import { TrendingUp, Target, CheckCircle, Lightbulb, Clock, Award, BarChart3, Activity } from 'lucide-react';

const AnnualReport: React.FC = () => {
  const { currentMonthAudit, auditHistory, isLoading, locations, pillars, locationGroups } = useAudit();
  const monthlyTrendRef = useRef<HTMLCanvasElement>(null);
  const pillarRadarRef = useRef<HTMLCanvasElement>(null);
  const pillarBarsRef = useRef<HTMLCanvasElement>(null);
  const actionsDistributionRef = useRef<HTMLCanvasElement>(null);
  const locationsComparisonRef = useRef<HTMLCanvasElement>(null);
  const actionTimelineRef = useRef<HTMLCanvasElement>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const allAudits = [...auditHistory.audits, currentMonthAudit];
  const yearAudits = allAudits.filter(audit => audit.year === currentYear);
  const completedYearAudits = yearAudits.filter(audit => audit.completed || audit.locationAudits.some(la => la.completed));

  // Calculate annual KPIs
  const calculateAnnualKPIs = () => {
    let totalActions = 0;
    let completedActions = 0;
    let totalSuggestions = 0;
    let implementedSuggestions = 0;
    let totalActionDays = 0;
    let completedActionsWithTime = 0;
    let totalScore = 0;
    let scoreCount = 0;

    yearAudits.forEach(monthAudit => {
      monthAudit.locationAudits.forEach(locationAudit => {
        if (locationAudit.completed && locationAudit.overallScore) {
          totalScore += locationAudit.overallScore;
          scoreCount++;
        }

        locationAudit.evaluations.forEach(evaluation => {
          // Actions correctives
          evaluation.correctiveActions.forEach(action => {
            totalActions++;
            if (action.status === 'completed') {
              completedActions++;
              if (action.completedAt) {
                const createdDate = new Date(action.createdAt);
                const completedDate = new Date(action.completedAt);
                const daysDiff = Math.floor((completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
                totalActionDays += daysDiff;
                completedActionsWithTime++;
              }
            }
          });

          // Suggestions d'amélioration
          if (evaluation.improvementSuggestions) {
            evaluation.improvementSuggestions.forEach(suggestion => {
              totalSuggestions++;
              if (suggestion.status === 'implemented') {
                implementedSuggestions++;
              }
            });
          }
        });
      });
    });

    return {
      annualScore: scoreCount > 0 ? totalScore / scoreCount : 0,
      actionCompletionRate: totalActions > 0 ? (completedActions / totalActions) * 100 : 0,
      suggestionImplementationRate: totalSuggestions > 0 ? (implementedSuggestions / totalSuggestions) * 100 : 0,
      averageActionTime: completedActionsWithTime > 0 ? totalActionDays / completedActionsWithTime : 0,
      totalActions,
      completedActions,
      totalSuggestions,
      implementedSuggestions
    };
  };

  const kpis = calculateAnnualKPIs();

  // Monthly trend data
  const createMonthlyTrendData = () => {
    const monthlyData = completedYearAudits
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(audit => ({
        month: audit.month,
        score: audit.overallScore || 0,
        pillarScores: pillars.map(pillar => {
          const scores = audit.locationAudits
            .filter(la => la.completed)
            .map(la => {
              const evaluation = la.evaluations.find(e => e.pillarId === pillar.id);
              return evaluation ? evaluation.score : 0;
            });
          return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
        })
      }));

    const datasets = [
      {
        label: 'Score Global',
        data: monthlyData.map(d => d.score),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        tension: 0.3,
        fill: true
      }
    ];

    // Add pillar trends
    pillars.forEach((pillar, index) => {
      const colors = [
        'rgba(239, 68, 68, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(147, 51, 234, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(14, 165, 233, 0.8)',
        'rgba(99, 102, 241, 0.8)'
      ];

      datasets.push({
        label: pillar.name.split(' ')[0],
        data: monthlyData.map(d => d.pillarScores[index]),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length].replace('0.8', '0.1'),
        borderWidth: 2,
        tension: 0.3,
        fill: false
      });
    });

    return {
      labels: monthlyData.map(d => {
        const [year, month] = d.month.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('fr-FR', { month: 'short' });
      }),
      datasets
    };
  };

  // Annual pillar radar
  const createAnnualPillarRadar = () => {
    const pillarAverages = pillars.map(pillar => {
      let totalScore = 0;
      let count = 0;

      yearAudits.forEach(monthAudit => {
        monthAudit.locationAudits.forEach(locationAudit => {
          if (locationAudit.completed) {
            const evaluation = locationAudit.evaluations.find(e => e.pillarId === pillar.id);
            if (evaluation) {
              totalScore += evaluation.score;
              count++;
            }
          }
        });
      });

      return count > 0 ? totalScore / count : 0;
    });

    return {
      labels: pillars.map(pillar => pillar.name.split(' ')[0]),
      datasets: [{
        label: 'Score Annuel Moyen',
        data: pillarAverages,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2
      }]
    };
  };

  // Actions distribution by pillar
  const createActionsDistribution = () => {
    const pillarActions = pillars.map(pillar => {
      let pending = 0;
      let completed = 0;
      let suggestions = 0;
      let implemented = 0;

      yearAudits.forEach(monthAudit => {
        monthAudit.locationAudits.forEach(locationAudit => {
          const evaluation = locationAudit.evaluations.find(e => e.pillarId === pillar.id);
          if (evaluation) {
            evaluation.correctiveActions.forEach(action => {
              if (action.status === 'completed') completed++;
              else pending++;
            });

            if (evaluation.improvementSuggestions) {
              evaluation.improvementSuggestions.forEach(suggestion => {
                if (suggestion.status === 'implemented') implemented++;
                else suggestions++;
              });
            }
          }
        });
      });

      return { pending, completed, suggestions, implemented };
    });

    return {
      labels: pillars.map(pillar => pillar.name.split(' ')[0]),
      datasets: [
        {
          label: 'Actions En Cours',
          data: pillarActions.map(p => p.pending),
          backgroundColor: 'rgba(245, 158, 11, 0.7)'
        },
        {
          label: 'Actions Terminées',
          data: pillarActions.map(p => p.completed),
          backgroundColor: 'rgba(34, 197, 94, 0.7)'
        },
        {
          label: 'Suggestions En Cours',
          data: pillarActions.map(p => p.suggestions),
          backgroundColor: 'rgba(147, 51, 234, 0.7)'
        },
        {
          label: 'Suggestions Implémentées',
          data: pillarActions.map(p => p.implemented),
          backgroundColor: 'rgba(59, 130, 246, 0.7)'
        }
      ]
    };
  };

  // Locations comparison
  const createLocationsComparison = () => {
    const locationScores = locations.map(location => {
      let totalScore = 0;
      let count = 0;

      yearAudits.forEach(monthAudit => {
        const locationAudit = monthAudit.locationAudits.find(
          audit => audit.locationId === location.id && audit.completed
        );
        if (locationAudit && locationAudit.overallScore) {
          totalScore += locationAudit.overallScore;
          count++;
        }
      });

      return count > 0 ? totalScore / count : 0;
    });

    return {
      labels: locations.map(loc => loc.name),
      datasets: [{
        label: 'Score Annuel Moyen',
        data: locationScores,
        backgroundColor: locations.map((_, index) => {
          const colors = [
            'rgba(59, 130, 246, 0.7)',
            'rgba(34, 197, 94, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(147, 51, 234, 0.7)',
            'rgba(236, 72, 153, 0.7)'
          ];
          return colors[index % colors.length];
        }),
        borderColor: locations.map((_, index) => {
          const colors = [
            'rgba(59, 130, 246, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(147, 51, 234, 1)',
            'rgba(236, 72, 153, 1)'
          ];
          return colors[index % colors.length];
        }),
        borderWidth: 1
      }]
    };
  };

  useEffect(() => {
    let monthlyTrendChart: Chart | null = null;
    let pillarRadarChart: Chart | null = null;
    let pillarBarsChart: Chart | null = null;
    let actionsDistributionChart: Chart | null = null;
    let locationsComparisonChart: Chart | null = null;

    // Monthly Trend Chart
    if (monthlyTrendRef.current && completedYearAudits.length > 0) {
      const ctx = monthlyTrendRef.current.getContext('2d');
      if (ctx) {
        monthlyTrendChart = new Chart(ctx, {
          type: 'line',
          data: createMonthlyTrendData(),
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, max: 10 }
            },
            plugins: {
              title: { display: true, text: 'Évolution Mensuelle des Scores par Pilier' },
              legend: { position: 'bottom' }
            }
          }
        });
      }
    }

    // Pillar Radar Chart
    if (pillarRadarRef.current) {
      const ctx = pillarRadarRef.current.getContext('2d');
      if (ctx) {
        pillarRadarChart = new Chart(ctx, {
          type: 'radar',
          data: createAnnualPillarRadar(),
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              r: { beginAtZero: true, max: 10 }
            },
            plugins: {
              title: { display: true, text: 'Profil 6S Annuel Global' }
            }
          }
        });
      }
    }

    // Pillar Bars Chart
    if (pillarBarsRef.current) {
      const ctx = pillarBarsRef.current.getContext('2d');
      if (ctx) {
        pillarBarsChart = new Chart(ctx, {
          type: 'bar',
          data: createAnnualPillarRadar(),
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, max: 10 }
            },
            plugins: {
              title: { display: true, text: 'Scores Annuels par Pilier' }
            }
          }
        });
      }
    }

    // Actions Distribution Chart
    if (actionsDistributionRef.current) {
      const ctx = actionsDistributionRef.current.getContext('2d');
      if (ctx) {
        actionsDistributionChart = new Chart(ctx, {
          type: 'bar',
          data: createActionsDistribution(),
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { stacked: true },
              y: { stacked: true, beginAtZero: true }
            },
            plugins: {
              title: { display: true, text: 'Répartition Actions/Suggestions par Pilier' }
            }
          }
        });
      }
    }

    // Locations Comparison Chart
    if (locationsComparisonRef.current) {
      const ctx = locationsComparisonRef.current.getContext('2d');
      if (ctx) {
        locationsComparisonChart = new Chart(ctx, {
          type: 'bar',
          data: createLocationsComparison(),
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, max: 10 }
            },
            plugins: {
              title: { display: true, text: 'Comparaison des Performances par Local' }
            }
          }
        });
      }
    }

    return () => {
      if (monthlyTrendChart) monthlyTrendChart.destroy();
      if (pillarRadarChart) pillarRadarChart.destroy();
      if (pillarBarsChart) pillarBarsChart.destroy();
      if (actionsDistributionChart) actionsDistributionChart.destroy();
      if (locationsComparisonChart) locationsComparisonChart.destroy();
    };
  }, [yearAudits, completedYearAudits]);

  if (completedYearAudits.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Dashboard Annuel {currentYear}</h2>
        <div className="text-center py-8 text-gray-500">
          <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Aucune donnée d'audit disponible pour l'année {currentYear}.</p>
          <p className="text-sm mt-2">Complétez quelques audits pour voir apparaître les statistiques annuelles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Dashboard Annuel {currentYear}</h2>
        
        {/* Annual KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Score 6S Annuel</p>
                <p className="text-2xl font-bold text-blue-900">
                  {kpis.annualScore.toFixed(1)}/10
                </p>
              </div>
              <Award className="text-blue-500" size={24} />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Taux Actions</p>
                <p className="text-2xl font-bold text-green-900">
                  {kpis.actionCompletionRate.toFixed(0)}%
                </p>
                <p className="text-xs text-green-600">
                  {kpis.completedActions}/{kpis.totalActions}
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
                  {kpis.suggestionImplementationRate.toFixed(0)}%
                </p>
                <p className="text-xs text-purple-600">
                  {kpis.implementedSuggestions}/{kpis.totalSuggestions}
                </p>
              </div>
              <Lightbulb className="text-purple-500" size={24} />
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Temps Moyen Actions</p>
                <p className="text-2xl font-bold text-orange-900">
                  {kpis.averageActionTime.toFixed(0)}j
                </p>
                <p className="text-xs text-orange-600">
                  Délai de traitement
                </p>
              </div>
              <Clock className="text-orange-500" size={24} />
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="h-80">
              <canvas ref={monthlyTrendRef}></canvas>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="h-80">
              <canvas ref={pillarRadarRef}></canvas>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="h-80">
              <canvas ref={pillarBarsRef}></canvas>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="h-80">
              <canvas ref={actionsDistributionRef}></canvas>
            </div>
          </div>
        </div>

        {/* Full width chart */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="h-64">
            <canvas ref={locationsComparisonRef}></canvas>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Performance Globale</h3>
            <div className="space-y-1 text-sm">
              <p>Audits complétés: <span className="font-medium">{completedYearAudits.length}</span></p>
              <p>Score moyen: <span className="font-medium">{kpis.annualScore.toFixed(1)}/10</span></p>
              <p>Meilleur mois: <span className="font-medium">
                {completedYearAudits.length > 0 ? 
                  completedYearAudits.reduce((best, audit) => 
                    (audit.overallScore || 0) > (best.overallScore || 0) ? audit : best
                  ).month.split('-')[1] : '-'}
              </span></p>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">Actions Correctives</h3>
            <div className="space-y-1 text-sm">
              <p>Total créées: <span className="font-medium">{kpis.totalActions}</span></p>
              <p>Terminées: <span className="font-medium">{kpis.completedActions}</span></p>
              <p>Temps moyen: <span className="font-medium">{kpis.averageActionTime.toFixed(0)} jours</span></p>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-2">Amélioration Continue</h3>
            <div className="space-y-1 text-sm">
              <p>Suggestions: <span className="font-medium">{kpis.totalSuggestions}</span></p>
              <p>Implémentées: <span className="font-medium">{kpis.implementedSuggestions}</span></p>
              <p>Taux succès: <span className="font-medium">{kpis.suggestionImplementationRate.toFixed(0)}%</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnualReport;