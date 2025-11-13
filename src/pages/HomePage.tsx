import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import AuditStatus from '../components/dashboard/AuditStatus';
import AuditSummary from '../components/dashboard/AuditSummary';
import { useAudit } from '../context/AuditContext';

const HomePage: React.FC = () => {
  const { resetAllAudits } = useAudit();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleReset = () => {
    setShowConfirmation(true);
  };

  const confirmReset = () => {
    resetAllAudits();
    setShowConfirmation(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <button
          onClick={handleReset}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          <Trash2 size={18} className="mr-2" />
          Réinitialiser les audits
        </button>
      </div>
      
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Confirmer la réinitialisation</h2>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir réinitialiser tous les audits ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmReset}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        <AuditStatus />
        <AuditSummary />
      </div>
    </div>
  );
};

export default HomePage;