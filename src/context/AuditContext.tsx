import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuditHistory, LocationAudit, MonthlyAudit, PillarEvaluation, CorrectiveAction, ImprovementSuggestion } from '../types';
import { AuditService } from '../services/auditService';

// We'll still import constants as fallback, but load from database
import { LOCATIONS, PILLARS, LOCATION_GROUPS } from '../data/constants';

interface AuditContextType {
  currentMonthAudit: MonthlyAudit;
  auditHistory: AuditHistory;
  startLocationAudit: (locationId: string) => void;
  updateEvaluation: (locationId: string, evaluation: PillarEvaluation) => void;
  completeLocationAudit: (locationId: string) => void;
  getLocationAudit: (locationId: string) => LocationAudit | undefined;
  getPendingLocations: () => string[];
  exportToExcel: () => void;
  calculateOverallScore: (locationId: string) => number;
  resetAllAudits: () => void;
  completeCorrectiveAction: (actionId: string, locationId: string, pillarId: string) => void;
  completeImprovementSuggestion: (suggestionId: string, locationId: string, pillarId: string) => void;
  isLoading: boolean;
  locations: typeof LOCATIONS;
  pillars: typeof PILLARS;
  locationGroups: typeof LOCATION_GROUPS;
}

const AuditContext = createContext<AuditContextType | undefined>(undefined);

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

const createNewMonthlyAudit = (): MonthlyAudit => {
  const currentYear = getCurrentYear();
  return {
    month: getCurrentMonth(),
    locationAudits: [],
    completed: false,
    year: currentYear,
    groupScores: []
  };
};

