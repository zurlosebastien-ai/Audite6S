import React, { useState } from 'react';
import { Trash2, TrendingUp, Target, CheckCircle, AlertTriangle, BarChart3, Users } from 'lucide-react';
import AuditStatus from '../components/dashboard/AuditStatus';
import VisaKPIs from '../components/dashboard/VisaKPIs';
import { useAudit } from '../context/AuditContext';

const HomePage: React.FC = () => {
  const { resetAllAudits, currentMonthAudit, auditHistory, locations, pillars } = useAudit();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleReset = () => {
    setShowConfirmation(true);
  };

  const confirmReset = () => {
    console.log('🚀 Confirmation de réinitialisation');
    resetAllAudits();
    setShowConfirmation(false);
  };

  // Calculate KPIs
  const completedAudits = currentMonthAudit.locationAudits.filter(audit => audit.completed);
  const completionRate = locations.length > 0 ? (completedAudits.length / locations.length) * 100 : 0;
  
  const totalActions = currentMonthAudit.locationAudits.reduce((total, audit) => {
    return total + audit.evaluations.reduce((evalTotal, evaluation) => {
      return evalTotal + (evaluation.correctiveActions?.length || 0);
    }, 0);
  }, 0);

  const completedActions = currentMonthAudit.locationAudits.reduce((total, audit) => {
    return total + audit.evaluations.reduce((evalTotal, evaluation) => {
      return evalTotal + (evaluation.correctiveActions?.filter(action => action.status === 'completed').length || 0);
    }, 0);
  }, 0);

  const actionCompletionRate = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;

  // Calculate average score for completed audits
  const averageScore = completedAudits.length > 0 
    ? completedAudits.reduce((sum, audit) => sum + (audit.overallScore || 0), 0) / completedAudits.length 
    : 0;

  // Get worst performing pillar
  const pillarScores = pillars.map(pillar => {
    const scores = completedAudits.flatMap(audit => {
      const evaluation = audit.evaluations.find(e => e.pillarId === pillar.id);
      return evaluation ? [evaluation.score] : [];
    });
    return {
      name: pillar.name.split(' ')[0],
      average: scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0
    };
  });

  const worstPillar = pillarScores.reduce((worst, current) => 
    current.average < worst.average ? current : worst, 
    { name: '', average: 10 }
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord 6S</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble de vos audits et performances</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Trash2 size={18} className="mr-2" />
            Réinitialiser
          </button>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Score Moyen</p>
              <p className="text-3xl font-bold">{averageScore.toFixed(1)}/10</p>
              <p className="text-blue-100 text-xs mt-1">Ce mois-ci</p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Taux de Completion</p>
              <p className="text-3xl font-bold">{completionRate.toFixed(0)}%</p>
              <p className="text-green-100 text-xs mt-1">{completedAudits.length}/{locations.length} locaux</p>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
              <Target size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Actions Réalisées</p>
              <p className="text-3xl font-bold">{actionCompletionRate.toFixed(0)}%</p>
              <p className="text-purple-100 text-xs mt-1">{completedActions}/{totalActions} actions</p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Pilier à Améliorer</p>
              <p className="text-lg font-bold">{worstPillar.name}</p>
              <p className="text-orange-100 text-xs mt-1">{worstPillar.average.toFixed(1)}/10</p>
            </div>
            <div className="bg-orange-400 bg-opacity-30 rounded-full p-3">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => window.location.href = '/audit'}
            className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 border border-blue-200"
          >
            <div className="bg-blue-500 rounded-full p-2 mr-3">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Nouvel Audit</p>
              <p className="text-sm text-gray-600">Commencer un audit</p>
            </div>
          </button>
          
          <button 
            onClick={() => window.location.href = '/reports'}
            className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200 border border-green-200"
          >
            <div className="bg-green-500 rounded-full p-2 mr-3">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Rapports</p>
              <p className="text-sm text-gray-600">Voir les analyses</p>
            </div>
          </button>
          
          <button 
            onClick={() => window.location.href = '/actions'}
            className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200 border border-purple-200"
          >
            <div className="bg-purple-500 rounded-full p-2 mr-3">
              <Users size={20} className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Actions</p>
              <p className="text-sm text-gray-600">Gérer les actions</p>
            </div>
          </button>
        </div>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Confirmer la réinitialisation</h2>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir réinitialiser tous les audits ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmReset}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Audit Status */}
      <AuditStatus />
      
      {/* Visa KPIs */}
      <VisaKPIs />
    </div>
  );
};

export default HomePage;