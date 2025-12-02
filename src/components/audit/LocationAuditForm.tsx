import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Save, CheckCircle, User } from 'lucide-react';
import { useAudit } from '../../context/AuditContext';
import { PillarEvaluation } from '../../types';
import PillarEvaluationForm from './PillarEvaluationForm';

interface LocationAuditFormProps {
  locationId: string;
}

const LocationAuditForm: React.FC<LocationAuditFormProps> = ({ locationId }) => {
  const { 
    startLocationAudit, 
    getLocationAudit, 
    updateEvaluation, 
    completeLocationAudit,
    isLoading,
    locations,
    pillars
  } = useAudit();
  const navigate = useNavigate();
  const [currentPillarIndex, setCurrentPillarIndex] = useState(0);
  const [auditorVisa, setAuditorVisa] = useState<string>('');
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  const location = locations.find(loc => loc.id === locationId);
  if (!location) {
    return <div>Location introuvable</div>;
  }
  
  // Start audit if not already started
  const locationAudit = getLocationAudit(locationId);
  if (!locationAudit) {
    startLocationAudit(locationId);
  } else if (locationAudit.auditorVisa) {
    setAuditorVisa(locationAudit.auditorVisa);
  }
  
  const currentPillar = pillars[currentPillarIndex];
  const initialEvaluation = locationAudit?.evaluations.find(
    evaluationItem => evaluationItem.pillarId === currentPillar.id
  );
  
  const handleSaveEvaluation = (evaluation: PillarEvaluation) => {
    updateEvaluation(locationId, evaluation);
    
    // Move to next pillar if not the last one
    if (currentPillarIndex < pillars.length - 1) {
      setCurrentPillarIndex(currentPillarIndex + 1);
    }
  };
  
  const handlePrevPillar = () => {
    if (currentPillarIndex > 0) {
      setCurrentPillarIndex(currentPillarIndex - 1);
    }
  };
  
  const handleNextPillar = () => {
    if (currentPillarIndex < pillars.length - 1) {
      setCurrentPillarIndex(currentPillarIndex + 1);
    }
  };
  
  const handleCompleteAudit = () => {
    if (!auditorVisa.trim()) {
      alert('Veuillez saisir votre visa (3 lettres) avant de finaliser l\'audit.');
      return;
    }
    
    if (auditorVisa.length !== 3) {
      alert('Le visa doit contenir exactement 3 lettres.');
      return;
    }
    
    completeLocationAudit(locationId, auditorVisa.toUpperCase());
    navigate('/');
  };
  
  // Check if all pillars have been evaluated (including people pillar)
  const canComplete = locationAudit?.evaluations.length === pillars.length;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Audit : {location.name}</h1>
        <div className="flex items-center gap-4">
          {/* Visa input */}
          <div className="flex items-center gap-2">
            <User size={18} className="text-gray-500" />
            <input
              type="text"
              value={auditorVisa}
              onChange={(e) => setAuditorVisa(e.target.value.toUpperCase().slice(0, 3))}
              placeholder="Visa (3 lettres)"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 text-center font-mono"
              maxLength={3}
            />
          </div>
          
          {canComplete && (
            <button
              onClick={handleCompleteAudit}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                auditorVisa.length === 3 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={auditorVisa.length !== 3}
            >
              <CheckCircle size={18} className="mr-2" />
              Finaliser l'audit
            </button>
          )}
        </div>
      </div>
      
      {/* Pillar navigation */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-full">
          {pillars.map((pillar, index) => {
            const isActive = index === currentPillarIndex;
            const isCompleted = locationAudit?.evaluations.some(
              evaluationItem => evaluationItem.pillarId === pillar.id
            );
            
            return (
              <button
                key={pillar.id}
                onClick={() => setCurrentPillarIndex(index)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                  ${isActive ? 'bg-blue-600 text-white' : ''}
                  ${!isActive && isCompleted ? 'bg-green-100 text-green-800' : ''}
                  ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-600' : ''}
                `}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Current pillar evaluation form */}
      <PillarEvaluationForm
        pillar={currentPillar}
        initialEvaluation={initialEvaluation}
        onSave={handleSaveEvaluation}
      />
      
      {/* Navigation buttons */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevPillar}
          className={`flex items-center px-4 py-2 rounded-md transition-colors
            ${currentPillarIndex > 0 
              ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`
          }
          disabled={currentPillarIndex === 0}
        >
          <ChevronLeft size={18} className="mr-1" />
          Précédent
        </button>
        
        <button
          onClick={handleNextPillar}
          className={`flex items-center px-4 py-2 rounded-md transition-colors
            ${currentPillarIndex < pillars.length - 1 
              ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`
          }
          disabled={currentPillarIndex === pillars.length - 1}
        >
          Suivant
          <ChevronRight size={18} className="ml-1" />
        </button>
      </div>
    </div>
  );
};

export default LocationAuditForm;