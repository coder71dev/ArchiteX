import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ProjectBlueprint, ChaosEvent, GeneratedCode } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = "gemini-2.5-flash";

const blueprintSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    overview: { type: Type.STRING },
    strategy: {
      type: Type.OBJECT,
      properties: {
        decision: { type: Type.STRING, description: "Main architectural style chosen (e.g., Microservices, Monolith, Serverless) and why." },
        tradeoffs: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    scope: {
      type: Type.OBJECT,
      properties: {
        mvp: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Feature Freeze: Must-have features for launch (MVP)." },
        v1: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Feature Freeze: Fast-follow features (v1.0)." },
        future: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    architecture: {
      type: Type.OBJECT,
      properties: {
        hldMermaid: { type: Type.STRING, description: "Mermaid graph TD. High Level Design (System Context)." },
        dbMermaid: { type: Type.STRING, description: "Mermaid erDiagram. Database Modeling." },
        frontendMermaid: { type: Type.STRING, description: "Mermaid graph LR or sequenceDiagram. Frontend/Client Apps Flow Design." }
      }
    },
    componentDetails: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING, description: "Service, Database, Queue, Frontend, etc." },
          description: { type: Type.STRING },
          tech: { type: Type.STRING },
          interfaceSpec: { type: Type.STRING, description: "Low Level Design (LLD): Pseudo-code class definition or API signature." }
        }
      }
    },
    techStack: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "e.g., Frontend, Backend, DevOps, Standards" },
          items: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    },
    roadmap: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phase: { type: Type.STRING },
          timeline: { type: Type.STRING },
          milestones: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    },
    reliabilityScore: { type: Type.NUMBER }
  },
  required: ["title", "overview", "strategy", "scope", "architecture", "componentDetails", "techStack", "roadmap", "reliabilityScore"]
};

const chaosSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    targetComponent: { type: Type.STRING },
    failureType: { type: Type.STRING },
    symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
    mitigationStrategy: { type: Type.STRING },
    severity: { type: Type.STRING, enum: ["low", "medium", "critical"] }
  },
  required: ["targetComponent", "failureType", "symptoms", "mitigationStrategy", "severity"]
};

const codeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    filename: { type: Type.STRING },
    code: { type: Type.STRING },
    language: { type: Type.STRING },
    explanation: { type: Type.STRING }
  },
  required: ["filename", "code", "language", "explanation"]
};

export const generateBlueprint = async (prompt: string): Promise<ProjectBlueprint> => {
  const fullPrompt = `You are a Principal Software Architect. Create a comprehensive Engineering Blueprint for: "${prompt}".
  
  You MUST strictly cover these 8 dimensions:
  1. Feature Scope Freeze (MVP vs v1.0)
  2. Strategy Decision (Tradeoffs)
  3. High Level Architecture (HLD)
  4. Database Modeling (ER Diagram)
  5. Low Level Design (LLD Components & Interfaces)
  6. Tech Stack Standards
  7. Frontend/Client Apps Flow Design
  8. Roadmap and Sprint Planning
  
  CRITICAL MERMAID GENERATION RULES:
  1. ALWAYS use quotes for node labels. Example: Node["Label Text (Info)"]
  2. NEVER put the node definition on the same line as "graph TD". Always use a new line.
     - CORRECT:
       graph TD
       A["Node"]
     - INCORRECT: graph TD A["Node"]
  3. Use <br/> for line breaks inside strings. Do NOT use \\n inside quotes.
  4. Do NOT use special characters outside of quotes.
  
  Return a strictly structured JSON.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: fullPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: blueprintSchema,
      systemInstruction: "You are ArchiteX, a world-class system architect AI. You prioritize technical accuracy and clarity."
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  
  const data = JSON.parse(text);
  return { ...data, id: crypto.randomUUID() };
};

export const simulateChaos = async (design: ProjectBlueprint): Promise<ChaosEvent> => {
  const componentList = design.componentDetails.map(c => c.name).join(", ");
  const fullPrompt = `Simulate a chaos engineering failure for this system: "${design.title}". Components: ${componentList}. Pick one critical failure.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: fullPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: chaosSchema,
    }
  });

   const text = response.text;
  if (!text) throw new Error("No response from Gemini");

  return JSON.parse(text);
};

export const generateComponentCode = async (componentName: string, tech: string, context: string): Promise<GeneratedCode> => {
    const fullPrompt = `Write the core boilerplate/scaffold code for component "${componentName}" using "${tech}".
    Context: ${context}
    Provide a single important file (e.g. main.go, schema.sql, Dockerfile).`;

    const response = await ai.models.generateContent({
        model: modelName,
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: codeSchema
        }
    });
    
    return JSON.parse(response.text!);
}

export const explainLikeImFive = async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: `Explain this tech concept to a 5 year old: \n\n${text}`,
    });
    return response.text || "Could not translate.";
}