import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaBookmark,
  FaCalendarAlt,
  FaCalendarCheck,
  FaCheckCircle,
  FaClock,
  FaEnvelope,
  FaEye,
  FaHandPeace,
  FaHeart,
  FaMoneyBillWave,
  FaRegBookmark,
  FaSignOutAlt,
  FaStickyNote,
  FaTimes,
  FaTrash,
  FaWallet,
} from "react-icons/fa";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import apiService, { chatAPI } from "../services/api";
import socket, {
  buildDirectRoomId,
  joinRoom,
  onPresenceUpdate,
  sendRoomMessage,
  signalOnline,
} from "../services/socket";
import ArtistPortfolioForm from "./ArtistPortfolioForm";
import ArtistSidebar from "./ArtistSidebar";
import "./messages.css";
import BrowseApplyModal from "./modals/BrowseApplyModal";
import BrowseViewBookingModal from "./modals/BrowseViewBookingModal";
import CancelAcceptedModal from "./modals/CancelAcceptedModal";
import MarkCompleteProofModal from "./modals/MarkCompleteProofModal";
import { ToastContainer, useToast } from "./Toast";
const {
  proposalsAPI,
  authAPI,
  bookingsAPI,
  applicationsAPI,
  portfoliosAPI,
  walletAPI,
  transactionAPI,
  notificationAPI,
} = apiService;

const ArtistDashboard = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const artistName = user ? `${user.firstName} ${user.lastName}` : "Artist";
  const { toasts, removeToast, showSuccess, showError, showWarning } =
    useToast();

  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, applications, messages, schedule, earnings, wallet, profile
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const messagesEndRef = useRef(null);
  const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp&s=80";
  const [headerBooking, setHeaderBooking] = useState(null);
  const [headerExpanded, setHeaderExpanded] = useState(false);
  const [viewHeaderOpen, setViewHeaderOpen] = useState(false);
  const [applyHeaderOpen, setApplyHeaderOpen] = useState(false);
  const [applyBusyHeader, setApplyBusyHeader] = useState(false);
  const [headerSaved, setHeaderSaved] = useState(false);
  const [headerSaving, setHeaderSaving] = useState(false);
  const [headerApplied, setHeaderApplied] = useState(false);

  useEffect(() => {
    if (!user || !isAuthenticated) return;
    signalOnline(user._id);
    const off = onPresenceUpdate(({ userId, isOnline }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (isOnline) next.add(String(userId));
        else next.delete(String(userId));
        return next;
      });
    });
    const onVisibility = () => {
      if (!document.hidden) signalOnline(user._id);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (off) off();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user, isAuthenticated]);

  // Load booking for request-summary banner when coming from BrowseRequests
  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const bookingId = params.get("bookingId");
    if (!bookingId) {
      setHeaderBooking(null);
      return;
    }
    (async () => {
      try {
        const res = await bookingsAPI.getBooking(bookingId);
        setHeaderBooking(res.data || null);
      } catch (_) {
        setHeaderBooking(null);
      }
    })();
  }, [location.search]);

  // Load saved state for header booking
  useEffect(() => {
    (async () => {
      try {
        if (!headerBooking?._id) return;
        const saved = await bookingsAPI.getSavedBookings();
        const setIds = new Set((saved?.data || []).map((b) => String(b._id)));
        setHeaderSaved(setIds.has(String(headerBooking._id)));
        // applied state
        try {
          const myApplied = await applicationsAPI.getMyAppliedBookings();
          const appliedIds = new Set(
            (myApplied?.data || []).map((a) =>
              String(a.bookingId || a.id || a.booking_id)
            )
          );
          setHeaderApplied(appliedIds.has(String(headerBooking._id)));
        } catch {}
      } catch {}
    })();
  }, [headerBooking?._id]);

  const toggleHeaderSave = async () => {
    if (!headerBooking?._id) return;
    try {
      setHeaderSaving(true);
      if (headerSaved) await bookingsAPI.unsaveBooking(headerBooking._id);
      else await bookingsAPI.saveBooking(headerBooking._id);
      setHeaderSaved(!headerSaved);
    } catch (e) {
      showError(e.message || "Failed to update");
    } finally {
      setHeaderSaving(false);
    }
  };

  // (moved below where chatMessages is declared)

  // Application stats state
  const [applicationStats, setApplicationStats] = useState({
    applied: 0,
    accepted: 0,
    declined: 0,
    withdrawn: 0,
    expired: 0,
    pending: 0,
    total: 0,
    acceptanceRate: 0,
  });

  // Fetch application stats for tiles
  useEffect(() => {
    if (!isAuthenticated || !user || user.userType !== "artist") return;
    applicationsAPI
      .getMyStats()
      .then((resp) => {
        if (resp && resp.success && resp.data) {
          const {
            applied = 0,
            accepted = 0,
            declined = 0,
            withdrawn = 0,
            expired = 0,
            pending = 0,
            total = 0,
            acceptanceRate = 0,
          } = resp.data;
          setApplicationStats({
            applied,
            accepted,
            declined,
            withdrawn,
            expired,
            pending,
            total,
            acceptanceRate,
          });
        }
      })
      .catch((error) => {
        console.error("Failed to fetch application stats:", error);
      });
  }, [isAuthenticated, user]);
  const [proposalData, setProposalData] = useState({
    message: "",
    price: "",
    duration: "",
    experience: "",
  });
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Real data from backend
  const [availableJobs, setAvailableJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Overview state for next event, bookings and notifications
  const [nextEvent, setNextEvent] = useState(null);
  const [secondEvent, setSecondEvent] = useState(null);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [userLocation, setUserLocation] = useState(null); // Used in getCurrentLocation
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [kpiStats] = useState({
    bookings: { value: 7, sub: "+40% vs last month", trend: "up" },
    applications: { value: 3, sub: "Sent this week", trend: "up" },
    conversion: { value: "67%", sub: "Conversion Rate", trend: "down" },
    response: { value: "92%", sub: "Response Rate", trend: "up" },
  });

  // Applications (mock data to match screenshot)
  const [applicationsFilter, setApplicationsFilter] = useState("applied");
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState("");
  const [cancelAcceptedOpen, setCancelAcceptedOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [markProofOpen, setMarkProofOpen] = useState(false);
  const [markTargetBookingId, setMarkTargetBookingId] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewForm, setViewForm] = useState(null);
  const [viewClientId, setViewClientId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyBookingId, setApplyBookingId] = useState(null);
  const [applyBookingData, setApplyBookingData] = useState(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);
  const [withdrawBookingId, setWithdrawBookingId] = useState(null);
  const [applicationForm, setApplicationForm] = useState({
    proposedBudget: "",
    estimatedDuration: {
      value: "",
      unit: "hours",
    },
    availability: {
      isAvailableOnDate: true,
      canTravelToLocation: true,
      travelDistance: "",
    },
    experience: {
      relevantExperience: "",
      yearsOfExperience: "",
      portfolioHighlights: "",
    },
    proposal: {
      message: "",
      whyInterested: "",
      additionalNotes: "",
    },
    terms: {
      agreedToTerms: false,
    },
  });
  const [formErrors, setFormErrors] = useState({});

  // Portfolios state
  const [portfolios, setPortfolios] = useState([]);
  const [portfoliosLoading, setPortfoliosLoading] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({
    displayName: "",
    tagline: "",
    bio: "",
    styles: [],
    categories: [],
    mediaUrls: [],
    perHandRate: "",
    bridalPackagePrice: "",
    partyPackagePrice: "",
    hourlyRate: "",
    outcallFee: "",
    yearsOfExperience: "",
    availableLocations: [],
    travelsToClient: true,
    mehndiConeType: "",
    dryingTimeMinutes: "",
    stainLongevityDays: "",
    hygienePractices: "",
    eventTypes: [],
    maxClientsPerEvent: "",
    isPublished: false,
  });
  const [savingPortfolio, setSavingPortfolio] = useState(false);
  const [portfolioErrors, setPortfolioErrors] = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPortfolio, setPreviewPortfolio] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [showNewPortfolioForm, setShowNewPortfolioForm] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState(null);
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
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const validatePortfolio = (form) => {
    const errs = {};
    if (!form.displayName || !form.displayName.trim())
      errs.displayName = "Display name is required";
    if (!form.bio || !form.bio.trim()) errs.bio = "Bio is required";
    const urls = Array.isArray(form.mediaUrls)
      ? form.mediaUrls.filter(Boolean)
      : [];
    if (urls.length === 0)
      errs.mediaUrls = "At least one media URL is required";
    if (urls.length > 0 && urls.some((u) => !isValidUrl(u)))
      errs.mediaUrls = "All media URLs must be valid http(s) links";
    const styles = Array.isArray(form.styles)
      ? form.styles.filter(Boolean)
      : [];
    const categories = Array.isArray(form.categories)
      ? form.categories.filter(Boolean)
      : [];
    if (styles.length === 0 && categories.length === 0)
      errs.styles = "Provide at least one style or category";
    return errs;
  };

  const fetchMyPortfolios = useCallback(async () => {
    if (!isAuthenticated || !user || user.userType !== "artist") return;
    try {
      setPortfoliosLoading(true);
      const resp = await portfoliosAPI.listMine();
      setPortfolios(resp.data || []);
    } catch (e) {
      showError(e.message || "Failed to load portfolios");
      setPortfolios([]);
    } finally {
      setPortfoliosLoading(false);
    }
  }, [isAuthenticated, user, portfoliosAPI]);

  const handleSaveNewPortfolio = async (portfolioData) => {
    try {
      setSavingPortfolio(true);
      const payload = {
        ...portfolioData,
        displayName: "My Portfolio", // Default name
        tagline: "Professional Mehndi Artist",
        bio: portfolioData.aboutMe,
        isPublished: true,
      };

      if (editingPortfolio) {
        await portfoliosAPI.update(editingPortfolio._id, payload);
        showSuccess("Portfolio updated successfully");
      } else {
        await portfoliosAPI.create(payload);
        showSuccess("Portfolio created successfully");
      }

      setShowNewPortfolioForm(false);
      setEditingPortfolio(null);
      fetchMyPortfolios();
    } catch (e) {
      showError(e.message || "Failed to save portfolio");
    } finally {
      setSavingPortfolio(false);
    }
  };

  const handleEditPortfolio = (portfolio) => {
    setEditingPortfolio(portfolio);
    setShowNewPortfolioForm(true);
  };

  const handleCancelPortfolioForm = () => {
    setShowNewPortfolioForm(false);
    setEditingPortfolio(null);
  };

  // Fetch notifications for the current user
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setNotificationsLoading(true);
      const response = await notificationAPI.getNotifications();
      if (response.success) {
        setNotifications(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, [isAuthenticated]);

  // Delete a notification
  const deleteNotification = async (notificationId) => {
    try {
      const response = await notificationAPI.deleteNotification(notificationId);
      if (response.success) {
        // Remove the notification from the local state
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const fetchAppliedBookings = useCallback(async () => {
    if (!isAuthenticated || !user || user.userType !== "artist") return;
    try {
      setAppsLoading(true);
      setAppsError("");
      const resp = await applicationsAPI.getMyAppliedBookings();
      const list = (resp.data || []).map((b) => ({
        id: b._id,
        title: `${(b.eventType || []).join(", ") || "Mehndi"} – ${new Date(
          b.eventDate
        ).toLocaleDateString("en-GB")}`,
        client: `${b.firstName} ${b.lastName} · ${
          b.city || b.location || ""
        }`.trim(),
        budget: `£${b.minimumBudget ?? 0}${
          b.maximumBudget ? ` - £${b.maximumBudget}` : ""
        }`,
        appliedOn: new Date(b.createdAt).toLocaleDateString("en-GB"),
        status: "applied",
        assignedCount: Array.isArray(b.assignedArtist)
          ? b.assignedArtist.length
          : b.assignedArtist
          ? 1
          : 0,
      }));
      setApplications(list);
    } catch (e) {
      setAppsError(e.message || "Failed to load applied bookings");
      setApplications([]);
    } finally {
      setAppsLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchApplicationsByStatus = useCallback(
    async (status) => {
      if (!isAuthenticated || !user || user.userType !== "artist") return;
      try {
        setAppsLoading(true);
        setAppsError("");
        const resp = await applicationsAPI.getMyApplicationsByStatus(status);
        const list = (resp.data || []).map((b) => ({
          id: b._id,
          title: `${(b.eventType || []).join(", ") || "Mehndi"} – ${new Date(
            b.eventDate
          ).toLocaleDateString("en-GB")}`,
          client: `${b.firstName} ${b.lastName} · ${
            b.city || b.location || ""
          }`.trim(),
          budget: `£${b.minimumBudget ?? 0}${
            b.maximumBudget ? ` - £${b.maximumBudget}` : ""
          }`,
          appliedOn: new Date(b.createdAt).toLocaleDateString("en-GB"),
          status: status,
          eventDate: b.eventDate,
          assignedCount: Array.isArray(b.assignedArtist)
            ? b.assignedArtist.length
            : b.assignedArtist
            ? 1
            : 0,
        }));
        setApplications(list);
      } catch (e) {
        setAppsError(e.message || `Failed to load ${status} bookings`);
        setApplications([]);
      } finally {
        setAppsLoading(false);
      }
    },
    [isAuthenticated, user]
  );

  const openCancelAccepted = (id) => {
    setCancelTarget({ bookingId: id });
    setCancelAcceptedOpen(true);
  };

  const handleConfirmCancelAccepted = async ({ reason, description }) => {
    try {
      // Send bookingId, reason, and description; backend will locate the current artist's application for this booking
      const bookingId = cancelTarget?.bookingId;
      if (!bookingId) throw new Error("Missing bookingId for cancellation");
      console.log("sending notifyCancelAccepted with:", {
        bookingId,
        reason,
        description,
      });
      await applicationsAPI.notifyCancelAccepted({
        bookingId,
        reason,
        description,
      });
      showSuccess("Client will be notified by email");
      // Refetch applications in Applications tab
      if (applicationsFilter === "accepted") {
        fetchApplicationsByStatus("accepted");
      }
      // Refetch calendar data
      fetchAcceptedCalendar();
    } catch (e) {
      showError(e.message || "Failed to submit cancellation");
    } finally {
      setCancelAcceptedOpen(false);
      setCancelTarget(null);
    }
  };

  const fetchPendingBookings = useCallback(async () => {
    if (!isAuthenticated || !user || user.userType !== "artist") return;
    try {
      setAppsLoading(true);
      setAppsError("");
      const resp = await bookingsAPI.getPendingBookings();
      const items = (resp.data || []).map((b) => ({
        id: b._id,
        title: `${(b.eventType || []).join(", ") || "Mehndi"} – ${new Date(
          b.eventDate
        ).toLocaleDateString("en-GB")}`,
        client: `${b.firstName} ${b.lastName} · ${
          b.city || b.location || ""
        }`.trim(),
        budget: `£${b.minimumBudget ?? 0}${
          b.maximumBudget ? ` - £${b.maximumBudget}` : ""
        }`,
        appliedOn: new Date(b.createdAt).toLocaleDateString("en-GB"),
        status: "in_progress" || "pending",
        eventDate: b.eventDate,
        assignedCount: Array.isArray(b.assignedArtist)
          ? b.assignedArtist.length
          : b.assignedArtist
          ? 1
          : 0,
        // Additional booking details
        fullClientName: `${b.firstName} ${b.lastName}`,
        location: b.location || b.city || "",
        city: b.city || "",
        designComplexity: b.designComplexity || "",
        numberOfPeople: b.numberOfPeople || 0,
        duration: b.duration || 0,
        preferredTimeSlot: b.preferredTimeSlot || [],
        fullAddress: b.fullAddress || "",
        venueName: b.venueName || "",
        designInspiration: b.designInspiration || "",
        additionalRequests: b.additionalRequests || "",
      }));
      setApplications(items);
    } catch (e) {
      setAppsError(e.message || "Failed to load pending bookings");
      setApplications([]);
    } finally {
      setAppsLoading(false);
    }
  }, [isAuthenticated, user]);

  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          resolve({ latitude, longitude });
        },
        (error) => {
          let errorMessage = "Failed to get location.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied by user.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out.";
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }, []);

  const fetchNearbyBookings = useCallback(async () => {
    if (!isAuthenticated || !user || user.userType !== "artist") return;

    try {
      setNearbyLoading(true);

      // Get user's current location
      const location = await getCurrentLocation();

      // Fetch nearby bookings
      const resp = await bookingsAPI.getNearbyBookings(
        location.latitude,
        location.longitude,
        3
      );

      const nearbyItems = (resp.data || []).map((b) => ({
        id: b._id,
        title: `${(b.eventType || []).join(", ") || "Mehndi"} – ${new Date(
          b.eventDate
        ).toLocaleDateString("en-GB")}`,
        client: `${b.firstName} ${b.lastName}`,
        location:
          `${b.city || b.location || ""}`.trim() || "Location not specified",
        budget: `£${b.minimumBudget ?? 0}${
          b.maximumBudget ? ` - £${b.maximumBudget}` : ""
        }`,
        eventDate: b.eventDate,
        fullAddress: b.fullAddress,
        latitude: b.latitude,
        longitude: b.longitude,
        // Add other booking details for view detail
        ...b,
      }));

      setNearbyRequests(nearbyItems);
    } catch (e) {
      console.error("Failed to fetch nearby bookings:", e);
      setNearbyRequests([]);
    } finally {
      setNearbyLoading(false);
    }
  }, [isAuthenticated, user, getCurrentLocation]);

  // Compute artist's next and second events dynamically from their accepted applications
  const fetchArtistUpcomingEvents = useCallback(async () => {
    if (!isAuthenticated || !user || user.userType !== "artist") return;
    try {
      // Get applications accepted for this artist
      const resp = await applicationsAPI.getMyApplicationsByStatus("accepted");
      const apps = Array.isArray(resp.data) ? resp.data : [];

      // Enrich each with booking details (date, client) if needed
      const enriched = await Promise.all(
        apps.map(async (a) => {
          try {
            const bookingId =
              a.bookingId || a.booking?.id || a.booking?._id || a._id; // best-effort
            if (bookingId) {
              const bResp = await bookingsAPI.getBooking(bookingId);
              const b = bResp?.data || {};
              return {
                applicationId: a._id,
                bookingId,
                client:
                  b.firstName && b.lastName
                    ? `${b.firstName} ${b.lastName}`
                    : a.firstName && a.lastName
                    ? `${a.firstName} ${a.lastName}`
                    : "Client",
                eventDate: b.eventDate || a.eventDate,
                eventType: b.eventType || a.eventType,
                otherEventType: b.otherEventType || a.otherEventType,
                preferredTimeSlot: b.preferredTimeSlot || a.preferredTimeSlot,
                location: b.location || b.city || b.postalCode || "",
              };
            }
          } catch (_) {}
          // Fallback to application fields
          return {
            applicationId: a._id,
            bookingId: a.bookingId || a._id,
            client:
              a.firstName && a.lastName
                ? `${a.firstName} ${a.lastName}`
                : "Client",
            eventDate: a.eventDate,
            eventType: a.eventType,
            otherEventType: a.otherEventType,
            preferredTimeSlot: a.preferredTimeSlot,
            location: a.location || a.city || a.postalCode || "",
          };
        })
      );

      const today = new Date();
      const future = enriched
        .filter((e) => e.eventDate && new Date(e.eventDate) > today)
        .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

      const getEventTitle = (eventType, otherEventType) => {
        if (Array.isArray(eventType) && eventType.length > 0) {
          const types = eventType.join(", ");
          return otherEventType ? `${types} – ${otherEventType}` : types;
        }
        return otherEventType || "Mehndi Booking";
      };

      const formatDateText = (dateString, preferred) => {
        const date = new Date(dateString);
        const datePart = date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const pref = Array.isArray(preferred)
          ? preferred.join(", ")
          : preferred || "Flexible";
        return { date: datePart, timeSlot: pref };
      };
      console.log("Future events:", future);

      if (future.length > 0) {
        const first = future[0];
        const firstDate = new Date(first.eventDate);
        const daysLeft = Math.max(
          0,
          Math.ceil((firstDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        );
        const dateFormatted = formatDateText(
          first.eventDate,
          first.preferredTimeSlot
        );
        setNextEvent({
          id: first.bookingId,
          title: getEventTitle(first.eventType, first.otherEventType),
          client: first.client,
          date: dateFormatted.date,
          timeSlot: dateFormatted.timeSlot,
          location: first.location,
          status: "Deposit Received",
          daysLeft: daysLeft,
        });

        if (future.length > 1) {
          const second = future[1];
          const secondDate = new Date(second.eventDate);
          const daysLeft2 = Math.max(
            0,
            Math.ceil(
              (secondDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
          );
          const dateFormatted2 = formatDateText(
            second.eventDate,
            second.preferredTimeSlot
          );
          setSecondEvent({
            id: second.bookingId,
            title: getEventTitle(second.eventType, second.otherEventType),
            client: second.client,
            date: dateFormatted2.date,
            timeSlot: dateFormatted2.timeSlot,
            location: second.location,
            status: "Deposit Received",
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
      document.body.style.overflow = "hidden";
      const resp = await bookingsAPI.getBooking(bookingId);
      const b = resp.data || {};

      // Convert eventType array to single value
      const eventTypeValue = Array.isArray(b.eventType)
        ? b.eventType[0]
        : b.eventType || "";

      // Convert preferredTimeSlot array to single value
      const timeSlotValue = Array.isArray(b.preferredTimeSlot)
        ? b.preferredTimeSlot[0]
        : b.preferredTimeSlot || "";

      // Handle travel preference
      let travelPreference;
      if (
        b.artistTravelsToClient === "both" ||
        b.artistTravelsToClient === "Both"
      ) {
        travelPreference = "both";
      } else if (
        b.artistTravelsToClient === true ||
        b.artistTravelsToClient === "yes"
      ) {
        travelPreference = "yes";
      } else {
        travelPreference = "no";
      }

      setViewForm({
        firstName: b.firstName || "",
        lastName: b.lastName || "",
        email: b.email || "",
        eventType: eventTypeValue,
        otherEventType: b.otherEventType || "",
        eventDate: b.eventDate
          ? new Date(b.eventDate).toISOString().substring(0, 10)
          : "",
        preferredTimeSlot: timeSlotValue,
        location: b.location || "",
        artistTravelsToClient: travelPreference,
        venueName: b.venueName || "",
        minimumBudget: b.minimumBudget ?? "",
        maximumBudget: b.maximumBudget ?? "",
        duration: b.duration ?? 3,
        numberOfPeople: b.numberOfPeople ?? "",
        designInspiration: Array.isArray(b.designInspiration)
          ? b.designInspiration
          : b.designInspiration
          ? [b.designInspiration]
          : [],
        coveragePreference: b.coveragePreference || "",
        additionalRequests: b.additionalRequests || "",
      });
      try {
        setViewClientId(b.clientId?._id || b.clientId || null);
      } catch {}
      setViewOpen(true);
    } catch (e) {
      showError(e.message || "Failed to load booking");
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewBooking = () => {
    setViewOpen(false);
    setViewForm(null);
    setViewClientId(null);
    // Restore body scroll when modal closes
    document.body.style.overflow = "auto";
  };

  const handleMessageClientFromView = async () => {
    try {
      if (!viewClientId || !user?._id) return;
      const res = await chatAPI.ensureChat(viewClientId, user._id);
      if (res.success && res.data && res.data._id) {
        navigate(`/artist-dashboard/messages?chatId=${res.data._id}`);
      }
      setViewOpen(false);
    } catch (e) {
      showError(e?.message || "Failed to start chat");
    }
  };

  // Load saved (liked) bookings for the current user and display in Applications list
  const fetchSavedBookings = async () => {
    try {
      setAppsLoading(true);
      const res = await bookingsAPI.getSavedBookings();
      const artistId = user?._id;
      const list = (res?.data || []).map((b) => {
        const applied =
          Array.isArray(b.appliedArtists) && artistId
            ? b.appliedArtists.some((id) => String(id) === String(artistId))
            : false;
        const assigned =
          Array.isArray(b.assignedArtist) && artistId
            ? b.assignedArtist.some((id) => String(id) === String(artistId))
            : false;
        const canApply = b.status === "pending" && !applied && !assigned;
        return {
          id: b._id,
          bookingId: b._id,
          title: `${
            Array.isArray(b.eventType)
              ? b.eventType[0]
              : b.eventType || "Mehndi"
          } in ${b.city || b.location || ""}`,
          client: b.clientId
            ? `${b.clientId.firstName || ""} ${
                b.clientId.lastName || ""
              }`.trim() || "Client"
            : "Client",
          budget: `£${b.minimumBudget ?? 0}–£${b.maximumBudget ?? 0}`,
          appliedOn: b.createdAt
            ? new Date(b.createdAt).toLocaleDateString("en-GB")
            : "",
          status: "saved",
          canApply,
        };
      });
      setApplications(list);
    } catch (e) {
      setAppsError(e?.message || "Failed to load saved bookings");
    } finally {
      setAppsLoading(false);
    }
  };

  const openApplyModal = (bookingId) => {
    setApplyBookingId(bookingId);

    // Find the booking data from the applications list
    const bookingData = applications.find((app) => app.id === bookingId);
    setApplyBookingData(bookingData);

    setApplyOpen(true);
    // Reset form to default values
    setApplicationForm({
      proposedBudget: "",
      estimatedDuration: {
        value: "",
        unit: "hours",
      },
      availability: {
        isAvailableOnDate: true,
        canTravelToLocation: true,
        travelDistance: "",
      },
      experience: {
        relevantExperience: "",
        yearsOfExperience: "",
        portfolioHighlights: "",
      },
      proposal: {
        message: "",
        whyInterested: "",
        additionalNotes: "",
      },
      terms: {
        agreedToTerms: false,
      },
    });
    setFormErrors({});
  };

  const closeApplyModal = () => {
    setApplyOpen(false);
    setApplyBookingId(null);
    setApplyBookingData(null);
    setFormErrors({});
    // Restore body scroll when modal closes
    document.body.style.overflow = "auto";
  };

  const validateForm = () => {
    const errors = {};

    // Validate proposed budget
    if (
      !applicationForm.proposedBudget ||
      applicationForm.proposedBudget <= 0
    ) {
      errors.proposedBudget = "Please enter a valid proposed budget";
    }

    // Validate estimated duration
    if (
      !applicationForm.estimatedDuration.value ||
      applicationForm.estimatedDuration.value <= 0
    ) {
      errors.estimatedDuration = "Please enter a valid estimated duration";
    }

    // Validate proposal message (minimum 50 characters)
    if (!applicationForm.proposal.message.trim()) {
      errors.proposalMessage = "Please write a proposal message";
    } else if (applicationForm.proposal.message.trim().length < 50) {
      errors.proposalMessage =
        "Proposal message must be at least 50 characters";
    }

    // Validate terms agreement
    if (!applicationForm.terms.agreedToTerms) {
      errors.agreedToTerms = "You must agree to the terms and conditions";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setApplicationForm((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setApplicationForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: "",
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
          unit: applicationForm.estimatedDuration.unit,
        },
        availability: {
          isAvailableOnDate: true,
          canTravelToLocation: true,
          travelDistance: 0,
        },
        experience: {
          relevantExperience: "N/A",
          yearsOfExperience: 0,
          portfolioHighlights: "",
        },
        proposal: {
          message: applicationForm.proposal.message.trim(),
          whyInterested: "",
          additionalNotes: "",
        },
        terms: {
          agreedToTerms: applicationForm.terms.agreedToTerms,
        },
      };

      const response = await applicationsAPI.applyToBooking(
        applyBookingId,
        artistDetails
      );

      // Check if onboarding is required
      if (response.requiresOnboarding && response.onboardingUrl) {
        closeApplyModal();
        showWarning(
          "Please complete your payment setup to continue applying to bookings."
        );
        // Redirect to Stripe onboarding
        window.location.href = response.onboardingUrl;
        return;
      }

      closeApplyModal();
      showSuccess("Application submitted successfully!");

      // Auto-fetch data after successful submission
      await fetchPendingBookings();
      await fetchNearbyBookings();
      await fetchSentProposals();

      // Refresh current tab data
      if (activeTab === "dashboard") {
        fetchArtistUpcomingEvents();
      } else if (activeTab === "applications") {
        if (applicationsFilter === "all") {
          fetchSavedBookings();
        } else {
          fetchApplicationsByStatus(applicationsFilter);
        }
      }
    } catch (e) {
      showError(e.message || "Failed to apply");
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
      showSuccess("Application withdrawn successfully!");
      closeWithdrawConfirm();

      // Refresh applied bookings list
      await fetchAppliedBookings();
    } catch (e) {
      showError(e.message || "Failed to withdraw application");
    } finally {
      setWithdrawLoading(false);
    }
  };

  // // Schedule - simple calendar and bookings by date (mock)
  // const [calendarMonth, setCalendarMonth] = useState(new Date(2025, 9, 1)); // Oct 2025
  // const [selectedDate, setSelectedDate] = useState(new Date(2025, 8, 15)); // Sep 15, 2025

  const bookingsByDate = {
    "2025-09-15": [
      {
        id: "bk-1",
        title: "Eid Mehndi",
        client: "Fatima Ali",
        time: "6:00 PM",
        location: "East London",
        status: "Final Payment Due",
        type: "party",
      },
      {
        id: "bk-3",
        title: "Bridal Trial",
        client: "Aisha Khan",
        time: "4:00 PM",
        location: "Downtown Studio, London",
        status: "Deposit Paid",
        type: "bridal",
      },
    ],
    "2025-10-10": [
      {
        id: "bk-2",
        title: "Festival Mehndi",
        client: "Aisha Khan",
        time: "3:00 PM",
        location: "123 Celebration Hall, London",
        status: "Deposit Paid",
        type: "festival",
      },
    ],
  };

  const startOfMonth = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1
  );
  const endOfMonth = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    0
  );
  const startWeekDay = (startOfMonth.getDay() + 6) % 7; // make Monday=0
  const totalDays = endOfMonth.getDate();

  const getCellDate = (index) => {
    const dayOffset = index - startWeekDay;
    return new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1 + dayOffset
    );
  };

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const toKey = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  // Accepted calendar data built dynamically from backend

  const fetchAcceptedCalendar = useCallback(async () => {
    if (!isAuthenticated || !user || user.userType !== "artist") return;
    try {
      const resp = await applicationsAPI.getMyApplicationsByStatus("accepted");
      const apps = Array.isArray(resp.data) ? resp.data : [];

      // Fetch booking details for each booking_id
      const toTag = (eventType) => {
        const types = Array.isArray(eventType)
          ? eventType
          : eventType
          ? [eventType]
          : [];
        const lower = types.map((t) => String(t).toLowerCase());
        if (lower.some((t) => t.includes("wedding") || t.includes("bridal")))
          return "bridal";
        if (lower.some((t) => t.includes("festival"))) return "festival";
        if (lower.some((t) => t.includes("party"))) return "party";
        return "casual";
      };

      const entries = await Promise.all(
        apps.map(async (a) => {
          try {
            const bookingId = a.bookingId || a.booking_id || a._id;
            if (!bookingId) return null;
            const bResp = await bookingsAPI.getBooking(bookingId);
            const b = bResp?.data || {};
            return {
              id: bookingId,
              client:
                b.firstName && b.lastName
                  ? `${b.firstName} ${b.lastName}`
                  : "Client",
              title:
                Array.isArray(b.eventType) && b.eventType.length
                  ? b.eventType.join(", ")
                  : b.otherEventType || "Mehndi Booking",
              date: b.eventDate ? new Date(b.eventDate) : null,
              time: Array.isArray(b.preferredTimeSlot)
                ? b.preferredTimeSlot.join(", ")
                : b.preferredTimeSlot || "",
              location: b.location || b.city || b.postalCode || "",
              status: "Accepted",
              tag: toTag(b.eventType),
            };
          } catch (_) {
            return null;
          }
        })
      );

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
        .map((k) => new Date(k))
        .filter((d) => d >= new Date())
        .sort((a, b) => a - b);
      if (upcomingDates.length) {
        setSelectedDate(upcomingDates[0]);
        setCalendarMonth(upcomingDates[0]);
      }
    } catch (_) {
      setAcceptedByDate({});
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (activeTab === "schedule") {
      fetchAcceptedCalendar();
    }
  }, [activeTab, fetchAcceptedCalendar]);

  // Fetch notes when secondEvent changes
  useEffect(() => {
    if (secondEvent?.id && user?.userType === "artist") {
      applicationsAPI
        .getApplicationNotes(secondEvent.id)
        .then((resp) => {
          if (resp.success) {
            setBookingNotes((prev) => ({
              ...prev,
              [secondEvent.id]: {
                ...prev[secondEvent.id],
                notes: resp.data || [],
              },
            }));
          }
        })
        .catch(console.error);
    }
  }, [secondEvent, user]);

  // Cancel booking modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState("Other");
  const [cancelDetails, setCancelDetails] = useState("");
  const [cancelError, setCancelError] = useState("");

  const openCancelModal = (booking) => {
    setSelectedBooking(booking);
    setCancelReason("Other");
    setCancelDetails("");
    setCancelError("");
    setCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    setCancelModalOpen(false);
    setSelectedBooking(null);
  };

  const confirmCancellation = () => {
    if (!cancelReason) {
      setCancelError("Please provide a cancellation reason.");
      return;
    }
    // Update local mock data by removing the booking from that date
    if (selectedBooking) {
      const key = Object.keys(bookingsByDate).find((k) =>
        bookingsByDate[k].some((b) => b.id === selectedBooking.id)
      );
      if (key) {
        bookingsByDate[key] = bookingsByDate[key].filter(
          (b) => b.id !== selectedBooking.id
        );
      }
    }
    closeCancelModal();
  };

  // Earnings - payout methods and transactions (mock)
  const [payoutMethods, setPayoutMethods] = useState([
    { id: "bank-1", bank: "Barclays Bank", last4: "1234", primary: true },
  ]);
  const [txFilter, setTxFilter] = useState("All");
  const [txSearch, setTxSearch] = useState("");
  const [transactions] = useState([
    {
      id: "t1",
      event: "Bridal Mehndi – Oct 10, 2025",
      client: "Aisha Khan",
      date: "2025-10-11",
      amount: 500,
      status: "Released",
    },
    {
      id: "t2",
      event: "Eid Mehndi – Sep 15, 2025",
      client: "Fatima Ali",
      date: "2025-09-16",
      amount: 250,
      status: "Pending",
    },
    {
      id: "t3",
      event: "Party Mehndi – Aug 30, 2025",
      client: "Sana Noor",
      date: "2025-08-31",
      amount: 150,
      status: "Processing",
    },
    {
      id: "t4",
      event: "Casual Mehndi – Jul 12, 2025",
      client: "Leila Ahmed",
      date: "2025-07-13",
      amount: 100,
      status: "Released",
    },
  ]);

  // Toggle to show hard-coded demo data instead of fetching from API
  const useMockData = true;

  // Helper function to calculate time ago
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const posted = new Date(dateString);
    const diffInHours = Math.floor((now - posted) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  };

  // Real proposals data from backend
  const [sentProposals, setSentProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);

  // Fetch sent proposals from backend
  const fetchSentProposals = useCallback(async () => {
    console.log("=== FETCH SENT PROPOSALS START ===");
    console.log("Auth status:", {
      isAuthenticated,
      user: user
        ? {
            id: user._id,
            userType: user.userType,
            name: `${user.firstName} ${user.lastName}`,
          }
        : null,
    });
    console.log("🔍 Current User Full Object:", user);

    if (!isAuthenticated || !user || user.userType !== "artist") {
      console.log(
        "Skipping proposal fetch - user not authenticated or not an artist:",
        { isAuthenticated, user: user?.userType }
      );
      return;
    }

    try {
      setProposalsLoading(true);
      console.log("Fetching sent proposals for artist...");

      // First test if we're properly authenticated
      try {
        const authTest = await authAPI.getProfile();
        console.log("Auth test successful:", authTest);
      } catch (authError) {
        console.error("Auth test failed:", authError);
        setSentProposals([]);
        return;
      }

      const response = await proposalsAPI.getMyProposals();
      console.log("Proposals API response:", response);

      if (response.success && response.data) {
        console.log("✅ Raw proposals data:", response.data);
        console.log("✅ Number of proposals found:", response.data.length);

        // Transform proposals data for display
        const transformedProposals = response.data.map((proposal) => ({
          id: proposal._id,
          jobTitle: proposal.job?.title || "Job Title Not Available",
          client: proposal.job?.client
            ? `${proposal.job.client.firstName || ""} ${
                proposal.job.client.lastName || ""
              }`.trim()
            : "Client",
          proposedPrice: `£${proposal.pricing?.totalPrice || 0}`,
          proposedDuration: `${
            proposal.timeline?.estimatedDuration?.value || 0
          } ${proposal.timeline?.estimatedDuration?.unit || "hours"}`,
          message: proposal.message || "",
          status: proposal.status || "pending",
          sentDate: proposal.submittedAt
            ? new Date(proposal.submittedAt).toLocaleDateString("en-GB")
            : "",
          responseDate: proposal.clientResponse?.respondedAt
            ? new Date(proposal.clientResponse.respondedAt).toLocaleDateString(
                "en-GB"
              )
            : null,
          rawData: proposal,
        }));

        console.log("✅ Setting transformed proposals:", transformedProposals);
        console.log(
          "✅ Number of proposals to display:",
          transformedProposals.length
        );
        setSentProposals(transformedProposals);
      } else {
        console.log("❌ No proposals data or unsuccessful response:", response);
        setSentProposals([]);
      }
    } catch (error) {
      console.error("Error fetching proposals:", error);
      console.error("Error details:", error.message, error.stack);

      // If it's an authentication error, show a more helpful message
      if (
        error.message.includes("401") ||
        error.message.includes("Not authorized")
      ) {
        console.log("Authentication failed - user may need to log in again");
        setError(
          "Authentication expired. Please refresh the page and log in again."
        );
      } else {
        setError(`Failed to load proposals: ${error.message}`);
      }

      // Keep existing proposals if fetch fails
    } finally {
      setProposalsLoading(false);
    }
  }, [isAuthenticated, user]);

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
          id: "booking-eid-2025-09-15",
          title: "Eid Mehndi – Sep 15, 2025",
          client: "Fatima Ali",
          dateText: "Sep 15, 2025 · 6:00 PM",
          status: "Deposit Paid",
          daysLeftText: "25 days left",
        },
      ]);

      // Notifications list
      setNotifications([
        {
          id: "n-1",
          type: "info",
          text: "New request: Bridal Mehndi in your city",
        },
        { id: "n-2", type: "success", text: "Deposit received for Eid Mehndi" },
        { id: "n-3", type: "warning", text: "Reminder: Event in 7 days" },
        { id: "n-4", type: "danger", text: "Final payment not received yet" },
      ]);

      // Requests near you (mock)
      setNearbyRequests([
        {
          id: "req-bridal-2025-10-20",
          title: "Bridal Mehndi – Oct 20, 2025",
          budget: "£500",
          location: "East London",
        },
        {
          id: "req-party-2025-11-02",
          title: "Party Mehndi – Nov 2, 2025",
          budget: "£150",
          location: "Birmingham",
        },
      ]);

      // Proposals (one accepted, one pending)
      setSentProposals([
        {
          id: "prop-1",
          jobTitle: "Eid Mehndi – Family Party",
          client: "Fatima Ali",
          proposedPrice: "£220",
          proposedDuration: "4 hours",
          message:
            "Happy to do elegant Eid designs for 5-6 guests. Portfolio attached.",
          status: "accepted",
          sentDate: "10/09/2025",
          responseDate: "11/09/2025",
        },
        {
          id: "prop-2",
          jobTitle: "Bridal Mehndi – Downtown City",
          client: "Aisha Khan",
          proposedPrice: "£450",
          proposedDuration: "6 hours",
          message:
            "Experienced in intricate bridal work. Can customize with name initials.",
          status: "pending",
          sentDate: "09/09/2025",
          responseDate: null,
        },
      ]);
      // Also get pending bookings for Applications tab
      fetchPendingBookings();
      fetchNearbyBookings();
      fetchNotifications();
      if (tab === "profile") {
        fetchMyPortfolios();
      }
      return;
    }

    console.log("Artist Dashboard useEffect:", {
      isAuthenticated,
      user: user
        ? {
            userType: user.userType,
            name: `${user.firstName} ${user.lastName}`,
          }
        : null,
    });

    if (isAuthenticated) {
      console.log("User is authenticated, fetching jobs and proposals...");
      setTimeout(() => {
        fetchSentProposals();
        fetchPendingBookings();
        fetchArtistUpcomingEvents();
        fetchNearbyBookings();
        fetchNotifications();
        if (tab === "profile") {
          fetchMyPortfolios();
        }
      }, 100);
    } else {
      console.log("User not authenticated");
      setLoading(false);
    }
  }, [
    isAuthenticated,
    user,
    fetchSentProposals,
    fetchPendingBookings,
    fetchArtistUpcomingEvents,
    fetchNearbyBookings,
    fetchNotifications,
  ]);

  // Derive overview data when proposals change
  useEffect(() => {
    // Use accepted proposals to create simple upcoming bookings list
    const accepted = sentProposals
      .filter((p) => p.status === "accepted")
      .map((p) => ({
        id: p.id,
        title: p.jobTitle,
        client: p.client,
        dateText: p.sentDate,
        status: "Deposit Paid",
        daysLeftText: "25 days left",
        startsInText: "Starts in 2 hours",
      }));

    setUpcomingBookings(accepted.slice(0, 3));

    // Pick next event (first accepted or null)
    setNextEvent(accepted.length > 0 ? accepted[0] : null);

    // Lightweight notifications from proposal states
    const notif = [];
    if (sentProposals.some((p) => p.status === "accepted")) {
      notif.push({
        id: "n1",
        type: "success",
        text: "A proposal was accepted. Check details.",
      });
    }
    if (sentProposals.some((p) => p.status === "pending")) {
      notif.push({
        id: "n2",
        type: "info",
        text: "You have pending proposals awaiting reply.",
      });
    }
    if (accepted.length === 0) {
      notif.push({
        id: "n3",
        type: "warning",
        text: "No upcoming bookings yet.",
      });
    }
    setNotifications(notif);
  }, [sentProposals]);

  // Use real jobs or show empty state
  const displayJobs = availableJobs;

  const [artistConversations, setArtistConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  // If booking not in URL, try to derive from chat messages attachment of type 'booking'
  useEffect(() => {
    if (
      headerBooking ||
      !Array.isArray(chatMessages) ||
      chatMessages.length === 0
    )
      return;
    try {
      for (let idx = chatMessages.length - 1; idx >= 0; idx--) {
        const m = chatMessages[idx];
        const att = (m.attachments || []).find(
          (a) => a.type === "booking" && a.filename
        );
        if (att && att.filename) {
          bookingsAPI
            .getBooking(att.filename)
            .then((res) => setHeaderBooking(res.data || null))
            .catch(() => {});
          break;
        }
      }
    } catch {}
  }, [chatMessages, headerBooking]);

  // Wallet
  const [walletSummary, setWalletSummary] = useState({
    totalPaid: 0,
    remainingBalance: 0,
  });
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [walletLoading, setWalletLoading] = useState(false);

  // Earnings
  const [earningsData, setEarningsData] = useState({
    lifetimeEarnings: 0,
    thisMonthEarnings: 0,
  });
  const [earningsLoading, setEarningsLoading] = useState(false);

  // Transaction filters for artist
  const [transactionCategoryFilter, setTransactionCategoryFilter] =
    useState("all");
  const [transactionStatusFilter, setTransactionStatusFilter] = useState("all");

  // Transaction filter functions
  const handleTransactionCategoryFilter = (category) => {
    setTransactionCategoryFilter(category);
  };

  const handleTransactionStatusFilter = (status) => {
    setTransactionStatusFilter(status);
  };

  // Filter transactions based on selected filters
  const getFilteredTransactions = () => {
    return walletTransactions.filter((transaction) => {
      // Category filter - use the category field from the controller
      const categoryMatch =
        transactionCategoryFilter === "all" ||
        (transaction.category &&
          transaction.category.toLowerCase() ===
            transactionCategoryFilter.toLowerCase());

      // Status filter
      const statusMatch =
        transactionStatusFilter === "all" ||
        transaction.transactionType === transactionStatusFilter;

      return categoryMatch && statusMatch;
    });
  };

  const fetchWalletData = useCallback(async () => {
    if (!isAuthenticated || !user || user.userType !== "artist") return;
    try {
      setWalletLoading(true);
      // summary
      const summaryRes = await walletAPI.getWalletSummary();
      const summary = summaryRes?.data || {};
      setWalletSummary({
        totalPaid: Number(summary.totalPaid || 0),
        remainingBalance: Number(summary.remainingBalance || 0),
      });
      // transactions
      try {
        const txRes = await transactionAPI.getMyTransactions();
        const txs = Array.isArray(txRes?.data) ? txRes.data : [];
        console.log("Artist transactions:", txs);

        // Use the enhanced transaction data from the controller
        const mapped = txs.map((t) => ({
          _id: t._id,
          id: t._id || t.id,
          eventName: t.eventName || "Unknown Event",
          category: t.category || "Event",
          artistName: t.artistName || "Unknown Artist",
          artistInfo: t.artistInfo,
          amount: Number(t.amount || 0),
          amountDisplay:
            t.amountDisplay || `£${Number(t.amount || 0).toFixed(0)}`,
          transactionType: t.transactionType || "payment",
          statusText: t.statusText || "Paid",
          statusClass: t.statusClass || "paid",
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
          paymentMethod: t.paymentMethod || "Stripe",
          invoiceAvailable: t.invoiceAvailable !== false,
          // Legacy fields for backward compatibility
          event: t.eventName || t.event || t.description || "Transaction",
          method: t.paymentMethod || t.method || t.provider || "Stripe",
          type: t.transactionType || t.type || t.category || "payment",
          status: t.statusText || t.status || "Paid",
          date: t.createdAt ? new Date(t.createdAt) : new Date(),
        }));
        setWalletTransactions(mapped);
      } catch (_) {
        setWalletTransactions([]);
      }
    } catch (e) {
      showError(e.message || "Failed to load wallet");
      setWalletSummary({ totalPaid: 0, remainingBalance: 0 });
      setWalletTransactions([]);
    } finally {
      setWalletLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchEarningsData = useCallback(async () => {
    if (!isAuthenticated || !user || user.userType !== "artist") return;
    try {
      setEarningsLoading(true);
      const earningsRes = await transactionAPI.getArtistEarnings();
      const earnings = earningsRes?.data || {};
      setEarningsData({
        lifetimeEarnings: Number(earnings.lifetimeEarnings || 0),
        thisMonthEarnings: Number(earnings.thisMonthEarnings || 0),
      });
    } catch (error) {
      console.error("Error fetching earnings data:", error);
    } finally {
      setEarningsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Auto-fetch wallet data on mount and user change
  useEffect(() => {
    if (isAuthenticated && user && user.userType === "artist") {
      fetchWalletData();
      fetchEarningsData();
    }
  }, [isAuthenticated, user, fetchWalletData, fetchEarningsData]);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const openWithdraw = () => setWithdrawOpen(true);
  const closeWithdraw = () => setWithdrawOpen(false);
  const canConfirmWithdraw = () => {
    const amt = Number(withdrawAmount);
    return (
      !Number.isNaN(amt) && amt > 0 && amt <= walletSummary.remainingBalance
    );
  };
  const formatGBP = (n) =>
    `£${Number(n).toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  const confirmWalletWithdraw = async () => {
    if (!canConfirmWithdraw() || withdrawLoading) return;
    const amt = Number(withdrawAmount);
    try {
      setWithdrawLoading(true);
      await walletAPI.withdrawFunds({ amount: amt });
      try {
        showSuccess("Withdrawal requested successfully");
      } catch {}
      setWithdrawAmount("");
      closeWithdraw();
      await fetchWalletData();
    } catch (e) {
      try {
        showError(e.message || "Failed to withdraw");
      } catch {}
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    // Close conversation when switching to a different tab
    if (tab !== "messages" && (currentChat || selectedConversation)) {
      setSelectedConversation(null);
      setCurrentChat(null);
      setChatMessages([]);
    }
    setActiveTab(tab);

    // Auto-fetch data based on tab
    if (tab === "dashboard") {
      navigate(`/artist-dashboard`);
      fetchArtistUpcomingEvents();
      fetchPendingBookings();
      fetchNearbyBookings(); // Always fetch nearby bookings for dashboard
    } else if (tab === "applications") {
      if (applicationsFilter === "all") {
        fetchSavedBookings();
      } else {
        fetchApplicationsByStatus(applicationsFilter);
      }
      fetchSentProposals(); // Always fetch sent proposals for applications tab
    } else if (tab === "schedule") {
      fetchAcceptedCalendar();
    } else if (tab === "messages") {
      chatAPI
        .listMyChats()
        .then((res) => {
          if (res.success) setArtistConversations(res.data || []);
        })
        .catch(console.error);
    } else if (tab === "wallet") {
      fetchWalletData();
      fetchEarningsData();
    } else if (tab === "profile") {
      fetchMyPortfolios();
    }

    if (tab === "dashboard") {
      navigate(`/artist-dashboard`);
      return;
    }
    navigate(`/artist-dashboard/${tab}`);

    // Always fetch nearby bookings when switching tabs (for dashboard access)
    if (tab !== "dashboard") {
      fetchNearbyBookings();
    }
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleLogoutClick = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      try {
        await logout();
      } catch {}
      localStorage.clear();
      const deleteCookieEverywhere = (name) => {
        try {
          const hostname = window.location.hostname;
          const parts = hostname.split(".");
          for (let i = 0; i < parts.length; i++) {
            const domain = parts.slice(i).join(".");
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
          }
        } catch (e) {}
      };
      deleteCookieEverywhere("token");
      deleteCookieEverywhere("refreshToken");
      navigate("/login");
    } catch (e) {
      console.error("Logout error:", e);
      navigate("/login");
    }
  };

  const handleNoteChange = (bookingId, value) => {
    setBookingNotes((prev) => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] || {}),
        text: value,
      },
    }));
  };

  const handleToggleFollowUp = (bookingId) => {
    setBookingNotes((prev) => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] || {}),
        followUp: !prev[bookingId]?.followUp,
      },
    }));
  };

  const handleSaveNotes = (bookingId) => {
    const note = bookingNotes[bookingId] || {};
    console.log("Saved notes for", bookingId, note);
    showSuccess("Notes saved");
  };

  const handleSendProposal = (job) => {
    setSelectedJob(job);
    setShowProposalModal(true);
  };

  const handleCloseProposalModal = () => {
    setShowProposalModal(false);
    setSelectedJob(null);
    setProposalData({
      message: "",
      price: "",
      duration: "",
      experience: "",
    });
  };

  const handleProposalInputChange = (field, value) => {
    setProposalData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitProposal = async () => {
    if (!selectedJob || !proposalData.price || !proposalData.message) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSubmittingProposal(true);
      setError("");

      // Prepare proposal data according to backend API schema
      const proposalPayload = {
        jobId: selectedJob.id,
        message: proposalData.message,
        pricing: {
          totalPrice: parseFloat(proposalData.price.replace(/[£,]/g, "")), // Remove currency symbols
          currency: "GBP",
        },
        timeline: {
          estimatedDuration: {
            value: parseFloat(proposalData.duration.replace(/[^0-9.]/g, "")), // Extract numeric value
            unit: "hours",
          },
        },
        experience: {
          relevantExperience: proposalData.experience,
          yearsOfExperience: 0, // You might want to add this to the form
        },
        coverLetter: proposalData.message, // Use message as cover letter for now
      };

      console.log("Submitting proposal:", proposalPayload);

      const response = await proposalsAPI.createProposal(proposalPayload);

      if (response.success) {
        console.log("Proposal submitted successfully:", response.data);

        // Show success message
        showSuccess("Proposal submitted successfully!");

        // Close modal and reset form
        handleCloseProposalModal();

        // Auto-fetch data after successful submission
        setTimeout(async () => {
          console.log(
            "Refreshing data after successful proposal submission..."
          );
          await fetchSentProposals();
          await fetchNearbyBookings();

          // Refresh current tab data
          if (activeTab === "applications") {
            if (applicationsFilter === "all") {
              fetchSavedBookings();
            } else {
              fetchApplicationsByStatus(applicationsFilter);
            }
          } else if (activeTab === "dashboard") {
            fetchArtistUpcomingEvents();
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error submitting proposal:", error);
      setError(error.message || "Failed to submit proposal. Please try again.");
    } finally {
      setSubmittingProposal(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    // If clicking the same conversation that's already open, close it
    if (
      currentChat &&
      selectedConversation &&
      String(currentChat._id) === String(conversation._id)
    ) {
      setSelectedConversation(null);
      setCurrentChat(null);
      setChatMessages([]);
      return;
    }

    setSelectedConversation(conversation);
    setCurrentChat(conversation);
    const clientId =
      conversation.client?._id || conversation.clientId || conversation.id;
    const roomId = buildDirectRoomId(user?._id, clientId);
    joinRoom(roomId, { userId: user?._id, userType: "artist" });
    chatAPI
      .getChat(conversation._id)
      .then((res) => {
        if (res.success) {
          setChatMessages(res.data.messages || []);
          // Scroll to bottom when conversation is selected
          setTimeout(scrollToBottom, 100);
        }
      })
      .then(() => {
        chatAPI.markRead(conversation._id).then(() => {
          // Refresh conversations to update unread count
          chatAPI
            .listMyChats()
            .then((res) => {
              if (res.success) setArtistConversations(res.data || []);
            })
            .catch(console.error);
        });
      })
      .catch(console.error);
  };

  // Cloudinary upload function
  const uploadToCloudinary = async (files) => {
    const cloudinary = {
      cloudName: "dstelsc7m",
      uploadPreset: "mehndi",
      folder: "mehndi/messages",
    };

    const { cloudName, uploadPreset, folder } = cloudinary;
    if (!cloudName || !uploadPreset)
      throw new Error("Cloudinary config missing");
    const base = `https://api.cloudinary.com/v1_1/${cloudName}`;

    const results = [];

    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", uploadPreset);
      if (folder) fd.append("folder", folder);

      // FIX 1: Hamesha 'auto' use karein.
      // Cloudinary file ko inspect karke khud decide kar lega.
      const resourceType = "auto";

      // URL ab hamesha .../auto/upload hoga
      const r = await fetch(`${base}/${resourceType}/upload`, {
        method: "POST",
        body: fd,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error?.message || "File upload failed");

      // FIX 2: 'attachmentType' file ke MIME type aur Cloudinary response se set karein.
      let attachmentType = "document"; // Default

      // First check file extension for PDFs (most reliable)
      if (file.name.toLowerCase().endsWith(".pdf")) {
        attachmentType = "document";
      } else if (file.type.startsWith("image/")) {
        attachmentType = "image";
      } else if (file.type.startsWith("video/")) {
        attachmentType = "video";
      } else if (
        file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.type === "text/plain" ||
        file.type.startsWith("application/")
      ) {
        attachmentType = "document";
      } else if (data.resource_type === "image") {
        attachmentType = "image";
      } else if (data.resource_type === "video") {
        attachmentType = "video";
      } else if (data.resource_type === "raw") {
        attachmentType = "document";
      }

      console.log("DEBUG: File type detection:", {
        fileName: file.name,
        mimeType: file.type,
        cloudinaryResourceType: data.resource_type,
        finalAttachmentType: attachmentType,
      });

      results.push({
        type: attachmentType, // Yeh ab 100% sahi hoga
        url: data.secure_url, // Yeh URL ab file type ke hisab se hoga
        filename: file.name,
        size: file.size,
        mimeType: file.type, // Ise save karna aadat hai, aage kaam aa sakta hai
      });
    }

    return results;
  };

  const handleSendMessage = async () => {
    if ((newMessage.trim() || attachments.length > 0) && currentChat) {
      const clientId =
        currentChat.client?._id || currentChat.clientId || currentChat.id;
      const roomId = buildDirectRoomId(user?._id, clientId);
      const text = newMessage.trim();

      setIsUploading(true);
      try {
        let uploadedAttachments = [];
        if (attachments.length > 0) {
          uploadedAttachments = await uploadToCloudinary(attachments);
        }

        // Build payloads: one for text (if any), and one per attachment
        const payloads = [];
        if (text) payloads.push({ text, attachments: [] });
        uploadedAttachments.forEach((att) =>
          payloads.push({ text: "", attachments: [att] })
        );

        let latestMessages = null;
        for (const payload of payloads) {
          // send sequentially to preserve order
          const res = await chatAPI.sendMessage(
            currentChat._id,
            payload.text,
            payload.attachments
          );
          if (res.success) {
            latestMessages = res.data.messages;
            const saved = res.data.messages[res.data.messages.length - 1];
            sendRoomMessage(roomId, {
              id: saved._id || Date.now(),
              senderId: saved.sender,
              senderName: artistName,
              message: saved.text,
              timestamp: new Date(
                saved.createdAt || Date.now()
              ).toLocaleString(),
              type:
                saved.attachments && saved.attachments.length
                  ? "attachment"
                  : "text",
              attachments: saved.attachments || [],
            });
          }
        }

        if (latestMessages) {
          setChatMessages(latestMessages);
          // Scroll to bottom after messages are updated
          setTimeout(scrollToBottom, 100);
        }
        setNewMessage("");
        setAttachments([]);

        // Auto-fetch conversations after sending message (on all tabs)
        chatAPI
          .listMyChats()
          .then((res) => {
            if (res.success) setArtistConversations(res.data || []);
          })
          .catch(console.error);
      } catch (e) {
        console.error(e);
        alert("Failed to send message. Please try again.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Load conversations on all tabs to keep unread count updated
  useEffect(() => {
    if (!user) return;
    chatAPI
      .listMyChats()
      .then((res) => {
        if (res.success) setArtistConversations(res.data || []);
      })
      .catch(console.error);
    const interval = setInterval(() => {
      chatAPI
        .listMyChats()
        .then((res) => {
          if (res.success) setArtistConversations(res.data || []);
        })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // If chatId is provided in query, open messages tab and select that chat; add to list if missing
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(location.search);
    const chatId = params.get("chatId");
    const viewBookingId = params.get("viewBooking");
    const applyBookingIdParam = params.get("applyBooking");
    if (chatId) {
      handleTabChange("messages");
      chatAPI
        .getChat(chatId)
        .then((res) => {
          if (res.success && res.data) {
            const chat = res.data;
            setSelectedConversation(chat);
            setCurrentChat(chat);
            setChatMessages(chat.messages || []);
            const otherId = chat.client?._id || chat.clientId;
            if (otherId) {
              const roomId = buildDirectRoomId(user?._id, otherId);
              joinRoom(roomId, { userId: user?._id, userType: "artist" });
            }
            chatAPI.markRead(chat._id).catch(() => {});
            setArtistConversations((prev) => {
              const exists = prev.some((c) => (c._id || c.id) === chat._id);
              if (exists) return prev;
              const display = {
                ...chat,
                clientName: chat.client
                  ? `${chat.client.firstName} ${chat.client.lastName}`
                  : "Client",
                clientImage: chat.client?.userProfileImage || chat.clientImage,
                lastMessage: chat.messages?.length
                  ? chat.messages[chat.messages.length - 1].text
                  : "",
                unreadCount: 0,
              };
              return [display, ...prev];
            });
          }
        })
        .catch(() => {});
    } else if (viewBookingId) {
      handleTabChange("applications");
      openViewBooking(viewBookingId);
    } else if (applyBookingIdParam) {
      handleTabChange("applications");
      openApplyModal(applyBookingIdParam);
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

  // Realtime incoming messages (single listener with de-duplication)
  useEffect(() => {
    if (!user) return;
    const onMessage = (incoming) => {
      // Don't process own messages
      if (String(incoming.senderId) === String(user?._id)) {
        return;
      }

      // Get the other user ID from current chat (client ID for artist)
      const currentChatClientId =
        currentChat?.client?._id || currentChat?.clientId;

      // Only add message if it's from the current chat's other user
      if (
        currentChat &&
        String(incoming.senderId) === String(currentChatClientId)
      ) {
        console.log(
          "DEBUG: Received socket message for current chat:",
          incoming
        );

        setChatMessages((prev) => {
          const already = prev.some(
            (m) => String(m.id || m._id) === String(incoming.id || incoming._id)
          );
          if (already) return prev;
          return [
            ...prev,
            {
              id: incoming.id || incoming._id || Date.now(),
              sender: incoming.senderId,
              text: incoming.message || incoming.text || "",
              attachments: incoming.attachments || [],
              createdAt: new Date().toISOString(),
            },
          ];
        });

        // Mark as read and refresh conversations to update unread count
        chatAPI
          .markRead(currentChat._id)
          .then(() => {
            // Refresh conversations after marking as read to update unread count
            return chatAPI.listMyChats();
          })
          .then((res) => {
            if (res.success) setArtistConversations(res.data || []);
          })
          .catch(console.error);
      } else {
        // Message is for a different chat, just update conversations
        chatAPI
          .listMyChats()
          .then((res) => {
            if (res.success) setArtistConversations(res.data || []);
          })
          .catch(console.error);
      }
    };
    const onTyping = ({ userId, isTyping }) => {
      // optional: typing state
    };
    socket.on("message", onMessage);
    socket.on("typing", onTyping);
    return () => {
      socket.off("message", onMessage);
      socket.off("typing", onTyping);
    };
  }, [user, currentChat]);
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Validate file types and sizes
      const validFiles = files.filter((file) => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
          "video/mp4",
          "video/avi",
          "video/mov",
          "video/wmv",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
          "application/zip",
          "application/x-rar-compressed",
        ];

        if (file.size > maxSize) {
          alert(`File ${file.name} is too large. Maximum size is 10MB.`);
          return false;
        }

        if (!allowedTypes.includes(file.type)) {
          alert(`File type ${file.type} is not supported.`);
          return false;
        }

        return true;
      });

      setAttachments((prev) => [...prev, ...validFiles]);
    }
    e.target.value = ""; // Reset input
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [chatMessages]);

  const downloadFile = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download file. Please try again.");
    }
  };

  const getProposalStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="proposal-status pending">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            Pending
          </span>
        );
      case "accepted":
        return (
          <span className="proposal-status accepted">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20,6 9,17 4,12" />
            </svg>
            Accepted
          </span>
        );
      case "declined":
        return (
          <span className="proposal-status declined">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Declined
          </span>
        );
      default:
        return (
          <span className="proposal-status pending">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
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
          unreadMessageCount={artistConversations.reduce(
            (total, conv) => total + (conv.unreadCount || 0),
            0
          )}
        />

        {/* Main Content */}
        <div className="dashboard-main-content">
          {/* Mobile Sidebar Toggle */}
          <button className="sidebar-toggle-btn" onClick={handleSidebarToggle}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="dashboard-container">
            <div className="dashboard-content">
              {activeTab === "dashboard" && (
                <>
                  {/* Welcome Section */}
                  <div className="welcome-section">
                    <h2 className="welcome-message">
                      Hi {artistName.split(" ")[0]} <FaHandPeace />, here are
                      your upcoming mehndi events!
                    </h2>

                    {/* Next Event Card */}
                    <div className="next-event-card">
                      <div className="event-header">
                        <FaCalendarAlt
                          className="event-icon"
                          style={{ color: "#d4a574", fontSize: "24px" }}
                        />
                        <h3 style={{ marginLeft: "12px" }}>
                          {nextEvent
                            ? `Next Event: ${nextEvent.title}`
                            : "No upcoming event"}
                        </h3>
                      </div>
                      {nextEvent && (
                        <>
                          <div className="event-details">
                            <div className="event-left">
                              <p
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  marginBottom: "10px",
                                }}
                              >
                                {/* <FaUser style={{ color: '#d4a574' }} /> */}
                                <strong>Client:</strong> {nextEvent.client}
                              </p>
                              <p
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  marginBottom: "10px",
                                }}
                              >
                                {/* <FaCalendarAlt style={{ color: '#d4a574' }} /> */}
                                <strong>Date:</strong> {nextEvent.date} -{" "}
                                {nextEvent.timeSlot}
                              </p>
                              {nextEvent.location && (
                                <p
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "10px",
                                  }}
                                >
                                  <strong>Location:</strong>{" "}
                                  {nextEvent.location}
                                </p>
                              )}
                            </div>
                            <div className="event-right">
                              <div
                                className="status-badge deposit-paid"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  backgroundColor: "transparent",
                                  padding: "0px",
                                  margin: "0px",
                                  color: "#2d5f3f",
                                  fontWeight: "600",
                                }}
                              >
                                <FaCheckCircle style={{ color: "#2d5f3f" }} />
                                {nextEvent.status}
                              </div>
                              <p
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  color: "#e67e22",
                                  fontWeight: "600",
                                  marginTop: "0px",
                                }}
                              >
                                <FaClock style={{ color: "#e67e22" }} />
                                Starts in {nextEvent.daysLeft} day
                                {nextEvent.daysLeft === 1 ? "" : "s"}
                              </p>
                            </div>
                          </div>
                          <div style={{ marginTop: "16px" }}>
                            <button
                              className="btn-primary"
                              onClick={() => openViewBooking(nextEvent.id)}
                              style={{
                                padding: "10px 24px",
                                fontSize: "14px",
                                fontWeight: "600",
                                borderRadius: "8px",
                                cursor: "pointer",
                                backgroundColor: "#d4a574",
                                border: "none",
                                color: "white",
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
                      <h3
                        className="section-title"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <FaCalendarAlt style={{ color: "#d4a574" }} />
                        Upcoming & Confirmed Bookings
                      </h3>
                      {!secondEvent ? (
                        <div style={{ textAlign: "center" }}>
                          <div
                            className="no-more-bookings"
                            style={{
                              border: "2px dashed #d4a574",
                              borderRadius: "12px",
                              padding: "40px 20px",
                              textAlign: "center",
                              backgroundColor: "#F5DEB3",
                              marginBottom: "20px",
                            }}
                          >
                            <p
                              style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#666",
                                margin: 0,
                              }}
                            >
                              No more confirmed bookings
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          {secondEvent && (
                            <div
                              className="booking-card"
                              style={{ marginBottom: "20px" }}
                            >
                              <div className="booking-info">
                                <h4 className="booking-title">
                                  {secondEvent.title} - {secondEvent.date}
                                </h4>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "8px",
                                  }}
                                >
                                  <p className="booking-artist">
                                    Client: {secondEvent.client}
                                  </p>
                                  <span className="status-badge small">
                                    {secondEvent.status}
                                  </span>
                                </div>
                                <div
                                  className="booking-meta"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "8px",
                                  }}
                                >
                                  <span>{secondEvent.timeSlot}</span>
                                  {secondEvent.daysLeft !== undefined && (
                                    <span className="days-left-text">
                                      {secondEvent.daysLeft} day
                                      {secondEvent.daysLeft === 1
                                        ? ""
                                        : "s"}{" "}
                                      left ⌛
                                    </span>
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
                              <div style={{ marginTop: "12px" }}>
                                <button
                                  className="btn-primary"
                                  onClick={() =>
                                    openViewBooking(secondEvent.id)
                                  }
                                  style={{
                                    padding: "8px 20px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    backgroundColor: "#d4a574",
                                    border: "none",
                                    color: "white",
                                  }}
                                >
                                  View Event Details
                                </button>
                              </div>

                              {/* Notes & Reminders Section */}
                              <div
                                style={{
                                  marginTop: "20px",
                                  padding: "16px",
                                  backgroundColor: "#f9f9f9",
                                  borderRadius: "8px",
                                  border: "1px solid #e0e0e0",
                                }}
                              >
                                <h4
                                  style={{
                                    margin: "0 0 12px 0",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#333",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                  }}
                                >
                                  <FaStickyNote style={{ color: "#d4a574" }} />
                                  Notes & Reminders
                                </h4>

                                <textarea
                                  placeholder="Add prep notes here..."
                                  value={
                                    bookingNotes[secondEvent.id]?.newNote || ""
                                  }
                                  onChange={(e) => {
                                    setBookingNotes((prev) => ({
                                      ...prev,
                                      [secondEvent.id]: {
                                        ...prev[secondEvent.id],
                                        newNote: e.target.value,
                                      },
                                    }));
                                  }}
                                  style={{
                                    width: "100%",
                                    minHeight: "80px",
                                    padding: "10px",
                                    border: "1px solid #ddd",
                                    borderRadius: "6px",
                                    fontSize: "13px",
                                    resize: "vertical",
                                    marginBottom: "10px",
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

                                <div
                                  style={{
                                    display: "flex",
                                    gap: "10px",
                                    alignItems: "center",
                                  }}
                                >
                                  <button
                                    onClick={async () => {
                                      const note =
                                        bookingNotes[
                                          secondEvent.id
                                        ]?.newNote?.trim();
                                      if (!note) {
                                        showError("Please enter a note");
                                        return;
                                      }

                                      try {
                                        setSavingNote(true);
                                        await applicationsAPI.addApplicationNote(
                                          secondEvent.id,
                                          {
                                            content: note,
                                            followUp:
                                              bookingNotes[secondEvent.id]
                                                ?.followUp || false,
                                          }
                                        );

                                        // Fetch updated notes
                                        const resp =
                                          await applicationsAPI.getApplicationNotes(
                                            secondEvent.id
                                          );
                                        setBookingNotes((prev) => ({
                                          ...prev,
                                          [secondEvent.id]: {
                                            notes: resp.data || [],
                                            newNote: "",
                                            followUp: false,
                                          },
                                        }));

                                        showSuccess("Note saved successfully");
                                      } catch (e) {
                                        showError(
                                          e.message || "Failed to save note"
                                        );
                                      } finally {
                                        setSavingNote(false);
                                      }
                                    }}
                                    disabled={
                                      savingNote ||
                                      !bookingNotes[
                                        secondEvent.id
                                      ]?.newNote?.trim()
                                    }
                                    style={{
                                      padding: "8px 16px",
                                      backgroundColor: "#d4a574",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "6px",
                                      fontSize: "13px",
                                      fontWeight: "600",
                                      cursor:
                                        savingNote ||
                                        !bookingNotes[
                                          secondEvent.id
                                        ]?.newNote?.trim()
                                          ? "not-allowed"
                                          : "pointer",
                                      opacity:
                                        savingNote ||
                                        !bookingNotes[
                                          secondEvent.id
                                        ]?.newNote?.trim()
                                          ? 0.6
                                          : 1,
                                    }}
                                  >
                                    {savingNote ? "Saving..." : "Save Notes"}
                                  </button>

                                  {bookingNotes[secondEvent.id]?.notes?.length >
                                    0 && (
                                    <button
                                      onClick={() => {
                                        setViewNotesBookingId(secondEvent.id);
                                        setViewNotesModalOpen(true);
                                      }}
                                      style={{
                                        padding: "8px 16px",
                                        backgroundColor: "transparent",
                                        color: "#d4a574",
                                        border: "1px solid #d4a574",
                                        borderRadius: "6px",
                                        fontSize: "13px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                      }}
                                    >
                                      <FaEye /> View Notes (
                                      {
                                        bookingNotes[secondEvent.id]?.notes
                                          ?.length
                                      }
                                      )
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          marginTop: "20px",
                        }}
                      >
                        <button
                          onClick={() => {
                            try {
                              navigate("/browse-requests");
                            } catch (_) {
                              /* fallback: */ handleTabChange &&
                                handleTabChange("applications");
                            }
                          }}
                          style={{
                            padding: "12px 28px",
                            backgroundColor: "transparent",
                            color: "#d4a574",
                            border: "2px solid #d4a574",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                          }}
                          onMouseOver={(e) => {
                            e.target.style.backgroundColor = "#d4a574";
                            e.target.style.color = "white";
                          }}
                          onMouseOut={(e) => {
                            e.target.style.backgroundColor = "transparent";
                            e.target.style.color = "#d4a574";
                          }}
                        >
                          View All Bookings
                        </button>
                      </div>
                    </div>

                    {/* Right Column - Notifications */}
                    <div className="notifications-section">
                      <h3 className="section-title">
                        <FaClock /> Notifications
                      </h3>
                      <div className="notifications-list">
                        {notificationsLoading ? (
                          <div className="notification-item default">
                            <span className="notification-icon">⏳</span>
                            <p className="notification-text">
                              Loading notifications...
                            </p>
                          </div>
                        ) : (
                          <>
                            {/* Next Event Reminder */}
                            {nextEvent && (
                              <div
                                className="notification-item reminder"
                                style={{
                                  backgroundColor:
                                    nextEvent.daysLeft <= 7
                                      ? "#ffebee"
                                      : "#e3f2fd",
                                }}
                              >
                                <span className="notification-icon">
                                  <FaCalendarAlt />
                                </span>
                                <div className="notification-content">
                                  <p className="notification-title">
                                    Upcoming Booking
                                  </p>
                                  <p className="notification-text">
                                    Your {nextEvent.title} with{" "}
                                    {nextEvent.client} is in{" "}
                                    {nextEvent.daysLeft} days
                                  </p>
                                  <span className="notification-time">
                                    {nextEvent.date} at {nextEvent.timeSlot}
                                    {nextEvent.location &&
                                      ` • ${nextEvent.location}`}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Second Event Reminder */}
                            {secondEvent && (
                              <div
                                className="notification-item reminder"
                                style={{
                                  backgroundColor:
                                    secondEvent.daysLeft <= 7
                                      ? "#ffebee"
                                      : "#e3f2fd",
                                }}
                              >
                                <span className="notification-icon">
                                  <FaCalendarAlt />
                                </span>
                                <div className="notification-content">
                                  <p className="notification-title">
                                    Upcoming Booking
                                  </p>
                                  <p className="notification-text">
                                    Your {secondEvent.title} with{" "}
                                    {secondEvent.client} is in{" "}
                                    {secondEvent.daysLeft} days
                                  </p>
                                  <span className="notification-time">
                                    {secondEvent.date} at {secondEvent.timeSlot}
                                    {secondEvent.location &&
                                      ` • ${secondEvent.location}`}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Regular Notifications */}
                            {notifications.length === 0 &&
                            !nextEvent &&
                            !secondEvent ? (
                              <div className="notification-item default">
                                <span className="notification-icon">ℹ️</span>
                                <p className="notification-text">
                                  No notifications
                                </p>
                              </div>
                            ) : (
                              notifications.map((notification) => (
                                <div
                                  key={notification.id}
                                  className={`notification-item ${
                                    notification.type
                                  } ${!notification.isRead ? "unread" : ""}`}
                                  style={{
                                    backgroundColor: "#e8f5e8",
                                    cursor: "pointer",
                                  }}
                                >
                                  <span className="notification-icon">
                                    <FaEnvelope></FaEnvelope>
                                  </span>
                                  <div className="notification-content">
                                    <p className="notification-title">
                                      {notification.title}
                                    </p>
                                    <p className="notification-text">
                                      {notification.message}
                                    </p>
                                    <span className="notification-time">
                                      {new Date(
                                        notification.createdAt
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <button
                                    className="notification-delete-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification.id);
                                    }}
                                    title="Delete notification"
                                  >
                                    <FaTrash color="green" />
                                  </button>
                                </div>
                              ))
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Requests Near You */}
                  <div className="nearby-requests">
                    <div
                      className="nearby-header"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "15px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span className="nearby-icon">📍</span>
                        <h3
                          className="section-title"
                          style={{ margin: "0", marginLeft: "8px" }}
                        >
                          Requests Near You
                        </h3>
                      </div>
                      <button
                        className="refresh-btn"
                        onClick={fetchNearbyBookings}
                        disabled={nearbyLoading}
                        style={{
                          padding: "8px 16px",
                          fontSize: "13px",
                          background: nearbyLoading ? "#e0e0e0" : "#d4a574",
                          color: nearbyLoading ? "#999" : "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: nearbyLoading ? "not-allowed" : "pointer",
                          fontWeight: "500",
                          transition: "all 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                        onMouseEnter={(e) => {
                          if (!nearbyLoading) {
                            e.target.style.background = "#b8945f";
                            e.target.style.transform = "translateY(-1px)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!nearbyLoading) {
                            e.target.style.background = "#d4a574";
                            e.target.style.transform = "translateY(0)";
                          }
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="23,4 23,10 17,10" />
                          <polyline points="1,20 1,14 7,14" />
                          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                        </svg>
                        {nearbyLoading ? "Loading..." : "Refresh"}
                      </button>
                    </div>
                    <div className="nearby-list">
                      {nearbyLoading ? (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "20px",
                            color: "#666",
                          }}
                        >
                          Loading nearby requests...
                        </div>
                      ) : nearbyRequests.length === 0 ? (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "20px",
                            color: "#666",
                          }}
                        >
                          No requests found within 3km
                        </div>
                      ) : (
                        nearbyRequests.map((r) => (
                          <div
                            key={r.id}
                            className="request-card"
                            style={{
                              background: "white",
                              borderRadius: "12px",
                              padding: "16px",
                              marginBottom: "12px",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                              border: "1px solid #f0f0f0",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <div
                              className="request-info"
                              style={{ flex: 1, marginRight: "16px" }}
                            >
                              <h4
                                className="request-title"
                                style={{
                                  margin: "0 0 8px 0",
                                  fontSize: "16px",
                                  fontWeight: "600",
                                  color: "#333",
                                  lineHeight: "1.4",
                                }}
                              >
                                {r.title}
                              </h4>
                              <p
                                className="request-meta"
                                style={{
                                  margin: "0 0 6px 0",
                                  fontSize: "14px",
                                  color: "#666",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <span
                                  style={{
                                    background: "#e8f5e8",
                                    color: "#2e7d32",
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                    fontWeight: "500",
                                  }}
                                >
                                  {r.budget}
                                </span>
                                <span style={{ color: "#888" }}>•</span>
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                  </svg>
                                  {r.location}
                                </span>
                              </p>
                              <p
                                className="request-client"
                                style={{
                                  margin: "0",
                                  fontSize: "13px",
                                  color: "#888",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                                {r.client}
                              </p>
                            </div>
                            <div
                              className="request-actions"
                              style={{
                                display: "flex",
                                gap: "10px",
                                flexDirection: "column",
                                minWidth: "120px",
                              }}
                            >
                              <button
                                className="view-detail-btn"
                                onClick={() => openViewBooking(r.id)}
                                style={{
                                  padding: "10px 16px",
                                  fontSize: "13px",
                                  fontWeight: "500",
                                  background: "white",
                                  color: "#d4a574",
                                  border: "2px solid #d4a574",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "6px",
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = "#d4a574";
                                  e.target.style.color = "white";
                                  e.target.style.transform = "translateY(-1px)";
                                  e.target.style.boxShadow =
                                    "0 4px 12px rgba(212, 165, 116, 0.3)";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = "white";
                                  e.target.style.color = "#d4a574";
                                  e.target.style.transform = "translateY(0)";
                                  e.target.style.boxShadow = "none";
                                }}
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                                View Detail
                              </button>
                              <button
                                className="apply-now-btn"
                                onClick={() => openApplyModal(r.id)}
                                style={{
                                  padding: "10px 16px",
                                  fontSize: "13px",
                                  fontWeight: "500",
                                  background:
                                    "linear-gradient(135deg, #d4a574, #b8945f)",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "6px",
                                  boxShadow:
                                    "0 2px 8px rgba(212, 165, 116, 0.3)",
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background =
                                    "linear-gradient(135deg, #b8945f, #a0854a)";
                                  e.target.style.transform = "translateY(-1px)";
                                  e.target.style.boxShadow =
                                    "0 4px 16px rgba(212, 165, 116, 0.4)";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background =
                                    "linear-gradient(135deg, #d4a574, #b8945f)";
                                  e.target.style.transform = "translateY(0)";
                                  e.target.style.boxShadow =
                                    "0 2px 8px rgba(212, 165, 116, 0.3)";
                                }}
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                  <circle cx="8.5" cy="7" r="4" />
                                  <polyline points="17,11 19,13 23,9" />
                                </svg>
                                Apply Now
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="browse-row">
                      <button
                        className="browse-requests-btn"
                        onClick={() => {
                          try {
                            navigate("/browse-requests");
                          } catch (_) {
                            /* fallback: */ handleTabChange &&
                              handleTabChange("applications");
                          }
                        }}
                      >
                        Browse All Client Requests
                      </button>
                    </div>
                  </div>

                  {/* KPI Stats (moved below Requests Near You) */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "20px",
                      marginBottom: "30px",
                    }}
                  >
                    {/* Bookings Card */}
                    <div
                      style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        textAlign: "center",
                        padding: "20px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        border: "1px solid #f0f0f0",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow =
                          "0 8px 16px rgba(0,0,0,0.15)";
                        e.currentTarget.style.borderColor = "#22c55e";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 8px rgba(0,0,0,0.1)";
                        e.currentTarget.style.borderColor = "#f0f0f0";
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "22px",
                            fontWeight: "700",
                            color: "#333",
                          }}
                        >
                          {kpiStats.bookings.value} Bookings
                        </span>
                        <span
                          style={{
                            fontSize: "20px",
                            color: "#22c55e",
                            fontWeight: "600",
                          }}
                        >
                          ↗
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#22c55e",
                          fontWeight: "500",
                        }}
                      >
                        {kpiStats.bookings.sub}
                      </div>
                    </div>

                    {/* Applications Card */}
                    <div
                      style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "20px",
                        textAlign: "center",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        border: "1px solid #f0f0f0",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow =
                          "0 8px 16px rgba(0,0,0,0.15)";
                        e.currentTarget.style.borderColor = "#298AFF";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 8px rgba(0,0,0,0.1)";
                        e.currentTarget.style.borderColor = "#f0f0f0";
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "22px",
                            fontWeight: "700",
                            color: "#333",
                          }}
                        >
                          {kpiStats.applications.value} Applications
                        </span>
                        <span
                          style={{
                            fontSize: "20px",
                            color: "#298AFF",
                            fontWeight: "600",
                          }}
                        >
                          ↗
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#298AFF",
                          fontWeight: "500",
                        }}
                      >
                        {kpiStats.applications.sub}
                      </div>
                    </div>

                    {/* Conversion Rate Card */}
                    <div
                      style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "20px",
                        textAlign: "center",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        border: "1px solid #f0f0f0",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow =
                          "0 8px 16px rgba(0,0,0,0.15)";
                        e.currentTarget.style.borderColor = "#a855f7";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 8px rgba(0,0,0,0.1)";
                        e.currentTarget.style.borderColor = "#f0f0f0";
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "22px",
                            fontWeight: "700",
                            color: "#333",
                          }}
                        >
                          {kpiStats.conversion.value}
                        </span>
                        <span
                          style={{
                            fontSize: "20px",
                            color: "#ef4444",
                            fontWeight: "600",
                          }}
                        >
                          ↘
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "purple",
                          marginBottom: "4px",
                        }}
                      >
                        Conversion Rate
                      </div>
                    </div>

                    {/* Response Rate Card */}
                    <div
                      style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "20px",
                        textAlign: "center",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        border: "1px solid #f0f0f0",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow =
                          "0 8px 16px rgba(0,0,0,0.15)";
                        e.currentTarget.style.borderColor = "#EABF36";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 8px rgba(0,0,0,0.1)";
                        e.currentTarget.style.borderColor = "#f0f0f0";
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          marginBottom: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "22px",
                            fontWeight: "700",
                            color: "#333",
                          }}
                        >
                          {kpiStats.response.value}
                        </span>
                        <span
                          style={{
                            fontSize: "20px",
                            color: "#22c55e",
                            fontWeight: "600",
                          }}
                        >
                          ↗
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#EABF36",
                          marginBottom: "4px",
                        }}
                      >
                        Response Rate
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "applications" && (
                <div className="applications-page">
                  <h2 className="apps-title">My Applications</h2>
                  <p className="apps-subtitle">
                    Track all the requests you’ve applied to
                  </p>

                  {/* Stats */}
                  <div className="apps-stats-grid">
                    {/* Applied */}
                    <div
                      style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "25px 15px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        border: "1px solid #f0f0f0",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "45px",
                          height: "45px",
                          borderRadius: "10px",
                          backgroundColor: "#fef3c7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FaEnvelope
                          style={{ fontSize: "20px", color: "#f59e0b" }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: "32px",
                          fontWeight: "700",
                          color: "#333",
                        }}
                      >
                        {applicationStats.applied}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#666",
                        }}
                      >
                        Applied
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#f59e0b",
                          fontWeight: "500",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>▲</span>{" "}
                        {applicationStats.total > 0
                          ? `${applicationStats.applied} total`
                          : "No applications"}
                      </div>
                    </div>

                    {/* Accepted */}
                    <div
                      style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "25px 15px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        border: "1px solid #f0f0f0",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "45px",
                          height: "45px",
                          borderRadius: "10px",
                          backgroundColor: "#d1fae5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FaCheckCircle
                          style={{ fontSize: "20px", color: "#10b981" }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: "32px",
                          fontWeight: "700",
                          color: "#333",
                        }}
                      >
                        {applicationStats.accepted}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#666",
                        }}
                      >
                        Accepted
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#10b981",
                          fontWeight: "500",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>▲</span> {applicationStats.acceptanceRate}% rate
                      </div>
                    </div>

                    {/* Declined */}
                    <div
                      style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "25px 15px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        border: "1px solid #f0f0f0",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "45px",
                          height: "45px",
                          borderRadius: "10px",
                          backgroundColor: "#fee2e2",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FaTimes
                          style={{ fontSize: "20px", color: "#ef4444" }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: "32px",
                          fontWeight: "700",
                          color: "#333",
                        }}
                      >
                        {applicationStats.declined}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#666",
                        }}
                      >
                        Declined
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#ef4444",
                          fontWeight: "500",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>▼</span>{" "}
                        {applicationStats.declined > 0
                          ? `${applicationStats.declined} declined`
                          : "No declines"}
                      </div>
                    </div>

                    {/* Withdrawn */}
                    <div
                      style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "25px 15px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        border: "1px solid #f0f0f0",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "45px",
                          height: "45px",
                          borderRadius: "10px",
                          backgroundColor: "#f5f5f5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FaArrowLeft
                          style={{ fontSize: "20px", color: "#999" }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: "32px",
                          fontWeight: "700",
                          color: "#333",
                        }}
                      >
                        {applicationStats.withdrawn}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#666",
                        }}
                      >
                        Withdrawn
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#999",
                          fontWeight: "500",
                        }}
                      >
                        {applicationStats.withdrawn > 0
                          ? `${applicationStats.withdrawn} withdrawn`
                          : "No withdrawals"}
                      </div>
                    </div>

                    {/* Expired */}
                    <div
                      style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "25px 15px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        border: "1px solid #f0f0f0",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "45px",
                          height: "45px",
                          borderRadius: "10px",
                          backgroundColor: "#f5f5f5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FaClock style={{ fontSize: "20px", color: "#999" }} />
                      </div>
                      <div
                        style={{
                          fontSize: "32px",
                          fontWeight: "700",
                          color: "#333",
                        }}
                      >
                        {applicationStats.expired}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#666",
                        }}
                      >
                        Expired
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#f59e0b",
                          fontWeight: "500",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>⏰</span>{" "}
                        {applicationStats.expired > 0
                          ? `${applicationStats.expired} expired`
                          : "No expirations"}
                      </div>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="apps-filters">
                    {[
                      "applied",
                      "accepted",
                      "declined",
                      "withdrawn",
                      "expired",
                      "all",
                    ].map((f) => (
                      <button
                        key={f}
                        className={`apps-pill ${
                          applicationsFilter === f ? "active" : ""
                        }`}
                        onClick={() => {
                          setApplicationsFilter(f);
                          if (f === "applied") {
                            fetchAppliedBookings();
                          } else if (f === "all") {
                            fetchSavedBookings();
                          } else if (
                            [
                              "accepted",
                              "declined",
                              "withdrawn",
                              "expired",
                            ].includes(f)
                          ) {
                            fetchApplicationsByStatus(f);
                          }
                        }}
                      >
                        {f === "all"
                          ? "Saved"
                          : f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* List - show pending bookings as applications */}
                  <div className="apps-list">
                    {appsLoading && (
                      <div className="app-card">
                        <div>Loading pending bookings...</div>
                      </div>
                    )}
                    {appsError && (
                      <div className="app-card">
                        <div style={{ color: "#c33" }}>{appsError}</div>
                      </div>
                    )}
                    {!appsLoading &&
                      !appsError &&
                      applications
                        .filter((a) =>
                          applicationsFilter === "all"
                            ? true
                            : a.status === applicationsFilter
                        )
                        .map((a) => (
                          <div
                            key={a.id}
                            className="app-card"
                            style={{ position: "relative" }}
                          >
                            {applicationsFilter === "all" && (
                              <button
                                onClick={async () => {
                                  try {
                                    if (a.bookingId) {
                                      await bookingsAPI.unsaveBooking(
                                        a.bookingId
                                      );
                                    } else {
                                      await bookingsAPI.unsaveBooking(a.id);
                                    }
                                    // Refetch the saved list to ensure full sync
                                    await fetchSavedBookings();
                                  } catch (e) {
                                    showError(
                                      e?.message || "Failed to unsave booking"
                                    );
                                  }
                                }}
                                title="Unsave"
                                style={{
                                  position: "absolute",
                                  right: 10,
                                  top: 10,
                                  background: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                }}
                              >
                                <FaHeart color="#b45309" />
                              </button>
                            )}
                            <h3 className="app-title">{a.title}</h3>
                            <div className="app-meta">
                              <div>Client: {a.client}</div>
                              <div>Budget: {a.budget}</div>
                              <div>Posted on: {a.appliedOn}</div>
                            </div>
                            {applicationsFilter !== "all" && (
                              <span className={`app-badge ${a.status}`}>
                                {a.status.charAt(0).toUpperCase() +
                                  a.status.slice(1)}
                              </span>
                            )}
                            {/* <p className="app-note">Assigned artists: {a.assignedCount ?? 0}</p> */}
                            <div className="app-actions">
                              <button
                                className="app-btn"
                                onClick={() => openViewBooking(a.id)}
                                disabled={viewLoading}
                              >
                                View Details
                              </button>
                              {applicationsFilter === "all" && a.canApply && (
                                <button
                                  className="app-btn apply-now"
                                  style={{ marginLeft: "8px" }}
                                  onClick={() => openApplyModal(a.id)}
                                >
                                  Apply Now
                                </button>
                              )}
                              {applicationsFilter === "applied" && (
                                <button
                                  className="app-btn app-btn-danger"
                                  style={{ marginLeft: "8px" }}
                                  onClick={() =>
                                    handleWithdrawApplication(a.id)
                                  }
                                >
                                  Withdraw
                                </button>
                              )}
                              {applicationsFilter === "accepted" &&
                                (() => {
                                  // Check if event is within 14 days
                                  const eventDate = new Date(a.eventDate);
                                  const today = new Date();
                                  const daysDiff = Math.ceil(
                                    (eventDate - today) / (1000 * 60 * 60 * 24)
                                  );
                                  const isWithin14Days =
                                    daysDiff <= 14 && daysDiff >= 0;
                                  const tooltipMsg =
                                    "You can't cancel within 14 days of the event";

                                  return (
                                    <div
                                      style={{
                                        position: "relative",
                                        display: "inline-block",
                                      }}
                                    >
                                      <button
                                        className="app-btn app-btn-danger"
                                        style={{
                                          marginLeft: "8px",
                                          cursor: isWithin14Days
                                            ? "not-allowed"
                                            : "pointer",
                                          opacity: isWithin14Days ? 0.5 : 1,
                                        }}
                                        onClick={() => {
                                          if (isWithin14Days) {
                                            showError(tooltipMsg);
                                            return;
                                          }
                                          openCancelAccepted(a.id);
                                        }}
                                        disabled={isWithin14Days}
                                        title={isWithin14Days ? tooltipMsg : ""}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  );
                                })()}
                              {applicationsFilter === "accepted" &&
                                (() => {
                                  // Check if current date is greater than or equal to event date
                                  const eventDate = new Date(a.eventDate);
                                  const today = new Date();

                                  // Set both dates to midnight for accurate comparison
                                  eventDate.setHours(0, 0, 0, 0);
                                  today.setHours(0, 0, 0, 0);

                                  const canMarkComplete =
                                    today.getTime() >= eventDate.getTime();
                                  const tooltipMsg =
                                    "You can only mark as complete on or after the event date";

                                  return (
                                    <button
                                      className="app-btn"
                                      style={{
                                        background: canMarkComplete
                                          ? "#e24d0c"
                                          : "#d1d5db",
                                        color: "#fff",
                                        borderColor: canMarkComplete
                                          ? "#e24d0c"
                                          : "#d1d5db",
                                        cursor: canMarkComplete
                                          ? "pointer"
                                          : "not-allowed",
                                        opacity: canMarkComplete ? 1 : 0.6,
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
                                      title={
                                        !canMarkComplete
                                          ? tooltipMsg
                                          : "Mark as complete"
                                      }
                                    >
                                      Mark Complete
                                    </button>
                                  );
                                })()}
                            </div>
                          </div>
                        ))}
                    {!appsLoading &&
                      !appsError &&
                      applications.length === 0 && (
                        <div className="app-card">
                          <div>No pending bookings right now.</div>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Cancel Accepted Application Modal */}
              <CancelAcceptedModal
                isOpen={cancelAcceptedOpen}
                onClose={() => {
                  setCancelAcceptedOpen(false);
                  setCancelTarget(null);
                }}
                onConfirm={handleConfirmCancelAccepted}
              />

              <MarkCompleteProofModal
                isOpen={markProofOpen}
                onClose={() => {
                  setMarkProofOpen(false);
                  setMarkTargetBookingId(null);
                }}
                onSubmit={(result) => {
                  console.log("MarkComplete proof uploaded:", {
                    bookingId: markTargetBookingId,
                    ...result,
                  });
                  showSuccess("Booking marked as completed successfully!");
                  setMarkProofOpen(false);
                  setMarkTargetBookingId(null);
                  // Refetch applications in Applications tab
                  if (applicationsFilter === "accepted") {
                    fetchApplicationsByStatus("accepted");
                  }
                  // Refetch calendar data
                  fetchAcceptedCalendar();
                }}
                bookingId={markTargetBookingId}
                cloudinary={{
                  cloudName: "dstelsc7m",
                  uploadPreset: "mehndi",
                  folder: "mehndi/proofs",
                }}
              />

              {/* Portfolio Preview Modal */}
              {previewOpen && previewPortfolio && (
                <div
                  className="modal-overlay"
                  onClick={() => {
                    setPreviewOpen(false);
                    setPreviewPortfolio(null);
                  }}
                >
                  <div
                    className="application-modal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="modal-header">
                      <h3 className="modal-title">Portfolio Preview</h3>
                      <button
                        className="modal-close"
                        onClick={() => {
                          setPreviewOpen(false);
                          setPreviewPortfolio(null);
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <div className="modal-body">
                      <div className="modal-grid">
                        <div className="form-group full">
                          <strong>
                            {previewPortfolio.displayName || "Untitled"}
                          </strong>
                          <div>{previewPortfolio.tagline || ""}</div>
                        </div>
                        <div className="form-group full">
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fill,minmax(160px,1fr))",
                              gap: "8px",
                            }}
                          >
                            {(previewPortfolio.mediaUrls || []).map(
                              (u, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    background: "#f5f5f5",
                                    borderRadius: 8,
                                    overflow: "hidden",
                                  }}
                                >
                                  <img
                                    alt="media"
                                    src={u}
                                    style={{
                                      width: "100%",
                                      height: 120,
                                      objectFit: "cover",
                                    }}
                                  />
                                </div>
                              )
                            )}
                          </div>
                        </div>
                        <div className="form-group full">
                          <div>
                            <strong>Bio</strong>
                          </div>
                          <div>{previewPortfolio.bio}</div>
                        </div>
                        <div
                          className="form-group full"
                          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                        >
                          {(previewPortfolio.styles || []).map((s) => (
                            <span key={s} className="apps-pill">
                              {s}
                            </span>
                          ))}
                          {(previewPortfolio.categories || []).map((c) => (
                            <span key={c} className="apps-pill secondary">
                              {c}
                            </span>
                          ))}
                        </div>
                        <div
                          className="form-group full"
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(160px, 1fr))",
                            gap: 8,
                          }}
                        >
                          <div>
                            Hourly: £{previewPortfolio.hourlyRate ?? "-"}
                          </div>
                          <div>
                            Per Hand: £{previewPortfolio.perHandRate ?? "-"}
                          </div>
                          <div>
                            Bridal: £
                            {previewPortfolio.bridalPackagePrice ?? "-"}
                          </div>
                          <div>
                            Party: £{previewPortfolio.partyPackagePrice ?? "-"}
                          </div>
                          <div>
                            Outcall: £{previewPortfolio.outcallFee ?? "-"}
                          </div>
                          <div>
                            Travels:{" "}
                            {previewPortfolio.travelsToClient ? "Yes" : "No"}
                          </div>
                          <div>
                            Published:{" "}
                            {previewPortfolio.isPublished ? "Yes" : "No"}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        className="cancel-btn"
                        onClick={() => {
                          setPreviewOpen(false);
                          setPreviewPortfolio(null);
                        }}
                        style={{ transition: "background-color 0.2s ease" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#efefef";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "";
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Portfolio Delete Confirm Modal */}
              {deleteConfirmOpen && (
                <div
                  className="modal-overlay"
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setDeleteTargetId(null);
                  }}
                >
                  <div
                    className="confirmation-modal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="modal-title">Delete Portfolio</h3>
                    <p className="modal-text">
                      Are you sure you want to delete this portfolio?
                    </p>
                    <div className="modal-actions">
                      <button
                        className="cancel-btn"
                        onClick={() => {
                          setDeleteConfirmOpen(false);
                          setDeleteTargetId(null);
                        }}
                        style={{ transition: "background-color 0.2s ease" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#efefef";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "";
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="confirm-btn decline"
                        onClick={async () => {
                          try {
                            await portfoliosAPI.remove(deleteTargetId);
                            setDeleteConfirmOpen(false);
                            setDeleteTargetId(null);
                            showSuccess("Portfolio deleted");
                            fetchMyPortfolios();
                          } catch (e) {
                            showError(
                              e.message || "Failed to delete portfolio"
                            );
                          }
                        }}
                        style={{ transition: "background-color 0.2s ease" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#b91c1c";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "";
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Artist View Messages */}
              {activeTab === "messages" && (
                <div className="messages-section">
                  <div className="messages-container">
                    {/* Conversations List */}
                    <div className="conversations-sidebar">
                      <div className="conversations-header">
                        <h3 className="conversations-title">Client Messages</h3>
                        <div className="conversations-count">
                          {artistConversations.reduce(
                            (total, conv) => total + conv.unreadCount,
                            0
                          )}{" "}
                          unread
                        </div>
                      </div>

                      <div className="conversations-list">
                        {artistConversations.map((conversation) => (
                          <div
                            key={conversation.id}
                            className={`conversation-item ${
                              selectedConversation?.id === conversation.id
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              handleSelectConversation(conversation)
                            }
                          >
                            <div className="conversation-avatar">
                              <img
                                src={
                                  conversation.client?.userProfileImage ||
                                  conversation.clientImage ||
                                  DEFAULT_AVATAR
                                }
                                alt={conversation.clientName || "User"}
                              />
                              {(() => {
                                const otherId =
                                  conversation.client?._id ||
                                  conversation.clientId ||
                                  conversation.id;
                                const online = otherId
                                  ? onlineUserIds.has(String(otherId))
                                  : false;
                                return (
                                  <div
                                    className={`status-indicator ${
                                      online ? "online" : "offline"
                                    }`}
                                  ></div>
                                );
                              })()}
                            </div>

                            <div className="conversation-info">
                              <div className="conversation-header">
                                <h4 className="client-name">
                                  {conversation.clientName ||
                                    (conversation.client
                                      ? `${conversation.client.firstName} ${conversation.client.lastName}`
                                      : "User")}
                                </h4>
                                <span className="message-time">
                                  {conversation.lastMessageTime}
                                </span>
                              </div>
                              <div className="conversation-preview">
                                <p className="last-message">
                                  {conversation.lastMessage}
                                </p>
                                {conversation.unreadCount > 0 && (
                                  <span className="unread-badge">
                                    {conversation.unreadCount}
                                  </span>
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
                          {/* Chat Header - replaced with selected booking section when coming from request */}
                          <div className="chat-header">
                            {headerBooking ? (
                              <div
                                style={{
                                  width: "100%",
                                  background: "#FFF7E6",
                                  border: "1px solid #f5e0b8",
                                  borderRadius: 12,
                                  padding: 12,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 10,
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 10,
                                    }}
                                  >
                                    {(() => {
                                      const label =
                                        (Array.isArray(headerBooking.eventType)
                                          ? headerBooking.eventType[0]
                                          : headerBooking.eventType) || "M";
                                      const initial = String(label || "M")
                                        .trim()
                                        .charAt(0)
                                        .toUpperCase();
                                      return (
                                        <div
                                          style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: "50%",
                                            background: "#F5D9A6",
                                            color: "#8B5E34",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: 700,
                                          }}
                                        >
                                          {initial}
                                        </div>
                                      );
                                    })()}
                                    <div>
                                      <div
                                        style={{
                                          fontWeight: 700,
                                          color: "#1f2937",
                                        }}
                                      >
                                        {(Array.isArray(headerBooking.eventType)
                                          ? headerBooking.eventType[0]
                                          : headerBooking.eventType) ||
                                          "Mehndi"}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: 12,
                                          color: "#6b7280",
                                        }}
                                      >
                                        {headerBooking.eventDate
                                          ? new Date(
                                              headerBooking.eventDate
                                            ).toLocaleString("en-GB", {
                                              day: "2-digit",
                                              month: "short",
                                            })
                                          : "TBD"}{" "}
                                        ·{" "}
                                        {headerBooking.preferredTimeSlot || "-"}{" "}
                                        ·{" "}
                                        {headerBooking.city ||
                                          headerBooking.location ||
                                          "-"}
                                      </div>
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 12,
                                    }}
                                  >
                                    <button
                                      onClick={toggleHeaderSave}
                                      disabled={headerSaving}
                                      style={{
                                        border: "none",
                                        background: "transparent",
                                        color: "#374151",
                                        cursor: headerSaving
                                          ? "not-allowed"
                                          : "pointer",
                                        fontWeight: 600,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                      }}
                                    >
                                      {headerSaved ? (
                                        <FaBookmark />
                                      ) : (
                                        <FaRegBookmark />
                                      )}
                                      <span>
                                        {headerSaved ? "Saved" : "Save"}
                                      </span>
                                    </button>
                                    <button
                                      onClick={() =>
                                        setHeaderExpanded((v) => !v)
                                      }
                                      style={{
                                        border: "none",
                                        background: "transparent",
                                        color: "#b45309",
                                        cursor: "pointer",
                                        fontWeight: 700,
                                      }}
                                    >
                                      {headerExpanded ? "Hide" : "View"}
                                    </button>
                                  </div>
                                </div>
                                {headerExpanded && (
                                  <>
                                    <div
                                      style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: 6,
                                        marginTop: 10,
                                        color: "#4A2C1D",
                                      }}
                                    >
                                      <div>
                                        <strong>Event:</strong>{" "}
                                        {(Array.isArray(headerBooking.eventType)
                                          ? headerBooking.eventType[0]
                                          : headerBooking.eventType) ||
                                          "Mehndi"}
                                        {headerBooking.city ||
                                        headerBooking.location
                                          ? ` at ${
                                              headerBooking.city ||
                                              headerBooking.location
                                            }`
                                          : ""}
                                      </div>
                                      <div>
                                        <strong>Date:</strong>{" "}
                                        {headerBooking.eventDate
                                          ? new Date(
                                              headerBooking.eventDate
                                            ).toLocaleString("en-GB", {
                                              day: "numeric",
                                              month: "long",
                                              year: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })
                                          : "TBD"}
                                      </div>
                                      <div>
                                        <strong>Location:</strong>{" "}
                                        {headerBooking.location ||
                                          headerBooking.city ||
                                          "-"}
                                      </div>
                                      <div>
                                        <strong>Group Size:</strong>{" "}
                                        {headerBooking.numberOfPeople ?? "-"}
                                      </div>
                                      <div>
                                        <strong>Budget:</strong> £
                                        {headerBooking.minimumBudget ?? "-"}–£
                                        {headerBooking.maximumBudget ?? "-"}
                                      </div>
                                    </div>
                                    <div
                                      style={{
                                        textAlign: "right",
                                        marginTop: 10,
                                      }}
                                    >
                                      <button
                                        onClick={() => setViewHeaderOpen(true)}
                                        style={{
                                          background: "#5C3D2E",
                                          color: "#fff",
                                          border: "none",
                                          padding: "8px 12px",
                                          borderRadius: 10,
                                          fontWeight: 700,
                                          cursor: "pointer",
                                        }}
                                      >
                                        View Full Request Form
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="chat-client-info">
                                <img
                                  src={
                                    selectedConversation.client
                                      ?.userProfileImage ||
                                    selectedConversation.clientImage ||
                                    DEFAULT_AVATAR
                                  }
                                  alt={
                                    selectedConversation.clientName ||
                                    (selectedConversation.client
                                      ? `${selectedConversation.client.firstName} ${selectedConversation.client.lastName}`
                                      : "User")
                                  }
                                />
                                <div>
                                  <h3>
                                    {selectedConversation.clientName ||
                                      (selectedConversation.client
                                        ? `${selectedConversation.client.firstName} ${selectedConversation.client.lastName}`
                                        : "User")}
                                  </h3>
                                  {(() => {
                                    const otherId =
                                      selectedConversation.client?._id ||
                                      selectedConversation.clientId ||
                                      selectedConversation.id;
                                    const online = otherId
                                      ? onlineUserIds.has(String(otherId))
                                      : false;
                                    return (
                                      <span
                                        className={`status-text ${
                                          online ? "online" : "offline"
                                        }`}
                                      >
                                        {online ? "Online" : "Offline"}
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Messages List */}
                          <div className="messages-list">
                            {chatMessages
                              .filter(
                                (message) =>
                                  !(
                                    (!message.text ||
                                      !String(message.text).trim()) &&
                                    Array.isArray(message.attachments) &&
                                    message.attachments.length === 1 &&
                                    message.attachments[0]?.type === "booking"
                                  )
                              )
                              .map((message, idx) => (
                                <div
                                  key={message.id || idx}
                                  className={`message ${
                                    String(message.sender) ===
                                      String(user?._id) ||
                                    message.senderId === "artist"
                                      ? "sent"
                                      : "received"
                                  }`}
                                >
                                  <div className="message-content">
                                    {message.text && <p>{message.text}</p>}
                                    {message.attachments &&
                                      message.attachments.length > 0 && (
                                        <div className="message-attachments">
                                          {console.log(
                                            "DEBUG: All attachments:",
                                            message.attachments
                                          )}
                                          {/* Images */}
                                          {message.attachments
                                            .filter(
                                              (att) => att.type === "image"
                                            )
                                            .map((attachment, attIdx) => {
                                              console.log(
                                                "DEBUG: Image attachment:",
                                                attachment
                                              );
                                              return (
                                                <div
                                                  key={`img-${attIdx}`}
                                                  className="attachment-display image-attachment"
                                                >
                                                  <img
                                                    src={attachment.url}
                                                    alt={attachment.filename}
                                                    className="attachment-image"
                                                    onClick={() =>
                                                      window.open(
                                                        attachment.url,
                                                        "_blank"
                                                      )
                                                    }
                                                  />
                                                  <button
                                                    className="download-btn"
                                                    onClick={() =>
                                                      downloadFile(
                                                        attachment.url,
                                                        attachment.filename
                                                      )
                                                    }
                                                    title="Download image"
                                                  >
                                                    <svg
                                                      width="16"
                                                      height="16"
                                                      viewBox="0 0 24 24"
                                                      fill="none"
                                                      xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                      <path
                                                        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        fill="none"
                                                      />
                                                      <polyline
                                                        points="7,10 12,15 17,10"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        fill="none"
                                                      />
                                                      <line
                                                        x1="12"
                                                        y1="15"
                                                        x2="12"
                                                        y2="3"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                      />
                                                    </svg>
                                                  </button>
                                                </div>
                                              );
                                            })}

                                          {/* Videos */}
                                          {message.attachments
                                            .filter(
                                              (att) => att.type === "video"
                                            )
                                            .map((attachment, attIdx) => (
                                              <div
                                                key={`vid-${attIdx}`}
                                                className="attachment-display video-attachment"
                                              >
                                                <a
                                                  href={attachment.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="attachment-link"
                                                >
                                                  <video
                                                    src={attachment.url}
                                                    controls
                                                    className="attachment-video"
                                                  />
                                                </a>
                                              </div>
                                            ))}

                                          {/* Documents */}
                                          {message.attachments
                                            .filter(
                                              (att) => att.type === "document"
                                            )
                                            .map((attachment, attIdx) => {
                                              console.log(
                                                "DEBUG: Document attachment:",
                                                attachment
                                              );
                                              return (
                                                <div
                                                  key={`doc-${attIdx}`}
                                                  className="attachment-display document-attachment"
                                                >
                                                  <div className="document-content">
                                                    <div className="document-icon">
                                                      <svg
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                      >
                                                        <path
                                                          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                                          stroke="currentColor"
                                                          strokeWidth="2"
                                                          fill="none"
                                                        />
                                                        <polyline
                                                          points="14,2 14,8 20,8"
                                                          stroke="currentColor"
                                                          strokeWidth="2"
                                                          fill="none"
                                                        />
                                                        <line
                                                          x1="16"
                                                          y1="13"
                                                          x2="8"
                                                          y2="13"
                                                          stroke="currentColor"
                                                          strokeWidth="2"
                                                        />
                                                        <line
                                                          x1="16"
                                                          y1="17"
                                                          x2="8"
                                                          y2="17"
                                                          stroke="currentColor"
                                                          strokeWidth="2"
                                                        />
                                                        <polyline
                                                          points="10,9 9,9 8,9"
                                                          stroke="currentColor"
                                                          strokeWidth="2"
                                                        />
                                                      </svg>
                                                    </div>
                                                    <div className="document-details">
                                                      <span className="document-name">
                                                        {attachment.filename}
                                                      </span>
                                                      <span className="document-type">
                                                        PDF Document
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <button
                                                    className="download-btn"
                                                    onClick={() =>
                                                      downloadFile(
                                                        attachment.url,
                                                        attachment.filename
                                                      )
                                                    }
                                                    title="Download document"
                                                  >
                                                    <svg
                                                      width="16"
                                                      height="16"
                                                      viewBox="0 0 24 24"
                                                      fill="none"
                                                      xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                      <path
                                                        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        fill="none"
                                                      />
                                                      <polyline
                                                        points="7,10 12,15 17,10"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        fill="none"
                                                      />
                                                      <line
                                                        x1="12"
                                                        y1="15"
                                                        x2="12"
                                                        y2="3"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                      />
                                                    </svg>
                                                  </button>
                                                </div>
                                              );
                                            })}
                                        </div>
                                      )}
                                  </div>
                                  <div className="message-meta">
                                    <span className="message-time">
                                      {new Date(
                                        message.createdAt || Date.now()
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            <div ref={messagesEndRef} />
                          </div>

                          {/* Message Input */}
                          <div className="message-input-area">
                            {/* Attachments Preview */}
                            {attachments.length > 0 && (
                              <div className="attachments-preview">
                                {attachments.map((file, index) => (
                                  <div key={index} className="attachment-item">
                                    <div className="attachment-info">
                                      <span className="attachment-name">
                                        {file.name}
                                      </span>
                                      <span className="attachment-size">
                                        {(file.size / 1024 / 1024).toFixed(1)}MB
                                      </span>
                                    </div>
                                    <button
                                      className="remove-attachment"
                                      onClick={() => removeAttachment(index)}
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="message-input-container">
                              <input
                                type="file"
                                id="file-input"
                                multiple
                                accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                                onChange={handleFileSelect}
                                style={{ display: "none" }}
                              />
                              <label
                                htmlFor="file-input"
                                className="attachment-btn"
                              >
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M21.44 11.05L12.25 20.24a6 6 0 1 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.42 17.41a2 2 0 1 1-2.83-2.83l8.49-8.49"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    fill="none"
                                  />
                                </svg>
                              </label>

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
                                disabled={
                                  (!newMessage.trim() &&
                                    attachments.length === 0) ||
                                  isUploading
                                }
                              >
                                {isUploading ? (
                                  <div className="loading-spinner"></div>
                                ) : (
                                  <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <line
                                      x1="22"
                                      y1="2"
                                      x2="11"
                                      y2="13"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    />
                                    <polygon
                                      points="22,2 15,22 11,13 2,9 22,2"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      fill="currentColor"
                                    />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="no-conversation-selected">
                          <div className="no-chat-icon">
                            <svg
                              width="80"
                              height="80"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                              />
                            </svg>
                          </div>
                          <h3>Select a conversation</h3>
                          <p>
                            Choose a client conversation to start messaging.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal to show full request details from messages header */}
              <BrowseViewBookingModal
                open={viewHeaderOpen}
                viewForm={
                  headerBooking
                    ? {
                        firstName: "",
                        lastName: "",
                        email: headerBooking.email || "",
                        eventType: Array.isArray(headerBooking.eventType)
                          ? headerBooking.eventType[0]
                          : headerBooking.eventType || "",
                        otherEventType: headerBooking.otherEventType || "",
                        eventDate: headerBooking.eventDate
                          ? new Date(headerBooking.eventDate)
                              .toISOString()
                              .substring(0, 10)
                          : "",
                        preferredTimeSlot: Array.isArray(
                          headerBooking.preferredTimeSlot
                        )
                          ? headerBooking.preferredTimeSlot[0]
                          : headerBooking.preferredTimeSlot || "",
                        location: headerBooking.location || "",
                        artistTravelsToClient:
                          headerBooking.artistTravelsToClient === "both" ||
                          headerBooking.artistTravelsToClient === "Both"
                            ? "both"
                            : headerBooking.artistTravelsToClient === true ||
                              headerBooking.artistTravelsToClient === "yes"
                            ? "yes"
                            : "no",
                        venueName: headerBooking.venueName || "",
                        minimumBudget: headerBooking.minimumBudget ?? "",
                        maximumBudget: headerBooking.maximumBudget ?? "",
                        duration: headerBooking.duration ?? 3,
                        numberOfPeople: headerBooking.numberOfPeople ?? "",
                        designInspiration: Array.isArray(
                          headerBooking.designInspiration
                        )
                          ? headerBooking.designInspiration
                          : headerBooking.designInspiration
                          ? [headerBooking.designInspiration]
                          : [],
                        coveragePreference:
                          headerBooking.coveragePreference || "",
                        additionalRequests:
                          headerBooking.additionalRequests || "",
                      }
                    : null
                }
                onClose={() => setViewHeaderOpen(false)}
                onApply={() => {
                  if (!headerApplied) {
                    setViewHeaderOpen(false);
                    setApplyHeaderOpen(true);
                  }
                }}
                applied={headerApplied}
              />

              <BrowseApplyModal
                open={applyHeaderOpen}
                busy={applyBusyHeader}
                booking={headerBooking}
                onClose={() => setApplyHeaderOpen(false)}
                onConfirm={async ({
                  proposedBudget,
                  duration,
                  message,
                  agreed,
                  setSuccess,
                }) => {
                  if (!headerBooking?._id) return;
                  try {
                    setApplyBusyHeader(true);
                    const artistDetails = {
                      proposedBudget: parseFloat(proposedBudget),
                      estimatedDuration: {
                        value: parseFloat(duration),
                        unit: "hours",
                      },
                      availability: {
                        isAvailableOnDate: true,
                        canTravelToLocation: true,
                        travelDistance: "",
                      },
                      experience: {
                        relevantExperience: "",
                        yearsOfExperience: "",
                        portfolioHighlights: "",
                      },
                      proposal: {
                        message: message || "",
                        whyInterested: "",
                        additionalNotes: "",
                      },
                      terms: { agreedToTerms: !!agreed },
                    };
                    await applicationsAPI.applyToBooking(
                      headerBooking._id,
                      artistDetails
                    );
                    setSuccess(true);
                  } catch (e) {
                    setSuccess(false);
                    setApplyHeaderOpen(false);
                    showError(e.message || "Failed to apply");
                  } finally {
                    setApplyBusyHeader(false);
                  }
                }}
              />

              {/* Schedule (placeholder) */}
              {activeTab === "schedule" && (
                <div className="schedule-section">
                  <div className="section-header">
                    <h2>Schedule</h2>
                  </div>

                  <div className="calendar-card">
                    <div className="calendar-header">
                      <span className="cal-icon">
                        <FaCalendarAlt />
                      </span>
                      <h3>Calendar</h3>
                    </div>
                    <div className="calendar-body">
                      <div
                        className="calendar-control"
                        style={{ margin: "0 auto" }}
                      >
                        <button
                          className="cal-nav"
                          onClick={() =>
                            setCalendarMonth(
                              new Date(
                                calendarMonth.getFullYear(),
                                calendarMonth.getMonth() - 1,
                                1
                              )
                            )
                          }
                        >
                          «
                        </button>
                        <div className="cal-month">
                          {calendarMonth.toLocaleString("en-GB", {
                            month: "long",
                            year: "numeric",
                          })}
                        </div>
                        <button
                          className="cal-nav"
                          onClick={() =>
                            setCalendarMonth(
                              new Date(
                                calendarMonth.getFullYear(),
                                calendarMonth.getMonth() + 1,
                                1
                              )
                            )
                          }
                        >
                          »
                        </button>
                      </div>
                      <div className="cal-grid">
                        {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
                          (d) => (
                            <div key={d} className="cal-dow">
                              {d}
                            </div>
                          )
                        )}
                        {Array.from({ length: 42 }).map((_, idx) => {
                          const date = getCellDate(idx);
                          const isCurrentMonth =
                            date.getMonth() === calendarMonth.getMonth();
                          const dateBookings = acceptedByDate[toKey(date)];
                          const dotType =
                            dateBookings && dateBookings.length > 0
                              ? dateBookings[0].tag || "casual"
                              : null;
                          return (
                            <button
                              key={idx}
                              className={`cal-cell ${
                                isCurrentMonth ? "" : "muted"
                              } ${
                                isSameDay(date, selectedDate) ? "selected" : ""
                              }`}
                              onClick={() => setSelectedDate(date)}
                            >
                              <span>{date.getDate()}</span>
                              {dotType && (
                                <span className={`cal-dot ${dotType}`} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div
                      className="cal-legend"
                      style={{ display: "flex", justifyContent: "center" }}
                    >
                      <span className="legend-item">
                        <span className="legend-dot bridal"></span>Bridal
                      </span>
                      <span className="legend-item">
                        <span className="legend-dot festival"></span>Festival
                      </span>
                      <span className="legend-item">
                        <span className="legend-dot party"></span>Party
                      </span>
                      <span className="legend-item">
                        <span className="legend-dot casual"></span>Casual
                      </span>
                    </div>
                  </div>

                  <div className="bookings-by-date">
                    <h3 className="section-title">
                      Bookings on{" "}
                      {selectedDate.toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </h3>
                    {!(acceptedByDate[toKey(selectedDate)] || []).length && (
                      <div className="empty-banner">
                        No bookings on this date.
                      </div>
                    )}
                    {(acceptedByDate[toKey(selectedDate)] || []).map((b) => {
                      // Calculate date differences for button logic
                      const today = new Date();
                      const eventDate = b.date ? new Date(b.date) : null;
                      const daysUntilEvent = eventDate
                        ? Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24))
                        : null;

                      // Cancel button: disabled if event is within 14 days or less
                      const canCancel = eventDate && daysUntilEvent > 14;

                      // Mark Complete button: enabled only on or after event date
                      const canMarkComplete = eventDate && daysUntilEvent <= 0;

                      return (
                        <div key={b.id} className="booking-line-card">
                          <div className="b-info">
                            <div className="b-title">{b.title}</div>
                            <div className="b-row">Client: {b.client}</div>
                            <div className="b-row">Time: {b.time}</div>
                            <div className="b-row">Location: {b.location}</div>
                            <span className="b-badge">{b.status}</span>
                          </div>
                          <div className="b-actions">
                            <button
                              className="app-btn danger"
                              style={{
                                background: canCancel ? "#ef4444" : "#ccc",
                                borderColor: canCancel ? "#ef4444" : "#ccc",
                                cursor: canCancel ? "pointer" : "not-allowed",
                                opacity: canCancel ? 1 : 0.6,
                              }}
                              onClick={() =>
                                canCancel && openCancelAccepted(b.id)
                              }
                              disabled={!canCancel}
                              title={
                                !canCancel
                                  ? "Cannot cancel within 14 days of event"
                                  : "Cancel booking"
                              }
                            >
                              Cancel
                            </button>
                            <button
                              className="app-btn"
                              style={{
                                background: canMarkComplete
                                  ? "#e24d0c"
                                  : "#ccc",
                                color: "#fff",
                                borderColor: canMarkComplete
                                  ? "#e24d0c"
                                  : "#ccc",
                                cursor: canMarkComplete
                                  ? "pointer"
                                  : "not-allowed",
                                opacity: canMarkComplete ? 1 : 0.6,
                              }}
                              onClick={() =>
                                canMarkComplete &&
                                (() => {
                                  setMarkTargetBookingId(b.id);
                                  setMarkProofOpen(true);
                                })()
                              }
                              disabled={!canMarkComplete}
                              title={
                                !canMarkComplete
                                  ? "Can only mark complete on or after event date"
                                  : "Mark booking as complete"
                              }
                            >
                              Mark Complete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Earnings (placeholder) */}
              {activeTab === "earnings" && (
                <div className="earnings-section">
                  <h3
                    className="section-title"
                    style={{ marginBottom: "10px" }}
                  >
                    Earnings
                  </h3>
                  <div className="earnings-grid-container">
                    {/* Lifetime Earnings Card */}
                    <div
                      style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "30px 20px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        border: "1px solid #f0f0f0",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "10px",
                          backgroundColor: "#fff5e6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FaWallet
                          style={{ fontSize: "24px", color: "#ff8c42" }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#666",
                          fontWeight: "500",
                        }}
                      >
                        Lifetime Earnings
                      </div>
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: "700",
                          color: "#333",
                        }}
                      >
                        {earningsLoading
                          ? "..."
                          : `£${earningsData.lifetimeEarnings.toFixed(2)}`}
                      </div>
                    </div>

                    {/* This Month Card */}
                    <div
                      style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "30px 20px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        border: "1px solid #f0f0f0",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "10px",
                          backgroundColor: "#fff5e6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FaCalendarCheck
                          style={{ fontSize: "24px", color: "#ff8c42" }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#666",
                          fontWeight: "500",
                        }}
                      >
                        This Month
                      </div>
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: "700",
                          color: "#333",
                        }}
                      >
                        {earningsLoading
                          ? "..."
                          : `£${earningsData.thisMonthEarnings.toFixed(2)}`}
                      </div>
                    </div>

                    {/* Remaining Balance Card */}
                    <div
                      style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "30px 20px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        border: "1px solid #f0f0f0",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "10px",
                          backgroundColor: "#fff5e6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FaWallet
                          style={{ fontSize: "24px", color: "#ff8c42" }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#666",
                          fontWeight: "500",
                        }}
                      >
                        Remaining Balance
                      </div>
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: "700",
                          color: "#333",
                        }}
                      >
                        {walletLoading
                          ? "..."
                          : `£${walletSummary.remainingBalance.toFixed(2)}`}
                      </div>
                      <button
                        className="modern-withdraw-btn"
                        onClick={openWithdraw}
                        disabled={
                          walletLoading || walletSummary.remainingBalance <= 0
                        }
                        style={{
                          marginTop: "8px",
                          padding: "8px 16px",
                          fontSize: "12px",
                          minHeight: "auto",
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        Withdraw Funds
                      </button>
                    </div>
                  </div>

                  {/* <div className="payout-methods">
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
                  </div> */}

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

                  {/* Transaction History */}
                  <div className="transaction-history">
                    <h3 className="section-title">Transaction History</h3>

                    {/* Transaction Filters */}
                    <div className="transaction-filters">
                      <div className="category-filters">
                        <button
                          className={`category-filter-btn ${
                            transactionCategoryFilter === "all" ? "active" : ""
                          }`}
                          onClick={() => handleTransactionCategoryFilter("all")}
                        >
                          <div className="filter-indicator"></div>
                          All
                        </button>
                        <button
                          className={`category-filter-btn ${
                            transactionCategoryFilter === "bridal"
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            handleTransactionCategoryFilter("bridal")
                          }
                        >
                          <div className="filter-indicator"></div>
                          Bridal
                        </button>
                        <button
                          className={`category-filter-btn ${
                            transactionCategoryFilter === "festive"
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            handleTransactionCategoryFilter("festive")
                          }
                        >
                          {/* <div className="filter-indicator"></div> */}
                          <span style={{ fontSize: "20px" }}>+</span>
                          Festive
                        </button>
                        <button
                          className={`category-filter-btn ${
                            transactionCategoryFilter === "party"
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            handleTransactionCategoryFilter("party")
                          }
                        >
                          {/* <div className="filter-indicator"></div> */}
                          <span style={{ fontSize: "20px" }}>△</span>
                          Party
                        </button>
                        <button
                          className={`category-filter-btn ${
                            transactionCategoryFilter === "casual"
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            handleTransactionCategoryFilter("casual")
                          }
                        >
                          {/* <div className="filter-indicator"></div> */}
                          <span style={{ fontSize: "20px" }}>+</span>
                          Casual
                        </button>
                      </div>
                    </div>
                    <div className="status-filter">
                      <select
                        value={transactionStatusFilter}
                        onChange={(e) =>
                          handleTransactionStatusFilter(e.target.value)
                        }
                        className="status-dropdown"
                      >
                        <option value="all">All</option>
                        <option value="half">Deposit Received</option>
                        <option value="full">Payment Complete</option>
                        <option value="refund">Refunded</option>
                        <option value="admin-fee">Admin Fee</option>
                      </select>
                    </div>

                    {walletLoading ? (
                      <div
                        className="loading-state"
                        style={{ padding: "2rem", textAlign: "center" }}
                      >
                        <p>Loading transaction history...</p>
                      </div>
                    ) : walletTransactions.length === 0 ? (
                      <div className="empty-state">
                        <FaMoneyBillWave size={"30px"} />
                        <h3>No Transactions Yet</h3>
                        <p>
                          Your transaction history will appear here once you
                          receive payments.
                        </p>
                      </div>
                    ) : (
                      <div className="transaction-table-wrapper">
                        <div className="transaction-table">
                          <div className="table-header">
                            <span
                              className="col-date"
                              style={{ color: "white" }}
                            >
                              Date
                            </span>
                            <span
                              className="col-category"
                              style={{ color: "white" }}
                            >
                              Category
                            </span>
                            <span
                              className="col-client"
                              style={{ color: "white" }}
                            >
                              Client
                            </span>
                            <span
                              className="col-amount"
                              style={{ color: "white" }}
                            >
                              Amount
                            </span>
                            <span
                              className="col-status"
                              style={{ color: "white" }}
                            >
                              Status
                            </span>
                            <span
                              className="col-invoice"
                              style={{ color: "white" }}
                            >
                              Invoice
                            </span>
                          </div>

                          {getFilteredTransactions().map((transaction) => {
                            const formatDate = (dateString) => {
                              const date = new Date(dateString);
                              return date.toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              });
                            };

                            const getStatus = (transaction) => {
                              // Use the pre-formatted status from the controller
                              return {
                                text: transaction.statusText || "Paid",
                                class: transaction.statusClass || "paid",
                              };
                            };

                            const getCategoryFromEventName = (transaction) => {
                              return transaction.category || "Event";
                            };

                            const getClientName = (transaction) => {
                              // For artists, the client would be the other party
                              console.log(transaction.artistInfo);
                              return transaction.artistInfo
                                ? "Client"
                                : "Unknown Client";
                            };

                            const getAmountDisplay = (transaction) => {
                              return (
                                transaction.amountDisplay ||
                                `£${transaction.amount.toFixed(0)}`
                              );
                            };

                            const status = getStatus(transaction);

                            const handleDownloadReceipt = () => {
                              // Create PDF content
                              const pdfContent = `
                              <html>
                                <head>
                                  <title>Receipt - ${
                                    transaction.eventName === "Unknown Event"
                                      ? "Event"
                                      : transaction.eventName
                                  }</title>
                                  <style>
                                    body { font-family: Arial, sans-serif; padding: 20px; }
                                    .header { text-align: center; margin-bottom: 30px; }
                                    .receipt-details { margin: 20px 0; }
                                    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
                                    .total { border-top: 2px solid #333; padding-top: 10px; font-weight: bold; }
                                  </style>
                                </head>
                                <body>
                                  <div class="header">
                                    <h1>Payment Receipt</h1>
                                    <p>Mehndi Booking Platform</p>
                                  </div>
                                  <div class="receipt-details">
                                    <div class="detail-row">
                                      <span>Event:</span>
                                      <span>${
                                        transaction.eventName ===
                                        "Unknown Event"
                                          ? "Event"
                                          : transaction.eventName
                                      }</span>
                                    </div>
                                    <div class="detail-row">
                                      <span>Transaction Type:</span>
                                      <span>${
                                        transaction.transactionType
                                      }</span>
                                    </div>
                                    <div class="detail-row">
                                      <span>Date:</span>
                                      <span>${formatDate(
                                        transaction.createdAt
                                      )}</span>
                                    </div>
                                    <div class="detail-row">
                                      <span>Amount:</span>
                                      <span>£${transaction.amount.toFixed(
                                        2
                                      )}</span>
                                    </div>
                                    <div class="detail-row">
                                      <span>Payment Method:</span>
                                      <span>Stripe</span>
                                    </div>
                                    <div class="detail-row">
                                      <span>Status:</span>
                                      <span>${status.text}</span>
                                    </div>
                                    <div class="detail-row total">
                                      <span>Total Received:</span>
                                      <span>£${transaction.amount.toFixed(
                                        2
                                      )}</span>
                                    </div>
                                  </div>
                                </body>
                              </html>
                            `;

                              // Create blob and download
                              const blob = new Blob([pdfContent], {
                                type: "text/html",
                              });
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = `receipt-${
                                transaction.eventName
                                  ? transaction.eventName.replace(/\s+/g, "-")
                                  : "Event".replace(/\s+/g, "-")
                              }-${formatDate(transaction.createdAt).replace(
                                /\s+/g,
                                "-"
                              )}.html`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(url);
                            };

                            return (
                              <div key={transaction._id} className="table-row">
                                <span className="col-date">
                                  {formatDate(transaction.createdAt)}
                                </span>
                                <span className="col-category">
                                  {getCategoryFromEventName(transaction)}
                                </span>
                                <span className="col-client">
                                  {getClientName(transaction)}
                                </span>
                                <span className="col-amount">
                                  {getAmountDisplay(transaction)}
                                </span>
                                <span className={`col-status ${status.class}`}>
                                  {status.text}
                                </span>
                                <span className="col-invoice">
                                  <button
                                    className="invoice-btn"
                                    onClick={handleDownloadReceipt}
                                    title="View Invoice"
                                  >
                                    <span>View Invoice</span>
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M12 15L7 10H10V3H14V10H17L12 15Z"
                                        fill="currentColor"
                                      />
                                      <path
                                        d="M20 18H4V20H20V18Z"
                                        fill="currentColor"
                                      />
                                    </svg>
                                  </button>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Withdraw Modal - Moved from Wallet */}
                  {withdrawOpen && (
                    <div
                      className="modern-modal-overlay"
                      onClick={(e) => {
                        if (e.target === e.currentTarget) closeWithdraw();
                      }}
                    >
                      <div className="modern-withdraw-modal">
                        <div className="modern-modal-header">
                          <div className="modal-title-section">
                            <div className="withdraw-icon">
                              <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M12 5v14M5 12h14" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="modal-title">Withdraw funds</h3>
                              <div className="modal-subtitle">
                                Available balance:{" "}
                                {formatGBP(walletSummary.remainingBalance)}
                              </div>
                            </div>
                          </div>
                          <button
                            className="modern-close-btn"
                            onClick={closeWithdraw}
                            aria-label="Close"
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                        <div className="modern-modal-body">
                          <div className="balance-display">
                            <div className="balance-info">
                              <div>
                                <div className="balance-label">
                                  Remaining Balance
                                </div>
                                <div className="balance-amount">
                                  {formatGBP(walletSummary.remainingBalance)}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="withdraw-form">
                            <div className="modern-form-group">
                              <label className="modern-label">Amount</label>
                              <div className="amount-input-container">
                                <span className="currency-symbol">£</span>
                                <input
                                  className="modern-amount-input"
                                  placeholder="0.00"
                                  inputMode="decimal"
                                  value={withdrawAmount}
                                  onChange={(e) =>
                                    setWithdrawAmount(e.target.value)
                                  }
                                />
                              </div>
                              <div className="quick-amounts">
                                {[10, 25, 50, 100].map((q) => (
                                  <button
                                    key={q}
                                    className="quick-amount-btn"
                                    type="button"
                                    onClick={() => setWithdrawAmount(String(q))}
                                  >
                                    £{q}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="withdraw-info-card">
                              <div className="info-item">
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="12" y1="8" x2="12" y2="12" />
                                  <line x1="12" y1="16" x2="12" y2="16" />
                                </svg>{" "}
                                This is a demo UI. No real withdrawal will be
                                made.
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="modern-modal-actions">
                          <button
                            className="modern-cancel-btn"
                            onClick={closeWithdraw}
                          >
                            Cancel
                          </button>
                          <button
                            className="modern-confirm-btn"
                            onClick={confirmWalletWithdraw}
                            disabled={!canConfirmWithdraw() || withdrawLoading}
                          >
                            {withdrawLoading && (
                              <svg
                                className="spinner"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <circle cx="12" cy="12" r="10" />
                              </svg>
                            )}
                            {withdrawLoading
                              ? "Processing…"
                              : "Confirm Withdraw"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Profile (Portfolios CRUD) */}
              {activeTab === "profile" && (
                <div className="profile-section">
                  {showNewPortfolioForm ? (
                    <ArtistPortfolioForm
                      portfolioData={editingPortfolio}
                      onSave={handleSaveNewPortfolio}
                      onCancel={handleCancelPortfolioForm}
                      loading={savingPortfolio}
                      artistId={user?._id}
                    />
                  ) : (
                    <>
                      <div className="section-header">
                        <h2>Profile</h2>
                        <button
                          onClick={() => setShowNewPortfolioForm(true)}
                          style={{
                            backgroundColor: "#ff6b35",
                            color: "white",
                            border: "none",
                            padding: "10px 20px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "500",
                            transition: "background-color 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#e85a28";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#ff6b35";
                          }}
                        >
                          Create New Portfolio
                        </button>
                      </div>

                      {/* Portfolio List */}
                      <div className="portfolio-grid">
                        {portfoliosLoading && <div>Loading portfolios...</div>}
                        {!portfoliosLoading && portfolios.length === 0 && (
                          <div className="empty-state">
                            No portfolios yet. Create your first above.
                          </div>
                        )}
                        {portfolios.map((p) => (
                          <div key={p._id} className="portfolio-item">
                            <div className="badge">
                              {(p.categories || [])[0] || "Mehndi"}
                            </div>
                            <div
                              className="thumb"
                              style={{
                                backgroundImage:
                                  p.mediaUrls && p.mediaUrls[0]
                                    ? `url(${p.mediaUrls[0]})`
                                    : undefined,
                              }}
                            ></div>
                            <div className="item-actions">
                              <button
                                className="app-btn primary"
                                onClick={() => {
                                  handleEditPortfolio(p);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="app-btn danger"
                                onClick={() => {
                                  setDeleteTargetId(p._id);
                                  setDeleteConfirmOpen(true);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                            <div className="item-info">
                              <div className="item-title">
                                {p.displayName || "Untitled"}
                              </div>
                              <div className="item-sub">{p.tagline || ""}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Logout Banner Section - Moved to bottom of profile section */}
                  <div
                    className="logout-banner-section"
                    style={{
                      backgroundColor: "#F8F2E6",
                      padding: "2rem 0",
                      marginTop: "2rem",
                      // borderTop: '1px solid rgba(0,0,0,0.1)'
                    }}
                  >
                    <div
                      className="logout-banner-content"
                      style={{
                        maxWidth: 980,
                        margin: "0 auto",
                        padding: "0 0.2rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        className="logout-text"
                        style={{
                          color: "#666",
                          fontSize: "1rem",
                          fontWeight: 400,
                        }}
                      >
                        Need a break?
                      </div>

                      <Link
                        to="/login"
                        onClick={handleLogoutClick}
                        className="logout-link"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          color: "#A0522D",
                          fontSize: "1rem",
                          fontWeight: 500,
                          position: "relative",
                          padding: "8px 0",
                          textDecoration: "none",
                        }}
                        onMouseEnter={(e) => {
                          const underline =
                            e.currentTarget.querySelector(".logout-underline");
                          underline.style.width = "100%";
                        }}
                        onMouseLeave={(e) => {
                          const underline =
                            e.currentTarget.querySelector(".logout-underline");
                          underline.style.width = "0%";
                        }}
                      >
                        <FaSignOutAlt style={{ fontSize: "1.1rem" }} />
                        <span>Logout</span>
                        <div
                          className="logout-underline"
                          style={{
                            position: "absolute",
                            bottom: "0",
                            left: "0",
                            height: "2px",
                            backgroundColor: "#A0522D",
                            width: "0%",
                            transition: "width 0.5s ease-in-out",
                          }}
                        />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Withdraw Confirmation Modal */}
            {withdrawConfirmOpen && (
              <div className="modal-overlay" onClick={closeWithdrawConfirm}>
                <div
                  className="confirmation-modal"
                  onClick={(e) => e.stopPropagation()}
                >
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
                      {withdrawLoading ? "Withdrawing..." : "Yes, Withdraw"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Image Lightbox */}
            {selectedImage && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0, 0, 0, 0.9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10000,
                  padding: "2rem",
                }}
                onClick={() => setSelectedImage(null)}
              >
                <button
                  onClick={() => setSelectedImage(null)}
                  style={{
                    position: "absolute",
                    top: "20px",
                    right: "20px",
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "none",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    fontSize: "28px",
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(255, 255, 255, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(255, 255, 255, 0.2)";
                  }}
                >
                  ×
                </button>
                <img
                  src={selectedImage}
                  alt="Design Inspiration"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    maxWidth: "90%",
                    maxHeight: "90%",
                    objectFit: "contain",
                    borderRadius: "8px",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                  }}
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/400?text=Image+Not+Found";
                  }}
                />
              </div>
            )}

            {viewOpen && viewForm && (
              <div
                className="modal-overlay"
                onClick={closeViewBooking}
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 9999,
                }}
              >
                <div
                  className="modal"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    maxWidth: "800px",
                    maxHeight: "90vh",
                    width: "95%",
                    backgroundColor: "white",
                    borderRadius: "16px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      padding: "2rem 2.5rem 1.5rem",
                      borderBottom: "1px solid #e8ddd4",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "1.75rem",
                        fontWeight: "600",
                        color: "#8B4513",
                      }}
                    >
                      Booking Details
                    </h2>
                    <button
                      onClick={closeViewBooking}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "28px",
                        color: "#8B4513",
                        cursor: "pointer",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      padding: "2rem 2.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2rem",
                      }}
                    >
                      {/* Client Name */}
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "1.05rem",
                            fontWeight: "600",
                            marginBottom: "0.5rem",
                            color: "#8B4513",
                          }}
                        >
                          Client Name
                        </label>
                        <div
                          style={{
                            padding: "12px 16px",
                            border: "1px solid #e0d5c9",
                            borderRadius: "10px",
                            fontSize: "1rem",
                            background: "#faf8f5",
                            color: "#8B4513",
                            fontWeight: "500",
                          }}
                        >
                          {viewForm.firstName} {viewForm.lastName}
                        </div>
                      </div>

                      {/* Event Type */}
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "1.05rem",
                            fontWeight: "600",
                            marginBottom: "0.5rem",
                            color: "#8B4513",
                          }}
                        >
                          Event Type
                        </label>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(150px, 1fr))",
                            gap: "1rem",
                          }}
                        >
                          {[
                            { value: "Wedding", emoji: "💍" },
                            { value: "Eid", emoji: "🌙" },
                            { value: "Party", emoji: "🎉" },
                            { value: "Festival", emoji: "🎊" },
                          ].map((opt) => (
                            <div
                              key={opt.value}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "16px",
                                border: `2px solid ${
                                  viewForm.eventType === opt.value
                                    ? "#CD853F"
                                    : "#e0d5c9"
                                }`,
                                borderRadius: "12px",
                                background:
                                  viewForm.eventType === opt.value
                                    ? "#fff8f0"
                                    : "#faf8f5",
                                transition: "all 0.3s",
                                position: "relative",
                              }}
                            >
                              <span style={{ fontSize: "1.5rem" }}>
                                {opt.emoji}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.95rem",
                                  fontWeight: "500",
                                }}
                              >
                                {opt.value}
                              </span>
                              {viewForm.eventType === opt.value && (
                                <span
                                  style={{
                                    position: "absolute",
                                    right: "16px",
                                    color: "#CD853F",
                                    fontWeight: "bold",
                                    fontSize: "1.3rem",
                                  }}
                                >
                                  ✓
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        {viewForm.otherEventType && (
                          <div
                            style={{
                              marginTop: "1rem",
                              padding: "12px 16px",
                              background: "#faf8f5",
                              borderRadius: "10px",
                              border: "1px solid #e0d5c9",
                              fontSize: "0.95rem",
                              color: "#8B4513",
                            }}
                          >
                            Other: {viewForm.otherEventType}
                          </div>
                        )}
                      </div>

                      {/* Event Date */}
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "1.05rem",
                            fontWeight: "600",
                            marginBottom: "0.5rem",
                            color: "#8B4513",
                          }}
                        >
                          Event Date
                        </label>
                        <div
                          style={{
                            padding: "12px 16px",
                            border: "1px solid #e0d5c9",
                            borderRadius: "10px",
                            fontSize: "1rem",
                            background: "#faf8f5",
                            color: "#8B4513",
                          }}
                        >
                          {viewForm.eventDate
                            ? new Date(viewForm.eventDate).toLocaleDateString(
                                "en-GB",
                                {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )
                            : "Not set"}
                        </div>
                      </div>

                      {/* Preferred Time Slot */}
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "1.05rem",
                            fontWeight: "600",
                            marginBottom: "0.5rem",
                            color: "#8B4513",
                          }}
                        >
                          Preferred Time Slot
                        </label>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(150px, 1fr))",
                            gap: "1rem",
                          }}
                        >
                          {[
                            { value: "Morning", icon: "☀️" },
                            { value: "Afternoon", icon: "🌤️" },
                            { value: "Evening", icon: "🌙" },
                            { value: "Flexible", icon: "🔄" },
                          ].map((opt) => (
                            <div
                              key={opt.value}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "16px",
                                border: `2px solid ${
                                  viewForm.preferredTimeSlot === opt.value
                                    ? "#CD853F"
                                    : "#e0d5c9"
                                }`,
                                borderRadius: "12px",
                                background:
                                  viewForm.preferredTimeSlot === opt.value
                                    ? "#fff8f0"
                                    : "#faf8f5",
                                transition: "all 0.3s",
                                position: "relative",
                              }}
                            >
                              <span style={{ fontSize: "1.5rem" }}>
                                {opt.icon}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.95rem",
                                  fontWeight: "500",
                                }}
                              >
                                {opt.value}
                              </span>
                              {viewForm.preferredTimeSlot === opt.value && (
                                <span
                                  style={{
                                    position: "absolute",
                                    right: "16px",
                                    color: "#CD853F",
                                    fontWeight: "bold",
                                    fontSize: "1.3rem",
                                  }}
                                >
                                  ✓
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Location */}
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "1.05rem",
                            fontWeight: "600",
                            marginBottom: "0.5rem",
                            color: "#8B4513",
                          }}
                        >
                          Location / Postcode
                        </label>
                        <div
                          style={{
                            padding: "12px 16px",
                            border: "1px solid #e0d5c9",
                            borderRadius: "10px",
                            fontSize: "1rem",
                            background: "#faf8f5",
                            color: "#8B4513",
                          }}
                        >
                          {viewForm.location || "Not specified"}
                        </div>
                      </div>

                      {/* Travel Preference */}
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "1.05rem",
                            fontWeight: "600",
                            marginBottom: "0.5rem",
                            color: "#8B4513",
                          }}
                        >
                          Artist Travel Preference
                        </label>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "1rem",
                          }}
                        >
                          {[
                            {
                              value: "yes",
                              text: "Yes, come to my home",
                              icon: "🚗",
                            },
                            {
                              value: "no",
                              text: "No, I'll travel to the artist",
                              icon: "🏡",
                            },
                            {
                              value: "both",
                              text: "I'm open to both",
                              icon: "🤝",
                            },
                          ].map((opt) => (
                            <div
                              key={opt.value}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "16px",
                                border: `2px solid ${
                                  viewForm.artistTravelsToClient === opt.value
                                    ? "#CD853F"
                                    : "#e0d5c9"
                                }`,
                                borderRadius: "12px",
                                background:
                                  viewForm.artistTravelsToClient === opt.value
                                    ? "#fff8f0"
                                    : "#faf8f5",
                                transition: "all 0.3s",
                                position: "relative",
                              }}
                            >
                              <span style={{ fontSize: "1.5rem" }}>
                                {opt.icon}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.95rem",
                                  fontWeight: "500",
                                }}
                              >
                                {opt.text}
                              </span>
                              {viewForm.artistTravelsToClient === opt.value && (
                                <span
                                  style={{
                                    position: "absolute",
                                    right: "16px",
                                    color: "#CD853F",
                                    fontWeight: "bold",
                                    fontSize: "1.3rem",
                                  }}
                                >
                                  ✓
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Venue Name */}
                      {viewForm.venueName && (
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "1.05rem",
                              fontWeight: "600",
                              marginBottom: "0.5rem",
                              color: "#8B4513",
                            }}
                          >
                            Venue Name
                          </label>
                          <div
                            style={{
                              padding: "12px 16px",
                              border: "1px solid #e0d5c9",
                              borderRadius: "10px",
                              fontSize: "1rem",
                              background: "#faf8f5",
                              color: "#8B4513",
                            }}
                          >
                            {viewForm.venueName}
                          </div>
                        </div>
                      )}

                      {/* Design Inspiration */}
                      {Array.isArray(viewForm.designInspiration) &&
                        viewForm.designInspiration.length > 0 && (
                          <div>
                            <label
                              style={{
                                display: "block",
                                fontSize: "1.05rem",
                                fontWeight: "600",
                                marginBottom: "0.5rem",
                                color: "#8B4513",
                              }}
                            >
                              Design Inspiration
                            </label>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fill, minmax(100px, 1fr))",
                                gap: "0.75rem",
                                padding: "1rem",
                                background: "#f9f9f9",
                                borderRadius: "10px",
                              }}
                            >
                              {viewForm.designInspiration.map((url, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => setSelectedImage(url)}
                                  style={{
                                    aspectRatio: "1",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    border: "2px solid #e0d5c9",
                                    cursor: "pointer",
                                    transition: "all 0.3s",
                                    position: "relative",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor =
                                      "#CD853F";
                                    e.currentTarget.style.transform =
                                      "scale(1.05)";
                                    e.currentTarget.style.boxShadow =
                                      "0 4px 12px rgba(205, 133, 63, 0.3)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor =
                                      "#e0d5c9";
                                    e.currentTarget.style.transform =
                                      "scale(1)";
                                    e.currentTarget.style.boxShadow = "none";
                                  }}
                                >
                                  <img
                                    src={url}
                                    alt={`Inspiration ${idx + 1}`}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                    onError={(e) =>
                                      (e.target.style.display = "none")
                                    }
                                  />
                                  {/* <div
                                    style={{
                                      position: "absolute",
                                      top: "4px",
                                      right: "4px",
                                      background: "rgba(0, 0, 0, 0.5)",
                                      color: "white",
                                      borderRadius: "4px",
                                      padding: "2px 6px",
                                      fontSize: "10px",
                                      fontWeight: "600",
                                    }}
                                  >
                                    Click to enlarge
                                  </div> */}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Coverage Preference */}
                      {viewForm.coveragePreference && (
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "1.05rem",
                              fontWeight: "600",
                              marginBottom: "0.5rem",
                              color: "#8B4513",
                            }}
                          >
                            Coverage Preference (for bridal)
                          </label>
                          <div
                            style={{
                              padding: "12px 16px",
                              border: "1px solid #e0d5c9",
                              borderRadius: "10px",
                              fontSize: "1rem",
                              background: "#faf8f5",
                              color: "#8B4513",
                            }}
                          >
                            {viewForm.coveragePreference}
                          </div>
                        </div>
                      )}

                      {/* Budget Range */}
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "1.05rem",
                            fontWeight: "600",
                            marginBottom: "0.5rem",
                            color: "#8B4513",
                          }}
                        >
                          Budget Range
                        </label>
                        <div
                          style={{
                            padding: "16px",
                            border: "1px solid #e0d5c9",
                            borderRadius: "10px",
                            fontSize: "1rem",
                            background: "#faf8f5",
                            color: "#8B4513",
                            fontWeight: "600",
                          }}
                        >
                          £{viewForm.minimumBudget} - £{viewForm.maximumBudget}
                        </div>
                      </div>

                      {/* Number of People */}
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "1.05rem",
                            fontWeight: "600",
                            marginBottom: "0.5rem",
                            color: "#8B4513",
                          }}
                        >
                          Number of People
                        </label>
                        <div
                          style={{
                            padding: "12px 16px",
                            border: "1px solid #e0d5c9",
                            borderRadius: "10px",
                            fontSize: "1rem",
                            background: "#faf8f5",
                            color: "#8B4513",
                          }}
                        >
                          {viewForm.numberOfPeople || 1}{" "}
                          {viewForm.numberOfPeople === 1 ? "person" : "people"}
                        </div>
                      </div>

                      {/* Additional Requests */}
                      {viewForm.additionalRequests && (
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "1.05rem",
                              fontWeight: "600",
                              marginBottom: "0.5rem",
                              color: "#8B4513",
                            }}
                          >
                            Additional Requests
                          </label>
                          <div
                            style={{
                              padding: "12px 16px",
                              border: "1px solid #e0d5c9",
                              borderRadius: "10px",
                              fontSize: "1rem",
                              background: "#faf8f5",
                              color: "#8B4513",
                              lineHeight: "1.5",
                            }}
                          >
                            {viewForm.additionalRequests}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      flexShrink: 0,
                      borderTop: "1px solid #e8ddd4",
                      padding: "1.5rem 2.5rem",
                      display: "flex",
                      gap: "1rem",
                      justifyContent: "flex-end",
                      background: "#faf8f5",
                    }}
                  >
                    <button
                      onClick={handleMessageClientFromView}
                      style={{
                        padding: "14px 32px",
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "white",
                        backgroundColor: "#A4693D",
                        border: "none",
                        borderRadius: "12px",
                        cursor: "pointer",
                      }}
                    >
                      Message Client
                    </button>
                    <button
                      onClick={closeViewBooking}
                      style={{
                        padding: "14px 32px",
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "white",
                        backgroundColor: "#CD853F",
                        border: "none",
                        borderRadius: "12px",
                        cursor: "pointer",
                        transition: "all 0.3s",
                        boxShadow: "0 4px 12px rgba(205, 133, 63, 0.3)",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow =
                          "0 6px 16px rgba(205, 133, 63, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow =
                          "0 4px 12px rgba(205, 133, 63, 0.3)";
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* View Notes Modal */}
            {viewNotesModalOpen && viewNotesBookingId && (
              <div
                className="modal-overlay"
                onClick={() => setViewNotesModalOpen(false)}
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 9999,
                }}
              >
                <div
                  className="modal"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    maxWidth: "600px",
                    width: "90%",
                    maxHeight: "85vh",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "white",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <div className="modal-header" style={{ flexShrink: 0 }}>
                    <h3
                      className="modal-title"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <FaStickyNote style={{ color: "#d4a574" }} />
                      All Notes
                    </h3>
                    <button
                      className="modal-close"
                      onClick={() => setViewNotesModalOpen(false)}
                    >
                      ×
                    </button>
                  </div>
                  <div
                    className="modal-body"
                    style={{
                      overflowY: "auto",
                      flex: 1,
                      padding: "20px",
                    }}
                  >
                    {bookingNotes[viewNotesBookingId]?.notes?.length === 0 ? (
                      <p
                        style={{
                          textAlign: "center",
                          color: "#888",
                          padding: "20px",
                        }}
                      >
                        No notes yet
                      </p>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px",
                        }}
                      >
                        {bookingNotes[viewNotesBookingId]?.notes?.map(
                          (note, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: "16px",
                                backgroundColor: "#f9f9f9",
                                borderRadius: "8px",
                                border: "1px solid #e0e0e0",
                              }}
                            >
                              <div
                                style={{
                                  marginBottom: "8px",
                                  fontSize: "12px",
                                  color: "#888",
                                }}
                              >
                                {new Date(note.createdAt).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </div>
                              <div
                                style={{
                                  fontSize: "14px",
                                  color: "#333",
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                {note.content}
                              </div>
                              {note.followUp && (
                                <div
                                  style={{
                                    marginTop: "8px",
                                    padding: "4px 8px",
                                    backgroundColor: "#fff3cd",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    color: "#856404",
                                    display: "inline-block",
                                  }}
                                >
                                  ⚠️ Follow-up required
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                  <div
                    className="modal-footer"
                    style={{ flexShrink: 0, padding: "15px 20px" }}
                  >
                    <button
                      className="btn-primary"
                      onClick={() => setViewNotesModalOpen(false)}
                    >
                      Close
                    </button>
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
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18 6L6 18M6 6L18 18"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    </button>
                  </div>
                  <p className="modal-text">
                    This action{" "}
                    <span style={{ color: "#dc2626", fontWeight: 700 }}>
                      cannot be undone
                    </span>
                    . The client will be notified immediately.
                  </p>
                  <div className="form-group">
                    <label className="form-label">
                      Reason for cancellation
                    </label>
                    <select
                      className="form-input"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                    >
                      <option>Scheduling Conflict</option>
                      <option>Personal Emergency</option>
                      <option>Travel / Location Issue</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <textarea
                      className="form-textarea"
                      rows="3"
                      placeholder="Additional details..."
                      value={cancelDetails}
                      onChange={(e) => setCancelDetails(e.target.value)}
                    />
                    {cancelError && (
                      <small style={{ color: "#dc2626" }}>{cancelError}</small>
                    )}
                  </div>
                  <div className="modal-actions">
                    <button className="cancel-btn" onClick={closeCancelModal}>
                      Keep Booking
                    </button>
                    <button
                      className="confirm-btn decline"
                      onClick={confirmCancellation}
                    >
                      Confirm Cancellation
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showProposalModal && (
              <div className="modal-overlay">
                <div className="proposal-modal">
                  <div className="modal-header">
                    <h3 className="modal-title">Send Proposal</h3>
                    <button
                      className="modal-close"
                      onClick={handleCloseProposalModal}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18 6L6 18M6 6L18 18"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    </button>
                  </div>

                  {selectedJob && (
                    <div className="modal-content">
                      <div className="job-summary">
                        <h4>{selectedJob.title}</h4>
                        <p>
                          Client: {selectedJob.client} • {selectedJob.location}
                        </p>
                        <p>Budget: {selectedJob.budget}</p>
                      </div>

                      <div className="proposal-form">
                        {error && (
                          <div
                            className="error-message"
                            style={{
                              background: "#fee",
                              border: "1px solid #fcc",
                              borderRadius: "4px",
                              padding: "10px",
                              marginBottom: "15px",
                              color: "#c33",
                            }}
                          >
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
                              onChange={(e) =>
                                handleProposalInputChange(
                                  "price",
                                  e.target.value
                                )
                              }
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
                              onChange={(e) =>
                                handleProposalInputChange(
                                  "duration",
                                  e.target.value
                                )
                              }
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
                            onChange={(e) =>
                              handleProposalInputChange(
                                "experience",
                                e.target.value
                              )
                            }
                            disabled={submittingProposal}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            Proposal Message *
                          </label>
                          <textarea
                            className="form-textarea"
                            placeholder="Explain why you're the best fit for this job... (minimum 50 characters)"
                            rows="4"
                            value={proposalData.message}
                            onChange={(e) =>
                              handleProposalInputChange(
                                "message",
                                e.target.value
                              )
                            }
                            disabled={submittingProposal}
                          />
                          <small
                            style={{
                              color:
                                proposalData.message.length < 50
                                  ? "#e74c3c"
                                  : "#27ae60",
                              fontSize: "12px",
                              fontWeight:
                                proposalData.message.length < 50
                                  ? "bold"
                                  : "normal",
                            }}
                          >
                            {proposalData.message.length}/50 characters minimum
                            {proposalData.message.length < 50 && (
                              <span
                                style={{ display: "block", marginTop: "2px" }}
                              >
                                Please write at least{" "}
                                {50 - proposalData.message.length} more
                                characters
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
                          disabled={
                            !proposalData.price ||
                            !proposalData.message ||
                            !proposalData.duration ||
                            proposalData.message.length < 50 ||
                            submittingProposal
                          }
                          title={
                            !proposalData.price
                              ? "Please enter your price"
                              : !proposalData.duration
                              ? "Please enter duration"
                              : !proposalData.message
                              ? "Please enter a proposal message"
                              : proposalData.message.length < 50
                              ? `Message too short. Need ${
                                  50 - proposalData.message.length
                                } more characters`
                              : submittingProposal
                              ? "Submitting proposal..."
                              : "Send your proposal"
                          }
                        >
                          {submittingProposal ? "Sending..." : "Send Proposal"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {applyOpen && (
              <div className="modal-overlay" onClick={closeApplyModal}>
                <div
                  className="application-modal"
                  onClick={(e) => e.stopPropagation()}
                  style={{ maxWidth: "900px", maxHeight: "90vh", width: "95%" }}
                >
                  <div className="modal-header">
                    <h3 className="modal-title">Apply to Request</h3>
                    <button className="modal-close" onClick={closeApplyModal}>
                      ×
                    </button>
                  </div>

                  <div className="modal-body" style={{ padding: "0" }}>
                    {/* Booking Card at the top */}
                    {applyBookingData && (
                      <div
                        className="booking-card-modal"
                        style={{
                          background:
                            "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                          border: "1px solid #dee2e6",
                          borderRadius: "12px",
                          margin: "20px",
                          padding: "20px",
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <div
                          className="booking-header"
                          style={{
                            marginBottom: "0",
                            textAlign: "left",
                            flexDirection: "column",
                          }}
                        >
                          <h4
                            style={{
                              margin: "0 0 16px 0",
                              fontSize: "18px",
                              fontWeight: "600",
                              color: "#2c3e50",
                              textAlign: "left",
                            }}
                          >
                            {applyBookingData.title}
                          </h4>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              alignItems: "flex-start",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "14px",
                                color: "#6c757d",
                                justifyContent: "flex-start",
                              }}
                            >
                              <span style={{ fontSize: "16px" }}>💰</span>
                              <span>
                                Client Budget: {applyBookingData.budget}
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "14px",
                                color: "#6c757d",
                                justifyContent: "flex-start",
                              }}
                            >
                              <span style={{ fontSize: "16px" }}>📍</span>
                              <span>
                                Location:{" "}
                                {applyBookingData.location ||
                                  applyBookingData.city ||
                                  "Not specified"}
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "14px",
                                color: "#6c757d",
                                justifyContent: "flex-start",
                              }}
                            >
                              <span style={{ fontSize: "16px" }}>📅</span>
                              <span>
                                Event Date:{" "}
                                {new Date(
                                  applyBookingData.eventDate
                                ).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div
                      className="application-form"
                      style={{ padding: "0 20px 20px 20px" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "20px",
                        }}
                      >
                        {/* Row 1: Budget & Timeline */}
                        <div
                          className="form-card"
                          style={{
                            background: "#f8f9fa",
                            border: "1px solid #e9ecef",
                            borderRadius: "12px",
                            padding: "20px",
                          }}
                        >
                          <h4
                            className="section-title"
                            style={{
                              fontSize: "16px",
                              fontWeight: "600",
                              marginBottom: "16px",
                              color: "#2c3e50",
                            }}
                          >
                            Budget & Timeline
                          </h4>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "20px",
                            }}
                          >
                            <div className="form-group">
                              <label
                                className="form-label"
                                style={{
                                  display: "block",
                                  fontSize: "14px",
                                  fontWeight: "500",
                                  marginBottom: "8px",
                                  color: "#495057",
                                }}
                              >
                                Your Proposed Budget (£) *
                              </label>
                              <input
                                type="number"
                                className={`form-input ${
                                  formErrors.proposedBudget ? "error" : ""
                                }`}
                                placeholder="450"
                                value={applicationForm.proposedBudget}
                                onChange={(e) =>
                                  handleFormChange(
                                    "proposedBudget",
                                    e.target.value
                                  )
                                }
                                disabled={applyLoading}
                                min="0"
                                step="0.01"
                                style={{
                                  width: "100%",
                                  padding: "12px",
                                  border: "1px solid #ced4da",
                                  borderRadius: "8px",
                                  fontSize: "14px",
                                  outline: "none",
                                  transition: "border-color 0.2s ease",
                                }}
                              />
                              {formErrors.proposedBudget && (
                                <span
                                  className="error-text"
                                  style={{
                                    color: "#dc3545",
                                    fontSize: "12px",
                                    marginTop: "4px",
                                    display: "block",
                                  }}
                                >
                                  {formErrors.proposedBudget}
                                </span>
                              )}
                            </div>
                            <div className="form-group">
                              <label
                                className="form-label"
                                style={{
                                  display: "block",
                                  fontSize: "14px",
                                  fontWeight: "500",
                                  marginBottom: "8px",
                                  color: "#495057",
                                }}
                              >
                                Estimated Duration (hours) *
                              </label>
                              <div
                                className="duration-input-group"
                                style={{ display: "flex", gap: "8px" }}
                              >
                                <input
                                  type="number"
                                  className={`form-input ${
                                    formErrors.estimatedDuration ? "error" : ""
                                  }`}
                                  placeholder="4"
                                  value={
                                    applicationForm.estimatedDuration.value
                                  }
                                  onChange={(e) =>
                                    handleFormChange(
                                      "estimatedDuration.value",
                                      e.target.value
                                    )
                                  }
                                  disabled={applyLoading}
                                  min="0"
                                  step="0.5"
                                  style={{
                                    flex: "2",
                                    padding: "12px",
                                    border: "1px solid #ced4da",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    outline: "none",
                                    transition: "border-color 0.2s ease",
                                    minWidth: "120px",
                                  }}
                                />
                                <div
                                  className="form-input"
                                  value={applicationForm.estimatedDuration.unit}
                                  onChange={(e) =>
                                    handleFormChange(
                                      "estimatedDuration.unit",
                                      e.target.value
                                    )
                                  }
                                  disabled={applyLoading}
                                  style={{
                                    flex: "1",
                                    padding: "12px",
                                    border: "1px solid #ced4da",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    outline: "none",
                                    backgroundColor: "white",
                                    minWidth: "80px",
                                  }}
                                >
                                  <span value="hours">Hours</span>
                                </div>
                              </div>
                              {formErrors.estimatedDuration && (
                                <span
                                  className="error-text"
                                  style={{
                                    color: "#dc3545",
                                    fontSize: "12px",
                                    marginTop: "4px",
                                    display: "block",
                                  }}
                                >
                                  {formErrors.estimatedDuration}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Your Proposal */}
                        <div
                          className="form-card"
                          style={{
                            background: "#f8f9fa",
                            border: "1px solid #e9ecef",
                            borderRadius: "12px",
                            padding: "20px",
                          }}
                        >
                          <h4
                            className="section-title"
                            style={{
                              fontSize: "16px",
                              fontWeight: "600",
                              marginBottom: "16px",
                              color: "#2c3e50",
                            }}
                          >
                            Your Proposal
                          </h4>
                          <div className="form-group">
                            <label
                              className="form-label"
                              style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: "500",
                                marginBottom: "8px",
                                color: "#495057",
                              }}
                            >
                              Proposal Message *
                            </label>
                            <textarea
                              className={`form-textarea ${
                                formErrors.proposalMessage ? "error" : ""
                              }`}
                              placeholder="Write a message explaining why you're the best fit for this booking. Include your approach and what makes you unique..."
                              rows="6"
                              value={applicationForm.proposal.message}
                              onChange={(e) =>
                                handleFormChange(
                                  "proposal.message",
                                  e.target.value
                                )
                              }
                              disabled={applyLoading}
                              style={{
                                width: "100%",
                                padding: "12px",
                                border: "1px solid #ced4da",
                                borderRadius: "8px",
                                fontSize: "14px",
                                outline: "none",
                                transition: "border-color 0.2s ease",
                                resize: "vertical",
                                fontFamily: "inherit",
                                lineHeight: "1.4",
                              }}
                            />
                            <small
                              style={{
                                color:
                                  applicationForm.proposal.message.length < 50
                                    ? "#dc3545"
                                    : "#28a745",
                                fontSize: "12px",
                                marginTop: "4px",
                                display: "block",
                              }}
                            >
                              {applicationForm.proposal.message.length}/50
                              characters minimum
                            </small>
                            {formErrors.proposalMessage && (
                              <span
                                className="error-text"
                                style={{
                                  color: "#dc3545",
                                  fontSize: "12px",
                                  marginTop: "4px",
                                  display: "block",
                                }}
                              >
                                {formErrors.proposalMessage}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Row 3: Terms & Conditions */}
                        <div
                          className="form-card"
                          style={{
                            background: "#f8f9fa",
                            border: "1px solid #e9ecef",
                            borderRadius: "12px",
                            padding: "20px",
                          }}
                        >
                          <h4
                            className="section-title"
                            style={{
                              fontSize: "16px",
                              fontWeight: "600",
                              marginBottom: "16px",
                              color: "#2c3e50",
                            }}
                          >
                            Terms & Conditions
                          </h4>
                          <div className="checkbox-group">
                            <label
                              className="checkbox-label"
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "8px",
                                cursor: "pointer",
                                fontSize: "14px",
                                lineHeight: "1.4",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={applicationForm.terms.agreedToTerms}
                                onChange={(e) =>
                                  handleFormChange(
                                    "terms.agreedToTerms",
                                    e.target.checked
                                  )
                                }
                                disabled={applyLoading}
                                style={{ marginTop: "2px" }}
                              />
                              <span style={{ color: "#495057" }}>
                                I agree to MehndiMe’s Terms & Conditions and
                                Privacy Policy, and understand that all payments
                                and communication must remain on the MehndiMe
                                platform to ensure protection for both artists
                                and clients.
                              </span>
                            </label>
                            {formErrors.agreedToTerms && (
                              <span
                                className="error-text"
                                style={{
                                  color: "#dc3545",
                                  fontSize: "12px",
                                  marginTop: "8px",
                                  display: "block",
                                }}
                              >
                                {formErrors.agreedToTerms}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="modal-footer"
                    style={{
                      borderTop: "1px solid #e9ecef",
                      padding: "20px",
                      backgroundColor: "#f8f9fa",
                      display: "flex",
                      gap: "12px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      className="cancel-btn"
                      onClick={closeApplyModal}
                      disabled={applyLoading}
                      style={{
                        padding: "12px 24px",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#6c757d",
                        backgroundColor: "white",
                        border: "1px solid #dee2e6",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="submit-btn"
                      onClick={confirmApply}
                      disabled={
                        applyLoading || !applicationForm.terms.agreedToTerms
                      }
                      style={{
                        padding: "12px 24px",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "white",
                        backgroundColor: applyLoading ? "#6c757d" : "#8b5a2b",
                        border: "none",
                        borderRadius: "8px",
                        cursor: applyLoading ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (
                          !applyLoading &&
                          applicationForm.terms.agreedToTerms
                        ) {
                          e.target.style.backgroundColor = "#6b4420";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (
                          !applyLoading &&
                          applicationForm.terms.agreedToTerms
                        ) {
                          e.target.style.backgroundColor = "#8b5a2b";
                        }
                      }}
                    >
                      {applyLoading
                        ? "Submitting Application..."
                        : "Submit Application"}
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
