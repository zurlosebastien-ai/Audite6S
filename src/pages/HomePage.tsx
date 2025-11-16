import React, { useState } from 'react';
import { Trash2, BarChart3, CheckSquare, Lightbulb, TrendingUp } from 'lucide-react';
import AuditStatus from '../components/dashboard/AuditStatus';
import { useAudit } from '../context/AuditContext';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { resetAllAudits, currentMonthAudit, locations, isLoading } = useAudit();
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleReset = () => {
    setShowConfirmation(true);
  };

  const confirmReset = () => {
    resetAllAudits();
    setShowConfirmation(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  const completedAudits = currentMonthAudit.locationAudits.filter(audit => audit.completed).length;
  const totalLocations = locations.length;
  const progressPercentage = (completedAudits / totalLocations) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-8 px-6 rounded-b-3xl shadow-xl mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Audit 6S</h1>
            <p className="text-blue-100 text-lg">Excellence opérationnelle & amélioration continue</p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Trash2 size={18} className="mr-2" />
            Réinitialiser
          </button>
        </div>
        
        {/* Progress Overview */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mt-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white/90 font-medium">Progression mensuelle</span>
            <span className="text-white font-bold text-xl">{completedAudits}/{totalLocations}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-700 ease-out shadow-sm" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-white/80 text-sm mt-2">{progressPercentage.toFixed(0)}% des locaux audités</p>
        </div>
      </div>
      
      {/* Quick Actions Cards */}
      <div className="px-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => navigate('/audit')}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <CheckSquare className="text-blue-600" size={24} />
              </div>
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {totalLocations - completedAudits} restants
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Auditer</h3>
            <p className="text-gray-600">Effectuer les audits 6S des locaux</p>
          </div>

          <div 
            onClick={() => navigate('/actions')}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-xl">
                <CheckSquare className="text-orange-600" size={24} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Actions</h3>
            <p className="text-gray-600">Gérer les actions correctives</p>
          </div>

          <div 
            onClick={() => navigate('/improvements')}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-xl">
                <Lightbulb className="text-purple-600" size={24} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Améliorations</h3>
            <p className="text-gray-600">Suggestions d'amélioration continue</p>
          </div>
        </div>
      </div>

      {/* Dashboard Preview */}
      <div className="px-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Vue d'ensemble</h2>
            <button
              onClick={() => navigate('/reports')}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <BarChart3 size={18} className="mr-2" />
              Voir les rapports
            </button>
          </div>
          
          {currentMonthAudit.overallScore && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6">
                  <TrendingUp size={32} className="mx-auto mb-3" />
                  <div className="text-3xl font-bold mb-1">{currentMonthAudit.overallScore.toFixed(1)}</div>
                  <div className="text-blue-100">Score Global</div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6">
                  <CheckSquare size={32} className="mx-auto mb-3" />
                  <div className="text-3xl font-bold mb-1">{completedAudits}</div>
                  <div className="text-green-100">Audits Complétés</div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6">
                  <BarChart3 size={32} className="mx-auto mb-3" />
                  <div className="text-3xl font-bold mb-1">{progressPercentage.toFixed(0)}%</div>
                  <div className="text-purple-100">Progression</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Confirmer la réinitialisation</h2>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir réinitialiser tous les audits ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={confirmReset}
                className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-300 font-medium shadow-lg"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Audit Status */}
      <div className="px-6">
        <AuditStatus />
      </div>
    </div>
  );
};

export default HomePage;