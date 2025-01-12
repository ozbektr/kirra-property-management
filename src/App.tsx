import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { useRBAC } from './hooks/useRBAC';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import InlineCalendar from './components/InlineCalendar';
import Accounting from './components/Accounting';
import Analytics from './components/Analytics';
import Properties from './components/Properties';
import Listings from './components/Listings';
import Help from './components/Help';
import Admin from './components/Admin';
import Leads from './components/Leads';
import Transactions from './components/Transactions';
import WhatsApp from './components/admin/WhatsApp';
import Login from './components/auth/Login';
import SignUp from './components/auth/SignUp';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { isAdmin, isOwner, loading: rbacLoading } = useRBAC();

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.error('Supabase is not configured. Please set up your environment variables.');
      setIsAuthenticated(false);
      return;
    }

    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated(!!session);
      } catch (error) {
        console.error('Error checking session:', error);
        setIsAuthenticated(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isAuthenticated === null || rbacLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-primary-400">Loading...</div>
      </div>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center text-primary-400 p-4">
          <h1 className="text-xl font-bold mb-2">Configuration Error</h1>
          <p>Please connect to Supabase using the "Connect to Supabase" button.</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/signup" element={isAuthenticated ? <Navigate to="/" /> : <SignUp />} />
        <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/" /> : <ForgotPassword />} />
        <Route path="/reset-password" element={isAuthenticated ? <Navigate to="/" /> : <ResetPassword />} />
        
        {/* Protected routes */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <AppLayout>
                <Dashboard />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Owner and Admin routes */}
        {(isOwner() || isAdmin()) && (
          <>
            <Route
              path="/properties"
              element={
                isAuthenticated ? (
                  <AppLayout>
                    <Properties />
                  </AppLayout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/listings"
              element={
                isAuthenticated ? (
                  <AppLayout>
                    <Listings />
                  </AppLayout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </>
        )}

        {/* Admin-only routes */}
        {isAdmin() && (
          <>
            <Route
              path="/admin"
              element={
                isAuthenticated ? (
                  <AppLayout>
                    <Admin />
                  </AppLayout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/leads"
              element={
                isAuthenticated ? (
                  <AppLayout>
                    <Leads />
                  </AppLayout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/transactions"
              element={
                isAuthenticated ? (
                  <AppLayout>
                    <Transactions />
                  </AppLayout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/whatsapp"
              element={
                isAuthenticated ? (
                  <AppLayout>
                    <WhatsApp />
                  </AppLayout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </>
        )}

        {/* Common routes */}
        <Route
          path="/calendar"
          element={
            isAuthenticated ? (
              <AppLayout>
                <Calendar />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/inline-calendar"
          element={
            isAuthenticated ? (
              <AppLayout>
                <InlineCalendar />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/accounting"
          element={
            isAuthenticated ? (
              <AppLayout>
                <Accounting />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/analytics"
          element={
            isAuthenticated ? (
              <AppLayout>
                <Analytics />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/help"
          element={
            isAuthenticated ? (
              <AppLayout>
                <Help />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;