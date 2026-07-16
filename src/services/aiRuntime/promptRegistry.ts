/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIPrompt } from "./types";
import { AIRuntimeError, AIErrorCode } from "./errors";
import { OPERATIONAL_PROMPT_LIBRARY } from "./promptLibrary";

export class PromptRegistry {
  private static instance: PromptRegistry | null = null;
  
  // Storage of registered prompts. Key is a combination of id and version (e.g., "prompt-id@1.0")
  private prompts: Map<string, AIPrompt> = new Map();

  private constructor() {
    this.registerDefaultTemplates();
    this.registerOperationalPromptLibrary();
  }

  public static getInstance(): PromptRegistry {
    if (!PromptRegistry.instance) {
      PromptRegistry.instance = new PromptRegistry();
    }
    return PromptRegistry.instance;
  }

  /**
   * Seed the registry with empty template placeholders as required by the infrastructure guidelines.
   */
  private registerDefaultTemplates() {
    this.registerPrompt({
      id: "evaluate-situation",
      version: "1.0",
      category: "OPERATIONAL",
      metadata: {
        title: "Situation Evaluation Template",
        description: "Evaluates active incidents and recommends immediate deployments",
        author: "AI Platform Group",
        tags: ["incident", "evaluation", "real-time"],
        createdAt: "2026-07-10T12:00:00Z"
      },
      template: "You are evaluating the active incident with ID {{incidentId}}. Sector: {{sector}}. Severity Level: {{severity}}. Weather Advisory: {{weatherAdvisory}}. Recommend 3 immediate actions.",
      requiredParameters: ["incidentId", "sector", "severity", "weatherAdvisory"]
    });

    this.registerPrompt({
      id: "crowd-congestion-mitigation",
      version: "1.1",
      category: "CROWD",
      metadata: {
        title: "Crowd Congestion Mitigation Advice",
        description: "Mitigation playbook recommendation for congested gates",
        author: "TOC Operations",
        tags: ["crowd", "congestion", "rerouting"],
        createdAt: "2026-07-10T14:30:00Z"
      },
      template: "Gate {{gateId}} reports wait times of {{waitTime}} minutes with flow rate {{flowRate}} fans/min. Propose rerouting alternatives from Sector {{sector}}.",
      requiredParameters: ["gateId", "waitTime", "flowRate", "sector"]
    });
  }

  /**
   * Register or overwrite a prompt in the registry.
   */
  public registerPrompt(prompt: AIPrompt): void {
    const key = `${prompt.id}@${prompt.version}`;
    this.prompts.set(key, prompt);
  }

  /**
   * Retrieve a prompt by ID and optional version. 
   * If version is not provided, defaults to finding the highest version.
   */
  public getPrompt(id: string, version?: string): AIPrompt {
    if (version) {
      const key = `${id}@${version}`;
      const prompt = this.prompts.get(key);
      if (!prompt) {
        throw new AIRuntimeError(
          AIErrorCode.PromptValidationFailed,
          `Prompt '${id}' with version '${version}' not found in registry.`
        );
      }
      return prompt;
    }

    // Default: find the highest version
    const matches: AIPrompt[] = [];
    this.prompts.forEach((prompt, key) => {
      if (prompt.id === id) {
        matches.push(prompt);
      }
    });

    if (matches.length === 0) {
      throw new AIRuntimeError(
        AIErrorCode.PromptValidationFailed,
        `Prompt '${id}' not found in registry.`
      );
    }

    // Sort by version (simple descending sort)
    matches.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' }));
    return matches[0];
  }

  /**
   * Renders a prompt template by injecting parameters and validating required keys.
   */
  public renderPrompt(id: string, parameters: Record<string, any>, version?: string): { text: string; prompt: AIPrompt } {
    const prompt = this.getPrompt(id, version);
    
    // Validate that all required parameters are provided
    const missingParams = prompt.requiredParameters.filter(p => parameters[p] === undefined || parameters[p] === null);
    if (missingParams.length > 0) {
      throw new AIRuntimeError(
        AIErrorCode.PromptValidationFailed,
        `Failed to render prompt '${id}@${prompt.version}'. Missing required parameters: ${missingParams.join(", ")}`,
        { missingParams, providedParams: Object.keys(parameters) }
      );
    }

    // Parameter injection using standard double curly braces replacement: {{parameterName}}
    let renderedText = prompt.template;
    Object.entries(parameters).forEach(([key, val]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      renderedText = renderedText.replace(regex, String(val));
    });

    return {
      text: renderedText,
      prompt
    };
  }

  /**
   * Returns all registered prompt IDs and their metadata.
   */
  public getRegisteredPromptsList(): Array<{ id: string; version: string; category: string; title: string }> {
    const list: Array<{ id: string; version: string; category: string; title: string }> = [];
    this.prompts.forEach((prompt) => {
      list.push({
        id: prompt.id,
        version: prompt.version,
        category: prompt.category,
        title: prompt.metadata.title
      });
    });
    return list;
  }

  /**
   * Register the entire 9-domain Operational Prompt Library into the registry.
   */
  private registerOperationalPromptLibrary(): void {
    for (const prompt of OPERATIONAL_PROMPT_LIBRARY) {
      this.registerPrompt(prompt);
    }
  }

  /**
   * Clean registry.
   */
  public clear(): void {
    this.prompts.clear();
  }
}
