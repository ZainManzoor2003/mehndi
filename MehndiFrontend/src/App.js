import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import { RoleProtectedRoute, PublicRoute } from './components/RouteGuards';
import Header from './components/Header';
import Home from './components/Home';
import Blogs from './components/Blogs';
import BlogDetail from './components/BlogDetail';
import HowItWorks from './components/HowItWorks';
import About from './components/About';
import Discover from './components/Discover';
import Experience from './components/Experience';
import Subscribe from './components/Subscribe';
import Footer from './components/Footer';
import { useAuth } from './contexts/AuthContext';
import ChoosePathForm from './components/ChoosePathForm';
import Login from './components/Login';
import Signup from './components/Signup';
import BookingForm from './components/BookingForm';
import ClientDashboard from './components/ClientDashboard';
import ProposalsPage from './components/ProposalsPage';
import ArtistDashboard from './components/ArtistDashboard';
import JobDetails from './components/JobDetails';
import AllBookings from './components/AllBookings';
import ManageUsers from './components/ManageUsers';
import ManageApplications from './components/ManageApplications';
import ManageBlogs from './components/ManageBlogs';
import AdminUpdateProfile from './components/AdminUpdateProfile';
import ManageBookings from './components/ManageBookings';
import ViewAnalytics from './components/ViewAnalytics';
import AdminWallet from './components/AdminWallet';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentCancel from './components/PaymentCancel';
import PaymentRescheduleBooking from './components/PaymentRescheduleBooking';

// Main Landing Page Component
const LandingPage = () => (
  <>
    <Header />
          <main className="main">
        <Home />
        <HowItWorks />
        <About />
        <Discover />
        <Experience />
        <Subscribe />
      </main>
    <Footer />
  </>
);

// Redirect authenticated users to their dashboard when they try to access public pages
const RedirectIfAuthenticated = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return children; // avoid flicker; let child render until auth known
  if (isAuthenticated && user) {
    const userType = (user.userType || '').toLowerCase();
    const target = userType === 'client'
      ? '/dashboard'
      : userType === 'artist'
        ? '/artist-dashboard'
        : userType === 'admin'
          ? '/admin-dashboard/users'
          : '/';
    return <Navigate to={target} replace />;
  }
  return children;
};

function App() {
  return (
    <GoogleOAuthProvider clientId="262818084611-h1hqd4vvma7otjo0cvo9drb4la9fe8p0.apps.googleusercontent.com">
      <AuthProvider>
        <Router>
          <div className="App">
          {/* Logout button moved into sidebar */}
          <Routes>
            <Route path="/" element={<RedirectIfAuthenticated><LandingPage /></RedirectIfAuthenticated>} />
            <Route path="/blogs" element={<RedirectIfAuthenticated><><Header /><main className="main"><Blogs /></main><Footer /></></RedirectIfAuthenticated>} />
            <Route path="/blogs/:id" element={<RedirectIfAuthenticated><><Header /><main className="main"><BlogDetail /></main><Footer /></></RedirectIfAuthenticated>} />
            <Route path="/choose-path" element={<RedirectIfAuthenticated><ChoosePathForm /></RedirectIfAuthenticated>} />
            <Route path="/login" element={
              <PublicRoute>
                <RedirectIfAuthenticated><Login /></RedirectIfAuthenticated>
              </PublicRoute>
            } />
            <Route path="/signup" element={
              <PublicRoute>
                <RedirectIfAuthenticated><Signup /></RedirectIfAuthenticated>
              </PublicRoute>
            } />
            <Route path="/booking" element={
              <RoleProtectedRoute allowedRoles={["client"]}>
                <BookingForm />
              </RoleProtectedRoute>
            } />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancel" element={<PaymentCancel />} />
            <Route path="/payment-reschedule-booking/:action/:bookingId/:artistId/:userId" element={
              <RoleProtectedRoute allowedRoles={["client"]}>
                <PaymentRescheduleBooking />
              </RoleProtectedRoute>
            } />
            <Route path="/dashboard/:tab?" element={
              <RoleProtectedRoute allowedRoles={["client"]}>
                <ClientDashboard />
              </RoleProtectedRoute>
            } />
            <Route path="/dashboard/messages" element={
              <RoleProtectedRoute allowedRoles={["client"]}>
                <ClientDashboard />
              </RoleProtectedRoute>
            } />
            <Route path="/dashboard/bookings" element={
              <RoleProtectedRoute allowedRoles={["client"]}>
                <AllBookings />
              </RoleProtectedRoute>
            } />
            <Route path="/proposals" element={<ProposalsPage />} />
            <Route path="/proposal" element={<ProposalsPage />} />
            <Route path="/artist-dashboard/:tab?" element={
              <RoleProtectedRoute allowedRoles={["artist"]}>
                <ArtistDashboard />
              </RoleProtectedRoute>
            } />
            <Route path="/artist-dashboard/messages" element={
              <RoleProtectedRoute allowedRoles={["artist"]}>
                <ArtistDashboard />
              </RoleProtectedRoute>
            } />
            <Route path="/job/:jobId" element={<JobDetails />} />
            <Route path="/admin-dashboard/users" element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <ManageUsers />
              </RoleProtectedRoute>
            } />
            <Route path="/admin-dashboard/applications" element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <ManageApplications />
              </RoleProtectedRoute>
            } />
            <Route path="/admin-dashboard/blogs" element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <ManageBlogs />
              </RoleProtectedRoute>
            } />
            <Route path="/admin-dashboard/bookings" element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <ManageBookings />
              </RoleProtectedRoute>
            } />
            <Route path="/admin-dashboard/analytics" element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <ViewAnalytics />
              </RoleProtectedRoute>
            } />
            <Route path="/admin-dashboard/wallet" element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <AdminWallet />
              </RoleProtectedRoute>
            } />
            <Route path="/admin-dashboard/update-profile" element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <AdminUpdateProfile />
              </RoleProtectedRoute>
            } />
          </Routes>
          </div>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
