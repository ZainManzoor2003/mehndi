import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import { adminAPI } from '../services/api';
import Select from 'react-select';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const ViewAnalytics = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedTimeRange, setSelectedTimeRange] = useState({ value: '30', label: 'Last 30 Days' });
  const [selectedCity, setSelectedCity] = useState(null);
  const [customDateRange, setCustomDateRange] = useState({ from: '', to: '' });
  const [showCustomRange, setShowCustomRange] = useState(false);
  
  const [analyticsData, setAnalyticsData] = useState({
    totalClients: 0, totalArtists: 0, totalRequests: 0, completedRequests: 0,
    activeApplications: 0, cancellationRate: 0, prevTotalClients: 0,
    prevTotalArtists: 0, prevTotalRequests: 0, prevCompletedRequests: 0,
    prevActiveApplications: 0, prevCancellationRate: 0
  });

  const [requestsByStatus, setRequestsByStatus] = useState([]);
  const [applicationsByStatus, setApplicationsByStatus] = useState([]);
  const [growthOverTime, setGrowthOverTime] = useState([]);
  const [activityByCity, setActivityByCity] = useState([]);

  // Use the new color theme for charts
  const CHART_COLORS = [
    'var(--ad-primary)', 
    'var(--ad-accent)', 
    'var(--ad-success)', 
    'var(--ad-info)', 
    'var(--ad-warn)', 
    '#6b5544' // A fallback muted color
  ];

  const timeRangeOptions = [
    { value: '7', label: 'Last 7 Days' },
    { value: '30', label: 'Last 30 Days' },
    { value: '90', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];

// UK Cities options
const cityOptions = [
  { value: '', label: 'All Cities' },
  { value: 'London', label: 'London' },
  { value: 'Birmingham', label: 'Birmingham' },
  { value: 'Manchester', label: 'Manchester' },
  { value: 'Glasgow', label: 'Glasgow' },
  { value: 'Liverpool', label: 'Liverpool' },
  { value: 'Leeds', label: 'Leeds' },
  { value: 'Edinburgh', label: 'Edinburgh' },
  { value: 'Bristol', label: 'Bristol' },
  { value: 'Cardiff', label: 'Cardiff' },
  { value: 'Sheffield', label: 'Sheffield' },
  { value: 'Bradford', label: 'Bradford' },
  { value: 'Leicester', label: 'Leicester' },
  { value: 'Coventry', label: 'Coventry' },
  { value: 'Belfast', label: 'Belfast' },
  { value: 'Nottingham', label: 'Nottingham' },
  { value: 'Newcastle', label: 'Newcastle upon Tyne' },
  { value: 'Brighton', label: 'Brighton' },
  { value: 'Hull', label: 'Hull' },
  { value: 'Plymouth', label: 'Plymouth' },
  { value: 'Stoke', label: 'Stoke-on-Trent' },
  { value: 'Wolverhampton', label: 'Wolverhampton' },
  { value: 'Derby', label: 'Derby' },
  { value: 'Swansea', label: 'Swansea' },
  { value: 'Southampton', label: 'Southampton' },
  { value: 'Salford', label: 'Salford' },
  { value: 'Aberdeen', label: 'Aberdeen' },
  { value: 'Westminster', label: 'Westminster' },
  { value: 'Portsmouth', label: 'Portsmouth' },
  { value: 'York', label: 'York' }
];

  const handleTimeRangeChange = (option) => {
    setSelectedTimeRange(option);
    setShowCustomRange(option.value === 'custom');
  };

  const getDateRange = () => {
    const now = new Date();
    const to = now.toISOString().split('T')[0];
    if (selectedTimeRange.value === 'custom') return { from: customDateRange.from, to: customDateRange.to };
    const days = parseInt(selectedTimeRange.value);
    const from = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    return { from: from.toISOString().split('T')[0], to: to };
  };

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  useEffect(() => {
    const loadAnalyticsData = async () => {
      setLoading(true);
      setError('');
      try {
        const dateRange = getDateRange();
        if (selectedTimeRange.value === 'custom' && (!dateRange.from || !dateRange.to)) {
          setLoading(false); return;
        }
        const params = { from: dateRange.from, to: dateRange.to, city: selectedCity?.value || '' };
        const [analyticsResponse, requestsResponse, applicationsResponse, growthResponse, activityResponse] = await Promise.all([
          adminAPI.getAnalytics(params), adminAPI.getRequestsByStatus(params),
          adminAPI.getApplicationsByStatus(params), adminAPI.getGrowthOverTime(params),
          adminAPI.getActivityByCity(params)
        ]);
        setAnalyticsData(analyticsResponse.data);
        setRequestsByStatus(requestsResponse.data);
        setApplicationsByStatus(applicationsResponse.data);
        setGrowthOverTime(growthResponse.data);
        setActivityByCity(activityResponse.data);
      } catch (err) {
        setError(err.message || 'Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    loadAnalyticsData();
  }, [selectedTimeRange, selectedCity, customDateRange]);

  // Themed Styles
  const cardBaseStyle = {
    backgroundColor: 'var(--ad-surface)', padding: '1.5rem',
    borderRadius: '12px', border: '1px solid var(--ad-border)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  };

  const chartTitleStyle = {
    fontSize: '1.25rem', fontWeight: '700',
    color: 'var(--ad-text)', marginBottom: '1.5rem'
  };

  const selectStyles = {
    control: (provided, state) => ({
      ...provided, border: `1px solid var(--ad-border)`, borderRadius: '8px',
      minHeight: '42px', backgroundColor: 'var(--ad-surface)',
      boxShadow: state.isFocused ? `0 0 0 2px var(--ad-accent)` : 'none',
      '&:hover': { borderColor: 'var(--ad-primary)' },
    }),
    placeholder: (p) => ({ ...p, color: 'var(--ad-muted)' }),
    option: (p, state) => ({ ...p,
      backgroundColor: state.isSelected ? 'var(--ad-primary)' : state.isFocused ? 'var(--ad-surface-strong)' : 'var(--ad-surface)',
      color: state.isSelected ? '#fff' : 'var(--ad-text)',
    }),
    singleValue: (p) => ({ ...p, color: 'var(--ad-text)' }),
  };

  const dateInputStyle = {
    padding: '0.65rem', border: `1px solid var(--ad-border)`,
    borderRadius: '8px', fontSize: '0.875rem',
    backgroundColor: 'var(--ad-surface)', color: 'var(--ad-text)',
  };

  return (
    <div className="dashboard-layout">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dashboard-main-content" style={{ backgroundColor: 'var(--ad-bg)'}}>
        <button
          className="sidebar-toggle-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="dashboard-container">
          <div className="dashboard-content">
            <div className="bookings-header">
              <h2 className="bookings-title" style={{color: 'var(--ad-text)'}}>Reports & Analytics</h2>
              <p className="bookings-subtitle" style={{color: 'var(--ad-muted)'}}>Comprehensive platform insights and metrics</p>
            </div>

            {error && <p className="error">{error}</p>}
            
            {/* Filters Section */}
            <div style={{ ...cardBaseStyle, marginBottom: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--ad-muted)' }}>Time Range</label>
                  <Select value={selectedTimeRange} onChange={handleTimeRangeChange} options={timeRangeOptions} styles={selectStyles} />
                </div>
                {showCustomRange && (<>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--ad-muted)' }}>From</label>
                        <input type="date" value={customDateRange.from} onChange={(e) => setCustomDateRange({...customDateRange, from: e.target.value})} style={dateInputStyle}/>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--ad-muted)' }}>To</label>
                        <input type="date" value={customDateRange.to} onChange={(e) => setCustomDateRange({...customDateRange, to: e.target.value})} style={dateInputStyle}/>
                    </div>
                </>)}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--ad-muted)' }}>Location</label>
                  <Select value={selectedCity} onChange={setSelectedCity} options={cityOptions} placeholder="All Cities" styles={selectStyles} isClearable />
                </div>
              </div>
            </div>

            {loading ? <p>Loading analytics...</p> : (<>
              {/* Analytics Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {[{label: 'Total Clients', value: analyticsData.totalClients, change: calculatePercentageChange(analyticsData.totalClients, analyticsData.prevTotalClients)},
                  {label: 'Total Artists', value: analyticsData.totalArtists, change: calculatePercentageChange(analyticsData.totalArtists, analyticsData.prevTotalArtists)},
                  {label: 'Total Requests', value: analyticsData.totalRequests, change: calculatePercentageChange(analyticsData.totalRequests, analyticsData.prevTotalRequests)},
                  {label: 'Completed Requests', value: analyticsData.completedRequests, change: calculatePercentageChange(analyticsData.completedRequests, analyticsData.prevCompletedRequests)},
                  {label: 'Active Applications', value: analyticsData.activeApplications, change: calculatePercentageChange(analyticsData.activeApplications, analyticsData.prevActiveApplications)},
                  {label: 'Cancellation Rate', value: `${analyticsData.cancellationRate}%`, change: calculatePercentageChange(analyticsData.cancellationRate, analyticsData.prevCancellationRate), reverseColor: true},
                ].map(stat => (
                  <div key={stat.label} style={cardBaseStyle}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--ad-muted)', textTransform: 'uppercase' }}>{stat.label}</h3>
                    <div style={{ fontSize: '2.25rem', fontWeight: '700', color: 'var(--ad-text)', margin: '0.5rem 0' }}>{stat.value}</div>
                    <div style={{ color: stat.change >= 0 ? (stat.reverseColor ? 'var(--ad-danger)' : 'var(--ad-success)') : (stat.reverseColor ? 'var(--ad-success)' : 'var(--ad-danger)'), fontWeight: '600' }}>
                      {stat.change >= 0 ? '▲' : '▼'} {Math.abs(stat.change)}%
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div style={cardBaseStyle}>
                  <h3 style={chartTitleStyle}>Requests by Status</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={requestsByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label>
                        {requestsByStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip /> <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div style={cardBaseStyle}>
                  <h3 style={chartTitleStyle}>Applications by Status</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={applicationsByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label>
                        {applicationsByStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip /> <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div style={{...cardBaseStyle, gridColumn: '1 / -1'}}>
                  <h3 style={chartTitleStyle}>Client & Artist Growth Over Time</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={growthOverTime}>
                      <CartesianGrid stroke="var(--ad-border)" />
                      <XAxis dataKey="month" stroke="var(--ad-muted)" />
                      <YAxis stroke="var(--ad-muted)" />
                      <Tooltip /> <Legend />
                      <Line type="monotone" dataKey="clients" stroke="var(--ad-primary)" strokeWidth={2} activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="artists" stroke="var(--ad-accent)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div style={{...cardBaseStyle, gridColumn: '1 / -1'}}>
                  <h3 style={chartTitleStyle}>Activity by City (Top 10)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={activityByCity.slice(0, 10)}>
                      <CartesianGrid stroke="var(--ad-border)" />
                      <XAxis dataKey="city" stroke="var(--ad-muted)" />
                      <YAxis stroke="var(--ad-muted)" />
                      <Tooltip /> <Legend />
                      <Bar dataKey="requests" fill="var(--ad-primary)" />
                      <Bar dataKey="applications" fill="var(--ad-accent)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewAnalytics;