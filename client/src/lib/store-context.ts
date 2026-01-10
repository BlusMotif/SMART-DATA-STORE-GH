export interface StoreContext {
  type: "agent" | "main" | string;
  agentId?: string | null;
}

const AGENT_STORE_KEY = "agentStore";

export function getStoreContext(): StoreContext {
  const agent = localStorage.getItem(AGENT_STORE_KEY);
  if (agent) {
    return { type: "agent", agentId: agent };
  }
  return { type: "main" };
}

export function setAgentStore(agentId: string) {
  localStorage.setItem(AGENT_STORE_KEY, agentId);
}

export function clearAgentStore() {
  localStorage.removeItem(AGENT_STORE_KEY);
}

export function getAgentId(): string | null {
  return localStorage.getItem(AGENT_STORE_KEY);
}

export function isAgentContext(): boolean {
  return !!localStorage.getItem(AGENT_STORE_KEY);
}
