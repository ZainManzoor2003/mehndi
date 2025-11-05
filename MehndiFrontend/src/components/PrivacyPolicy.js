import React, { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <>
      <Header />
      <main className="main" style={{ paddingTop: '6.5rem', paddingBottom: '4rem' }}>
        <div className="container" style={{ 
          maxWidth: '900px', 
          margin: '0 auto', 
          padding: '0 1.5rem',
          lineHeight: '1.8'
        }}>
          <div style={{
            color: '#2b2118',
            fontSize: '16px',
            letterSpacing: '0.01em'
          }}>
            {/* Section 1 */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '3rem',
              marginBottom: '1.5rem',
              lineHeight: '1.3'
            }}>
              1. Introduction
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              <strong>MehndiMe</strong> ("we", "our", or "us") is committed to protecting your privacy and ensuring that your personal data is handled responsibly, transparently, and in compliance with the <strong>UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.</strong>
            </p>
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              This Privacy Policy explains how we collect, use, store, and protect your information when you use our website, mobile app, or related services.
            </p>
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              By using <strong>MehndiMe</strong>, you agree to this Privacy Policy. If you do not agree, please stop using the platform.
            </p>

            {/* Section 2 */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '3rem',
              marginBottom: '1.5rem',
              lineHeight: '1.3'
            }}>
              2. Who We Are
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              <strong>MehndiMe</strong> is a UK-based online platform that connects clients seeking Mehndi (henna) services with independent Mehndi artists.
            </p>
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              If you have any questions about this policy or how your data is handled, you can contact us at: <a href="mailto:team.mehndime@gmail.com" style={{ color: '#8B5E34', textDecoration: 'underline' }}>team.mehndime@gmail.com</a>
            </p>

            {/* Section 3 */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '3rem',
              marginBottom: '1.5rem',
              lineHeight: '1.3'
            }}>
              3. Information We Collect
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '1rem',
              color: '#2b2118'
            }}>
              We collect personal and non-personal data when you interact with the platform. This may include:
            </p>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              a. Information You Provide Directly
            </h2>
            <ul style={{
              marginBottom: '1.5rem',
              color: '#2b2118',
              paddingLeft: '2rem',
              listStyleType: 'disc'
            }}>
              <li style={{ marginBottom: '0.75rem' }}>Name, email address, and phone number (for verification and communication).</li>
              <li style={{ marginBottom: '0.75rem' }}>Profile details such as portfolio images, service descriptions, and pricing (for Artists).</li>
              <li style={{ marginBottom: '0.75rem' }}>Booking details, including event dates, location, and preferences (for Clients).</li>
              <li style={{ marginBottom: '0.75rem' }}>Payment details (processed securely by third-party providers — we do not store full card details).</li>
              <li style={{ marginBottom: '0.75rem' }}>Messages exchanged through the platform.</li>
            </ul>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              b. Information Collected Automatically
            </h2>
            <ul style={{
              marginBottom: '1.5rem',
              color: '#2b2118',
              paddingLeft: '2rem',
              listStyleType: 'disc'
            }}>
              <li style={{ marginBottom: '0.75rem' }}>Device information, browser type, and operating system.</li>
              <li style={{ marginBottom: '0.75rem' }}>IP address and approximate location.</li>
              <li style={{ marginBottom: '0.75rem' }}>Usage data such as pages visited, features used, and time spent on the platform.</li>
            </ul>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              c. Information from Third Parties
            </h2>
            <ul style={{
              marginBottom: '3rem',
              color: '#2b2118',
              paddingLeft: '2rem',
              listStyleType: 'disc'
            }}>
              <li style={{ marginBottom: '0.75rem' }}>Identity verification partners (for email/phone checks).</li>
              <li style={{ marginBottom: '0.75rem' }}>Payment processors for secure transactions.</li>
              <li style={{ marginBottom: '0.75rem' }}>Analytics and marketing platforms that help us improve user experience.</li>
            </ul>

            {/* Section 4 */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '3rem',
              marginBottom: '1.5rem',
              lineHeight: '1.3'
            }}>
              4. How We Use Your Information
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '1.5rem',
              color: '#2b2118'
            }}>
              We use your information to:
            </p>
            <ul style={{
              marginBottom: '1.5rem',
              color: '#2b2118',
              paddingLeft: '2rem',
              listStyleType: 'disc'
            }}>
              <li style={{ marginBottom: '0.75rem' }}>Enable account creation, booking requests, and secure communication.</li>
              <li style={{ marginBottom: '0.75rem' }}>Process and release payments between Clients and Artists.</li>
              <li style={{ marginBottom: '0.75rem' }}>Verify identity and prevent fraud or unauthorised activity.</li>
              <li style={{ marginBottom: '0.75rem' }}>Respond to enquiries, complaints, or disputes.</li>
              <li style={{ marginBottom: '0.75rem' }}>Send important updates about your bookings, payments, or account.</li>
              <li style={{ marginBottom: '0.75rem' }}>Improve, personalise, and secure the <strong>MehndiMe</strong> platform.</li>
              <li style={{ marginBottom: '0.75rem' }}>Comply with legal obligations or requests from authorities.</li>
            </ul>
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              We do <strong>not</strong> sell, rent, or trade your personal data.
            </p>

            {/* Section 5 */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '3rem',
              marginBottom: '1.5rem',
              lineHeight: '1.3'
            }}>
              5. Legal Basis for Processing
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '1.5rem',
              color: '#2b2118'
            }}>
              We process your personal data under one or more of the following lawful bases:
            </p>
            <ul style={{
              marginBottom: '1.5rem',
              color: '#2b2118',
              paddingLeft: '2rem',
              listStyleType: 'disc'
            }}>
              <li style={{ marginBottom: '0.75rem' }}><strong>Contractual necessity</strong> – to perform the services you request.</li>
              <li style={{ marginBottom: '0.75rem' }}><strong>Legitimate interests</strong> – to operate and improve our platform securely.</li>
              <li style={{ marginBottom: '0.75rem' }}><strong>Legal obligation</strong> – to comply with UK laws and regulations.</li>
              <li style={{ marginBottom: '0.75rem' }}><strong>Consent</strong> – where you choose to receive marketing or promotional updates.</li>
            </ul>
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              You may withdraw consent for marketing at any time by emailing us at <a href="mailto:team.mehndime@gmail.com" style={{ color: '#8B5E34', textDecoration: 'underline' }}>team.mehndime@gmail.com</a>.
            </p>

            {/* Section 6 */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '3rem',
              marginBottom: '1.5rem',
              lineHeight: '1.3'
            }}>
              6. How We Share Your Information
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '1.5rem',
              color: '#2b2118'
            }}>
              Your data may be shared only where necessary to deliver our services, including:
            </p>
            <ul style={{
              marginBottom: '1.5rem',
              color: '#2b2118',
              paddingLeft: '2rem',
              listStyleType: 'disc'
            }}>
              <li style={{ marginBottom: '0.75rem' }}>With other Users (e.g., Clients and Artists) for booking purposes.</li>
              <li style={{ marginBottom: '0.75rem' }}>With trusted third-party service providers (e.g., payment processors, hosting partners).</li>
              <li style={{ marginBottom: '0.75rem' }}>With law enforcement or regulatory bodies, if required by law or to protect users' safety.</li>
            </ul>
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              All third parties are bound by strict confidentiality and data protection agreements.
            </p>

            {/* Section 7 */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '3rem',
              marginBottom: '1.5rem',
              lineHeight: '1.3'
            }}>
              7. Data Storage & Security
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '0rem',
              color: '#2b2118'
            }}>
              We take appropriate technical and organisational measures to protect your data from unauthorised access, alteration, disclosure, or loss.
            </p>
            <p style={{
              marginBottom: '1rem',
              color: '#2b2118'
            }}>
              Data is stored securely using encryption and access controls.
            </p>
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              If a data breach occurs that may impact your rights or freedoms, we will notify you and the relevant UK authorities (ICO) promptly, in line with legal requirements.
            </p>

            {/* Section 8 */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '3rem',
              marginBottom: '1.5rem',
              lineHeight: '1.3'
            }}>
              8. Data Retention
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '1rem',
              color: '#2b2118'
            }}>
              We retain your personal data only for as long as necessary to:
            </p>
            <ul style={{
              marginBottom: '1rem',
              color: '#2b2118',
              paddingLeft: '2rem',
              listStyleType: 'disc'
            }}>
              <li style={{ marginBottom: '0.75rem' }}>Provide and support your use of <strong>MehndiMe</strong>.</li>
              <li style={{ marginBottom: '0.75rem' }}>Meet our legal, tax, or accounting obligations.</li>
              <li style={{ marginBottom: '0.75rem' }}>Resolve disputes and enforce our agreements.</li>
            </ul>
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              When no longer required, your information will be securely deleted or anonymised.
            </p>

            {/* Section 9 */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '3rem',
              marginBottom: '1.5rem',
              lineHeight: '1.3'
            }}>
              9. Your Rights Under UK GDPR
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '1rem',
              color: '#2b2118'
            }}>
              You have the following rights over your personal data:
            </p>
            <ul style={{
              marginBottom: '1.5rem',
              color: '#2b2118',
              paddingLeft: '2rem',
              listStyleType: 'disc'
            }}>
              <li style={{ marginBottom: '0.75rem' }}><strong>Access</strong> – request a copy of your personal data.</li>
              <li style={{ marginBottom: '0.75rem' }}><strong>Rectification</strong> – correct inaccuracies in your information.</li>
              <li style={{ marginBottom: '0.75rem' }}><strong>Erasure</strong> – request deletion of your data where appropriate ("right to be forgotten").</li>
              <li style={{ marginBottom: '0.75rem' }}><strong>Restriction</strong> – limit how your data is used.</li>
              <li style={{ marginBottom: '0.75rem' }}><strong>Portability</strong> – request transfer of your data to another service.</li>
              <li style={{ marginBottom: '0.75rem' }}><strong>Objection</strong> – object to processing for marketing or legitimate interest purposes.</li>
            </ul>
            <p style={{
              marginBottom: '0rem',
              color: '#2b2118'
            }}>
              To exercise any of these rights, email us at <a href="mailto:team.mehndime@gmail.com" style={{ color: '#8B5E34', textDecoration: 'underline' }}>team.mehndime@gmail.com</a>.
            </p>
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              We aim to respond within <strong>30 days</strong>.
            </p>
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              If you're not satisfied with our response, you have the right to contact the <strong>Information Commissioner's Office (ICO)</strong> at <a href="https://www.ico.org.uk" style={{ color: '#8B5E34', textDecoration: 'underline' }}>www.ico.org.uk</a>.
            </p>

            {/* Section 10 */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '3rem',
              marginBottom: '1.5rem',
              lineHeight: '1.3'
            }}>
              10. Cookies & Tracking
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '1.5rem',
              color: '#2b2118'
            }}>
              We use cookies and similar technologies to:
            </p>
            <ul style={{
              marginBottom: '1rem',
              color: '#2b2118',
              paddingLeft: '2rem',
              listStyleType: 'disc'
            }}>
              <li style={{ marginBottom: '0.75rem' }}>Improve user experience and platform performance.</li>
              <li style={{ marginBottom: '0.75rem' }}>Remember your login preferences.</li>
              <li style={{ marginBottom: '0.75rem' }}>Analyse traffic and usage trends.</li>
            </ul>
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              You can adjust your browser settings to decline cookies, but some features may not work properly as a result.
            </p>

            {/* Section 11 */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '3rem',
              marginBottom: '1.5rem',
              lineHeight: '1.3'
            }}>
              11. International Data Transfers
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              Where data is transferred outside the UK (e.g., through third-party tools or servers), we ensure appropriate safeguards are in place — such as standard contractual clauses or UK adequacy decisions — to protect your information.
            </p>

            {/* Section 12 */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '3rem',
              marginBottom: '1.5rem',
              lineHeight: '1.3'
            }}>
              12. Links to Other Websites
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '0rem',
              color: '#2b2118'
            }}>
              Our platform may contain links to third-party websites.
            </p>
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              <strong>MehndiMe</strong> is not responsible for the privacy practices or content of these external sites. We encourage you to read their privacy policies before sharing your data.
            </p>

            {/* Section 13 */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '3rem',
              marginBottom: '1.5rem',
              lineHeight: '1.3'
            }}>
              13. Updates to This Policy
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '0rem',
              color: '#2b2118'
            }}>
              We may update this Privacy Policy periodically to reflect changes in our practices or legal obligations.
            </p>
            <p style={{
              marginBottom: '0rem',
              color: '#2b2118'
            }}>
              When significant changes are made, we will notify users via email or platform alerts.
            </p>
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              The latest version will always be available on our website.
            </p>

            {/* Section 14 */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '3rem',
              marginBottom: '1.5rem',
              lineHeight: '1.3'
            }}>
              14. Contact Us
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              If you have any questions, concerns, or requests regarding your personal data or this Privacy Policy, please contact us at: <a href="mailto:team.mehndime@gmail.com" style={{ color: '#8B5E34', textDecoration: 'underline' }}>team.mehndime@gmail.com</a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PrivacyPolicy;
