import React from 'react';
import { useAudit } from '../../context/AuditContext';
import { User, Calendar, TrendingUp, BarChart3 } from 'lucide-react';

const VisaKPIs: React.FC = () => {
  const { currentMonthAudit, auditHistory, isLoading } = useAudit();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Get all audits (current + history) without duplicates
  const allAuditsMap = new Map<string, typeof currentMonthAudit>();

  auditHistory.audits.forEach(audit => {
    allAuditsMap.set(audit.month, audit);
  });

  allAuditsMap.set(currentMonthAudit.month, currentMonthAudit);

  const allAudits = Array.from(allAuditsMap.values());
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Calculate visa statistics
  const getVisaStats = () => {
    const visaStats: Record<string, { monthly: number; yearly: number; total: number }> = {};

    allAudits.forEach(monthAudit => {
      monthAudit.locationAudits.forEach(locationAudit => {
        if (locationAudit.completed && locationAudit.auditorVisa) {
          const visa = locationAudit.auditorVisa;
          const auditDate = new Date(locationAudit.date);
          const auditYear = auditDate.getFullYear();
          const auditMonth = auditDate.getMonth() + 1;

          if (!visaStats[visa]) {
            visaStats[visa] = { monthly: 0, yearly: 0, total: 0 };
          }

          // Count for current month
          if (auditYear === currentYear && auditMonth === currentMonth) {
            visaStats[visa].monthly++;
          }

          // Count for current year
          if (auditYear === currentYear) {
            visaStats[visa].yearly++;
          }

          // Count total
          visaStats[visa].total++;
        }
      });
    });

    return visaStats;
  };

  const visaStats = getVisaStats();
  const visaList = Object.keys(visaStats).sort();

  // Calculate totals
  const totalMonthly = Object.values(visaStats).reduce((sum, stats) => sum + stats.monthly, 0);
  const totalYearly = Object.values(visaStats).reduce((sum, stats) => sum + stats.yearly, 0);
  const totalAll = Object.values(visaStats).reduce((sum, stats) => sum + stats.total, 0);

  const getMonthName = (month: number) => {
    return new Date(currentYear, month - 1).toLocaleDateString('fr-FR', { month: 'long' });
  };

  if (visaList.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-4">
          <User className="text-blue-500 mr-3" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Statistiques par Auditeur</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          <User size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Aucun audit avec visa n'a été enregistré.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-6">
        <User className="text-blue-500 mr-3" size={24} />
        <h2 className="text-xl font-semibold text-gray-900">Statistiques par Auditeur</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Ce mois</p>
              <p className="text-2xl font-bold">{totalMonthly}</p>
              <p className="text-blue-100 text-xs">{getMonthName(currentMonth)} {currentYear}</p>
            </div>
            <Calendar size={20} className="text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Cette année</p>
              <p className="text-2xl font-bold">{totalYearly}</p>
              <p className="text-green-100 text-xs">{currentYear}</p>
            </div>
            <TrendingUp size={20} className="text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total</p>
              <p className="text-2xl font-bold">{totalAll}</p>
              <p className="text-purple-100 text-xs">Tous les audits</p>
            </div>
            <BarChart3 size={20} className="text-purple-200" />
          </div>
        </div>
      </div>

      {/* Detailed Statistics Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Auditeur</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Ce mois</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Cette année</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Total</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">% Année</th>
            </tr>
          </thead>
          <tbody>
            {visaList.map((visa, index) => {
              const stats = visaStats[visa];
              const yearlyPercentage = totalYearly > 0 ? (stats.yearly / totalYearly) * 100 : 0;
              
              return (
                <tr key={visa} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-800 font-mono font-bold text-sm">{visa}</span>
                      </div>
                      <span className="font-medium text-gray-900">Auditeur {visa}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {stats.monthly}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {stats.yearly}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {stats.total}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${yearlyPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {yearlyPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Active Auditors This Month */}
      {totalMonthly > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">Auditeurs actifs ce mois :</h3>
          <div className="flex flex-wrap gap-2">
            {visaList
              .filter(visa => visaStats[visa].monthly > 0)
              .map(visa => (
                <span 
                  key={visa} 
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {visa} ({visaStats[visa].monthly})
                </span>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default VisaKPIs;