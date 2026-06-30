interface Env {
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  SYNC_API_KEY?: string;
  StrategicOrchestrator: DurableObjectNamespace;
  KnowledgeMiner: DurableObjectNamespace;
  NexusAssistant: DurableObjectNamespace;
  mada_agency_db: D1Database;
}
