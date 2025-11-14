import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { MonthlyAudit, LocationAudit, PillarEvaluation, CorrectiveAction, GroupScore } from '../types'

export class AuditService {
  // Get all monthly audits with their related data
  static async getAllAudits(): Promise<MonthlyAudit[]> {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase not configured, returning empty audits')
      return []
    }

    try {
      // Get monthly audits
      const { data: monthlyAudits, error: monthlyError } = await supabase
        .from('monthly_audits')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false })

      if (monthlyError) throw monthlyError

      if (!monthlyAudits || monthlyAudits.length === 0) {
        return []
      }

      // Get all related data for each monthly audit
      const auditsWithData = await Promise.all(
        monthlyAudits.map(async (monthlyAudit) => {
          // Get location audits
          const { data: locationAudits, error: locationError } = await supabase
            .from('location_audits')
            .select('*')
            .eq('monthly_audit_id', monthlyAudit.id)

          if (locationError) throw locationError

          // Get group scores
          const { data: groupScores, error: groupError } = await supabase
            .from('group_scores')
            .select('*')
            .eq('monthly_audit_id', monthlyAudit.id)

          if (groupError) throw groupError

          // Get evaluations and corrective actions for each location audit
          const locationAuditsWithEvaluations = await Promise.all(
            (locationAudits || []).map(async (locationAudit) => {
              // Get pillar evaluations
              const { data: evaluations, error: evalError } = await supabase
                .from('pillar_evaluations')
                .select('*')
                .eq('location_audit_id', locationAudit.id)

              if (evalError) throw evalError

              // Get corrective actions for each evaluation
              const evaluationsWithActions = await Promise.all(
                (evaluations || []).map(async (evaluation) => {
                  const { data: actions, error: actionsError } = await supabase
                    .from('corrective_actions')
                    .select('*')
                    .eq('pillar_evaluation_id', evaluation.id)

                  if (actionsError) throw actionsError

                  const correctiveActions: CorrectiveAction[] = (actions || []).map(action => ({
                    id: action.id,
                    description: action.description,
                    locationId: locationAudit.location_id,
                    pillarId: evaluation.pillar_id,
                    createdAt: action.created_at || new Date().toISOString(),
                    completedAt: action.completed_at || undefined,
                    status: (action.status as 'pending' | 'completed') || 'pending'
                  }))

                  const pillarEvaluation: PillarEvaluation = {
                    pillarId: evaluation.pillar_id as any,
                    score: evaluation.score || 0,
                    comment: evaluation.comment || '',
                    questionAnswers: evaluation.question_answers || {},
                    correctiveActions
                  }

                  return pillarEvaluation
                })
              )

              const locationAuditData: LocationAudit = {
                locationId: locationAudit.location_id,
                date: locationAudit.date,
                evaluations: evaluationsWithActions,
                completed: locationAudit.completed || false,
                overallScore: locationAudit.overall_score || undefined,
                year: monthlyAudit.year,
                groupId: undefined // Will be set from location data
              }

              return locationAuditData
            })
          )

          const groupScoresData: GroupScore[] = (groupScores || []).map(gs => ({
            groupId: gs.group_id,
            score: gs.score || 0
          }))

          const monthlyAuditData: MonthlyAudit = {
            month: monthlyAudit.month,
            locationAudits: locationAuditsWithEvaluations,
            completed: monthlyAudit.completed || false,
            overallScore: monthlyAudit.overall_score || undefined,
            groupScores: groupScoresData,
            year: monthlyAudit.year
          }

          return monthlyAuditData
        })
      )

      return auditsWithData
    } catch (error) {
      console.error('Error fetching audits:', error)
      return []
    }
  }

  // Save a monthly audit to the database
  static async saveMonthlyAudit(audit: MonthlyAudit): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase not configured, skipping save')
      return
    }

    try {
      // First, upsert the monthly audit
      const { data: monthlyAuditData, error: monthlyError } = await supabase
        .from('monthly_audits')
        .upsert({
          month: audit.month,
          year: audit.year,
          completed: audit.completed,
          overall_score: audit.overallScore || null
        }, {
          onConflict: 'month'
        })
        .select()
        .single()

      if (monthlyError) throw monthlyError

      const monthlyAuditId = monthlyAuditData.id

      // Save group scores
      if (audit.groupScores.length > 0) {
        const groupScoresData = audit.groupScores.map(gs => ({
          monthly_audit_id: monthlyAuditId,
          group_id: gs.groupId,
          score: gs.score
        }))

        const { error: groupScoresError } = await supabase
          .from('group_scores')
          .upsert(groupScoresData, {
            onConflict: 'monthly_audit_id,group_id'
          })

        if (groupScoresError) throw groupScoresError
      }

      // Save location audits
      for (const locationAudit of audit.locationAudits) {
        const { data: locationAuditData, error: locationError } = await supabase
          .from('location_audits')
          .upsert({
            monthly_audit_id: monthlyAuditId,
            location_id: locationAudit.locationId,
            date: locationAudit.date,
            completed: locationAudit.completed,
            overall_score: locationAudit.overallScore || null
          }, {
            onConflict: 'monthly_audit_id,location_id'
          })
          .select()
          .single()

        if (locationError) throw locationError

        const locationAuditId = locationAuditData.id

        // Save pillar evaluations
        for (const evaluation of locationAudit.evaluations) {
          const { data: evaluationData, error: evaluationError } = await supabase
            .from('pillar_evaluations')
            .upsert({
              location_audit_id: locationAuditId,
              pillar_id: evaluation.pillarId,
              score: evaluation.score,
              comment: evaluation.comment,
              question_answers: evaluation.questionAnswers || {}
            }, {
              onConflict: 'location_audit_id,pillar_id'
            })
            .select()
            .single()

          if (evaluationError) throw evaluationError

          const evaluationId = evaluationData.id

          // Save corrective actions
          for (const action of evaluation.correctiveActions) {
            const { error: actionError } = await supabase
              .from('corrective_actions')
              .upsert({
                id: action.id,
                pillar_evaluation_id: evaluationId,
                description: action.description,
                status: action.status,
                completed_at: action.completedAt || null
              }, {
                onConflict: 'id'
              })

            if (actionError) throw actionError
          }
        }
      }
    } catch (error) {
      console.error('Error saving audit:', error)
      throw error
    }
  }

  // Initialize database with default data if empty
  static async initializeDatabase(): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase not configured, skipping database initialization')
      return
    }

    try {
      // Check if location groups exist
      const { data: existingGroups } = await supabase
        .from('location_groups')
        .select('id')
        .limit(1)

      if (!existingGroups || existingGroups.length === 0) {
        // Insert default location groups
        const { error: groupsError } = await supabase
          .from('location_groups')
          .insert([
            { id: 'bulk', name: 'Bulk' },
            { id: 'laverie', name: 'Laverie' }
          ])

        if (groupsError) throw groupsError

        // Insert default locations
        const { error: locationsError } = await supabase
          .from('locations')
          .insert([
            { id: '134-138', name: 'Locaux 134-138', group_id: 'bulk' },
            { id: '136', name: 'Local 136', group_id: 'bulk' },
            { id: '139', name: 'Local 139', group_id: 'bulk' },
            { id: '140', name: 'Local 140', group_id: 'bulk' },
            { id: 'laverie-b1', name: 'Laverie B1', group_id: 'laverie' },
            { id: 'laverie-b2', name: 'Laverie B2', group_id: 'laverie' }
          ])

        if (locationsError) throw locationsError

        // Insert default pillars
        const { error: pillarsError } = await supabase
          .from('pillars')
          .insert([
            { id: 'seiri', name: 'Seiri (Trier)', description: 'Séparer l\'inutile de l\'utile et éliminer le superflu' },
            { id: 'seiton', name: 'Seiton (Ranger)', description: 'Organiser les outils et les matériaux pour faciliter leur utilisation' },
            { id: 'seiso', name: 'Seiso (Nettoyer)', description: 'Maintenir la propreté de l\'environnement de travail' },
            { id: 'seiketsu', name: 'Seiketsu (Standardiser)', description: 'Définir des normes et des procédures de travail' },
            { id: 'shitsuke', name: 'Shitsuke (Respecter)', description: 'Maintenir et respecter les normes établies' },
            { id: 'safety', name: 'Safety (Sécurité)', description: 'Assurer un environnement de travail sécuritaire' },
            { id: 'quality', name: 'Quality (Qualité)', description: 'Assurer la qualité des processus et des produits' },
            { id: 'people', name: 'People (Amélioration)', description: 'Favoriser l\'amélioration continue' }
          ])

        if (pillarsError) throw pillarsError

        // Insert default pillar questions
        const questions = [
          // Seiri questions
          { pillar_id: 'seiri', text: 'Les zones de travail sont-elles exemptes d\'objets non nécessaires ?', order_index: 1 },
          { pillar_id: 'seiri', text: 'Les postes de travail sont-ils encombrés d\'outils, de pièces ou de matériaux superflus ?', order_index: 2 },
          { pillar_id: 'seiri', text: 'Y a-t-il des équipements ou des outils dans votre zone de travail qui ne sont plus utilisés ou nécessaires pour les tâches actuelles?', order_index: 3 },
          { pillar_id: 'seiri', text: 'Existe-t-il des stocks de matériaux ou de produits finis qui sont périmés, obsolètes ou en excès ?', order_index: 4 },
          { pillar_id: 'seiri', text: 'Les zones de stockage sont-elles encombrées d\'articles non essentiels ou de déchets ?', order_index: 5 },
          
          // Seiton questions
          { pillar_id: 'seiton', text: 'Les zones de stockage sont-elles clairement identifiées et étiquetées?', order_index: 1 },
          { pillar_id: 'seiton', text: 'Les outils et équipements ont-ils des emplacements désignés clairement marqués?', order_index: 2 },
          { pillar_id: 'seiton', text: 'Les circuits de déplacement ou les flux de travail sont-ils optimisés pour réduire les mouvements inutiles ?', order_index: 3 },
          
          // Seiso questions
          { pillar_id: 'seiso', text: 'Les équipements sont-ils régulièrement nettoyés ?', order_index: 1 },
          { pillar_id: 'seiso', text: 'Le nettoyage est-il effectué avant et après chaque production ?', order_index: 2 },
          { pillar_id: 'seiso', text: 'Les zones de production et de stockage sont-elles systématiquement nettoyées ?', order_index: 3 },
          { pillar_id: 'seiso', text: 'Les déchets et résidus sont-ils correctement éliminés ?', order_index: 4 },
          { pillar_id: 'seiso', text: 'Les surfaces de travail sont-elles nettoyées après chaque utilisation ?', order_index: 5 },
          { pillar_id: 'seiso', text: 'Le nettoyage est-il correctement documenté pour garantir la traçabilité ?', order_index: 6 },
          
          // Seiketsu questions
          { pillar_id: 'seiketsu', text: 'Les différentes zones sont marquées où identifier ? (Une place pour chaque chose et chaque chose a sa place)', order_index: 1 },
          { pillar_id: 'seiketsu', text: 'Le système de Kanban est respecté ?', order_index: 2 },
          { pillar_id: 'seiketsu', text: 'Le FiFo est-t \'il respecté ?', order_index: 3 },
          
          // Shitsuke questions
          { pillar_id: 'shitsuke', text: 'Les suggestions d\'améliorations de cette zone sont discutées et implémentées ?', order_index: 1 },
          { pillar_id: 'shitsuke', text: 'Les actions en cours sont-ils terminées ?', order_index: 2 },
          
          // Safety questions
          { pillar_id: 'safety', text: 'Les EPI utilisé lors des activités sont-ils adaptés?', order_index: 1 },
          { pillar_id: 'safety', text: 'Les stocks et péremptions des EPI sont-ils a jours ?', order_index: 2 },
          { pillar_id: 'safety', text: 'Est-ce-que le port des charges sont-il adaptés à votre environnement de travail ?', order_index: 3 },
          { pillar_id: 'safety', text: 'Les dangers mécaniques sont-ils sécurisés?', order_index: 4 },
          
          // Quality questions
          { pillar_id: 'quality', text: 'Aucun consommable périmée ? (ETH 70%, solutions, matériels stériles ….)', order_index: 1 },
          { pillar_id: 'quality', text: 'Les logbook papiers sont-ils documentés et revues dans les temps ?', order_index: 2 },
          { pillar_id: 'quality', text: 'Pas de documents pirates présents dans les locaux ?', order_index: 3 },
          
          // People questions
          { pillar_id: 'people', text: 'Comment pensez-vous que nous pourrions améliorer nos locaux pour mieux répondre à vos besoins ou attentes ?', order_index: 1 }
        ]

        const questionsWithIds = questions.map((q, index) => ({
          id: `${q.pillar_id}_${q.order_index}`,
          ...q
        }))

        const { error: questionsError } = await supabase
          .from('pillar_questions')
          .insert(questionsWithIds)

        if (questionsError) throw questionsError
      }
    } catch (error) {
      console.error('Error initializing database:', error)
      throw error
    }
  }

  // Load configuration data (groups, locations, pillars, questions)
  static async loadConfiguration() {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase not configured, returning empty configuration')
      return {
        groups: [],
        locations: [],
        pillars: [],
        questions: []
      }
    }

    try {
      // Load location groups
      const { data: groups, error: groupsError } = await supabase
        .from('location_groups')
        .select('*')
        .order('name')

      if (groupsError) throw groupsError

      // Load locations
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('*')
        .order('name')

      if (locationsError) throw locationsError

      // Load pillars
      const { data: pillars, error: pillarsError } = await supabase
        .from('pillars')
        .select('*')

      if (pillarsError) throw pillarsError

      // Load pillar questions
      const { data: questions, error: questionsError } = await supabase
        .from('pillar_questions')
        .select('*')
        .order('order_index')

      if (questionsError) throw questionsError

      return {
        groups: groups || [],
        locations: locations || [],
        pillars: pillars || [],
        questions: questions || []
      }
    } catch (error) {
      console.error('Error loading configuration:', error)
      return {
        groups: [],
        locations: [],
        pillars: [],
        questions: []
      }
    }
  }
}