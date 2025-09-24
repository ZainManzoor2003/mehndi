import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
    <AuthProvider>
      <Router>
        <div className="App">
          <LogoutButton />
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
            <Route path="/dashboard/:tab?" element={
              <RoleProtectedRoute allowedRoles={["client"]}>
                <ClientDashboard />
              </RoleProtectedRoute>
            } />
            <Route path="/bookings" element={<AllBookings />} />
            <Route path="/proposals" element={<ProposalsPage />} />
            <Route path="/proposal" element={<ProposalsPage />} />
            <Route path="/artist-dashboard/:tab?" element={
              <RoleProtectedRoute allowedRoles={["artist"]}>
                <ArtistDashboard />
              </RoleProtectedRoute>
            } />
            <Route path="/job/:jobId" element={<JobDetails />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
