const fs = require('fs');

const collabPath = 'src/components/dashboard/LiveCollaborationWidget.tsx';
let content = fs.readFileSync(collabPath, 'utf8');

// The split markers
const p1Start = content.indexOf('{/* 1. PRESENCE & REAL-TIME LEASING PANEL */}');
const p2Start = content.indexOf('{/* 2. TEAM MESSAGES & COMMUNICATION CARD */}');
const rootEnd = content.lastIndexOf('</div>');

const leasingContent = content.substring(p1Start, p2Start);
const msgContent = content.substring(p2Start, rootEnd);

// Imports needed
const importsStr = `import * as React from "react";
import { 
  Users, Lock, Unlock, Send, MessageSquare, Wifi, WifiOff, Activity, Bell, 
  AlertCircle, Database, RefreshCw, Clock, User, ShieldAlert, Terminal, Cpu, MailCheck
} from "lucide-react";
import { useCollaboration } from "../../../context/CollaborationContext";
import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { StaffRole } from "../../../types/common";
import { TeamMessageType } from "../../../types/collaboration";
`;

const formatTimeStr = `
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };
`;

const leasingFile = importsStr + `
export const PresenceLeasingPanel: React.FC = () => {
  const {
    connectionStatus, presences, locks, isConnected, operatorId, toggleNetworkState, acquireRecordLock, releaseRecordLock
  } = useCollaboration();

  const [targetIncidentLock, setTargetIncidentLock] = React.useState("INC-101");
  const [isLocking, setIsLocking] = React.useState(false);
  const [lockError, setLockError] = React.useState<string | null>(null);

  const handleToggleLock = async () => {
    setIsLocking(true);
    setLockError(null);
    try {
      const isCurrentlyLocked = locks.some(l => l.recordId === targetIncidentLock && Date.now() < l.expiresAt && l.lockedBy === operatorId);
      if (isCurrentlyLocked) {
        await releaseRecordLock(targetIncidentLock);
      } else {
        const success = await acquireRecordLock(targetIncidentLock, "incident");
        if (!success) {
          setLockError(\`Lock failed: Record \${targetIncidentLock} is currently leased to another operator.\`);
          setTimeout(() => setLockError(null), 5000);
        }
      }
    } catch (err) {
      console.error("Lock toggle failed", err);
      setLockError("Lock toggle failed. Please check connection.");
      setTimeout(() => setLockError(null), 5000);
    } finally {
      setIsLocking(false);
    }
  };

${formatTimeStr}

  return (
    <>
${leasingContent}
    </>
  );
};
`;

const msgFile = importsStr + `
export const CommunicationCenterPanel: React.FC = () => {
  const {
    messages, collabEvents, activities, offlineQueue, isConnected, operatorId, 
    sendCollaborationMessage, markCollabMessageRead, publishCollaborationEvent
  } = useCollaboration();

  const [messageText, setMessageText] = React.useState("");
  const [messageType, setMessageType] = React.useState<TeamMessageType>("incident_comment");
  const [relatedIncident, setRelatedIncident] = React.useState("");
  const [activeSubTab, setActiveSubTab] = React.useState<"chat" | "events" | "queue" | "activity">("chat");

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    try {
      await sendCollaborationMessage(
        messageType,
        messageText.trim(),
        relatedIncident ? relatedIncident.trim() : undefined
      );
      setMessageText("");
    } catch (err) {
      console.error("Message send failed:", err);
    }
  };

  const handleTriggerBroadcast = async (priority: "critical" | "high" | "medium", title: string, content: string) => {
    try {
      await publishCollaborationEvent("weather_warning", priority, title, content);
    } catch (err) {
      console.error("Event trigger failed:", err);
    }
  };

${formatTimeStr}

  return (
    <>
${msgContent}
    </>
  );
};
`;

const parentFile = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import * as React from "react";
import { PresenceLeasingPanel } from "./live-collaboration/PresenceLeasingPanel";
import { CommunicationCenterPanel } from "./live-collaboration/CommunicationCenterPanel";

export const LiveCollaborationWidget: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-md" id="live-collab-widget-layout">
      <PresenceLeasingPanel />
      <CommunicationCenterPanel />
    </div>
  );
};
`;

fs.writeFileSync('src/components/dashboard/live-collaboration/PresenceLeasingPanel.tsx', leasingFile);
fs.writeFileSync('src/components/dashboard/live-collaboration/CommunicationCenterPanel.tsx', msgFile);
fs.writeFileSync('src/components/dashboard/LiveCollaborationWidget.tsx', parentFile);

