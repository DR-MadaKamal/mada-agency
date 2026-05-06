import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export interface AiCallParams {
    prompt: string;
    systemInstruction?: string;
    history?: { role: string; content: string }[];
}

export class IntegrationService {
    /**
     * Finds the first active integration for a specific provider
     */
    static async getActiveIntegration(provider: 'gemini' | 'openai' | 'anthropic') {
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
    static async callAi(integrationId: string, params: AiCallParams) {
        const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
        
        const response = await fetch('/api/ai/call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
                'x-user-id': auth.currentUser?.uid || 'anonymous'
            },
            body: JSON.stringify({
                integrationId,
                payload: params
            })
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
    static async smartCall(provider: 'gemini' | 'openai' | 'anthropic', params: AiCallParams) {
        const integration = await this.getActiveIntegration(provider);
        
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
