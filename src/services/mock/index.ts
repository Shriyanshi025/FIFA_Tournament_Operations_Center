/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  IncidentService, 
  CrowdFlowService, 
  ResourceService, 
  NotificationService, 
  RecommendationService, 
  SimulationService 
} from "../interfaces";

import { 
  Incident, 
  IncidentStatus, 
  Severity, 
  IncidentCategory, 
  Gate, 
  Notification, 
  OperationalRecommendation,
  DecisionState,
  ActionPriority,
  SimulationScenario,
  StaffStatus
} from "../../types";

import { mockDb } from "../../repositories/mock";
import { SimulationEngine, SCENARIO_DEFINITIONS } from "../simulation/SimulationEngine";

// Helper for simple schema validation
function validateRequired(value: any, fieldName: string) {
  if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
    throw new Error(`Validation Error: '${fieldName}' is a required field.`);
  }
}

export class MockIncidentService implements IncidentService {
  async createIncident(params: {
    description: string;
    category: IncidentCategory;
    severity: Severity;
    sector: string;
    section: string;
    stadiumId: string;
  }): Promise<Incident> {
    // Phase 2 Validation Gate
    validateRequired(params.description, "description");
    validateRequired(params.category, "category");
    validateRequired(params.severity, "severity");
    validateRequired(params.sector, "sector");
    validateRequired(params.section, "section");
    validateRequired(params.stadiumId, "stadiumId");

    if (params.description.length < 10) {
      throw new Error("Validation Error: Description must be at least 10 characters long.");
    }

    const created = await mockDb.incidents.create({
      stadiumId: params.stadiumId,
      severity: params.severity,
      status: IncidentStatus.OPEN,
      category: params.category,
      description: params.description,
      location: {
        sector: params.sector,
        section: params.section
      },
      assignedStaff: [],
      reporterId: "OP-99", // Current operator default
      isDeleted: false
    });

    // Automatically trigger notification for critical/warning incidents
    if (params.severity !== Severity.INFORMATIONAL) {
      await mockDb.notifications.create({
        timestamp: new Date().toISOString(),
        title: `New Incident Raised: ${created.id}`,
        message: `${params.category} incident in ${params.sector} - ${params.section}: ${params.description.substring(0, 50)}...`,
        category: "INCIDENT",
        severity: params.severity === Severity.CRITICAL ? "CRITICAL" : "WARNING",
        isRead: false,
        associatedId: created.id
      });
    }

    return created;
  }

  async updateIncidentStatus(id: string, status: IncidentStatus): Promise<Incident> {
    validateRequired(id, "id");
    validateRequired(status, "status");
    return await mockDb.incidents.update(id, { status });
  }

  async assignStaffToIncident(id: string, staffIds: string[]): Promise<Incident> {
    validateRequired(id, "id");
    validateRequired(staffIds, "staffIds");
    
    // Validate staff exists
    for (const staffId of staffIds) {
      const vol = await mockDb.volunteers.getById(staffId);
      const med = await mockDb.medicalTeams.getById(staffId);
      const sec = await mockDb.securityTeams.getById(staffId);
      if (!vol && !med && !sec) {
        throw new Error(`Validation Error: Assigned personnel '${staffId}' does not exist in any database cluster.`);
      }
    }

    const updated = await mockDb.incidents.update(id, { assignedStaff: staffIds });

    // Mark assigned staff status as dispatched
    for (const staffId of staffIds) {
      const vol = await mockDb.volunteers.getById(staffId);
      if (vol) await mockDb.volunteers.update(staffId, { status: StaffStatus.DISPATCHED });

      const med = await mockDb.medicalTeams.getById(staffId);
      if (med) await mockDb.medicalTeams.update(staffId, { status: StaffStatus.DISPATCHED });

      const sec = await mockDb.securityTeams.getById(staffId);
      if (sec) await mockDb.securityTeams.update(staffId, { status: StaffStatus.DISPATCHED });
    }

    return updated;
  }

  async getActiveIncidents(): Promise<Incident[]> {
    return await mockDb.incidents.find(inc => inc.status !== IncidentStatus.RESOLVED && inc.status !== IncidentStatus.CLOSED);
  }
}

export class MockCrowdFlowService implements CrowdFlowService {
  async getVenueGates(venueId: string): Promise<Gate[]> {
    validateRequired(venueId, "venueId");
    return await mockDb.gates.getByVenue(venueId);
  }

  async updateGateStatus(id: string, status: Gate["status"]): Promise<Gate> {
    validateRequired(id, "id");
    validateRequired(status, "status");
    return await mockDb.gates.update(id, { status });
  }

  async triggerGateReroute(fromGateId: string, toGateId: string): Promise<void> {
    validateRequired(fromGateId, "fromGateId");
    validateRequired(toGateId, "toGateId");

    const source = await mockDb.gates.getById(fromGateId);
    const dest = await mockDb.gates.getById(toGateId);

    if (!source || !dest) {
      throw new Error("Validation Error: Source or Destination gate for reroute does not exist.");
    }

    if (source.status !== "RESTRICTED") {
      await mockDb.gates.update(fromGateId, { status: "RESTRICTED" });
    }

    // Push notification to systems
    await mockDb.notifications.create({
      timestamp: new Date().toISOString(),
      title: "Active Gate Rerouting Ingress Protocol",
      message: `Crowd flow directed away from ${source.name} towards ${dest.name} to balance turnstile pressure.`,
      category: "FLOW",
      severity: "INFO",
      isRead: false
    });
  }

  async getCrowdAlerts(): Promise<string[]> {
    const criticalGates = await mockDb.gates.find(g => g.waitTimeMinutes >= 10);
    return criticalGates.map(g => `Crowd accumulation breach at ${g.name}. Current wait time: ${g.waitTimeMinutes} mins.`);
  }
}

export class MockResourceService implements ResourceService {
  async getVolunteers(): Promise<any[]> {
    return await mockDb.volunteers.getAll();
  }

  async getMedicalTeams(): Promise<any[]> {
    return await mockDb.medicalTeams.getAll();
  }

  async getSecurityTeams(): Promise<any[]> {
    return await mockDb.securityTeams.getAll();
  }

  async getAccessibilityResources(): Promise<any[]> {
    return await mockDb.accessibility.getAll();
  }

  async dispatchVolunteerToSector(volunteerId: string, sector: string): Promise<void> {
    validateRequired(volunteerId, "volunteerId");
    validateRequired(sector, "sector");
    
    const vol = await mockDb.volunteers.getById(volunteerId);
    if (!vol) {
      throw new Error(`Validation Error: Volunteer with ID ${volunteerId} not found.`);
    }

    await mockDb.volunteers.update(volunteerId, {
      assignedSector: sector,
      status: StaffStatus.DISPATCHED
    });
  }

  async updateResourceStatus(id: string, status: string): Promise<void> {
    validateRequired(id, "id");
    validateRequired(status, "status");

    const r = await mockDb.resources.getById(id);
    if (r) {
      await mockDb.resources.update(id, { status: status as any });
      return;
    }

    const acc = await mockDb.accessibility.getById(id);
    if (acc) {
      await mockDb.accessibility.update(id, { status: status as any });
      return;
    }

    throw new Error(`Validation Error: Resource with ID ${id} was not found in any inventory catalog.`);
  }
}

export class MockNotificationService implements NotificationService {
  async getNotifications(): Promise<Notification[]> {
    return await mockDb.notifications.getAll();
  }

  async publishNotification(title: string, message: string, category: Notification["category"], severity: Notification["severity"]): Promise<Notification> {
    validateRequired(title, "title");
    validateRequired(message, "message");
    validateRequired(category, "category");
    validateRequired(severity, "severity");

    return await mockDb.notifications.create({
      timestamp: new Date().toISOString(),
      title,
      message,
      category,
      severity,
      isRead: false
    });
  }

  async markAsRead(id: string): Promise<void> {
    validateRequired(id, "id");
    await mockDb.notifications.update(id, { isRead: true });
  }

  async markAllRead(): Promise<void> {
    await mockDb.notifications.markAllAsRead();
  }
}

export class MockRecommendationService implements RecommendationService {
  async getRecommendations(): Promise<OperationalRecommendation[]> {
    return await mockDb.recommendations.getAll();
  }

  async evaluateSituation(incidentId?: string): Promise<OperationalRecommendation[]> {
    if (incidentId) {
      return await mockDb.recommendations.getByIncidentId(incidentId);
    }
    return await mockDb.recommendations.getPending();
  }

  async processDecision(id: string, decision: DecisionState, operatorId: string): Promise<OperationalRecommendation> {
    validateRequired(id, "id");
    validateRequired(decision, "decision");
    validateRequired(operatorId, "operatorId");

    const r = await mockDb.recommendations.getById(id);
    if (!r) {
      throw new Error(`Validation Error: Recommendation with ID ${id} does not exist.`);
    }

    const updated = await mockDb.recommendations.update(id, {
      status: decision,
      operatorId,
      resolvedAt: new Date().toISOString()
    });

    // Publish a system event notification
    await mockDb.notifications.create({
      timestamp: new Date().toISOString(),
      title: `Recommendation Approved`,
      message: `Operational Plan '${r.title}' was executed by operator ID ${operatorId}.`,
      category: "SYSTEM",
      severity: "INFO",
      isRead: false
    });

    return updated;
  }
}

export class MockSimulationService implements SimulationService {
  private engine = SimulationEngine.getInstance();

  async getScenarios(): Promise<SimulationScenario[]> {
    const state = this.engine.getState();
    return SCENARIO_DEFINITIONS.map(s => ({
      ...s,
      isActive: state.activeScenarioId === s.id && !state.isPaused
    })) as SimulationScenario[];
  }

  async startScenario(id: string): Promise<SimulationScenario> {
    this.engine.loadScenario(id);
    const scenarios = await this.getScenarios();
    const found = scenarios.find(s => s.id === id);
    if (!found) {
      throw new Error(`Validation Error: Simulation Scenario with ID ${id} not found.`);
    }
    return found;
  }

  async stopActiveScenario(): Promise<void> {
    this.engine.pause();
    this.engine.reset();
  }

  async tickSimulation(): Promise<{
    incidentsTriggered: Incident[];
    notificationsTriggered: Notification[];
    recommendationsTriggered: OperationalRecommendation[];
  }> {
    return await this.engine.tick();
  }
}

// Global service instances mapping
export const incidentService = new MockIncidentService();
export const crowdFlowService = new MockCrowdFlowService();
export const resourceService = new MockResourceService();
export const notificationService = new MockNotificationService();
export const recommendationService = new MockRecommendationService();
export const simulationService = new MockSimulationService();
