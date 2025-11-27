
// import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Inbox from './pages/Inbox';
import Prompts from './pages/Prompts';
import Agent from './pages/Agent';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Playground from './pages/Playground';
import Kanban from './pages/Kanban';
import FollowUps from './pages/FollowUps';
import MeetingPrep from './pages/MeetingPrep';
import { ToastProvider } from './components/ToastProvider';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="prompts" element={<Prompts />} />
            <Route path="agent" element={<Agent />} />
            <Route path="settings" element={<Settings />} />
            <Route path="playground" element={<Playground />} />
            <Route path="kanban" element={<Kanban />} />
            <Route path="followups" element={<FollowUps />} />
            <Route path="meetings" element={<MeetingPrep />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
