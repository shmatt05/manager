import { useAuth } from '../contexts/AuthContext';
import { config } from '../config';

export default function AuthButton() {
  const { user, signIn, signOut, loading } = useAuth();
  
  // Only show auth button in production with Firebase enabled
  if (!config.useFirebase) {
    return null;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? (
    <button onClick={signOut} className="px-4 py-2 text-gray-600 hover:text-gray-800">
      Sign Out {user.email && `(${user.email})`}
    </button>
  ) : (
    <button onClick={signIn} className="px-4 py-2 text-blue-600 hover:text-blue-800">
      Sign In
    </button>
  );
} 