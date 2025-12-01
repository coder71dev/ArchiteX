export interface ProjectBlueprint {
  id: string;
  title: string;
  overview: string;
  strategy: {
    decision: string;
    tradeoffs: string[];
  };
  scope: {
    mvp: string[];
    v1: string[];
    future: string[];
  };
  architecture: {
    hldMermaid: string; // System Context / Cloud
    dbMermaid: string; // ER Diagram
    frontendMermaid: string; // User Flow
  };
  componentDetails: ComponentDetail[];
  techStack: {
    category: string;
    items: string[];
  }[];
  roadmap: {
    phase: string;
    timeline: string;
    milestones: string[];
  }[];
  reliabilityScore: number;
}

export interface ComponentDetail {
  name: string;
  type: string;
  description: string;
  tech: string;
  interfaceSpec?: string; // Short pseudo-code interface or API signature
}

export interface ChaosEvent {
  targetComponent: string;
  failureType: string;
  symptoms: string[];
  mitigationStrategy: string;
  severity: 'low' | 'medium' | 'critical';
}

export interface GeneratedCode {
  filename: string;
  code: string;
  language: string;
  explanation: string;
}

export enum AppState {
  IDLE,
  GENERATING_BLUEPRINT,
  VIEWING_BLUEPRINT,
  SIMULATING_CHAOS,
  CHAOS_REPORT,
  GENERATING_CODE,
  VIEWING_CODE
}

export type BlueprintTab = 'overview' | 'scope' | 'data' | 'flow' | 'components' | 'roadmap';