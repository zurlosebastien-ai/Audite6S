import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart as ChartBar, History, Calendar } from 'lucide-react';
import MonthlyReport from '../components/reports/MonthlyReport';
import HistoricalReport from '../components/reports/HistoricalReport';
import AnnualReport from '../components/reports/AnnualReport';

type ReportView = 'monthly' | 'historical' | 'annual';

const ReportsPage: React.FC = () => {
  const { locationId } = useParams<{ locationId?: string }>();
  const [activeView, setActiveView] = useState<ReportView>('monthly');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Rapports d'audit</h1>
      
      {/* View toggle */}
      <div className="flex mb-6 border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setActiveView('monthly')}
          className={`flex-1 py-3 px-4 flex items-center justify-center transition-colors ${
            activeView === 'monthly' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <ChartBar size={18} className="mr-2" />
          <span>Mois en cours</span>
        </button>
        <button
          onClick={() => setActiveView('annual')}
          className={`flex-1 py-3 px-4 flex items-center justify-center transition-colors ${
            activeView === 'annual' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Calendar size={18} className="mr-2" />
          <span>Vue annuelle</span>
        </button>
        <button
          onClick={() => setActiveView('historical')}
          className={`flex-1 py-3 px-4 flex items-center justify-center transition-colors ${
            activeView === 'historical' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <History size={18} className="mr-2" />
          <span>Historique</span>
        </button>
      </div>
      
      {/* Report content */}
      {activeView === 'monthly' && <MonthlyReport />}
      {activeView === 'annual' && <AnnualReport />}
      {activeView === 'historical' && <HistoricalReport />}
    </div>
  );
};

export default ReportsPage;