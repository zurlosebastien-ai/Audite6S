import { Location, LocationGroup, Pillar } from '../types';

export const LOCATION_GROUPS: LocationGroup[] = [
  { id: 'bulk', name: 'Bulk' },
  { id: 'laverie', name: 'Laverie' }
];

export const LOCATIONS: Location[] = [
  // Bulk Group
  { id: '134-138', name: 'Locaux 134-138', groupId: 'bulk' },
  { id: '136', name: 'Local 136', groupId: 'bulk' },
  { id: '139', name: 'Local 139', groupId: 'bulk' },
  { id: '140', name: 'Local 140', groupId: 'bulk' },
  
  // Laverie Group
  { id: 'laverie-b1', name: 'Laverie B1', groupId: 'laverie' },
  { id: 'laverie-b2', name: 'Laverie B2', groupId: 'laverie' }
];

export const PILLARS: Pillar[] = [
  {
    id: 'seiri',
    name: 'Seiri (Trier)',
    description: 'Séparer l\'inutile de l\'utile et éliminer le superflu',
    questions: [
      { id: 'seiri_1', text: 'Les zones de travail sont-elles exemptes d\'objets non nécessaires ?' },
      { id: 'seiri_2', text: 'Les postes de travail sont-ils encombrés d\'outils, de pièces ou de matériaux superflus ?' },
      { id: 'seiri_3', text: 'Y a-t-il des équipements ou des outils dans votre zone de travail qui ne sont plus utilisés ou nécessaires pour les tâches actuelles?' },
      { id: 'seiri_4', text: 'Existe-t-il des stocks de matériaux ou de produits finis qui sont périmés, obsolètes ou en excès ?' },
      { id: 'seiri_5', text: 'Les zones de stockage sont-elles encombrées d\'articles non essentiels ou de déchets ?' }
    ]
  },
  {
    id: 'seiton',
    name: 'Seiton (Ranger)',
    description: 'Organiser les outils et les matériaux pour faciliter leur utilisation',
    questions: [
      { id: 'seiton_1', text: 'Les zones de stockage sont-elles clairement identifiées et étiquetées?' },
      { id: 'seiton_2', text: 'Les outils et équipements ont-ils des emplacements désignés clairement marqués?' },
      { id: 'seiton_3', text: 'Les circuits de déplacement ou les flux de travail sont-ils optimisés pour réduire les mouvements inutiles ?' }
    ]
  },
  {
    id: 'seiso',
    name: 'Seiso (Nettoyer)',
    description: 'Maintenir la propreté de l\'environnement de travail',
    questions: [
      { id: 'seiso_1', text: 'Les équipements sont-ils régulièrement nettoyés ?' },
      { id: 'seiso_2', text: 'Le nettoyage est-il effectué avant et après chaque production ?' },
      { id: 'seiso_3', text: 'Les zones de production et de stockage sont-elles systématiquement nettoyées ?' },
      { id: 'seiso_4', text: 'Les déchets et résidus sont-ils correctement éliminés ?' },
      { id: 'seiso_5', text: 'Les surfaces de travail sont-elles nettoyées après chaque utilisation ?' },
      { id: 'seiso_6', text: 'Le nettoyage est-il correctement documenté pour garantir la traçabilité ?' }
    ]
  },
  {
    id: 'seiketsu',
    name: 'Seiketsu (Standardiser)',
    description: 'Définir des normes et des procédures de travail',
    questions: [
      { id: 'seiketsu_1', text: 'Les différentes zones sont marquées où identifier ? (Une place pour chaque chose et chaque chose a sa place)' },
      { id: 'seiketsu_2', text: 'Le système de Kanban est respecté ?' },
      { id: 'seiketsu_3', text: 'Le FiFo est-t \'il respecté ?' }
    ]
  },
  {
    id: 'shitsuke',
    name: 'Shitsuke (Respecter)',
    description: 'Maintenir et respecter les normes établies',
    questions: [
      { id: 'shitsuke_1', text: 'Les suggestions d\'améliorations de cette zone sont discutées et implémentées ?' },
      { id: 'shitsuke_2', text: 'Les actions en cours sont-ils terminées ?' }
    ]
  },
  {
    id: 'safety',
    name: 'Safety (Sécurité)',
    description: 'Assurer un environnement de travail sécuritaire',
    questions: [
      { id: 'safety_1', text: 'Les EPI utilisé lors des activités sont-ils adaptés?' },
      { id: 'safety_2', text: 'Les stocks et péremptions des EPI sont-ils a jours ?' },
      { id: 'safety_3', text: 'Est-ce-que le port des charges sont-il adaptés à votre environnement de travail ?' },
      { id: 'safety_4', text: 'Les dangers mécaniques sont-ils sécurisés?' }
    ]
  },
  {
    id: 'quality',
    name: 'Quality (Qualité)',
    description: 'Assurer la qualité des processus et des produits',
    questions: [
      { id: 'quality_1', text: 'Aucun consommable périmée ? (ETH 70%, solutions, matériels stériles ….)' },
      { id: 'quality_2', text: 'Les logbook papiers sont-ils documentés et revues dans les temps ?' },
      { id: 'quality_3', text: 'Pas de documents pirates présents dans les locaux ?' }
    ]
  }
];