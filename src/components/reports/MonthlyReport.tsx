import React, { useRef, useEffect } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { useAudit } from '../../context/AuditContext';
import Chart from 'chart.js/auto';
import DashboardCharts from './DashboardCharts';

const MonthlyReport: React.FC = () => {
  const { currentMonthAudit, exportToExcel, isLoading } = useAudit();
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
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

  if (!currentMonthAudit.locationAudits.some(audit => audit.completed)) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <BarChart3 className="text-blue-500 mr-3" size={24} />
          <h2 className="text-2xl font-semibold text-gray-900">
            Rapport mensuel: {formatMonth(currentMonthAudit.month)}
          </h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          Aucun audit complété ce mois-ci.
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className="text-blue-500 mr-3" size={28} />
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Rapport mensuel: {formatMonth(currentMonthAudit.month)}
              </h2>
              <p className="text-gray-600 mt-1">Analyse détaillée des performances 6S</p>
            </div>
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <Download size={18} className="mr-2" />
            Exporter
          </button>
        </div>
      </div>

      {/* Main Dashboard */}
      <DashboardCharts />
    </div>
  );
};

export default MonthlyReport;