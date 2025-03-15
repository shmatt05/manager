import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { signIn } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-center mb-2">
          <span style={{ fontFamily: "'VT323', monospace", fontSize: '3rem', color: '#2563eb' }}>
            TØ
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-4">Welcome to Task Zero</h1>
        <button 
          onClick={signIn}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
} 