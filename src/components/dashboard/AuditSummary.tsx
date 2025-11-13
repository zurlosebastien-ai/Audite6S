import React from 'react';
import { BarChart2, Download } from 'lucide-react';
import { useAudit } from '../../context/AuditContext';
import { LOCATIONS, PILLARS } from '../../data/constants';

const AuditSummary: React.FC = () => {
  const { currentMonthAudit, exportToExcel } = useAudit();
  
  // Calculate average scores per pillar
  const pillarAverages = PILLARS.map(pillar => {
    // Skip 'people' pillar for scoring display
    if (pillar.id === 'people') {
      return null;
    }
    
    let totalScore = 0;
    let count = 0;
    
    currentMonthAudit.locationAudits.forEach(audit => {
      if (audit.completed) {
        const evaluation = audit.evaluations.find(evaluationItem => evaluationItem.pillarId === pillar.id);
        if (evaluation) {
          totalScore += evaluation.score;
          count++;
        }
      }
    });
    
    return {
      pillarId: pillar.id,
      name: pillar.name.split(' ')[0], // Just the first part of the name
      average: count > 0 ? totalScore / count : 0,
    };
  }).filter(Boolean); // Remove null values
  
  // Only display if we have completed audits
  const hasCompletedAudits = currentMonthAudit.locationAudits.some(audit => audit.completed);
  
  if (!hasCompletedAudits) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Résumé du mois</h2>
          <BarChart2 size={24} className="text-gray-400" />
        </div>
        <div className="text-center py-8 text-gray-500">
          Aucun audit complété ce mois-ci.
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Résumé du mois</h2>
        <button
          onClick={exportToExcel}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Download size={16} className="mr-2" />
          Exporter
        </button>
      </div>
      
      {/* Simple bar chart for pillar averages */}
      <div className="space-y-3">
        {pillarAverages.map(pillar => (
          <div key={pillar.pillarId} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{pillar.name}</span>
              <span className="text-sm font-medium">{pillar.average.toFixed(1)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${(pillar.average / 10) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Location scores */}
      <div className="mt-8">
        <h3 className="font-medium text-gray-700 mb-3">Scores par local :</h3>
        <div className="grid grid-cols-2 gap-3">
          {LOCATIONS.map(location => {
            const locationAudit = currentMonthAudit.locationAudits.find(
              audit => audit.locationId === location.id && audit.completed
            );
            
            if (!locationAudit) return null;
            
            return (
              <div 
                key={location.id} 
                className="bg-gray-50 p-3 rounded-md flex flex-col items-center"
              >
                <span className="text-sm text-gray-600 mb-1">{location.name}</span>
                <span className="text-lg font-semibold">
                  {locationAudit.overallScore?.toFixed(1) || "-"}/10
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AuditSummary;