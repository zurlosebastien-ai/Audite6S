import React, { useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import { useAudit } from '../../context/AuditContext';
import Chart from 'chart.js/auto';

const MonthlyReport: React.FC = () => {
  const { currentMonthAudit, exportToExcel, isLoading, locations, pillars, locationGroups } = useAudit();
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const radarChartRef = useRef<HTMLCanvasElement>(null);
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }
  
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric'
    });
  };

  const getGroupScore = (groupId: string) => {
    const groupScore = currentMonthAudit.groupScores.find(score => score.groupId === groupId);
    return groupScore?.score || 0;
  };
  
  const createLocationChartData = (groupId: string) => {
    const groupLocations = locations.filter(loc => loc.groupId === groupId);
    const completedAudits = currentMonthAudit.locationAudits.filter(
      audit => audit.completed && groupLocations.some(loc => loc.id === audit.locationId)
    );
    
    return {
      labels: completedAudits.map(audit => {
        const location = locations.find(loc => loc.id === audit.locationId);
        return location ? location.name : audit.locationId;
      }),
      datasets: [{
        label: 'Score par local',
        data: completedAudits.map(audit => audit.overallScore || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }]
    };
  };
  
  const createPillarRadarData = (groupId: string) => {
    const groupLocations = locations.filter(loc => loc.groupId === groupId);
    
    // Exclude 'people' pillar from radar chart as it's not scored
    const scoredPillars = pillars.filter(pillar => pillar.id !== 'people');
    
    const pillarAverages = scoredPillars.map(pillar => {
      const scores = currentMonthAudit.locationAudits
        .filter(audit => audit.completed && groupLocations.some(loc => loc.id === audit.locationId))
        .map(audit => {
          const evaluation = audit.evaluations.find(e => e.pillarId === pillar.id);
          return evaluation ? evaluation.score : 0;
        });
      
      return scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0;
    });
    
    return {
      labels: scoredPillars.map(pillar => pillar.name.split(' ')[0]),
      datasets: [{
        label: 'Score moyen',
        data: pillarAverages,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
      }]
    };
  };

  if (!currentMonthAudit.locationAudits.some(audit => audit.completed)) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          Rapport mensuel: {formatMonth(currentMonthAudit.month)}
        </h2>
        <div className="text-center py-8 text-gray-500">
          Aucun audit complété ce mois-ci.
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {locationGroups.map(group => {
        const groupLocations = locations.filter(loc => loc.groupId === group.id);
        const completedAudits = currentMonthAudit.locationAudits.filter(
          audit => audit.completed && groupLocations.some(loc => loc.id === audit.locationId)
        );

        if (completedAudits.length === 0) return null;

        return (
          <div key={group.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                Rapport {group.name}: {formatMonth(currentMonthAudit.month)}
              </h2>
              <button
                onClick={exportToExcel}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Download size={16} className="mr-2" />
                Exporter
              </button>
            </div>
            
            <div className="mb-8 p-4 bg-blue-50 rounded-md border border-blue-200 flex justify-between items-center">
              <span className="font-medium">Score global du groupe :</span>
              <span className="text-2xl font-bold text-blue-700">
                {getGroupScore(group.id).toFixed(1)}/10
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-md">
                <canvas ref={barChartRef}></canvas>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <canvas ref={radarChartRef}></canvas>
              </div>
            </div>
            
            <h3 className="font-medium text-gray-700 mb-4">Détails par local :</h3>
            <div className="space-y-4">
              {completedAudits.map(audit => {
                const location = locations.find(loc => loc.id === audit.locationId);
                if (!location) return null;
                
                return (
                  <div key={audit.locationId} className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="flex justify-between items-center bg-gray-50 p-3 border-b border-gray-200">
                      <h4 className="font-medium">{location.name}</h4>
                      <span className="font-semibold">
                        Score: {audit.overallScore?.toFixed(1) || "-"}/10
                      </span>
                    </div>
                    <div className="p-3">
                      <h5 className="text-sm font-medium text-gray-600 mb-2">Évaluations par pilier :</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {pillars.map(pillar => {
                          const evaluation = audit.evaluations.find(e => e.pillarId === pillar.id);
                          if (!evaluation) return null;
                          
                          return (
                            <div key={pillar.id} className="bg-gray-50 p-2 rounded">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm">{pillar.name}</span>
                                <span className="font-medium">{evaluation.score}/10</span>
                              </div>
                              {evaluation.comment && (
                                <p className="text-xs text-gray-600 overflow-hidden text-ellipsis line-clamp-1">
                                  {evaluation.comment}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MonthlyReport;