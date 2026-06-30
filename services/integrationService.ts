import { db, auth, collection, query, where, getDocs } from '../lib/firebase';

export interface AiCallParams {
    prompt: string;
    systemInstruction?: string;
    history?: { role: string; content: string }[];
    signal?: AbortSignal;
}

export class IntegrationService {
    /**
     * Finds the first active integration for a specific provider
     */
    static async getActiveIntegration(provider: 'gemini' | 'openai' | 'anthropic' | 'deepseek') {
        const q = query(
            collection(db, 'integrations'), 
            where('provider', '==', provider),
            where('status', '==', 'active')
        );
        const snap = await getDocs(q);
        if (snap.empty) return null;
        return { id: snap.docs[0].id, ...snap.docs[0].data() };
    }

    /**
     * Calls an AI service through our secure server proxy
     */
    static async callAi(integrationId: string, params: AiCallParams, config?: any) {
        const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
        
        let accessToken: string | undefined;
        try {
            const { getAccessToken: getGoogleToken } = await import('../lib/googleAuth');
            accessToken = getGoogleToken() || undefined;
        } catch {}
        
        const body: any = {
            integrationId,
            payload: params,
            accessToken,
        };
        if (config) {
            body.config = config;
        }

        const response = await fetch('/api/ai/call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
                'x-user-id': auth.currentUser?.uid || 'anonymous'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to call AI service');
        }

        return response.json();
    }

    /**
     * Intelligent fallback: Tries user-configured integrations first,
     * then falls back to internal environment variables if configured.
     */
    static async smartCall(provider: 'gemini' | 'openai' | 'anthropic' | 'deepseek' | 'custom' | 'external', params: AiCallParams, customConfig?: any) {
        if ((provider === 'custom' || provider === 'external') && customConfig) {
            console.log(`Using custom integration: ${customConfig.name || 'unnamed'}`);
            return this.callAi('custom_' + Date.now(), params, customConfig);
        }

        const integration = await this.getActiveIntegration(provider as any);
        
        if (integration) {
            const intData = integration as any;
            console.log(`Using custom integration: ${intData.name}`);
            return this.callAi(integration.id, params);
        }

        // System fallback
        console.log(`Using system fallback for: ${provider}`);
        return this.callAi(`system_${provider}`, params);
    }
}
