import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/api";
import GetLocationModal from "./modals/GetLocationModal";

const { bookingsAPI } = apiService;

const BookingForm = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [linkInput, setLinkInput] = useState("");

  const [formData, setFormData] = useState({
    // Contact Details
    fullName: "",

    // Event Details
    eventType: "",
    otherEventType: "",
    eventDate: "",
    preferredTimeSlot: "",
    location: "",
    latitude: "",
    longitude: "",
    zipCode: "",
    artistTravelsToClient: "",
    venueName: "",

    // Mehndi Style
    designInspiration: "",
    coveragePreference: "",

    // Budget & Notes
    budgetFrom: "",
    budgetTo: "",
    numberOfPeople: 1,
    additionalRequests: "",
  });

  const [fetchingZipCode, setFetchingZipCode] = useState(false);

  const [showLocationModal, setShowLocationModal] = useState(false);
  // Calendar popover state
  const today = new Date();
  const [showCalendar, setShowCalendar] = useState(false);
  const [calEntering, setCalEntering] = useState(false);
  const openCalendar = () => {
    // If a date is selected, show that month/year; otherwise show today's month/year
    if (formData.eventDate) {
      const selectedDate = new Date(formData.eventDate);
      setCalYear(selectedDate.getFullYear());
      setCalMonth(selectedDate.getMonth());
    } else {
      setCalYear(today.getFullYear());
      setCalMonth(today.getMonth());
    }
    setShowCalendar(true);
    // allow next paint then animate in
    setTimeout(() => setCalEntering(true), 0);
  };
  const closeCalendar = () => {
    setCalEntering(false);
    setTimeout(() => setShowCalendar(false), 180);
  };
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-11

  const calMatrix = useMemo(() => {
    const first = new Date(calYear, calMonth, 1);
    const startDay = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const prevDays = new Date(calYear, calMonth, 0).getDate();
    const cells = [];
    // Fill 42 cells (6 weeks)
    for (let i = 0; i < 42; i++) {
      const dayNum = i - startDay + 1;
      let date,
        inMonth = true;
      if (dayNum < 1) {
        inMonth = false;
        date = new Date(calYear, calMonth - 1, prevDays + dayNum);
      } else if (dayNum > daysInMonth) {
        inMonth = false;
        date = new Date(calYear, calMonth + 1, dayNum - daysInMonth);
      } else {
        date = new Date(calYear, calMonth, dayNum);
      }
      cells.push({ date, inMonth });
    }
    return cells;
  }, [calYear, calMonth]);

  const formatISO = (d) => {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Function to fetch zip code from coordinates using reverse geocoding
  const fetchZipCodeFromCoordinates = async (lat, lng) => {
    setFetchingZipCode(true);
    try {
      // Using Nominatim (OpenStreetMap) reverse geocoding API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "MehndiMe-BookingForm/1.0", // Required by Nominatim
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch zip code");

      const data = await response.json();
      const postcode = data.address?.postcode || "";

      if (postcode) {
        setFormData((prev) => ({
          ...prev,
          zipCode: postcode,
        }));
      }
    } catch (error) {
      console.error("Error fetching zip code:", error);
      // If zip code fetch fails, we'll just leave it empty
    } finally {
      setFetchingZipCode(false);
    }
  };

  // Handler for location selection from modal (store coordinates only; city is chosen via dropdown)
  const handleLocationSelect = async (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
    }));
    setShowLocationModal(false);

    // Fetch zip code from coordinates
    await fetchZipCodeFromCoordinates(lat, lng);
  };

  // Cloudinary upload function
  const uploadToCloudinary = async (file, resourceType = "image") => {
    const url = `https://api.cloudinary.com/v1_1/dfoetpdk9/${resourceType}/upload`;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", "mehndi");
    const res = await fetch(url, { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Upload failed");
    return data.secure_url || data.url;
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check if adding these files would exceed the 6 image limit
    const totalAfterUpload = uploadedImages.length + files.length;
    if (totalAfterUpload > 6) {
      setError(
        `Maximum 6 images allowed. You currently have ${uploadedImages.length} image(s) and trying to add ${files.length} more.`
      );
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = files.map((file) => uploadToCloudinary(file));
      const urls = await Promise.all(uploadPromises);
      setUploadedImages((prev) => [...prev, ...urls]);
      // Update designInspiration with all image URLs
      const allImages = [...uploadedImages, ...urls];
      setFormData((prev) => ({
        ...prev,
        designInspiration: allImages.join("\n"),
      }));
    } catch (error) {
      console.error("Upload error:", error);
      setError("Failed to upload images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddLink = () => {
    if (!linkInput.trim()) return;

    // Check if adding this link would exceed the 6 image limit
    if (uploadedImages.length >= 6) {
      setError(
        "Maximum 6 images allowed. Please remove an image before adding a new one."
      );
      return;
    }

    const newImages = [...uploadedImages, linkInput.trim()];
    setUploadedImages(newImages);
    setFormData((prev) => ({
      ...prev,
      designInspiration: newImages.join("\n"),
    }));
    setLinkInput("");
  };

  const handleRemoveImage = (index) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    setFormData((prev) => ({
      ...prev,
      designInspiration: newImages.join("\n"),
    }));
  };

  const steps = [
    { id: 1, name: "Contact" },
    { id: 2, name: "Event" },
    { id: 3, name: "Style" },
    { id: 4, name: "Budget" },
    { id: 5, name: "Review" },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Clear error when user starts typing/selecting
    if (error) {
      setError("");
    }

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked
          ? [...prev[name], value]
          : prev[name].filter((item) => item !== value),
      }));
    } else if (type === "radio") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        // Clear coverage preference when event type changes
        ...(name === "eventType" ? { coveragePreference: "" } : {}),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Special handler for budget fields to prevent negative numbers
  const handleBudgetChange = (e) => {
    const { name, value } = e.target;

    // Clear error when user starts typing
    if (error) {
      setError("");
    }

    // Remove any negative signs, minus signs, or non-numeric characters except empty string
    let cleanValue = value.replace(/[^0-9]/g, "");

    // If the value is empty, allow it (for clearing the field)
    if (value === "") {
      cleanValue = "";
    }

    // Update the form data with cleaned value
    setFormData((prev) => ({
      ...prev,
      [name]: cleanValue,
    }));
  };

  const handleNumberChange = (field, increment) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Math.max(1, prev[field] + increment),
    }));
  };

  const handlePresetBudget = (from, to) => {
    setFormData((prev) => ({
      ...prev,
      budgetFrom: from,
      budgetTo: to,
    }));
  };

  // Validation functions for each step
  const validateStep1 = () => {
    if (!formData.fullName || !formData.fullName.trim()) {
      setError("Please enter your full name");
      return false;
    }
    // Check if full name has at least one space (first and last name)
    if (!formData.fullName.trim().includes(" ")) {
      setError(
        'Please enter your full name with first and last name separated by a space (e.g., "Mudassar Ali")'
      );
      return false;
    }
    // Check if there's at least one character before and after the space
    const nameParts = formData.fullName.trim().split(/\s+/);
    if (
      nameParts.length < 2 ||
      nameParts[0].length === 0 ||
      nameParts[1].length === 0
    ) {
      setError("Please enter both first and last name separated by a space");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.eventType) {
      setError("Please select an event type");
      return false;
    }
    if (formData.eventType === "Other" && !formData.otherEventType?.trim()) {
      setError("Please specify the event type");
      return false;
    }
    if (!formData.eventDate) {
      setError("Please select an event date");
      return false;
    }
    // Check if event date is in the future
    const eventDate = new Date(formData.eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventDate <= today) {
      setError("Event date must be in the future");
      return false;
    }
    if (!formData.preferredTimeSlot) {
      setError("Please select a preferred time slot");
      return false;
    }
    if (!formData.location) {
      setError("Please select a city");
      return false;
    }
    if (!formData.latitude || !formData.longitude) {
      setError("Please select your location on the map");
      return false;
    }
    if (!formData.artistTravelsToClient) {
      setError("Please select travel preference");
      return false;
    }
    // Venue name is optional, but if Wedding is selected, it's recommended (not required)
    return true;
  };

  const validateStep3 = () => {
    // Design inspiration is required
    if (!formData.designInspiration || !formData.designInspiration.trim()) {
      setError(
        "Please upload at least one design inspiration image or add a link"
      );
      return false;
    }
    // Coverage preference is required for Wedding events
    if (formData.eventType === "Wedding" && !formData.coveragePreference) {
      setError(
        "Coverage preference (Bridal Only) is required for wedding events"
      );
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!formData.budgetFrom || !formData.budgetTo) {
      setError("Please enter budget range");
      return false;
    }
    const budgetFrom = parseFloat(formData.budgetFrom);
    const budgetTo = parseFloat(formData.budgetTo);

    if (isNaN(budgetFrom) || isNaN(budgetTo)) {
      setError("Please enter valid budget amounts");
      return false;
    }

    if (budgetFrom < 0 || budgetTo < 0) {
      setError("Budget amounts cannot be negative");
      return false;
    }

    if (budgetTo <= budgetFrom) {
      setError("Maximum budget must be greater than minimum budget");
      return false;
    }

    if (!formData.numberOfPeople || formData.numberOfPeople < 1) {
      setError("Please specify the number of people (minimum 1)");
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    setError("");

    // Validate current step before proceeding
    let isValid = false;
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      case 4:
        isValid = validateStep4();
        break;
      default:
        isValid = true;
    }

    if (isValid && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Ensure submission only happens on the Review step
    if (currentStep !== 5) {
      setCurrentStep(5);
      return;
    }

    if (!isAuthenticated) {
      setError("Please log in to submit a booking request");
      return;
    }

    // Validate required fields
    if (!formData.fullName) {
      setCurrentStep(1);
      setError("Please enter your full name");
      return;
    }

    if (
      !formData.eventType ||
      !formData.eventDate ||
      !formData.preferredTimeSlot ||
      !formData.location ||
      !formData.artistTravelsToClient
    ) {
      setCurrentStep(2);
      setError("Please complete Event Details");
      return;
    }

    // Check if design inspiration is provided
    if (!formData.designInspiration || !formData.designInspiration.trim()) {
      setCurrentStep(3);
      setError(
        "Please upload at least one design inspiration image or add a link"
      );
      return;
    }

    // Check if coverage preference is required for Wedding
    if (formData.eventType === "Wedding" && !formData.coveragePreference) {
      setCurrentStep(3);
      setError(
        "Coverage preference (Bridal Only) is required for wedding events"
      );
      return;
    }

    if (
      !formData.budgetFrom ||
      !formData.budgetTo ||
      !formData.numberOfPeople
    ) {
      setCurrentStep(4);
      setError("Please complete Budget information");
      return;
    }

    const budgetFrom = parseInt(formData.budgetFrom);
    const budgetTo = parseInt(formData.budgetTo);

    if (budgetTo <= budgetFrom) {
      setError("Maximum budget must be greater than minimum budget");
      return;
    }

    // Check if event date is in the future
    const eventDate = new Date(formData.eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate <= today) {
      setCurrentStep(2);
      setError("Event date must be in the future");
      return;
    }

    setIsLoading(true);

    try {
      // Transform to match backend expectations
      const nameParts = formData.fullName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const bookingData = {
        firstName,
        lastName,
        email: user?.email || "",
        phoneNumber: user?.phoneNumber || "",
        eventType: [formData.eventType],
        otherEventType: formData.otherEventType || undefined,
        eventDate: formData.eventDate,
        preferredTimeSlot: [formData.preferredTimeSlot],
        location: formData.location,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        zipCode: formData.zipCode || undefined,
        artistTravelsToClient:
          formData.artistTravelsToClient === "both"
            ? "both"
            : formData.artistTravelsToClient === "yes",
        venueName: formData.venueName || undefined,
        minimumBudget: budgetFrom,
        maximumBudget: budgetTo,
        numberOfPeople: parseInt(formData.numberOfPeople),
        designInspiration: uploadedImages.length > 0 ? uploadedImages : [],
        coveragePreference: formData.coveragePreference || undefined,
        additionalRequests: formData.additionalRequests || undefined,
        duration: 3,
      };

      await bookingsAPI.createBooking(bookingData);

      setSuccess("Your booking request has been submitted successfully!");

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Booking creation error:", error);
      setError(error.message || "Failed to submit booking request");
    } finally {
      setIsLoading(false);
    }
  };
  // Scroll to top on mount
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [currentStep]);

  return (
    <>
      <div className="booking-container">
        <div
          style={{
            textAlign: "left",
            marginBottom: "16px",
            maxWidth: "900px",
            margin: "0 auto 10px",
          }}
        >
          <Link
            to="/dashboard"
            style={{ color: "#6b4f3b", textDecoration: "none" }}
          >
            ← Back to Dashboard
          </Link>
        </div>
        <div className="booking-form-container">
          {/* Progress Bar */}
          <div className="progress-bar">
            {steps.map((step, index) => (
              <div key={step.id} className="progress-step-container">
                <div
                  className={`progress-step ${
                    currentStep >= step.id ? "active" : ""
                  } ${currentStep === step.id ? "current" : ""}`}
                >
                  <span
                    className="step-number"
                    style={{
                      width: "50px",
                      height: "50px",
                      background: currentStep > step.id ? "#804018" : "#EA7C25",
                    }}
                  >
                    {step.id}
                  </span>
                  <span className="step-name">{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`progress-line ${
                      currentStep > step.id ? "completed" : ""
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>

          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}></div>

          <form className="booking-form">
            {/* Step 1: Contact Details */}
            {currentStep === 1 && (
              <div className="form-step">
                <h1
                  style={{
                    fontSize: "2rem",
                    color: "#8B4513",
                    marginBottom: "0.5rem",
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  Post a Mehndi Request
                </h1>
                <p
                  style={{
                    fontSize: "1.1rem",
                    color: "#666",
                    fontStyle: "italic",
                    textAlign: "center",
                  }}
                >
                  Tell Us What You Need – Artists Will Apply to You!
                </p>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "#888",
                    marginTop: "0.5rem",
                    textAlign: "center",
                    marginBottom: "50px",
                  }}
                >
                  Sit back and let artists send you offers based on your event,
                  budget, and style.
                </p>

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    className="form-input"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                  <span
                    style={{ color: "rgb(136, 136, 136)", fontSize: "0.9rem" }}
                  >
                    Your information will be used securely to connect you with
                    artists.
                  </span>
                </div>
              </div>
            )}

            {/* Step 2: Event Details */}
            {currentStep === 2 && (
              <div className="form-step">
                <div className="step-header">
                  <h2 className="step-title">🎉 Event Details</h2>
                  <p className="step-subtitle">
                    Tell us about your special occasion
                  </p>
                </div>

                {/* Event Type */}
                <div className="form-group">
                  <label className="form-label">Event Type *</label>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "#888",
                      marginBottom: "1rem",
                    }}
                  >
                    Choose the event you are booking for
                  </p>
                  <div className="event-option-grid">
                    <label
                      className={`event-option ${
                        formData.eventType === "Wedding" ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="eventType"
                        value="Wedding"
                        checked={formData.eventType === "Wedding"}
                        onChange={handleInputChange}
                        style={{ display: "none" }}
                      />
                      <span className="event-emoji">💍</span>
                      <span className="event-text">Wedding</span>
                      {formData.eventType === "Wedding" && (
                        <span className="checkmark">✓</span>
                      )}
                    </label>
                    <label
                      className={`event-option ${
                        formData.eventType === "Eid" ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="eventType"
                        value="Eid"
                        checked={formData.eventType === "Eid"}
                        onChange={handleInputChange}
                        style={{ display: "none" }}
                      />
                      <span className="event-emoji">🌙</span>
                      <span className="event-text">Eid</span>
                      {formData.eventType === "Eid" && (
                        <span className="checkmark">✓</span>
                      )}
                    </label>
                    <label
                      className={`event-option ${
                        formData.eventType === "Party" ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="eventType"
                        value="Party"
                        checked={formData.eventType === "Party"}
                        onChange={handleInputChange}
                        style={{ display: "none" }}
                      />
                      <span className="event-emoji">🎉</span>
                      <span className="event-text">Party</span>
                      {formData.eventType === "Party" && (
                        <span className="checkmark">✓</span>
                      )}
                    </label>
                    <label
                      className={`event-option ${
                        formData.eventType === "Festival" ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="eventType"
                        value="Festival"
                        checked={formData.eventType === "Festival"}
                        onChange={handleInputChange}
                        style={{ display: "none" }}
                      />
                      <span className="event-emoji">🎊</span>
                      <span className="event-text">Festival</span>
                      {formData.eventType === "Festival" && (
                        <span className="checkmark">✓</span>
                      )}
                    </label>
                    <label
                      className={`event-option ${
                        formData.eventType === "Other" ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="eventType"
                        value="Other"
                        checked={formData.eventType === "Other"}
                        onChange={handleInputChange}
                        style={{ display: "none" }}
                      />
                      <span className="event-emoji">📝</span>
                      <span className="event-text">Other</span>
                      {formData.eventType === "Other" && (
                        <span className="checkmark">✓</span>
                      )}
                    </label>
                  </div>
                  {formData.eventType === "Other" && (
                    <input
                      type="text"
                      name="otherEventType"
                      className="form-input"
                      style={{ marginTop: "1rem" }}
                      placeholder="Please specify the event"
                      value={formData.otherEventType}
                      onChange={handleInputChange}
                      required
                    />
                  )}
                </div>

                {/* Event Date */}
                <div className="form-group">
                  <label className="form-label">Event Date *</label>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "#888",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Select the date of your occasion
                  </p>
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={() =>
                        showCalendar ? closeCalendar() : openCalendar()
                      }
                      style={{
                        width: "100%",
                        height: "48px",
                        border: "1px solid #ced4da",
                        borderRadius: "10px",
                        background: "#ffffff",
                        fontSize: "16px",
                        textAlign: "left",
                        padding: "0 12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        color: "#0f172a",
                      }}
                    >
                      <span>
                        {formData.eventDate
                          ? new Date(formData.eventDate).toLocaleDateString(
                              "en-GB",
                              { day: "2-digit", month: "long", year: "numeric" }
                            )
                          : "Choose a date"}
                      </span>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {showCalendar && (
                      <div
                        style={{
                          position: "absolute",
                          zIndex: 50,
                          top: 56,
                          left: 0,
                          width: 320,
                          background: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: 12,
                          boxShadow: "0 12px 30px rgba(15,23,42,0.15)",
                          padding: 12,
                          transition:
                            "opacity 180ms ease, transform 180ms ease",
                          opacity: calEntering ? 1 : 0,
                          transform: calEntering
                            ? "translateY(0) scale(1)"
                            : "translateY(-6px) scale(0.98)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 8,
                            gap: 8,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (calMonth === 0) {
                                setCalMonth(11);
                                setCalYear(calYear - 1);
                              } else {
                                setCalMonth(calMonth - 1);
                              }
                            }}
                            style={{
                              background: "none",
                              border: "1px solid #e5e7eb",
                              borderRadius: 6,
                              width: 32,
                              height: 32,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                            }}
                          >
                            ◀
                          </button>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "center",
                              flex: 1,
                              justifyContent: "center",
                            }}
                          >
                            <select
                              value={calMonth}
                              onChange={(e) =>
                                setCalMonth(parseInt(e.target.value))
                              }
                              style={{
                                padding: "6px 12px",
                                border: "1px solid #e5e7eb",
                                borderRadius: 8,
                                background: "#ffffff",
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#0f172a",
                                cursor: "pointer",
                                outline: "none",
                              }}
                            >
                              {[
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December",
                              ].map((month, idx) => (
                                <option key={idx} value={idx}>
                                  {month}
                                </option>
                              ))}
                            </select>
                            <select
                              value={calYear}
                              onChange={(e) =>
                                setCalYear(parseInt(e.target.value))
                              }
                              style={{
                                padding: "6px 12px",
                                border: "1px solid #e5e7eb",
                                borderRadius: 8,
                                background: "#ffffff",
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#0f172a",
                                cursor: "pointer",
                                outline: "none",
                              }}
                            >
                              {Array.from(
                                { length: 11 },
                                (_, i) => today.getFullYear() - 5 + i
                              ).map((year) => (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (calMonth === 11) {
                                setCalMonth(0);
                                setCalYear(calYear + 1);
                              } else {
                                setCalMonth(calMonth + 1);
                              }
                            }}
                            style={{
                              background: "none",
                              border: "1px solid #e5e7eb",
                              borderRadius: 6,
                              width: 32,
                              height: 32,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                            }}
                          >
                            ▶
                          </button>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(7, 1fr)",
                            textAlign: "center",
                            fontWeight: 600,
                            color: "#64748b",
                            marginBottom: 6,
                          }}
                        >
                          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(
                            (d) => (
                              <div key={d} style={{ padding: "6px 0" }}>
                                {d}
                              </div>
                            )
                          )}
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(7, 1fr)",
                            gap: 4,
                          }}
                        >
                          {calMatrix.map(({ date, inMonth }, idx) => {
                            const isSelected =
                              formData.eventDate &&
                              formatISO(date) === formData.eventDate;
                            const isToday =
                              formatISO(date) === formatISO(today);
                            // Compare dates without time
                            const dateOnly = new Date(
                              date.getFullYear(),
                              date.getMonth(),
                              date.getDate()
                            );
                            const todayOnly = new Date(
                              today.getFullYear(),
                              today.getMonth(),
                              today.getDate()
                            );
                            const isPastOrToday = dateOnly <= todayOnly;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  if (!isPastOrToday) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      eventDate: formatISO(date),
                                    }));
                                    closeCalendar();
                                  }
                                }}
                                disabled={isPastOrToday}
                                style={{
                                  padding: "10px 0",
                                  borderRadius: 8,
                                  border:
                                    "2px solid " +
                                    (isSelected
                                      ? "#2563eb"
                                      : isPastOrToday
                                      ? "#e5e7eb"
                                      : "#e5e7eb"),
                                  background: isSelected
                                    ? "#2563eb"
                                    : isPastOrToday
                                    ? "#f5f5f5"
                                    : "#ffffff",
                                  color: isSelected
                                    ? "#ffffff"
                                    : isPastOrToday
                                    ? "#c0c0c0"
                                    : inMonth
                                    ? "#0f172a"
                                    : "#94a3b8",
                                  fontWeight: 500,
                                  cursor: isPastOrToday
                                    ? "not-allowed"
                                    : "pointer",
                                  opacity: isPastOrToday ? 0.5 : 1,
                                }}
                              >
                                {date.getDate()}
                              </button>
                            );
                          })}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: 10,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                eventDate: "",
                              }));
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#3b82f6",
                              cursor: "pointer",
                            }}
                          >
                            Clear
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date();
                              setCalYear(d.getFullYear());
                              setCalMonth(d.getMonth());
                              setFormData((prev) => ({
                                ...prev,
                                eventDate: formatISO(d),
                              }));
                              closeCalendar();
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#3b82f6",
                              cursor: "pointer",
                            }}
                          >
                            Today
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preferred Time Slot */}
                <div className="form-group">
                  <label className="form-label">Preferred Time Slot *</label>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "#888",
                      marginBottom: "1rem",
                    }}
                  >
                    Pick one option
                  </p>
                  <div className="time-slot-grid">
                    <label
                      className={`time-slot-option ${
                        formData.preferredTimeSlot === "Morning"
                          ? "selected"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="preferredTimeSlot"
                        value="Morning"
                        checked={formData.preferredTimeSlot === "Morning"}
                        onChange={handleInputChange}
                        style={{ display: "none" }}
                      />
                      <span className="time-icon">☀️</span>
                      <span className="time-text">Morning</span>
                      {formData.preferredTimeSlot === "Morning" && (
                        <span className="checkmark">✓</span>
                      )}
                    </label>
                    <label
                      className={`time-slot-option ${
                        formData.preferredTimeSlot === "Afternoon"
                          ? "selected"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="preferredTimeSlot"
                        value="Afternoon"
                        checked={formData.preferredTimeSlot === "Afternoon"}
                        onChange={handleInputChange}
                        style={{ display: "none" }}
                      />
                      <span className="time-icon">🌤️</span>
                      <span className="time-text">Afternoon</span>
                      {formData.preferredTimeSlot === "Afternoon" && (
                        <span className="checkmark">✓</span>
                      )}
                    </label>
                    <label
                      className={`time-slot-option ${
                        formData.preferredTimeSlot === "Evening"
                          ? "selected"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="preferredTimeSlot"
                        value="Evening"
                        checked={formData.preferredTimeSlot === "Evening"}
                        onChange={handleInputChange}
                        style={{ display: "none" }}
                      />
                      <span className="time-icon">🌙</span>
                      <span className="time-text">Evening</span>
                      {formData.preferredTimeSlot === "Evening" && (
                        <span className="checkmark">✓</span>
                      )}
                    </label>
                    <label
                      className={`time-slot-option ${
                        formData.preferredTimeSlot === "Flexible"
                          ? "selected"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="preferredTimeSlot"
                        value="Flexible"
                        checked={formData.preferredTimeSlot === "Flexible"}
                        onChange={handleInputChange}
                        style={{ display: "none" }}
                      />
                      <span className="time-icon">🔄</span>
                      <span className="time-text">Flexible</span>
                      {formData.preferredTimeSlot === "Flexible" && (
                        <span className="checkmark">✓</span>
                      )}
                    </label>
                  </div>
                </div>

                {/* Location */}
                <div className="form-group">
                  <label className="form-label">Location / Postcode *</label>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#888",
                      marginBottom: "1rem",
                    }}
                  >
                    Click "Get Location" to select your location on the map
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(true)}
                    style={{
                      padding: "14px 32px",
                      background: "#faf8f5",
                      border: "2px solid #CD853F",
                      borderRadius: "10px",
                      color: "#8B4513",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.3s",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "1rem",
                      boxShadow: "0 2px 8px rgba(205, 133, 63, 0.15)",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "#fff8f0";
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow =
                        "0 4px 12px rgba(205, 133, 63, 0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "#faf8f5";
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow =
                        "0 2px 8px rgba(205, 133, 63, 0.15)";
                    }}
                  >
                    <span style={{ fontSize: "1.2rem" }}>📍</span> Get Location
                  </button>

                  {/* Location Selected Message */}
                  {formData.latitude && formData.longitude && (
                    <div
                      style={{
                        marginTop: "1rem",
                        padding: "12px 16px",
                        background: "#e3f2fd",
                        border: "2px solid #2196f3",
                        borderRadius: "8px",
                        color: "#1565c0",
                        fontSize: "0.95rem",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm-1.5 8.5l3.5 3.5 5.5-5.5-1.5-1.5-4 4-2-2-1.5 1.5z" />
                      </svg>
                      <span>Location Selected</span>
                    </div>
                  )}

                  {/* City Dropdown */}
                  <div style={{ marginTop: "12px" }}>
                    <label
                      className="form-label"
                      style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}
                    >
                      Select City *
                    </label>
                    <select
                      value={formData.location}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        height: "44px",
                        border: "1px solid #ced4da",
                        borderRadius: "8px",
                        padding: "0 12px",
                        background: "#ffffff",
                        color: "#0f172a",
                      }}
                    >
                      <option value="">Select city</option>
                      <option value="London">London</option>
                      <option value="Birmingham">Birmingham</option>
                      <option value="Manchester">Manchester</option>
                      <option value="Bradford">Bradford</option>
                    </select>
                  </div>

                  {/* Zip Code Field */}
                  <div style={{ marginTop: "12px" }}>
                    <label
                      className="form-label"
                      style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}
                    >
                      Postcode / Zip Code
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      className="form-input"
                      placeholder={
                        fetchingZipCode
                          ? "Fetching postcode..."
                          : "Will be auto-filled from location (editable)"
                      }
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      style={{
                        background: formData.zipCode ? "#f0f8f0" : "#faf8f5",
                        cursor: "text",
                        color: formData.zipCode ? "#2e7d32" : "#888",
                      }}
                    />
                    {fetchingZipCode && (
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "#888",
                          marginTop: "0.5rem",
                        }}
                      >
                        Fetching postcode from coordinates...
                      </p>
                    )}
                    {formData.zipCode && !fetchingZipCode && (
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "#2e7d32",
                          marginTop: "0.5rem",
                          fontWeight: "500",
                        }}
                      >
                        ✓ Postcode automatically fetched from your location
                      </p>
                    )}
                  </div>
                </div>

                {/* Travel Preference */}
                <div className="form-group">
                  <label className="form-label">
                    Do you want the artist to come to you? *
                  </label>
                  <div className="travel-option-grid">
                    <label
                      className={`travel-option ${
                        formData.artistTravelsToClient === "yes"
                          ? "selected"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="artistTravelsToClient"
                        value="yes"
                        checked={formData.artistTravelsToClient === "yes"}
                        onChange={handleInputChange}
                        style={{ display: "none" }}
                      />
                      <span className="travel-icon">🚗</span>
                      <span className="travel-text">
                        Yes, come to my home/venue
                      </span>
                      {formData.artistTravelsToClient === "yes" && (
                        <span className="checkmark">✓</span>
                      )}
                    </label>
                    <label
                      className={`travel-option ${
                        formData.artistTravelsToClient === "no"
                          ? "selected"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="artistTravelsToClient"
                        value="no"
                        checked={formData.artistTravelsToClient === "no"}
                        onChange={handleInputChange}
                        style={{ display: "none" }}
                      />
                      <span className="travel-icon">🏡</span>
                      <span className="travel-text">
                        No, I'll travel to the artist
                      </span>
                      {formData.artistTravelsToClient === "no" && (
                        <span className="checkmark">✓</span>
                      )}
                    </label>
                    <label
                      className={`travel-option ${
                        formData.artistTravelsToClient === "both"
                          ? "selected"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="artistTravelsToClient"
                        value="both"
                        checked={formData.artistTravelsToClient === "both"}
                        onChange={handleInputChange}
                        style={{ display: "none" }}
                      />
                      <span className="travel-icon">🤝</span>
                      <span className="travel-text">I'm open to both</span>
                      {formData.artistTravelsToClient === "both" && (
                        <span className="checkmark">✓</span>
                      )}
                    </label>
                  </div>
                </div>

                {/* Venue Name (Optional) */}
                <div className="form-group">
                  <label className="form-label">Venue Name</label>
                  <input
                    type="text"
                    name="venueName"
                    className="form-input"
                    placeholder="Enter venue name (optional)"
                    value={formData.venueName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Mehndi Style */}
            {currentStep === 3 && (
              <div className="form-step">
                <div className="step-header">
                  <h2 className="step-title">Design Inspiration</h2>
                  <p className="step-subtitle">Share your preferred designs</p>
                </div>

                {/* Design Inspiration */}
                <div className="form-group">
                  <label className="form-label">Design Inspiration *</label>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "#888",
                      marginBottom: "1rem",
                    }}
                  >
                    Upload images or paste links to share your preferred designs
                    (Maximum 6 images)
                  </p>

                  {/* Upload Images */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      className="upload-button"
                      style={{
                        display: "inline-block",
                        padding: "12px 24px",
                        background:
                          uploadedImages.length >= 6 ? "#f0f0f0" : "#faf8f5",
                        border: `2px dashed ${
                          uploadedImages.length >= 6 ? "#999" : "#CD853F"
                        }`,
                        borderRadius: "10px",
                        cursor:
                          uploadedImages.length >= 6
                            ? "not-allowed"
                            : "pointer",
                        color: uploadedImages.length >= 6 ? "#666" : "#8B4513",
                        fontWeight: "500",
                        transition: "all 0.3s",
                        opacity: uploadedImages.length >= 6 ? 0.6 : 1,
                      }}
                    >
                      {uploading
                        ? "Uploading..."
                        : `📸 Upload Images (${uploadedImages.length}/6)`}
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading || uploadedImages.length >= 6}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>

                  {/* Paste Link */}
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <input
                      type="url"
                      className="form-input"
                      placeholder="Paste image link here..."
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddLink();
                        }
                      }}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleAddLink}
                      disabled={!linkInput.trim() || uploadedImages.length >= 6}
                      style={{
                        padding: "12px 24px",
                        background:
                          uploadedImages.length >= 6 ? "#ccc" : "#EA7C25",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        cursor:
                          uploadedImages.length >= 6
                            ? "not-allowed"
                            : "pointer",
                        fontWeight: "600",
                        opacity:
                          !linkInput.trim() || uploadedImages.length >= 6
                            ? 0.6
                            : 1,
                      }}
                    >
                      Add
                    </button>
                  </div>

                  {/* Uploaded Images Preview */}
                  {uploadedImages.length > 0 && (
                    <div
                      style={{
                        marginTop: "1rem",
                        padding: "1rem",
                        background: "#f9f9f9",
                        borderRadius: "10px",
                        border: "1px solid #e0d5c9",
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
                          marginBottom: "0.5rem",
                          color: "#8B4513",
                        }}
                      >
                        Your Inspiration Images ({uploadedImages.length}/6):
                      </strong>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(100px, 1fr))",
                          gap: "0.75rem",
                        }}
                      >
                        {uploadedImages.map((url, index) => (
                          <div
                            key={index}
                            style={{
                              position: "relative",
                              aspectRatio: "1",
                              borderRadius: "8px",
                              overflow: "hidden",
                              border: "2px solid #e0d5c9",
                            }}
                          >
                            <img
                              src={url}
                              alt={`Inspiration ${index + 1}`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                              onError={(e) => {
                                e.target.src =
                                  "https://via.placeholder.com/100";
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              style={{
                                position: "absolute",
                                top: "4px",
                                right: "4px",
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                background: "rgba(255, 0, 0, 0.8)",
                                color: "white",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                lineHeight: "1",
                              }}
                              title="Remove image"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Coverage Preference */}
                <div className="form-group">
                  <label className="form-label">
                    Coverage Preference
                    {formData.eventType === "Wedding" ? (
                      <>
                        <span style={{ color: "#ef4444" }}> *</span>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            color: "#888",
                            fontWeight: "normal",
                          }}
                        >
                          {" "}
                          (Bridal Only)
                        </span>
                      </>
                    ) : (
                      <span
                        style={{
                          fontSize: "0.85rem",
                          color: "#888",
                          fontWeight: "normal",
                        }}
                      >
                        {" "}
                        (optional)
                      </span>
                    )}
                  </label>
                  <select
                    name="coveragePreference"
                    className="form-input"
                    value={formData.coveragePreference}
                    onChange={handleInputChange}
                    required={formData.eventType === "Wedding"}
                  >
                    <option value="">Select coverage</option>
                    <option value="Full arms & feet">Full arms & feet</option>
                    <option value="Hands only">Hands only</option>
                    <option value="Simple, elegant design">
                      Simple, elegant design
                    </option>
                    <option value="Not sure yet">Not sure yet</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 4: Budget & Notes */}
            {currentStep === 4 && (
              <div className="form-step">
                <div className="step-header">
                  <h2 className="step-title">Budget & Notes</h2>
                  <p className="step-subtitle">
                    Help artists tailor their offers to you
                  </p>
                </div>

                {/* Budget Range */}
                <div className="form-group">
                  <label className="form-label">
                    What's your budget range? *
                  </label>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "#888",
                      marginBottom: "1rem",
                      fontWeight: "bold",
                    }}
                  >
                    Helps verified artists tailor accurate offers for your
                    event.
                  </p>
                  <div className="budget-input-row">
                    <div className="budget-input">
                      <span className="currency">£</span>
                      <input
                        type="text"
                        name="budgetFrom"
                        className="budget-field"
                        placeholder="From"
                        value={formData.budgetFrom}
                        onChange={handleBudgetChange}
                        onKeyPress={(e) => {
                          // Prevent typing minus sign, plus sign, or 'e' (scientific notation)
                          if (
                            e.key === "-" ||
                            e.key === "+" ||
                            e.key === "e" ||
                            e.key === "E"
                          ) {
                            e.preventDefault();
                          }
                        }}
                        required
                      />
                    </div>
                    <div className="budget-input">
                      <span className="currency">£</span>
                      <input
                        type="text"
                        name="budgetTo"
                        className="budget-field"
                        placeholder="To"
                        value={formData.budgetTo}
                        onChange={handleBudgetChange}
                        onKeyPress={(e) => {
                          // Prevent typing minus sign, plus sign, or 'e' (scientific notation)
                          if (
                            e.key === "-" ||
                            e.key === "+" ||
                            e.key === "e" ||
                            e.key === "E"
                          ) {
                            e.preventDefault();
                          }
                        }}
                        required
                      />
                    </div>
                  </div>

                  {/* Preset Budget Buttons */}
                  <div className="budget-preset-buttons">
                    <button
                      type="button"
                      className={`budget-preset ${
                        formData.budgetFrom === "50" &&
                        formData.budgetTo === "100"
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => handlePresetBudget("50", "100")}
                    >
                      Under £100
                    </button>
                    <button
                      type="button"
                      className={`budget-preset ${
                        formData.budgetFrom === "100" &&
                        formData.budgetTo === "250"
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => handlePresetBudget("100", "250")}
                    >
                      £100 - £250
                    </button>
                    <button
                      type="button"
                      className={`budget-preset ${
                        formData.budgetFrom === "250" &&
                        formData.budgetTo === "500"
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => handlePresetBudget("250", "500")}
                    >
                      £250 - £500
                    </button>
                    <button
                      type="button"
                      className={`budget-preset ${
                        formData.budgetFrom === "500" &&
                        formData.budgetTo === "1000"
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => handlePresetBudget("500", "1000")}
                    >
                      £500+
                    </button>
                  </div>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#888",
                      marginTop: "-1rem",
                    }}
                  >
                    Final quotes may vary based on design, travel, and party
                    size. You’ll review and confirm before booking.
                  </p>
                </div>

                {/* Number of People */}
                <div className="form-group">
                  <label className="form-label">
                    How many people need Mehndi? (for group bookings) *
                  </label>
                  <div className="number-selector">
                    <button
                      type="button"
                      className="number-btn"
                      onClick={() => handleNumberChange("numberOfPeople", -1)}
                    >
                      -
                    </button>
                    <span
                      className="number-display"
                      style={{ color: "black", fontWeight: "lighter" }}
                    >
                      {formData.numberOfPeople}
                    </span>
                    <button
                      type="button"
                      className="number-btn"
                      onClick={() => handleNumberChange("numberOfPeople", 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="form-group">
                  <label className="form-label">
                    Anything else artists should know?
                  </label>
                  <textarea
                    name="additionalRequests"
                    className="form-textarea"
                    placeholder="Share any detailes that help your artist prepare - e.g. prefer traditional designs, natural henna only, outdoors setup, limited parking, or flexible timing."
                    value={formData.additionalRequests}
                    onChange={handleInputChange}
                    rows="4"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="form-step">
                <div className="step-header" style={{ textAlign: "center" }}>
                  <h2 className="step-title">Review Your Request</h2>
                  <p className="step-subtitle">
                    Make sure your details look correct before submitting.
                  </p>
                </div>

                <div
                  style={{
                    border: "1px solid #e8ddd4",
                    borderRadius: 16,
                    overflow: "hidden",
                    background: "#fff",
                  }}
                >
                  {[
                    { label: "Name", value: formData.fullName || "-", step: 1 },
                    { label: "Email", value: user?.email || "-", step: 1 },
                    {
                      label: "Location",
                      value: formData.location || "-",
                      step: 2,
                    },
                    {
                      label: "Postcode",
                      value: formData.zipCode || "-",
                      step: 2,
                    },
                    {
                      label: "Event Date",
                      value: formData.eventDate
                        ? new Date(formData.eventDate).toLocaleDateString(
                            "en-GB",
                            { day: "2-digit", month: "long", year: "numeric" }
                          )
                        : "-",
                      step: 2,
                    },
                    {
                      label: "Time Slot",
                      value: formData.preferredTimeSlot || "-",
                      step: 2,
                    },
                    {
                      label: "Venue Name",
                      value: formData.venueName || "-",
                      step: 2,
                    },
                    {
                      label: "Coverage",
                      value: formData.coveragePreference || "-",
                      step: 3,
                    },
                    {
                      label: "Budget",
                      value:
                        formData.budgetFrom && formData.budgetTo
                          ? `£${formData.budgetFrom} – £${formData.budgetTo}`
                          : "-",
                      step: 4,
                    },
                    {
                      label: "Group Size",
                      value: String(formData.numberOfPeople || 1),
                      step: 4,
                    },
                    {
                      label: "Notes",
                      value: formData.additionalRequests || "-",
                      step: 4,
                    },
                  ].map((row, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "14px 18px",
                        borderTop: idx === 0 ? "none" : "1px solid #f1eadf",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, color: "#888" }}>
                          {row.label}
                        </div>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>
                          {row.value}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(row.step)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#CD853F",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error and Success Messages */}
            {error && (
              <div
                className="error-message"
                style={{
                  backgroundColor: "#fee",
                  color: "#c33",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  border: "1px solid #fcc",
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="success-message"
                style={{
                  backgroundColor: "#dfc",
                  color: "#3a3",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  border: "1px solid #9c9",
                }}
              >
                {success}
              </div>
            )}

            {/* Navigation Buttons */}
            <div
              className="form-navigation"
              style={{ flexDirection: currentStep === 5 && "column" }}
            >
              {currentStep > 1 && currentStep < 5 && (
                <button
                  type="button"
                  className="button btn-secondary"
                  onClick={handlePrevStep}
                  disabled={isLoading}
                >
                  Previous
                </button>
              )}

              {currentStep < 5 ? (
                <button
                  type="button"
                  className="button btn-primary"
                  onClick={handleNextStep}
                  disabled={isLoading}
                >
                  Next
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="button btn-primary btn-submit"
                    disabled={isLoading}
                  >
                    {isLoading ? "Submitting..." : "Submit Request"}
                  </button>
                  <p
                    style={{
                      textAlign: "center",
                      color: "#888",
                      marginTop: 14,
                    }}
                  >
                    Once posted, your request will be visible to verified
                    artists nearby who can apply or message you to bring your
                    vision to life. Your name will only be shared when you reply
                    or accept an offer.
                  </p>
                </>
              )}
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .booking-container {
          min-height: 100vh;
          padding: 2rem 1rem;
          background: linear-gradient(135deg, #f5f0e8 0%, #e8ddd4 100%);
        }

        .booking-form-container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          padding: 2.5rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .progress-bar {
          display: flex;
          justify-content: center;
          margin-bottom: 2.5rem;
          gap: 0rem;
        }

        .progress-step {
          text-align: center;
        }

        .step-number {
          display: inline-block;
          width: 55px !important;
          height: 55px !important;
          line-height: 50px;
          border-radius: 50%;
          background: #e8ddd4;
          font-weight: bold;
          margin-bottom: 0.5rem;
          transition: all 0.3s;
          font-size: 1.1rem !important;
        }

        .step-name {
          font-size: 0.9rem;
          color: #666;
        }

        .form-group {
          margin-bottom: 1.8rem;
        }

        .form-label {
          display: block;
          font-weight: 600;
          color: #8b4513;
          margin-bottom: 0.5rem;
          font-size: 1.05rem;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e0d5c9;
          border-radius: 10px;
          font-size: 1rem;
          background: #faf8f5;
          transition: all 0.3s;
        }

        .form-input:focus {
          outline: none;
          border-color: #cd853f;
          background: white;
          box-shadow: 0 0 0 3px rgba(205, 133, 63, 0.1);
        }

        .form-textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e0d5c9;
          border-radius: 10px;
          font-size: 1rem;
          background: #faf8f5;
          font-family: inherit;
          resize: vertical;
          transition: all 0.3s;
        }

        .form-textarea:focus {
          outline: none;
          border-color: #cd853f;
          background: white;
          box-shadow: 0 0 0 3px rgba(205, 133, 63, 0.1);
        }

        .event-option-grid,
        .time-slot-grid,
        .travel-option-grid,
        .style-option-grid {
          display: grid;
          gap: 1rem;
        }

        .event-option-grid,
        .time-slot-grid,
        .travel-option-grid {
          // grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }

        .event-option,
        .time-slot-option,
        .travel-option,
        .style-option {
          display: flex;
          align-items: center;
          padding: 16px;
          border: 2px solid #e0d5c9;
          border-radius: 12px;
          background: #faf8f5;
          cursor: pointer;
          transition: all 0.3s;
          gap: 12px;
          position: relative;
        }

        .time-slot-option .checkmark,
        .travel-option .checkmark {
          position: absolute;
          right: 16px;
          color: #cd853f;
          font-weight: bold;
          font-size: 1.2rem;
        }

        .event-option:hover,
        .time-slot-option:hover,
        .travel-option:hover,
        .style-option:hover {
          border-color: #cd853f;
          background: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(205, 133, 63, 0.15);
        }

        .event-option.selected,
        .time-slot-option.selected,
        .travel-option.selected,
        .style-option.selected {
          border-color: #cd853f;
          background: #fff8f0;
        }

        .event-emoji,
        .travel-icon,
        .time-icon {
          font-size: 1.5rem;
        }

        .checkmark {
          position: absolute;
          right: 16px;
          color: #cd853f;
          font-weight: bold;
          font-size: 1.2rem;
        }

        .budget-input-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .budget-input {
          display: flex;
          align-items: center;
          border: 1px solid #e0d5c9;
          border-radius: 10px;
          padding: 8px 16px;
          background: #faf8f5;
        }

        .budget-input:focus-within {
          border-color: #cd853f;
          background: white;
          box-shadow: 0 0 0 3px rgba(205, 133, 63, 0.1);
        }

        .currency {
          font-weight: 600;
          color: #8b4513;
          margin-right: 8px;
        }

        .budget-field {
          border: none;
          background: transparent;
          font-size: 1rem;
          flex: 1;
          outline: none;
        }

        .budget-preset-buttons {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .budget-preset {
          padding: 10px 20px;
          border: 2px solid #e0d5c9;
          border-radius: 8px;
          background: #faf8f5;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 0.95rem;
          font-weight: 500;
          color: #8b4513;
        }

        .budget-preset:hover {
          border-color: #cd853f;
          background: white;
        }

        .budget-preset.selected {
          background: #cd853f;
          color: white;
          border-color: #cd853f;
        }

        .number-selector {
          display: flex;
          align-items: center;
          gap: 1rem;
          border: 1px solid #e0d5c9;
          border-radius: 10px;
          background: #faf8f5;
          padding: 8px;
          width: fit-content;
        }

        .number-btn {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 8px;
          background: white;
          font-size: 1.3rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
          color: #8b4513;
        }

        .number-btn:hover {
          background: #cd853f;
          color: white;
          transform: scale(1.1);
        }

        .number-display {
          font-size: 1.2rem;
          font-weight: 600;
          min-width: 40px;
          text-align: center;
        }

        .form-navigation {
          display: flex;
          justify-content: space-between;
          margin-top: 2.5rem;
          gap: 1rem;
        }

        .btn-primary,
        .btn-secondary {
          padding: 14px 32px;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          border: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #cd853f 0%, #d2691e 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(205, 133, 63, 0.3);
        }
        .btn-primary:disabled,
        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .upload-button:hover {
          background: #fff8f0;
          border-color: #d2691e;
          transform: translateY(-2px);
        }

        .upload-button:active {
          transform: translateY(0);
        }
        .button {
          background: #ea7c25;
          color: white;
        }
        .button:hover {
          background: #804018;
          color: white;
        }

        @media (max-width: 768px) {
          .booking-form-container {
            padding: 1.5rem;
          }

          .event-option-grid,
          .time-slot-grid,
          .travel-option-grid {
            grid-template-columns: 1fr;
          }

          .budget-input-row {
            grid-template-columns: 1fr;
          }

          .form-navigation {
            flex-direction: column;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
          }

          .progress-step-container {
            display: none;
          }
        }
      `}</style>

      {/* Get Location Modal */}
      <GetLocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelect={handleLocationSelect}
      />
    </>
  );
};

export default BookingForm;
