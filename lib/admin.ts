
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, orderBy, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { GlobalHistoryItem, Integration, UnifiedProject } from '../types';

/**
 * Logs a neural generation event to the global history.
 */
export const logHistory = async (item: Omit<GlobalHistoryItem, 'id' | 'userId' | 'userEmail' | 'timestamp'>) => {
    const path = 'history';
    try {
        const user = auth.currentUser;
        if (!user) return;

        let content = item.content;
        
        // Handle images specifically if too large - ensure they fit in Firestore
        if (content && typeof content === 'string' && content.startsWith('data:image') && content.length > 60000) {
            try {
                // Dynamic import to avoid circular dependency
                const { createThumbnail } = await import('../utils');
                content = await createThumbnail(content, 400);
            } catch (e) {
                // Fallback if thumbnailing fails
                if (content.length > 900000) {
                    content = " (Large image asset logged) ";
                }
            }
        } else if (content && typeof content === 'string' && content.startsWith('data:audio') && content.length > 600000) {
            // Audio files are even more prone to doc size limits - truncate aggressively
            content = "(Audio file too large for history log)";
        } else if (content && typeof content === 'string' && content.length > 900000) {
            content = content.substring(0, 900000) + '... (truncated)';
        }

        await addDoc(collection(db, path), {
            ...item,
            content,
            userId: user.uid,
            userEmail: user.email || 'anonymous',
            timestamp: serverTimestamp()
        });
    } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
    }
};

/**
 * Logs an API interaction.
 */
export const logApiInteraction = async (service: string, status: number, responseTime?: number, error?: string) => {
    const path = 'apiLogs';
    try {
        const user = auth.currentUser;
        await addDoc(collection(db, path), {
            service,
            status,
            responseTime,
            error,
            userId: user?.email || 'system',
            timestamp: serverTimestamp()
        });
    } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
    }
};

/**
 * Fetches all unified projects for the current user.
 */
export const fetchUnifiedProjects = async (): Promise<UnifiedProject[]> => {
    const path = 'projects';
    try {
        const user = auth.currentUser;
        if (!user) return [];

        const q = query(
            collection(db, path),
            where('ownerId', '==', user.uid),
            orderBy('updatedAt', 'desc')
        );

        const snap = await getDocs(q);
        return snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as UnifiedProject[];
    } catch (err) {
        handleFirestoreError(err, OperationType.LIST, path);
        return [];
    }
};

/**
 * Saves/Updates a unified project.
 */
export const saveUnifiedProject = async (project: Partial<UnifiedProject> & { id?: string }) => {
    const path = 'projects';
    try {
        const user = auth.currentUser;
        if (!user) return;

        // Strip heavy state from persistency - they are session only or need limiting
        const { undoStack, redoStack, ...rest } = project as any;
        
        // Sanitize arrays to prevent document bloat
        if (Array.isArray(rest.history)) rest.history = rest.history.slice(0, 8);
        if (Array.isArray(rest.results)) rest.results = rest.results.slice(0, 8);
        if (Array.isArray(rest.scenes)) rest.scenes = rest.scenes.slice(0, 12);
        if (Array.isArray(rest.ideas)) rest.ideas = rest.ideas.slice(0, 10);
        if (Array.isArray(rest.baseImages)) rest.baseImages = rest.baseImages.slice(0, 6);
        if (Array.isArray(rest.globalLayers)) rest.globalLayers = rest.globalLayers.slice(0, 10);

        const data = {
            status: 'active',
            progress: 0,
            priority: 'medium',
            ...rest,
            ownerId: user.uid,
            updatedAt: serverTimestamp(),
        };

        if (project.id) {
            const docRef = doc(db, path, project.id);
            await setDoc(docRef, data, { merge: true });
        } else {
            await addDoc(collection(db, path), {
                ...data,
                createdAt: serverTimestamp(),
                tags: project.tags || [],
                isFavorite: false
            });
        }
    } catch (err) {
        handleFirestoreError(err, project.id ? OperationType.UPDATE : OperationType.CREATE, project.id ? `${path}/${project.id}` : path);
    }
};

/**
 * Deletes a project from the nexus.
 */
export const deleteUnifiedProject = async (projectId: string) => {
    const path = `projects/${projectId}`;
    try {
        await deleteDoc(doc(db, 'projects', projectId));
    } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
    }
};

/**
 * Batch updates projects using atomic writes.
 */
export const batchUpdateProjects = async (projectIds: string[], updates: Partial<UnifiedProject>) => {
    const path = 'projects';
    try {
        const batch = writeBatch(db);
        projectIds.forEach(id => {
            const docRef = doc(db, path, id);
            batch.set(docRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
        });
        await batch.commit();
    } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
    }
};

/**
 * Fetches global neural history logs.
 */
export const fetchGlobalHistory = async (limitCount: number = 50): Promise<GlobalHistoryItem[]> => {
    const path = 'history';
    try {
        const user = auth.currentUser;
        if (!user) return [];

        const q = query(
            collection(db, path),
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const snap = await getDocs(q);
        return snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate()?.toISOString() || new Date().toISOString()
        })) as GlobalHistoryItem[];
    } catch (err) {
        handleFirestoreError(err, OperationType.LIST, path);
        return [];
    }
};

/**
 * Fetches the active integration for a provider.
 */
export const getActiveIntegration = async (provider: string): Promise<Integration | null> => {
    const path = 'integrations';
    try {
        const q = query(
            collection(db, path),
            where('provider', '==', provider),
            where('status', '==', 'active'),
            orderBy('updatedAt', 'desc'),
            limit(1)
        );
        const snap = await getDocs(q);
        if (snap.empty) return null;
        return { id: snap.docs[0].id, ...snap.docs[0].data() } as Integration;
    } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
        return null;
    }
};
