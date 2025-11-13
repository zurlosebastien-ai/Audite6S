import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import LocationAuditForm from '../components/audit/LocationAuditForm';
import { LOCATIONS } from '../data/constants';
import { useAudit } from '../context/AuditContext';

const AuditPage: React.FC = () => {
  const { locationId } = useParams<{ locationId?: string }>();
  const { getPendingLocations } = useAudit();
  
  // If no location ID is provided, show list of pending locations
  if (!locationId) {
    const pendingLocations = getPendingLocations();
    
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Audit des locaux</h1>
        
        {pendingLocations.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
            <p className="text-green-800 font-medium">
              Tous les locaux ont été audités ce mois-ci !
            </p>
            <p className="text-green-600 mt-2">
              Rendez-vous le mois prochain pour la prochaine campagne d'audit.
            </p>
          </div>
        ) : (
          <div>
            <p className="mb-4 text-gray-600">
              Sélectionnez un local à auditer :
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pendingLocations.map(id => {
                const location = LOCATIONS.find(loc => loc.id === id);
                if (!location) return null;
                
                return (
                  <div 
                    key={location.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => window.location.href = `/audit/${location.id}`}
                  >
                    <h2 className="text-xl font-semibold mb-2">{location.name}</h2>
                    <p className="text-blue-600">Commencer l'audit →</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Check if the provided location ID is valid
  const isValidLocation = LOCATIONS.some(loc => loc.id === locationId);
  if (!isValidLocation) {
    return <Navigate to="/audit" replace />;
  }
  
  // Check if the location is already audited this month
  const pendingLocations = getPendingLocations();
  const isPending = pendingLocations.includes(locationId);
  
  // If not pending, redirect to the audit list
  if (!isPending) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Local déjà audité</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-center">
          <p className="text-yellow-800 font-medium">
            Ce local a déjà été audité ce mois-ci.
          </p>
          <p className="text-yellow-600 mt-2">
            Veuillez sélectionner un autre local ou consulter les rapports.
          </p>
          <button
            onClick={() => window.location.href = '/audit'}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }
  
  return <LocationAuditForm locationId={locationId} />;
};

export default AuditPage;