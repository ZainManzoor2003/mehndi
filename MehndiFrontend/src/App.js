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
import FAQ from './components/FAQ';
import AboutUs from './components/AboutUs';
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
import ManageClients from './components/ManageClients';
import ManageArtists from './components/ManageArtists';
import ManageAdmins from './components/ManageAdmins';
import ManageApplications from './components/ManageApplications';
import ManageBlogs from './components/ManageBlogs';
import AdminUpdateProfile from './components/AdminUpdateProfile';
import ManageBookings from './components/ManageBookings';
import ViewAnalytics from './components/ViewAnalytics';
import AdminWallet from './components/AdminWallet';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentCancel from './components/PaymentCancel';
import PaymentRescheduleBooking from './components/PaymentRescheduleBooking';
import EmailVerification from './components/EmailVerification';
import AboutUsPage from './components/AboutUsPage';

// Main Landing Page Component
const LandingPage = () => (
  <>
    <Header />
    <main className="main" style={{ overflowY: 'hidden' }}>
      <Home />
      <HowItWorks />
      {/* <About /> */}
      {/* <Discover /> */}
      {/* <Experience /> */}
      <FAQ />
      <AboutUs />
      {/* <Subscribe /> */}
    </main>
    <Footer />
  </>
);

// Allow all users to access public pages
const PublicWrapper = ({ children }) => {
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
            <Route path="/" element={<PublicWrapper><LandingPage /></PublicWrapper>} />
            <Route path="/blogs" element={<PublicWrapper><><Header /><main className="main"><Blogs /></main><Footer /></></PublicWrapper>} />
            <Route path="/blogs/:id" element={<PublicWrapper><><Header /><main className="main"><BlogDetail /></main><Footer /></></PublicWrapper>} />
            <Route path="/choose-path" element={<PublicWrapper><ChoosePathForm /></PublicWrapper>} />
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
            <Route path="/verify-email/:token" element={
              <PublicRoute>
                <EmailVerification />
              </PublicRoute>
            } />
            <Route path="/about-us" element={
              <PublicWrapper>
                <AboutUsPage />
              </PublicWrapper>
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
            <Route path="/admin-dashboard" element={<Navigate to="/admin-dashboard/manage-clients" replace />} />
            <Route path="/admin-dashboard/users" element={<Navigate to="/admin-dashboard/manage-clients" replace />} />
            {/* <Route path="/admin-dashboard/users" element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <ManageUsers />
              </RoleProtectedRoute>
            } /> */}
            <Route path="/admin-dashboard/manage-clients" element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <ManageClients />
              </RoleProtectedRoute>
            } />
            <Route path="/admin-dashboard/manage-artists" element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <ManageArtists />
              </RoleProtectedRoute>
            } />
            <Route path="/admin-dashboard/manage-admins" element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <ManageAdmins />
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
