/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { ShieldCheck, HeartPulse, ShieldAlert, UserCheck, Accessibility, Sliders } from "lucide-react";
import { useTournament } from "../../context/TournamentContext";
import { StaffStatus } from "../../types";
import { Badge } from "../ui/Badge";

export const ResourceWidget: React.FC = () => {
  const {
    volunteers,
    medicalTeams,
    securityTeams,
    accessibilityResources,
    resources,
    isLoading
  } = useTournament();

  const metrics = React.useMemo(() => {
    // 1. Volunteers Status
    const totalVolunteers = volunteers.length;
    const availableVolunteers = volunteers.filter((v) => v.status === StaffStatus.ON_DUTY).length;
    const busyVolunteers = totalVolunteers - availableVolunteers;

    // 2. Medical Status
    const totalMedical = medicalTeams.length;
    const availableMedical = medicalTeams.filter((m) => m.status === StaffStatus.ON_DUTY).length;

    // 3. Security Status
    const totalSecurity = securityTeams.length;
    const availableSecurity = securityTeams.filter((s) => s.status === StaffStatus.ON_DUTY).length;

    // 4. Accessibility Assets Status
    const totalAccess = accessibilityResources.length;
    const operationalAccess = accessibilityResources.filter((a) => a.status === "OPERATIONAL").length;

    // 5. Equipment Tracking
    const totalEquip = resources.length;
    const availableEquip = resources.filter((r) => r.status === "AVAILABLE").length;

    return {
      totalVolunteers,
      availableVolunteers,
      busyVolunteers,
      totalMedical,
      availableMedical,
      totalSecurity,
      availableSecurity,
      totalAccess,
      operationalAccess,
      totalEquip,
      availableEquip
    };
  }, [volunteers, medicalTeams, securityTeams, accessibilityResources, resources]);

  if (isLoading) {
    return (
      <div className="p-lg border border-dashed rounded-md text-center font-mono text-caption text-text-muted animate-pulse">
        Polling field dispatch teams...
      </div>
    );
  }

  return (
    <div className="space-y-lg" id="resource-operations-dashboard">
      
      {/* Mini Cards of Dispatch Categories */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-sm" id="resource-quick-meters">
        
        {/* Volunteers */}
        <div className="bg-background/40 border p-sm rounded-sm text-left">
          <span className="font-mono text-[9px] text-text-muted uppercase block">Volunteers Available</span>
          <div className="flex items-baseline gap-1xs mt-1xs">
            <span className="text-h3 font-display font-bold text-text-primary">{metrics.availableVolunteers}</span>
            <span className="text-text-secondary font-mono text-[9px]">/ {metrics.totalVolunteers}</span>
          </div>
          <div className="w-full bg-background border h-[4px] rounded-full mt-xs overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300" 
              style={{ width: `${(metrics.availableVolunteers / (metrics.totalVolunteers || 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Security response squads */}
        <div className="bg-background/40 border p-sm rounded-sm text-left">
          <span className="font-mono text-[9px] text-text-muted uppercase block">Security Patrols</span>
          <div className="flex items-baseline gap-1xs mt-1xs">
            <span className="text-h3 font-display font-bold text-text-primary">{metrics.availableSecurity}</span>
            <span className="text-text-secondary font-mono text-[9px]">/ {metrics.totalSecurity} squads</span>
          </div>
          <div className="w-full bg-background border h-[4px] rounded-full mt-xs overflow-hidden">
            <div 
              className="bg-accent h-full transition-all duration-300" 
              style={{ width: `${(metrics.availableSecurity / (metrics.totalSecurity || 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Medical Dispatches */}
        <div className="bg-background/40 border p-sm rounded-sm text-left">
          <span className="font-mono text-[9px] text-text-muted uppercase block">Medical Teams Available</span>
          <div className="flex items-baseline gap-1xs mt-1xs">
            <span className="text-h3 font-display font-bold text-text-primary">{metrics.availableMedical}</span>
            <span className="text-text-secondary font-mono text-[9px]">/ {metrics.totalMedical} hubs</span>
          </div>
          <div className="w-full bg-background border h-[4px] rounded-full mt-xs overflow-hidden">
            <div 
              className="bg-secondary h-full transition-all duration-300" 
              style={{ width: `${(metrics.availableMedical / (metrics.totalMedical || 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Accessibility Assets */}
        <div className="bg-background/40 border p-sm rounded-sm text-left">
          <span className="font-mono text-[9px] text-text-muted uppercase block">Accessibility Assets</span>
          <div className="flex items-baseline gap-1xs mt-1xs">
            <span className="text-h3 font-display font-bold text-text-primary">{metrics.operationalAccess}</span>
            <span className="text-text-secondary font-mono text-[9px]">/ {metrics.totalAccess} assets</span>
          </div>
          <div className="w-full bg-background border h-[4px] rounded-full mt-xs overflow-hidden">
            <div 
              className="bg-info h-full transition-all duration-300" 
              style={{ width: `${(metrics.operationalAccess / (metrics.totalAccess || 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Equipment Load */}
        <div className="bg-background/40 border p-sm rounded-sm text-left col-span-2 md:col-span-1">
          <span className="font-mono text-[9px] text-text-muted uppercase block">Equipment Pool</span>
          <div className="flex items-baseline gap-1xs mt-1xs">
            <span className="text-h3 font-display font-bold text-text-primary">{metrics.availableEquip}</span>
            <span className="text-text-secondary font-mono text-[9px]">/ {metrics.totalEquip} units</span>
          </div>
          <div className="w-full bg-background border h-[4px] rounded-full mt-xs overflow-hidden">
            <div 
              className="bg-neutral h-full transition-all duration-300" 
              style={{ width: `${(metrics.availableEquip / (metrics.totalEquip || 1)) * 100}%` }}
            />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        
        {/* Security & Medical Field Personnel Details */}
        <div className="border p-md bg-surface rounded-md space-y-sm text-left" id="field-teams-lists-card">
          <div className="flex items-center gap-xs pb-xs border-b border-border/40">
            <HeartPulse className="w-5 h-5 text-secondary" />
            <h4 className="font-display font-semibold text-caption text-text-primary">Field Response Squads Registry</h4>
          </div>

          <div className="space-y-sm max-h-[300px] overflow-y-auto pr-xs">
            {/* Security Teams */}
            <div className="space-y-xs">
              <span className="font-mono text-[10px] text-text-muted uppercase font-bold block">Security Response Units</span>
              {securityTeams.map((sec) => (
                <div key={sec.id} className="p-xs bg-background/50 border rounded-sm flex items-center justify-between text-[11px] font-mono gap-sm">
                  <div className="space-y-1xs text-left min-w-0 flex-1">
                    <span className="font-semibold text-text-primary block truncate">{sec.name}</span>
                    <span className="block text-[9px] text-text-muted truncate">Sector: {sec.assignedSector} • Members: {sec.memberCount} {sec.hasK9Unit && "• [K9 Squad]"}</span>
                  </div>
                  <Badge variant={sec.status === StaffStatus.ON_DUTY ? "success" : "warning"} size="sm" className="shrink-0 whitespace-nowrap">
                    {sec.status}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Medical Teams */}
            <div className="space-y-xs pt-sm border-t border-border/40">
              <span className="font-mono text-[10px] text-text-muted uppercase font-bold block">Medical Dispatch Stations</span>
              {medicalTeams.map((med) => (
                <div key={med.id} className="p-xs bg-background/50 border rounded-sm flex items-center justify-between text-[11px] font-mono gap-sm">
                  <div className="space-y-1xs text-left min-w-0 flex-1">
                    <span className="font-semibold text-text-primary block truncate">{med.name}</span>
                    <span className="block text-[9px] text-text-muted truncate">Station: {med.stationName} • Paramedics: {med.paramedicCount} {med.stretcherAvailable && "• [Stretcher Ready]"}</span>
                  </div>
                  <Badge variant={med.status === StaffStatus.ON_DUTY ? "success" : "warning"} size="sm" className="shrink-0 whitespace-nowrap">
                    {med.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Accessibility & Equipment Tracking */}
        <div className="border p-md bg-surface rounded-md space-y-sm text-left" id="accessibility-assets-card">
          <div className="flex items-center gap-xs pb-xs border-b border-border/40">
            <Accessibility className="w-5 h-5 text-primary" />
            <h4 className="font-display font-semibold text-caption text-text-primary">Accessibility Assets & Infrastructure</h4>
          </div>

          <div className="space-y-sm max-h-[300px] overflow-y-auto pr-xs">
            {accessibilityResources.map((asset) => {
              const loadBadgeColor = asset.currentLoad === "HIGH"
                ? "bg-error/15 text-error border-error/30"
                : asset.currentLoad === "MODERATE"
                ? "bg-warning/15 text-warning border-warning/20"
                : "bg-success/15 text-success border-success/20";

              return (
                <div key={asset.id} className="p-sm bg-background/40 border rounded-sm flex items-center justify-between text-[11px] font-mono gap-sm">
                  <div className="space-y-1xs text-left min-w-0 flex-1">
                    <span className="font-semibold text-text-primary block truncate">{asset.name}</span>
                    <span className="block text-[10px] text-text-muted truncate">Type: {asset.type} • Sector: {asset.assignedSector}</span>
                  </div>

                  <div className="flex items-center gap-xs shrink-0 flex-wrap justify-end">
                    <span className={`px-xs py-[2px] rounded-xs text-[9px] font-bold border ${loadBadgeColor} whitespace-nowrap shrink-0`}>
                      LOAD: {asset.currentLoad}
                    </span>
                    <Badge variant={asset.status === "OPERATIONAL" ? "success" : "neutral"} size="sm" className="whitespace-nowrap shrink-0">
                      {asset.status === "OPERATIONAL" ? "OPERATIONAL" : "LIMITED"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
