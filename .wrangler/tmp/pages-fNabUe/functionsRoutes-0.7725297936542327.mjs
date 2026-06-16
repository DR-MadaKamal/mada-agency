import { onRequest as __api_ai_call_ts_onRequest } from "D:\\OpenCode Files\\Mada Agency\\functions\\api\\ai\\call.ts"
import { onRequest as __api_ai_proxy_ts_onRequest } from "D:\\OpenCode Files\\Mada Agency\\functions\\api\\ai\\proxy.ts"

export const routes = [
    {
      routePath: "/api/ai/call",
      mountPath: "/api/ai",
      method: "",
      middlewares: [],
      modules: [__api_ai_call_ts_onRequest],
    },
  {
      routePath: "/api/ai/proxy",
      mountPath: "/api/ai",
      method: "",
      middlewares: [],
      modules: [__api_ai_proxy_ts_onRequest],
    },
  ]