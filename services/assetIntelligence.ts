import { SmartAsset, ImageFile } from "../types";
import { db, auth, sanitizeData, collection, addDoc, serverTimestamp, updateDoc, doc } from "../lib/firebase";

export const AssetIntelligence = {
    async scanAsset(image: ImageFile): Promise<{
        tags: string[];
        colors: string[];
        description: string;
        category: string;
    }> {
        const res = await fetch('/api/ai/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: 'gemini',
                modelId: 'gemini-1.5-flash',
                body: {
                    contents: [{
                        parts: [
                            { inlineData: { data: image.base64, mimeType: image.mimeType } },
                            { text: `Analyze this image and extract:
                              1. 5-8 descriptive tags (keywords).
                              2. 3 dominant hex colors.
                              3. A one-sentence technical description.
                              4. A primary category (e.g., Photography, UI Design, Illustration, Branding).
                              
                              Return JSON:
                              {
                                "tags": string[],
                                "colors": string[],
                                "description": string,
                                "category": string
                              }` }
                        ]
                    }],
                    generationConfig: { responseMimeType: "application/json" }
                }
            }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Asset scan failed');
        }
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('') || '{}';
        return JSON.parse(text);
    },

    async saveSmartAsset(asset: Partial<SmartAsset>) {
        if (!auth.currentUser) throw new Error("Authentication required");
        const assetData = {
            ...asset,
            userId: auth.currentUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isFavorite: asset.isFavorite || false,
        };
        const docRef = await addDoc(collection(db, "vault_assets"), sanitizeData(assetData));
        return docRef.id;
    },

    async updateAssetNeuralData(assetId: string, neuralData: any) {
        const docRef = doc(db, "vault_assets", assetId);
        await updateDoc(docRef, sanitizeData({
            ...neuralData,
            updatedAt: serverTimestamp()
        }));
    }
};
