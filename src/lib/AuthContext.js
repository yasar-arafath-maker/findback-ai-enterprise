// Re-export shim: AuthContext lives in src/context/AuthContext.jsx
// Multiple files import from '@/lib/AuthContext' so this shim ensures compatibility
export { AuthProvider, useAuth } from '@/context/AuthContext';
export { default } from '@/context/AuthContext';
