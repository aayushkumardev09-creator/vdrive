import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { DashboardLayout } from './components/layout/DashboardLayout';

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-label="Loading" />
    </div>
  );
}

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
      <React.Suspense fallback={<PageLoader />}>
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
      </React.Suspense>

    </Router>
  );
}

