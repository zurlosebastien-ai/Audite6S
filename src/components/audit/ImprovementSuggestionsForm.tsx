import React, { useState } from 'react';
import { ArrowLeft, Plus, Lightbulb, CheckCircle } from 'lucide-react';
import { useAudit } from '../../context/AuditContext';
import { ImprovementSuggestion } from '../../types';

interface ImprovementSuggestionsFormProps {
  locationId: string;
  locationName: string;
  onFinish: () => void;
  onBack: () => void;
}

const ImprovementSuggestionsForm: React.FC<ImprovementSuggestionsFormProps> = ({
  locationId,
  locationName,
  onFinish,
  onBack
}) => {
  const { getLocationAudit, updateEvaluation, pillars } = useAudit();
  const [newSuggestion, setNewSuggestion] = useState('');
  const [suggestions, setSuggestions] = useState<ImprovementSuggestion[]>([]);

  const locationAudit = getLocationAudit(locationId);
  
  const handleAddSuggestion = () => {
    if (!newSuggestion.trim()) return;

    const suggestion: ImprovementSuggestion = {
      id: crypto.randomUUID(),
      description: newSuggestion.trim(),
      locationId: locationId,
      pillarId: 'shitsuke', // Associé au pilier Shitsuke
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    setSuggestions([...suggestions, suggestion]);
    setNewSuggestion('');
  };

  const handleRemoveSuggestion = (suggestionId: string) => {
    setSuggestions(suggestions.filter(s => s.id !== suggestionId));
  };

  const handleFinish = () => {
    // Add suggestions to the Shitsuke pillar evaluation
    if (suggestions.length > 0 && locationAudit) {
      const shitsukeEvaluation = locationAudit.evaluations.find(e => e.pillarId === 'shitsuke');
      if (shitsukeEvaluation) {
        const updatedEvaluation = {
          ...shitsukeEvaluation,
          improvementSuggestions: [
            ...(shitsukeEvaluation.improvementSuggestions || []),
            ...suggestions
          ]
        };
        updateEvaluation(locationId, updatedEvaluation);
      }
    }
    
    onFinish();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suggestions d'amélioration continue</h1>
          <p className="text-gray-600 mt-1">Local : {locationName}</p>
        </div>
      </div>

      <div className="mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <Lightbulb className="text-blue-500 mr-3" size={24} />
            <h2 className="text-xl font-semibold text-blue-900">Amélioration continue</h2>
          </div>
          <p className="text-blue-800 mb-4">
            Profitez de cette étape pour proposer des améliorations qui pourraient être mises en place 
            dans ce local pour optimiser les processus, la sécurité ou la qualité.
          </p>
          <p className="text-blue-700 text-sm">
            Ces suggestions seront suivies dans la section "Améliorations" de l'application.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newSuggestion}
              onChange={(e) => setNewSuggestion(e.target.value)}
              placeholder="Décrivez votre suggestion d'amélioration..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleAddSuggestion()}
            />
            <button
              onClick={handleAddSuggestion}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus size={18} className="mr-2" />
              Ajouter
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-700">Suggestions ajoutées :</h3>
              {suggestions.map((suggestion, index) => (
                <div key={suggestion.id} className="flex items-start justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full mr-2">
                        #{index + 1}
                      </span>
                      <span className="text-sm text-green-600">Suggestion d'amélioration</span>
                    </div>
                    <p className="text-gray-800">{suggestion.description}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveSuggestion(suggestion.id)}
                    className="ml-4 p-1 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                    title="Supprimer cette suggestion"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <p className="text-gray-600">
          {suggestions.length === 0 
            ? "Aucune suggestion ajoutée (optionnel)" 
            : `${suggestions.length} suggestion(s) ajoutée(s)`
          }
        </p>
        <button
          onClick={handleFinish}
          className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
        >
          <CheckCircle size={18} className="mr-2" />
          Finaliser l'audit
        </button>
      </div>
    </div>
  );
};

export default ImprovementSuggestionsForm;