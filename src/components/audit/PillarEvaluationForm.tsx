import React, { useState, useEffect } from 'react';
import { Pillar, PillarEvaluation, CorrectiveAction, ImprovementSuggestion } from '../../types';
import { Star, CheckCircle, XCircle, Plus, Check, Lightbulb } from 'lucide-react';

interface PillarEvaluationFormProps {
  pillar: Pillar;
  initialEvaluation?: PillarEvaluation;
  onSave: (evaluation: PillarEvaluation) => void;
}

const PillarEvaluationForm: React.FC<PillarEvaluationFormProps> = ({
  pillar,
  initialEvaluation,
  onSave,
}) => {
  const [score, setScore] = useState<number>(0);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, boolean>>(
    initialEvaluation?.questionAnswers || {}
  );
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveAction[]>(
    initialEvaluation?.correctiveActions || []
  );
  const [improvementSuggestions, setImprovementSuggestions] = useState<ImprovementSuggestion[]>(
    initialEvaluation?.improvementSuggestions || []
  );
  const [newActionTitle, setNewActionTitle] = useState<string>('');
  const [newActionComment, setNewActionComment] = useState<string>('');
  const [newSuggestion, setNewSuggestion] = useState<string>('');

  useEffect(() => {
    setScore(0);
    setQuestionAnswers(initialEvaluation?.questionAnswers || {});
    setCorrectiveActions(initialEvaluation?.correctiveActions || []);
    setImprovementSuggestions(initialEvaluation?.improvementSuggestions || []);
  }, [pillar.id]);

  const calculateScore = (answers: Record<string, boolean>): number => {
    const totalQuestions = pillar.questions.length;
    if (totalQuestions === 0) return 0;

    const positiveAnswers = Object.values(answers).filter(value => value === true).length;
    return Number(((positiveAnswers / totalQuestions) * 10).toFixed(1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalScore = calculateScore(questionAnswers);

    onSave({
      pillarId: pillar.id,
      score: finalScore,
      questionAnswers,
      correctiveActions,
      improvementSuggestions
    });
  };

  const handleQuestionAnswer = (questionId: string, value: boolean) => {
    const newAnswers = {
      ...questionAnswers,
      [questionId]: value
    };
    setQuestionAnswers(newAnswers);
    setScore(calculateScore(newAnswers));
  };

  const handleAddAction = () => {
    if (!newActionTitle.trim() || !newActionComment.trim()) return;

    const action: CorrectiveAction = {
      id: crypto.randomUUID(),
      title: newActionTitle.trim(),
      description: newActionComment.trim(),
      locationId: '', // Will be set by the parent component
      pillarId: pillar.id,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    setCorrectiveActions([...correctiveActions, action]);
    setNewActionTitle('');
    setNewActionComment('');
  };

  const handleAddSuggestion = () => {
    if (!newSuggestion.trim()) return;

    const suggestion: ImprovementSuggestion = {
      id: crypto.randomUUID(),
      description: newSuggestion.trim(),
      locationId: '', // Will be set by the parent component
      pillarId: pillar.id,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    setImprovementSuggestions([...improvementSuggestions, suggestion]);
    setNewSuggestion('');
  };

  const handleCompleteAction = (actionId: string) => {
    setCorrectiveActions(actions =>
      actions.map(action =>
        action.id === actionId
          ? { ...action, status: 'completed', completedAt: new Date().toISOString() }
          : action
      )
    );
  };

  const handleImplementSuggestion = (suggestionId: string) => {
    setImprovementSuggestions(suggestions =>
      suggestions.map(suggestion =>
        suggestion.id === suggestionId
          ? { ...suggestion, status: 'implemented', implementedAt: new Date().toISOString() }
          : suggestion
      )
    );
  };

  const allQuestionsPositive = Object.values(questionAnswers).length === pillar.questions.length &&
    Object.values(questionAnswers).every(answer => answer === true);

  const hasNonCompliantAnswers = Object.values(questionAnswers).some(answer => answer === false);

  const completionPercentage = (score / 10) * 100;

  const pendingActions = correctiveActions.filter(action => action.status === 'pending');
  const completedActions = correctiveActions.filter(action => action.status === 'completed');

  const pendingSuggestions = improvementSuggestions.filter(suggestion => suggestion.status === 'pending');
  const implementedSuggestions = improvementSuggestions.filter(suggestion => suggestion.status === 'implemented');

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-2">{pillar.name}</h2>
      <p className="text-gray-600 mb-6">{pillar.description}</p>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <h3 className="font-medium text-gray-700 mb-4">Questions d'évaluation :</h3>
          <div className="space-y-4">
            {pillar.questions.map(question => (
              <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-grow">
                    <p className="text-gray-700">{question.text}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuestionAnswer(question.id, true)}
                      className={`p-2 rounded-full transition-colors ${
                        questionAnswers[question.id] === true
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400 hover:bg-green-50'
                      }`}
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuestionAnswer(question.id, false)}
                      className={`p-2 rounded-full transition-colors ${
                        questionAnswers[question.id] === false
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-100 text-gray-400 hover:bg-red-50'
                      }`}
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700">Score basé sur les réponses positives :</span>
            <span className="font-bold text-lg">{score.toFixed(1)}/10</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-4">Actions correctives :</h3>

              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  value={newActionTitle}
                  onChange={(e) => setNewActionTitle(e.target.value)}
                  placeholder="Titre de l'action..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  value={newActionComment}
                  onChange={(e) => setNewActionComment(e.target.value)}
                  placeholder="Description détaillée..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddAction}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Plus size={18} className="mr-1" />
                  Ajouter l'action
                </button>
              </div>

              {pendingActions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Actions en cours :</h4>
                  <div className="space-y-2">
                    {pendingActions.map(action => (
                      <div key={action.id} className="p-3 bg-yellow-50 rounded-md">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-grow">
                            <p className="font-medium text-gray-800">{action.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCompleteAction(action.id)}
                            className="p-1 hover:bg-yellow-100 rounded-full transition-colors ml-2"
                          >
                            <Check size={18} className="text-yellow-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {completedActions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Actions effectuées :</h4>
                  <div className="space-y-2">
                    {completedActions.map(action => (
                      <div key={action.id} className="p-3 bg-green-50 rounded-md">
                        <div className="flex items-start gap-3">
                          <Check size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-grow">
                            <p className="font-medium text-gray-800">{action.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

        {!hasNonCompliantAnswers && (
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Enregistrer
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default PillarEvaluationForm;