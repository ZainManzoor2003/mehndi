import React, { useState, useEffect, useCallback } from 'react';
import './messages.css';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ArtistSidebar from './ArtistSidebar';
import apiService, { chatAPI } from '../services/api';
import CancelAcceptedModal from './modals/CancelAcceptedModal';
import MarkCompleteProofModal from './modals/MarkCompleteProofModal';
import socket, { buildDirectRoomId, joinRoom, sendRoomMessage, sendTyping, signalOnline, onPresenceUpdate } from '../services/socket';
import { ToastContainer, useToast } from './Toast';
import { FaCalendarAlt, FaCheckCircle, FaClock, FaStickyNote, FaEye, FaWallet, FaCommentDots, FaStar, FaMoneyBillWave, FaCalendarCheck, FaHourglassHalf, FaArrowCircleUp, FaExclamationTriangle, FaEnvelope, FaTimes, FaArrowLeft } from 'react-icons/fa';

  const { jobsAPI, proposalsAPI, authAPI, bookingsAPI, applicationsAPI, portfoliosAPI, walletAPI, transactionAPI } = apiService;

const ArtistDashboard = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const { user, isAuthenticated } = useAuth();
  const artistName = user ? `${user.firstName} ${user.lastName}` : 'Artist';
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast();

  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, applications, messages, schedule, earnings, wallet, profile
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const DEFAULT_AVATAR = 'https://www.gravatar.com/avatar/?d=mp&s=80';

  useEffect(() => {
    if (!user || !isAuthenticated) return;
    signalOnline(user._id);
    const off = onPresenceUpdate(({ userId, isOnline }) => {
      setOnlineUserIds(prev => {
        const next = new Set(prev);
        if (isOnline) next.add(String(userId)); else next.delete(String(userId));
        return next;
      });
    });
    const onVisibility = () => { if (!document.hidden) signalOnline(user._id); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { if (off) off(); document.removeEventListener('visibilitychange', onVisibility); };
  }, [user, isAuthenticated]);

  // Application stats state
  const [applicationStats, setApplicationStats] = useState({
    applied: 0,
    accepted: 0,
    declined: 0,
    withdrawn: 0,
    expired: 0,
    pending: 0,
    total: 0,
    acceptanceRate: 0
  });

  // Fetch application stats for tiles
  useEffect(() => {
    if (!isAuthenticated || !user || user.userType !== 'artist') return;
    applicationsAPI.getMyStats().then(resp => {
      if (resp && resp.success && resp.data) {
        const { applied = 0, accepted = 0, declined = 0, withdrawn = 0, expired = 0, pending = 0, total = 0, acceptanceRate = 0 } = resp.data;
        setApplicationStats({
          applied,
          accepted,
          declined,
          withdrawn,
          expired,
          pending,
          total,
          acceptanceRate
        });
      }
    }).catch((error) => {
      console.error('Failed to fetch application stats:', error);
    });
  }, [isAuthenticated, user]);
  const [proposalData, setProposalData] = useState({
    message: '',
    price: '',
    duration: '',
    experience: ''
  });
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Real data from backend
  const [availableJobs, setAvailableJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Overview state for next event, bookings and notifications
  const [nextEvent, setNextEvent] = useState(null);
  const [secondEvent, setSecondEvent] = useState(null);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [userLocation, setUserLocation] = useState(null); // Used in getCurrentLocation
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [kpiStats] = useState({
    bookings: { value: 7, sub: '+40% vs last month', trend: 'up' },
    applications: { value: 3, sub: 'Sent this week', trend: 'up' },
    conversion: { value: '67%', sub: 'Conversion Rate', trend: 'down' },
    response: { value: '92%', sub: 'Response Rate', trend: 'up' }
  });

  // Applications (mock data to match screenshot)
  const [applicationsFilter, setApplicationsFilter] = useState('all');
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState('');
  const [cancelAcceptedOpen, setCancelAcceptedOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [markProofOpen, setMarkProofOpen] = useState(false);
  const [markTargetBookingId, setMarkTargetBookingId] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewForm, setViewForm] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyBookingId, setApplyBookingId] = useState(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);
  const [withdrawBookingId, setWithdrawBookingId] = useState(null);
  const [applicationForm, setApplicationForm] = useState({
    proposedBudget: '',
    estimatedDuration: {
      value: '',
      unit: 'hours'
    },
    availability: {
      isAvailableOnDate: true,
      canTravelToLocation: true,
      travelDistance: ''
    },
    experience: {
      relevantExperience: '',
      yearsOfExperience: '',
      portfolioHighlights: ''
    },
    proposal: {
      message: '',
      whyInterested: '',
      additionalNotes: ''
    },
    terms: {
      agreedToTerms: false
    }
  });
  const [formErrors, setFormErrors] = useState({});

  // Portfolios state
  const [portfolios, setPortfolios] = useState([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({
    displayName: '',
    tagline: '',
    bio: '',
    styles: [],
    categories: [],
    mediaUrls: [],
    perHandRate: '',
    bridalPackagePrice: '',
    partyPackagePrice: '',
    hourlyRate: '',
    outcallFee: '',
    yearsOfExperience: '',
    availableLocations: [],
    travelsToClient: true,
    mehndiConeType: '',
    dryingTimeMinutes: '',
    stainLongevityDays: '',
    hygienePractices: '',
    eventTypes: [],
    maxClientsPerEvent: '',
    isPublished: false
  });
  const [savingPortfolio, setSavingPortfolio] = useState(false);
  const [portfolioErrors, setPortfolioErrors] = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPortfolio, setPreviewPortfolio] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [acceptedByDate, setAcceptedByDate] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  
  // Notes state
  const [bookingNotes, setBookingNotes] = useState({}); // { bookingId: { notes: [...], newNote: '', followUp: false } }
  const [savingNote, setSavingNote] = useState(false);
  const [viewNotesModalOpen, setViewNotesModalOpen] = useState(false);
  const [viewNotesBookingId, setViewNotesBookingId] = useState(null);

  const isValidUrl = (str) => {
    try {
      const u = new URL(str);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const validatePortfolio = (form) => {
    const errs = {};
    if (!form.displayName || !form.displayName.trim()) errs.displayName = 'Display name is required';
    if (!form.bio || !form.bio.trim()) errs.bio = 'Bio is required';
    const urls = Array.isArray(form.mediaUrls) ? form.mediaUrls.filter(Boolean) : [];
    if (urls.length === 0) errs.mediaUrls = 'At least one media URL is required';
    if (urls.length > 0 && urls.some(u => !isValidUrl(u))) errs.mediaUrls = 'All media URLs must be valid http(s) links';
    const styles = Array.isArray(form.styles) ? form.styles.filter(Boolean) : [];
    const categories = Array.isArray(form.categories) ? form.categories.filter(Boolean) : [];
    if (styles.length === 0 && categories.length === 0) errs.styles = 'Provide at least one style or category';
    return errs;
  };

  const fetchMyPortfolios = useCallback(async () => {
    if (!isAuthenticated || !user || user.userType !== 'artist') return;
    try {
      setPortfoliosLoading(true);
      const resp = await portfoliosAPI.listMine();
      setPortfolios(resp.data || []);
    } catch (e) {
      showError(e.message || 'Failed to load portfolios');
      setPortfolios([]);
    } finally {
      setPortfoliosLoading(false);
    }
  }, [isAuthenticated, user, portfoliosAPI]);
  const fetchAppliedBookings = useCallback(async () => {
    if (!isAuthenticated || !user || user.userType !== 'artist') return;
    try {
      setAppsLoading(true);
      setAppsError('');
      const resp = await applicationsAPI.getMyAppliedBookings();
      const list = (resp.data || []).map((b) => ({
        id: b._id,
        title: `${(b.eventType || []).join(', ') || 'Mehndi'} – ${new Date(b.eventDate).toLocaleDateString('en-GB')}`,
        client: `${b.firstName} ${b.lastName} · ${b.city || b.location || ''}`.trim(),
        budget: `£${b.minimumBudget ?? 0}${b.maximumBudget ? ` - £${b.maximumBudget}` : ''}`,
        appliedOn: new Date(b.createdAt).toLocaleDateString('en-GB'),
        status: 'applied',
        assignedCount: Array.isArray(b.assignedArtist) ? b.assignedArtist.length : (b.assignedArtist ? 1 : 0)
      }));
      setApplications(list);
    } catch (e) {
      setAppsError(e.message || 'Failed to load applied bookings');
      setApplications([]);
    } finally {
      setAppsLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchApplicationsByStatus = useCallback(async (status) => {
    if (!isAuthenticated || !user || user.userType !== 'artist') return;
    try {
      setAppsLoading(true);
      setAppsError('');
      const resp = await applicationsAPI.getMyApplicationsByStatus(status);
      const list = (resp.data || []).map((b) => ({
        id: b._id,
        title: `${(b.eventType || []).join(', ') || 'Mehndi'} – ${new Date(b.eventDate).toLocaleDateString('en-GB')}`,
        client: `${b.firstName} ${b.lastName} · ${b.city || b.location || ''}`.trim(),
        budget: `£${b.minimumBudget ?? 0}${b.maximumBudget ? ` - £${b.maximumBudget}` : ''}`,
        appliedOn: new Date(b.createdAt).toLocaleDateString('en-GB'),
        status: status,
        eventDate: b.eventDate,
        assignedCount: Array.isArray(b.assignedArtist) ? b.assignedArtist.length : (b.assignedArtist ? 1 : 0)
      }));
      setApplications(list);
    } catch (e) {
      setAppsError(e.message || `Failed to load ${status} bookings`);
      setApplications([]);
    } finally {
      setAppsLoading(false);
    }
  }, [isAuthenticated, user]);

  const openCancelAccepted = (id) => {
    setCancelTarget({ bookingId: id });
    setCancelAcceptedOpen(true);
  };

  const handleConfirmCancelAccepted = async ({ reason }) => {
    try {
      // Send bookingId only; backend will locate the current artist's application for this booking
      const bookingId = cancelTarget?.bookingId;
      if (!bookingId) throw new Error('Missing bookingId for cancellation');
      console.log('sending notifyCancelAccepted with:', { bookingId, reason });
      await applicationsAPI.notifyCancelAccepted({ bookingId, reason });
      showSuccess('Client will be notified by email');
      // Refetch applications in Applications tab
      if (applicationsFilter === 'accepted') {
        fetchApplicationsByStatus('accepted');
      }
      // Refetch calendar data
      fetchAcceptedCalendar();
    } catch (e) {
      showError(e.message || 'Failed to submit cancellation');
    } finally {
      setCancelAcceptedOpen(false);
      setCancelTarget(null);
    }
  };

  const fetchPendingBookings = useCallback(async () => {
    if (!isAuthenticated || !user || user.userType !== 'artist') return;
    try {
      setAppsLoading(true);
      setAppsError('');
      const resp = await bookingsAPI.getPendingBookings();
      const items = (resp.data || []).map((b) => ({
        id: b._id,
        title: `${(b.eventType || []).join(', ') || 'Mehndi'} – ${new Date(b.eventDate).toLocaleDateString('en-GB')}`,
        client: `${b.firstName} ${b.lastName} · ${b.city || b.location || ''}`.trim(),
        budget: `£${b.minimumBudget ?? 0}${b.maximumBudget ? ` - £${b.maximumBudget}` : ''}`,
        appliedOn: new Date(b.createdAt).toLocaleDateString('en-GB'),
        status: 'in_progress' || 'pending',
        eventDate: b.eventDate,
        assignedCount: Array.isArray(b.assignedArtist) ? b.assignedArtist.length : (b.assignedArtist ? 1 : 0)
      }));
      setApplications(items);
    } catch (e) {
      setAppsError(e.message || 'Failed to load pending bookings');
      setApplications([]);
    } finally {
      setAppsLoading(false);
    }
  }, [isAuthenticated, user]);

  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          resolve({ latitude, longitude });
        },
        (error) => {
          let errorMessage = 'Failed to get location.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }, []);

  const fetchNearbyBookings = useCallback(async () => {
    if (!isAuthenticated || !user || user.userType !== 'artist') return;
    
    try {
      setNearbyLoading(true);
      
      // Get user's current location
      const location = await getCurrentLocation();
      
      // Fetch nearby bookings
      const resp = await bookingsAPI.getNearbyBookings(location.latitude, location.longitude, 3);
      
      const nearbyItems = (resp.data || []).map((b) => ({
        id: b._id,
        title: `${(b.eventType || []).join(', ') || 'Mehndi'} – ${new Date(b.eventDate).toLocaleDateString('en-GB')}`,
        client: `${b.firstName} ${b.lastName}`,
        location: `${b.city || b.location || ''}`.trim() || 'Location not specified',
        budget: `£${b.minimumBudget ?? 0}${b.maximumBudget ? ` - £${b.maximumBudget}` : ''}`,
        eventDate: b.eventDate,
        fullAddress: b.fullAddress,
        latitude: b.latitude,
        longitude: b.longitude,
        // Add other booking details for view detail
        ...b
      }));
      
      setNearbyRequests(nearbyItems);
    } catch (e) {
      console.error('Failed to fetch nearby bookings:', e);
      setNearbyRequests([]);
    } finally {
      setNearbyLoading(false);
    }
  }, [isAuthenticated, user, getCurrentLocation]);

  // Compute artist's next and second events dynamically from their accepted applications
  const fetchArtistUpcomingEvents = useCallback(async () => {
    if (!isAuthenticated || !user || user.userType !== 'artist') return;
    try {
      // Get applications accepted for this artist
      const resp = await applicationsAPI.getMyApplicationsByStatus('accepted');
      const apps = Array.isArray(resp.data) ? resp.data : [];

      // Enrich each with booking details (date, client) if needed
      const enriched = await Promise.all(apps.map(async (a) => {
        try {
          const bookingId = a.bookingId || a.booking?.id || a.booking?._id || a._id; // best-effort
          if (bookingId) {
            const bResp = await bookingsAPI.getBooking(bookingId);
            const b = bResp?.data || {};
            return {
              applicationId: a._id,
              bookingId,
              client: b.firstName && b.lastName ? `${b.firstName} ${b.lastName}` : (a.firstName && a.lastName ? `${a.firstName} ${a.lastName}` : 'Client'),
              eventDate: b.eventDate || a.eventDate,
              eventType: b.eventType || a.eventType,
              otherEventType: b.otherEventType || a.otherEventType,
              preferredTimeSlot: b.preferredTimeSlot || a.preferredTimeSlot,
              location: b.location || b.city || b.postalCode || '',
            };
          }
        } catch (_) {}
        // Fallback to application fields
        return {
          applicationId: a._id,
          bookingId: a.bookingId || a._id,
          client: a.firstName && a.lastName ? `${a.firstName} ${a.lastName}` : 'Client',
          eventDate: a.eventDate,
          eventType: a.eventType,
          otherEventType: a.otherEventType,
          preferredTimeSlot: a.preferredTimeSlot,
          location: a.location || a.city || a.postalCode || '',
        };
      }));

      const today = new Date();
      const future = enriched
        .filter(e => e.eventDate && new Date(e.eventDate) > today)
        .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

      const getEventTitle = (eventType, otherEventType) => {
        if (Array.isArray(eventType) && eventType.length > 0) {
          const types = eventType.join(', ');
          return otherEventType ? `${types} – ${otherEventType}` : types;
        }
        return otherEventType || 'Mehndi Booking';
      };

      const formatDateText = (dateString, preferred) => {
        const date = new Date(dateString);
        const datePart = date.toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        });
        const pref = Array.isArray(preferred) ? preferred.join(', ') : (preferred || 'Flexible');
        return { date: datePart, timeSlot: pref };
      };
      console.log('Future events:', future);

      if (future.length > 0) {
        const first = future[0];
        const firstDate = new Date(first.eventDate);
        const daysLeft = Math.max(0, Math.ceil((firstDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        const dateFormatted = formatDateText(first.eventDate, first.preferredTimeSlot);
        setNextEvent({
          id: first.bookingId,
          title: getEventTitle(first.eventType, first.otherEventType),
          client: first.client,
          date: dateFormatted.date,
          timeSlot: dateFormatted.timeSlot,
          location: first.location,
          status: 'Deposit Received',
          daysLeft: daysLeft,
        });

        if (future.length > 1) {
          const second = future[1];
          const secondDate = new Date(second.eventDate);
          const daysLeft2 = Math.max(0, Math.ceil((secondDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
          const dateFormatted2 = formatDateText(second.eventDate, second.preferredTimeSlot);
          setSecondEvent({
            id: second.bookingId,
            title: getEventTitle(second.eventType, second.otherEventType),
            client: second.client,
            date: dateFormatted2.date,
            timeSlot: dateFormatted2.timeSlot,
            location: second.location,
            status: 'Deposit Received',
            daysLeft: daysLeft2,
          });
        } else {
          setSecondEvent(null);
        }
      } else {
        setNextEvent(null);
        setSecondEvent(null);
      }
    } catch (e) {
      // If anything fails, just clear
      setNextEvent(null);
      setSecondEvent(null);
    }
  }, [isAuthenticated, user]);

  const openViewBooking = async (bookingId) => {
    try {
      setViewLoading(true);
      // Prevent body scroll when modal opens
      document.body.style.overflow = 'hidden';
      const resp = await bookingsAPI.getBooking(bookingId);
      const b = resp.data || {};
      setViewForm({
        firstName: b.firstName || '',
        lastName: b.lastName || '',
        email: b.email || '',
        phoneNumber: b.phoneNumber || '',
        eventType: b.eventType || [],
        otherEventType: b.otherEventType || '',
        eventDate: b.eventDate ? new Date(b.eventDate).toISOString().substring(0,10) : '',
        preferredTimeSlot: b.preferredTimeSlot || [],
        location: b.location || '',
        artistTravelsToClient: b.artistTravelsToClient === true,
        fullAddress: b.fullAddress || '',
        city: b.city || '',
        postalCode: b.postalCode || '',
        venueName: b.venueName || '',
        minimumBudget: b.minimumBudget ?? '',
        maximumBudget: b.maximumBudget ?? '',
        duration: b.duration ?? '',
        numberOfPeople: b.numberOfPeople ?? '',
        designStyle: b.designStyle || '',
        designComplexity: b.designComplexity || '',
        bodyPartsToDecorate: b.bodyPartsToDecorate || [],
        designInspiration: b.designInspiration || '',
        coveragePreference: b.coveragePreference || '',
        additionalRequests: b.additionalRequests || ''
      });
      setViewOpen(true);
    } catch (e) {
      showError(e.message || 'Failed to load booking');
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewBooking = () => {
    setViewOpen(false);
    setViewForm(null);
    // Restore body scroll when modal closes
    document.body.style.overflow = 'auto';
  };

  const openApplyModal = (bookingId) => {
    setApplyBookingId(bookingId);
    setApplyOpen(true);
    // Reset form to default values
    setApplicationForm({
      proposedBudget: '',
      estimatedDuration: {
        value: '',
        unit: 'hours'
      },
      availability: {
        isAvailableOnDate: true,
        canTravelToLocation: true,
        travelDistance: ''
      },
      experience: {
        relevantExperience: '',
        yearsOfExperience: '',
        portfolioHighlights: ''
      },
      proposal: {
        message: '',
        whyInterested: '',
        additionalNotes: ''
      },
      terms: {
        agreedToTerms: false
      }
    });
    setFormErrors({});
  };

  const closeApplyModal = () => {
    setApplyOpen(false);
    setApplyBookingId(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};

    // Validate proposed budget
    if (!applicationForm.proposedBudget || applicationForm.proposedBudget <= 0) {
      errors.proposedBudget = 'Please enter a valid proposed budget';
    }

    // Validate estimated duration
    if (!applicationForm.estimatedDuration.value || applicationForm.estimatedDuration.value <= 0) {
      errors.estimatedDuration = 'Please enter a valid estimated duration';
    }

    // Validate experience
    if (!applicationForm.experience.relevantExperience.trim()) {
      errors.relevantExperience = 'Please describe your relevant experience';
    }

    if (!applicationForm.experience.yearsOfExperience || applicationForm.experience.yearsOfExperience < 0) {
      errors.yearsOfExperience = 'Please enter your years of experience';
    }

    // Validate proposal message
    if (!applicationForm.proposal.message.trim()) {
      errors.proposalMessage = 'Please write a proposal message';
    } else if (applicationForm.proposal.message.trim().length < 50) {
      errors.proposalMessage = 'Proposal message must be at least 50 characters';
    }

    // Validate terms agreement
    if (!applicationForm.terms.agreedToTerms) {
      errors.agreedToTerms = 'You must agree to the terms and conditions';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setApplicationForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setApplicationForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const confirmApply = async () => {
    if (!applyBookingId) return;
    
    // Validate form before submitting
    if (!validateForm()) {
      return;
    }

    try {
      setApplyLoading(true);
      
      // Prepare the artist details object
      const artistDetails = {
        proposedBudget: parseFloat(applicationForm.proposedBudget),
        estimatedDuration: {
          value: parseFloat(applicationForm.estimatedDuration.value),
          unit: applicationForm.estimatedDuration.unit
        },
        availability: {
          isAvailableOnDate: applicationForm.availability.isAvailableOnDate,
          canTravelToLocation: applicationForm.availability.canTravelToLocation,
          travelDistance: applicationForm.availability.travelDistance ? parseFloat(applicationForm.availability.travelDistance) : 0
        },
        experience: {
          relevantExperience: applicationForm.experience.relevantExperience.trim(),
          yearsOfExperience: parseInt(applicationForm.experience.yearsOfExperience),
          portfolioHighlights: applicationForm.experience.portfolioHighlights.trim()
        },
        proposal: {
          message: applicationForm.proposal.message.trim(),
          whyInterested: applicationForm.proposal.whyInterested.trim(),
          additionalNotes: applicationForm.proposal.additionalNotes.trim()
        },
        terms: {
          agreedToTerms: applicationForm.terms.agreedToTerms
        }
      };

      const response = await applicationsAPI.applyToBooking(applyBookingId, artistDetails);
      
      // Check if onboarding is required
      if (response.requiresOnboarding && response.onboardingUrl) {
        closeApplyModal();
        showWarning('Please complete your payment setup to continue applying to bookings.');
        // Redirect to Stripe onboarding
        window.location.href = response.onboardingUrl;
        return;
      }
      
      closeApplyModal();
      showSuccess('Application submitted successfully!');
      
      // Auto-fetch data after successful submission
      await fetchPendingBookings();
      await fetchNearbyBookings();
      await fetchSentProposals();
      
      // Refresh current tab data
      if (activeTab === 'dashboard') {
        fetchArtistUpcomingEvents();
      } else if (activeTab === 'applications') {
        if (applicationsFilter === 'all') {
          fetchPendingBookings();
        } else {
          fetchApplicationsByStatus(applicationsFilter);
        }
      }
    } catch (e) {
      showError(e.message || 'Failed to apply');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleWithdrawApplication = (bookingId) => {
    setWithdrawBookingId(bookingId);
    setWithdrawConfirmOpen(true);
  };

  const closeWithdrawConfirm = () => {
    setWithdrawConfirmOpen(false);
    setWithdrawBookingId(null);
  };

  const confirmWithdraw = async () => {
    if (!withdrawBookingId) return;
    
    try {
      setWithdrawLoading(true);
      await applicationsAPI.withdrawApplication(withdrawBookingId);
      showSuccess('Application withdrawn successfully!');
      closeWithdrawConfirm();
      
      // Refresh applied bookings list
      await fetchAppliedBookings();
    } catch (e) {
      showError(e.message || 'Failed to withdraw application');
    } finally {
      setWithdrawLoading(false);
    }
  };

  // // Schedule - simple calendar and bookings by date (mock)
  // const [calendarMonth, setCalendarMonth] = useState(new Date(2025, 9, 1)); // Oct 2025
  // const [selectedDate, setSelectedDate] = useState(new Date(2025, 8, 15)); // Sep 15, 2025

  const bookingsByDate = {
    '2025-09-15': [
      { id: 'bk-1', title: 'Eid Mehndi', client: 'Fatima Ali', time: '6:00 PM', location: 'East London', status: 'Final Payment Due', type: 'party' },
      { id: 'bk-3', title: 'Bridal Trial', client: 'Aisha Khan', time: '4:00 PM', location: 'Downtown Studio, London', status: 'Deposit Paid', type: 'bridal' }
    ],
    '2025-10-10': [
      { id: 'bk-2', title: 'Festival Mehndi', client: 'Aisha Khan', time: '3:00 PM', location: '123 Celebration Hall, London', status: 'Deposit Paid', type: 'festival' }
    ]
  };

  const startOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const endOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
  const startWeekDay = (startOfMonth.getDay() + 6) % 7; // make Monday=0
  const totalDays = endOfMonth.getDate();

  const getCellDate = (index) => {
    const dayOffset = index - startWeekDay;
    return new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1 + dayOffset);
  };

  const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const toKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Accepted calendar data built dynamically from backend

  const fetchAcceptedCalendar = useCallback(async () => {
    if (!isAuthenticated || !user || user.userType !== 'artist') return;
    try {
      const resp = await applicationsAPI.getMyApplicationsByStatus('accepted');
      const apps = Array.isArray(resp.data) ? resp.data : [];

      // Fetch booking details for each booking_id
      const toTag = (eventType) => {
        const types = Array.isArray(eventType) ? eventType : (eventType ? [eventType] : []);
        const lower = types.map(t => String(t).toLowerCase());
        if (lower.some(t => t.includes('wedding') || t.includes('bridal'))) return 'bridal';
        if (lower.some(t => t.includes('festival'))) return 'festival';
        if (lower.some(t => t.includes('party'))) return 'party';
        return 'casual';
      };

      const entries = await Promise.all(apps.map(async (a) => {
        try {
          const bookingId = a.bookingId || a.booking_id || a._id;
          if (!bookingId) return null;
          const bResp = await bookingsAPI.getBooking(bookingId);
          const b = bResp?.data || {};
          return {
            id: bookingId,
            client: b.firstName && b.lastName ? `${b.firstName} ${b.lastName}` : 'Client',
            title: Array.isArray(b.eventType) && b.eventType.length ? b.eventType.join(', ') : (b.otherEventType || 'Mehndi Booking'),
            date: b.eventDate ? new Date(b.eventDate) : null,
            time: Array.isArray(b.preferredTimeSlot) ? b.preferredTimeSlot.join(', ') : (b.preferredTimeSlot || ''),
            location: b.location || b.city || b.postalCode || '',
            status: 'Accepted',
            tag: toTag(b.eventType)
          };
        } catch (_) {
          return null;
        }
      }));

      const grouped = {};
      entries.filter(Boolean).forEach((e) => {
        if (!e.date) return;
        const k = toKey(e.date);
        if (!grouped[k]) grouped[k] = [];
        grouped[k].push(e);
      });

      setAcceptedByDate(grouped);

      // Default selected date to first upcoming booking if available
      const upcomingDates = Object.keys(grouped)
        .map(k => new Date(k))
        .filter(d => d >= new Date())
        .sort((a,b)=>a-b);
      if (upcomingDates.length) {
        setSelectedDate(upcomingDates[0]);
        setCalendarMonth(upcomingDates[0]);
      }
    } catch (_) {
      setAcceptedByDate({});
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (activeTab === 'schedule') {
      fetchAcceptedCalendar();
    }
  }, [activeTab, fetchAcceptedCalendar]);

  // Fetch notes when secondEvent changes
  useEffect(() => {
    if (secondEvent?.id && user?.userType === 'artist') {
      applicationsAPI.getApplicationNotes(secondEvent.id)
        .then(resp => {
          if (resp.success) {
            setBookingNotes(prev => ({
              ...prev,
              [secondEvent.id]: {
                ...prev[secondEvent.id],
                notes: resp.data || []
              }
            }));
          }
        })
        .catch(console.error);
    }
  }, [secondEvent, user]);

  // Cancel booking modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('Other');
  const [cancelDetails, setCancelDetails] = useState('');
  const [cancelError, setCancelError] = useState('');

  const openCancelModal = (booking) => {
    setSelectedBooking(booking);
    setCancelReason('Other');
    setCancelDetails('');
    setCancelError('');
    setCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    setCancelModalOpen(false);
    setSelectedBooking(null);
  };

  const confirmCancellation = () => {
    if (!cancelReason) {
      setCancelError('Please provide a cancellation reason.');
      return;
    }
    // Update local mock data by removing the booking from that date
    if (selectedBooking) {
      const key = Object.keys(bookingsByDate).find(k => bookingsByDate[k].some(b => b.id === selectedBooking.id));
      if (key) {
        bookingsByDate[key] = bookingsByDate[key].filter(b => b.id !== selectedBooking.id);
      }
    }
    closeCancelModal();
  };

  // Earnings - payout methods and transactions (mock)
  const [payoutMethods, setPayoutMethods] = useState([
    { id: 'bank-1', bank: 'Barclays Bank', last4: '1234', primary: true }
  ]);
  const [txFilter, setTxFilter] = useState('All');
  const [txSearch, setTxSearch] = useState('');
  const [transactions] = useState([
    { id: 't1', event: 'Bridal Mehndi – Oct 10, 2025', client: 'Aisha Khan', date: '2025-10-11', amount: 500, status: 'Released' },
    { id: 't2', event: 'Eid Mehndi – Sep 15, 2025', client: 'Fatima Ali', date: '2025-09-16', amount: 250, status: 'Pending' },
    { id: 't3', event: 'Party Mehndi – Aug 30, 2025', client: 'Sana Noor', date: '2025-08-31', amount: 150, status: 'Processing' },
    { id: 't4', event: 'Casual Mehndi – Jul 12, 2025', client: 'Leila Ahmed', date: '2025-07-13', amount: 100, status: 'Released' }
  ]);

  // Toggle to show hard-coded demo data instead of fetching from API
  const useMockData = true;

  // Helper function to calculate time ago
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const posted = new Date(dateString);
    const diffInHours = Math.floor((now - posted) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  // Real proposals data from backend
  const [sentProposals, setSentProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);

  // Fetch sent proposals from backend
  const fetchSentProposals = useCallback(async () => {
    console.log('=== FETCH SENT PROPOSALS START ===');
    console.log('Auth status:', { isAuthenticated, user: user ? { id: user._id, userType: user.userType, name: `${user.firstName} ${user.lastName}` } : null });
    console.log('🔍 Current User Full Object:', user);

    if (!isAuthenticated || !user || user.userType !== 'artist') {
      console.log('Skipping proposal fetch - user not authenticated or not an artist:', { isAuthenticated, user: user?.userType });
      return;
    }

    try {
      setProposalsLoading(true);
      console.log('Fetching sent proposals for artist...');

      // First test if we're properly authenticated
      try {
        const authTest = await authAPI.getProfile();
        console.log('Auth test successful:', authTest);
      } catch (authError) {
        console.error('Auth test failed:', authError);
        setSentProposals([]);
        return;
      }

      const response = await proposalsAPI.getMyProposals();
      console.log('Proposals API response:', response);

      if (response.success && response.data) {
        console.log('✅ Raw proposals data:', response.data);
        console.log('✅ Number of proposals found:', response.data.length);

        // Transform proposals data for display
        const transformedProposals = response.data.map(proposal => ({
          id: proposal._id,
          jobTitle: proposal.job?.title || 'Job Title Not Available',
          client: proposal.job?.client ? `${proposal.job.client.firstName || ''} ${proposal.job.client.lastName || ''}`.trim() : 'Client',
          proposedPrice: `£${proposal.pricing?.totalPrice || 0}`,
          proposedDuration: `${proposal.timeline?.estimatedDuration?.value || 0} ${proposal.timeline?.estimatedDuration?.unit || 'hours'}`,
          message: proposal.message || '',
          status: proposal.status || 'pending',
          sentDate: proposal.submittedAt ? new Date(proposal.submittedAt).toLocaleDateString('en-GB') : '',
          responseDate: proposal.clientResponse?.respondedAt ? new Date(proposal.clientResponse.respondedAt).toLocaleDateString('en-GB') : null,
          rawData: proposal
        }));

        console.log('✅ Setting transformed proposals:', transformedProposals);
        console.log('✅ Number of proposals to display:', transformedProposals.length);
        setSentProposals(transformedProposals);
      } else {
        console.log('❌ No proposals data or unsuccessful response:', response);
        setSentProposals([]);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
      console.error('Error details:', error.message, error.stack);

      // If it's an authentication error, show a more helpful message
      if (error.message.includes('401') || error.message.includes('Not authorized')) {
        console.log('Authentication failed - user may need to log in again');
        setError('Authentication expired. Please refresh the page and log in again.');
      } else {
        setError(`Failed to load proposals: ${error.message}`);
      }

      // Keep existing proposals if fetch fails
    } finally {
      setProposalsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Fetch available jobs from backend
  const fetchAvailableJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Fetching available jobs...');
      const response = await jobsAPI.getAllJobs();

      console.log('Jobs response:', response);
      console.log('Jobs data array:', response.data);
      console.log('Jobs data length:', response.data ? response.data.length : 'No data');

      // Check if response has data
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response data:', response);
        setAvailableJobs([]);
        return;
      }

      // Transform the data to match the component's expected format
      const transformedJobs = response.data.map((job, index) => {
        console.log(`Transforming job ${index}:`, job);

        try {
          return {
            id: job._id,
            title: job.title || 'Untitled Job',
            client: job.client ? `${job.client.firstName || ''} ${job.client.lastName || ''}`.trim() : 'Client',
            location: job.location?.city || 'Location not specified',
            date: job.eventDetails?.eventDate ? new Date(job.eventDetails.eventDate).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }) : 'Date TBD',
            time: job.eventDetails?.eventTime || 'Time TBD',
            budget: job.budget ? `£${job.budget.min || 0}-${job.budget.max || 0}` : 'Budget TBD',
            description: job.description || 'No description available',
            requirements: job.requirements?.designStyle || ['Traditional designs'],
            postedDate: getTimeAgo(job.createdAt),
            proposalsCount: job.applicationsCount || 0,
            status: job.status || 'open',
            rawData: job // Keep original data for proposal submission
          };
        } catch (transformError) {
          console.error(`Error transforming job ${index}:`, transformError, job);
          return null;
        }
      }).filter(job => job !== null); // Remove any failed transformations

      console.log('Transformed jobs:', transformedJobs);
      console.log('Setting available jobs to:', transformedJobs.length, 'items');
      setAvailableJobs(transformedJobs);

    } catch (error) {
      console.error('Error fetching jobs:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      setError(`Failed to load available jobs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch available jobs and proposals when component mounts and user is authenticated
  useEffect(() => {
    // Set initial tab from route if provided
    if (tab) {
      setActiveTab(tab);
    }

    // In mock mode, keep other mock sections but fetch real pending bookings for applications tab
    if (useMockData) {
      setLoading(false);

      // Also try computing dynamic upcoming events if API available
      fetchArtistUpcomingEvents();

      // Upcoming bookings (Eid Mehndi – Sep 15, 2025)
      setUpcomingBookings([
        {
          id: 'booking-eid-2025-09-15',
          title: 'Eid Mehndi – Sep 15, 2025',
          client: 'Fatima Ali',
          dateText: 'Sep 15, 2025 · 6:00 PM',
          status: 'Deposit Paid',
          daysLeftText: '25 days left'
        }
      ]);

      // Notifications list
      setNotifications([
        { id: 'n-1', type: 'info', text: 'New request: Bridal Mehndi in your city' },
        { id: 'n-2', type: 'success', text: 'Deposit received for Eid Mehndi' },
        { id: 'n-3', type: 'warning', text: 'Reminder: Event in 7 days' },
        { id: 'n-4', type: 'danger', text: 'Final payment not received yet' }
      ]);

      // Requests near you (mock)
      setNearbyRequests([
        {
          id: 'req-bridal-2025-10-20',
          title: 'Bridal Mehndi – Oct 20, 2025',
          budget: '£500',
          location: 'East London'
        },
        {
          id: 'req-party-2025-11-02',
          title: 'Party Mehndi – Nov 2, 2025',
          budget: '£150',
          location: 'Birmingham'
        }
      ]);

      // Proposals (one accepted, one pending)
      setSentProposals([
        {
          id: 'prop-1',
          jobTitle: 'Eid Mehndi – Family Party',
          client: 'Fatima Ali',
          proposedPrice: '£220',
          proposedDuration: '4 hours',
          message: 'Happy to do elegant Eid designs for 5-6 guests. Portfolio attached.',
          status: 'accepted',
          sentDate: '10/09/2025',
          responseDate: '11/09/2025'
        },
        {
          id: 'prop-2',
          jobTitle: 'Bridal Mehndi – Downtown City',
          client: 'Aisha Khan',
          proposedPrice: '£450',
          proposedDuration: '6 hours',
          message: 'Experienced in intricate bridal work. Can customize with name initials.',
          status: 'pending',
          sentDate: '09/09/2025',
          responseDate: null
        }
      ]);
      // Also get pending bookings for Applications tab
      fetchPendingBookings();
      fetchNearbyBookings();
      if (tab === 'profile') {
        fetchMyPortfolios();
      }
      return;
    }

    console.log('Artist Dashboard useEffect:', {
      isAuthenticated,
      user: user ? { userType: user.userType, name: `${user.firstName} ${user.lastName}` } : null
    });

     if (isAuthenticated) {
      console.log('User is authenticated, fetching jobs and proposals...');
      setTimeout(() => {
        fetchAvailableJobs();
        fetchSentProposals();
         fetchPendingBookings();
         fetchArtistUpcomingEvents();
         fetchNearbyBookings();
        if (tab === 'profile') {
          fetchMyPortfolios();
        }
      }, 100);
    } else {
      console.log('User not authenticated');
      setLoading(false);
    }
  }, [isAuthenticated, user, fetchAvailableJobs, fetchSentProposals, fetchPendingBookings, fetchArtistUpcomingEvents, fetchNearbyBookings]);

  // Derive overview data when proposals change
  useEffect(() => {
    // Use accepted proposals to create simple upcoming bookings list
    const accepted = sentProposals
      .filter(p => p.status === 'accepted')
      .map(p => ({
        id: p.id,
        title: p.jobTitle,
        client: p.client,
        dateText: p.sentDate,
        status: 'Deposit Paid',
        daysLeftText: '25 days left',
        startsInText: 'Starts in 2 hours'
      }));

    setUpcomingBookings(accepted.slice(0, 3));

    // Pick next event (first accepted or null)
    setNextEvent(accepted.length > 0 ? accepted[0] : null);

    // Lightweight notifications from proposal states
    const notif = [];
    if (sentProposals.some(p => p.status === 'accepted')) {
      notif.push({ id: 'n1', type: 'success', text: 'A proposal was accepted. Check details.' });
    }
    if (sentProposals.some(p => p.status === 'pending')) {
      notif.push({ id: 'n2', type: 'info', text: 'You have pending proposals awaiting reply.' });
    }
    if (accepted.length === 0) {
      notif.push({ id: 'n3', type: 'warning', text: 'No upcoming bookings yet.' });
    }
    setNotifications(notif);
  }, [sentProposals]);

  // Use real jobs or show empty state
  const displayJobs = availableJobs;

  const [artistConversations, setArtistConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  // Wallet
  const [walletSummary, setWalletSummary] = useState({ totalPaid: 0, remainingBalance: 0 });
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const fetchWalletData = useCallback(async () => {
    if (!isAuthenticated || !user || user.userType !== 'artist') return;
    try {
      setWalletLoading(true);
      // summary
      const summaryRes = await walletAPI.getWalletSummary();
      const summary = summaryRes?.data || {};
      setWalletSummary({
        totalPaid: Number(summary.totalPaid || 0),
        remainingBalance: Number(summary.remainingBalance || 0)
      });
      // transactions
      try {
        const txRes = await transactionAPI.getMyTransactions();
        const txs = Array.isArray(txRes?.data) ? txRes.data : [];
        console.log('tsx',txs)
        const mapped = txs.map((t) => ({
          id: t._id || t.id,
          event: t.event || t.description || 'Transaction',
          method: t.method || t.provider || 'Stripe',
          type: t.transactionType || t.type || t.category || 'payment',
          status: t.status || 'Paid',
          date: t.createdAt ? new Date(t.createdAt) : new Date(),
          amount: Number(t.amount || 0)
        }));
        setWalletTransactions(mapped);
      } catch (_) {
        setWalletTransactions([]);
      }
    } catch (e) {
      showError(e.message || 'Failed to load wallet');
      setWalletSummary({ totalPaid: 0, remainingBalance: 0 });
      setWalletTransactions([]);
    } finally {
      setWalletLoading(false);
    }
  }, [isAuthenticated, user]);

  // Auto-fetch wallet data on mount and user change
  useEffect(() => {
    if (isAuthenticated && user && user.userType === 'artist') {
      fetchWalletData();
    }
  }, [isAuthenticated, user, fetchWalletData]);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const openWithdraw = () => setWithdrawOpen(true);
  const closeWithdraw = () => setWithdrawOpen(false);
  const canConfirmWithdraw = () => {
    const amt = Number(withdrawAmount);
    return !Number.isNaN(amt) && amt > 0 && amt <= walletSummary.remainingBalance;
  };
  const formatGBP = (n) => `£${Number(n).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const confirmWalletWithdraw = async () => {
    if (!canConfirmWithdraw() || withdrawLoading) return;
    const amt = Number(withdrawAmount);
    try {
      setWithdrawLoading(true);
      await walletAPI.withdrawFunds({ amount: amt });
      try { showSuccess('Withdrawal requested successfully'); } catch {}
      setWithdrawAmount('');
      closeWithdraw();
      await fetchWalletData();
    } catch (e) {
      try { showError(e.message || 'Failed to withdraw'); } catch {}
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);

    // Auto-fetch data based on tab
    if (tab === 'dashboard') {
      navigate(`/artist-dashboard`);
      fetchArtistUpcomingEvents();
      fetchPendingBookings();
      fetchNearbyBookings(); // Always fetch nearby bookings for dashboard
    } else if (tab === 'applications') {
      if (applicationsFilter === 'all') {
        fetchPendingBookings();
      } else {
        fetchApplicationsByStatus(applicationsFilter);
      }
      fetchSentProposals(); // Always fetch sent proposals for applications tab
    } else if (tab === 'schedule') {
      fetchAcceptedCalendar();
    } else if (tab === 'messages') {
      chatAPI.listMyChats().then(res => {
        if (res.success) setArtistConversations(res.data || []);
      }).catch(console.error);
    } else if (tab === 'wallet') {
      fetchWalletData();
    } else if (tab === 'profile') {
      fetchMyPortfolios();
    }

    if (tab === 'dashboard') {
      navigate(`/artist-dashboard`);
      return;
    }
    navigate(`/artist-dashboard/${tab}`);

    // Always fetch nearby bookings when switching tabs (for dashboard access)
    if (tab !== 'dashboard') {
      fetchNearbyBookings();
    }
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleNoteChange = (bookingId, value) => {
    setBookingNotes(prev => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] || {}),
        text: value
      }
    }));
  };

  const handleToggleFollowUp = (bookingId) => {
    setBookingNotes(prev => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] || {}),
        followUp: !(prev[bookingId]?.followUp)
      }
    }));
  };

  const handleSaveNotes = (bookingId) => {
    const note = bookingNotes[bookingId] || {};
    console.log('Saved notes for', bookingId, note);
    showSuccess('Notes saved');
  };

  const handleSendProposal = (job) => {
    setSelectedJob(job);
    setShowProposalModal(true);
  };

  const handleCloseProposalModal = () => {
    setShowProposalModal(false);
    setSelectedJob(null);
    setProposalData({
      message: '',
      price: '',
      duration: '',
      experience: ''
    });
  };

  const handleProposalInputChange = (field, value) => {
    setProposalData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitProposal = async () => {
    if (!selectedJob || !proposalData.price || !proposalData.message) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmittingProposal(true);
      setError('');

      // Prepare proposal data according to backend API schema
      const proposalPayload = {
        jobId: selectedJob.id,
        message: proposalData.message,
        pricing: {
          totalPrice: parseFloat(proposalData.price.replace(/[£,]/g, '')), // Remove currency symbols
          currency: 'GBP'
        },
        timeline: {
          estimatedDuration: {
            value: parseFloat(proposalData.duration.replace(/[^0-9.]/g, '')), // Extract numeric value
            unit: proposalData.duration.toLowerCase().includes('day') ? 'days' : 'hours'
          }
        },
        experience: {
          relevantExperience: proposalData.experience,
          yearsOfExperience: 0 // You might want to add this to the form
        },
        coverLetter: proposalData.message // Use message as cover letter for now
      };

      console.log('Submitting proposal:', proposalPayload);

      const response = await proposalsAPI.createProposal(proposalPayload);

      if (response.success) {
        console.log('Proposal submitted successfully:', response.data);

        // Show success message
        showSuccess('Proposal submitted successfully!');

        // Close modal and reset form
        handleCloseProposalModal();

        // Auto-fetch data after successful submission
        setTimeout(async () => {
          console.log('Refreshing data after successful proposal submission...');
          await fetchSentProposals();
          await fetchAvailableJobs();
          await fetchNearbyBookings();
          
          // Refresh current tab data
          if (activeTab === 'applications') {
            if (applicationsFilter === 'all') {
              fetchPendingBookings();
            } else {
              fetchApplicationsByStatus(applicationsFilter);
            }
          } else if (activeTab === 'dashboard') {
            fetchArtistUpcomingEvents();
          }
        }, 1000);
      }

    } catch (error) {
      console.error('Error submitting proposal:', error);
      setError(error.message || 'Failed to submit proposal. Please try again.');
    } finally {
      setSubmittingProposal(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setCurrentChat(conversation);
    const clientId = conversation.client?._id || conversation.clientId || conversation.id;
    const roomId = buildDirectRoomId(user?._id, clientId);
    joinRoom(roomId, { userId: user?._id, userType: 'artist' });
    chatAPI.getChat(conversation._id).then(res => {
      if (res.success) setChatMessages(res.data.messages || []);
    }).then(() => chatAPI.markRead(conversation._id))
      .catch(console.error);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() && currentChat) {
      const clientId = currentChat.client?._id || currentChat.clientId || currentChat.id;
      const roomId = buildDirectRoomId(user?._id, clientId);
      const text = newMessage.trim();
      try {
        const res = await chatAPI.sendMessage(currentChat._id, text);
        if (res.success) {
          const saved = res.data.messages[res.data.messages.length - 1];
          sendRoomMessage(roomId, {
            id: saved._id || Date.now(),
            senderId: saved.sender,
            senderName: artistName,
            message: saved.text,
            timestamp: new Date(saved.createdAt || Date.now()).toLocaleString(),
            type: 'text'
          });
          setChatMessages(res.data.messages);
          setNewMessage('');
          
          // Auto-fetch conversations after sending message
          if (activeTab === 'messages') {
            chatAPI.listMyChats().then(res => {
              if (res.success) setArtistConversations(res.data || []);
            }).catch(console.error);
          }
        }
      } catch (e) { console.error(e); }
    }
  };

  useEffect(() => {
    if (!user || activeTab !== 'messages') return;
    chatAPI.listMyChats().then(res => {
      if (res.success) setArtistConversations(res.data || []);
    }).catch(console.error);
    const interval = setInterval(() => {
      chatAPI.listMyChats().then(res => {
        if (res.success) setArtistConversations(res.data || []);
      }).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [user, activeTab]);

  // If chatId is provided in query, open messages tab and select that chat; add to list if missing
  const location = useLocation();
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(location.search);
    const chatId = params.get('chatId');
    if (chatId) {
      handleTabChange('messages');
      chatAPI.getChat(chatId).then(res => {
        if (res.success && res.data) {
          const chat = res.data;
          setSelectedConversation(chat);
          setCurrentChat(chat);
          setChatMessages(chat.messages || []);
          const otherId = chat.client?._id || chat.clientId;
          if (otherId) {
            const roomId = buildDirectRoomId(user?._id, otherId);
            joinRoom(roomId, { userId: user?._id, userType: 'artist' });
          }
          chatAPI.markRead(chat._id).catch(() => {});
          setArtistConversations(prev => {
            const exists = prev.some(c => (c._id || c.id) === chat._id);
            if (exists) return prev;
            const display = {
              ...chat,
              clientName: chat.client ? `${chat.client.firstName} ${chat.client.lastName}` : 'Client',
              clientImage: chat.client?.userProfileImage || chat.clientImage,
              lastMessage: chat.messages?.length ? chat.messages[chat.messages.length - 1].text : '',
              unreadCount: 0
            };
            return [display, ...prev];
          });
        }
      }).catch(() => {});
    }
  }, [location.search, user]);

  // useEffect(() => {
  //   if (!user) return;
  //   const onMessage = (incoming) => {
  //     if (!currentChat) return;
  //     setChatMessages(prev => [...prev, {
  //       id: incoming.id,
  //       sender: incoming.senderId,
  //       text: incoming.message,
  //       createdAt: new Date().toISOString(),
  //     }]);
  //   };
  //   const onTyping = ({ userId, isTyping }) => {
  //     // optional: typing state
  //   };
  //   socket.on('message', onMessage);
  //   socket.on('typing', onTyping);
  //   return () => {
  //     socket.off('message', onMessage);
  //     socket.off('typing', onTyping);
  //   };
  // }, [user, currentChat]);

  // The FIXED code
useEffect(() => {
  if (!user) return;
  const onMessage = (incoming) => {
    if (!currentChat || String(incoming.senderId) === String(user?._id)) {
      return;
    }
    
    setChatMessages(prev => [...prev, {
      id: incoming.id,
      sender: incoming.senderId,
      text: incoming.message,
      createdAt: new Date().toISOString(),
    }]);
  };
  const onTyping = ({ userId, isTyping }) => {
    // optional: typing state
  };
  socket.on('message', onMessage);
  socket.on('typing', onTyping);
  return () => {
    socket.off('message', onMessage);
    socket.off('typing', onTyping);
  };
}, [user, currentChat]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getProposalStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="proposal-status pending">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            Pending
          </span>
        );
      case 'accepted':
        return (
          <span className="proposal-status accepted">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12" />
            </svg>
            Accepted
          </span>
        );
      case 'declined':
        return (
          <span className="proposal-status declined">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Declined
          </span>
        );
      default:
        return (
          <span className="proposal-status pending">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            Pending
          </span>
        );
    }
  };

  return (
    <>
      <div className="dashboard-layout">
        {/* Sidebar */}
        <ArtistSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
        />

        {/* Main Content */}
        <div className="dashboard-main-content">
          {/* Mobile Sidebar Toggle */}
          <button
            className="sidebar-toggle-btn"
            onClick={handleSidebarToggle}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="dashboard-container">

            <div className="dashboard-content">
              {activeTab === 'dashboard' && (
                <>
                  {/* Welcome Section */}
                  <div className="welcome-section">
                    <h2 className="welcome-message">Hi {artistName.split(' ')[0]} 👋, here are your upcoming mehndi events!</h2>

                    {/* Next Event Card */}
                    <div className="next-event-card">
                      <div className="event-header">
                        <FaCalendarAlt className="event-icon" style={{ color: '#d4a574', fontSize: '24px' }} />
                        <h3 style={{ marginLeft: '12px' }}>
                          {nextEvent ? `Next Event: ${nextEvent.title}` : 'No upcoming event'}
                        </h3>
                      </div>
                      {nextEvent && (
                        <>
                          <div className="event-details">
                            <div className="event-left">
                              <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                {/* <FaUser style={{ color: '#d4a574' }} /> */}
                                <strong>Client:</strong> {nextEvent.client}
                              </p>
                              <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                {/* <FaCalendarAlt style={{ color: '#d4a574' }} /> */}
                                <strong>Date:</strong> {nextEvent.date} - {nextEvent.timeSlot}
                              </p>
                                {nextEvent.location && (
                                  <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                    <strong>Location:</strong> {nextEvent.location}
                                  </p>
                                )}
                            </div>
                            <div className="event-right">
                              <div className="status-badge deposit-paid" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'transparent', padding: '0px', margin: '0px', color: '#2d5f3f', fontWeight: '600' }}>
                                <FaCheckCircle style={{ color: '#2d5f3f' }} />
                                {nextEvent.status}
                              </div>
                              <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e67e22', fontWeight: '600', marginTop: '0px' }}>
                                <FaClock style={{ color: '#e67e22' }} />
                                Starts in {nextEvent.daysLeft} day{nextEvent.daysLeft === 1 ? '' : 's'}
                              </p>
                            </div>
                          </div>
                          <div style={{ marginTop: '16px' }}>
                            <button 
                              className="btn-primary" 
                              onClick={() => openViewBooking(nextEvent.id)}
                              style={{ 
                                padding: '10px 24px',
                                fontSize: '14px',
                                fontWeight: '600',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                backgroundColor: '#d4a574',
                                border: 'none',
                                color: 'white'
                              }}
                            >
                              View Event Details
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="dashboard-main">
                    {/* Left Column - Bookings */}
                    <div className="bookings-section">
                      <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaCalendarAlt style={{ color: '#d4a574' }} /> 
                        Upcoming & Confirmed Bookings
                      </h3>
                      {(!secondEvent) ? (
                        <div style={{ textAlign: 'center' }}>
                          <div className="no-more-bookings" style={{ 
                            border: '2px dashed #d4a574', 
                            borderRadius: '12px', 
                            padding: '40px 20px',
                            textAlign: 'center',
                            backgroundColor: '#F5DEB3',
                            marginBottom: '20px'
                          }}>
                            <p style={{ 
                              fontSize: '16px', 
                              fontWeight: '600', 
                              color: '#666', 
                              margin: 0
                            }}>
                              No more confirmed bookings
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                        {secondEvent && (
                          <div className="booking-card" style={{ marginBottom: '20px' }}>
                            <div className="booking-info">
                              <h4 className="booking-title">{secondEvent.title} - {secondEvent.date}</h4>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                <p className="booking-artist">Client: {secondEvent.client}</p>
                                <span className="status-badge small">{secondEvent.status}</span>
                              </div>
                              <div className="booking-meta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                              <span>{secondEvent.timeSlot}</span>
                                {secondEvent.daysLeft !== undefined && (
                                  <span className="days-left-text">{secondEvent.daysLeft} day{secondEvent.daysLeft === 1 ? '' : 's'} left ⌛</span>
                                )}
                              </div>
                              {/* <div className="booking-meta" style={{marginTop:'6px'}}>
                                <span><strong>Date:</strong> {secondEvent.date}</span>
                              </div> */}
                              {/* <div className="booking-meta" style={{marginTop:'4px'}}>
                                <span><strong>Time:</strong> {secondEvent.timeSlot}</span>
                              </div> */}
                            </div>
                            
                            {/* View Detail Button */}
                            <div style={{ marginTop: '12px' }}>
                              <button 
                                className="btn-primary" 
                                onClick={() => openViewBooking(secondEvent.id)}
                                style={{ 
                                  padding: '8px 20px',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  backgroundColor: '#d4a574',
                                  border: 'none',
                                  color: 'white'
                                }}
                              >
                                View Event Details
                              </button>
                            </div>

                            {/* Notes & Reminders Section */}
                            <div style={{ 
                              marginTop: '20px', 
                              padding: '16px', 
                              backgroundColor: '#f9f9f9', 
                              borderRadius: '8px',
                              border: '1px solid #e0e0e0'
                            }}>
                              <h4 style={{ 
                                margin: '0 0 12px 0', 
                                fontSize: '14px', 
                                fontWeight: '600',
                                color: '#333',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <FaStickyNote style={{ color: '#d4a574' }} />
                                Notes & Reminders
                              </h4>
                              
                              <textarea 
                                placeholder="Add prep notes here..."
                                value={bookingNotes[secondEvent.id]?.newNote || ''}
                                onChange={(e) => {
                                  setBookingNotes(prev => ({
                                    ...prev,
                                    [secondEvent.id]: {
                                      ...prev[secondEvent.id],
                                      newNote: e.target.value
                                    }
                                  }));
                                }}
                                style={{
                                  width: '100%',
                                  minHeight: '80px',
                                  padding: '10px',
                                  border: '1px solid #ddd',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  resize: 'vertical',
                                  marginBottom: '10px'
                                }}
                                disabled={savingNote}
                              />
                              
                              {/* <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <input 
                                  type="checkbox" 
                                  id={`followup-${secondEvent.id}`}
                                  checked={bookingNotes[secondEvent.id]?.followUp || false}
                                  onChange={(e) => {
                                    setBookingNotes(prev => ({
                                      ...prev,
                                      [secondEvent.id]: {
                                        ...prev[secondEvent.id],
                                        followUp: e.target.checked
                                      }
                                    }));
                                  }}
                                  style={{ cursor: 'pointer' }}
                                  disabled={savingNote}
                                />
                                <label htmlFor={`followup-${secondEvent.id}`} style={{ fontSize: '13px', cursor: 'pointer', userSelect: 'none' }}>
                                  Follow up with client
                                </label>
                              </div> */}
                              
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button 
                                  onClick={async () => {
                                    const note = bookingNotes[secondEvent.id]?.newNote?.trim();
                                    if (!note) {
                                      showError('Please enter a note');
                                      return;
                                    }
                                    
                                    try {
                                      setSavingNote(true);
                                      await applicationsAPI.addApplicationNote(secondEvent.id, {
                                        content: note,
                                        followUp: bookingNotes[secondEvent.id]?.followUp || false
                                      });
                                      
                                      // Fetch updated notes
                                      const resp = await applicationsAPI.getApplicationNotes(secondEvent.id);
                                      setBookingNotes(prev => ({
                                        ...prev,
                                        [secondEvent.id]: {
                                          notes: resp.data || [],
                                          newNote: '',
                                          followUp: false
                                        }
                                      }));
                                      
                                      showSuccess('Note saved successfully');
                                    } catch (e) {
                                      showError(e.message || 'Failed to save note');
                                    } finally {
                                      setSavingNote(false);
                                    }
                                  }}
                                  disabled={savingNote || !bookingNotes[secondEvent.id]?.newNote?.trim()}
                                  style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#d4a574',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: savingNote || !bookingNotes[secondEvent.id]?.newNote?.trim() ? 'not-allowed' : 'pointer',
                                    opacity: savingNote || !bookingNotes[secondEvent.id]?.newNote?.trim() ? 0.6 : 1
                                  }}
                                >
                                  {savingNote ? 'Saving...' : 'Save Notes'}
                                </button>
                                
                                {bookingNotes[secondEvent.id]?.notes?.length > 0 && (
                                  <button 
                                    onClick={() => {
                                      setViewNotesBookingId(secondEvent.id);
                                      setViewNotesModalOpen(true);
                                    }}
                                    style={{
                                      padding: '8px 16px',
                                      backgroundColor: 'transparent',
                                      color: '#d4a574',
                                      border: '1px solid #d4a574',
                                      borderRadius: '6px',
                                      fontSize: '13px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px'
                                    }}
                                  >
                                    <FaEye /> View Notes ({bookingNotes[secondEvent.id]?.notes?.length})
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        </>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                        <button 
                          onClick={() => {
                            handleTabChange('applications');
                          }}
                          style={{
                            padding: '12px 28px',
                            backgroundColor: 'transparent',
                            color: '#d4a574',
                            border: '2px solid #d4a574',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.backgroundColor = '#d4a574';
                            e.target.style.color = 'white';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#d4a574';
                          }}
                        >
                          View All Bookings
                        </button>
                      </div>
                    </div>

                    {/* Right Column - Notifications */}
                    {/* <div className="notifications-section">
                      <h3 className="section-title">🔔 Notifications</h3>
                      <div className="notifications-list">
                        {notifications.length === 0 ? (
                          <div className="notification-item default"><span className="notification-icon">ℹ️</span><p className="notification-text">No notifications</p></div>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} className={`notification-item ${n.type}`}>
                              <span className="notification-icon">{n.type === 'success' ? '✅' : n.type === 'warning' ? '⏰' : n.type === 'danger' ? '⚠️' : '📩'}</span>
                              <p className="notification-text">{n.text}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div> */}
                  </div>

                  {/* Requests Near You */}
                  <div className="nearby-requests">
                    <div className="nearby-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="nearby-icon">📍</span>
                        <h3 className="section-title" style={{ margin: '0', marginLeft: '8px' }}>Requests Near You</h3>
                      </div>
                      <button 
                        className="refresh-btn"
                        onClick={fetchNearbyBookings}
                        disabled={nearbyLoading}
                        style={{ 
                          padding: '8px 16px', 
                          fontSize: '13px', 
                          background: nearbyLoading ? '#e0e0e0' : '#d4a574',
                          color: nearbyLoading ? '#999' : 'white',
                          border: 'none', 
                          borderRadius: '6px',
                          cursor: nearbyLoading ? 'not-allowed' : 'pointer',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => {
                          if (!nearbyLoading) {
                            e.target.style.background = '#b8945f';
                            e.target.style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!nearbyLoading) {
                            e.target.style.background = '#d4a574';
                            e.target.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23,4 23,10 17,10"/>
                          <polyline points="1,20 1,14 7,14"/>
                          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                        </svg>
                        {nearbyLoading ? 'Loading...' : 'Refresh'}
                      </button>
                    </div>
                    <div className="nearby-list">
                      {nearbyLoading ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                          Loading nearby requests...
                        </div>
                      ) : nearbyRequests.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                          No requests found within 3km
                        </div>
                      ) : (
                        nearbyRequests.map(r => (
                          <div key={r.id} className="request-card" style={{ 
                            background: 'white',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            border: '1px solid #f0f0f0',
                            transition: 'all 0.2s ease'
                          }}>
                            <div className="request-info" style={{ flex: 1, marginRight: '16px' }}>
                              <h4 className="request-title" style={{ 
                                margin: '0 0 8px 0', 
                                fontSize: '16px', 
                                fontWeight: '600', 
                                color: '#333',
                                lineHeight: '1.4'
                              }}>
                                {r.title}
                              </h4>
                              <p className="request-meta" style={{ 
                                margin: '0 0 6px 0', 
                                fontSize: '14px', 
                                color: '#666',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <span style={{ 
                                  background: '#e8f5e8', 
                                  color: '#2e7d32', 
                                  padding: '2px 8px', 
                                  borderRadius: '12px', 
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}>
                                  {r.budget}
                                </span>
                                <span style={{ color: '#888' }}>•</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                    <circle cx="12" cy="10" r="3"/>
                                  </svg>
                                  {r.location}
                                </span>
                              </p>
                              <p className="request-client" style={{ 
                                margin: '0', 
                                fontSize: '13px', 
                                color: '#888',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                  <circle cx="12" cy="7" r="4"/>
                                </svg>
                                {r.client}
                              </p>
                            </div>
                            <div className="request-actions" style={{ 
                              display: 'flex', 
                              gap: '10px', 
                              flexDirection: 'column',
                              minWidth: '120px'
                            }}>
                              <button
                                className="view-detail-btn"
                                onClick={() => openViewBooking(r.id)}
                                style={{
                                  padding: '10px 16px',
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  background: 'white',
                                  color: '#d4a574',
                                  border: '2px solid #d4a574',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = '#d4a574';
                                  e.target.style.color = 'white';
                                  e.target.style.transform = 'translateY(-1px)';
                                  e.target.style.boxShadow = '0 4px 12px rgba(212, 165, 116, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'white';
                                  e.target.style.color = '#d4a574';
                                  e.target.style.transform = 'translateY(0)';
                                  e.target.style.boxShadow = 'none';
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                  <circle cx="12" cy="12" r="3"/>
                                </svg>
                                View Detail
                              </button>
                              <button
                                className="apply-now-btn"
                                onClick={() => openApplyModal(r.id)}
                                style={{
                                  padding: '10px 16px',
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  background: 'linear-gradient(135deg, #d4a574, #b8945f)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  boxShadow: '0 2px 8px rgba(212, 165, 116, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = 'linear-gradient(135deg, #b8945f, #a0854a)';
                                  e.target.style.transform = 'translateY(-1px)';
                                  e.target.style.boxShadow = '0 4px 16px rgba(212, 165, 116, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'linear-gradient(135deg, #d4a574, #b8945f)';
                                  e.target.style.transform = 'translateY(0)';
                                  e.target.style.boxShadow = '0 2px 8px rgba(212, 165, 116, 0.3)';
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                  <circle cx="8.5" cy="7" r="4"/>
                                  <polyline points="17,11 19,13 23,9"/>
                                </svg>
                                Apply Now
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="browse-row">
                      <button className="browse-requests-btn" onClick={() => handleTabChange('applications')}>Browse All Client Requests</button>
                    </div>
                  </div>

                  {/* KPI Stats (moved below Requests Near You) */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: '20px',
                    marginBottom: '30px'
                  }}>
                    {/* Bookings Card */}
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      textAlign: 'center',
                      padding: '20px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '1px solid #f0f0f0'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <span style={{ 
                          fontSize: '22px', 
                          fontWeight: '700',
                          color: '#333'
                        }}>
                          {kpiStats.bookings.value} Bookings
                        </span>
                        <span style={{ 
                          fontSize: '20px', 
                          color: '#22c55e',
                          fontWeight: '600'
                        }}>
                          ↗
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#22c55e',
                        fontWeight: '500'
                      }}>
                        {kpiStats.bookings.sub}
                      </div>
                    </div>

                    {/* Applications Card */}
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '20px',
                      textAlign: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '1px solid #f0f0f0'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <span style={{ 
                          fontSize: '22px', 
                          fontWeight: '700',
                          color: '#333'
                        }}>
                          {kpiStats.applications.value} Applications
                        </span>
                        <span style={{ 
                          fontSize: '20px', 
                          color: '#298AFF',
                          fontWeight: '600'
                        }}>
                          ↗
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#298AFF',
                        fontWeight: '500'
                      }}>
                        {kpiStats.applications.sub}
                      </div>
                    </div>

                    {/* Conversion Rate Card */}
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '20px',
                      textAlign: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '1px solid #f0f0f0'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <span style={{ 
                          fontSize: '22px', 
                          fontWeight: '700',
                          color: '#333'
                        }}>
                          {kpiStats.conversion.value}
                        </span>
                        <span style={{ 
                          fontSize: '20px', 
                          color: '#ef4444',
                          fontWeight: '600'
                        }}>
                          ↘
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        fontWeight: '600',
                        color: 'purple',
                        marginBottom: '4px'
                      }}>
                        Conversion Rate
                      </div>
                    </div>

                    {/* Response Rate Card */}
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '20px',
                      textAlign: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '1px solid #f0f0f0'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <span style={{ 
                          fontSize: '22px', 
                          fontWeight: '700',
                          color: '#333'
                        }}>
                          {kpiStats.response.value}
                        </span>
                        <span style={{ 
                          fontSize: '20px', 
                          color: '#22c55e',
                          fontWeight: '600'
                        }}>
                          ↗
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        fontWeight: '600',
                        color: '#EABF36',
                        marginBottom: '4px'
                      }}>
                        Response Rate
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics and Quick Links */}
                  <div className="key-metrics-section">
                    <div className="key-metrics-card">
                      <div className="key-metrics-header">📌 Key Metrics</div>
                      <p className="metric-line"><span className="metric-label">Avg Booking Value:</span> <strong>£200</strong></p>
                      <p className="metric-line"><span className="metric-label">Avg Client Spend:</span> <strong>£350</strong></p>
                      <p className="metric-highlight">You earned 20% more than avg artist in London this month 🎉</p>
                    </div>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, 1fr)', 
                      gap: '20px',
                      marginTop: '20px'
                    }}>
                      {/* Wallet / Earnings Card */}
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '30px 20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid #f0f0f0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                      }}
                      onClick={() => {
                        handleTabChange('earnings');
                      }}
                      >
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '12px',
                          backgroundColor: '#fff5e6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <FaWallet style={{ fontSize: '28px', color: '#ff8c42' }} />
                        </div>
                        <div style={{ 
                          fontSize: '16px', 
                          fontWeight: '600',
                          color: '#333'
                        }}>
                          Wallet / Earnings
                        </div>
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#888',
                          fontWeight: '500'
                        }}>
                          £750.00 earned
                        </div>
                      </div>

                      {/* Messages Card */}
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '30px 20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid #f0f0f0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                      }}
                      onClick={() => {
                        handleTabChange('messages');
                      }}
                      >
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '12px',
                          backgroundColor: '#fff5e6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <FaCommentDots style={{ fontSize: '28px', color: '#ff8c42' }} />
                        </div>
                        <div style={{ 
                          fontSize: '16px', 
                          fontWeight: '600',
                          color: '#333'
                        }}>
                          Messages
                        </div>
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#888',
                          fontWeight: '500'
                        }}>
                          3 new
                        </div>
                      </div>

                      {/* Reviews Card */}
                      <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '30px 20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid #f0f0f0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                      }}
                      >
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '12px',
                          backgroundColor: '#fff5e6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <FaStar style={{ fontSize: '28px', color: '#ff8c42' }} />
                        </div>
                        <div style={{ 
                          fontSize: '16px', 
                          fontWeight: '600',
                          color: '#333'
                        }}>
                          Reviews
                        </div>
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#888',
                          fontWeight: '500'
                        }}>
                          12 total
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'applications' && (
                <div className="applications-page">
                  <h2 className="apps-title">My Applications</h2>
                  <p className="apps-subtitle">Track all the requests you’ve applied to</p>

                  {/* Stats */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(5, 1fr)', 
                    gap: '15px',
                    marginBottom: '30px'
                  }}>
                    {/* Applied */}
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '25px 15px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: '1px solid #f0f0f0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      gap: '10px'
                    }}>
                      <div style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '10px',
                        backgroundColor: '#fef3c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FaEnvelope style={{ fontSize: '20px', color: '#f59e0b' }} />
                      </div>
                      <div style={{ 
                        fontSize: '32px', 
                        fontWeight: '700',
                        color: '#333'
                      }}>{applicationStats.applied}</div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: '#666'
                      }}>
                        Applied
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#f59e0b',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>▲</span> {applicationStats.total > 0 ? `${applicationStats.applied} total` : 'No applications'}
                      </div>
                    </div>

                    {/* Accepted */}
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '25px 15px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: '1px solid #f0f0f0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      gap: '10px'
                    }}>
                      <div style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '10px',
                        backgroundColor: '#d1fae5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FaCheckCircle style={{ fontSize: '20px', color: '#10b981' }} />
                      </div>
                      <div style={{ 
                        fontSize: '32px', 
                        fontWeight: '700',
                        color: '#333'
                      }}>{applicationStats.accepted}</div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: '#666'
                      }}>
                        Accepted
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#10b981',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>▲</span> {applicationStats.acceptanceRate}% rate
                      </div>
                    </div>

                    {/* Declined */}
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '25px 15px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: '1px solid #f0f0f0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      gap: '10px'
                    }}>
                      <div style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '10px',
                        backgroundColor: '#fee2e2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FaTimes style={{ fontSize: '20px', color: '#ef4444' }} />
                      </div>
                      <div style={{ 
                        fontSize: '32px', 
                        fontWeight: '700',
                        color: '#333'
                      }}>{applicationStats.declined}</div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: '#666'
                      }}>
                        Declined
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#ef4444',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>▼</span> {applicationStats.declined > 0 ? `${applicationStats.declined} declined` : 'No declines'}
                      </div>
                    </div>

                    {/* Withdrawn */}
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '25px 15px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: '1px solid #f0f0f0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      gap: '10px'
                    }}>
                      <div style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '10px',
                        backgroundColor: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FaArrowLeft style={{ fontSize: '20px', color: '#999' }} />
                      </div>
                      <div style={{ 
                        fontSize: '32px', 
                        fontWeight: '700',
                        color: '#333'
                      }}>{applicationStats.withdrawn}</div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: '#666'
                      }}>
                        Withdrawn
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#999',
                        fontWeight: '500'
                      }}>
                        {applicationStats.withdrawn > 0 ? `${applicationStats.withdrawn} withdrawn` : 'No withdrawals'}
                      </div>
                    </div>

                    {/* Expired */}
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '25px 15px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: '1px solid #f0f0f0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      gap: '10px'
                    }}>
                      <div style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '10px',
                        backgroundColor: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FaClock style={{ fontSize: '20px', color: '#999' }} />
                      </div>
                      <div style={{ 
                        fontSize: '32px', 
                        fontWeight: '700',
                        color: '#333'
                      }}>{applicationStats.expired}</div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: '#666'
                      }}>
                        Expired
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#f59e0b',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>⏰</span> {applicationStats.expired > 0 ? `${applicationStats.expired} expired` : 'No expired'}
                      </div>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="apps-filters">
                    {['all', 'applied', 'accepted', 'declined', 'withdrawn', 'expired'].map(f => (
                      <button
                        key={f}
                        className={`apps-pill ${applicationsFilter === f ? 'active' : ''}`}
                        onClick={() => {
                          setApplicationsFilter(f);
                          if (f === 'applied') {
                            fetchAppliedBookings();
                          } else if (f === 'all') {
                            fetchPendingBookings();
                          } else if (['accepted','declined','withdrawn','expired'].includes(f)) {
                            fetchApplicationsByStatus(f);
                          }
                        }}
                      >
                        {f === 'all' ? 'Active' : (f.charAt(0).toUpperCase() + f.slice(1))}
                      </button>
                    ))}
                  </div>

                  {/* List - show pending bookings as applications */}
                  <div className="apps-list">
                    {appsLoading && (<div className="app-card"><div>Loading pending bookings...</div></div>)}
                    {appsError && (<div className="app-card"><div style={{color:'#c33'}}>{appsError}</div></div>)}
                    {!appsLoading && !appsError && applications
                      .filter(a => applicationsFilter === 'all' ? true : a.status === applicationsFilter)
                      .map(a => (
                        <div key={a.id} className="app-card">
                          <h3 className="app-title">{a.title}</h3>
                          <div className="app-meta">
                            <div>Client: {a.client}</div>
                            <div>Budget: {a.budget}</div>
                            <div>Posted on: {a.appliedOn}</div>
                          </div>
                          <span className={`app-badge ${applicationsFilter === 'all' ? 'active' : a.status}`}
                            style={
                              applicationsFilter === 'all'
                                ? { background: '#16a34a', borderColor: '#16a34a', color: '#ffffff' }
                                : (applicationsFilter === 'applied'
                                    ? { background: '#d4af37', borderColor: '#d4af37', color: '#1f2937' }
                                    : undefined)
                            }
                          >
                            {applicationsFilter === 'all' ? 'Active' : (a.status.charAt(0).toUpperCase() + a.status.slice(1))}
                          </span>
                          {/* <p className="app-note">Assigned artists: {a.assignedCount ?? 0}</p> */}
                          <div className="app-actions">
                            <button className="app-btn" onClick={() => openViewBooking(a.id)} disabled={viewLoading}>View Details</button>
                            {applicationsFilter === 'all' && (
                              <button className="app-btn apply-now" style={{ marginLeft: '8px' }} onClick={() => openApplyModal(a.id)}>Apply Now</button>
                            )}
                            {applicationsFilter === 'applied' && (
                              <button className="app-btn app-btn-danger" style={{ marginLeft: '8px' }} onClick={() => handleWithdrawApplication(a.id)}>Withdraw</button>
                            )}
                            {applicationsFilter === 'accepted' && (() => {
                              // Check if event is within 14 days
                              const eventDate = new Date(a.eventDate);
                              const today = new Date();
                              const daysDiff = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
                              const isWithin14Days = daysDiff <= 14 && daysDiff >= 0;
                              const tooltipMsg = "You can't cancel within 14 days of the event";

                              return (
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                  <button 
                                    className="app-btn app-btn-danger" 
                                    style={{ 
                                      marginLeft: '8px',
                                      cursor: isWithin14Days ? 'not-allowed' : 'pointer',
                                      opacity: isWithin14Days ? 0.5 : 1
                                    }} 
                                    onClick={() => {
                                      if (isWithin14Days) {
                                        showError(tooltipMsg);
                                        return;
                                      }
                                      openCancelAccepted(a.id);
                                    }}
                                    disabled={isWithin14Days}
                                    title={isWithin14Days ? tooltipMsg : ''}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              );
                            })()}
                            {applicationsFilter === 'accepted' && (() => {
                              // Check if current date is greater than or equal to event date
                              const eventDate = new Date(a.eventDate);
                              const today = new Date();
                              
                              // Set both dates to midnight for accurate comparison
                              eventDate.setHours(0, 0, 0, 0);
                              today.setHours(0, 0, 0, 0);
                              
                              const canMarkComplete = today.getTime() >= eventDate.getTime();
                              const tooltipMsg = "You can only mark as complete on or after the event date";

                              return (
                                <button 
                                  className="app-btn" 
                                  style={{ 
                                    background: canMarkComplete ? '#e24d0c' : '#d1d5db', 
                                    color: '#fff', 
                                    borderColor: canMarkComplete ? '#e24d0c' : '#d1d5db',
                                    cursor: canMarkComplete ? 'pointer' : 'not-allowed',
                                    opacity: canMarkComplete ? 1 : 0.6
                                  }} 
                                  onClick={() => { 
                                    if (canMarkComplete) {
                                      setMarkTargetBookingId(a.id); 
                                      setMarkProofOpen(true); 
                                    } else {
                                      showError(tooltipMsg);
                                    }
                                  }}
                                  disabled={!canMarkComplete}
                                  title={!canMarkComplete ? tooltipMsg : 'Mark as complete'}
                                >
                                  Mark Complete
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      ))}
                    {!appsLoading && !appsError && applications.length === 0 && (
                      <div className="app-card"><div>No pending bookings right now.</div></div>
                    )}
                  </div>
                </div>
              )}

              {/* Cancel Accepted Application Modal */}
              <CancelAcceptedModal
                isOpen={cancelAcceptedOpen}
                onClose={() => { setCancelAcceptedOpen(false); setCancelTarget(null); }}
                onConfirm={handleConfirmCancelAccepted}
              />

              <MarkCompleteProofModal
                isOpen={markProofOpen}
                onClose={() => { setMarkProofOpen(false); setMarkTargetBookingId(null); }}
                onSubmit={(result) => {
                  console.log('MarkComplete proof uploaded:', { bookingId: markTargetBookingId, ...result });
                  showSuccess('Booking marked as completed successfully!');
                  setMarkProofOpen(false);
                  setMarkTargetBookingId(null);
                  // Refetch applications in Applications tab
                  if (applicationsFilter === 'accepted') {
                    fetchApplicationsByStatus('accepted');
                  }
                  // Refetch calendar data
                  fetchAcceptedCalendar();
                }}
                bookingId= {markTargetBookingId}
                cloudinary={{
                  cloudName: "dstelsc7m",
                  uploadPreset: "mehndi",
                  folder: 'mehndi/proofs'
                }}
              />

              {/* Portfolio Preview Modal */}
              {previewOpen && previewPortfolio && (
                <div className="modal-overlay" onClick={()=>{ setPreviewOpen(false); setPreviewPortfolio(null); }}>
                  <div className="application-modal" onClick={(e)=>e.stopPropagation()}>
                    <div className="modal-header">
                      <h3 className="modal-title">Portfolio Preview</h3>
                      <button className="modal-close" onClick={()=>{ setPreviewOpen(false); setPreviewPortfolio(null); }}>×</button>
                    </div>
                    <div className="modal-body">
                      <div className="modal-grid">
                        <div className="form-group full">
                          <strong>{previewPortfolio.displayName || 'Untitled'}</strong>
                          <div>{previewPortfolio.tagline || ''}</div>
                        </div>
                        <div className="form-group full">
                          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'8px'}}>
                            {(previewPortfolio.mediaUrls || []).map((u,idx)=> (
                              <div key={idx} style={{background:'#f5f5f5',borderRadius:8,overflow:'hidden'}}>
                                <img alt="media" src={u} style={{width:'100%',height:120,objectFit:'cover'}} />
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="form-group full">
                          <div><strong>Bio</strong></div>
                          <div>{previewPortfolio.bio}</div>
                        </div>
                        <div className="form-group full" style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                          {(previewPortfolio.styles || []).map(s=> (<span key={s} className="apps-pill">{s}</span>))}
                          {(previewPortfolio.categories || []).map(c=> (<span key={c} className="apps-pill secondary">{c}</span>))}
                        </div>
                        <div className="form-group full" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))',gap:8}}>
                          <div>Hourly: £{previewPortfolio.hourlyRate ?? '-'}</div>
                          <div>Per Hand: £{previewPortfolio.perHandRate ?? '-'}</div>
                          <div>Bridal: £{previewPortfolio.bridalPackagePrice ?? '-'}</div>
                          <div>Party: £{previewPortfolio.partyPackagePrice ?? '-'}</div>
                          <div>Outcall: £{previewPortfolio.outcallFee ?? '-'}</div>
                          <div>Travels: {previewPortfolio.travelsToClient ? 'Yes' : 'No'}</div>
                          <div>Published: {previewPortfolio.isPublished ? 'Yes' : 'No'}</div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button className="cancel-btn" onClick={()=>{ setPreviewOpen(false); setPreviewPortfolio(null); }}>Close</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Portfolio Delete Confirm Modal */}
              {deleteConfirmOpen && (
                <div className="modal-overlay" onClick={()=>{ setDeleteConfirmOpen(false); setDeleteTargetId(null); }}>
                  <div className="confirmation-modal" onClick={(e)=>e.stopPropagation()}>
                    <h3 className="modal-title">Delete Portfolio</h3>
                    <p className="modal-text">Are you sure you want to delete this portfolio?</p>
                    <div className="modal-actions">
                      <button className="cancel-btn" onClick={()=>{ setDeleteConfirmOpen(false); setDeleteTargetId(null); }}>Cancel</button>
                      <button className="confirm-btn decline" onClick={async ()=>{
                        try {
                          await portfoliosAPI.remove(deleteTargetId);
                          setDeleteConfirmOpen(false);
                          setDeleteTargetId(null);
                          showSuccess('Portfolio deleted');
                          fetchMyPortfolios();
                        } catch(e) {
                          showError(e.message || 'Failed to delete portfolio');
                        }
                      }}>Delete</button>
                    </div>
                  </div>
                </div>
              )}
              {/* Messages */}
              {activeTab === 'messages' && (
                <div className="messages-section">
                  <div className="messages-container">
                    {/* Conversations List */}
                    <div className="conversations-sidebar">
                      <div className="conversations-header">
                        <h3 className="conversations-title">Client Messages</h3>
                        <div className="conversations-count">
                          {artistConversations.reduce((total, conv) => total + conv.unreadCount, 0)} unread
                        </div>
                      </div>

                      <div className="conversations-list">
                        {artistConversations.map(conversation => (
                          <div
                            key={conversation.id}
                            className={`conversation-item ${selectedConversation?.id === conversation.id ? 'active' : ''}`}
                            onClick={() => handleSelectConversation(conversation)}
                          >
                            <div className="conversation-avatar">
                              <img src={(conversation.client?.userProfileImage) || conversation.clientImage || DEFAULT_AVATAR} alt={conversation.clientName || 'User'} />
                              {(() => {
                                const otherId = conversation.client?._id || conversation.clientId || conversation.id;
                                const online = otherId ? onlineUserIds.has(String(otherId)) : false;
                                return <div className={`status-indicator ${online ? 'online' : 'offline'}`}></div>;
                              })()}
                            </div>

                            <div className="conversation-info">
                            <div className="conversation-header">
                              <h4 className="client-name">{conversation.clientName || (conversation.client ? `${conversation.client.firstName} ${conversation.client.lastName}` : 'User')}</h4>
                                <span className="message-time">{conversation.lastMessageTime}</span>
                              </div>
                              <div className="conversation-preview">
                                <p className="last-message">{conversation.lastMessage}</p>
                                {conversation.unreadCount > 0 && (
                                  <span className="unread-badge">{conversation.unreadCount}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Chat Area */}
                    <div className="chat-area">
                      {selectedConversation ? (
                        <>
                          {/* Chat Header */}
                          <div className="chat-header">
                        <div className="chat-client-info">
                          <img src={(selectedConversation.client?.userProfileImage) || selectedConversation.clientImage || DEFAULT_AVATAR} alt={selectedConversation.clientName || (selectedConversation.client ? `${selectedConversation.client.firstName} ${selectedConversation.client.lastName}` : 'User')} />
                          <div>
                            <h3>{selectedConversation.clientName || (selectedConversation.client ? `${selectedConversation.client.firstName} ${selectedConversation.client.lastName}` : 'User')}</h3>
                            {(() => {
                              const otherId = selectedConversation.client?._id || selectedConversation.clientId || selectedConversation.id;
                              const online = otherId ? onlineUserIds.has(String(otherId)) : false;
                              return <span className={`status-text ${online ? 'online' : 'offline'}`}>{online ? 'Online' : 'Offline'}</span>;
                            })()}
                          </div>
                        </div>
                          </div>

                          {/* Messages List */}
                          <div className="messages-list">
                            {chatMessages.map((message, idx) => (
                              <div
                                key={message.id || idx}
                                className={`message ${String(message.sender) === String(user?._id) || message.senderId === 'artist' ? 'sent' : 'received'}`}
                              >
                                <div className="message-content">
                                  <p>{message.text || message.message}</p>
                                </div>
                                <div className="message-meta">
                                  <span className="message-time">{new Date(message.createdAt || Date.now()).toLocaleString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Message Input */}
                          <div className="message-input-area">
                            <div className="message-input-container">
                              <textarea
                                className="message-input"
                                placeholder="Type your message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                rows="1"
                              />

                              <button
                                className="send-btn"
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim()}
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2" />
                                  <polygon points="22,2 15,22 11,13 2,9 22,2" stroke="currentColor" strokeWidth="2" fill="currentColor" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="no-conversation-selected">
                          <div className="no-chat-icon">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" fill="none" />
                            </svg>
                          </div>
                          <h3>Select a conversation</h3>
                          <p>Choose a client conversation to start messaging.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* Schedule (placeholder) */}
              {activeTab === 'schedule' && (
                <div className="schedule-section">
                  <div className="section-header">
                    <h2>Schedule</h2>
                  </div>

                  <div className="calendar-card">
                    <div className="calendar-header">
                      <span className="cal-icon">📅</span>
                      <h3>Calendar</h3>
                    </div>
                    <div className="calendar-body">
                      <div className="calendar-control" style={{ margin:'0 auto' }}>
                        <button className="cal-nav" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>«</button>
                        <div className="cal-month">{calendarMonth.toLocaleString('en-GB', { month: 'long', year: 'numeric' })}</div>
                        <button className="cal-nav" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>»</button>
                      </div>
                      <div className="cal-grid">
                        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => <div key={d} className="cal-dow">{d}</div>)}
                        {Array.from({ length: 42 }).map((_, idx) => {
                          const date = getCellDate(idx);
                          const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                          const dateBookings = acceptedByDate[toKey(date)];
                          const dotType = dateBookings && dateBookings.length > 0 ? (dateBookings[0].tag || 'casual') : null;
                          return (
                            <button
                              key={idx}
                              className={`cal-cell ${isCurrentMonth ? '' : 'muted'} ${isSameDay(date, selectedDate) ? 'selected' : ''}`}
                              onClick={() => setSelectedDate(date)}
                            >
                              <span>{date.getDate()}</span>
                              {dotType && <span className={`cal-dot ${dotType}`} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="cal-legend" style={{display:'flex', justifyContent:'center'}}>
                      <span className="legend-item"><span className="legend-dot bridal"></span>Bridal</span>
                      <span className="legend-item"><span className="legend-dot festival"></span>Festival</span>
                      <span className="legend-item"><span className="legend-dot party"></span>Party</span>
                      <span className="legend-item"><span className="legend-dot casual"></span>Casual</span>
                    </div>
                  </div>

                  <div className="bookings-by-date">
                    <h3 className="section-title">Bookings on {selectedDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</h3>
                    {!(acceptedByDate[toKey(selectedDate)] || []).length && (
                      <div className="empty-banner">No bookings on this date.</div>
                    )}
                    {(acceptedByDate[toKey(selectedDate)] || []).map(b => (
                      <div key={b.id} className="booking-line-card">
                        <div className="b-info">
                          <div className="b-title">{b.title}</div>
                          <div className="b-row">Client: {b.client}</div>
                          <div className="b-row">Time: {b.time}</div>
                          <div className="b-row">Location: {b.location}</div>
                          <span className="b-badge">{b.status}</span>
                        </div>
                        <div className="b-actions">
                          <button className="app-btn danger" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={() => openCancelAccepted(b.id)}>Cancel</button>
                          <button className="app-btn" style={{ background: '#e24d0c', color: '#fff', borderColor: '#e24d0c' }} onClick={() => { setMarkTargetBookingId(b.id); setMarkProofOpen(true); }}>Mark Complete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wallet (UI only) */}
              {activeTab === 'wallet' && (
                <div className="wallet-section">
                  {/* Summary cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div style={{
                      background: 'linear-gradient(180deg,#fff5e6, #ffffff)',
                      border: '1px solid #ffddb3',
                      borderRadius: '14px',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start'
                    }}>
                      <div style={{ color: '#6b4a19', fontWeight: 600, marginBottom: '6px' }}>Remaining Balance</div>
                      <div style={{ fontSize: '36px', fontWeight: 800, color: '#d35400' }}>{walletLoading ? 'Loading…' : formatGBP(walletSummary.remainingBalance)}</div>
                      <button className="modern-withdraw-btn" onClick={openWithdraw} disabled={walletLoading || walletSummary.remainingBalance <= 0}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                        Withdraw Funds
                      </button>
                    </div>
                  </div>

                  {/* Transactions */}
                  <div className="transactions-card" style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
                      <h3 className="section-title" style={{ margin: 0 }}>Transaction History</h3>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                        <thead>
                          <tr style={{ background: '#fbfbfb', color: '#555' }}>
                            <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600 }}>Event</th>
                            <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600 }}>Method</th>
                            <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600 }}>Status</th>
                            <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600 }}>Date</th>
                            <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600 }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {walletTransactions.map((tx) => (
                            <tr key={tx.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '16px' }}>{tx.event}</td>
                              <td style={{ padding: '16px' }}>{tx.method}</td>
                              <td style={{ padding: '16px' }}>
                                <span className="status-badge" style={{ background: '#e7f9ef', color: '#1f7a3f', border: '1px solid #c9efd9', padding: '6px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, textTransform: 'capitalize' }}>{tx.type}</span>
                              </td>
                              <td style={{ padding: '16px' }}>{new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                              <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700 }}>{formatGBP(tx.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Withdraw Modal */}
                  {withdrawOpen && (
                    <div className="modern-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeWithdraw(); }}>
                      <div className="modern-withdraw-modal">
                        <div className="modern-modal-header">
                          <div className="modal-title-section">
                            <div className="withdraw-icon">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                            </div>
                            <div>
                              <h3 className="modal-title">Withdraw funds</h3>
                              <div className="modal-subtitle">Available balance: {formatGBP(walletSummary.remainingBalance)}</div>
                            </div>
                          </div>
                          <button className="modern-close-btn" onClick={closeWithdraw} aria-label="Close">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                        <div className="modern-modal-body">
                          <div className="balance-display">
                            <div className="balance-info">
                              <div>
                                <div className="balance-label">Remaining Balance</div>
                                <div className="balance-amount">{formatGBP(walletSummary.remainingBalance)}</div>
                              </div>
                            </div>
                          </div>
                          <div className="withdraw-form">
                            <div className="modern-form-group">
                              <label className="modern-label">Amount</label>
                              <div className="amount-input-container">
                                <span className="currency-symbol">£</span>
                                <input className="modern-amount-input" placeholder="0.00" inputMode="decimal" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                              </div>
                              <div className="quick-amounts">
                                {[10, 25, 50, 100].map((q) => (
                                  <button key={q} className="quick-amount-btn" type="button" onClick={() => setWithdrawAmount(String(q))}>£{q}</button>
                                ))}
                              </div>
                            </div>
                            <div className="withdraw-info-card">
                              <div className="info-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12" y2="16"/></svg> This is a demo UI. No real withdrawal will be made.</div>
                            </div>
                          </div>
                        </div>
                        <div className="modern-modal-actions">
                          <button className="modern-cancel-btn" onClick={closeWithdraw}>Cancel</button>
                          <button className="modern-confirm-btn" onClick={confirmWalletWithdraw} disabled={!canConfirmWithdraw() || withdrawLoading}>
                            {withdrawLoading && (
                              <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                            )}
                            {withdrawLoading ? 'Processing…' : 'Confirm Withdraw'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Earnings (placeholder) */}
              {activeTab === 'earnings' && (
                <div className="earnings-section">
                  <div className="section-header">
                    <h2>Earnings page</h2>
                  </div>

                  <h3 className="section-title" style={{ marginBottom: '10px' }}>Wallet & Earnings</h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: '20px',
                    marginBottom: '30px'
                  }}>
                    {/* Lifetime Earnings Card */}
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '30px 20px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '1px solid #f0f0f0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '10px',
                        backgroundColor: '#fff5e6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FaWallet style={{ fontSize: '24px', color: '#ff8c42' }} />
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#666',
                        fontWeight: '500'
                      }}>
                        Lifetime Earnings
                      </div>
                      <div style={{ 
                        fontSize: '24px', 
                        fontWeight: '700',
                        color: '#333'
                      }}>
                        £3,200.00
                      </div>
                    </div>

                    {/* This Month Card */}
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '30px 20px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '1px solid #f0f0f0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '10px',
                        backgroundColor: '#fff5e6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FaCalendarCheck style={{ fontSize: '24px', color: '#ff8c42' }} />
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#666',
                        fontWeight: '500'
                      }}>
                        This Month
                      </div>
                      <div style={{ 
                        fontSize: '24px', 
                        fontWeight: '700',
                        color: '#333'
                      }}>
                        £750.00
                      </div>
                    </div>

                    {/* Pending Payouts Card */}
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '30px 20px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '1px solid #f0f0f0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '10px',
                        backgroundColor: '#fff5e6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FaHourglassHalf style={{ fontSize: '24px', color: '#ff8c42' }} />
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#666',
                        fontWeight: '500'
                      }}>
                        Pending Payouts
                      </div>
                      <div style={{ 
                        fontSize: '24px', 
                        fontWeight: '700',
                        color: '#333'
                      }}>
                        £250.00
                      </div>
                    </div>

                    {/* Next Payout Card */}
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '30px 20px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '1px solid #f0f0f0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '10px',
                        backgroundColor: '#fff5e6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FaArrowCircleUp style={{ fontSize: '24px', color: '#ff8c42' }} />
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#666',
                        fontWeight: '500'
                      }}>
                        Next Payout
                      </div>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: '700',
                        color: '#333'
                      }}>
                        2025-09-03
                        <div style={{ 
                          fontSize: '13px', 
                          fontWeight: '500',
                          color: '#666',
                          marginTop: '4px'
                        }}>
                          (today)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notification Cards */}
                  <div style={{ 
                    display: 'flex',
                    gap: '20px',
                    marginBottom: '30px'
                  }}>
                    {/* Success Notice */}
                    <div style={{
                      flex: 1,
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #86efac',
                      borderRadius: '8px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}>
                      <FaCheckCircle style={{ 
                        fontSize: '20px', 
                        color: '#16a34a',
                        flexShrink: 0,
                        marginTop: '2px'
                      }} />
                      <p style={{ 
                        margin: 0, 
                        fontSize: '14px', 
                        color: '#166534',
                        lineHeight: '1.5'
                      }}>
                        £250 will be released once the event is marked complete or automatically in 24 hours.
                      </p>
                    </div>

                    {/* Warning Notice */}
                    <div style={{
                      flex: 1,
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde047',
                      borderRadius: '8px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}>
                      <FaExclamationTriangle style={{ 
                        fontSize: '20px', 
                        color: '#d97706',
                        flexShrink: 0,
                        marginTop: '2px'
                      }} />
                      <p style={{ 
                        margin: 0, 
                        fontSize: '14px', 
                        color: '#92400e',
                        lineHeight: '1.5'
                      }}>
                        Your payout to Barclays Bank is processing — expected by Sep 3.
                      </p>
                    </div>
                  </div>

                  <div className="payout-methods">
                    <h3 className="section-title">Payout Methods</h3>
                    <div className="payout-card">
                      {payoutMethods.map(m => (
                        <div key={m.id} className="payout-item">
                          <div className="payout-info">
                            <div className="payout-title">{m.bank} •••• {m.last4}</div>
                            <small className="payout-sub">{m.primary ? 'Primary Method' : 'Secondary'}</small>
                          </div>
                          <button className="app-btn secondary">Remove</button>
                        </div>
                      ))}
                      <button className="browse-requests-btn" style={{ marginTop: '10px' }}>+ Add New Payout Method</button>
                    </div>
                  </div>

                  {/* <div className="transactions-section">
                    <div className="transactions-header">
                      <h3 className="section-title">Recent Transactions</h3>
                      <div className="tx-controls">
                        <input className="form-input" placeholder="Search by client or event..." value={txSearch} onChange={(e) => setTxSearch(e.target.value)} />
                        <select className="form-input" value={txFilter} onChange={(e) => setTxFilter(e.target.value)}>
                          {['All', 'Released', 'Pending', 'Processing'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="tx-table">
                      <div className="tx-row tx-head">
                        <div>Event</div><div>Client</div><div>Date</div><div>Amount</div><div>Status</div>
                      </div>
                      {transactions
                        .filter(t => (txFilter === 'All' || t.status === txFilter) &&
                          (t.client.toLowerCase().includes(txSearch.toLowerCase()) || t.event.toLowerCase().includes(txSearch.toLowerCase())))
                        .map(t => (
                          <div key={t.id} className="tx-row">
                            <div>{t.event}</div>
                            <div>{t.client}</div>
                            <div>{t.date}</div>
                            <div>£{t.amount.toFixed(2)}</div>
                            <div><span className={`tx-badge ${t.status.toLowerCase()}`}>{t.status}</span></div>
                          </div>
                        ))}
                    </div>
                  </div> */}
                </div>
              )}

              {/* Profile (Portfolios CRUD) */}
              {activeTab === 'profile' && (
                <div className="profile-section">
                  <div className="section-header">
                    <h2>Profile</h2>
                  </div>

                  {/* Create Portfolio */}
                  <div className="uploader-card">
                    <h3 className="section-title">Create Portfolio</h3>
                    <div className="uploader-tools">
                      <div className="form-grid">
                        <div className="form-group half">
                          <label className="form-label">Display name</label>
                          <input className="form-input" value={portfolioForm.displayName} onChange={(e)=>setPortfolioForm({...portfolioForm, displayName:e.target.value})} />
                          {portfolioErrors.displayName && <small style={{color:'#b91c1c'}}>{portfolioErrors.displayName}</small>}
                      </div>
                        <div className="form-group half">
                          <label className="form-label">Tagline</label>
                          <input className="form-input" value={portfolioForm.tagline} onChange={(e)=>setPortfolioForm({...portfolioForm, tagline:e.target.value})} />
                    </div>
                        <div className="form-group full">
                          <label className="form-label">Bio</label>
                          <textarea className="form-input" rows={3} value={portfolioForm.bio} onChange={(e)=>setPortfolioForm({...portfolioForm, bio:e.target.value})} />
                          {portfolioErrors.bio && <small style={{color:'#b91c1c'}}>{portfolioErrors.bio}</small>}
                        </div>
                        <div className="form-group full">
                          <label className="form-label">Media URLs (comma separated)</label>
                          <input className="form-input" value={(portfolioForm.mediaUrls || []).join(', ')} onChange={(e)=>setPortfolioForm({...portfolioForm, mediaUrls:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} />
                          {portfolioErrors.mediaUrls && <small style={{color:'#b91c1c'}}>{portfolioErrors.mediaUrls}</small>}
                        </div>
                        <div className="form-group half">
                          <label className="form-label">Styles (comma separated)</label>
                          <input className="form-input" value={(portfolioForm.styles || []).join(', ')} onChange={(e)=>setPortfolioForm({...portfolioForm, styles:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} />
                          {portfolioErrors.styles && <small style={{color:'#b91c1c'}}>{portfolioErrors.styles}</small>}
                        </div>
                        <div className="form-group half">
                          <label className="form-label">Categories (comma separated)</label>
                          <input className="form-input" value={(portfolioForm.categories || []).join(', ')} onChange={(e)=>setPortfolioForm({...portfolioForm, categories:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} />
                        </div>
                        <div className="form-group third">
                          <label className="form-label">Hourly Rate (£)</label>
                          <input className="form-input" type="number" value={portfolioForm.hourlyRate} onChange={(e)=>setPortfolioForm({...portfolioForm, hourlyRate:e.target.value})} />
                        </div>
                        <div className="form-group third">
                          <label className="form-label">Per Hand Rate (£)</label>
                          <input className="form-input" type="number" value={portfolioForm.perHandRate} onChange={(e)=>setPortfolioForm({...portfolioForm, perHandRate:e.target.value})} />
                        </div>
                        <div className="form-group third">
                          <label className="form-label">Bridal Package (£)</label>
                          <input className="form-input" type="number" value={portfolioForm.bridalPackagePrice} onChange={(e)=>setPortfolioForm({...portfolioForm, bridalPackagePrice:e.target.value})} />
                        </div>
                        <div className="form-group third">
                          <label className="form-label">Party Package (£)</label>
                          <input className="form-input" type="number" value={portfolioForm.partyPackagePrice} onChange={(e)=>setPortfolioForm({...portfolioForm, partyPackagePrice:e.target.value})} />
                        </div>
                        <div className="form-group third">
                          <label className="form-label">Outcall Fee (£)</label>
                          <input className="form-input" type="number" value={portfolioForm.outcallFee} onChange={(e)=>setPortfolioForm({...portfolioForm, outcallFee:e.target.value})} />
                        </div>
                        <div className="form-group third">
                          <label className="form-label">Event Types (comma separated)</label>
                          <input className="form-input" value={(portfolioForm.eventTypes || []).join(', ')} onChange={(e)=>setPortfolioForm({...portfolioForm, eventTypes:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} />
                        </div>
                        <div className="form-group third">
                          <label className="form-label">Travels To Client</label>
                          <select className="form-input" value={portfolioForm.travelsToClient ? 'yes':'no'} onChange={(e)=>setPortfolioForm({...portfolioForm, travelsToClient:e.target.value==='yes'})}>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                      </select>
                      </div>
                        <div className="form-group third">
                          <label className="form-label">Published</label>
                          <select className="form-input" value={portfolioForm.isPublished ? 'yes':'no'} onChange={(e)=>setPortfolioForm({...portfolioForm, isPublished:e.target.value==='yes'})}>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                        <div className="form-actions">
                          <button className={`app-btn save-green`} disabled={savingPortfolio} onClick={async ()=>{
                            try {
                              const errs = validatePortfolio(portfolioForm);
                              setPortfolioErrors(errs);
                              if (Object.keys(errs).length > 0) { showError('Fill required details correctly'); return; }
                              setSavingPortfolio(true);
                              const payload = { ...portfolioForm };
                              // Convert numeric inputs
                              ['hourlyRate','perHandRate','bridalPackagePrice','partyPackagePrice','outcallFee','yearsOfExperience','dryingTimeMinutes','stainLongevityDays','maxClientsPerEvent']
                                .forEach(k=>{ if (payload[k] === '') delete payload[k]; else payload[k] = Number(payload[k]); });
                              await portfoliosAPI.create(payload);
                              showSuccess('Portfolio created');
                              setPortfolioForm({ ...portfolioForm, displayName:'', tagline:'', bio:'', mediaUrls:[], styles:[], categories:[], hourlyRate:'', perHandRate:'', bridalPackagePrice:'', partyPackagePrice:'', outcallFee:'', eventTypes:[] });
                              fetchMyPortfolios();
                            } catch (e) {
                              showError(e.message || 'Failed to create portfolio');
                            } finally {
                              setSavingPortfolio(false);
                            }
                          }}>{savingPortfolio ? 'Saving…' : 'Save Portfolio'}</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Portfolio List */}
                  <div className="portfolio-grid">
                    {portfoliosLoading && <div>Loading portfolios...</div>}
                    {!portfoliosLoading && portfolios.length === 0 && (
                      <div className="empty-state">No portfolios yet. Create your first above.</div>
                    )}
                    {portfolios.map(p => (
                      <div key={p._id} className="portfolio-item">
                        <div className="badge">{(p.categories || [])[0] || 'Mehndi'}</div>
                        <div className="thumb" style={{ backgroundImage: (p.mediaUrls && p.mediaUrls[0]) ? `url(${p.mediaUrls[0]})` : undefined }}></div>
                        <div className="item-actions">
                          <button className="app-btn secondary" onClick={()=>{ setPreviewPortfolio(p); setPreviewOpen(true); }}>Preview</button>
                          <button className="app-btn danger" onClick={()=>{ setDeleteTargetId(p._id); setDeleteConfirmOpen(true); }}>Delete</button>
                        </div>
                        <div className="item-info">
                          <div className="item-title">{p.displayName || 'Untitled'}</div>
                          <div className="item-sub">{p.tagline || ''}</div>
                      </div>
                  </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Withdraw Confirmation Modal */}
            {withdrawConfirmOpen && (
              <div className="modal-overlay" onClick={closeWithdrawConfirm}>
                <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
                  <h3 className="modal-title">Withdraw Application</h3>
                  <p className="modal-text">
                    Are you sure you want to withdraw your application?
                    <br />
                    <strong>You can't apply to this booking again.</strong>
                  </p>
                  <div className="modal-actions">
                    <button 
                      className="cancel-btn" 
                      onClick={closeWithdrawConfirm}
                      disabled={withdrawLoading}
                    >
                      Cancel
                    </button>
                    <button 
                      className="confirm-btn decline" 
                      onClick={confirmWithdraw}
                      disabled={withdrawLoading}
                    >
                      {withdrawLoading ? 'Withdrawing...' : 'Yes, Withdraw'}
                    </button>
                  </div>
                </div>
              </div>
            )}


            {viewOpen && viewForm && (
              <div className="modal-overlay" onClick={closeViewBooking} style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
              }}>
                <div className="modal" onClick={(e) => e.stopPropagation()} style={{
                  maxWidth: '700px',
                  width: '90%',
                  maxHeight: '85vh',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                  <div className="modal-header" style={{ flexShrink: 0 }}>
                    <h3 className="modal-title">Booking Details</h3>
                    <button className="modal-close" onClick={closeViewBooking}>×</button>
                  </div>
                  <div className="modal-body" style={{ 
                    overflowY: 'auto', 
                    flex: 1,
                    padding: '20px'
                  }}>
                    <div className="modal-grid">
                      <div className="form-group">
                        <label>First name</label>
                        <input name="firstName" value={viewForm.firstName} disabled />
                      </div>
                      <div className="form-group">
                        <label>Last name</label>
                        <input name="lastName" value={viewForm.lastName} disabled />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input name="email" type="email" value={viewForm.email} disabled />
                      </div>
                      <div className="form-group">
                        <label>Phone</label>
                        <input name="phoneNumber" value={viewForm.phoneNumber} disabled />
                      </div>
                      <div className="form-group">
                        <label>Event date</label>
                        <input name="eventDate" type="date" value={viewForm.eventDate} disabled />
                      </div>
                      <div className="form-group full">
                        <label>Event type</label>
                        <div className="checkbox-grid">
                          {['Wedding','Eid','Party','Festival'].map(opt => (
                            <label key={opt} className="checkbox-label">
                              <input type="checkbox" checked={(viewForm.eventType || []).includes(opt)} readOnly disabled />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                        <input
                          name="otherEventType"
                          placeholder="Other event type"
                          value={viewForm.otherEventType}
                          disabled
                        />
                      </div>
                      <div className="form-group full">
                        <label>Preferred time slot</label>
                        <div className="checkbox-grid">
                          {['Morning','Afternoon','Evening','Flexible'].map(opt => (
                            <label key={opt} className="checkbox-label">
                              <input type="checkbox" checked={(viewForm.preferredTimeSlot || []).includes(opt)} readOnly disabled />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="form-group full">
                        <label>Artist travel preference</label>
                        <div className="radio-group">
                          <label className="radio-label">
                            <input type="radio" checked={viewForm.artistTravelsToClient === true} readOnly disabled />
                            <span>Artist travels to client</span>
                          </label>
                          <label className="radio-label">
                            <input type="radio" checked={viewForm.artistTravelsToClient === false} readOnly disabled />
                            <span>Client travels to artist</span>
                          </label>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Location</label>
                        <input name="location" value={viewForm.location} disabled />
                      </div>
                      <div className="form-group">
                        <label>Address</label>
                        <input name="fullAddress" value={viewForm.fullAddress} disabled />
                      </div>
                      <div className="form-group">
                        <label>City</label>
                        <input name="city" value={viewForm.city} disabled />
                      </div>
                      <div className="form-group">
                        <label>Postal code</label>
                        <input name="postalCode" value={viewForm.postalCode} disabled />
                      </div>
                      <div className="form-group">
                        <label>Budget min</label>
                        <input name="minimumBudget" type="number" value={viewForm.minimumBudget} disabled />
                      </div>
                      <div className="form-group">
                        <label>Budget max</label>
                        <input name="maximumBudget" type="number" value={viewForm.maximumBudget} disabled />
                      </div>
                      <div className="form-group">
                        <label>Duration (hours)</label>
                        <input name="duration" type="number" value={viewForm.duration} disabled />
                      </div>
                      <div className="form-group">
                        <label>People</label>
                        <input name="numberOfPeople" type="number" value={viewForm.numberOfPeople} disabled />
                      </div>
                      <div className="form-group">
                        <label>Design style</label>
                        <select name="designStyle" value={viewForm.designStyle} disabled>
                          <option value="">Select style</option>
                          {['Traditional','Modern','Arabic','Indian','Moroccan','Minimalist','Bridal'].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Complexity</label>
                        <select name="designComplexity" value={viewForm.designComplexity} disabled>
                          <option value="">Select complexity</option>
                          {['Simple','Medium','Complex','Very Complex'].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group full">
                        <label>Body parts to decorate</label>
                        <div className="checkbox-grid">
                          {['Hands','Feet','Arms','Back'].map(opt => (
                            <label key={opt} className="checkbox-label">
                              <input type="checkbox" checked={(viewForm.bodyPartsToDecorate || []).includes(opt)} readOnly disabled />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Coverage preference</label>
                        <select name="coveragePreference" value={viewForm.coveragePreference} disabled>
                          <option value="">Select coverage</option>
                          {['Light','Medium','Full','Bridal Package'].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Venue name</label>
                        <input name="venueName" value={viewForm.venueName} disabled />
                      </div>
                      <div className="form-group full">
                        <label>Design inspiration</label>
                        <textarea name="designInspiration" rows="3" value={viewForm.designInspiration} disabled />
                      </div>
                      <div className="form-group full">
                        <label>Additional requests</label>
                        <textarea name="additionalRequests" rows="3" value={viewForm.additionalRequests} disabled />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer" style={{ flexShrink: 0, padding: '15px 20px' }}>
                    <button className="btn-primary" onClick={closeViewBooking}>Close</button>
                  </div>
                </div>
              </div>
            )}

            {/* View Notes Modal */}
            {viewNotesModalOpen && viewNotesBookingId && (
              <div className="modal-overlay" onClick={() => setViewNotesModalOpen(false)} style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
              }}>
                <div className="modal" onClick={(e) => e.stopPropagation()} style={{
                  maxWidth: '600px',
                  width: '90%',
                  maxHeight: '85vh',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                  <div className="modal-header" style={{ flexShrink: 0 }}>
                    <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaStickyNote style={{ color: '#d4a574' }} />
                      All Notes
                    </h3>
                    <button className="modal-close" onClick={() => setViewNotesModalOpen(false)}>×</button>
                  </div>
                  <div className="modal-body" style={{ 
                    overflowY: 'auto', 
                    flex: 1,
                    padding: '20px'
                  }}>
                    {bookingNotes[viewNotesBookingId]?.notes?.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>No notes yet</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {bookingNotes[viewNotesBookingId]?.notes?.map((note, idx) => (
                          <div key={idx} style={{
                            padding: '16px',
                            backgroundColor: '#f9f9f9',
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0'
                          }}>
                            <div style={{ marginBottom: '8px', fontSize: '12px', color: '#888' }}>
                              {new Date(note.createdAt).toLocaleDateString('en-GB', { 
                                day: '2-digit', 
                                month: 'short', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div style={{ fontSize: '14px', color: '#333', whiteSpace: 'pre-wrap' }}>
                              {note.content}
                            </div>
                            {note.followUp && (
                              <div style={{ 
                                marginTop: '8px', 
                                padding: '4px 8px', 
                                backgroundColor: '#fff3cd', 
                                borderRadius: '4px',
                                fontSize: '12px',
                                color: '#856404',
                                display: 'inline-block'
                              }}>
                                ⚠️ Follow-up required
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="modal-footer" style={{ flexShrink: 0, padding: '15px 20px' }}>
                    <button className="btn-primary" onClick={() => setViewNotesModalOpen(false)}>Close</button>
                  </div>
                </div>
              </div>
            )}

            {cancelModalOpen && (
              <div className="modal-overlay">
                <div className="confirmation-modal">
                  <div className="modal-header">
                    <h3 className="modal-title">Confirm Cancellation</h3>
                    <button className="modal-close" onClick={closeCancelModal}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </button>
                  </div>
                  <p className="modal-text">
                    This action <span style={{ color: '#dc2626', fontWeight: 700 }}>cannot be undone</span>. The client will be notified immediately.
                  </p>
                  <div className="form-group">
                    <label className="form-label">Reason for cancellation</label>
                    <select className="form-input" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
                      <option>Scheduling Conflict</option>
                      <option>Personal Emergency</option>
                      <option>Travel / Location Issue</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <textarea className="form-textarea" rows="3" placeholder="Additional details..." value={cancelDetails} onChange={(e) => setCancelDetails(e.target.value)} />
                    {cancelError && <small style={{ color: '#dc2626' }}>{cancelError}</small>}
                  </div>
                  <div className="modal-actions">
                    <button className="cancel-btn" onClick={closeCancelModal}>Keep Booking</button>
                    <button className="confirm-btn decline" onClick={confirmCancellation}>Confirm Cancellation</button>
                  </div>
                </div>
              </div>
            )}

            {showProposalModal && (
              <div className="modal-overlay">
                <div className="proposal-modal">
                  <div className="modal-header">
                    <h3 className="modal-title">Send Proposal</h3>
                    <button className="modal-close" onClick={handleCloseProposalModal}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </button>
                  </div>

                  {selectedJob && (
                    <div className="modal-content">
                      <div className="job-summary">
                        <h4>{selectedJob.title}</h4>
                        <p>Client: {selectedJob.client} • {selectedJob.location}</p>
                        <p>Budget: {selectedJob.budget}</p>
                      </div>

                      <div className="proposal-form">
                        {error && (
                          <div className="error-message" style={{
                            background: '#fee',
                            border: '1px solid #fcc',
                            borderRadius: '4px',
                            padding: '10px',
                            marginBottom: '15px',
                            color: '#c33'
                          }}>
                            {error}
                          </div>
                        )}

                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">Your Price *</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="£450"
                              value={proposalData.price}
                              onChange={(e) => handleProposalInputChange('price', e.target.value)}
                              disabled={submittingProposal}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Duration *</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="4 hours"
                              value={proposalData.duration}
                              onChange={(e) => handleProposalInputChange('duration', e.target.value)}
                              disabled={submittingProposal}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Your Experience</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="8+ years of bridal mehndi experience"
                            value={proposalData.experience}
                            onChange={(e) => handleProposalInputChange('experience', e.target.value)}
                            disabled={submittingProposal}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Proposal Message *</label>
                          <textarea
                            className="form-textarea"
                            placeholder="Explain why you're the best fit for this job... (minimum 50 characters)"
                            rows="4"
                            value={proposalData.message}
                            onChange={(e) => handleProposalInputChange('message', e.target.value)}
                            disabled={submittingProposal}
                          />
                          <small style={{
                            color: proposalData.message.length < 50 ? '#e74c3c' : '#27ae60',
                            fontSize: '12px',
                            fontWeight: proposalData.message.length < 50 ? 'bold' : 'normal'
                          }}>
                            {proposalData.message.length}/50 characters minimum
                            {proposalData.message.length < 50 && (
                              <span style={{ display: 'block', marginTop: '2px' }}>
                                Please write at least {50 - proposalData.message.length} more characters
                              </span>
                            )}
                          </small>
                        </div>
                      </div>

                      <div className="modal-actions">
                        <button
                          className="cancel-btn"
                          onClick={handleCloseProposalModal}
                          disabled={submittingProposal}
                        >
                          Cancel
                        </button>
                        <button
                          className="submit-proposal-btn"
                          onClick={handleSubmitProposal}
                          disabled={!proposalData.price || !proposalData.message || !proposalData.duration || proposalData.message.length < 50 || submittingProposal}
                          title={
                            !proposalData.price ? 'Please enter your price' :
                              !proposalData.duration ? 'Please enter duration' :
                                !proposalData.message ? 'Please enter a proposal message' :
                                  proposalData.message.length < 50 ? `Message too short. Need ${50 - proposalData.message.length} more characters` :
                                    submittingProposal ? 'Submitting proposal...' :
                                      'Send your proposal'
                          }
                        >
                          {submittingProposal ? 'Sending...' : 'Send Proposal'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {applyOpen && (
              <div className="modal-overlay" onClick={closeApplyModal}>
                <div className="application-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3 className="modal-title">Apply to Booking</h3>
                    <button className="modal-close" onClick={closeApplyModal}>×</button>
                  </div>
                  
                  <div className="modal-body">
                    <div className="application-form">
                      {/* Budget & Duration Section */}
                      <div className="form-section">
                        <h4 className="section-title">Budget & Timeline</h4>
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">Your Proposed Budget (£) *</label>
                            <input
                              type="number"
                              className={`form-input ${formErrors.proposedBudget ? 'error' : ''}`}
                              placeholder="450"
                              value={applicationForm.proposedBudget}
                              onChange={(e) => handleFormChange('proposedBudget', e.target.value)}
                              disabled={applyLoading}
                              min="0"
                              step="0.01"
                            />
                            {formErrors.proposedBudget && <span className="error-text">{formErrors.proposedBudget}</span>}
                          </div>
                          <div className="form-group">
                            <label className="form-label">Estimated Duration *</label>
                            <div className="duration-input-group">
                              <input
                                type="number"
                                className={`form-input ${formErrors.estimatedDuration ? 'error' : ''}`}
                                placeholder="4"
                                value={applicationForm.estimatedDuration.value}
                                onChange={(e) => handleFormChange('estimatedDuration.value', e.target.value)}
                                disabled={applyLoading}
                                min="0"
                                step="0.5"
                              />
                              <select
                                className="form-input"
                                value={applicationForm.estimatedDuration.unit}
                                onChange={(e) => handleFormChange('estimatedDuration.unit', e.target.value)}
                                disabled={applyLoading}
                              >
                                <option value="hours">Hours</option>
                                <option value="days">Days</option>
                              </select>
                            </div>
                            {formErrors.estimatedDuration && <span className="error-text">{formErrors.estimatedDuration}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Experience Section */}
                      <div className="form-section">
                        <h4 className="section-title">Experience & Qualifications</h4>
                        <div className="form-group">
                          <label className="form-label">Years of Experience *</label>
                          <input
                            type="number"
                            className={`form-input ${formErrors.yearsOfExperience ? 'error' : ''}`}
                            placeholder="5"
                            value={applicationForm.experience.yearsOfExperience}
                            onChange={(e) => handleFormChange('experience.yearsOfExperience', e.target.value)}
                            disabled={applyLoading}
                            min="0"
                          />
                          {formErrors.yearsOfExperience && <span className="error-text">{formErrors.yearsOfExperience}</span>}
                        </div>
                        <div className="form-group">
                          <label className="form-label">Relevant Experience *</label>
                          <textarea
                            className={`form-textarea ${formErrors.relevantExperience ? 'error' : ''}`}
                            placeholder="Describe your relevant mehndi experience, specialties, and notable work..."
                            rows="3"
                            value={applicationForm.experience.relevantExperience}
                            onChange={(e) => handleFormChange('experience.relevantExperience', e.target.value)}
                            disabled={applyLoading}
                          />
                          {formErrors.relevantExperience && <span className="error-text">{formErrors.relevantExperience}</span>}
                        </div>
                        <div className="form-group">
                          <label className="form-label">Portfolio Highlights</label>
                          <textarea
                            className="form-textarea"
                            placeholder="Mention any special techniques, awards, or notable clients..."
                            rows="2"
                            value={applicationForm.experience.portfolioHighlights}
                            onChange={(e) => handleFormChange('experience.portfolioHighlights', e.target.value)}
                            disabled={applyLoading}
                          />
                        </div>
                      </div>

                      {/* Availability Section */}
                      <div className="form-section">
                        <h4 className="section-title">Availability & Location</h4>
                        <div className="checkbox-group">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={applicationForm.availability.isAvailableOnDate}
                              onChange={(e) => handleFormChange('availability.isAvailableOnDate', e.target.checked)}
                              disabled={applyLoading}
                            />
                            <span>I am available on the requested date</span>
                          </label>
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={applicationForm.availability.canTravelToLocation}
                              onChange={(e) => handleFormChange('availability.canTravelToLocation', e.target.checked)}
                              disabled={applyLoading}
                            />
                            <span>I can travel to the client's location</span>
                          </label>
                        </div>
                        {applicationForm.availability.canTravelToLocation && (
                          <div className="form-group">
                            <label className="form-label">Travel Distance (miles)</label>
                            <input
                              type="number"
                              className="form-input"
                              placeholder="10"
                              value={applicationForm.availability.travelDistance}
                              onChange={(e) => handleFormChange('availability.travelDistance', e.target.value)}
                              disabled={applyLoading}
                              min="0"
                            />
                          </div>
                        )}
                      </div>

                      {/* Proposal Section */}
                      <div className="form-section">
                        <h4 className="section-title">Your Proposal</h4>
                        <div className="form-group">
                          <label className="form-label">Proposal Message *</label>
                          <textarea
                            className={`form-textarea ${formErrors.proposalMessage ? 'error' : ''}`}
                            placeholder="Write a compelling proposal explaining why you're the best fit for this booking. Include your approach, what makes you unique, and how you'll make this event special..."
                            rows="4"
                            value={applicationForm.proposal.message}
                            onChange={(e) => handleFormChange('proposal.message', e.target.value)}
                            disabled={applyLoading}
                          />
                          <small style={{
                            color: applicationForm.proposal.message.length < 50 ? '#e74c3c' : '#27ae60',
                            fontSize: '12px'
                          }}>
                            {applicationForm.proposal.message.length}/50 characters minimum
                          </small>
                          {formErrors.proposalMessage && <span className="error-text">{formErrors.proposalMessage}</span>}
                        </div>
                        <div className="form-group">
                          <label className="form-label">Why are you interested in this booking?</label>
                          <textarea
                            className="form-textarea"
                            placeholder="Share what excites you about this particular event..."
                            rows="2"
                            value={applicationForm.proposal.whyInterested}
                            onChange={(e) => handleFormChange('proposal.whyInterested', e.target.value)}
                            disabled={applyLoading}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Additional Notes</label>
                          <textarea
                            className="form-textarea"
                            placeholder="Any additional information, special requests, or questions..."
                            rows="2"
                            value={applicationForm.proposal.additionalNotes}
                            onChange={(e) => handleFormChange('proposal.additionalNotes', e.target.value)}
                            disabled={applyLoading}
                          />
                        </div>
                      </div>

                      {/* Terms Section */}
                      <div className="form-section">
                        <h4 className="section-title">Terms & Conditions</h4>
                        <div className="checkbox-group">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={applicationForm.terms.agreedToTerms}
                              onChange={(e) => handleFormChange('terms.agreedToTerms', e.target.checked)}
                              disabled={applyLoading}
                            />
                            <span>I understand that I cannot withdraw my application after the booking application is accepted.</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      className="cancel-btn"
                      onClick={closeApplyModal}
                      disabled={applyLoading}
                    >
                      Cancel
                    </button>
                    <button
                      className="submit-btn"
                      onClick={confirmApply}
                      disabled={applyLoading}
                    >
                      {applyLoading ? 'Submitting Application...' : 'Submit Application'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default ArtistDashboard; 