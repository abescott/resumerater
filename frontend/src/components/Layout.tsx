import React from 'react';
import Sidebar from './Sidebar';
import MainMenu from './MainMenu';

interface LayoutProps {
    children: React.ReactNode;
    withSidebar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, withSidebar = true }) => {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <MainMenu />
            <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
                {withSidebar && <Sidebar />}

                <main style={{
                    flex: 1,
                    marginLeft: withSidebar ? '280px' : '0',
                    padding: '2rem',
                    width: withSidebar ? 'calc(100% - 280px)' : '100%',
                    maxWidth: '100%'
                }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
