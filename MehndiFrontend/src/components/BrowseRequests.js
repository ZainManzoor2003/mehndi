import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaMapMarkerAlt, FaClock, FaCalendarAlt, FaUsers, FaPoundSign, FaSearch } from 'react-icons/fa';
import { FiFilter } from 'react-icons/fi';
import { bookingsAPI, applicationsAPI, chatAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import BrowseViewBookingModal from './modals/BrowseViewBookingModal';
import BrowseApplyModal from './modals/BrowseApplyModal';

const CITY_OPTIONS = ['London', 'Birmingham', 'Manchester', 'Bradford'];

function timeAgo(iso) {
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  } catch {
    return '';
  }
}

const BrowseRequests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState({}); // bookingId -> boolean
  const [viewOpen, setViewOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);
  const [viewForm, setViewForm] = useState(null);
  const [applyBusy, setApplyBusy] = useState(false);
  const [viewClientId, setViewClientId] = useState(null);

  useEffect(() => {
    // scroll to top quickly on mount
    try { window.scrollTo(0, 0); } catch { }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError('');
      try {
        const [allRes, savedRes, myAppliedRes] = await Promise.all([
          bookingsAPI.getAllBookings(),
          bookingsAPI.getSavedBookings(),
          applicationsAPI.getMyAppliedBookings()
        ]);
        const savedSet = new Set((savedRes?.data || []).map(b => b._id));
        const appliedIds = new Set(((myAppliedRes?.data) || []).map(a => a.bookingId || a.id || a.booking_id));
        const artistId = user?._id;
        console.log('all results', allRes)
        const combined = (allRes?.data || [])
          .filter(b => {
            if(b.status==='pending' || b.status==='in_progress'){
            if (appliedIds.has(String(b._id))) return false;
            const applied = Array.isArray(b.appliedArtists) && artistId ? b.appliedArtists.some(id => String(id) === String(artistId)) : false;
            const assigned = Array.isArray(b.assignedArtist) && artistId ? b.assignedArtist.some(id => String(id) === String(artistId)) : false;
            return !applied && !assigned;
            }
          })
          .map(b => ({ ...b, __saved: savedSet.has(b._id) }));
        setAll(combined);
        console.log('combined', combined)
      } catch (e) {
        setError(e.message || 'Failed to load requests');
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter(b => {
      const matchesQ = !q || [b.firstName, b.lastName, b.location, ...(b.eventType || [])].join(' ').toLowerCase().includes(q);
      const matchesCity = !city || (b.city || b.location || '').toLowerCase().includes(city.toLowerCase());
      const matchesCat = !category || (Array.isArray(b.eventType) && b.eventType.includes(category));
      return matchesQ && matchesCity && matchesCat;
    });
  }, [all, search, city, category]);

  const toggleSave = async (bookingId, saved) => {
    try {
      setSaving(s => ({ ...s, [bookingId]: true }));
      if (saved) await bookingsAPI.unsaveBooking(bookingId); else await bookingsAPI.saveBooking(bookingId);
      setAll(list => list.map(b => b._id === bookingId ? { ...b, __saved: !saved } : b));
    } catch (e) {
      alert(e.message || 'Failed to update');
    } finally {
      setSaving(s => ({ ...s, [bookingId]: false }));
    }
  };

  const openView = async (bookingId) => {
    try {
      const res = await bookingsAPI.getBooking(bookingId);
      const b = res.data || {};
      setActiveBooking(b);
      const eventTypeValue = Array.isArray(b.eventType) ? b.eventType[0] : b.eventType || '';
      const timeSlotValue = Array.isArray(b.preferredTimeSlot) ? b.preferredTimeSlot[0] : b.preferredTimeSlot || '';
      let travelPreference;
      if (b.artistTravelsToClient === 'both' || b.artistTravelsToClient === 'Both') travelPreference = 'both';
      else if (b.artistTravelsToClient === true || b.artistTravelsToClient === 'yes') travelPreference = 'yes';
      else travelPreference = 'no';
      setViewForm({
        firstName: b.firstName || '',
        lastName: b.lastName || '',
        email: b.email || '',
        eventType: eventTypeValue,
        otherEventType: b.otherEventType || '',
        eventDate: b.eventDate ? new Date(b.eventDate).toISOString().substring(0, 10) : '',
        preferredTimeSlot: timeSlotValue,
        location: b.location || '',
        artistTravelsToClient: travelPreference,
        venueName: b.venueName || '',
        minimumBudget: b.minimumBudget ?? '',
        maximumBudget: b.maximumBudget ?? '',
        duration: b.duration ?? 3,
        numberOfPeople: b.numberOfPeople ?? '',
        designStyle: b.designStyle || '',
        designInspiration: Array.isArray(b.designInspiration) ? b.designInspiration : (b.designInspiration ? [b.designInspiration] : []),
        coveragePreference: b.coveragePreference || '',
        additionalRequests: b.additionalRequests || ''
      });
      try { setViewClientId(b.clientId?._id || b.clientId || null); } catch { }
      setViewOpen(true);
    } catch (e) {
      alert(e.message || 'Failed to load booking');
    }
  };

  const openApply = async (bookingId) => {
    try {
      const res = await bookingsAPI.getBooking(bookingId);
      setActiveBooking(res.data);
      setApplyOpen(true);
    } catch (e) {
      alert(e.message || 'Failed to load booking');
    }
  };

  const confirmApply = async (extras = {}) => {
    if (!activeBooking?._id) return;
    try {
      setApplyBusy(true);
      const artistDetails = {
        proposedBudget: parseFloat(extras.proposedBudget),
        estimatedDuration: { value: parseFloat(extras.duration), unit: 'hours' },
        availability: { isAvailableOnDate: true, canTravelToLocation: true, travelDistance: '' },
        experience: { relevantExperience: '', yearsOfExperience: '', portfolioHighlights: '' },
        proposal: { message: extras.message || '', whyInterested: '', additionalNotes: '' },
        terms: { agreedToTerms: !!extras.agreed }
      };
      await applicationsAPI.applyToBooking(activeBooking._id, artistDetails);
      // Do not navigate away; modal will show success state
    } catch (e) {
      alert(e.message || 'Failed to apply');
    } finally {
      setApplyBusy(false);
    }
  };

  const handleMessageClient = async () => {
    try {
      const clientId = viewClientId || activeBooking?.clientId?._id || activeBooking?.clientId;
      const artistId = user?._id;
      if (!clientId || !artistId) return;
      const res = await chatAPI.ensureChat(clientId, artistId);
      if (res.success && res.data && res.data._id) {
        navigate(`/artist-dashboard/messages?chatId=${res.data._id}`);
      }
    } catch (e) {
      alert(e.message || 'Failed to start chat');
    }
  };

  return (
    <section style={{ padding: '26px 0 60px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
        <button onClick={() => navigate('/artist-dashboard')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', background: 'transparent', color: '#5C3D2E', cursor: 'pointer', fontWeight: 700, marginBottom: 8 }}>
          ← Go Back to Dashboard
        </button>
        <h1 style={{ fontSize: 36, margin: 0, color: '#1f2937' }}>Browse Client Requests <span role="img" aria-label="leaf">🌿</span></h1>
        <p style={{ marginTop: 6, color: '#4b5563' }}>Discover mehndi opportunities near you and apply to the ones that inspire you.</p>

        {/* Filters */}
        {/* Row 1: Search only */}
        <div style={{ marginTop: 14 }}>
          <div style={{ position: 'relative' }}>
            <FaSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
            <input
              placeholder="Search by event or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '12px 14px 12px 40px', borderRadius: 12, border: '1px solid #d1d5db' }}
            />
          </div>
        </div>
        {/* Row 2: City and Category */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div style={{ position: 'relative' }}>
            <FiFilter style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#374151' }} />
            <select value={city} onChange={(e) => setCity(e.target.value)} style={{ width: '100%', padding: '12px 14px 12px 40px', borderRadius: 12, border: '1px solid #d1d5db' }}>
              <option value="">Filter by City</option>
              {CITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ position: 'relative' }}>
            <FiFilter style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#374151' }} />
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '12px 14px 12px 40px', borderRadius: 12, border: '1px solid #d1d5db' }}>
              <option value="">Filter by Category</option>
              <option>Wedding</option>
              <option>Festival</option>
              <option>Eid</option>
              <option>Party</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ marginTop: 24 }}>Loading...</div>
        ) : error ? (
          <div style={{ marginTop: 24, color: 'crimson' }}>{error}</div>
        ) : (
          filtered.length === 0 ? (
            <div style={{
              marginTop: 24,
              background: '#F3E2BF',
              border: '1px solid #edd6b3',
              borderRadius: 14,
              padding: '28px 20px',
              textAlign: 'center',
              color: '#4A2C1D'
            }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>No bookings found</div>
              <p style={{ marginTop: 6, color: '#6b5544' }}>Try adjusting your search, city, or category filters to discover more client requests.</p>
            </div>
          ) : (
            <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {filtered.map(b => (
                <div key={b._id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700 }}>{`${b.designStyle || 'Mehndi'} in ${b.city || b.location || ''}`}</div>
                    <button onClick={() => toggleSave(b._id, b.__saved)} disabled={!!saving[b._id]} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      {b.__saved ? <FaHeart color="#b45309" /> : <FaRegHeart color="#b45309" />}
                    </button>
                  </div>
                  <div style={{ marginTop: 10, display: 'grid', gap: 6, color: '#374151', fontSize: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FaCalendarAlt color="#c2410c" /> {new Date(b.eventDate).toLocaleDateString()} <FaClock style={{ marginLeft: 10 }} color="#c2410c" /> {Array.isArray(b.preferredTimeSlot) ? b.preferredTimeSlot.join(', ') : b.preferredTimeSlot}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FaMapMarkerAlt color="#c2410c" /> {(b.city ? `${b.city}, ` : '') + (b.location || '')}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FaUsers color="#c2410c" /> Group Size: {b.numberOfPeople}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FaPoundSign color="#c2410c" /> Budget: £{b.minimumBudget}–£{b.maximumBudget}</div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>Posted {timeAgo(b.createdAt)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                    <button onClick={() => openView(b._id)} style={{ background: '#5C3D2E', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>View Details</button>
                    <button onClick={() => openApply(b._id)} style={{ background: '#b45309', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Apply to Booking</button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
      <BrowseViewBookingModal open={viewOpen} viewForm={viewForm} onClose={() => setViewOpen(false)} onApply={() => { setViewOpen(false); setApplyOpen(true); }} onMessage={handleMessageClient} />
      <BrowseApplyModal open={applyOpen} busy={applyBusy} booking={activeBooking} onClose={() => setApplyOpen(false)} onConfirm={confirmApply} />
    </section>
  );
};

export default BrowseRequests;


