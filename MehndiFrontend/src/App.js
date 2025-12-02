import { GoogleOAuthProvider } from "@react-oauth/google";
import React from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import "./App.css";
import AboutUs from "./components/AboutUs";
import AboutUsPage from "./components/AboutUsPage";
import AdminUpdateProfile from "./components/AdminUpdateProfile";
import AdminWallet from "./components/AdminWallet";
import AllBookings from "./components/AllBookings";
import ArtistDashboard from "./components/ArtistDashboard";
import BlogDetail from "./components/BlogDetail";
import Blogs from "./components/Blogs";
import BookingForm from "./components/BookingForm";
import BrowseRequests from "./components/BrowseRequests";
import ChoosePathForm from "./components/ChoosePathForm";
import ClientDashboard from "./components/ClientDashboard";
import EarnAsArtist from "./components/EarnAsArtist";
import EmailCheck from "./components/EmailCheck";
import EmailVerification from "./components/EmailVerification";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";
import FullFAQ from "./components/FullFAQ";
import Header from "./components/Header";
import Home from "./components/Home";
import HowItWorks from "./components/HowItWorks";
import JobDetails from "./components/JobDetails";
import Login from "./components/Login";
import ManageAdmins from "./components/ManageAdmins";
import ManageApplications from "./components/ManageApplications";
import ManageArtists from "./components/ManageArtists";
import ManageBlogs from "./components/ManageBlogs";
import ManageBookings from "./components/ManageBookings";
import ManageClients from "./components/ManageClients";
import PaymentCancel from "./components/PaymentCancel";
import PaymentRescheduleBooking from "./components/PaymentRescheduleBooking";
import PaymentSuccess from "./components/PaymentSuccess";
import PhoneVerify from "./components/PhoneVerify";
import PrivacyPolicy from "./components/PrivacyPolicy";
import {
  ProtectedRoute,
  PublicRoute,
  RoleProtectedRoute,
} from "./components/RouteGuards";
import Signup from "./components/Signup";
import TermsAndConditions from "./components/TermsAndConditions";
import ViewAnalytics from "./components/ViewAnalytics";
import { AuthProvider } from "./contexts/AuthContext";

