// File: lilsculpr-admin/src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Overview } from './pages/Overview/Overview';
import { ManageBatches } from './pages/Batches/ManageBatches';
import { Students } from './pages/Students/Students';
import { Fees } from './pages/Fees/Fees';
import AttendanceTabs from './pages/Attendance/AttendanceTabs';
import { Certificate } from './pages/Certificate/Certificate';
import { Waitlist } from './pages/Waitlist/Waitlist';
import { Compensations } from './pages/Compensations/Compensations';
import { CompensationRequests } from './pages/CompensationRequests/CompensationRequests';
import { Birthdays } from './pages/Birthdays/Birthdays';
import { GalleryManagement } from './pages/Gallery/GalleryManagement';
import Login from './pages/Login';

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <BrowserRouter basename="/admin">
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout title="Overview">
                    <Overview />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/batches"
              element={
                <ProtectedRoute>
                  <Layout title="Manage Batches">
                    <ManageBatches />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/students"
              element={
                <ProtectedRoute>
                  <Layout title="All Students">
                    <Students />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/fees"
              element={
                <ProtectedRoute>
                  <Layout title="Fee Tracking">
                    <Fees />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <Layout title="Attendance">
                    <AttendanceTabs />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/waitlist"
              element={
                <ProtectedRoute>
                  <Layout title="Waitlist">
                    <Waitlist />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/compensations"
              element={
                <ProtectedRoute>
                  <Layout title="Compensations">
                    <Compensations />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/compensation-requests"
              element={
                <ProtectedRoute>
                  <Layout title="Compensation Requests">
                    <CompensationRequests />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/birthdays"
              element={
                <ProtectedRoute>
                  <Layout title="Birthdays">
                    <Birthdays />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/gallery"
              element={
                <ProtectedRoute>
                  <Layout title="Manage Gallery">
                    <GalleryManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/certificate"
              element={
                <ProtectedRoute>
                  <Certificate />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </Provider>
  );
}

export default App;