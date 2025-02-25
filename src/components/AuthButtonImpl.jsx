import { useAuth } from '../contexts/AuthContext';

const AuthButtonImpl = () => {
  const { user, signIn, signOut } = useAuth();

  if (!signIn || !signOut) {
    return null;
  }

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      // Handle sign in error
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      // Handle sign out error
    }
  };

  return user ? (
    <button onClick={handleSignOut}>
      Sign Out ({user.email})
    </button>
  ) : (
    <button onClick={handleSignIn}>
      Sign In
    </button>
  );
};

export default AuthButtonImpl; 