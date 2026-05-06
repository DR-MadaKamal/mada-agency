import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import * as admin from 'firebase-admin';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: admin.firestore.Firestore | null = null;

function getDb() {
    if (!db) {
        const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
        let firebaseConfig: any = {};
        if (fs.existsSync(configPath)) {
            try {
                firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            } catch (e) {
                console.error('Failed to parse firebase-applet-config.json:', e);
            }
        }

        if (firebaseConfig.projectId && !admin.apps.length) {
            console.log('Initializing Firebase Admin...');
            try {
                admin.initializeApp({
                    projectId: firebaseConfig.projectId,
                });
            } catch (e) {
                console.error('Firebase Admin init failed:', e);
            }
        }
        db = admin.firestore();
    }
    return db;
}

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';

// ... (existing getDb function)

async function startServer() {
    console.log('Starting server process...');
    
    const app = express();
    app.use(express.json());
    const PORT = 3000;

    // --- API ROUTES ---
    console.log('Registering API routes...');

    // Proxy for AI calls
    app.post('/api/ai/call', async (req, res) => {
        const database = getDb();
        if (!database) {
            return res.status(500).json({ error: 'Database not initialized' });
        }
        const { integrationId, payload } = req.body;
        const startTime = Date.now();

        try {
            let integration: any = null;
            let apiKey = '';
            let provider = '';
            let modelId = '';

            if (integrationId.startsWith('system_')) {
                // System fallback using environment variables
                provider = integrationId.replace('system_', '');
                apiKey = process.env[`${provider.toUpperCase()}_API_KEY`] || '';
                modelId = payload.model || (provider === 'gemini' ? 'gemini-1.5-flash' : (provider === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20240620'));
            } else {
                // Fetch integration from Firestore
                const intDoc = await database.collection('integrations').doc(integrationId).get();
                if (!intDoc.exists) {
                    return res.status(404).json({ error: 'Integration not found' });
                }

                integration = intDoc.data();
                if (integration?.status !== 'active') {
                    return res.status(403).json({ error: 'Integration is disabled' });
                }

                provider = integration.provider;
                apiKey = integration.apiKey || process.env[`${provider.toUpperCase()}_API_KEY`];
                modelId = integration.modelId || payload.model;
            }

            if (!apiKey) {
                return res.status(400).json({ error: `API Key for ${provider} not found in configuration.` });
            }

            // 2. Perform the actual API call
            let messageContent = '';
            let status = 200;

            if (provider === 'openai') {
                const openai = new OpenAI({ apiKey });
                const completion = await openai.chat.completions.create({
                    model: modelId || 'gpt-4o',
                    messages: [
                        ...(payload.systemInstruction ? [{ role: 'system' as const, content: payload.systemInstruction }] : []),
                        ...(payload.history || []).map((h: any) => ({ role: h.role, content: h.content })),
                        { role: 'user', content: payload.prompt }
                    ]
                });
                messageContent = completion.choices[0].message.content || '';
            } else if (provider === 'anthropic') {
                const anthropic = new Anthropic({ apiKey });
                const msg = await anthropic.messages.create({
                    model: modelId || 'claude-3-5-sonnet-20240620',
                    max_tokens: 4096,
                    system: payload.systemInstruction,
                    messages: [
                        ...(payload.history || []).filter((h: any) => h.role !== 'system').map((h: any) => ({ role: h.role === 'assistant' ? 'assistant' as const : 'user' as const, content: h.content })),
                        { role: 'user', content: payload.prompt }
                    ]
                });
                const content = msg.content[0];
                messageContent = content.type === 'text' ? content.text : '';
            } else if (provider === 'gemini' || provider === 'google') {
                const genAI = new GoogleGenAI({ apiKey });
                const response = await genAI.models.generateContent({
                    model: modelId || 'gemini-3-flash-preview',
                    contents: [
                        ...(payload.systemInstruction ? [{ role: 'user', parts: [{ text: `System Instruction: ${payload.systemInstruction}` }] }] : []),
                        ...(payload.history || []).map((h: any) => ({
                            role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
                            parts: [{ text: h.content }]
                        })),
                        { role: 'user', parts: [{ text: payload.prompt }] }
                    ]
                });
                messageContent = response.text || '';
            } else {
                throw new Error(`Integration provider ${provider} not implemented in proxy.`);
            }

            // 3. Log the call
            await database.collection('apiLogs').add({
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                service: integration?.name || `System:${provider}`,
                status: status,
                responseTime: Date.now() - startTime,
                userId: req.headers['x-user-id'] || 'anonymous'
            });

            res.json({ message: messageContent, provider: provider });

        } catch (error) {
            console.error('API Proxy Error:', error);
            
            try {
                await database.collection('apiLogs').add({
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    service: 'Proxy Service',
                    status: 500,
                    error: error instanceof Error ? error.message : String(error),
                    responseTime: Date.now() - startTime
                });
            } catch (logErr) {
                console.error('Logging failed:', logErr);
            }

            res.status(500).json({ error: error instanceof Error ? error.message : 'Internal Server Error' });
        }
    });

    // --- VITE MIDDLEWARE ---
    if (process.env.NODE_ENV !== "production") {
        console.log('Setting up Vite middleware...');
        const vite = await createViteServer({
            server: { 
                middlewareMode: true,
                hmr: false 
            },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
}

startServer().catch(err => {
    console.error('SERVER FATAL ERROR:', err);
});
