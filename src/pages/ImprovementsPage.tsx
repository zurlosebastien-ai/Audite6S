import React from 'react';
import { useAudit } from '../context/AuditContext';
import { Check, Lightbulb, Clock, CheckCircle } from 'lucide-react';

const ImprovementsPage: React.FC = () => {
  const { currentMonthAudit, completeImprovementSuggestion, isLoading, locations, pillars } = useAudit();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Get all improvement suggestions from all location audits
  const allSuggestions = currentMonthAudit?.locationAudits?.flatMap(audit => {
    const location = locations.find(loc => loc.id === audit.locationId);
    return audit.evaluations?.flatMap(evaluation => {
      const pillar = pillars.find(p => p.id === evaluation.pillarId);
      return evaluation.improvementSuggestions?.map(suggestion => ({
        ...suggestion,
        locationName: location?.name || 'Unknown',
        pillarName: pillar?.name || 'Unknown',
        locationId: audit.locationId,
        pillarId: evaluation.pillarId
      })) ?? [];
    }) ?? [];
  }) ?? [];

  const pendingSuggestions = allSuggestions.filter(suggestion => suggestion.status === 'pending');
  const implementedSuggestions = allSuggestions.filter(suggestion => suggestion.status === 'implemented');

  if (allSuggestions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Amélioration continue</h1>
        <div className="text-center py-8 text-gray-500">
          <Lightbulb size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Aucune suggestion d'amélioration n'a été enregistrée ce mois-ci.</p>
          <p className="text-sm mt-2">Les suggestions peuvent être ajoutées lors des audits du pilier Shitsuke.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Amélioration continue</h1>
        
        {/* Summary badges */}
        <div className="flex gap-2">
          {pendingSuggestions.length > 0 && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              {pendingSuggestions.length} en cours
            </span>
          )}
          {implementedSuggestions.length > 0 && (
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              {implementedSuggestions.length} implémentée(s)
            </span>
          )}
        </div>
      </div>

      {pendingSuggestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-blue-500" />
            <h2 className="text-xl font-semibold">Suggestions en cours</h2>
          </div>
          <div className="space-y-4">
            {pendingSuggestions.map(suggestion => (
              <div
                key={suggestion.id}
                className="border border-blue-200 bg-blue-50 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{suggestion.description}</p>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Local : {suggestion.locationName}</p>
                      <p>Pilier : {suggestion.pillarName}</p>
                      <p>Suggérée le : {new Date(suggestion.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => completeImprovementSuggestion(suggestion.id, suggestion.locationId, suggestion.pillarId)}
                    className="p-2 hover:bg-blue-100 rounded-full transition-colors"
                    title="Marquer comme implémentée"
                  >
                    <Check size={20} className="text-blue-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {implementedSuggestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="text-green-500" />
            <h2 className="text-xl font-semibold">Suggestions implémentées</h2>
          </div>
          <div className="space-y-4">
            {implementedSuggestions.map(suggestion => (
              <div
                key={suggestion.id}
                className="border border-green-200 bg-green-50 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{suggestion.description}</p>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Local : {suggestion.locationName}</p>
                      <p>Pilier : {suggestion.pillarName}</p>
                      <p>Suggérée le : {new Date(suggestion.createdAt).toLocaleDateString('fr-FR')}</p>
                      {suggestion.implementedAt && (
                        <p>Implémentée le : {new Date(suggestion.implementedAt).toLocaleDateString('fr-FR')}</p>
                      )}
                    </div>
                  </div>
                  <CheckCircle size={20} className="text-green-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovementsPage;