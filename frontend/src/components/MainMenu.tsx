import React from 'react';
import { NavLink } from 'react-router-dom';

const MainMenu: React.FC = () => {
    const linkStyle = ({ isActive }: { isActive: boolean }) => ({
        textDecoration: 'none',
        color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
        fontWeight: isActive ? 600 : 500,
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
        transition: 'all 0.2s'
    });

    return (
        <nav style={{
            height: '60px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            justifyContent: 'space-between'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <NavLink to="/jobs" style={linkStyle}>
                    Jobs
                </NavLink>
                <NavLink to="/admin" style={linkStyle}>
                    Admin
                </NavLink>
            </div>
        </nav>
    );
};

export default MainMenu;
