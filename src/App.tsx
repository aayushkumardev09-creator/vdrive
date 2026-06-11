import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ErrorBoundary } from './components/layout/ErrorBoundary';

import { DashboardLayout } from './components/layout/DashboardLayout';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Jobs = React.lazy(() => import('./pages/Jobs'));
const DriveMail = React.lazy(() => import('./pages/DriveMail'));
const MatchResults = React.lazy(() => import('./pages/MatchResults'));
const Candidates = React.lazy(() => import('./pages/Candidates'));
const UploadCandidates = React.lazy(() => import('./pages/UploadCandidates'));
const Submissions = React.lazy(() => import('./pages/Submissions'));
const ReverseMatchResults = React.lazy(() => import('./pages/ReverseMatchResults'));
const Settings = React.lazy(() => import('./pages/Settings'));

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <React.Suspense fallback={null}>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<DashboardLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="jobs" element={<Jobs />} />
                  <Route path="drivemail" element={<DriveMail />} />
                  <Route path="candidates" element={<Candidates />} />
                  <Route path="upload" element={<UploadCandidates />} />
                  <Route path="smart-match" element={<MatchResults />} />
                  <Route path="reverse-match/:id" element={<ReverseMatchResults />} />
                  <Route path="submissions" element={<Submissions />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Route>
              
              {/* Catch-all 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </React.Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

