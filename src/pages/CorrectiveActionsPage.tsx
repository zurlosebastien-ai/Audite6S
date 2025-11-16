import React from 'react';
import { useAudit } from '../context/AuditContext';
import { Check, AlertCircle, Clock, AlertTriangle } from 'lucide-react';

const CorrectiveActionsPage: React.FC = () => {
  const { currentMonthAudit, completeCorrectiveAction, isLoading, locations, pillars } = useAudit();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Calculate days since creation and deadline status
  const getDeadlineStatus = (createdAt: string) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = 30 - daysSinceCreation;
    
    if (daysRemaining < 0) {
      return { status: 'overdue', daysRemaining, daysSinceCreation };
    } else if (daysRemaining <= 15) {
      return { status: 'warning', daysRemaining, daysSinceCreation };
    } else {
      return { status: 'normal', daysRemaining, daysSinceCreation };
    }
  };

  // Get all corrective actions from all location audits
  const allActions = currentMonthAudit?.locationAudits?.flatMap(audit => {
    const location = locations.find(loc => loc.id === audit.locationId);
    return audit.evaluations?.flatMap(evaluation => {
      const pillar = pillars.find(p => p.id === evaluation.pillarId);
      return evaluation.correctiveActions?.map(action => ({
        ...action,
        locationName: location?.name || 'Unknown',
        pillarName: pillar?.name || 'Unknown',
        locationId: audit.locationId,
        pillarId: evaluation.pillarId,
        deadlineStatus: action.status === 'pending' ? getDeadlineStatus(action.createdAt) : null
      })) ?? [];
    }) ?? [];
  }) ?? [];

  const pendingActions = allActions.filter(action => action.status === 'pending');
  const completedActions = allActions.filter(action => action.status === 'completed');

  // Sort pending actions by urgency (overdue first, then warning, then normal)
  const sortedPendingActions = pendingActions.sort((a, b) => {
    if (!a.deadlineStatus || !b.deadlineStatus) return 0;
    
    const statusOrder = { 'overdue': 0, 'warning': 1, 'normal': 2 };
    const aOrder = statusOrder[a.deadlineStatus.status];
    const bOrder = statusOrder[b.deadlineStatus.status];
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    
    // If same status, sort by days remaining (most urgent first)
    return a.deadlineStatus.daysRemaining - b.deadlineStatus.daysRemaining;
  });

  const getActionCardStyle = (deadlineStatus: any) => {
    if (!deadlineStatus) return 'border-yellow-200 bg-yellow-50';
    
    switch (deadlineStatus.status) {
      case 'overdue':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  const getDeadlineIcon = (deadlineStatus: any) => {
    if (!deadlineStatus) return <Clock className="text-yellow-500" />;
    
    switch (deadlineStatus.status) {
      case 'overdue':
        return <AlertTriangle className="text-red-500" />;
      case 'warning':
        return <AlertCircle className="text-orange-500" />;
      default:
        return <Clock className="text-yellow-500" />;
    }
  };

  const getDeadlineText = (deadlineStatus: any) => {
    if (!deadlineStatus) return '';
    
    switch (deadlineStatus.status) {
      case 'overdue':
        return `En retard de ${Math.abs(deadlineStatus.daysRemaining)} jour(s)`;
      case 'warning':
        return `${deadlineStatus.daysRemaining} jour(s) restant(s)`;
      default:
        return `${deadlineStatus.daysRemaining} jour(s) restant(s)`;
    }
  };

  const getDeadlineTextColor = (deadlineStatus: any) => {
    if (!deadlineStatus) return 'text-yellow-600';
    
    switch (deadlineStatus.status) {
      case 'overdue':
        return 'text-red-600';
      case 'warning':
        return 'text-orange-600';
      default:
        return 'text-yellow-600';
    }
  };

  if (allActions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 flex items-center">
            <AlertCircle className="mr-3 text-orange-600" size={32} />
            Actions correctives
          </h1>
          <div className="text-center py-12 text-gray-500">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
          Aucune action corrective n'a été enregistrée ce mois-ci.
          </div>
        </div>
      </div>
    );
  }

  // Count actions by status for summary
  const overdueCount = pendingActions.filter(action => action.deadlineStatus?.status === 'overdue').length;
  const warningCount = pendingActions.filter(action => action.deadlineStatus?.status === 'warning').length;
  const normalCount = pendingActions.filter(action => action.deadlineStatus?.status === 'normal').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <AlertCircle className="mr-3 text-orange-600" size={32} />
          Actions correctives
        </h1>
        
        {/* Summary badges */}
        {pendingActions.length > 0 && (
          <div className="flex gap-3">
            {overdueCount > 0 && (
              <span className="px-4 py-2 bg-gradient-to-r from-red-100 to-red-200 text-red-800 text-sm font-semibold rounded-full shadow-sm">
                {overdueCount} en retard
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-4 py-2 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 text-sm font-semibold rounded-full shadow-sm">
                {warningCount} urgent(s)
              </span>
            )}
            {normalCount > 0 && (
              <span className="px-4 py-2 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 text-sm font-semibold rounded-full shadow-sm">
                {normalCount} en cours
              </span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-6">
      {sortedPendingActions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-800">Actions en cours</h2>
          </div>
          <div className="space-y-5">
            {sortedPendingActions.map(action => (
              <div
                key={action.id}
                className={`border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 ${getActionCardStyle(action.deadlineStatus)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-lg mb-3">{action.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                      <p><span className="font-medium">Local :</span> {action.locationName}</p>
                      <p><span className="font-medium">Pilier :</span> {action.pillarName}</p>
                      <p><span className="font-medium">Créée le :</span> {new Date(action.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                      {action.deadlineStatus && (
                        <div className="flex items-center gap-2">
                          {getDeadlineIcon(action.deadlineStatus)}
                          <span className={`font-semibold ${getDeadlineTextColor(action.deadlineStatus)}`}>
                            {getDeadlineText(action.deadlineStatus)}
                          </span>
                        </div>
                      )}
                  </div>
                  <button
                    onClick={() => completeCorrectiveAction(action.id, action.locationId, action.pillarId)}
                    className="p-3 hover:bg-white hover:bg-opacity-50 rounded-full transition-all duration-300 transform hover:scale-110 shadow-md"
                    title="Marquer comme terminée"
                  >
                    <Check size={22} className="text-green-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completedActions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <Check className="text-green-500" />
            <h2 className="text-2xl font-bold text-gray-800">Actions effectuées</h2>
          </div>
          <div className="space-y-5">
            {completedActions.map(action => (
              <div
                key={action.id}
                className="border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900 text-lg mb-3">{action.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600">
                      <p><span className="font-medium">Local :</span> {action.locationName}</p>
                      <p><span className="font-medium">Pilier :</span> {action.pillarName}</p>
                      <p><span className="font-medium">Créée le :</span> {new Date(action.createdAt).toLocaleDateString('fr-FR')}</p>
                      {action.completedAt && (
                        <p><span className="font-medium">Terminée le :</span> {new Date(action.completedAt).toLocaleDateString('fr-FR')}</p>
                      )}
                    </div>
                  </div>
                  <Check size={24} className="text-green-600" />
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

export default CorrectiveActionsPage;