import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_URL,
});

export interface ActionItem {
    id: number;
    description: string;
    deadline?: string;
    status: string;
}

export interface Draft {
    id: number;
    subject: string;
    body: string;
    status: string;
}

export interface Email {
    id: string;
    sender: string;
    subject: string;
    body: string;
    timestamp: string;
    category: string;
    is_read: boolean;
    action_items?: ActionItem[];
    // Phase 1: Sentiment Analysis
    sentiment?: string;
    emotion?: string;
    urgency_score?: number;
    // Phase 1: Dark Patterns
    has_dark_patterns?: boolean;
    dark_patterns?: string[];
    dark_pattern_severity?: string;
}

export interface EmailDetail extends Email {
    action_items: ActionItem[];
    drafts: Draft[];
}

export const inboxApi = {
    load: () => api.post('/inbox/load'),
    getAll: () => api.get<Email[]>('/inbox/'),
    getOne: (id: string) => api.get<EmailDetail>(`/inbox/${id}`),
    delete: (id: string) => api.delete(`/inbox/${id}`),
    updateActionItem: (id: number, status: string) => api.patch(`/action-items/${id}`, { status }),
};

export const agentApi = {
    process: (id: string) => api.post(`/agent/process/${id}`),
    processAll: () => api.post('/agent/process-all'),
    chat: (query: string, emailId?: string) => api.post('/agent/chat', { query, email_id: emailId }),
    draft: (emailId: string, instructions?: string, tone?: string, length?: string) => api.post('/agent/draft', { email_id: emailId, instructions, tone, length }),
};

export const promptsApi = {
    getAll: () => api.get('/prompts/'),
    create: (data: any) => api.post('/prompts/', data),
    update: (id: number, data: any) => api.put(`/prompts/${id}`, data),
};

export const playgroundApi = {
    test: (emailId: string, template: string) => api.post('/playground/test', { email_id: emailId, template }),
};
