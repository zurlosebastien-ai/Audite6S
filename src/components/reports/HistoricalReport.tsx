import React, { useRef, useEffect } from 'react';
import { useAudit } from '../../context/AuditContext';
import { History, TrendingUp, Award, Calendar } from 'lucide-react';
import DashboardCharts from './DashboardCharts';

const HistoricalReport: React.FC = () => {
  const { auditHistory, currentMonthAudit, isLoading, locations } = useAudit();
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-80 bg-gray-200 rounded mb-8"></div>
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
    return new Date(parseInt(year), parseInt(month) - 1)
      .toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  };
  
  const allAudits = [...auditHistory.audits, currentMonthAudit];
  const completedAudits = allAudits
    .filter(audit => audit.completed)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);
  
  // Calculate historical KPIs
  const currentYear = new Date().getFullYear();
  const yearlyAudits = completedAudits.filter(audit => audit.year === currentYear);
  const previousYearAudits = completedAudits.filter(audit => audit.year === currentYear - 1);
  
  const yearlyAverage = yearlyAudits.length > 0
    ? yearlyAudits.reduce((sum, audit) => sum + (audit.overallScore || 0), 0) / yearlyAudits.length
    : 0;
  
  const previousYearAverage = previousYearAudits.length > 0
    ? previousYearAudits.reduce((sum, audit) => sum + (audit.overallScore || 0), 0) / previousYearAudits.length
    : 0;

  const yearOverYearGrowth = previousYearAverage > 0
    ? ((yearlyAverage - previousYearAverage) / previousYearAverage) * 100
    : 0;

  // Find best and worst performing months
  const bestMonth = completedAudits.reduce((best, current) => 
    (current.overallScore || 0) > (best.overallScore || 0) ? current : best,
    { overallScore: 0, month: '', year: 0 }
  );

  const worstMonth = completedAudits.reduce((worst, current) => 
    (current.overallScore || 10) < (worst.overallScore || 10) ? current : worst,
    { overallScore: 10, month: '', year: 0 }
  );

  if (completedAudits.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <History className="text-blue-500 mr-3" size={24} />
          <h2 className="text-2xl font-semibold text-gray-900">Historique des audits</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          Aucune donnée historique disponible.
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <History className="text-blue-500 mr-3" size={28} />
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Historique des audits</h2>
            <p className="text-gray-600 mt-1">Vision annuelle et tendances historiques</p>
          </div>
        </div>

        {/* Historical KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Score Annuel {currentYear}</p>
                <p className="text-3xl font-bold">{yearlyAverage.toFixed(1)}/10</p>
                <p className="text-blue-100 text-xs mt-1">{yearlyAudits.length} audits</p>
              </div>
              <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
                <Award size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Évolution Annuelle</p>
                <p className="text-3xl font-bold">
                  {yearOverYearGrowth > 0 ? '+' : ''}{yearOverYearGrowth.toFixed(1)}%
                </p>
                <p className="text-green-100 text-xs mt-1">vs {currentYear - 1}</p>
              </div>
              <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Meilleur Mois</p>
                <p className="text-xl font-bold">{formatMonth(bestMonth.month)}</p>
                <p className="text-purple-100 text-xs mt-1">{bestMonth.overallScore?.toFixed(1)}/10</p>
              </div>
              <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
                <Award size={24} />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Total Audits</p>
                <p className="text-3xl font-bold">{completedAudits.length}</p>
                <p className="text-orange-100 text-xs mt-1">Historique complet</p>
              </div>
              <div className="bg-orange-400 bg-opacity-30 rounded-full p-3">
                <Calendar size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard with historical view */}
      <DashboardCharts />
      
      {/* Historical Data Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Données historiques détaillées</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="p-4 text-left font-semibold text-gray-700">Année</th>
                <th className="p-4 text-left font-semibold text-gray-700">Mois</th>
                {locations.map(location => (
                  <th key={location.id} className="p-4 text-left font-semibold text-gray-700">
                    {location.name}
                  </th>
                ))}
                <th className="p-4 text-left font-semibold text-gray-700">Score Global</th>
              </tr>
            </thead>
            <tbody>
              {completedAudits.map(monthAudit => (
                <tr key={monthAudit.month} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium">{monthAudit.year}</td>
                  <td className="p-4">{formatMonth(monthAudit.month)}</td>
                  
                  {locations.map(location => {
                    const locationAudit = monthAudit.locationAudits.find(
                      audit => audit.locationId === location.id && audit.completed
                    );
                    const score = locationAudit?.overallScore;
                    
                    return (
                      <td key={location.id} className="p-4">
                        {score !== undefined ? (
                          <span className={`font-medium ${
                            score >= 8 ? 'text-green-600' : 
                            score >= 6 ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {score.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    );
                  })}
                  
                  <td className="p-4">
                    {monthAudit.overallScore !== undefined ? (
                      <span className={`font-bold text-lg ${
                        monthAudit.overallScore >= 8 ? 'text-green-600' : 
                        monthAudit.overallScore >= 6 ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {monthAudit.overallScore.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoricalReport;