// import React from 'react';
import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Inbox as InboxIcon, Brain, Bot, LayoutDashboard, Settings, Terminal, Kanban as KanbanIcon, Bell, Calendar } from 'lucide-react';
import { clsx } from 'clsx';

const Sidebar = () => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: InboxIcon, label: 'Inbox', path: '/inbox' },
        { icon: KanbanIcon, label: 'Kanban', path: '/kanban' },
        { icon: Bell, label: 'Follow-Ups', path: '/followups' },
        { icon: Calendar, label: 'Meetings', path: '/meetings' },
        { icon: Bot, label: 'Agent', path: '/agent' },
        { icon: Brain, label: 'Brain', path: '/prompts' },
        { icon: Terminal, label: 'Playground', path: '/playground' },
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

    return (
        <div className="w-[240px] h-screen bg-background text-text-secondary flex flex-col border-r border-border">
            <div className="p-4 mb-2">
                <div className="flex items-center gap-2 px-2 py-1">
                    <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center">
                        <Bot size={16} className="text-white" />
                    </div>
                    <span className="text-sm font-semibold text-text-primary tracking-tight">EmailAgent</span>
                </div>
            </div>

            <nav className="flex-1 px-2 space-y-0.5">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            clsx(
                                'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-all duration-200',
                                isActive
                                    ? 'bg-surfaceHighlight text-text-primary font-medium'
                                    : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                            )
                        }
                    >
                        <item.icon size={16} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-2 border-t border-border mt-auto space-y-2">
                <div className="px-3 py-1.5 bg-surfaceHighlight rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                        <div className={clsx("w-2 h-2 rounded-full",
                            status === 'connected' ? "bg-green-500" :
                                status === 'error' ? "bg-red-500" : "bg-yellow-500"
                        )} />
                        <span className="text-xs font-medium text-text-primary">
                            {status === 'connected' ? 'Online' : status === 'error' ? 'Offline' : 'Connecting...'}
                        </span>
                    </div>
                    <div className="text-[10px] text-text-tertiary truncate" title={apiUrl}>
                        {apiUrl}
                    </div>
                </div>
                <div className="px-3 text-[10px] text-text-tertiary">v1.2</div>
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        clsx(
                            'flex items-center gap-2.5 px-3 py-1.5 w-full rounded-md text-sm transition-colors',
                            isActive
                                ? 'bg-surfaceHighlight text-text-primary font-medium'
                                : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                        )
                    }
                >
                    <Settings size={16} />
                    <span>Settings</span>
                </NavLink>
            </div>
        </div>
    );
};

export default Sidebar;
