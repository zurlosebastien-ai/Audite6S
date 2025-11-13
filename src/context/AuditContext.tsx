import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuditHistory, LocationAudit, MonthlyAudit, PillarEvaluation, CorrectiveAction } from '../types';
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

const calculateGroupScores = (locationAudits: LocationAudit[]): { groupId: string; score: number }[] => {
  return LOCATION_GROUPS.map(group => {
    const groupLocations = LOCATIONS.filter(loc => loc.groupId === group.id);
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

export const AuditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auditHistory, setAuditHistory] = useState<AuditHistory>(() => {
    const savedHistory = localStorage.getItem('auditHistory');
    return savedHistory ? JSON.parse(savedHistory) : { audits: [] };
  });

  const [currentMonthAudit, setCurrentMonthAudit] = useState<MonthlyAudit>(() => {
    const currentMonth = getCurrentMonth();
    const existingAudit = auditHistory.audits.find(audit => audit.month === currentMonth);
    
    if (existingAudit) {
      return existingAudit;
    }
    
    return createNewMonthlyAudit();
  });

  useEffect(() => {
    localStorage.setItem('auditHistory', JSON.stringify(auditHistory));
  }, [auditHistory]);

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

  const resetAllAudits = () => {
    const newMonthlyAudit = createNewMonthlyAudit();
    setCurrentMonthAudit(newMonthlyAudit);
    setAuditHistory({ audits: [] });
    localStorage.removeItem('auditHistory');
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

    const location = LOCATIONS.find(loc => loc.id === locationId);
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

  const completeLocationAudit = (locationId: string) => {
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
    };

    const updatedLocationAudits = [...currentMonthAudit.locationAudits];
    updatedLocationAudits[locationAuditIndex] = updatedLocationAudit;

    const allLocationsAudited = LOCATIONS.every(location => 
      updatedLocationAudits.some(
        audit => audit.locationId === location.id && audit.completed
      )
    );

    let monthlyOverallScore;
    if (allLocationsAudited) {
      monthlyOverallScore = updatedLocationAudits
        .filter(audit => audit.completed && audit.overallScore !== undefined)
        .reduce((sum, audit) => sum + (audit.overallScore || 0), 0) / LOCATIONS.length;
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
    return LOCATIONS
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

    // Exclude 'people' pillar from score calculation as it's qualitative only
    const scoredEvaluations = locationAudit.evaluations.filter(
      evaluation => evaluation.pillarId !== 'people'
    );

    if (scoredEvaluations.length === 0) return 0;

    const sum = scoredEvaluations.reduce(
      (total, evaluationItem) => total + evaluationItem.score, 0
    );
    
    return sum / scoredEvaluations.length;
  };

  const exportToExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Audit 6S - Historique complet\n\n";
    
    csvContent += "Année,Mois,Groupe,Local,Date d'audit,";
    PILLARS.forEach(pillar => {
      csvContent += `${pillar.name} - Score,${pillar.name} - Commentaires,`;
    });
    csvContent += "Score Global\n";
    
    [...auditHistory.audits, currentMonthAudit].forEach(monthAudit => {
      monthAudit.locationAudits.forEach(audit => {
        if (!audit.completed) return;
        
        const location = LOCATIONS.find(l => l.id === audit.locationId);
        if (!location) return;
        
        const group = LOCATION_GROUPS.find(g => g.id === location.groupId);
        const auditDate = new Date(audit.date).toLocaleDateString('fr-FR');
        const monthName = new Date(parseInt(monthAudit.month.split('-')[0]), 
                                 parseInt(monthAudit.month.split('-')[1]) - 1)
                         .toLocaleDateString('fr-FR', { month: 'long' });
        
        let row = `${audit.year},${monthName},${group?.name || ''},${location.name},${auditDate},`;
        
        PILLARS.forEach(pillar => {
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
        PILLARS.forEach(() => csvContent += ",,");
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