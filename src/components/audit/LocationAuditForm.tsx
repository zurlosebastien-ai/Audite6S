import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Save, CheckCircle } from 'lucide-react';
import { useAudit } from '../../context/AuditContext';
import { PILLARS, LOCATIONS } from '../../data/constants';
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
    completeLocationAudit 
  } = useAudit();
  const navigate = useNavigate();
  const [currentPillarIndex, setCurrentPillarIndex] = useState(0);
  
  const location = LOCATIONS.find(loc => loc.id === locationId);
  if (!location) {
    return <div>Location introuvable</div>;
  }
  
  // Start audit if not already started
  const locationAudit = getLocationAudit(locationId);
  if (!locationAudit) {
    startLocationAudit(locationId);
  }
  
  const currentPillar = PILLARS[currentPillarIndex];
  const initialEvaluation = locationAudit?.evaluations.find(
    evaluationItem => evaluationItem.pillarId === currentPillar.id
  );
  
  const handleSaveEvaluation = (evaluation: PillarEvaluation) => {
    updateEvaluation(locationId, evaluation);
    
    // Move to next pillar if not the last one
    if (currentPillarIndex < PILLARS.length - 1) {
      setCurrentPillarIndex(currentPillarIndex + 1);
    }
  };
  
  const handlePrevPillar = () => {
    if (currentPillarIndex > 0) {
      setCurrentPillarIndex(currentPillarIndex - 1);
    }
  };
  
  const handleNextPillar = () => {
    if (currentPillarIndex < PILLARS.length - 1) {
      setCurrentPillarIndex(currentPillarIndex + 1);
    }
  };
  
  const handleCompleteAudit = () => {
    completeLocationAudit(locationId);
    navigate('/');
  };
  
  // Check if all pillars have been evaluated (including people pillar)
  const canComplete = locationAudit?.evaluations.length === PILLARS.length;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Audit : {location.name}</h1>
        {canComplete && (
          <button
            onClick={handleCompleteAudit}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <CheckCircle size={18} className="mr-2" />
            Finaliser l'audit
          </button>
        )}
      </div>
      
      {/* Pillar navigation */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-full">
          {PILLARS.map((pillar, index) => {
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
            ${currentPillarIndex < PILLARS.length - 1 
              ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`
          }
          disabled={currentPillarIndex === PILLARS.length - 1}
        >
          Suivant
          <ChevronRight size={18} className="ml-1" />
        </button>
      </div>
    </div>
  );
};

export default LocationAuditForm;