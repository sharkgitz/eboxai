import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div className="flex h-screen bg-background text-text-primary font-sans antialiased selection:bg-brand-500/30">
            <Sidebar />
            <main className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/5 via-transparent to-transparent pointer-events-none" />
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
