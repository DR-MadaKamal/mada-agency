
import { GoogleGenAI } from "@google/genai";
import { SmartAsset, ImageFile } from "../types";
import { db, auth, sanitizeData } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const AssetIntelligence = {
    /**
     * Scans an image and extracts neural metadata
     */
    async scanAsset(image: ImageFile): Promise<{
        tags: string[];
        colors: string[];
        description: string;
        category: string;
    }> {
        const response = await genAI.models.generateContent({
            model: "gemini-1.5-flash",
            contents: {
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
            },
            config: { responseMimeType: "application/json" }
        });

        return JSON.parse(response.text || '{}');
    },

    /**
     * Saves a smart asset to the Nexus Vault
     */
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

    /**
     * Updates an existing asset with new neural data
     */
    async updateAssetNeuralData(assetId: string, neuralData: any) {
        const docRef = doc(db, "vault_assets", assetId);
        await updateDoc(docRef, sanitizeData({
            ...neuralData,
            updatedAt: serverTimestamp()
        }));
    }
};
