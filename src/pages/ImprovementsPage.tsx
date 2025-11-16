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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 flex items-center">
            <Lightbulb className="mr-3 text-purple-600" size={32} />
            Amélioration continue
          </h1>
          <div className="text-center py-12 text-gray-500">
          <Lightbulb size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Aucune suggestion d'amélioration n'a été enregistrée ce mois-ci.</p>
          <p className="text-sm mt-2">Les suggestions peuvent être ajoutées lors des audits du pilier Shitsuke.</p>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <Lightbulb className="mr-3 text-purple-600" size={32} />
          Amélioration continue
        </h1>
        
        {/* Summary badges */}
        <div className="flex gap-3">
          {pendingSuggestions.length > 0 && (
            <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-sm font-semibold rounded-full shadow-sm">
              {pendingSuggestions.length} en cours
            </span>
          )}
          {implementedSuggestions.length > 0 && (
            <span className="px-4 py-2 bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-sm font-semibold rounded-full shadow-sm">
              {implementedSuggestions.length} implémentée(s)
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">
      {pendingSuggestions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-800">Suggestions en cours</h2>
          </div>
          <div className="space-y-5">
            {pendingSuggestions.map(suggestion => (
              <div
                key={suggestion.id}
                className="border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-lg mb-3">{suggestion.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                      <p><span className="font-medium">Local :</span> {suggestion.locationName}</p>
                      <p><span className="font-medium">Pilier :</span> {suggestion.pillarName}</p>
                      <p><span className="font-medium">Suggérée le :</span> {new Date(suggestion.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => completeImprovementSuggestion(suggestion.id, suggestion.locationId, suggestion.pillarId)}
                    className="p-3 hover:bg-blue-100 rounded-full transition-all duration-300 transform hover:scale-110 shadow-md"
                    title="Marquer comme implémentée"
                  >
                    <Check size={22} className="text-blue-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {implementedSuggestions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="text-green-500" />
            <h2 className="text-2xl font-bold text-gray-800">Suggestions implémentées</h2>
          </div>
          <div className="space-y-5">
            {implementedSuggestions.map(suggestion => (
              <div
                key={suggestion.id}
                className="border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900 text-lg mb-3">{suggestion.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600">
                      <p><span className="font-medium">Local :</span> {suggestion.locationName}</p>
                      <p><span className="font-medium">Pilier :</span> {suggestion.pillarName}</p>
                      <p><span className="font-medium">Suggérée le :</span> {new Date(suggestion.createdAt).toLocaleDateString('fr-FR')}</p>
                      {suggestion.implementedAt && (
                        <p><span className="font-medium">Implémentée le :</span> {new Date(suggestion.implementedAt).toLocaleDateString('fr-FR')}</p>
                      )}
                    </div>
                  </div>
                  <CheckCircle size={24} className="text-green-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
    </div>
  );
};

export default ImprovementsPage;