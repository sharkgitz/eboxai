import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div className="flex h-screen bg-background text-text-primary font-sans antialiased selection:bg-brand-500/30 overflow-hidden relative">
            {/* Ambient Background Orbs - Intensified for Glass Contrast */}
            <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[100px] pointer-events-none z-0 mix-blend-multiply" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/30 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-multiply" />
            <div className="fixed top-[40%] left-[20%] w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-multiply" />

            {/* Sidebar with Glass Effect */}
            <div className="relative z-20 h-full">
                <Sidebar />
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden relative z-10 bg-transparent">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