// Main Landing Page Component
const LandingPage = () => (
  <>
    <Header />
    <main className="main" style={{ overflowY: "hidden" }}>
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
              <Route
                path="/"
                element={
                  <PublicWrapper>
                    <LandingPage />
                  </PublicWrapper>
                }
              />
              <Route
                path="/blogs"
                element={
                  <PublicWrapper>
                    <>
                      <Header />
                      <main className="main">
                        <Blogs />
                      </main>
                      <Footer />
                    </>
                  </PublicWrapper>
                }
              />
              <Route
                path="/faq"
                element={
                  <PublicWrapper>
                    <>
                      <Header />
                      <main className="main">
                        <FullFAQ />
                      </main>
                      <Footer />
                    </>
                  </PublicWrapper>
                }
              />
              <Route
                path="/blogs/:id"
                element={
                  <PublicWrapper>
                    <>
                      <Header />
                      <main className="main">
                        <BlogDetail />
                      </main>
                      <Footer />
                    </>
                  </PublicWrapper>
                }
              />
              <Route
                path="/choose-path"
                element={
                  <PublicWrapper>
                    <ChoosePathForm />
                  </PublicWrapper>
                }
              />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/check-email"
                element={
                  <PublicRoute>
                    <EmailCheck />
                  </PublicRoute>
                }
              />
              <Route
                path="/verify-phone"
                element={
                  <PublicRoute>
                    <PhoneVerify />
                  </PublicRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicRoute>
                    <Signup />
                  </PublicRoute>
                }
              />
              <Route
                path="/verify-email/:token"
                element={
                  <PublicRoute>
                    <EmailVerification />
                  </PublicRoute>
                }
              />
              <Route
                path="/browse-requests"
                element={
                  <ProtectedRoute>
                    <BrowseRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/about-us"
                element={
                  <PublicWrapper>
                    <AboutUsPage />
                  </PublicWrapper>
                }
              />
              <Route
                path="/earn-as-artist"
                element={
                  <PublicWrapper>
                    <EarnAsArtist />
                  </PublicWrapper>
                }
              />
              <Route
                path="/privacy-policy"
                element={
                  <PublicWrapper>
                    <PrivacyPolicy />
                  </PublicWrapper>
                }
              />
              <Route
                path="/terms-conditions"
                element={
                  <PublicWrapper>
                    <TermsAndConditions />
                  </PublicWrapper>
                }
              />
              <Route
                path="/booking"
                element={
                  <ProtectedRoute>
                    <BookingForm />
                  </ProtectedRoute>
                }
              />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-cancel" element={<PaymentCancel />} />
              <Route
                path="/payment-reschedule-booking/:action/:bookingId/:artistId/:userId"
                element={
                  <RoleProtectedRoute allowedRoles={["client"]}>
                    <PaymentRescheduleBooking />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/dashboard/:tab?"
                element={
                  <RoleProtectedRoute allowedRoles={["client"]}>
                    <ClientDashboard />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/dashboard/messages"
                element={
                  <RoleProtectedRoute allowedRoles={["client"]}>
                    <ClientDashboard />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/dashboard/bookings"
                element={
                  <RoleProtectedRoute allowedRoles={["client"]}>
                    <AllBookings />
                  </RoleProtectedRoute>
                }
              />
              {/* <Route path="/proposals" element={<ProposalsPage />} />
            <Route path="/proposal" element={<ProposalsPage />} /> */}
              <Route
                path="/artist-dashboard/:tab?"
                element={
                  <RoleProtectedRoute allowedRoles={["artist"]}>
                    <ArtistDashboard />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/artist-dashboard/messages"
                element={
                  <RoleProtectedRoute allowedRoles={["artist"]}>
                    <ArtistDashboard />
                  </RoleProtectedRoute>
                }
              />
              <Route path="/job/:jobId" element={<JobDetails />} />
              <Route
                path="/admin-dashboard"
                element={
                  <Navigate to="/admin-dashboard/manage-clients" replace />
                }
              />
              <Route
                path="/admin-dashboard/users"
                element={
                  <Navigate to="/admin-dashboard/manage-clients" replace />
                }
              />
              {/* <Route path="/admin-dashboard/users" element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <ManageUsers />
              </RoleProtectedRoute>
            } /> */}
              <Route
                path="/admin-dashboard/manage-clients"
                element={
                  <RoleProtectedRoute allowedRoles={["admin"]}>
                    <ManageClients />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin-dashboard/manage-artists"
                element={
                  <RoleProtectedRoute allowedRoles={["admin"]}>
                    <ManageArtists />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin-dashboard/manage-admins"
                element={
                  <RoleProtectedRoute allowedRoles={["admin"]}>
                    <ManageAdmins />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin-dashboard/applications"
                element={
                  <RoleProtectedRoute allowedRoles={["admin"]}>
                    <ManageApplications />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin-dashboard/blogs"
                element={
                  <RoleProtectedRoute allowedRoles={["admin"]}>
                    <ManageBlogs />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin-dashboard/bookings"
                element={
                  <RoleProtectedRoute allowedRoles={["admin"]}>
                    <ManageBookings />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin-dashboard/analytics"
                element={
                  <RoleProtectedRoute allowedRoles={["admin"]}>
                    <ViewAnalytics />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin-dashboard/wallet"
                element={
                  <RoleProtectedRoute allowedRoles={["admin"]}>
                    <AdminWallet />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin-dashboard/update-profile"
                element={
                  <RoleProtectedRoute allowedRoles={["admin"]}>
                    <AdminUpdateProfile />
                  </RoleProtectedRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
