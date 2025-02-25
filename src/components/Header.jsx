import React, { useState, useEffect, useRef } from 'react';
import { config } from '../config';
import { useAuth } from '../contexts/AuthContext';

function Header({ children, tabs, activeTab, onTabChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { user, signOut } = useAuth();
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    if (signOut) {
      signOut();
    }
    setMenuOpen(false);
  };

  return (
    <div>
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0.25rem 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Task Matrix</h1>
        
        {user && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.375rem',
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: '#f0f0f0',
                width: '1.75rem',
                height: '1.75rem',
                justifyContent: 'center',
                fontSize: '0.875rem'
              }}
            >
              {user.email ? user.email[0].toUpperCase() : 'U'}
            </button>

            {menuOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 0.25rem)',
                right: 0,
                backgroundColor: 'white',
                borderRadius: '0.375rem',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                minWidth: '200px',
                zIndex: 50
              }}>
                <div style={{
                  padding: '0.5rem 0.75rem',
                  borderBottom: '1px solid #e5e7eb',
                  color: '#666',
                  fontSize: '0.875rem'
                }}>
                  {user.email}
                </div>
                <button
                  onClick={handleSignOut}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    color: '#dc2626',
                    fontSize: '0.875rem'
                  }}
                  onMouseEnter={e => e.target.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <div style={{
        padding: '5px 1rem',
        backgroundColor: 'white',
      }}>
        {children} {/* TaskCreate component centered */}
      </div>

      <nav style={{ 
        display: 'flex', 
        gap: '1rem',
        padding: '5px 1rem 0',
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
      }}>
        {tabs.map(tab => {
          // Fix the style conflict by using separate style objects
          const baseStyle = {
            padding: '0.25rem 0',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: activeTab === tab.id ? '#2563eb' : '#6b7280',
            background: 'none',
            borderTop: 'none',
            borderRight: 'none',
            borderLeft: 'none',
            borderBottomWidth: '2px',
            borderBottomStyle: 'solid',
            borderBottomColor: activeTab === tab.id ? '#2563eb' : 'transparent',
            cursor: 'pointer'
          };
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={baseStyle}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default Header; 