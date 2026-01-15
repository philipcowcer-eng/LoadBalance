import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginPage = ({ onSuccess }) => {
    const { login, register } = useAuth();
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegistering) {
                await register(username, password);
            } else {
                await login(username, password);
            }
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '1rem'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2.5rem',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                {/* Logo / Brand */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#1E293B',
                        marginBottom: '0.5rem'
                    }}>
                        goodenough.to
                    </h1>
                    <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
                        | Planning
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: '#374151'
                        }}>
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                boxSizing: 'border-box'
                            }}
                            placeholder="Enter your username"
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: '#374151'
                        }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                boxSizing: 'border-box'
                            }}
                            placeholder="Enter your password"
                        />
                    </div>

                    {error && (
                        <div style={{
                            background: '#FEF2F2',
                            color: '#DC2626',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            fontSize: '0.875rem',
                            border: '1px solid #FECACA'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            background: loading ? '#9CA3AF' : '#2563EB',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        {loading ? 'Please wait...' : (isRegistering ? 'Create Account' : 'Sign In')}
                    </button>
                </form>

                {/* Toggle */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid #E2E8F0'
                }}>
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#2563EB',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        {isRegistering
                            ? 'Already have an account? Sign in'
                            : 'Need an account? Create one'}
                    </button>
                </div>

                {/* First user hint */}
                {isRegistering && (
                    <p style={{
                        textAlign: 'center',
                        marginTop: '1rem',
                        fontSize: '0.75rem',
                        color: '#94A3B8'
                    }}>
                        First user registered becomes Admin
                    </p>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
