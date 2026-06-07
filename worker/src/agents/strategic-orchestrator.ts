import { Agent, callable } from "agents";

export type Capability = 'python' | 'vision' | 'orchestration' | 'rest_api' | 'code_interpreter';
export type AgentStatus = 'active' | 'standby' | 'training' | 'error';

export interface AgentMetrics {
  tasksCompleted: number;
  latency: string;
  uptime: number;
}

export type WorkflowStepStatus = 'pending' | 'active' | 'done';
export type WorkflowTrigger = 'event' | 'schedule' | 'manual';
export type WorkflowStatus = 'active' | 'paused' | 'failed' | 'deploying';

export interface WorkflowStep {
  action: string;
  agentId?: string;
  status: WorkflowStepStatus;
  connector?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  connectors: string[];
}

export interface State {
  name: string;
  role: string;
  status: AgentStatus;
  capabilities: Capability[];
  metrics: AgentMetrics;
  workflows: Workflow[];
  currentTask: string | null;
  logs: { timestamp: string; level: string; message: string }[];
}

export class StrategicOrchestrator extends Agent<Env, State> {
  initialState: State = {
    name: "Strategic Orchestrator",
    role: "Main Controller",
    status: "active",
    capabilities: ["orchestration", "python", "code_interpreter"],
    metrics: { tasksCompleted: 1240, latency: "240ms", uptime: 99.9 },
    workflows: [{
      id: "wf1",
      name: "Enterprise Sync",
      description: "Synchronizes agency leads with Salesforce and SAP",
      trigger: "manual",
      status: "active",
      steps: [
        { action: "Fetch Salesforce Leads", status: "done", connector: "Salesforce" },
        { action: "Process with AI Orchestrator", agentId: "master-agent", status: "active" },
        { action: "Update Internal Ledger", status: "pending", connector: "SAP" }
      ],
      connectors: ["Salesforce", "SAP"]
    }],
    currentTask: null,
    logs: [{ timestamp: new Date().toISOString(), level: "info", message: "Orchestrator initialized" }]
  };

  @callable()
  getState(): State {
    return this.state;
  }

  @callable()
  async executeTask(task: string): Promise<string> {
    const ts = new Date().toISOString();
    this.setState({
      ...this.state,
      currentTask: task,
      metrics: {
        ...this.state.metrics,
        tasksCompleted: this.state.metrics.tasksCompleted + 1,
      },
      logs: [...this.state.logs, { timestamp: ts, level: "info", message: `Executing: ${task}` }]
    });
    const result = `[${ts}] Task "${task}" completed via Strategic Orchestrator.`;
    return result;
  }

  @callable()
  async addWorkflow(workflow: Workflow): Promise<void> {
    this.setState({
      ...this.state,
      workflows: [...this.state.workflows, workflow],
      logs: [...this.state.logs, { timestamp: new Date().toISOString(), level: "info", message: `Workflow added: ${workflow.name}` }]
    });
  }

  @callable()
  async updateWorkflowStatus(workflowId: string, status: WorkflowStatus): Promise<void> {
    this.setState({
      ...this.state,
      workflows: this.state.workflows.map(w => w.id === workflowId ? { ...w, status } : w),
      logs: [...this.state.logs, { timestamp: new Date().toISOString(), level: "info", message: `Workflow ${workflowId} → ${status}` }]
    });
  }

  @callable()
  async logMessage(level: string, message: string): Promise<void> {
    this.setState({
      ...this.state,
      logs: [...this.state.logs, { timestamp: new Date().toISOString(), level, message }]
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.endsWith("__state")) {
      return new Response(JSON.stringify(this.state), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname.includes("__call/")) {
      const method = url.pathname.split("__call/")[1];
      const { args } = await request.json() as { args: any[] };
      if (method === "executeTask") {
        const result = await this.executeTask(args[0] as string);
        return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
      }
      if (method === "addWorkflow") {
        await this.addWorkflow(args[0] as any);
        return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
      }
      if (method === "updateWorkflowStatus") {
        await this.updateWorkflowStatus(args[0] as string, args[1] as any);
        return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
      }
      if (method === "logMessage") {
        await this.logMessage(args[0] as string, args[1] as string);
        return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: `Unknown method: ${method}` }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    return super.fetch(request);
  }
}
