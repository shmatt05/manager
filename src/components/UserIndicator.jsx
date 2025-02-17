import React from 'react';
import { useAuth } from '../hooks/useAuth'; // Custom hook to get user info
import { auth } from '../firebase'; // Import Firebase auth
import { signOut } from 'firebase/auth'; // Import signOut function

const UserIndicator = () => {
    const { user } = useAuth(); // Assuming you have a hook to get the current user

    if (!user) return null; // Don't render if no user is logged in

    const handleLogout = async () => {
        try {
            await signOut(auth); // Sign out the user
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <div className="user-indicator">
            <p>Logged in as: {user.email}</p>
            <button onClick={handleLogout} className="logout-button">
                Logout
            </button>
        </div>
    );
};

export default UserIndicator; 