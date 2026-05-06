
import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, onSnapshot, serverTimestamp, query, where, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

const PresenceSystem: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const presenceRef = doc(db, 'presence', user.uid);
    
    // Set presence
    const setPresence = async () => {
      await setDoc(presenceRef, {
        uid: user.uid,
        email: user.email,
        lastSeen: serverTimestamp(),
        activeStudio: window.location.pathname // Simplified
      });
    };

    setPresence();
    const interval = setInterval(setPresence, 30000); // Heartbeat every 30s

    // Real-time listener for others
    const q = query(collection(db, 'presence'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeUsers = snapshot.docs
        .map(doc => doc.data())
        .filter(data => {
            // Only show users seen in the last 2 minutes
            if (!data.lastSeen) return false;
            const lastSeen = data.lastSeen.toDate ? data.lastSeen.toDate() : new Date(data.lastSeen);
            return (Date.now() - lastSeen.getTime()) < 120000;
        });
      setUsers(activeUsers);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
      // Normally we'd delete the doc on logout, but for now we rely on the 2min filter
    };
  }, []);

  return (
    <div className="flex -space-x-3 items-center group">
      <AnimatePresence>
        {users.map((u, i) => (
          <motion.div
            key={u.uid}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0 }}
            className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-[10px] font-black text-white relative group/avatar cursor-default`}
            style={{ 
                backgroundColor: i % 2 === 0 ? 'var(--color-accent)' : '#4f46e5',
                zIndex: users.length - i 
            }}
          >
            {u.email?.[0].toUpperCase()}
            {/* Tooltip */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                <span className="text-[8px] uppercase tracking-widest">{u.email}</span>
            </div>
            {/* Pulse */}
            {i === 0 && (
                <div className="absolute inset-0 rounded-full bg-[var(--color-accent)] animate-ping opacity-20 pointer-events-none" />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      {users.length > 0 && (
        <div className="pl-6 text-[8px] font-black text-white/40 uppercase tracking-[0.2em] group-hover:text-[var(--color-accent)] transition-colors">
            {users.length} Active Neural Splicers
        </div>
      )}
    </div>
  );
};

export default PresenceSystem;
