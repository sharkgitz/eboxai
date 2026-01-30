import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Inbox as InboxIcon,
    Bot,
    LayoutDashboard,
    Settings,
    Terminal,
    Kanban as KanbanIcon,
    Bell,
    Calendar,
    HelpCircle,
    LogOut,
    Sparkles
} from 'lucide-react';
import { clsx } from 'clsx';

const Sidebar = () => {
    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: InboxIcon, label: 'Inbox', path: '/inbox', badge: 12 },
        { icon: KanbanIcon, label: 'Kanban', path: '/kanban' },
        { icon: Bell, label: 'Follow-Ups', path: '/followups' },
        { icon: Calendar, label: 'Meetings', path: '/meetings' },
    ];

    const generalItems = [
        { icon: Bot, label: 'Agent', path: '/agent' },
        { icon: Sparkles, label: 'Brain', path: '/prompts' },
        { icon: Terminal, label: 'Playground', path: '/playground' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    useEffect(() => {
        const checkConnection = async () => {
            try {
                await fetch(apiUrl);
                setStatus('connected');
            } catch (e) {
                setStatus('error');
            }
        };
        checkConnection();
    }, []);

    const NavItem = ({ item }: { item: typeof menuItems[0] }) => (
        <NavLink
            to={item.path}
            className={({ isActive }) =>
                clsx(
                    'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 relative',
                    isActive
                        ? 'bg-brand-50 text-brand-800 font-medium'
                        : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                )
            }
        >
            {({ isActive }) => (
                <>
                    {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-600 rounded-r-full" />
                    )}
                    <item.icon size={18} className={isActive ? 'text-brand-600' : ''} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-brand-100 text-brand-700 rounded-full">
                            {item.badge}
                        </span>
                    )}
                </>
            )}
        </NavLink>
    );

    return (
        <div className="w-[260px] h-screen bg-white flex flex-col border-r border-gray-200">
            {/* Logo */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                        <Bot size={20} className="text-white" />
                    </div>
                    <div>
                        <span className="text-lg font-bold text-text-primary">EboxAI</span>
                        <div className="flex items-center gap-1.5">
                            <div className={clsx(
                                "w-1.5 h-1.5 rounded-full",
                                status === 'connected' ? "bg-green-500" :
                                    status === 'error' ? "bg-red-500" : "bg-yellow-500"
                            )} />
                            <span className="text-xs text-text-tertiary">
                                {status === 'connected' ? 'Online' : status === 'error' ? 'Offline' : '...'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu Section */}
            <div className="flex-1 overflow-y-auto py-4 px-3">
                <div className="mb-6">
                    <span className="px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                        Menu
                    </span>
                    <nav className="mt-2 space-y-1">
                        {menuItems.map((item) => (
                            <NavItem key={item.path} item={item} />
                        ))}
                    </nav>
                </div>

                <div>
                    <span className="px-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                        General
                    </span>
                    <nav className="mt-2 space-y-1">
                        {generalItems.map((item) => (
                            <NavItem key={item.path} item={item} />
                        ))}
                    </nav>
                </div>
            </div>

            {/* Bottom Card */}
            <div className="p-4">
                <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-4 text-white">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={16} />
                        <span className="text-sm font-semibold">AI Powered</span>
                    </div>
                    <p className="text-xs text-brand-100 mb-3">
                        Your inbox is managed by Groq AI for lightning-fast responses.
                    </p>
                    <div className="text-xs font-mono text-brand-200 truncate">
                        v2.0 • {apiUrl.replace('https://', '').replace('http://', '')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
