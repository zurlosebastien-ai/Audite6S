import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { useAudit } from '../../context/AuditContext';
import { LOCATIONS, LOCATION_GROUPS } from '../../data/constants';

const AuditStatus: React.FC = () => {
  const { currentMonthAudit, getPendingLocations } = useAudit();
  const navigate = useNavigate();
  
  const pendingLocationIds = getPendingLocations();
  const completedCount = LOCATIONS.length - pendingLocationIds.length;
  const progress = (completedCount / LOCATIONS.length) * 100;

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
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">
        Audit du mois : {getMonthName(currentMonthAudit.month)}
      </h2>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {completedCount} sur {LOCATIONS.length} locaux audités
          </span>
          <span className="text-sm font-medium text-gray-700">
            {progress.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Group scores */}
      {currentMonthAudit.groupScores.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium text-gray-700 mb-3">Scores par groupe :</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LOCATION_GROUPS.map(group => {
              const groupScore = getGroupScore(group.id);
              const groupLocations = LOCATIONS.filter(loc => loc.groupId === group.id);
              const completedGroupAudits = currentMonthAudit.locationAudits.filter(
                audit => audit.completed && groupLocations.some(loc => loc.id === audit.locationId)
              );
              
              if (completedGroupAudits.length === 0) return null;
              
              return (
                <div key={group.id} className="bg-blue-50 p-4 rounded-md border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-900">{group.name}</span>
                    <span className="text-lg font-bold text-blue-700">
                      {groupScore.toFixed(1)}/10
                    </span>
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    {completedGroupAudits.length}/{groupLocations.length} locaux audités
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Location status list grouped by group */}
      <h3 className="font-medium text-gray-700 mb-3">État des locaux :</h3>
      {LOCATION_GROUPS.map(group => {
        const groupLocations = LOCATIONS.filter(loc => loc.groupId === group.id);
        
        return (
          <div key={group.id} className="mb-6">
            <h4 className="text-sm font-medium text-gray-600 mb-2 uppercase tracking-wide">
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
                  <li key={location.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      {statusIcon}
                      <span className="ml-3">{location.name}</span>
                    </div>
                    <div className="flex items-center">
                      {scoreDisplay}
                      {isPending && (
                        <button 
                          onClick={() => handleStartAudit(location.id)}
                          className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Auditer
                        </button>
                      )}
                      {!isPending && scoreDisplay && (
                        <button 
                          onClick={() => navigate(`/reports/location/${location.id}`)}
                          className="ml-4 px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
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
        <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle size={24} className="text-blue-600" />
              <span className="ml-2 font-medium">Audit mensuel terminé</span>
            </div>
            <div className="text-lg font-semibold">
              Score global: {currentMonthAudit.overallScore.toFixed(1)}/10
            </div>
          </div>
          <div className="mt-2 flex justify-end">
            <button 
              onClick={() => navigate('/reports')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
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