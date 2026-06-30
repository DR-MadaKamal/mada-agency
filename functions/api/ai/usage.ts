interface Env {
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  DEEPSEEK_API_KEY?: string;
  GROQ_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  MISTRAL_API_KEY?: string;
}

async function checkOpenRouter(key: string): Promise<{ usage: number | null; usageMonthly: number | null; limitRemaining: number | null; isFreeTier: boolean | null; error?: string }> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return { usage: null, usageMonthly: null, limitRemaining: null, isFreeTier: null, error: `HTTP ${res.status}` };
    const data: any = await res.json();
    return {
      usage: data.data?.usage ?? null,
      usageMonthly: data.data?.usage_monthly ?? null,
      limitRemaining: data.data?.limit_remaining ?? null,
      isFreeTier: data.data?.is_free_tier ?? null,
    };
  } catch (err: any) {
    return { usage: null, usageMonthly: null, limitRemaining: null, isFreeTier: null, error: err.message };
  }
}

export const onRequest: any = async (context: any) => {
  const { env } = context;
  const e = env as Env;

  const providers = [
    { id: 'gemini', label: 'Gemini', key: e.GEMINI_API_KEY, available: true },
    { id: 'openai', label: 'OpenAI', key: e.OPENAI_API_KEY, available: true },
    { id: 'deepseek', label: 'DeepSeek', key: e.DEEPSEEK_API_KEY, available: true },
    { id: 'groq', label: 'Groq', key: e.GROQ_API_KEY, available: true },
    { id: 'openrouter', label: 'OpenRouter', key: e.OPENROUTER_API_KEY, available: true },
    { id: 'mistral', label: 'Mistral', key: e.MISTRAL_API_KEY, available: true },
    { id: 'anthropic', label: 'Anthropic', key: e.ANTHROPIC_API_KEY, available: false },
  ];

  const results: any[] = [];

  for (const p of providers) {
    const entry: any = { provider: p.id, label: p.label, keyConfigured: !!p.key, available: p.available };

    if (!p.key) {
      entry.status = 'no-key';
      results.push(entry);
      continue;
    }

    if (p.id === 'openrouter') {
      const or = await checkOpenRouter(p.key);
      entry.usage = or.usage;
      entry.usageMonthly = or.usageMonthly;
      entry.limitRemaining = or.limitRemaining;
      entry.isFreeTier = or.isFreeTier;
      entry.status = or.error ? 'error' : 'ok';
      if (or.error) entry.error = or.error;
    } else if (p.id === 'deepseek') {
      try {
        const res = await fetch('https://api.deepseek.com/user/balance', {
          headers: { Authorization: `Bearer ${p.key}` },
        });
        if (res.ok) {
          const data: any = await res.json();
          entry.balance = data.balance_infos?.[0]?.total_balance ?? null;
          entry.status = 'ok';
        } else {
          entry.status = 'error';
          entry.error = `HTTP ${res.status}`;
        }
      } catch (err: any) {
        entry.status = 'error';
        entry.error = err.message;
      }
    } else if (p.id === 'openai') {
      try {
        const res = await fetch('https://api.openai.com/v1/dashboard/billing/subscription', {
          headers: { Authorization: `Bearer ${p.key}` },
        });
        if (res.ok) {
          const data: any = await res.json();
          entry.hasPaymentMethod = data.has_payment_method ?? null;
          entry.planType = data.plan?.title ?? null;
          entry.softLimit = data.soft_limit_usd ?? null;
          entry.hardLimit = data.hard_limit_usd ?? null;
          entry.status = 'ok';
        } else {
          entry.status = 'no-access';
          entry.error = `Billing API requires org-level key`;
        }
      } catch (err: any) {
        entry.status = 'error';
        entry.error = err.message;
      }
    } else {
      entry.status = 'no-api';
    }

    results.push(entry);
  }

  return new Response(JSON.stringify({ providers: results }, null, 2), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};
