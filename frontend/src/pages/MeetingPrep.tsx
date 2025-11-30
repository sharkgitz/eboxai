import { useEffect, useState } from 'react';
import { meetingsApi } from '../api';
import { Calendar, Clock, FileText, Users, Sparkles, Brain } from 'lucide-react';
import { clsx } from 'clsx';

interface Meeting {
    id: string;
    title: string;
    datetime: string;
    participants: string[];
    source_email_id: string;
    status: string;
}

interface MeetingBrief {
    summary: string;
    key_points: string[];
    suggested_talking_points: string[];
    sentiment: string;
}

const MeetingPrep = () => {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [brief, setBrief] = useState<MeetingBrief | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        try {
            const res = await meetingsApi.getAll();
            console.log("Meetings Data:", res.data);
            setMeetings(res.data);
            if (res.data.length > 0) {
                // Don't auto-select, let user choose
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const generateBrief = async (meeting: Meeting) => {
        setSelectedMeeting(meeting);
        setBrief(null);
        setGenerating(true);

        try {
            const res = await meetingsApi.generateBrief(meeting.id);
            setBrief(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center text-text-tertiary">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mr-2" />
                Loading meetings...
            </div>
        );
    }

    return (
        <div className="p-6 h-full flex gap-6">
            {/* Sidebar List */}
            <div className="w-1/3 flex flex-col gap-4">
                <header className="mb-2">
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <Calendar className="text-brand-500" />
                        Upcoming Meetings
                    </h1>
                    <p className="text-text-secondary text-sm">Select a meeting to prepare</p>
                </header>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {meetings.length === 0 ? (
                        <div className="text-center p-8 text-text-tertiary border border-dashed border-border rounded-xl">
                            No upcoming meetings found in emails.
                        </div>
                    ) : (
                        meetings.map((meeting) => (
                            <div
                                key={meeting.id}
                                onClick={() => generateBrief(meeting)}
                                className={clsx(
                                    "p-4 rounded-xl border cursor-pointer transition-all group",
                                    selectedMeeting?.id === meeting.id
                                        ? "bg-brand-500/10 border-brand-500/30"
                                        : "bg-surface border-border hover:border-brand-500/30 hover:shadow-sm"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-medium text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-full">
                                        {new Date(meeting.datetime).toLocaleDateString(undefined, { weekday: 'short' })}
                                    </span>
                                    <span className="text-xs text-text-tertiary">
                                        {new Date(meeting.datetime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <h3 className={clsx(
                                    "font-medium mb-2 line-clamp-2",
                                    selectedMeeting?.id === meeting.id ? "text-brand-500" : "text-text-primary"
                                )}>
                                    {meeting.title}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-text-secondary">
                                    <Users size={12} />
                                    {meeting.participants.length} participants
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-surface border border-border rounded-2xl p-8 overflow-y-auto relative">
                {!selectedMeeting ? (
                    <div className="h-full flex flex-col items-center justify-center text-text-tertiary opacity-50">
                        <Brain size={48} className="mb-4" />
                        <p>Select a meeting to generate an AI brief</p>
                    </div>
                ) : generating ? (
                    <div className="h-full flex flex-col items-center justify-center">
                        <div className="relative mb-6">
                            <div className="w-16 h-16 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-500 animate-pulse" />
                        </div>
                        <h2 className="text-xl font-semibold text-text-primary mb-2">Generating Brief...</h2>
                        <p className="text-text-secondary">Analyzing email thread context & history</p>
                    </div>
                ) : brief ? (
                    <div className="animate-fade-in max-w-3xl mx-auto">
                        <header className="mb-8 border-b border-border pb-6">
                            <div className="flex items-center gap-2 text-brand-500 mb-2 font-medium text-sm uppercase tracking-wider">
                                <Sparkles size={14} />
                                AI Prepared Brief
                            </div>
                            <h1 className="text-3xl font-bold text-text-primary mb-4">{selectedMeeting.title}</h1>
                            <div className="flex gap-6 text-sm text-text-secondary">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} />
                                    {new Date(selectedMeeting.datetime).toLocaleString()}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users size={16} />
                                    {selectedMeeting.participants.join(", ")}
                                </div>
                            </div>
                        </header>

                        <div className="space-y-8">
                            <section>
                                <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                                    <FileText size={18} className="text-blue-500" />
                                    Executive Summary
                                </h3>
                                <div className="bg-surfaceHighlight/50 rounded-xl p-5 text-text-secondary leading-relaxed">
                                    {brief.summary}
                                </div>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <section>
                                    <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                                        <Brain size={18} className="text-purple-500" />
                                        Key Context
                                    </h3>
                                    <ul className="space-y-2">
                                        {brief.key_points.map((point, i) => (
                                            <li key={i} className="flex gap-3 text-text-secondary text-sm">
                                                <span className="text-purple-500 font-bold">•</span>
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section>
                                    <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                                        <Users size={18} className="text-green-500" />
                                        Talking Points
                                    </h3>
                                    <ul className="space-y-2">
                                        {brief.suggested_talking_points.map((point, i) => (
                                            <li key={i} className="flex gap-3 text-text-secondary text-sm">
                                                <span className="text-green-500 font-bold">→</span>
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            </div>

                            <section className="bg-brand-500/5 border border-brand-500/10 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-brand-500 text-sm mb-1">Detected Sentiment</h4>
                                    <p className="text-xs text-brand-500/70 capitalize">{brief.sentiment} tone detected in prior communications</p>
                                </div>
                                <div className="text-2xl">
                                    {brief.sentiment === 'positive' && '😊'}
                                    {brief.sentiment === 'negative' && '😤'}
                                    {brief.sentiment === 'neutral' && '😐'}
                                    {brief.sentiment === 'tense' && '😰'}
                                </div>
                            </section>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default MeetingPrep;
