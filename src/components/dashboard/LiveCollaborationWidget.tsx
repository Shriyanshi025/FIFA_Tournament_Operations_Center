/**
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
