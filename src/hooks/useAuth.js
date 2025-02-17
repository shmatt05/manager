import { useEffect, useState } from 'react';
import { auth, isFirebaseReady } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('[useAuth] Effect running, Firebase ready:', isFirebaseReady());
        
        if (!isFirebaseReady()) {
            console.log('[useAuth] Firebase not ready, waiting...');
            setLoading(true);
            return;
        }

        console.log('[useAuth] Setting up auth listener');
        let unsubscribed = false;

        try {
            const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                console.log('[useAuth] Auth state changed callback executing');
                console.log('[useAuth] Current user:', currentUser?.email);
                console.log('[useAuth] Unsubscribed flag:', unsubscribed);
                
                if (!unsubscribed) {
                    setUser(currentUser);
                    setLoading(false);
                }
            });

            return () => {
                console.log('[useAuth] Cleanup running');
                unsubscribed = true;
                unsubscribe();
            };
        } catch (error) {
            console.error('[useAuth] Error setting up auth listener:', error);
            setLoading(false);
        }
    }, []);

    console.log('[useAuth] Rendering with user:', user?.email);
    return { user, loading };
}; 