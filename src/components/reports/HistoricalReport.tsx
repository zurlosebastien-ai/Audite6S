import React, { useRef, useEffect } from 'react';
import { useAudit } from '../../context/AuditContext';
import Chart from 'chart.js/auto';

const HistoricalReport: React.FC = () => {
  const { auditHistory, isLoading, locations, pillars } = useAudit();
  const trendChartRef = useRef<HTMLCanvasElement>(null);
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
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
  
  const recentAudits = [...auditHistory.audits]
    .filter(audit => audit.completed)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);
  
  const createTrendChartData = () => {
    const datasets = locations.map((location, index) => {
      const colors = [
        'rgba(59, 130, 246, 0.7)',
        'rgba(16, 185, 129, 0.7)',
        'rgba(239, 68, 68, 0.7)',
        'rgba(245, 158, 11, 0.7)',
        'rgba(147, 51, 234, 0.7)',
        'rgba(236, 72, 153, 0.7)',
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
        backgroundColor: colors[index % colors.length].replace('0.7', '0.1'),
        tension: 0.2,
      };
    });
    
    datasets.push({
      label: 'Score Global Mensuel',
      data: recentAudits.map(audit => audit.overallScore || null),
      borderColor: 'rgba(124, 58, 237, 0.7)',
      backgroundColor: 'rgba(124, 58, 237, 0.1)',
      borderWidth: 2,
      tension: 0.2,
    });
    
    return {
      labels: recentAudits.map(audit => formatMonth(audit.month)),
      datasets
    };
  };
  
  useEffect(() => {
    let trendChart: Chart | null = null;
    
    if (trendChartRef.current && recentAudits.length > 0) {
      const ctx = trendChartRef.current.getContext('2d');
      if (ctx) {
        trendChart = new Chart(ctx, {
          type: 'line',
          data: createTrendChartData(),
          options: {
            scales: {
              y: {
                beginAtZero: true,
                max: 10,
                title: {
                  display: true,
                  text: 'Score'
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Mois'
                }
              }
            },
            plugins: {
              title: {
                display: true,
                text: 'Évolution des scores au fil du temps'
              },
              tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                  title: (context) => {
                    const index = context[0].dataIndex;
                    const audit = recentAudits[index];
                    return `${formatMonth(audit.month)} (${audit.year})`;
                  }
                }
              }
            },
            responsive: true,
            maintainAspectRatio: false
          }
        });
      }
    }
    
    return () => {
      if (trendChart) trendChart.destroy();
    };
  }, [auditHistory]);
  
  if (recentAudits.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Historique des audits</h2>
        <div className="text-center py-8 text-gray-500">
          Aucune donnée historique disponible.
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Historique des audits</h2>
      
      <div className="h-80 mb-8">
        <canvas ref={trendChartRef}></canvas>
      </div>
      
      <h3 className="font-medium text-gray-700 mb-4">Scores mensuels :</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="p-3 text-left font-medium text-gray-700">Année</th>
              <th className="p-3 text-left font-medium text-gray-700">Mois</th>
              {locations.map(location => (
                <th key={location.id} className="p-3 text-left font-medium text-gray-700">
                  {location.name}
                </th>
              ))}
              <th className="p-3 text-left font-medium text-gray-700">Global</th>
            </tr>
          </thead>
          <tbody>
            {recentAudits.map(monthAudit => (
              <tr key={monthAudit.month} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-3">{monthAudit.year}</td>
                <td className="p-3">{formatMonth(monthAudit.month)}</td>
                
                {locations.map(location => {
                  const locationAudit = monthAudit.locationAudits.find(
                    audit => audit.locationId === location.id && audit.completed
                  );
                  
                  return (
                    <td key={location.id} className="p-3">
                      {locationAudit?.overallScore?.toFixed(1) || "-"}
                    </td>
                  );
                })}
                
                <td className="p-3 font-medium">
                  {monthAudit.overallScore?.toFixed(1) || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoricalReport;