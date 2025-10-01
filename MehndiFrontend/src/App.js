import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, RoleProtectedRoute, PublicRoute } from './components/RouteGuards';
import LogoutButton from './components/LogoutButton';
import Header from './components/Header';
import Home from './components/Home';
import HowItWorks from './components/HowItWorks';
import About from './components/About';
import Discover from './components/Discover';
import Experience from './components/Experience';
import Subscribe from './components/Subscribe';
import Footer from './components/Footer';
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
import PaymentSuccess from './components/PaymentSuccess';
import PaymentCancel from './components/PaymentCancel';

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

function App() {
  return (
    <GoogleOAuthProvider clientId="262818084611-h1hqd4vvma7otjo0cvo9drb4la9fe8p0.apps.googleusercontent.com">
      <AuthProvider>
        <Router>
          <div className="App">
          {/* Logout button moved into sidebar */}
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/choose-path" element={<ChoosePathForm />} />
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/signup" element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } />
            <Route path="/booking" element={<BookingForm />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancel" element={<PaymentCancel />} />
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
