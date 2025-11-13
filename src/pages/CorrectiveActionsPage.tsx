import React from 'react';
import { useAudit } from '../context/AuditContext';
import { LOCATIONS, PILLARS } from '../data/constants';
import { Check, AlertCircle, Clock, AlertTriangle } from 'lucide-react';

const CorrectiveActionsPage: React.FC = () => {
  const { currentMonthAudit, completeCorrectiveAction } = useAudit();

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
    const location = LOCATIONS.find(loc => loc.id === audit.locationId);
    return audit.evaluations?.flatMap(evaluation => {
      const pillar = PILLARS.find(p => p.id === evaluation.pillarId);
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Actions correctives</h1>
        <div className="text-center py-8 text-gray-500">
          Aucune action corrective n'a été enregistrée ce mois-ci.
        </div>
      </div>
    );
  }

  // Count actions by status for summary
  const overdueCount = pendingActions.filter(action => action.deadlineStatus?.status === 'overdue').length;
  const warningCount = pendingActions.filter(action => action.deadlineStatus?.status === 'warning').length;
  const normalCount = pendingActions.filter(action => action.deadlineStatus?.status === 'normal').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Actions correctives</h1>
        
        {/* Summary badges */}
        {pendingActions.length > 0 && (
          <div className="flex gap-2">
            {overdueCount > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                {overdueCount} en retard
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                {warningCount} urgent(s)
              </span>
            )}
            {normalCount > 0 && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                {normalCount} en cours
              </span>
            )}
          </div>
        )}
      </div>

      {sortedPendingActions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="text-yellow-500" />
            <h2 className="text-xl font-semibold">Actions en cours</h2>
          </div>
          <div className="space-y-4">
            {sortedPendingActions.map(action => (
              <div
                key={action.id}
                className={`border rounded-lg p-4 ${getActionCardStyle(action.deadlineStatus)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{action.description}</p>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Local : {action.locationName}</p>
                      <p>Pilier : {action.pillarName}</p>
                      <p>Créée le : {new Date(action.createdAt).toLocaleDateString('fr-FR')}</p>
                      {action.deadlineStatus && (
                        <div className="flex items-center gap-1 mt-1">
                          {getDeadlineIcon(action.deadlineStatus)}
                          <span className={`font-medium ${getDeadlineTextColor(action.deadlineStatus)}`}>
                            {getDeadlineText(action.deadlineStatus)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => completeCorrectiveAction(action.id, action.locationId, action.pillarId)}
                    className="p-2 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors"
                  >
                    <Check size={20} className="text-green-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completedActions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Check className="text-green-500" />
            <h2 className="text-xl font-semibold">Actions effectuées</h2>
          </div>
          <div className="space-y-4">
            {completedActions.map(action => (
              <div
                key={action.id}
                className="border border-green-200 bg-green-50 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{action.description}</p>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Local : {action.locationName}</p>
                      <p>Pilier : {action.pillarName}</p>
                      <p>Créée le : {new Date(action.createdAt).toLocaleDateString('fr-FR')}</p>
                      {action.completedAt && (
                        <p>Terminée le : {new Date(action.completedAt).toLocaleDateString('fr-FR')}</p>
                      )}
                    </div>
                  </div>
                  <Check size={20} className="text-green-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CorrectiveActionsPage;