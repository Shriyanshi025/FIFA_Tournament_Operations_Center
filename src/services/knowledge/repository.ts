/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KnowledgeAsset, KnowledgeCategory, KnowledgeStatus, KnowledgePriority, KnowledgeRepository, KnowledgeFilter } from "./types";
import { validateKnowledgeAsset } from "./validation";

export class InMemoryKnowledgeRepository implements KnowledgeRepository {
  private assets: Map<string, KnowledgeAsset> = new Map();

  constructor() {
    this.seedDefaultSOPs();
  }

  public async getById(id: string): Promise<KnowledgeAsset | null> {
    return this.assets.get(id) || null;
  }

  public async save(asset: KnowledgeAsset): Promise<void> {
    const validationResult = validateKnowledgeAsset(asset);
    if (!validationResult.isValid) {
      throw new Error(`Cannot save invalid Knowledge Asset: ${validationResult.errors.join("; ")}`);
    }
    this.assets.set(asset.id, asset);
  }

  public async delete(id: string): Promise<boolean> {
    return this.assets.delete(id);
  }

  public async getAll(): Promise<KnowledgeAsset[]> {
    return Array.from(this.assets.values());
  }

  /**
   * Search method using metadata filtering and text matching.
   */
  public async search(query: string, filter?: KnowledgeFilter): Promise<KnowledgeAsset[]> {
    let list = Array.from(this.assets.values());

    // 1. Apply Metadata Filters
    if (filter) {
      if (filter.category) {
        list = list.filter(a => a.category === filter.category);
      }
      if (filter.tags && filter.tags.length > 0) {
        list = list.filter(a => filter.tags!.every(t => a.tags.includes(t)));
      }
      if (filter.language) {
        list = list.filter(a => a.language === filter.language);
      }
      if (filter.version) {
        list = list.filter(a => a.version === filter.version);
      }
      if (filter.validityStatus) {
        list = list.filter(a => a.validityStatus === filter.validityStatus);
      }
      if (filter.priorityMin !== undefined) {
        list = list.filter(a => a.priority >= filter.priorityMin!);
      }
      if (filter.venueType) {
        list = list.filter(a => a.applicableVenueTypes.includes("ALL") || a.applicableVenueTypes.includes(filter.venueType!));
      }
      if (filter.matchType) {
        list = list.filter(a => a.applicableMatchTypes.includes("ALL") || a.applicableMatchTypes.includes(filter.matchType!));
      }
    }

    // 2. Text Search Filtering (Keyword matching on title, content, or tags)
    if (query && query.trim() !== "") {
      const normalizedQuery = query.toLowerCase().trim();
      list = list.filter(a => {
        return (
          a.title.toLowerCase().includes(normalizedQuery) ||
          a.content.toLowerCase().includes(normalizedQuery) ||
          a.tags.some(t => t.toLowerCase().includes(normalizedQuery))
        );
      });
    }

    // 3. Priority Ordering (Descending)
    list.sort((a, b) => b.priority - a.priority);

    return list;
  }

