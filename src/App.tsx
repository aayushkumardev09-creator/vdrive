import React from 'react';
const Suspense = (React as any).Suspense;
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Jobs = React.lazy(() => import('./pages/Jobs'));
const DriveMail = React.lazy(() => import('./pages/DriveMail'));
const MatchResults = React.lazy(() => import('./pages/MatchResults'));
const Candidates = React.lazy(() => import('./pages/Candidates'));
const UploadCandidates = React.lazy(() => import('./pages/UploadCandidates'));
const Submissions = React.lazy(() => import('./pages/Submissions'));
const Settings = React.lazy(() => import('./pages/Settings'));

export default function App() {
  return (
    <Router>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="drivemail" element={<DriveMail />} />
            <Route path="candidates" element={<Candidates />} />
            <Route path="upload" element={<UploadCandidates />} />
            <Route path="smart-match" element={<MatchResults />} />
            <Route path="submissions" element={<Submissions />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