export const AuditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [locations, setLocations] = useState(LOCATIONS);
  const [pillars, setPillars] = useState(PILLARS);
  const [locationGroups, setLocationGroups] = useState(LOCATION_GROUPS);
  
  const [auditHistory, setAuditHistory] = useState<AuditHistory>(() => {
    return { audits: [] };
  });

  const [currentMonthAudit, setCurrentMonthAudit] = useState<MonthlyAudit>(() => {
    return createNewMonthlyAudit();
  });

  // Initialize data from Supabase on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        
        // Always try to use Supabase first
        const { isSupabaseConfigured, supabase } = await import('../lib/supabase');
        
        if (isSupabaseConfigured) {
          console.log('Supabase configuré, chargement des données depuis la base...');
          
          try {
            // Initialize database with default data if needed
            await AuditService.initializeDatabase();
            
            // Load configuration data
            const config = await AuditService.loadConfiguration();
            
            // Transform database data to match our types
            if (config.groups.length > 0) {
              setLocationGroups(config.groups.map(g => ({ id: g.id, name: g.name })));
            }
            
            if (config.locations.length > 0) {
              setLocations(config.locations.map(l => ({ 
                id: l.id, 
                name: l.name, 
                groupId: l.group_id 
              })));
            }
            
            if (config.pillars.length > 0 && config.questions.length > 0) {
              const pillarsWithQuestions = config.pillars.map(pillar => {
                const pillarQuestions = config.questions
                  .filter(q => q.pillar_id === pillar.id)
                  .map(q => ({ id: q.id, text: q.text }));
                
                return {
                  id: pillar.id as any,
                  name: pillar.name,
                  description: pillar.description,
                  questions: pillarQuestions
                };
              });
              setPillars(pillarsWithQuestions);
            }
            
            // Load audit history from database
            const audits = await AuditService.getAllAudits();
            setAuditHistory({ audits });
            
            // Set current month audit
            const currentMonth = getCurrentMonth();
            const existingAudit = audits.find(audit => audit.month === currentMonth);
            
            if (existingAudit) {
              setCurrentMonthAudit(existingAudit);
            } else {
              setCurrentMonthAudit(createNewMonthlyAudit());
            }
            
            console.log('Données chargées depuis Supabase avec succès');
            return; // Exit early if Supabase works
          } catch (supabaseError) {
            console.error('Erreur lors du chargement depuis Supabase:', supabaseError);
            console.log('Basculement vers le stockage local...');
          }
        } else {
          console.log('Supabase non configuré, utilisation du stockage local');
        }
        
        // Fallback to localStorage (when Supabase is not configured or fails)
        const savedHistory = localStorage.getItem('auditHistory');
        const savedCurrentAudit = localStorage.getItem('currentMonthAudit');
        
        if (savedHistory) {
          try {
            const parsedHistory = JSON.parse(savedHistory);
            setAuditHistory(parsedHistory);
          } catch (e) {
            console.warn('Échec du parsing de l\'historique sauvegardé');
          }
        }
        
        if (savedCurrentAudit) {
          try {
            const parsedCurrentAudit = JSON.parse(savedCurrentAudit);
            setCurrentMonthAudit(parsedCurrentAudit);
          } catch (e) {
            console.warn('Échec du parsing de l\'audit courant sauvegardé');
          }
        }
        
      } catch (error) {
        console.error('Erreur lors de l\'initialisation des données:', error);
        // Use localStorage as final fallback
        const savedHistory = localStorage.getItem('auditHistory');
        const savedCurrentAudit = localStorage.getItem('currentMonthAudit');
        
        if (savedHistory) {
          try {
            const parsedHistory = JSON.parse(savedHistory);
            setAuditHistory(parsedHistory);
          } catch (e) {
            console.warn('Échec du parsing de l\'historique sauvegardé');
          }
        }
        
        if (savedCurrentAudit) {
          try {
            const parsedCurrentAudit = JSON.parse(savedCurrentAudit);
            setCurrentMonthAudit(parsedCurrentAudit);
          } catch (e) {
            console.warn('Échec du parsing de l\'audit courant sauvegardé');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeData();
  }, []);

  // Save to database whenever audit data changes
  useEffect(() => {
    if (!isLoading) {
      // Always save to localStorage as backup
      localStorage.setItem('currentMonthAudit', JSON.stringify(currentMonthAudit));
      
      // Always try to save to Supabase if configured and has data
      const saveToSupabase = async () => {
        try {
          const { isSupabaseConfigured } = await import('../lib/supabase');
          if (isSupabaseConfigured && currentMonthAudit.locationAudits.length > 0) {
            await AuditService.saveMonthlyAudit(currentMonthAudit);
            console.log('Audit sauvegardé dans Supabase avec succès');
          }
        } catch (error) {
          console.error('Erreur lors de la sauvegarde dans Supabase:', error);
          console.log('Données sauvegardées localement uniquement');
        }
      };
      
      // Don't block the UI, save in background
      if (currentMonthAudit.locationAudits.length > 0) {
        saveToSupabase();
      }
    }
  }, [currentMonthAudit, isLoading]);

  // Save audit history to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('auditHistory', JSON.stringify(auditHistory));
    }
  }, [auditHistory, isLoading]);

  useEffect(() => {
    const currentMonth = getCurrentMonth();
    
    if (currentMonthAudit.month !== currentMonth) {
      const newMonthlyAudit = createNewMonthlyAudit();
      setCurrentMonthAudit(newMonthlyAudit);
      
      setAuditHistory(prevHistory => {
        return {
          audits: [...prevHistory.audits, newMonthlyAudit],
        };
      });
    }
  }, [currentMonthAudit.month]);

  const calculateGroupScores = (locationAudits: LocationAudit[]): { groupId: string; score: number }[] => {
    return locationGroups.map(group => {
      const groupLocations = locations.filter(loc => loc.groupId === group.id);
      const completedGroupAudits = locationAudits.filter(audit => 
        audit.completed && groupLocations.some(loc => loc.id === audit.locationId)
      );
      
      if (completedGroupAudits.length === 0) {
        return { groupId: group.id, score: 0 };
      }
      
      const totalScore = completedGroupAudits.reduce((sum, audit) => sum + (audit.overallScore || 0), 0);
      return { groupId: group.id, score: totalScore / completedGroupAudits.length };
    });
  };

  const resetAllAudits = () => {
    const performReset = async () => {
      try {
        console.log('Réinitialisation de tous les audits...');
        
        // Clear localStorage first
        localStorage.removeItem('auditHistory');
        localStorage.removeItem('currentMonthAudit');
        console.log('localStorage nettoyé');
        
        // Clear Supabase data if configured
        try {
          const { isSupabaseConfigured, supabase } = await import('../lib/supabase');
          if (isSupabaseConfigured && supabase) {
            console.log('Nettoyage des données Supabase...');
            
            // Delete in correct order to respect foreign key constraints
            await supabase.from('corrective_actions').delete().neq('id', '');
            await supabase.from('pillar_evaluations').delete().neq('id', '');
            await supabase.from('location_audits').delete().neq('id', '');
            await supabase.from('group_scores').delete().neq('id', '');
            await supabase.from('monthly_audits').delete().neq('id', '');
            
            console.log('Données Supabase supprimées avec succès');
          } else {
            console.log('Supabase non configuré, nettoyage local uniquement');
          }
        } catch (supabaseError) {
          console.error('Erreur lors de la suppression des données Supabase:', supabaseError);
          console.log('Poursuite avec le nettoyage local');
        }
        
        // Reset state immediately
        const newMonthlyAudit = createNewMonthlyAudit();
        setCurrentMonthAudit(newMonthlyAudit);
        setAuditHistory({ audits: [] });
        
        console.log('État réinitialisé avec succès');
        
        // Force reload to ensure clean state
        setTimeout(() => {
          window.location.reload();
        }, 100);
        
      } catch (error) {
        console.error('Erreur lors de la réinitialisation:', error);
        
        // Emergency fallback - force reset state and reload
        try {
          localStorage.clear();
          const newMonthlyAudit = createNewMonthlyAudit();
          setCurrentMonthAudit(newMonthlyAudit);
          setAuditHistory({ audits: [] });
        } catch (stateError) {
          console.error('Erreur lors du reset d\'urgence:', stateError);
        }
        
        // Always reload in case of error
        window.location.reload();
      }
    };
    
    // Execute the reset
    performReset();
  };

  const startLocationAudit = (locationId: string) => {
    const existingAudit = currentMonthAudit.locationAudits.find(
      audit => audit.locationId === locationId
    );

    if (existingAudit && !existingAudit.completed) {
      return;
    }

    if (existingAudit && existingAudit.completed) {
      return;
    }

    const location = locations.find(loc => loc.id === locationId);
    const newLocationAudit: LocationAudit = {
      locationId,
      date: new Date().toISOString(),
      evaluations: [],
      completed: false,
      year: getCurrentYear(),
      groupId: location?.groupId
    };

    const updatedLocationAudits = [...currentMonthAudit.locationAudits, newLocationAudit];
    
    const updatedMonthlyAudit = {
      ...currentMonthAudit,
      locationAudits: updatedLocationAudits,
      groupScores: calculateGroupScores(updatedLocationAudits)
    };

    setCurrentMonthAudit(updatedMonthlyAudit);
    
    setAuditHistory(prevHistory => {
      const updatedAudits = prevHistory.audits.map(audit => 
        audit.month === currentMonthAudit.month ? updatedMonthlyAudit : audit
      );
      
      return {
        audits: updatedAudits,
      };
    });
  };

  const updateEvaluation = (locationId: string, evaluation: PillarEvaluation) => {
    const locationAuditIndex = currentMonthAudit.locationAudits.findIndex(
      audit => audit.locationId === locationId
    );

    if (locationAuditIndex === -1) return;

    const locationAudit = currentMonthAudit.locationAudits[locationAuditIndex];
    
    const evalIndex = locationAudit.evaluations.findIndex(
      evaluationItem => evaluationItem.pillarId === evaluation.pillarId
    );

    let updatedEvaluations;
    
    if (evalIndex !== -1) {
      updatedEvaluations = [...locationAudit.evaluations];
      updatedEvaluations[evalIndex] = evaluation;
    } else {
      updatedEvaluations = [...locationAudit.evaluations, evaluation];
    }

    const updatedLocationAudit = {
      ...locationAudit,
      evaluations: updatedEvaluations,
    };

    const updatedLocationAudits = [...currentMonthAudit.locationAudits];
    updatedLocationAudits[locationAuditIndex] = updatedLocationAudit;

    const updatedMonthlyAudit = {
      ...currentMonthAudit,
      locationAudits: updatedLocationAudits,
      groupScores: calculateGroupScores(updatedLocationAudits)
    };

    setCurrentMonthAudit(updatedMonthlyAudit);
    
    setAuditHistory(prevHistory => {
      const updatedAudits = prevHistory.audits.map(audit => 
        audit.month === currentMonthAudit.month ? updatedMonthlyAudit : audit
      );
      
      return {
        audits: updatedAudits,
      };
    });
  };

  const completeLocationAudit = (locationId: string, auditorVisa?: string) => {
    const locationAuditIndex = currentMonthAudit.locationAudits.findIndex(
      audit => audit.locationId === locationId
    );

    if (locationAuditIndex === -1) return;

    const locationAudit = currentMonthAudit.locationAudits[locationAuditIndex];
    
    const overallScore = calculateOverallScore(locationId);

    const updatedLocationAudit = {
      ...locationAudit,
      completed: true,
      overallScore,
      auditorVisa: auditorVisa || locationAudit.auditorVisa,
    };

    const updatedLocationAudits = [...currentMonthAudit.locationAudits];
    updatedLocationAudits[locationAuditIndex] = updatedLocationAudit;

    const allLocationsAudited = locations.every(location => 
      updatedLocationAudits.some(
        audit => audit.locationId === location.id && audit.completed
      )
    );

    let monthlyOverallScore;
    if (allLocationsAudited) {
      monthlyOverallScore = updatedLocationAudits
        .filter(audit => audit.completed && audit.overallScore !== undefined)
        .reduce((sum, audit) => sum + (audit.overallScore || 0), 0) / locations.length;
    }

    const updatedMonthlyAudit = {
      ...currentMonthAudit,
      locationAudits: updatedLocationAudits,
      completed: allLocationsAudited,
      overallScore: monthlyOverallScore,
      groupScores: calculateGroupScores(updatedLocationAudits)
    };

    setCurrentMonthAudit(updatedMonthlyAudit);
    
    setAuditHistory(prevHistory => {
      const updatedAudits = prevHistory.audits.map(audit => 
        audit.month === currentMonthAudit.month ? updatedMonthlyAudit : audit
      );
      
      if (!prevHistory.audits.some(audit => audit.month === currentMonthAudit.month)) {
        updatedAudits.push(updatedMonthlyAudit);
      }
      
      return {
        audits: updatedAudits,
      };
    });
  };

  const getLocationAudit = (locationId: string): LocationAudit | undefined => {
    return currentMonthAudit.locationAudits.find(
      audit => audit.locationId === locationId
    );
  };

  const getPendingLocations = (): string[] => {
    return locations
      .filter(location => 
        !currentMonthAudit.locationAudits.some(
          audit => audit.locationId === location.id && audit.completed
        )
      )
      .map(location => location.id);
  };

  const calculateOverallScore = (locationId: string): number => {
    const locationAudit = currentMonthAudit.locationAudits.find(
      audit => audit.locationId === locationId
    );

    if (!locationAudit || locationAudit.evaluations.length === 0) return 0;

    if (locationAudit.evaluations.length === 0) return 0;

    const sum = locationAudit.evaluations.reduce(
      (total, evaluationItem) => total + evaluationItem.score, 0
    );
    
    return sum / locationAudit.evaluations.length;
  };

  const exportToExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Audit 6S - Historique complet\n\n";
    
    csvContent += "Année,Mois,Groupe,Local,Date d'audit,";
    pillars.forEach(pillar => {
      csvContent += `${pillar.name} - Score,${pillar.name} - Commentaires,`;
    });
    csvContent += "Score Global\n";
    
    [...auditHistory.audits, currentMonthAudit].forEach(monthAudit => {
      monthAudit.locationAudits.forEach(audit => {
        if (!audit.completed) return;
        
        const location = locations.find(l => l.id === audit.locationId);
        if (!location) return;
        
        const group = locationGroups.find(g => g.id === location.groupId);
        const auditDate = new Date(audit.date).toLocaleDateString('fr-FR');
        const monthName = new Date(parseInt(monthAudit.month.split('-')[0]), 
                                 parseInt(monthAudit.month.split('-')[1]) - 1)
                         .toLocaleDateString('fr-FR', { month: 'long' });
        
        let row = `${audit.year},${monthName},${group?.name || ''},${location.name},${auditDate},`;
        
        pillars.forEach(pillar => {
          const evaluation = audit.evaluations.find(e => e.pillarId === pillar.id);
          row += evaluation 
            ? `${evaluation.score},"${evaluation.comment.replace(/"/g, '""')}"` 
            : ",";
          row += ",";
        });
        
        row += `${audit.overallScore?.toFixed(1) || ''}\n`;
        
        csvContent += row;
      });
      
      if (monthAudit.completed && monthAudit.overallScore !== undefined) {
        const monthName = new Date(parseInt(monthAudit.month.split('-')[0]), 
                                 parseInt(monthAudit.month.split('-')[1]) - 1)
                         .toLocaleDateString('fr-FR', { month: 'long' });
        
        csvContent += `${monthAudit.year},${monthName},GLOBAL,SCORE MENSUEL GLOBAL,,`;
        pillars.forEach(() => csvContent += ",,");
        csvContent += `${monthAudit.overallScore.toFixed(1)}\n`;
      }
      
      csvContent += "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Historique_Audit_6S_${getCurrentYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const completeCorrectiveAction = (actionId: string, locationId: string, pillarId: string) => {
    const updatedLocationAudits = currentMonthAudit.locationAudits.map(audit => {
      if (audit.locationId === locationId) {
        return {
          ...audit,
          evaluations: audit.evaluations.map(evaluation => {
            if (evaluation.pillarId === pillarId) {
              return {
                ...evaluation,
                correctiveActions: evaluation.correctiveActions.map(action =>
                  action.id === actionId
                    ? { ...action, status: 'completed', completedAt: new Date().toISOString() }
                    : action
                )
              };
            }
            return evaluation;
          })
        };
      }
      return audit;
    });

    const updatedMonthlyAudit = {
      ...currentMonthAudit,
      locationAudits: updatedLocationAudits,
      groupScores: calculateGroupScores(updatedLocationAudits)
    };

    setCurrentMonthAudit(updatedMonthlyAudit);
    
    setAuditHistory(prevHistory => {
      const updatedAudits = prevHistory.audits.map(audit => 
        audit.month === currentMonthAudit.month ? updatedMonthlyAudit : audit
      );
      
      return {
        audits: updatedAudits,
      };
    });
  };

  const completeImprovementSuggestion = (suggestionId: string, locationId: string, pillarId: string) => {
    const updatedLocationAudits = currentMonthAudit.locationAudits.map(audit => {
      if (audit.locationId === locationId) {
        return {
          ...audit,
          evaluations: audit.evaluations.map(evaluation => {
            if (evaluation.pillarId === pillarId) {
              return {
                ...evaluation,
                improvementSuggestions: evaluation.improvementSuggestions?.map(suggestion =>
                  suggestion.id === suggestionId
                    ? { ...suggestion, status: 'implemented', implementedAt: new Date().toISOString() }
                    : suggestion
                ) || []
              };
            }
            return evaluation;
          })
        };
      }
      return audit;
    });

    const updatedMonthlyAudit = {
      ...currentMonthAudit,
      locationAudits: updatedLocationAudits,
      groupScores: calculateGroupScores(updatedLocationAudits)
    };

    setCurrentMonthAudit(updatedMonthlyAudit);
    
    setAuditHistory(prevHistory => {
      const updatedAudits = prevHistory.audits.map(audit => 
        audit.month === currentMonthAudit.month ? updatedMonthlyAudit : audit
      );
      
      return {
        audits: updatedAudits,
      };
    });
  };

  return (
    <AuditContext.Provider
      value={{
        currentMonthAudit,
        auditHistory,
        startLocationAudit,
        updateEvaluation,
        completeLocationAudit,
        getLocationAudit,
        getPendingLocations,
        exportToExcel,
        calculateOverallScore,
        resetAllAudits,
        completeCorrectiveAction,
        completeImprovementSuggestion,
        isLoading,
        locations,
        pillars,
        locationGroups,
      }}
    >
      {children}
    </AuditContext.Provider>
  );
};

export const useAudit = (): AuditContextType => {
  const context = useContext(AuditContext);
  if (context === undefined) {
    throw new Error('useAudit must be used within an AuditProvider');
  }
  return context;
};