  /**
   * Seed the database with official procedures for all 12 operational domains.
   */
  private seedDefaultSOPs() {
    const sops: KnowledgeAsset[] = [
      // 1. FIFA SOPs
      {
        id: "sop-fifa-match-postponement",
        title: "FIFA Match Postponement and Rescheduling SOP",
        category: KnowledgeCategory.FIFA_SOPS,
        authority: "FIFA Match Operations Committee",
        content: `FIFA Standard Operating Procedure for Match Interruption and Postponement.
Section 12.4: If severe environmental hazards (lightning, flash floods, or total power grid failures) prevent safe play:
- The Match Commissioner, in alignment with local emergency authorities, holds sole power to suspend play.
- If match suspension lasts more than 45 minutes, match postponement protocols must be triggered.
- Broadcast systems and team managers must be notified immediately within 5 minutes of official decision.
- Staged stadium evacuation must commence under emergency egress plans, directing fans to designated shuttle loops first.`,
        language: "en",
        version: "2.1",
        lastUpdated: "2026-06-01T12:00:00Z",
        applicableVenueTypes: ["ALL"],
        applicableMatchTypes: ["ALL"],
        tags: ["fifa", "postponement", "interruption", "operations"],
        priority: KnowledgePriority.CRITICAL,
        validityStatus: KnowledgeStatus.PUBLISHED,
        auditHistory: [
          { version: "1.0", timestamp: "2024-01-01T10:00:00Z", actor: "FIFA Admin", action: "CREATED" },
          { version: "2.1", timestamp: "2026-06-01T12:00:00Z", actor: "FIFA Commissioner", action: "UPDATED", notes: "Updated to cover extreme weather thresholds." }
        ]
      },
      // 2. EMERGENCY PROCEDURES
      {
        id: "sop-emergency-fire-containment",
        title: "Stadium Structural Fire Response & Area Containment Drill",
        category: KnowledgeCategory.EMERGENCY_PROCEDURES,
        authority: "Local Fire & Emergency Services Authority",
        content: `Fire Response and Structural Area Containment Procedure.
- Upon automated smoke/heat detector trip in any zone:
- Instantly dispatch the on-site Rapid Fire Containment Squad to the sector coordinates.
- DO NOT lock down gates in adjacent exit routes. Keep exit corridors completely unobstructed.
- Establish a 100-meter safety cordon and close general pedestrian inlets to the affected quadrant.
- Prepare fire truck ingress pathways at Sector Gate Foxtrot and ensure emergency hydrant pressure remains at >=60 PSI.`,
        language: "en",
        version: "1.0",
        lastUpdated: "2025-03-15T08:30:00Z",
        applicableVenueTypes: ["ALL"],
        applicableMatchTypes: ["ALL"],
        tags: ["fire", "emergency", "containment", "cordon"],
        priority: KnowledgePriority.CRITICAL,
        validityStatus: KnowledgeStatus.PUBLISHED,
        auditHistory: [
          { version: "1.0", timestamp: "2025-03-15T08:30:00Z", actor: "Security Chief", action: "CREATED" }
        ]
      },
      // 3. MEDICAL PROTOCOLS
      {
        id: "sop-medical-cardiac-triage",
        title: "Mass Cardiac Arrest or Severe Dehydration Triage Protocol",
        category: KnowledgeCategory.MEDICAL_PROTOCOLS,
        authority: "Tournament Chief Medical Officer",
        content: `Medical Triage and Cardiac Incident Coordination:
- If a high-density cardiac or heatwave collapse occurs in spectator stands:
- Trigger immediate Level Red ambulance dispatch.
- Assign the closest Medical First-Aid Tent (Tent A, B, or C depending on seat sector quadrant).
- Clear the emergency medical lane leading to the field perimeter for direct stretcher access.
- Redirect secondary ambulant complaints to low-priority outpatient facilities.`,
        language: "en",
        version: "1.2",
        lastUpdated: "2026-04-10T14:00:00Z",
        applicableVenueTypes: ["ALL"],
        applicableMatchTypes: ["ALL"],
        tags: ["medical", "cardiac", "triage", "ambulance"],
        priority: KnowledgePriority.HIGH,
        validityStatus: KnowledgeStatus.PUBLISHED,
        auditHistory: [
          { version: "1.0", timestamp: "2025-05-01T09:00:00Z", actor: "Medical Lead", action: "CREATED" },
          { version: "1.2", timestamp: "2026-04-10T14:00:00Z", actor: "Chief Doctor", action: "UPDATED", notes: "Specified tent quadrant assignments." }
        ]
      },
      // 4. SECURITY PROCEDURES
      {
        id: "sop-security-perimeter-breach",
        title: "Perimeter Security Breach and Gate Isolation Procedure",
        category: KnowledgeCategory.SECURITY_PROCEDURES,
        authority: "Stadium Security Directorate",
        content: `Unauthorized Gate and Outer Fence Breach Incident Response:
- Upon detection of physical breach at outer fencing or turnstile tailgating:
- Coordinate immediate deployment of Security Mobile Units.
- Initiate local gate containment by disabling incoming barcode scanners in the target sector.
- Direct flow to secondary check points 50 meters left or right.
- DO NOT disrupt active egress flows at adjacent exit gates to prevent crushing.`,
        language: "en",
        version: "1.5",
        lastUpdated: "2026-01-20T17:00:00Z",
        applicableVenueTypes: ["ALL"],
        applicableMatchTypes: ["ALL"],
        tags: ["security", "breach", "lockdown", "perimeter"],
        priority: KnowledgePriority.HIGH,
        validityStatus: KnowledgeStatus.PUBLISHED,
        auditHistory: [
          { version: "1.0", timestamp: "2025-01-01T11:00:00Z", actor: "HQ Security", action: "CREATED" },
          { version: "1.5", timestamp: "2026-01-20T17:00:00Z", actor: "Director of Ops", action: "UPDATED" }
        ]
      },
      // 5. CROWD MANAGEMENT
      {
        id: "sop-crowd-density-balancing",
        title: "Crowd Flow Load Balancing and Turnstile Overload SOP",
        category: KnowledgeCategory.CROWD_MANAGEMENT,
        authority: "Crowd Safety Committee",
        content: `Turnstile Bottleneck and Queue Balancing Procedure:
- When any individual entry gate's wait time exceeds 20 minutes (or density hits 4 persons/sqm):
- Trigger automatic signpost rerouting on stadium display boards.
- Deploy crowd stewards to actively split queues at 50 meters back.
- Guide fans toward underutilized adjacent gates (at least 20% available capacity).
- Stagger stadium access gates dynamically using wave release protocols if necessary.`,
        language: "en",
        version: "2.0",
        lastUpdated: "2026-05-05T10:00:00Z",
        applicableVenueTypes: ["ALL"],
        applicableMatchTypes: ["ALL"],
        tags: ["crowd", "congestion", "balancing", "gates"],
        priority: KnowledgePriority.HIGH,
        validityStatus: KnowledgeStatus.PUBLISHED,
        auditHistory: [
          { version: "2.0", timestamp: "2026-05-05T10:00:00Z", actor: "Crowd Expert", action: "STATUS_CHANGED" }
        ]
      },
      // 6. TRANSPORT OPERATIONS
      {
        id: "sop-transport-metro-disruption",
        title: "Metro System Disruption & Emergency Shuttle Dispatch SOP",
        category: KnowledgeCategory.TRANSPORT_OPERATIONS,
        authority: "Metropolitan Transport Authority",
        content: `Metro Transit Failures Contingency Plan:
- In the event of a rail line disruption within 3 hours before or after a match:
- Activate the Emergency Shuttle Fleet from Transit Depot Bravo.
- Mobilize up to 45 auxiliary high-capacity buses to run express routes to central rail hubs.
- Repurpose public parking lot Zone Delta as a dedicated shuttle loading/boarding zone.
- Broadcast pedestrian walk directives to the nearest functional bus depots.`,
        language: "en",
        version: "3.0",
        lastUpdated: "2026-03-12T15:00:00Z",
        applicableVenueTypes: ["ALL"],
        applicableMatchTypes: ["ALL"],
        tags: ["transport", "metro", "shuttle", "bus"],
        priority: KnowledgePriority.HIGH,
        validityStatus: KnowledgeStatus.PUBLISHED,
        auditHistory: [
          { version: "3.0", timestamp: "2026-03-12T15:00:00Z", actor: "Trans Coordinator", action: "CREATED" }
        ]
      },
      // 7. VOLUNTEER GUIDELINES
      {
        id: "sop-volunteer-coordination",
        title: "Volunteer Coordination and Multilingual Guest Support",
        category: KnowledgeCategory.VOLUNTEER_GUIDELINES,
        authority: "FIFA Volunteers Coordinator",
        content: `Volunteer Stewarding and Fan Support Guidelines:
- In situations of queue congestion or lost children emergencies:
- Reassign guest services volunteers to key bottlenecks.
- Group volunteers based on language competencies (e.g., match Spanish/German speakers to high-concentration arriving fan delegations).
- Ensure all volunteers have active radios and operate strictly in buddy-pairs.
- Direct lost children reports immediately to the main Security Pavilion in Sector Charlie.`,
        language: "en",
        version: "1.1",
        lastUpdated: "2025-08-11T09:30:00Z",
        applicableVenueTypes: ["ALL"],
        applicableMatchTypes: ["ALL"],
        tags: ["volunteers", "language", "lost-child", "steward"],
        priority: KnowledgePriority.MEDIUM,
        validityStatus: KnowledgeStatus.PUBLISHED,
        auditHistory: [
          { version: "1.1", timestamp: "2025-08-11T09:30:00Z", actor: "Volunteer Lead", action: "CREATED" }
        ]
      },
      // 8. ACCESSIBILITY GUIDELINES
      {
        id: "sop-accessibility-elevator-failure",
        title: "Accessible Route Maintenance & Public Elevator Failures",
        category: KnowledgeCategory.ACCESSIBILITY_GUIDELINES,
        authority: "Stadium Inclusion Committee",
        content: `Accessibility Route Disruption Mitigation:
- If a primary passenger lift or wheelchair access ramp is disabled:
- Dispatch at least 2 accessibility stewards to redirect wheelchair users.
- Guide affected patrons to the nearest operational alternative lift (maximum 120-meter travel distance).
- Provide portable auditory and visual signage boards at the blockage points.
- Ensure all alternative path gradients are below 1:12 slope threshold.`,
        language: "en",
        version: "1.0",
        lastUpdated: "2025-11-01T11:00:00Z",
        applicableVenueTypes: ["ALL"],
        applicableMatchTypes: ["ALL"],
        tags: ["accessibility", "elevator", "wheelchair", "ramps"],
        priority: KnowledgePriority.HIGH,
        validityStatus: KnowledgeStatus.PUBLISHED,
        auditHistory: [
          { version: "1.0", timestamp: "2025-11-01T11:00:00Z", actor: "Inclusion Officer", action: "CREATED" }
        ]
      },
      // 9. WEATHER PROCEDURES
      {
        id: "sop-weather-lightning-strike",
        title: "Lightning Strike Mitigation and Stand Clearance Procedure",
        category: KnowledgeCategory.WEATHER_PROCEDURES,
        authority: "National Weather Bureau & Emergency Management",
        content: `Lightning Hazard Protocol (30-30 Rule):
- If lightning strikes are recorded within a 10km radius of the stadium:
- Trigger immediate covered-area sheltering directives.
- Clear open metal bleacher seating and open spectator terraces.
- Guide fans into concrete covered concourses.
- Suspend all outdoor operations, including scaffolding and high-elevation broadcasting.`,
        language: "en",
        version: "1.4",
        lastUpdated: "2026-06-15T13:00:00Z",
        applicableVenueTypes: ["OPEN_AIR"],
        applicableMatchTypes: ["ALL"],
        tags: ["weather", "lightning", "shelter", "storm"],
        priority: KnowledgePriority.CRITICAL,
        validityStatus: KnowledgeStatus.PUBLISHED,
        auditHistory: [
          { version: "1.0", timestamp: "2024-05-10T14:00:00Z", actor: "Weather Liaison", action: "CREATED" },
          { version: "1.4", timestamp: "2026-06-15T13:00:00Z", actor: "EM Director", action: "UPDATED", notes: "Aligned with new 30-30 strict limits." }
        ]
      },
      // 10. SUSTAINABILITY GUIDELINES
      {
        id: "sop-sustainability-resource-management",
        title: "Stadium Waste Streams and Water System Optimization",
        category: KnowledgeCategory.SUSTAINABILITY_GUIDELINES,
        authority: "Stadium Green Operations Board",
        content: `Waste Management and Utility Conservation Guidelines:
- Monitor smart trash sensors; if any bin exceeds 85% capacity, trigger sanitation dispatch.
- If water pressure falls below 35 PSI during high-load intervals:
- Restrict non-potable greywater irrigation pipelines.
- Implement HVAC setpoint throttling (adjust +/- 1.5°C in non-critical sectors) to reduce high peak power consumption.
- Redirect cleanup staff to high-frequency trash overflow hot zones.`,
        language: "en",
        version: "1.1",
        lastUpdated: "2025-07-22T08:00:00Z",
        applicableVenueTypes: ["ALL"],
        applicableMatchTypes: ["ALL"],
        tags: ["sustainability", "waste", "water", "energy"],
        priority: KnowledgePriority.LOW,
        validityStatus: KnowledgeStatus.PUBLISHED,
        auditHistory: [
          { version: "1.1", timestamp: "2025-07-22T08:00:00Z", actor: "Green Officer", action: "CREATED" }
        ]
      },
      // 11. VENUE OPERATIONS
      {
        id: "sop-venue-gate-flow",
        title: "Venue Gate Operations and Turnstile Ingress Procedures",
        category: KnowledgeCategory.VENUE_OPERATIONS,
        authority: "Venue Management Team",
        content: `Standard Ingress and Gate Ticketing Operational Guidelines:
- Keep all pre-gate ticketing checkpoint tents fully staffed 3 hours before kickoff.
- Turnstiles must sustain an average throughput of 15 persons per minute.
- In the event of a scanner network freeze, transition immediately to manual visual inspection of QR passes.
- Maintain separate lanes for VIPs, press, and accessibility cardholders at all times.`,
        language: "en",
        version: "1.0",
        lastUpdated: "2025-10-10T09:00:00Z",
        applicableVenueTypes: ["ALL"],
        applicableMatchTypes: ["ALL"],
        tags: ["venue", "gates", "ingress", "turnstiles"],
        priority: KnowledgePriority.MEDIUM,
        validityStatus: KnowledgeStatus.PUBLISHED,
        auditHistory: [
          { version: "1.0", timestamp: "2025-10-10T09:00:00Z", actor: "Venue Mgr", action: "CREATED" }
        ]
      },
      // 12. TECHNOLOGY OPERATIONS
      {
        id: "sop-technology-network-failover",
        title: "Stadium Wireless & Scanner Network Failover Plan",
        category: KnowledgeCategory.TECHNOLOGY_OPERATIONS,
        authority: "Chief Information Officer",
        content: `Technology Network Failover and Cybersecurity Protocols:
- If primary stadium fiber connectivity fails:
- Trigger automatic failover to the cellular LTE/5G secondary backup loop within 15 seconds.
- Switch ticket validation scanners to local-cache validation mode.
- Direct on-site tech squads to verify the hardware link status of distribution routers.
- Isolate the secondary subnets to prevent malicious payload spread.`,
        language: "en",
        version: "2.0",
        lastUpdated: "2026-02-18T16:00:00Z",
        applicableVenueTypes: ["ALL"],
        applicableMatchTypes: ["ALL"],
        tags: ["technology", "network", "failover", "wifi"],
        priority: KnowledgePriority.HIGH,
        validityStatus: KnowledgeStatus.PUBLISHED,
        auditHistory: [
          { version: "1.0", timestamp: "2025-02-10T10:00:00Z", actor: "IT Chief", action: "CREATED" },
          { version: "2.0", timestamp: "2026-02-18T16:00:00Z", actor: "IT Lead", action: "UPDATED", notes: "Added scanner caching rules." }
        ]
      }
    ];

    for (const sop of sops) {
      this.assets.set(sop.id, sop);
    }
  }
}
