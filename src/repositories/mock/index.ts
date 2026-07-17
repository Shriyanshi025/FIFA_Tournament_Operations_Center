/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  IncidentRepository, 
  MatchRepository, 
  GateRepository, 
  CrowdZoneRepository, 
  VolunteerRepository, 
  MedicalTeamRepository, 
  SecurityTeamRepository, 
  ResourceRepository, 
  AccessibilityResourceRepository, 
  NotificationRepository, 
  RecommendationRepository, 
  TransportRepository 
} from "../interfaces";

import { 
  Incident, 
  Match, 
  Gate, 
  CrowdZone, 
  Volunteer, 
  MedicalTeam, 
  SecurityTeam, 
  Resource, 
  AccessibilityResource, 
  Notification, 
  OperationalRecommendation, 
  TransportLine,
  IncidentStatus,
  Severity,
  IncidentCategory,
  StaffStatus
} from "../../types";

import { 
  SEED_INCIDENTS, 
  SEED_MATCHES, 
  SEED_GATES, 
  SEED_CROWD_ZONES, 
  SEED_VOLUNTEERS, 
  SEED_MEDICAL_TEAMS, 
  SEED_SECURITY_TEAMS, 
  SEED_RESOURCES, 
  SEED_ACCESSIBILITY_RESOURCES, 
  SEED_NOTIFICATIONS, 
  SEED_RECOMMENDATIONS, 
  SEED_TRANSPORT 
} from "../../services/mock/seedData";

// Base In-Memory class to reduce boilerplates
class BaseInMemoryRepository<T extends { id: string; createdAt?: string; updatedAt?: string; isDeleted?: boolean }> {
  protected items: T[] = [];

  constructor(initialItems: T[]) {
    this.items = [...initialItems];
  }

  async getById(id: string): Promise<T | null> {
    const found = this.items.find(item => item.id === id && !item.isDeleted);
    return found ? { ...found } : null;
  }

  async getAll(): Promise<T[]> {
    return this.items.filter(item => !item.isDeleted).map(item => ({ ...item }));
  }

  async find(filter: (item: T) => boolean): Promise<T[]> {
    return this.items.filter(item => !item.isDeleted && filter(item)).map(item => ({ ...item }));
  }

  async create(item: Partial<T>): Promise<T> {
    const now = new Date().toISOString();
    const newItem = {
      ...item,
      id: item.id || `MOCK-${Math.floor(Math.random() * 100000)}`,
      createdAt: now,
      updatedAt: now,
      isDeleted: false
    } as unknown as T;
    
    this.items.push(newItem);
    return { ...newItem };
  }

  async update(id: string, partialItem: Partial<T>): Promise<T> {
    const idx = this.items.findIndex(item => item.id === id);
    if (idx === -1) {
      throw new Error(`Item not found for ID: ${id}`);
    }
    
    const updated = {
      ...this.items[idx],
      ...partialItem,
      updatedAt: new Date().toISOString()
    } as T;
    
    this.items[idx] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    const idx = this.items.findIndex(item => item.id === id);
    if (idx === -1) return false;
    
    this.items[idx] = {
      ...this.items[idx],
      isDeleted: true,
      updatedAt: new Date().toISOString()
    };
    return true;
  }
}

export class MockIncidentRepository extends BaseInMemoryRepository<Incident> implements IncidentRepository {
  async getByStatus(status: IncidentStatus): Promise<Incident[]> {
    return this.find(item => item.status === status);
  }

  async getBySeverity(severity: Severity): Promise<Incident[]> {
    return this.find(item => item.severity === severity);
  }

  async getByCategory(category: IncidentCategory): Promise<Incident[]> {
    return this.find(item => item.category === category);
  }
}

export class MockMatchRepository extends BaseInMemoryRepository<Match> implements MatchRepository {
  async getActiveMatch(): Promise<Match | null> {
    const active = this.items.find(m => m.status === "LIVE");
    return active ? { ...active } : null;
  }

  async getByStadium(stadiumId: string): Promise<Match[]> {
    return this.find(item => item.stadiumId === stadiumId);
  }
}

export class MockGateRepository extends BaseInMemoryRepository<Gate> implements GateRepository {
  async getByVenue(venueId: string): Promise<Gate[]> {
    return this.find(item => item.venueId === venueId);
  }

  async getHighWaitGates(thresholdMinutes: number): Promise<Gate[]> {
    return this.find(item => item.waitTimeMinutes >= thresholdMinutes);
  }
}

export class MockCrowdZoneRepository extends BaseInMemoryRepository<CrowdZone> implements CrowdZoneRepository {
  async getByVenue(venueId: string): Promise<CrowdZone[]> {
    return this.find(item => item.venueId === venueId);
  }

  async getCongestedZones(): Promise<CrowdZone[]> {
    return this.find(item => item.densityPercentage >= 80);
  }
}

export class MockVolunteerRepository extends BaseInMemoryRepository<Volunteer> implements VolunteerRepository {
  async getBySector(sector: string): Promise<Volunteer[]> {
    return this.find(item => item.assignedSector.toLowerCase().includes(sector.toLowerCase()));
  }

  async getAvailableVolunteers(): Promise<Volunteer[]> {
    return this.find(item => item.status === StaffStatus.ON_DUTY);
  }
}

export class MockMedicalTeamRepository extends BaseInMemoryRepository<MedicalTeam> implements MedicalTeamRepository {
  async getAvailableTeams(): Promise<MedicalTeam[]> {
    return this.find(item => item.status === StaffStatus.ON_DUTY);
  }
}

export class MockSecurityTeamRepository extends BaseInMemoryRepository<SecurityTeam> implements SecurityTeamRepository {
  async getBySector(sector: string): Promise<SecurityTeam[]> {
    return this.find(item => item.assignedSector.toLowerCase().includes(sector.toLowerCase()));
  }
}

export class MockResourceRepository extends BaseInMemoryRepository<Resource> implements ResourceRepository {
  async getByType(type: Resource["type"]): Promise<Resource[]> {
    return this.find(item => item.type === type);
  }

  async getAvailableResources(): Promise<Resource[]> {
    return this.find(item => item.status === "AVAILABLE");
  }
}

export class MockAccessibilityResourceRepository extends BaseInMemoryRepository<AccessibilityResource> implements AccessibilityResourceRepository {
  async getBySector(sector: string): Promise<AccessibilityResource[]> {
    return this.find(item => item.assignedSector.toLowerCase().includes(sector.toLowerCase()));
  }

  async getFaultyResources(): Promise<AccessibilityResource[]> {
    return this.find(item => item.status === "OUT_OF_SERVICE");
  }
}

export class MockNotificationRepository extends BaseInMemoryRepository<Notification> implements NotificationRepository {
  async getUnread(): Promise<Notification[]> {
    return this.find(item => !item.isRead);
  }

  async markAllAsRead(): Promise<void> {
    this.items.forEach(n => {
      n.isRead = true;
    });
  }
}

export class MockRecommendationRepository extends BaseInMemoryRepository<OperationalRecommendation> implements RecommendationRepository {
  async getPending(): Promise<OperationalRecommendation[]> {
    return this.find(item => item.status === "PENDING");
  }

  async getByIncidentId(incidentId: string): Promise<OperationalRecommendation[]> {
    return this.find(item => item.incidentId === incidentId);
  }
}

export class MockTransportRepository extends BaseInMemoryRepository<TransportLine> implements TransportRepository {
  async getDelayedLines(): Promise<TransportLine[]> {
    return this.find(item => item.status === "DELAYED");
  }
}

// Global Repository Registry Instance representing the operational db proxy
export class MockRepositoryRegistry {
  public incidents = new MockIncidentRepository(SEED_INCIDENTS);
  public matches = new MockMatchRepository(SEED_MATCHES);
  public gates = new MockGateRepository(SEED_GATES);
  public crowdZones = new MockCrowdZoneRepository(SEED_CROWD_ZONES);
  public volunteers = new MockVolunteerRepository(SEED_VOLUNTEERS);
  public medicalTeams = new MockMedicalTeamRepository(SEED_MEDICAL_TEAMS);
  public securityTeams = new MockSecurityTeamRepository(SEED_SECURITY_TEAMS);
  public resources = new MockResourceRepository(SEED_RESOURCES);
  public accessibility = new MockAccessibilityResourceRepository(SEED_ACCESSIBILITY_RESOURCES);
  public notifications = new MockNotificationRepository(SEED_NOTIFICATIONS);
  public recommendations = new MockRecommendationRepository(SEED_RECOMMENDATIONS);
  public transport = new MockTransportRepository(SEED_TRANSPORT);

  public resetAll() {
    this.incidents = new MockIncidentRepository(JSON.parse(JSON.stringify(SEED_INCIDENTS)));
    this.matches = new MockMatchRepository(JSON.parse(JSON.stringify(SEED_MATCHES)));
    this.gates = new MockGateRepository(JSON.parse(JSON.stringify(SEED_GATES)));
    this.crowdZones = new MockCrowdZoneRepository(JSON.parse(JSON.stringify(SEED_CROWD_ZONES)));
    this.volunteers = new MockVolunteerRepository(JSON.parse(JSON.stringify(SEED_VOLUNTEERS)));
    this.medicalTeams = new MockMedicalTeamRepository(JSON.parse(JSON.stringify(SEED_MEDICAL_TEAMS)));
    this.securityTeams = new MockSecurityTeamRepository(JSON.parse(JSON.stringify(SEED_SECURITY_TEAMS)));
    this.resources = new MockResourceRepository(JSON.parse(JSON.stringify(SEED_RESOURCES)));
    this.accessibility = new MockAccessibilityResourceRepository(JSON.parse(JSON.stringify(SEED_ACCESSIBILITY_RESOURCES)));
    this.notifications = new MockNotificationRepository(JSON.parse(JSON.stringify(SEED_NOTIFICATIONS)));
    this.recommendations = new MockRecommendationRepository(JSON.parse(JSON.stringify(SEED_RECOMMENDATIONS)));
    this.transport = new MockTransportRepository(JSON.parse(JSON.stringify(SEED_TRANSPORT)));
  }
}

export const mockDb = new MockRepositoryRegistry();
