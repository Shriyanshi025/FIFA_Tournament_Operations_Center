/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Venue, 
  Match, 
  Gate, 
  CrowdZone, 
  Volunteer, 
  MedicalTeam, 
  SecurityTeam, 
  Resource, 
  AccessibilityResource, 
  Incident, 
  Notification, 
  OperationalRecommendation, 
  Weather, 
  TransportLine,
  MatchStatus,
  Severity,
  IncidentStatus,
  IncidentCategory,
  StaffStatus,
  DecisionState,
  ActionPriority
} from "../../types";

export const SEED_VENUES: Venue[] = [
  {
    id: "V-LUSAIL",
    name: "Lusail Stadium",
    city: "Al Daayen",
    capacity: 88966,
    coordinates: { latitude: 25.4206, longitude: 51.4904 },
    sectors: ["North", "East", "South", "West", "VIP Hub"],
    isActive: true
  },
  {
    id: "V-ALBAYT",
    name: "Al Bayt Stadium",
    city: "Al Khor",
    capacity: 68895,
    coordinates: { latitude: 25.6805, longitude: 51.4956 },
    sectors: ["Main Stand", "Opposite Stand", "North Curve", "South Curve"],
    isActive: false
  }
];

export const SEED_MATCHES: Match[] = [
  {
    id: "M-42",
    homeTeam: "France",
    awayTeam: "Argentina",
    matchNumber: 42,
    kickOffTime: "2026-07-10T19:00:00Z",
    status: MatchStatus.LIVE,
    currentMinute: 72,
    scoreHome: 2,
    scoreAway: 2,
    attendance: 84200,
    stadiumId: "V-LUSAIL",
    isHighRisk: true
  },
  {
    id: "M-43",
    homeTeam: "Brazil",
    awayTeam: "Germany",
    matchNumber: 43,
    kickOffTime: "2026-07-11T21:00:00Z",
    status: MatchStatus.PRE_MATCH,
    stadiumId: "V-ALBAYT",
    isHighRisk: false
  }
];

export const SEED_GATES: Gate[] = [
  {
    id: "G-A-NORTH",
    venueId: "V-LUSAIL",
    name: "Gate A (North)",
    status: "OPEN",
    targetCapacity: 150,
    currentFlowRate: 125,
    waitTimeMinutes: 4,
    queueLength: 500,
    lastUpdatedAt: new Date().toISOString()
  },
  {
    id: "G-B-EAST",
    venueId: "V-LUSAIL",
    name: "Gate B (East)",
    status: "OPEN",
    targetCapacity: 150,
    currentFlowRate: 90,
    waitTimeMinutes: 2,
    queueLength: 180,
    lastUpdatedAt: new Date().toISOString()
  },
  {
    id: "G-C-WEST",
    venueId: "V-LUSAIL",
    name: "Gate C (West)",
    status: "OPEN",
    targetCapacity: 180,
    currentFlowRate: 140,
    waitTimeMinutes: 6,
    queueLength: 840,
    lastUpdatedAt: new Date().toISOString()
  },
  {
    id: "G-G-SOUTHWEST",
    venueId: "V-LUSAIL",
    name: "Gate G (Southwest)",
    status: "RESTRICTED",
    targetCapacity: 180,
    currentFlowRate: 420,
    waitTimeMinutes: 14,
    queueLength: 2100,
    lastUpdatedAt: new Date().toISOString()
  },
  {
    id: "G-E-HOSP",
    venueId: "V-LUSAIL",
    name: "Gate E (Hospitality)",
    status: "OPEN",
    targetCapacity: 80,
    currentFlowRate: 45,
    waitTimeMinutes: 1,
    queueLength: 45,
    lastUpdatedAt: new Date().toISOString()
  }
];

export const SEED_CROWD_ZONES: CrowdZone[] = [
  {
    id: "CZ-CONC-A",
    venueId: "V-LUSAIL",
    name: "Concourse A East",
    densityPercentage: 45,
    status: "NOMINAL",
    estimatedHeadcount: 1250,
    lastUpdatedAt: new Date().toISOString()
  },
  {
    id: "CZ-CONC-G",
    venueId: "V-LUSAIL",
    name: "Concourse G Southwest",
    densityPercentage: 92,
    status: "CRITICAL",
    estimatedHeadcount: 4800,
    lastUpdatedAt: new Date().toISOString()
  },
  {
    id: "CZ-METRO-PL",
    venueId: "V-LUSAIL",
    name: "Metro Station Platform Level",
    densityPercentage: 68,
    status: "MODERATE",
    estimatedHeadcount: 3100,
    lastUpdatedAt: new Date().toISOString()
  }
];

export const SEED_VOLUNTEERS: Volunteer[] = [
  {
    id: "VOL-101",
    name: "Amara Adebayo",
    status: StaffStatus.ON_DUTY,
    assignedSector: "Southwest Turnstiles",
    languages: ["English", "Yoruba", "Arabic"],
    skills: ["First Aid", "Information Desk", "Crowd Guidance"],
    lastActiveAt: new Date().toISOString(),
    contactNumber: "+974 5551 2341"
  },
  {
    id: "VOL-102",
    name: "Santiago Torres",
    status: StaffStatus.DISPATCHED,
    assignedSector: "West Ingress Hub",
    languages: ["Spanish", "English"],
    skills: ["First Aid", "Spanish Translation", "Radio Op"],
    lastActiveAt: new Date().toISOString(),
    contactNumber: "+974 5551 2342"
  },
  {
    id: "VOL-103",
    name: "Yuki Tanaka",
    status: StaffStatus.ON_DUTY,
    assignedSector: "VIP Hub Lounge",
    languages: ["Japanese", "English", "Korean"],
    skills: ["Hospitality Management", "Languages"],
    lastActiveAt: new Date().toISOString(),
    contactNumber: "+974 5551 2343"
  },
  {
    id: "VOL-104",
    name: "Fatima Al-Kuwari",
    status: StaffStatus.ON_DUTY,
    assignedSector: "Southwest Turnstiles",
    languages: ["Arabic", "English", "French"],
    skills: ["VIP Protocol", "Local Information", "Crowd Guidance"],
    lastActiveAt: new Date().toISOString(),
    contactNumber: "+974 5551 2344"
  }
];

export const SEED_MEDICAL_TEAMS: MedicalTeam[] = [
  {
    id: "MED-ALPHA",
    name: "Medical Team Alpha",
    stationName: "Sector North First Aid Hub",
    status: StaffStatus.ON_DUTY,
    stretcherAvailable: true,
    paramedicCount: 4,
    assignedIncidents: [],
    lastActiveAt: new Date().toISOString()
  },
  {
    id: "MED-ECHO",
    name: "Medical Team Echo",
    stationName: "Sector South First Aid Hub",
    status: StaffStatus.DISPATCHED,
    stretcherAvailable: true,
    paramedicCount: 3,
    assignedIncidents: ["INC-2026-4418"],
    lastActiveAt: new Date().toISOString()
  }
];

export const SEED_SECURITY_TEAMS: SecurityTeam[] = [
  {
    id: "SEC-DELTA",
    name: "Response Squad Delta",
    status: StaffStatus.DISPATCHED,
    assignedSector: "Gate G Turnstiles",
    memberCount: 8,
    hasK9Unit: true,
    assignedIncidents: ["INC-2026-4421"],
    lastActiveAt: new Date().toISOString()
  },
  {
    id: "SEC-CHARLIE",
    name: "Rapid Deployment Charlie",
    status: StaffStatus.ON_DUTY,
    assignedSector: "West Outer Perimeter",
    memberCount: 12,
    hasK9Unit: false,
    assignedIncidents: [],
    lastActiveAt: new Date().toISOString()
  }
];

export const SEED_RESOURCES: Resource[] = [
  {
    id: "R-MEG-1",
    name: "Megaphone Set B-12",
    type: "COMMUNICATION",
    status: "DEPLOYED",
    assignedSector: "Southwest Turnstiles",
    currentLocation: "Gate G-4 Spectator Railings",
    assignedToId: "VOL-101"
  },
  {
    id: "R-PRN-5",
    name: "Backup Ticket Printer P-5",
    type: "EQUIPMENT",
    status: "FAULT",
    assignedSector: "VIP Hub Lounge",
    currentLocation: "North Reception Office",
    assignedToId: "VOL-103"
  },
  {
    id: "R-STR-4",
    name: "Stretcher Unit S-04",
    type: "EQUIPMENT",
    status: "AVAILABLE",
    assignedSector: "Sector South First Aid Hub",
    currentLocation: "Medical Room B",
    assignedToId: "MED-ECHO"
  }
];

export const SEED_ACCESSIBILITY_RESOURCES: AccessibilityResource[] = [
  {
    id: "ACC-WHL-A",
    name: "Wheelchair Hub A (North)",
    type: "WHEELCHAIR",
    status: "OPERATIONAL",
    assignedSector: "North Plaza Ingress",
    currentLoad: "LOW",
    lastUpdatedAt: new Date().toISOString()
  },
  {
    id: "ACC-ELV-3",
    name: "Metro Line Link Elevator 3",
    type: "ELEVATOR",
    status: "OUT_OF_SERVICE",
    assignedSector: "West Ingress Hub",
    currentLoad: "HIGH",
    lastUpdatedAt: new Date().toISOString()
  },
  {
    id: "ACC-RMP-2",
    name: "Sector C Concourse Ramp",
    type: "RAMP",
    status: "OPERATIONAL",
    assignedSector: "Sector C Concourse",
    currentLoad: "MODERATE",
    lastUpdatedAt: new Date().toISOString()
  }
];

export const SEED_INCIDENTS: Incident[] = [
  {
    id: "INC-2026-4421",
    stadiumId: "V-LUSAIL",
    severity: Severity.CRITICAL,
    status: IncidentStatus.RESPONDING,
    category: IncidentCategory.CROWD,
    description: "Gate G Southwest Turnstiles queue congestion: average wait times are exceeding 14 minutes with spectator density approaching critical levels near control railings.",
    location: {
      sector: "Southwest Turnstiles",
      section: "Gate G-4",
      coordinates: { latitude: 25.4190, longitude: 51.4895 }
    },
    assignedStaff: ["SEC-DELTA", "VOL-101", "VOL-104"],
    reporterId: "VOL-101",
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false
  },
  {
    id: "INC-2026-4418",
    stadiumId: "V-LUSAIL",
    severity: Severity.WARNING,
    status: IncidentStatus.RESPONDING,
    category: IncidentCategory.FACILITIES,
    description: "Elevator 3 mechanical lock at Metro Line 2 Plaza Link. 4 accessibility-dependent spectators waiting. Lift technicians and Sector South Volunteers dispatched to support.",
    location: {
      sector: "West Ingress Hub",
      section: "Plaza Platform",
      coordinates: { latitude: 25.4215, longitude: 51.4912 }
    },
    assignedStaff: ["MED-ECHO", "VOL-102"],
    reporterId: "VOL-102",
    createdAt: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false
  },
  {
    id: "INC-2026-4405",
    stadiumId: "V-LUSAIL",
    severity: Severity.INFORMATIONAL,
    status: IncidentStatus.RESOLVED,
    category: IncidentCategory.FACILITIES,
    description: "Concourse Concession Sector C: minor water line pressure leak. Facilities sanitization team has completed plumbing clamp repair. Normal concession services resumed.",
    location: {
      sector: "Sector C Concourse",
      section: "Food Court",
      coordinates: { latitude: 25.4220, longitude: 51.4880 }
    },
    assignedStaff: [],
    reporterId: "OP-99",
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    isDeleted: false
  },
  {
    id: "INC-2026-4399",
    stadiumId: "V-LUSAIL",
    severity: Severity.WARNING,
    status: IncidentStatus.OPEN,
    category: IncidentCategory.SECURITY,
    description: "Credential validation terminal network synchronization failure. Hard-token backup dispatch active for credential auditing stewards.",
    location: {
      sector: "VIP Hub Lounge",
      section: "North Reception",
      coordinates: { latitude: 25.4211, longitude: 51.4905 }
    },
    assignedStaff: ["VOL-103"],
    reporterId: "VOL-103",
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false
  }
];

export const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: "N-2026-101",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    title: "Southwest Gate Wait Threshold Breach",
    message: "Gate G-4 wait times exceeded 12 minutes. Situation assessment dispatched.",
    category: "FLOW",
    severity: "CRITICAL",
    isRead: false,
    associatedId: "INC-2026-4421"
  },
  {
    id: "N-2026-102",
    timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    title: "Elevator 3 Outage Warning",
    message: "Metro Link Elevator 3 reporting telemetry failure. Mobility assistance team requested.",
    category: "SYSTEM",
    severity: "WARNING",
    isRead: false,
    associatedId: "INC-2026-4418"
  },
  {
    id: "N-2026-103",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    title: "Heavy Transit Arrival Notification",
    message: "Metro Line 2 arriving with peak load. Anticipate Southwest plaza surge.",
    category: "TRANSPORT",
    severity: "INFO",
    isRead: true
  }
];

export const SEED_RECOMMENDATIONS: OperationalRecommendation[] = [
  {
    id: "REC-2026-08",
    incidentId: "INC-2026-4421",
    title: "West Ingress Crowd Redistribution Protocol",
    reason: "Spectator throughput surge at Gate G-4 during peak stadium ingress window.",
    evidence: [
      "Queue wait times: 14 minutes (Operational limit: 8 minutes)",
      "Flow rate: 420 spectators/min (Nominal rate: 350 spectators/min)",
      "Metro transit loop is continuously delivering dense spectator loads"
    ],
    recommendedAction: "Instruct Southwest Sector Lead to deploy auxiliary guide channels G-5 & G-6, and reallocate 4 Volunteer Stewards from West Plaza Standby to manage queue rails.",
    expectedOutcome: "Redistribute southwest ingress flow, reduce wait times below 6 minutes, and alleviate pressure on Gate G-4 control lines.",
    confidenceScore: 0.94,
    priority: ActionPriority.HIGH,
    status: DecisionState.PENDING,
    createdAt: new Date(Date.now() - 9 * 60 * 1000).toISOString()
  }
];

export const SEED_WEATHER: Weather = {
  temperature: 28,
  condition: "Clear",
  windSpeed: 14,
  humidity: 45,
  advisory: "High moisture content; Pitch-side stadium environmental cooling systems active.",
  lastUpdatedAt: new Date().toISOString()
};

export const SEED_TRANSPORT: TransportLine[] = [
  {
    id: "TR-METRO-2",
    name: "Metro Line 2 (Lusail Central)",
    type: "METRO",
    status: "NOMINAL",
    headwayMinutes: 2.5,
    passengerLoad: "PEAK",
    currentAdvisory: "Direct express loop operating at absolute frequency.",
    lastUpdatedAt: new Date().toISOString()
  },
  {
    id: "TR-SHUTTLE-B",
    name: "Plaza Shuttle Loop B",
    type: "SHUTTLE",
    status: "DELAYED",
    headwayMinutes: 8,
    passengerLoad: "HIGH",
    currentAdvisory: "Minor delays due to temporary West Ring road pedestrian crossing protocols.",
    lastUpdatedAt: new Date().toISOString()
  }
];
