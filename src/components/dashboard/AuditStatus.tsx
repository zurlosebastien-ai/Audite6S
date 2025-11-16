import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { useAudit } from '../../context/AuditContext';

const AuditStatus: React.FC = () => {
  const { currentMonthAudit, getPendingLocations, isLoading, locations, locationGroups } = useAudit();
  const navigate = useNavigate();
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-full mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }
  
  const pendingLocationIds = getPendingLocations();
  const completedCount = locations.length - pendingLocationIds.length;
  const progress = (completedCount / locations.length) * 100;

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const handleStartAudit = (locationId: string) => {
    navigate(`/audit/${locationId}`);
  };

  const getGroupScore = (groupId: string) => {
    const groupScore = currentMonthAudit.groupScores.find(score => score.groupId === groupId);
    return groupScore?.score || 0;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Audit du mois : {getMonthName(currentMonthAudit.month)}
      </h2>

      {/* Group scores */}
      {currentMonthAudit.groupScores.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-4 text-lg">Scores par groupe</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {locationGroups.map(group => {
              const groupScore = getGroupScore(group.id);
              const groupLocations = locations.filter(loc => loc.groupId === group.id);
              const completedGroupAudits = currentMonthAudit.locationAudits.filter(
                audit => audit.completed && groupLocations.some(loc => loc.id === audit.locationId)
              );
              
              if (completedGroupAudits.length === 0) return null;
              
              return (
                <div key={group.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-900 text-lg">{group.name}</span>
                    <span className="text-2xl font-bold text-blue-700">
                      {groupScore.toFixed(1)}/10
                    </span>
                  </div>
                  <div className="text-sm text-blue-600 mt-2 font-medium">
                    {completedGroupAudits.length}/{groupLocations.length} locaux audités
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Location status list grouped by group */}
      <h3 className="font-semibold text-gray-800 mb-4 text-lg">État des locaux</h3>
      {locationGroups.map(group => {
        const groupLocations = locations.filter(loc => loc.groupId === group.id);
        
        return (
          <div key={group.id} className="mb-6">
            <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">
              {group.name}
            </h4>
            <ul className="space-y-3">
              {groupLocations.map((location) => {
                const locationAudit = currentMonthAudit.locationAudits.find(
                  audit => audit.locationId === location.id && audit.completed
                );
                
                const isPending = pendingLocationIds.includes(location.id);
                let statusIcon = isPending ? <Circle size={20} className="text-gray-400" /> : <CheckCircle size={20} className="text-green-500" />;
                let statusText = isPending ? "À auditer" : "Complété";
                let scoreDisplay = locationAudit?.overallScore !== undefined ? 
                  <span className="font-medium">{locationAudit.overallScore.toFixed(1)}/10</span> : 
                  null;
                
                return (
                  <li key={location.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center">
                      {statusIcon}
                      <span className="ml-3 font-medium text-gray-800">{location.name}</span>
                    </div>
                    <div className="flex items-center">
                      {scoreDisplay}
                      {isPending && (
                        <button 
                          onClick={() => handleStartAudit(location.id)}
                          className="ml-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium shadow-md"
                        >
                          Auditer
                        </button>
                      )}
                      {!isPending && scoreDisplay && (
                        <button 
                          onClick={() => navigate(`/reports/location/${location.id}`)}
                          className="ml-4 px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-all duration-300 font-medium"
                        >
                          Détails
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      {/* Monthly summary if completed */}
      {currentMonthAudit.completed && currentMonthAudit.overallScore !== undefined && (
        <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle size={24} className="text-green-600" />
              <span className="ml-3 font-semibold text-green-800 text-lg">Audit mensuel terminé</span>
            </div>
            <div className="text-xl font-bold text-green-700">
              Score global: {currentMonthAudit.overallScore.toFixed(1)}/10
            </div>
          </div>
          <div className="mt-2 flex justify-end">
            <button 
              onClick={() => navigate('/reports')}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium shadow-lg"
            >
              Voir le rapport
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditStatus;