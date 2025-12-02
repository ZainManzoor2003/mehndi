import React, { useEffect, useState } from "react";
import {
  FaCamera,
  FaCar,
  FaHome,
  FaPaperclip,
  FaPen,
  FaSpinner,
  FaStar,
  FaTimes,
} from "react-icons/fa";
import { portfoliosAPI, reviewsAPI } from "../services/api";

const ArtistProfileModal = ({ artist, isOpen, onClose }) => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(null);
  const [reviewsStats, setReviewsStats] = useState({
    totalReviews: 0,
    averageRating: 0,
  });
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioError, setPortfolioError] = useState(null);

  // Fetch portfolio data when modal opens
  useEffect(() => {
    const fetchPortfolioData = async () => {
      if (!artist?._id || !isOpen) return;

      try {
        setPortfolioLoading(true);
        setPortfolioError(null);

        // Fetch artist's portfolio
        const portfolioResponse = await portfoliosAPI.getArtistPortfolio(
          artist._id
        );

        if (portfolioResponse.success) {
          setPortfolioData(portfolioResponse.data);
        } else {
          setPortfolioError("Failed to load portfolio");
        }
      } catch (error) {
        console.error("Error fetching portfolio:", error);
        setPortfolioError(error.message || "Failed to load portfolio");
      } finally {
        setPortfolioLoading(false);
      }
    };

    fetchPortfolioData();
  }, [artist?._id, isOpen]);

  // Fetch reviews for the artist
  useEffect(() => {
    const fetchReviews = async () => {
      if (!artist?._id || !isOpen) {
        setReviewsLoading(false);
        return;
      }

      try {
        setReviewsLoading(true);
        setReviewsError(null);
        const response = await reviewsAPI.getArtistReviews(artist._id);

        if (response.success) {
          setReviews(response.data.reviews || []);
          setReviewsStats(
            response.data.stats || {
              totalReviews: 0,
              averageRating: 0,
            }
          );
        } else {
          setReviewsError("Failed to load reviews");
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setReviewsError(error.message || "Failed to load reviews");
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [artist?._id, isOpen]);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <FaStar
        key={index}
        style={{
          color: index < rating ? "#ffd700" : "#e5e7eb",
          fontSize: "16px",
          marginRight: "2px",
        }}
      />
    ));
  };

  const getEnabledServices = () => {
    if (!portfolioData?.services) return [];

    return Object.entries(portfolioData.services)
      .filter(([_, service]) => service.enabled)
      .map(([key, service]) => ({
        name: key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase()),
        priceFrom: service.priceFrom,
        priceTo: service.priceTo,
      }));
  };

  if (!isOpen || !artist) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          maxWidth: "90vw",
          maxHeight: "90vh",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: "700",
              color: "#1f2937",
            }}
          >
            Artist Profile
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#6b7280",
              padding: "4px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#e5e7eb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            backgroundColor: "#f8f9fa",
          }}
        >
          <style>
            {`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}
          </style>

          {/* Portfolio Loading/Error States */}
          {portfolioLoading && (
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "40px",
                textAlign: "center",
                marginBottom: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <FaSpinner
                style={{
                  animation: "spin 1s linear infinite",
                  fontSize: "24px",
                  color: "#6b7280",
                  marginBottom: "12px",
                }}
              />
              <p style={{ margin: 0, color: "#6b7280" }}>
                Loading portfolio...
              </p>
            </div>
          )}

          {portfolioError && (
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "40px",
                textAlign: "center",
                marginBottom: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <p style={{ margin: 0, color: "#dc2626" }}>{portfolioError}</p>
            </div>
          )}

          {/* Portfolio Content */}
          {!portfolioLoading && !portfolioError && portfolioData && (
            <>
              {/* About Me Section */}
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "24px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1f2937",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FaPaperclip style={{ color: "#ff6b35", fontSize: "16px" }} />
                  About Me
                </h3>
                <p
                  style={{
                    color: "#6b7280",
                    margin: 0,
                    fontSize: "14px",
                    lineHeight: "1.6",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    maxWidth: "100%",
                  }}
                >
                  {portfolioData.aboutMe ||
                    portfolioData.bio ||
                    "No bio provided yet."}
                </p>
              </div>

              {/* Services & Pricing Section */}
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "24px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1f2937",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FaPen style={{ color: "#ff6b35", fontSize: "16px" }} />
                  Services & Pricing
                </h3>
                {getEnabledServices().length > 0 ? (
                  <div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: "12px",
                        marginBottom: "8px",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      <span>Service</span>
                      <span>Price</span>
                    </div>
                    {getEnabledServices().map((service, index) => (
                      <div
                        key={index}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: "12px",
                          padding: "8px 0",
                          borderBottom:
                            index < getEnabledServices().length - 1
                              ? "1px solid #f3f4f6"
                              : "none",
                        }}
                      >
                        <span style={{ fontSize: "14px", color: "#374151" }}>
                          {service.name}
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#1f2937",
                            fontWeight: "500",
                          }}
                        >
                          £{service.priceFrom} - £{service.priceTo}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#6b7280", margin: 0, fontSize: "14px" }}>
                    No services configured yet.
                  </p>
                )}
              </div>

              {/* Portfolio Images Section */}
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "24px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 20px 0",
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1f2937",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FaCamera style={{ color: "#ff6b35", fontSize: "16px" }} />
                  Portfolio
                </h3>

                {portfolioData.mediaUrls &&
                portfolioData.mediaUrls.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {portfolioData.mediaUrls.map((imageUrl, index) => (
                      <div
                        key={index}
                        style={{
                          aspectRatio: "1",
                          borderRadius: "8px",
                          overflow: "hidden",
                          border: "1px solid #e5e7eb",
                          position: "relative",
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt={`Portfolio ${index + 1}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                        <div
                          style={{
                            display: "none",
                            width: "100%",
                            height: "100%",
                            backgroundColor: "#f3f4f6",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#6b7280",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}
                        >
                          Image {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {Array.from({ length: 6 }, (_, index) => (
                      <div
                        key={index}
                        style={{
                          aspectRatio: "1",
                          backgroundColor: "#f3f4f6",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#6b7280",
                          fontSize: "14px",
                          fontWeight: "500",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        Image {index + 1}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Travel & Languages Section */}
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "24px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 20px 0",
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1f2937",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FaCar style={{ color: "#ff6b35", fontSize: "16px" }} />
                  Travel & Languages
                </h3>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div>
                    <h4
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "16px",
                        fontWeight: "500",
                        color: "#374151",
                      }}
                    >
                      Travel Options
                    </h4>
                    <div style={{ display: "flex", gap: "16px" }}>
                      {portfolioData.availableForTravel && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <FaCar style={{ color: "#10b981" }} />
                          <span style={{ color: "#374151" }}>
                            Available for Travel (
                            {portfolioData.travelDistanceKm}km)
                          </span>
                        </div>
                      )}
                      {portfolioData.homeBased && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <FaHome style={{ color: "#10b981" }} />
                          <span style={{ color: "#374151" }}>Home-Based</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "16px",
                        fontWeight: "500",
                        color: "#374151",
                      }}
                    >
                      Languages Spoken
                    </h4>
                    <p style={{ color: "#6b7280", margin: 0 }}>
                      {portfolioData.languagesSpoken &&
                      Array.isArray(portfolioData.languagesSpoken) &&
                      portfolioData.languagesSpoken.length > 0
                        ? portfolioData.languagesSpoken.join(", ")
                        : portfolioData.languagesSpoken &&
                          typeof portfolioData.languagesSpoken === "string" &&
                          portfolioData.languagesSpoken.trim()
                        ? portfolioData.languagesSpoken
                        : "No languages specified"}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Reviews Section */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                margin: "0 0 20px 0",
                fontSize: "18px",
                fontWeight: "600",
                color: "#1f2937",
              }}
            >
              Reviews
              {reviewsStats.totalReviews > 0 && (
                <span
                  style={{
                    marginLeft: "12px",
                    fontSize: "16px",
                    fontWeight: "400",
                    color: "#6b7280",
                  }}
                >
                  ({reviewsStats.totalReviews} review
                  {reviewsStats.totalReviews !== 1 ? "s" : ""})
                </span>
              )}
            </h3>

            {reviewsLoading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "40px",
                  color: "#6b7280",
                }}
              >
                <FaSpinner
                  style={{
                    animation: "spin 1s linear infinite",
                    marginRight: "12px",
                  }}
                />
                Loading reviews...
              </div>
            ) : reviewsError ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#dc2626",
                }}
              >
                <p style={{ margin: 0, fontSize: "14px" }}>{reviewsError}</p>
              </div>
            ) : reviews.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {reviews.map((review, index) => (
                  <div
                    key={review._id || index}
                    style={{
                      paddingBottom: index < reviews.length - 1 ? "16px" : "0",
                      borderBottom:
                        index < reviews.length - 1
                          ? "1px solid #e5e7eb"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: "#ff6b35",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        {review.clientInitials || "A"}
                      </div>
                      <span style={{ fontWeight: "600", color: "#1f2937" }}>
                        {review.clientName || "Anonymous"}
                      </span>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {renderStars(review.rating)}
                      </div>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#9ca3af",
                          marginLeft: "auto",
                        }}
                      >
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p
                      style={{
                        color: "#6b7280",
                        margin: 0,
                        fontSize: "14px",
                        lineHeight: "1.5",
                      }}
                    >
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#6b7280",
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>⭐</div>
                <h4
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "18px",
                    color: "#374151",
                  }}
                >
                  No reviews yet
                </h4>
                <p style={{ margin: 0, fontSize: "14px" }}>
                  Be the first to book this artist and leave a review!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              backgroundColor: "#ff6b35",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#e55a2b";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ff6b35";
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtistProfileModal;
