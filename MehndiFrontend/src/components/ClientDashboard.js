import React, { useState, useEffect, useCallback } from 'react';
import './messages.css';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardSidebar from './DashboardSidebar';
import apiService, { chatAPI, reviewsAPI } from '../services/api';
import socket, { buildDirectRoomId, joinRoom, sendRoomMessage, sendTyping, signalOnline, onPresenceUpdate } from '../services/socket';
import ProposalsPage from './ProposalsPage';
import ClientProfile from './ClientProfile';
import { FaCalendarAlt, FaClock, FaWallet } from 'react-icons/fa';

const {proposalsAPI, bookingsAPI, walletAPI, transactionAPI } = apiService;

const ClientDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { tab } = useParams();
  const location = useLocation();
  const userName = user ? user.firstName : 'Client';
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('visa-1234');
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, proposals, wallet, reviews, messages, bookings
  const [showProposalsView, setShowProposalsView] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [proposalsFilter, setProposalsFilter] = useState('active'); // all, active, completed
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewsFilter, setReviewsFilter] = useState('pending'); // pending | completed
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 0,
    title: '',
    comment: '',
    images: []
  });
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [typingUserId, setTypingUserId] = useState(null);

  // Real proposals data from backend
  const [realProposals, setRealProposals] = useState([]);
  const [clientJobs, setClientJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [proposalsError, setProposalsError] = useState('');

  // Real bookings data from backend
  const [allBookings, setAllBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState('');

  // Transaction data
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState('');

  // Dynamic booking data from API
  const [nextEvent, setNextEvent] = useState(null);
  const [secondEvent, setSecondEvent] = useState(null);

  const [upcomingBookings] = useState([
    {
      id: 1,
      title: 'Eid Mehndi',
      artist: 'Henna by Sana',
      date: 'Sep 15, 2025',
      time: '6:00 PM',
      daysLeft: 25,
      depositSecured: true,
      finalPaymentDue: 'Sep 1, 2025',
      status: 'confirmed'
    }
  ]);

  // Mock data for completed bookings
  const [completedBookings, setCompletedBookings] = useState([]); // from backend
  const [notRatedBookings, setNotRatedBookings] = useState([]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [viewReviewModal, setViewReviewModal] = useState(false);
  const [viewReviewData, setViewReviewData] = useState(null);
  const [walletData, setWalletData] = useState({ totalPaid: 0, remainingBalance: 0 });
  const [walletLoading, setWalletLoading] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  // Load completed bookings for reviews
  useEffect(() => {
    const loadReviewsData = async () => {
      try {
        const all = await reviewsAPI.getCompletedBookingsToReview(false);
        const pending = await reviewsAPI.getCompletedBookingsToReview(true);
        setCompletedBookings(all.data || []);
        setNotRatedBookings(pending.data || []);
      } catch (e) {
        console.error('Load review data error', e);
      }
    };
    if (isAuthenticated) loadReviewsData();
  }, [isAuthenticated]);

  // Load wallet data
  useEffect(() => {
    const loadWalletData = async () => {
      if (!isAuthenticated || activeTab !== 'wallet') return;
      try {
        setWalletLoading(true);
        const response = await walletAPI.getWalletSummary();
        if (response.success && response.data) {
          setWalletData({
            totalPaid: response.data.totalPaid || 0,
            remainingBalance: response.data.remainingBalance || 0
          });
        }
      } catch (e) {
        console.error('Load wallet data error', e);
      } finally {
        setWalletLoading(false);
      }
    };
    loadWalletData();
  }, [isAuthenticated, activeTab]);

  const openReviewModal = (booking) => {
    setReviewTarget(booking);
    setReviewRating(0);
    setReviewComment('');
    setReviewModalOpen(true);
  };
  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setReviewTarget(null);
  };
  const submitReview = async () => {
    try {
      await reviewsAPI.createReview({ bookingId: reviewTarget._id, rating: reviewRating, comment: reviewComment,
        artistId:reviewTarget.assignedArtist[0]?._id });
      // refresh
      const all = await reviewsAPI.getCompletedBookingsToReview(false);
      const pending = await reviewsAPI.getCompletedBookingsToReview(true);
      setCompletedBookings(all.data || []);
      setNotRatedBookings(pending.data || []);
      closeReviewModal();
    } catch (e) {
      alert(e.message || 'Failed to submit review');
    }
  };

  const [conversations, setConversations] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());

  const DEFAULT_AVATAR = 'https://www.gravatar.com/avatar/?d=mp&s=80';

  const [notifications] = useState([
    {
      id: 1,
      type: 'applications',
      message: '3 artists have applied to your request — check them out!',
      icon: '🎨'
    },
    {
      id: 2,
      type: 'reminder',
      message: 'Your booking is tomorrow at 4 PM — don\'t forget to confirm details',
      icon: '⏰',
      color: 'orange'
    },
    {
      id: 3,
      type: 'payment',
      message: 'Final 50% payment due in 14 days — complete to secure your event',
      icon: '💰',
      color: 'red'
    },
    {
      id: 4,
      type: 'reminder',
      message: 'Reminder: 7 days left to complete your final payment',
      icon: '📅',
      color: 'blue'
    }
  ]);


  // Fetch proposals for a specific job
  const fetchJobProposals = useCallback(async (jobId) => {
    try {
      console.log('Fetching proposals for job:', jobId);
      const response = await proposalsAPI.getJobProposals(jobId);

      if (response.success && response.data) {
        console.log('Proposals fetched for job:', jobId, response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching job proposals:', error);
      return [];
    }
  }, []);

  // Fetch client's bookings
  const fetchBookings = useCallback(async () => {
    if (!isAuthenticated || !user || user.userType !== 'client') {
      console.log('Skipping bookings fetch - user not authenticated or not a client:', { isAuthenticated, userType: user?.userType });
      return;
    }

    try {
      setBookingsLoading(true);
      console.log('=== FETCHING CLIENT BOOKINGS ===');
      console.log('User:', { id: user._id, userType: user.userType, name: `${user.firstName} ${user.lastName}` });

      const response = await bookingsAPI.getMyBookings();
      console.log('getMyBookings API response:', response);

      if (response.success && response.data) {
        console.log('Setting client bookings:', response.data.length, 'bookings found');
        setAllBookings(response.data);
        setBookingsError('');

        // Find the closest upcoming booking to today's date
        const today = new Date();
        const upcomingBookings = response.data
          .filter(booking => {
            const eventDate = new Date(booking.eventDate);
            return eventDate > today && (booking.status === 'confirmed');
          })
          .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate)); // Sort by closest date first


        if (upcomingBookings.length > 0) {
          // Get the closest upcoming booking (first in sorted array)
          const latestBooking = upcomingBookings[0];
          console.log('Latest booking:', latestBooking);

          const eventDate = new Date(latestBooking.eventDate);
          const today = new Date();
          const daysLeft = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));

          const getEventTitle = (eventType, otherEventType) => {
            if (eventType && eventType.length > 0) {
              const types = eventType.join(', ');
              return otherEventType ? `${types} - ${otherEventType}` : types;
            }
            return otherEventType || 'Mehndi Booking';
          };

          const getArtistName = (assignedArtist) => {
            if (assignedArtist && assignedArtist[0]?.firstName) {
              return `${assignedArtist[0]?.firstName} ${assignedArtist[0]?.lastName}`;
            }
            return 'TBD - No artist assigned yet';
          };

          const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });
          };

          const formatTime = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });
          };

          setNextEvent({
            id: latestBooking._id,
            artistId: latestBooking.assignedArtist[0]?._id,
            title: getEventTitle(latestBooking.eventType, latestBooking.otherEventType),
            date: formatDate(latestBooking.eventDate),
            time: latestBooking.preferredTimeSlot,
            daysLeft: daysLeft,
            location: latestBooking.location,
            artist: getArtistName(latestBooking.assignedArtist),
            isPaid: latestBooking.isPaid || 'none',
            paymentPaid: latestBooking.paymentPaid || '0',
            remainingPayment: latestBooking.remainingPayment || '0',
            status: latestBooking.status
          });

          // Get the second closest upcoming booking if it exists
          if (upcomingBookings.length > 1) {
            const secondBooking = upcomingBookings[1];
            const secondEventDate = new Date(secondBooking.eventDate);
            const secondDaysLeft = Math.ceil((secondEventDate - today) / (1000 * 60 * 60 * 24));

            setSecondEvent({
              id: secondBooking._id,
              artistId: latestBooking.assignedArtist[0]?._id,
              title: getEventTitle(secondBooking.eventType, secondBooking.otherEventType),
              date: formatDate(secondBooking.eventDate),
              time: secondBooking.preferredTimeSlot,
              daysLeft: secondDaysLeft,
              location: secondBooking.location,
              artist: getArtistName(secondBooking.assignedArtist),
              isPaid: secondBooking.isPaid || 'none',
              paymentPaid: secondBooking.paymentPaid || '0',
              remainingPayment: secondBooking.remainingPayment || '0',
              status: secondBooking.status
            });
          } else {
            setSecondEvent(null);
          }
        } else {
          setNextEvent(null);
          setSecondEvent(null);
        }
      } else {
        console.log('No bookings data in response or unsuccessful response');
        setAllBookings([]);
        setBookingsError('No bookings found');
        setNextEvent(null);
        setSecondEvent(null);
      }
    } catch (error) {
      console.error('Error fetching client bookings:', error);
      setBookingsError(error.message || 'Failed to fetch bookings');
      setAllBookings([]);
      setNextEvent(null);
      setSecondEvent(null);
    } finally {
      setBookingsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Fetch user transactions
  const fetchTransactions = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('Skipping transactions fetch - user not authenticated');
      return;
    }

    try {
      setTransactionsLoading(true);
      console.log('=== FETCHING USER TRANSACTIONS ===');

      const response = await transactionAPI.getMyTransactions();
      console.log('getMyTransactions API response:', response);

      if (response.success && response.data) {
        console.log('Setting user transactions:', response.data.length, 'transactions found');
        setTransactions(response.data);
        setTransactionsError('');
      } else {
        console.log('No transactions found');
        setTransactions([]);
        setTransactionsError('No transactions found');
      }
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      setTransactionsError(error.message || 'Failed to fetch transactions');
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Fetch all proposals for all client jobs
  const fetchAllProposals = useCallback(async () => {
    if (!clientJobs.length) {
      return;
    }

    try {
      setProposalsLoading(true);
      setProposalsError('');

      const allProposals = [];

      for (const job of clientJobs) {
        const jobProposals = await fetchJobProposals(job._id);

        // Transform proposals for display
        const transformedProposals = jobProposals.map(proposal => ({
          id: proposal._id,
          jobId: job._id,
          jobTitle: job.title,
          artistName: proposal.artist ? `${proposal.artist.firstName} ${proposal.artist.lastName}` : 'Artist',
          artistId: proposal.artist?._id,
          price: `£${proposal.pricing?.totalPrice || 0}`,
          duration: `${proposal.timeline?.estimatedDuration?.value || 0} ${proposal.timeline?.estimatedDuration?.unit || 'hours'}`,
          proposal: proposal.message || '',
          experience: proposal.experience?.relevantExperience || '',
          status: proposal.status || 'pending',
          submittedAt: proposal.submittedAt,
          rawData: proposal
        }));

        allProposals.push(...transformedProposals);
      }

      setRealProposals(allProposals);
      console.log('All proposals fetched:', allProposals);

    } catch (error) {
      console.error('Error fetching all proposals:', error);
      setProposalsError('Failed to load proposals');
    } finally {
      setProposalsLoading(false);
    }
  }, [clientJobs, fetchJobProposals]);

  // Accept a proposal
  const acceptProposal = async (proposalId) => {
    try {
      console.log('Accepting proposal:', proposalId);
      const response = await proposalsAPI.acceptProposal(proposalId);

      if (response.success) {
        alert('Proposal accepted successfully!');
        // Refresh proposals
        fetchAllProposals();
      }
    } catch (error) {
      console.error('Error accepting proposal:', error);
      alert('Failed to accept proposal: ' + error.message);
    }
  };

  // Reject a proposal
  const rejectProposal = async (proposalId, message = '') => {
    try {
      console.log('Rejecting proposal:', proposalId);
      const response = await proposalsAPI.rejectProposal(proposalId, message);

      if (response.success) {
        alert('Proposal rejected');
        // Refresh proposals
        fetchAllProposals();
      }
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      alert('Failed to reject proposal: ' + error.message);
    }
  };

  // Fetch data when component mounts and when page becomes visible
  useEffect(() => {
    if (tab) setActiveTab(tab);
    if (isAuthenticated && user && user.userType === 'client') {
      fetchBookings();
      fetchTransactions();
    }
  }, [isAuthenticated, user, fetchBookings, fetchTransactions, tab]);

  // Presence: signal that this user is online while on dashboard; listen for updates
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

  // If chatId is provided in query, open messages tab and select that chat
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(location.search);
    const chatId = params.get('chatId');
    if (chatId) {
      setActiveTab('messages');
      // Load that chat and set selection
      chatAPI.getChat(chatId).then(res => {
        if (res.success && res.data) {
          const chat = res.data;
          setSelectedConversation(chat);
          setCurrentChat(chat);
          setChatMessages(chat.messages || []);
          const otherId = chat.artist?._id || chat.artistId;
          if (otherId) {
            const roomId = buildDirectRoomId(user?._id, otherId);
            joinRoom(roomId, { userId: user?._id, userType: user?.userType || 'client' });
          }
          chatAPI.markRead(chat._id).catch(() => { });
          // Ensure new chat appears in the list immediately if not present
          setConversations(prev => {
            const exists = prev.some(c => (c._id || c.id) === chat._id);
            if (exists) return prev;
            const display = {
              ...chat,
              artistName: chat.artist ? `${chat.artist.firstName} ${chat.artist.lastName}` : 'Artist',
              artistImage: chat.artist?.userProfileImage || chat.artistImage,
              lastMessage: chat.messages?.length ? chat.messages[chat.messages.length - 1].text : '',
              unreadCount: 0
            };
            return [display, ...prev];
          });
        }
      }).catch(() => { });
    }
  }, [location.search, user]);

  // Refresh data when the page becomes visible (user returns from job creation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && user && user.userType === 'client') {
        console.log('Page became visible, refreshing client jobs...');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, user]);

  // Fetch proposals when jobs are loaded
  useEffect(() => {
    if (clientJobs.length > 0) {
      fetchAllProposals();
    }
  }, [clientJobs, fetchAllProposals]);

  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);

  const handlePayRemaining = (booking) => {
    setSelectedBookingForPayment(booking);
    console.log('selected', booking)
    setShowPaymentModal(true);
  };

  const handleMessageArtist = async (row) => {
    try {
      if (!user || !user._id) return;
      const clientId = user._id;
      const artistId = row.artist?._id || row.artistId;
      if (!artistId) return;
      const res = await chatAPI.ensureChat(clientId, artistId);
      if (res.success && res.data && res.data._id) {
        navigate(`/dashboard/messages?chatId=${res.data._id}`);
      }
    } catch (e) {
      console.error('Failed to ensure chat:', e);
    }
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedBookingForPayment(null);
  };

  const handleConfirmPayment = async () => {
    if (!selectedBookingForPayment) return;

    try {
      const remainingAmount = selectedBookingForPayment.remainingPayment;
      const bookingId = selectedBookingForPayment.id;
      const artistId = selectedBookingForPayment.artistId;

      console.log('Creating remaining payment for booking:', bookingId, 'amount:', remainingAmount, artistId);

      // Create Stripe checkout session for remaining payment
      const response = await bookingsAPI.createRemainingPayment({
        bookingId: bookingId,
        remainingAmount: remainingAmount,
        artistId: artistId
      });

      if (response.success && response.data.url) {
        // Redirect to Stripe checkout
        window.location.href = response.data.url;
      } else {
        console.error('Failed to create payment session:', response.message);
        alert('Failed to create payment session. Please try again.');
      }
    } catch (error) {
      console.error('Error creating remaining payment:', error);
      alert('Failed to process payment. Please try again.');
    }
  };

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handleWithdraw = async () => {
    try {
      setWithdrawLoading(true);

      const amount = parseFloat(withdrawAmount);
      if (amount <= 0 || amount > walletData.remainingBalance) {
        alert('Invalid withdrawal amount');
        return;
      }

      const response = await walletAPI.withdrawFunds({ amount });

      if (response.success) {
        // Check if onboarding is required
        if (response.data && response.data.onboardingUrl) {
          // Show message and redirect after 3 seconds
          alert('Redirecting to Stripe onboarding first to withdraw. Please complete the setup process.');

          window.location.href = response.data.onboardingUrl;
          return;
        }

        // Normal withdrawal success
        alert('Withdrawal processed successfully! Funds will be available in your bank account within 2-7 business days.');

        // Refresh wallet data
        const walletResponse = await walletAPI.getWalletSummary();
        if (walletResponse.success && walletResponse.data) {
          setWalletData({
            totalPaid: walletResponse.data.totalPaid || 0,
            remainingBalance: walletResponse.data.remainingBalance || 0
          });
        }

        // Close modal and reset form
        setShowWithdrawModal(false);
        setWithdrawAmount('');
      } else {
        alert(response.message || 'Failed to process withdrawal request');
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      alert('Failed to process withdrawal request. Please try again.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'dashboard') {
      navigate(`/dashboard`);
      return;
    }
    navigate(`/dashboard/${tab}`);
  };

  // Helper: get display title for event types
  const getEventTitleGlobal = (eventType, otherEventType) => {
    if (Array.isArray(eventType) && eventType.length > 0) {
      const types = eventType.join(', ');
      return otherEventType ? `${types} - ${otherEventType}` : types;
    }
    return otherEventType || 'Mehndi Booking';
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleViewProposals = (requestId) => {
    setSelectedRequestId(requestId);
    setShowProposalsView(true);
  };

  // Navigate to job details page
  const handleJobClick = (jobId) => {
    window.open(`/job/${jobId}`, '_blank');
  };

  const handleBackToRequests = () => {
    setShowProposalsView(false);
    setSelectedRequestId(null);
  };

  const handleFilterChange = (filter) => {
    setProposalsFilter(filter);
  };

  const handleWriteReview = (booking) => {
    setSelectedBooking(booking);
    setShowReviewModal(true);
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setSelectedBooking(null);
    setReviewData({
      rating: 0,
      title: '',
      comment: '',
      images: []
    });
  };

  const handleRatingChange = (rating) => {
    setReviewData(prev => ({ ...prev, rating }));
  };

  const handleInputChange = (field, value) => {
    setReviewData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageUrls = files.map(file => URL.createObjectURL(file));
    setReviewData(prev => ({
      ...prev,
      images: [...prev.images, ...imageUrls].slice(0, 5) // Max 5 images
    }));
  };

  const handleRemoveImage = (index) => {
    setReviewData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitReview = () => {
    console.log('Submitting review:', reviewData, 'for booking:', selectedBooking);
    // Here you would send the review to your backend
    handleCloseReviewModal();
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setCurrentChat(conversation);
    const otherId = conversation.artist?._id || conversation.artistId || conversation.id;
    const roomId = buildDirectRoomId(user?._id, otherId);
    joinRoom(roomId, { userId: user?._id, userType: user?.userType || 'client' });
    chatAPI.getChat(conversation._id).then(res => {
      if (res.success) setChatMessages(res.data.messages || []);
    }).then(() => chatAPI.markRead(conversation._id))
      .catch(console.error);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() && currentChat) {
      const otherId = currentChat.artist?._id || currentChat.artistId || currentChat.id;
      const roomId = buildDirectRoomId(user?._id, otherId);
      const text = newMessage.trim();
      try {
        const res = await chatAPI.sendMessage(currentChat._id, text);
        if (res.success) {
          const saved = res.data.messages[res.data.messages.length - 1];
          sendRoomMessage(roomId, {
            id: saved._id || Date.now(),
            senderId: saved.sender,
            senderName: userName,
            message: saved.text,
            timestamp: new Date(saved.createdAt || Date.now()).toLocaleString(),
            type: 'text'
          });
          setChatMessages(res.data.messages);
          setNewMessage('');
        }
      } catch (e) { console.error(e); }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (!user || activeTab !== 'messages') return;
    chatAPI.listMyChats().then(res => {
      if (res.success) setConversations(res.data || []);
    }).catch(console.error);
    const interval = setInterval(() => {
      chatAPI.listMyChats().then(res => {
        if (res.success) setConversations(res.data || []);
      }).catch(() => { });
    }, 10000);
    return () => clearInterval(interval);
  }, [user, activeTab]);

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
  //     setTypingUserId(isTyping ? userId : null);
  //   };
  //   socket.on('message', onMessage);
  //   socket.on('typing', onTyping);
  //   return () => {
  //     socket.off('message', onMessage);
  //     socket.off('typing', onTyping);
  //   };
  // }, [user, currentChat]);

  // This is the FIXED code
useEffect(() => {
  if (!user) return;
  const onMessage = (incoming) => {
    // If there's no chat selected OR if the incoming message is from the current user, do nothing.
    // This prevents the echo of your own message from being added again.
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
    setTypingUserId(isTyping ? userId : null);
  };
  socket.on('message', onMessage);
  socket.on('typing', onTyping);
  return () => {
    socket.off('message', onMessage);
    socket.off('typing', onTyping);
  };
}, [user, currentChat]);

  return (
    <>
      <div className="dashboard-layout">
        {/* Sidebar */}
        <DashboardSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
          bookingCount={allBookings.length}
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
              {/* Dashboard View */}
              {activeTab === 'dashboard' && (
                <>
                  {/* Welcome Section */}
                  <div className="welcome-section">
                    <h2 className="welcome-message">
                      Hi {userName} 👋, {nextEvent ? `your ${nextEvent.title.toLowerCase()} is coming up soon!` : 'welcome to your dashboard!'}
                    </h2>

                    {/* Next Event Card */}
                    {nextEvent ? (
                      <div className="next-event-card">
                        <div className="event-header">
                          <FaCalendarAlt className="event-icon" />
                          <h3>Next Event: {nextEvent.title} – {nextEvent.date}</h3>
                        </div>

                        <div className="event-details">
                          <div className="event-left">
                            <p><strong>Date & Time:</strong> {nextEvent.date} · {nextEvent.time}</p>
                            <p className="event-countdown">
                              <FaClock className="countdown-icon" />
                              Event in {nextEvent.daysLeft} days
                            </p>
                            <p><strong>Location:</strong> {nextEvent.location}</p>
                            <p><strong>Artist:</strong> {nextEvent.artist}</p>
                          </div>

                          <div className="event-right">
                            <div className="payment-status-header">
                              <FaWallet className="wallet-icon" />
                              <span>Deposit Paid</span>
                            </div>
                            <div className="payment-progress">
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{
                                    width: nextEvent.isPaid === 'full' ? '100%' :
                                      nextEvent.isPaid === 'half' ? '50%' : '0%'
                                  }}
                                ></div>
                              </div>
                              <p className="payment-text">
                                {nextEvent.isPaid === 'full' ? 'Payment Complete' :
                                  nextEvent.isPaid === 'half' ? `Final 50% Payment Due in ${nextEvent.daysLeft || 14} days` :
                                    `Payment Required (£${nextEvent.remainingPayment || '0'})`}
                              </p>
                            </div>
                            {nextEvent.isPaid === 'full' ? (
                              <p className="all-set">
                                You're all set 🎉
                              </p>
                            ) : null}
                          </div>
                        </div>
                        
                        <div className="event-buttons">
                          <button className="view-full-booking-btn" onClick={() => navigate('/dashboard/bookings')}>
                            View Full Booking
                          </button>
                          {nextEvent.isPaid !== 'full' && (
                            <button className="pay-remaining-btn" onClick={() => handlePayRemaining(nextEvent)}>
                              Pay Remaining Dues
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="no-upcoming-events">
                        <div className="no-events-icon">📅</div>
                        <h3>No Upcoming Events</h3>
                        <p>No confirmed bookings yet — your next mehndi experience awaits.</p>
                        <Link to="/booking" className="btn-primary">Post a New Request</Link>
                      </div>
                    )}
                  </div>

                  <div className="dashboard-main">
                    {/* Left Column - Bookings */}
                    <div className="bookings-section">
                      <div className="section-header">
                        <h3 className="section-title">📅 Upcoming & Confirmed Bookings</h3>
                        {/* <Link to="/dashboard/bookings" className="view-all-btn">
                          View All Bookings
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18L15 12L9 6" />
                          </svg>
                        </Link> */}
                      </div>

                      {/* First upcoming booking */}


                      {/* Second upcoming booking */}
                      {secondEvent && (
                        <div className="second-event-card">
                          {/* Top Section */}
                          <div className="event-top-section">
                            <div className="event-main-info">
                              <h3 className="event-title">{secondEvent.title}</h3>
                              <p className="artist-info">With Henna by {secondEvent.artist}</p>
                              <p className="event-datetime">{secondEvent.date} · {secondEvent.time}</p>
                              <div className="countdown-badge">
                                {secondEvent.daysLeft} days left
                              </div>
                            </div>
                            <div className="event-action-buttons">
                              <button className="message-artist-btn" onClick={() => handleMessageArtist({ artist: { _id: secondEvent.artistId } })}>
                                Message
                              </button>
                            </div>
                          </div>

                          {/* Payment Status Section */}
                          <div className="payment-status-container">
                            <div className="payment-status-row">
                              <div className="payment-status-left">
                                <FaWallet className="wallet-icon" />
                                <span>Deposit Secured</span>
                              </div>
                              <div className="payment-separator"></div>
                              <div className="payment-due-info">
                                Final 50% due {secondEvent.paymentDueDate || secondEvent.date}
                              </div>
                              <button className="pay-remaining-btn" onClick={() => handlePayRemaining(secondEvent)}>
                                Pay Remaining
                              </button>
                            </div>
                          </div>
                          <div className="payment-footer">
                            Final payment scheduled — due soon ⏳
                          </div>
                        </div>
                      )}

                      {/* Post New Request Section */}
                      <div className="no-more-bookings">
                        <div className="plus-icon">+</div>
                        <p>No more upcoming bookings</p>
                        <div className="action-buttons">
                          <Link to="/booking" className="post-new-request-btn">
                            Post a New Request
                          </Link>

                        </div>
                      </div>
                    </div>

                    {/* Right Column - Notifications */}
                    <div className="notifications-section">
                  <h3 className="section-title">🔔 Notifications</h3>
                  
                  <div className="notifications-list">
                    {notifications.map(notification => (
                      <div key={notification.id} className={`notification-item ${notification.color || 'default'}`}>
                        <span className="notification-icon">{notification.icon}</span>
                        <p className="notification-text">{notification.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
                  </div>

                  {/* My Requests Section */}
                  {!showProposalsView ? (
                    <></>
                  ) : (
                    /* Proposals View */
                    <div className="proposals-view">
                      {/* Header with Back Button */}
                      <div className="proposals-header">
                        <button className="back-btn" onClick={handleBackToRequests}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" fill="none" />
                          </svg>
                          Back to Requests
                        </button>
                        <h3 className="proposals-title">
                          {selectedRequestId ?
                            `Proposals for: ${clientJobs.find(job => job._id === selectedRequestId)?.title || 'Job'}` :
                            'All Proposals'
                          }
                        </h3>
                      </div>

                      {/* Filter Tabs */}
                      <div className="proposals-filters">
                        <button
                          className={`filter-tab ${proposalsFilter === 'all' ? 'active' : ''}`}
                          onClick={() => handleFilterChange('all')}
                        >
                          All Requests (2)
                        </button>
                        <button
                          className={`filter-tab ${proposalsFilter === 'active' ? 'active' : ''}`}
                          onClick={() => handleFilterChange('active')}
                        >
                          Active (2)
                        </button>
                        <button
                          className={`filter-tab ${proposalsFilter === 'completed' ? 'active' : ''}`}
                          onClick={() => handleFilterChange('completed')}
                        >
                          Completed (0)
                        </button>

                        {/* Search and Filter */}
                        <div className="proposals-controls">
                          <div className="search-box">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <input type="text" placeholder="Search requests" />
                          </div>
                          <button className="filters-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" stroke="currentColor" strokeWidth="2" fill="none" />
                            </svg>
                            Filters
                          </button>
                        </div>
                      </div>

                      {/* Proposals List */}
                      <div className="proposals-list">
                        {proposalsLoading ? (
                          <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <p>Loading proposals...</p>
                          </div>
                        ) : proposalsError ? (
                          <div className="error-state">
                            <p className="error-message">{proposalsError}</p>
                            <button onClick={fetchAllProposals} className="retry-btn">Try Again</button>
                          </div>
                        ) : realProposals.filter(p => selectedRequestId ? p.jobId === selectedRequestId : true).length === 0 ? (
                          <div className="empty-state">
                            <div className="empty-icon">
                              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14,2 14,8 20,8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10,9 9,9 8,9" />
                              </svg>
                            </div>
                            <h3>No proposals received yet</h3>
                            <p>Artists will send proposals for your posted jobs.</p>
                          </div>
                        ) : realProposals
                          .filter(p => selectedRequestId ? p.jobId === selectedRequestId : true)
                          .filter(p => proposalsFilter === 'all' ? true :
                            proposalsFilter === 'active' ? p.status === 'pending' :
                              proposalsFilter === 'completed' ? ['accepted', 'rejected'].includes(p.status) : true)
                          .map(proposal => (
                            <div key={proposal.id} className="proposal-card">
                              <div className="proposal-header">
                                <div className="artist-info">
                                  <div className="artist-avatar">
                                    <img src="https://via.placeholder.com/60x60" alt={proposal.artistName} />
                                  </div>
                                  <div className="artist-details">
                                    <h4 className="artist-name">{proposal.artistName}</h4>
                                    <div className="artist-stats">
                                      <span className="job-title">For: {proposal.jobTitle}</span>
                                      <span className="duration">Duration: {proposal.duration}</span>
                                      <span className="status">Status: {proposal.status}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="proposal-price">
                                  <span className="price">{proposal.price}</span>
                                  <span className="experience">{proposal.experience}</span>
                                </div>
                              </div>

                              <div className="proposal-content">
                                <p className="proposal-text">{proposal.proposal}</p>

                                <div className="proposal-meta">
                                  <span className="submitted-date">
                                    Submitted: {proposal.submittedAt ? new Date(proposal.submittedAt).toLocaleDateString() : 'N/A'}
                                  </span>
                                  <div className="proposal-actions">
                                    <button className="message-artist-btn">Message Artist</button>
                                    {proposal.status === 'pending' && (
                                      <>
                                        <button
                                          className="reject-btn"
                                          onClick={() => rejectProposal(proposal.id)}
                                          style={{
                                            background: '#e74c3c',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            marginRight: '8px'
                                          }}
                                        >
                                          Reject
                                        </button>
                                        <button
                                          className="accept-btn"
                                          onClick={() => acceptProposal(proposal.id)}
                                          style={{
                                            background: '#27ae60',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          Accept Proposal
                                        </button>
                                      </>
                                    )}
                                    {proposal.status === 'accepted' && (
                                      <span style={{ color: '#27ae60', fontWeight: 'bold' }}>✅ Accepted</span>
                                    )}
                                    {proposal.status === 'rejected' && (
                                      <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>❌ Rejected</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Proposals Tab (full page view) */}
              {activeTab === 'proposals' && (
                <div className="proposals-view">
                  <ProposalsPage />
                </div>
              )}

              {/* Wallet View */}
              {activeTab === 'wallet' && (
                <div className="wallet-section">
                  <div style={{textAlign: 'center'}}>
                    <h2 className="wallet-title" style={{margin: '1rem 0'}}>Payemnts & Receipts</h2>
                    <p className="wallet-subtitle" style={{width: '75%', margin: '0 auto 2rem', fontSize: '1.1rem'}}>Track your deposits and upcoming balances. Remaining payments are due 14 days before each event.</p>
                  </div>

                  {/* Wallet Overview Cards */}
                  {walletLoading ? (
                    <div className="loading-state" style={{ padding: '2rem', textAlign: 'center' }}>
                      <p>Loading wallet data...</p>
                    </div>
                  ) : (
                    <div className="wallet-overview">
                      <div className="wallet-card total-paid">
                        <h3 className="wallet-card-title">Total Paid</h3>
                        <p className="wallet-card-amount green">£{walletData.totalPaid.toFixed(2)}</p>
                      </div>

                      <div className="wallet-card remaining-balance">
                        <h3 className="wallet-card-title">Remaining Balance</h3>
                        <p className="wallet-card-amount orange">£{walletData.remainingBalance.toFixed(2)}</p>
                        {walletData.remainingBalance > 0 && (
                          <button
                            className="withdraw-btn modern-withdraw-btn"
                            onClick={() => setShowWithdrawModal(true)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2L22 7L12 12L2 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                            </svg>
                            Withdraw Funds
                          </button>
                        )}
                      </div>

                      {/* <div className="wallet-card next-payment">
                    <h3 className="wallet-card-title">Next Payment Due</h3>
                    <p className="wallet-card-amount blue">1 Sep 2025</p>
                  </div> */}
                    </div>
                  )}

                  {/* Payment Status Bar */}
                  {/* <div className="payment-status-bar">
                <div className="status-progress">
                  <div className="progress-indicator"></div>
                </div>
                <p className="status-text">Final 50% due soon ⏳</p>
              </div> */}

                  {/* Booking Details */}
                  {/* <div className="wallet-booking-details">
                    <h3 className="booking-details-title">Bridal Mehndi – Oct 10, 2025</h3>

                    <div className="payment-breakdown">
                      <div className="payment-item">
                        <span className="payment-label">Deposit Paid:</span>
                        <span className="payment-value">£250.00 (1 Aug 2025 · Visa 1234)</span>
                      </div>

                      <div className="payment-item">
                        <span className="payment-label">Remaining:</span>
                        <span className="payment-value">£250.00 due 1 Sep 2025</span>
                      </div>
                    </div>

                    <button className="pay-remaining-btn wallet-pay-btn" onClick={() => handlePayRemaining(nextEvent)}>
                      Pay Remaining
                    </button>
                  </div> */}

                  {/* Transaction History */}
                  <div className="transaction-history">
                    <h3 className="section-title">Transaction History</h3>

                    {transactionsLoading ? (
                      <div className="loading-state" style={{ padding: '2rem', textAlign: 'center' }}>
                        <p>Loading transaction history...</p>
                      </div>
                    ) : transactionsError ? (
                      <div className="error-state">
                        <div className="error-icon">⚠️</div>
                        <p>{transactionsError}</p>
                        <button onClick={fetchTransactions} className="retry-btn">Try Again</button>
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">💳</div>
                        <h3>No Transactions Yet</h3>
                        <p>Your transaction history will appear here once you make payments.</p>
                      </div>
                    ) : (
                      <div className="transaction-table">
                        <div className="table-header">
                          <span className="col-event">Event</span>
                          <span className="col-type">Type</span>
                          <span className="col-date">Date</span>
                          <span className="col-amount">Amount</span>
                          <span className="col-method">Method</span>
                          <span className="col-status">Status</span>
                          <span className="col-receipt">Receipt</span>
                        </div>

                        {transactions.map((transaction) => {
                          const formatDate = (dateString) => {
                            const date = new Date(dateString);
                            return date.toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            });
                          };

                          const getTransactionType = (type) => {
                            switch (type) {
                              case 'half': return 'Half Deposit';
                              case 'full': return 'Full Deposit';
                              case 'refund': return 'Refund';
                              case 'admin-fee': return 'Admin Fee';
                              default: return type;
                            }
                          };

                          const getStatus = (type, isSender) => {
                            if (type === 'refund') {
                              return { text: 'Refunded', class: 'refunded' };
                            }
                            if (type === 'admin-fee') {
                              return { text: 'Admin Fee', class: 'admin-fee' };
                            }
                            return { text: 'Paid', class: 'paid' };
                          };

                          const status = getStatus(transaction.transactionType, transaction.isSender);

                          const handleDownloadReceipt = () => {
                            // Create PDF content
                            const pdfContent = `
                              <html>
                                <head>
                                  <title>Receipt - ${transaction.eventName === 'Unknown Event' ? 'Event' : transaction.eventName}</title>
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
                                      <span>${transaction.eventName === 'Unknown Event' ? 'Event' : transaction.eventName}</span>
                                    </div>
                                    <div class="detail-row">
                                      <span>Transaction Type:</span>
                                      <span>${getTransactionType(transaction.transactionType)}</span>
                                    </div>
                                    <div class="detail-row">
                                      <span>Date:</span>
                                      <span>${formatDate(transaction.createdAt)}</span>
                                    </div>
                                    <div class="detail-row">
                                      <span>Amount:</span>
                                      <span>£${transaction.amount.toFixed(2)}</span>
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
                                      <span>Total Paid:</span>
                                      <span>£${transaction.amount.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </body>
                              </html>
                            `;

                            // Create blob and download
                            const blob = new Blob([pdfContent], { type: 'text/html' });
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `receipt-${transaction.eventName ? transaction.eventName.replace(/\s+/g, '-') : 'Event'.replace(/\s+/g, '-')}-${formatDate(transaction.createdAt).replace(/\s+/g, '-')}.html`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                          };

                          return (
                            <div key={transaction._id} className="table-row">
                              <span className="col-event">{transaction.eventName === 'Unknown Event' ? 'Event' : transaction.eventName}</span>
                              <span className="col-type">{getTransactionType(transaction.transactionType)}</span>
                              <span className="col-date">{formatDate(transaction.createdAt)}</span>
                              <span className="col-amount">£{transaction.amount.toFixed(2)}</span>
                              <span className="col-method">Stripe</span>
                              <span className={`col-status ${status.class}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {status.text}
                              </span>
                              <span className="col-receipt">
                                <button className="receipt-btn download" onClick={handleDownloadReceipt} title="Download Receipt">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 15L7 10H10V3H14V10H17L12 15Z" fill="currentColor" />
                                    <path d="M20 18H4V20H20V18Z" fill="currentColor" />
                                  </svg>
                                </button>
                                {/* <button className="receipt-btn email" title="Email Receipt">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor" />
                                  </svg>
                                </button> */}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Invoices & Receipts */}
                  <div className="invoices-receipts">
                    <h3 className="section-title">Invoices & Receipts</h3>

                    <div className="receipts-list">
                      <div className="receipt-item">
                        <div className="receipt-info">
                          <span className="receipt-title">Bridal Mehndi Deposit Receipt</span>
                        </div>
                        <div className="receipt-actions">
                          <button className="receipt-btn download">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 15L7 10H10V3H14V10H17L12 15Z" fill="currentColor" />
                              <path d="M20 18H4V20H20V18Z" fill="currentColor" />
                            </svg>
                          </button>
                          <button className="receipt-btn email">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="receipt-item">
                        <div className="receipt-info">
                          <span className="receipt-title">Final Payment Receipt (Pending)</span>
                        </div>
                        <div className="receipt-actions">
                          <button className="receipt-btn download">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 15L7 10H10V3H14V10H17L12 15Z" fill="currentColor" />
                              <path d="M20 18H4V20H20V18Z" fill="currentColor" />
                            </svg>
                          </button>
                          <button className="receipt-btn email">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="payment-security-info">
                      <div className="security-item">
                        <div className="security-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="#f39c12" strokeWidth="2" fill="none" />
                            <path d="M9 12L11 14L15 10" stroke="#f39c12" strokeWidth="2" fill="none" />
                          </svg>
                        </div>
                        <span className="security-text">All payments are securely processed via Stripe.</span>
                      </div>

                      <div className="security-item">
                        <div className="security-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="#f39c12" strokeWidth="2" fill="none" />
                            <polyline points="14,2 14,8 20,8" stroke="#f39c12" strokeWidth="2" fill="none" />
                            <line x1="16" y1="13" x2="8" y2="13" stroke="#f39c12" strokeWidth="2" />
                            <line x1="16" y1="17" x2="8" y2="17" stroke="#f39c12" strokeWidth="2" />
                            <polyline points="10,9 9,9 8,9" stroke="#f39c12" strokeWidth="2" fill="none" />
                          </svg>
                        </div>
                        <span className="security-text">Refunds and cancellations follow our <span className="policy-link">policy</span>.</span>
                      </div>
                    </div>
                  </div>

                  {/* Saved Payment Methods */}
                  {/* <div className="saved-payment-methods">
                    <h3 className="section-title">Saved Payment Methods</h3>

                    <div className="payment-methods-list">
                      <div className="payment-method-item active">
                        <div className="method-info">
                          <div className="method-icon visa">
                            <svg width="24" height="16" viewBox="0 0 40 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect width="40" height="26" rx="4" fill="#1434CB" />
                              <path d="M16.3 7.8H13.6L12 18.2H14.7L16.3 7.8Z" fill="white" />
                              <path d="M23.7 8C23.1 7.8 22.2 7.6 21.1 7.6C18.5 7.6 16.7 8.9 16.7 10.8C16.7 12.2 18 12.9 19 13.4C20 13.8 20.4 14.1 20.4 14.6C20.4 15.3 19.5 15.6 18.7 15.6C17.5 15.6 16.9 15.4 15.9 14.9L15.5 14.7L15.1 17.4C15.8 17.7 17.1 18 18.4 18C21.2 18 22.9 16.7 22.9 14.7C22.9 13.6 22.3 12.8 20.9 12.1C19.9 11.6 19.3 11.3 19.3 10.7C19.3 10.2 19.9 9.7 21.2 9.7C22.2 9.7 22.9 9.9 23.4 10.1L23.7 10.2L24.1 7.6L23.7 8Z" fill="white" />
                              <path d="M29.6 7.8H27.5C26.8 7.8 26.3 8 26 8.7L22.3 18.2H25.1L25.7 16.6H29L29.4 18.2H31.8L29.6 7.8ZM26.5 14.4L27.8 11L28.5 14.4H26.5Z" fill="white" />
                              <path d="M11.8 7.8L9.2 15.6L8.9 14.1C8.4 12.4 6.9 10.5 5.2 9.6L7.6 18.2H10.4L14.6 7.8H11.8Z" fill="white" />
                            </svg>
                          </div>
                          <span className="method-text">Visa ending in 1234</span>
                        </div>
                        <div className="method-status verified">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="#27ae60" />
                            <path d="M8 12L10.5 14.5L16 9" stroke="white" strokeWidth="2" fill="none" />
                          </svg>
                        </div>
                      </div>

                      <div className="payment-method-item disabled">
                        <div className="method-info">
                          <div className="method-icon apple">
                            <svg width="20" height="24" viewBox="0 0 384 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M318.7 268.7C315.4 283.7 306.4 296.9 295.4 306.5C275.2 324.7 249.4 334.7 222.9 334.7C180.7 334.7 138.1 334.7 95.9 334.7C73.2 334.7 52.4 324.1 35.1 306.5C24.1 296.9 15.1 283.7 11.8 268.7C4.1 239.1 4.1 207.9 11.8 178.3C15.1 163.3 24.1 150.1 35.1 140.5C52.4 122.9 73.2 112.3 95.9 112.3C138.1 112.3 180.7 112.3 222.9 112.3C249.4 112.3 275.2 122.3 295.4 140.5C306.4 150.1 315.4 163.3 318.7 178.3C326.4 207.9 326.4 239.1 318.7 268.7Z" fill="#000000" />
                              <path d="M267.2 152.5C258.9 143.5 248.1 139.9 236.8 141.3C235.1 155.2 239.5 169.4 248.1 179.8C256.2 189.6 267.6 194.5 278.6 193.6C280.8 179.6 275.7 163.5 267.2 152.5Z" fill="#000000" />
                              <path d="M310.6 304.2C308.4 309.8 305.8 314.8 302.8 319.3C297.1 328.4 290.5 335.3 282.9 335.3C278.6 335.3 273.0 333.8 266.2 330.8C259.5 327.7 251.1 326.2 242.2 326.2C232.8 326.2 223.9 327.9 216.7 331.2C208.9 334.8 202.8 336.6 198.4 336.6C189.7 336.6 182.6 329.2 176.4 319.3C168.9 307.3 163.7 292.4 160.9 276.7C157.8 259.2 157.8 242.5 160.9 226.8C164.7 207.1 172.9 190.8 185.1 178.5C194.4 169.1 206.1 164.3 219.1 164.5C224.7 164.6 231.3 166.1 239.1 169.0C246.8 171.8 252.5 173.3 256.1 173.3C258.8 173.3 263.5 171.9 270.1 169.0C276.8 166.1 284.8 164.6 294.1 164.5C304.8 164.6 314.5 167.4 322.9 172.9C313.7 179.1 308.6 188.2 307.1 199.2C308.2 211.8 312.4 222.5 319.7 231.1C323.2 235.1 327.1 238.6 331.4 241.5C329.8 246.0 327.9 250.3 325.7 254.4C321.6 262.2 316.7 268.7 310.6 304.2Z" fill="#000000" />
                            </svg>
                          </div>
                          <span className="method-text">Apple Pay (Coming Soon)</span>
                        </div>
                      </div>

                      <div className="payment-method-item disabled">
                        <div className="method-info">
                          <div className="method-icon paypal">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.98-.15c-.291-.016-.615-.024-.973-.024H15.83c-.524 0-.968.382-1.05.9L13.856 12.5c-.082.518.302.9.825.9h2.38c3.256 0 5.739-1.194 6.825-4.657.516-1.647.402-3.051-.164-4.326z" fill="#253B80" />
                              <path d="M6.739 6.53c-.082.518.302.9.825.9h2.38c3.256 0 5.739-1.194 6.825-4.657.516-1.647.402-3.051-.164-4.326A3.35 3.35 0 0 0 15.625-.703c-.291-.016-.615-.024-.973-.024H10.214c-.524 0-.968.382-1.05.9L6.739 6.53z" fill="#179BD7" />
                              <path d="M6.914 6.53c-.082.518.302.9.825.9h2.38c3.256 0 5.739-1.194 6.825-4.657.516-1.647.402-3.051-.164-4.326-.203-.464-.474-.8-.812-1.029C16.445 3.05 15.831 6.468 6.914 6.53z" fill="#222D65" />
                            </svg>
                          </div>
                          <span className="method-text">PayPal (Coming Soon)</span>
                        </div>
                      </div>

                      <div className="payment-method-item add-new">
                        <div className="method-info">
                          <div className="method-icon add">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                              <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" />
                              <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" />
                            </svg>
                          </div>
                          <span className="method-text">Add New Card</span>
                        </div>
                      </div>
                    </div>
                  </div> */}
                </div>
              )}

              {/* Reviews View */}
              {activeTab === 'reviews' && (
                <div className="reviews-section">
                  <div className="reviews-header">
                    <h2 className="reviews-title">Your Mehndi Reviews</h2>
                    <p className="reviews-subtitle">Share your experience and help others book their perfect artist with confidence.</p>
                    <div className="review-filters">
                      <button
                        className={`review-filter ${reviewsFilter === 'pending' ? 'active' : ''}`}
                        onClick={() => setReviewsFilter('pending')}
                      >
                        Pending
                      </button>
                      <button
                        className={`review-filter ${reviewsFilter === 'completed' ? 'active' : ''}`}
                        onClick={() => setReviewsFilter('completed')}
                      >
                        Completed
                      </button>
                    </div>
                  </div>

                  {/* <div className="reviews-stats">
                <div className="stats-card">
                  <h3>Total Reviews</h3>
                  <span className="stats-number">{(completedBookings.length - notRatedBookings.length)}</span>
                </div>
                <div className="stats-card">
                  <h3>Pending Reviews</h3>
                  <span className="stats-number">{notRatedBookings.length}</span>
                </div>
              </div> */}

                  <div className="completed-bookings">
                    {completedBookings
                      .filter(b => reviewsFilter === 'pending' ? !b.rated : b.rated)
                      .map(booking => (
                        <div key={booking._id} className="review-card">
                          <div className="review-card__content">
                            <h4 className="review-card__title">Henna By {booking.assignedArtist[0] && booking.assignedArtist[0].firstName + ' ' + booking.assignedArtist[0].lastName}</h4>
                            <p className="review-card__date">{new Date(booking.eventDate).toLocaleDateString('en-GB')}</p>
                            {booking.rated ? (
                              <p className="review-card__text">{getEventTitleGlobal(booking.eventType, booking.otherEventType)} booking reviewed on {new Date(booking.updatedAt || booking.eventDate).toLocaleDateString('en-GB')}.</p>
                            ) : (
                              <p className="review-card__text">{getEventTitleGlobal(booking.eventType, booking.otherEventType)} package completed — awaiting your review.</p>
                            )}

                            {booking.rated ? (
                              <span className="review-card__status">Reviewed</span>
                            ) : (
                              <button
                                className="leave-review-btn"
                                onClick={() => openReviewModal(booking)}
                              >
                                Leave a Review
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>

                  {reviewModalOpen && (
                    <div className="modal-overlay" onClick={closeReviewModal}>
                      <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                          <h3 className="modal-title">Write a Review</h3>
                          <button className="modal-close" onClick={closeReviewModal}>×</button>
                        </div>
                        <div className="modal-body">
                          <div className="form-group">
                            <label>Rating</label>
                            <div className="review-rating">
                              {[1, 2, 3, 4, 5].map(n => (
                                <span key={n} className={`star ${n <= reviewRating ? 'filled' : ''}`} onClick={() => setReviewRating(n)}>⭐</span>
                              ))}
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Comment</label>
                            <textarea rows="4" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button className="btn-secondary" onClick={closeReviewModal}>Cancel</button>
                          <button className="btn-primary" onClick={submitReview} disabled={reviewRating < 1 || reviewComment.trim().length === 0}>Submit Review</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* View Review Details Modal */}
                  {viewReviewModal && viewReviewData && (
                    <div className="modal-overlay" onClick={() => setViewReviewModal(false)}>
                      <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                          <h3 className="modal-title">Review Details</h3>
                          <button className="modal-close" onClick={() => setViewReviewModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                          {/* Booking Information */}
                          <div className="booking-info" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <div className="artist-section">
                              <div className="artist-avatar" style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', marginRight: '15px', display: 'inline-block', verticalAlign: 'top' }}>
                                <img src={viewReviewData.booking?.assignedArtist?.userProfileImage || 'https://via.placeholder.com/60x60'} alt="Artist" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                              <div style={{ display: 'inline-block', verticalAlign: 'top' }}>
                                <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: '600' }}>
                                  {viewReviewData.booking?.assignedArtist ? `${viewReviewData.booking.assignedArtist.firstName || ''} ${viewReviewData.booking.assignedArtist.lastName || ''}` : 'Artist'}
                                </h4>
                                <p style={{ margin: '0 0 3px 0', fontSize: '14px', color: '#666' }}>{getEventTitleGlobal(viewReviewData.booking?.eventType, viewReviewData.booking?.otherEventType)}</p>
                                <p style={{ margin: '0', fontSize: '13px', color: '#888' }}>{viewReviewData.booking?.eventDate ? new Date(viewReviewData.booking.eventDate).toLocaleDateString('en-GB') : ''}</p>
                              </div>
                            </div>
                          </div>

                          {/* Rating */}
                          <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333' }}>Rating</label>
                            <div className="review-rating" style={{ fontSize: '24px' }}>
                              {[1, 2, 3, 4, 5].map(n => (
                                <span key={n} className={`star ${n <= viewReviewData.rating ? 'filled' : ''}`} style={{ color: n <= viewReviewData.rating ? '#ffc107' : '#ddd', marginRight: '5px' }}>⭐</span>
                              ))}
                              <span style={{ marginLeft: '10px', fontSize: '16px', color: '#666' }}>({viewReviewData.rating}/5)</span>
                            </div>
                          </div>

                          {/* Comment */}
                          <div className="form-group">
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333' }}>Your Review</label>
                            <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', color: '#333', lineHeight: '1.6', fontSize: '14px' }}>
                              {viewReviewData.comment}
                            </div>
                          </div>

                          {/* Review Date */}
                          {viewReviewData.createdAt && (
                            <div style={{ marginTop: '15px', fontSize: '13px', color: '#888', textAlign: 'right' }}>
                              Reviewed on {new Date(viewReviewData.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                          )}
                        </div>
                        <div className="modal-footer">
                          <button className="btn-primary" onClick={() => setViewReviewModal(false)}>Close</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Messages View */}
              {activeTab === 'messages' && (
                <div className="messages-section">
                  <div className="messages-container">
                    {/* Conversations List */}
                    <div className="conversations-sidebar">
                      <div className="conversations-header">
                        <h3 className="conversations-title">Messages</h3>
                        <div className="conversations-count">
                          {conversations.reduce((total, conv) => total + conv.unreadCount, 0)} unread
                        </div>
                      </div>

                      <div className="conversations-list">
                        {conversations.map(conversation => (
                          <div
                            key={conversation._id || conversation.id}
                            className={`conversation-item ${((selectedConversation?._id || selectedConversation?.id) === (conversation._id || conversation.id)) ? 'active' : ''}`}
                            onClick={() => handleSelectConversation(conversation)}
                          >
                            <div className="conversation-avatar">
                              <img src={(conversation.artist?.userProfileImage) || conversation.artistImage || DEFAULT_AVATAR} alt={conversation.artistName || 'User'} />
                              {(() => {
                                const otherId = conversation.artist?._id || conversation.artistId || conversation.id;
                                const online = otherId ? onlineUserIds.has(String(otherId)) : false;
                                return <div className={`status-indicator ${online ? 'online' : 'offline'}`}></div>;
                              })()}
                            </div>

                            <div className="conversation-info">
                              <div className="conversation-header">
                                <h4 className="artist-name">{conversation.artistName || (conversation.artist ? `${conversation.artist.firstName} ${conversation.artist.lastName}` : 'User')}</h4>
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
                            <div className="chat-artist-info">
                              <img src={(selectedConversation.artist?.userProfileImage) || selectedConversation.artistImage || DEFAULT_AVATAR} alt={selectedConversation.artistName || (selectedConversation.artist ? `${selectedConversation.artist.firstName} ${selectedConversation.artist.lastName}` : 'User')} />
                              <div>
                                <h3>{selectedConversation.artistName || (selectedConversation.artist ? `${selectedConversation.artist.firstName} ${selectedConversation.artist.lastName}` : 'User')}</h3>
                                {(() => {
                                  const otherId = selectedConversation.artist?._id || selectedConversation.artistId || selectedConversation.id;
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
                                className={`message ${String(message.sender) === String(user?._id) || message.senderId === 'user' ? 'sent' : 'received'}`}
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
                              <button className="attachment-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M21.44 11.05L12.25 20.24a6 6 0 1 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.42 17.41a2 2 0 1 1-2.83-2.83l8.49-8.49" stroke="currentColor" strokeWidth="2" fill="none" />
                                </svg>
                              </button>

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
                          <p>Choose a conversation from the sidebar to start messaging with artists.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'bookings' && (
                <div className="bookings-tab-section">
                  <div className="bookings-tab-header">
                    <h2 className="bookings-tab-title">All Bookings</h2>
                    <div className="bookings-summary">
                      <div className="summary-stat">
                        <span className="stat-number">{allBookings.length}</span>
                        <span className="stat-label">Total</span>
                      </div>
                      <div className="summary-stat">
                        <span className="stat-number">{allBookings.filter(b => b.status === 'confirmed' || b.status === 'pending' || b.status === 'in_progress').length}</span>
                        <span className="stat-label">Upcoming</span>
                      </div>
                      <div className="summary-stat">
                        <span className="stat-number">{allBookings.filter(b => b.status === 'completed').length}</span>
                        <span className="stat-label">Completed</span>
                      </div>
                    </div>
                  </div>

                  {bookingsLoading ? (
                    <div className="loading-state">
                      <div className="loading-spinner">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="31.416">
                            <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite" />
                            <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite" />
                          </circle>
                        </svg>
                      </div>
                      <p>Loading your bookings...</p>
                    </div>
                  ) : bookingsError ? (
                    <div className="error-state">
                      <div className="error-icon">⚠️</div>
                      <p>{bookingsError}</p>
                      <button onClick={fetchBookings} className="retry-btn">Try Again</button>
                    </div>
                  ) : allBookings.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">📅</div>
                      <h3>No Bookings Yet</h3>
                      <p>You haven't made any bookings yet. Start by creating your first mehndi appointment!</p>
                      <Link to="/booking" className="btn-primary">Book Your First Appointment</Link>
                    </div>
                  ) : (
                    <div className="bookings-list">
                      {allBookings.map(booking => {
                        const getEventTitle = (eventType, otherEventType) => {
                          if (eventType && eventType.length > 0) {
                            const types = eventType.join(', ');
                            return otherEventType ? `${types} - ${otherEventType}` : types;
                          }
                          return otherEventType || 'Mehndi Booking';
                        };

                        const getArtistName = (assignedArtist) => {
                          if (assignedArtist && assignedArtist.firstName) {
                            return `${assignedArtist.firstName} ${assignedArtist.lastName}`;
                          }
                          return 'TBD - No artist assigned yet';
                        };

                        const formatDate = (dateString) => {
                          const date = new Date(dateString);
                          return date.toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          });
                        };

                        const getStatusBadge = (status) => {
                          const statusConfig = {
                            pending: { class: 'pending', text: 'Pending' },
                            confirmed: { class: 'confirmed', text: 'Confirmed' },
                            in_progress: { class: 'in-progress', text: 'In Progress' },
                            completed: { class: 'completed', text: 'Completed' },
                            cancelled: { class: 'cancelled', text: 'Cancelled' }
                          };
                          const config = statusConfig[status] || statusConfig.pending;
                          return <span className={`status-badge ${config.class}`}>{config.text}</span>;
                        };

                        return (
                          <div key={booking._id} className="booking-item">
                            <div className="booking-item-header">
                              <h4 className="booking-item-title">{getEventTitle(booking.eventType, booking.otherEventType)}</h4>
                              {getStatusBadge(booking.status)}
                            </div>
                            <div className="booking-item-details">
                              <p><strong>Artist:</strong> {getArtistName(booking.assignedArtist)}</p>
                              <p><strong>Date:</strong> {formatDate(booking.eventDate)}</p>
                              <p><strong>Location:</strong> {booking.location}</p>
                              <p><strong>Budget:</strong> £{booking.minimumBudget} - £{booking.maximumBudget}</p>
                            </div>
                            <div className="booking-item-actions">
                              <Link to="/dashboard/bookings" className="view-details-btn">View Details</Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Profile View */}
              {activeTab === 'profile' && (
                <div className="profile-tab-section">
                  <ClientProfile />
                </div>
              )}
            </div>

            {/* Bottom Navigation Tabs */}
            {/* <div className="dashboard-bottom-nav">
          <div className={`nav-tab ${activeTab === 'wallet' ? 'active' : ''}`} onClick={() => handleTabChange('wallet')}>
            <div className="nav-tab-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              <span className="nav-tab-number">1</span>
            </div>
            <h3 className="nav-tab-title">Wallet / Payments</h3>
          </div>

          <div className={`nav-tab ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => handleTabChange('reviews')}>
            <div className="nav-tab-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
              <span className="nav-tab-number">2</span>
            </div>
            <h3 className="nav-tab-title">Reviews</h3>
          </div>

          <div className={`nav-tab ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => handleTabChange('messages')}>
            <div className="nav-tab-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="nav-tab-number">3</span>
            </div>
            <h3 className="nav-tab-title">Messages</h3>
          </div>
        </div> */}

            {/* Payment Modal */}
            {showPaymentModal && selectedBookingForPayment && (
              <div className="modal-overlay" onClick={handleClosePaymentModal}>
                <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2 className="modal-title">Complete Your Payment</h2>
                    <button className="modal-close" onClick={handleClosePaymentModal}>
                      ×
                    </button>
                  </div>

                  <div className="modal-content">
                    <div className="payment-details">
                      <div className="payment-amount">
                        <span className="amount-label">Amount Dues:</span>
                        <span className="amount-value">£{selectedBookingForPayment.remainingPayment}</span>
                      </div>

                      <div className="payment-info">
                        <p>You will be redirected to Stripe to complete your payment securely.</p>
                      </div>
                    </div>

                    <div className="modal-actions">
                      <button className="cancel-btn" onClick={handleClosePaymentModal}>
                        Cancel
                      </button>
                      <button className="confirm-pay-btn" onClick={handleConfirmPayment}>
                        Proceed to Payment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Review Modal */}
            {showReviewModal && (
              <div className="modal-overlay">
                <div className="review-modal">
                  <div className="modal-header">
                    <h3 className="modal-title">Write a Review</h3>
                    <button className="modal-close" onClick={handleCloseReviewModal}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </button>
                  </div>

                  {selectedBooking && (
                    <div className="modal-content">
                      <div className="booking-info">
                        <div className="artist-info">
                          <img src={selectedBooking.artistImage} alt={selectedBooking.artist} className="artist-photo" />
                          <div>
                            <h4>{selectedBooking.artist}</h4>
                            <p>{selectedBooking.title}</p>
                            <p>{selectedBooking.date}</p>
                          </div>
                        </div>
                      </div>

                      <div className="review-form">
                        {/* Rating Section */}
                        <div className="form-group">
                          <label className="form-label">Overall Rating</label>
                          <div className="rating-stars">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                type="button"
                                className={`star-btn ${star <= reviewData.rating ? 'active' : ''}`}
                                onClick={() => handleRatingChange(star)}
                              >
                                ⭐
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Review Title */}
                        <div className="form-group">
                          <label className="form-label">Review Title</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Summary of your experience"
                            value={reviewData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                          />
                        </div>

                        {/* Review Comment */}
                        <div className="form-group">
                          <label className="form-label">Your Review</label>
                          <textarea
                            className="form-textarea"
                            placeholder="Tell others about your experience with this artist..."
                            rows="4"
                            value={reviewData.comment}
                            onChange={(e) => handleInputChange('comment', e.target.value)}
                          />
                        </div>

                        {/* Image Upload */}
                        <div className="form-group">
                          <label className="form-label">Add Photos (Optional)</label>
                          <div className="image-upload-section">
                            <div className="image-upload-area">
                              <input
                                type="file"
                                id="image-upload"
                                multiple
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="file-input"
                              />
                              <label htmlFor="image-upload" className="upload-label">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M14.2857 5.71429H9.71429C9.32 5.71429 9 6.03429 9 6.42857V9H15V6.42857C15 6.03429 14.68 5.71429 14.2857 5.71429Z" fill="currentColor" />
                                  <path d="M18 7.71429V17.1429C18 18.1543 17.1543 19 16.1429 19H7.85714C6.84571 19 6 18.1543 6 17.1429V7.71429H18ZM16.5 9.42857H7.5V17.1429C7.5 17.325 7.675 17.5 7.85714 17.5H16.1429C16.325 17.5 16.5 17.325 16.5 17.1429V9.42857Z" fill="currentColor" />
                                  <path d="M12 11.5714L8.78571 14.7857H15.2143L12 11.5714Z" fill="currentColor" />
                                </svg>
                                <span>Click to add photos</span>
                                <small>Upload up to 5 images</small>
                              </label>
                            </div>

                            {reviewData.images.length > 0 && (
                              <div className="uploaded-images">
                                {reviewData.images.map((image, index) => (
                                  <div key={index} className="image-preview">
                                    <img src={image} alt={`Upload ${index + 1}`} />
                                    <button
                                      type="button"
                                      className="remove-image"
                                      onClick={() => handleRemoveImage(index)}
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="modal-actions">
                        <button className="cancel-btn" onClick={handleCloseReviewModal}>
                          Cancel
                        </button>
                        <button
                          className="submit-review-btn"
                          onClick={handleSubmitReview}
                          disabled={reviewData.rating === 0 || !reviewData.comment.trim()}
                        >
                          Submit Review
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Withdraw Modal */}
            {showWithdrawModal && (
              <div className="modal-overlay modern-modal-overlay">
                <div className="modal-content modern-withdraw-modal">
                  <div className="modal-header modern-modal-header">
                    <div className="modal-title-section">
                      <div className="withdraw-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L22 7L12 12L2 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                          <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="modal-title">Withdraw Funds</h2>
                        <p className="modal-subtitle">Transfer money to your bank account</p>
                      </div>
                    </div>
                    <button className="close-btn modern-close-btn" onClick={() => setShowWithdrawModal(false)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>

                  <div className="modal-body modern-modal-body">
                    <div className="balance-display">
                      <div className="balance-info">
                        <span className="balance-label">Available Balance</span>
                        <span className="balance-amount">£{walletData.remainingBalance.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="withdraw-form">
                      <div className="form-group modern-form-group">
                        <label htmlFor="withdrawAmount" className="modern-label">Withdrawal Amount</label>
                        <div className="amount-input-container">
                          <span className="currency-symbol">£</span>
                          <input
                            type="number"
                            id="withdrawAmount"
                            step="0.01"
                            min="1"
                            max={walletData.remainingBalance}
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder="0.00"
                            className="modern-amount-input"
                          />
                        </div>
                        <div className="quick-amounts">
                          <button
                            type="button"
                            className="quick-amount-btn"
                            onClick={() => setWithdrawAmount((walletData.remainingBalance * 0.25).toFixed(2))}
                          >
                            25%
                          </button>
                          <button
                            type="button"
                            className="quick-amount-btn"
                            onClick={() => setWithdrawAmount((walletData.remainingBalance * 0.5).toFixed(2))}
                          >
                            50%
                          </button>
                          <button
                            type="button"
                            className="quick-amount-btn"
                            onClick={() => setWithdrawAmount((walletData.remainingBalance * 0.75).toFixed(2))}
                          >
                            75%
                          </button>
                          <button
                            type="button"
                            className="quick-amount-btn"
                            onClick={() => setWithdrawAmount(walletData.remainingBalance.toFixed(2))}
                          >
                            Max
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="withdraw-info-card">
                      <div className="info-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                          <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Funds will be transferred to your bank account via Stripe</span>
                      </div>
                      <div className="info-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                          <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Processing time: 2-3 business days</span>
                      </div>
                    </div>
                  </div>

                  <div className="modal-actions modern-modal-actions">
                    <button
                      className="cancel-btn modern-cancel-btn"
                      onClick={() => {
                        setShowWithdrawModal(false);
                        setWithdrawAmount('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="confirm-withdraw-btn modern-confirm-btn"
                      onClick={handleWithdraw}
                      disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > walletData.remainingBalance || withdrawLoading}
                    >
                      {withdrawLoading ? (
                        <>
                          <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                            <path d="M12 2C13.3132 2 14.6136 2.25866 15.8268 2.7612C17.0401 3.26375 18.1425 4.00035 19.0711 4.92893C19.9997 5.85752 20.7362 6.95991 21.2388 8.17317C21.7413 9.38642 22 10.6868 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L22 7L12 12L2 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                          </svg>
                          Withdraw £{withdrawAmount || '0.00'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientDashboard; 