import React, { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';

const TermsAndConditions = () => {
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
              Welcome to <strong>MehndiMe</strong>, a UK-based online platform that connects clients seeking Mehndi (henna) services with independent Mehndi artists. These Terms and Conditions govern your access to and use of the platform. By using <strong>MehndiMe</strong>, you agree to comply with and be legally bound by these Terms. If you do not agree, you must not access or use the platform.
            </p>
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              By using <strong>MehndiMe</strong>, you also agree to our <strong>Privacy Policy</strong>, <strong>Safeguarding Policy</strong>, and <strong>Off-Platform Conduct Policy</strong>.
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
              2. Definitions
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              The term <strong>"MehndiMe"</strong> refers to the operator of the platform. A <strong>"User"</strong> is any individual using the platform, including both Clients and Artists. A <strong>"Client"</strong> is a User who books services through the platform, and an <strong>"Artist"</strong> is a User offering Mehndi services. <strong>"Services"</strong> refers to henna application and related activities, while a <strong>"Booking"</strong> means a confirmed order placed by a Client. The term <strong>"Platform"</strong> refers to the <strong>MehndiMe</strong> website or mobile application.
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
              3. Eligibility
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              To use <strong>MehndiMe</strong>, you must be at least 18 years old, legally capable of entering into binding contracts, and willing to comply with UK law and these Terms. You are also responsible for providing accurate information during registration and ensuring it remains up to date.
            </p>

            {/* Section 4 */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '3rem',
              marginBottom: '1.5rem',
              lineHeight: '1.3'
            }}>
              4. Account Registration and Security
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              All users must register and create an account to use <strong>MehndiMe</strong>. During registration, you must provide accurate and complete information, including a valid email address and phone number, both of which may be verified to activate your account.
            </p>
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              You are solely responsible for safeguarding your login credentials and for all activity that occurs under your account. <strong>MehndiMe</strong> accepts no liability for any unauthorised access or use of your account unless such access occurs due to our own negligence.
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
              5. Services & Bookings
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              Clients may post requests on <strong>MehndiMe</strong>, and Artists can apply to those requests.
            </p>
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              Artists are responsible for setting their own availability, pricing, and for fulfilling all confirmed bookings in a professional and timely manner. Bookings are confirmed once an Artist sends an offer in response to a Client's request, and the Client accepts that offer through the platform.
            </p>
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              Any further arrangements or terms agreed upon between a Client and an Artist must comply with these Terms and the policies set out by <strong>MehndiMe</strong>.
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
              6. Payments & Fees
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              Payments are processed via regulated third-party providers in compliance with the UK Payment Services Regulations 2017. Funds may be held in escrow until the service is marked complete. <strong>MehndiMe</strong> does not store payment details.
            </p>
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              All charges, including any applicable platform or service fees, will be transparently disclosed before a booking is finalised. <strong>MehndiMe</strong> may deduct its service fee before releasing payment to the Artist.
            </p>
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              Artist payouts are typically released within 24 hours after the event is marked complete, subject to standard payment processing times.
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
              7. Artist Responsibilities
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              Artists are expected to carry out all bookings with skill, care, and professionalism. They must maintain appropriate hygiene and safety standards, avoid fraudulent behaviour, and adhere to all applicable UK tax, business, and health and safety laws. Artists are responsible for maintaining valid insurance, including public liability cover, and for managing their own income reporting and HMRC obligations.
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
              8. Client Responsibilities
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              Clients must ensure that the information they provide—including contact details and payment information—is accurate and up to date. They are expected to communicate respectfully with Artists and to use the platform in good faith. Any disputes should be raised through <strong>MehndiMe</strong>'s dispute resolution process.
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
              9. Reviews & Content
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '0rem',
              color: '#2b2118'
            }}>
              Users may upload content or submit reviews related to their experience on the platform. By doing so, they grant <strong>MehndiMe</strong> a licence to use, display, and reproduce this content for promotional or operational purposes.
            </p>
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              Content must not be unlawful, offensive, defamatory, or infringe the rights of others. It must also not contain private information or spam.
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
              10. Privacy & Data Protection
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              <strong>MehndiMe</strong> handles all personal data in line with the UK General Data Protection Regulation (UK GDPR). For more details, users are encouraged to consult our Privacy Policy. By using the platform, you consent to the processing of your data as outlined.
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
              11. Limitation of Liability
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              <strong>MehndiMe</strong> operates solely as a digital intermediary connecting Clients and Artists. We do not control or guarantee the quality, timing, or outcome of services provided by Artists. <strong>MehndiMe</strong> is not responsible for any losses, damages, or issues arising from cancellations, delays, or unsatisfactory services.
            </p>
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              To the fullest extent permitted by law, <strong>MehndiMe</strong> shall not be liable for any indirect, incidental, or consequential damages, including loss of income, reputation, or data, arising from the use of the platform. Our total liability, if any, shall not exceed the total amount paid by a Client through <strong>MehndiMe</strong> in the six months prior to the claim.
            </p>
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              Nothing in these Terms limits or excludes <strong>MehndiMe</strong>'s liability for death or personal injury caused by negligence, or for fraud or fraudulent misrepresentation.
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
              12. Indemnity
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              All Users agree to indemnify <strong>MehndiMe</strong> against any claims, losses, liabilities, or expenses arising from breach of these Terms, misuse of the platform, or infringement of third-party rights.
            </p>
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              This indemnity includes reasonable legal fees and expenses incurred by <strong>MehndiMe</strong> in connection with any such claim.
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
              13. Account Suspension & Termination
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              <strong>MehndiMe</strong> reserves the right to suspend, restrict, or permanently terminate any account that violates these Terms, our policies, or applicable laws.
            </p>
            <p style={{
              marginBottom: '1rem',
              color: '#2b2118'
            }}>
              We may take such action if:
            </p>
            <ul style={{
              marginBottom: '1.5rem',
              color: '#2b2118',
              paddingLeft: '2rem',
              listStyleType: 'disc'
            }}>
              <li style={{ marginBottom: '0.75rem' }}>False, misleading, or incomplete information is provided during registration or use;</li>
              <li style={{ marginBottom: '0.75rem' }}>Repeated cancellations, no-shows, or unprofessional conduct occur;</li>
              <li style={{ marginBottom: '0.75rem' }}>Fraudulent, abusive, unsafe, or illegal activity is detected;</li>
              <li style={{ marginBottom: '0.75rem' }}>There is any attempt to exchange contact details, arrange services, or communicate with Clients or Artists outside the <strong>MehndiMe</strong> platform;</li>
              <li style={{ marginBottom: '0.75rem' }}>Complaints or evidence of misuse of the platform are received; or</li>
              <li style={{ marginBottom: '0.75rem' }}>Required identity, phone, or email verifications are not completed or are invalid.</li>
            </ul>
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              Where appropriate, users will be notified of the reason for suspension and may be given an opportunity to respond or appeal. However, serious breaches — including fraud, harassment, safety risks, or attempts to take transactions off-platform — may result in immediate termination without notice.
            </p>
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              <strong>MehndiMe</strong> may also remove content, listings, or offers that breach our policies, and withhold access to payments related to such breaches if necessary.
            </p>
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              Users who believe their account has been suspended or terminated in error may contact <a href="mailto:team.mehndime@gmail.com" style={{ color: '#8B5E34', textDecoration: 'underline' }}>team.mehndime@gmail.com</a> for review.
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
              14. Safeguarding Policy
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              a. Purpose and Commitment
            </h2>
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              At <strong>MehndiMe</strong>, we are committed to creating a safe, fair, and respectful environment for all Clients and Artists. This includes ensuring that users can report and resolve issues involving safety, professionalism, payments, or service quality. This policy outlines our approach to safeguarding users, protecting children and vulnerable individuals, and managing complaints or disputes raised through the platform.
            </p>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              b. Scope
            </h2>
            <p style={{
              marginBottom: '1.5rem',
              color: '#2b2118'
            }}>
              This policy applies to all users — Clients, Artists, staff, and contractors — engaging with <strong>MehndiMe</strong>. It covers: 
            </p>
            <ul style={{
              marginBottom: '0.5rem',
              color: '#2b2118',
              paddingLeft: '2rem',
              listStyleType: 'disc'
            }}>
              <li style={{ marginBottom: '0.75rem' }}>Complaints raised by Clients against Artists, or Artists against Clients.</li>
              <li style={{ marginBottom: '0.75rem' }}>Disputes related to services booked through <strong>MehndiMe</strong>.</li>
              <li style={{ marginBottom: '0.75rem' }}>Payment and service quality issues.</li>
            </ul>
            <p style={{
              marginBottom: '1rem',
              color: '#2b2118',
              fontStyle: 'italic'
            }}>
              (Note: Cancellations are addressed separately under the Cancellation and Refund Policy.)
            </p>
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              It also applies to all bookings and interactions facilitated through the platform, including those where children (under 18 years old) are present at the venue or receiving Mehndi designs.
            </p>
            <p style={{
              marginBottom: '1.5rem',
              color: '#2b2118'
            }}>
              All booking-related complaints or disputes are handled under Section 15 (Complaints and Dispute Resolution) of these Terms.
            </p>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              c. General Principles
            </h2>
            <p style={{
              marginBottom: '1.5rem',
              color: '#2b2118'
            }}>
              The safety, wellbeing, and fair treatment of all users is our top priority. Artists must always act with professionalism, respect, and care, while Clients and parents/guardians remain responsible for supervision and honest communication.
            </p>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              d. Responsibilities
            </h2>
            <p style={{
              marginBottom: '1.5rem',
              color: '#2b2118'
            }}>
              <strong>MehndiMe</strong>'s responsibilities include maintaining clear policies, acting promptly on reports, and cooperating with relevant authorities where required. Artists must maintain professionalism, avoid inappropriate behaviour, and report concerns immediately. Clients must provide accurate information, act respectfully, and report issues promptly.
            </p>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              e. Guidelines for Artists (Working with Children)
            </h2>
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              When children are present or directly receiving Mehndi:
            </p>
            <ul style={{
              marginBottom: '1.5rem',
              color: '#2b2118',
              paddingLeft: '2rem',
              listStyleType: 'disc'
            }}>
              <li style={{ marginBottom: '0.75rem' }}>Artists must never be left alone with a child without a parent or guardian present.</li>
              <li style={{ marginBottom: '0.75rem' }}>Mehndi may only be applied to a child with the explicit consent of the parent or guardian.</li>
              <li style={{ marginBottom: '0.75rem' }}>Only natural, skin-safe Mehndi may be used. The use of black henna or products containing harmful chemicals is strictly prohibited.</li>
              <li style={{ marginBottom: '0.75rem' }}>Artists must maintain professional boundaries at all times, and physical contact should be limited to what is necessary for applying the Mehndi design.</li>
            </ul>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              f. Guidelines for Clients (When Children Are Involved)
            </h2>
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              Clients are responsible for ensuring that:
            </p>
            <ul style={{
              marginBottom: '1.5rem',
              color: '#2b2118',
              paddingLeft: '2rem',
              listStyleType: 'disc'
            }}>
              <li style={{ marginBottom: '0.75rem' }}>Children are always accompanied by a responsible adult during bookings.</li>
              <li style={{ marginBottom: '0.75rem' }}>Artists are informed in advance if children will be receiving Mehndi.</li>
              <li style={{ marginBottom: '0.75rem' }}>Parents or guardians manage aftercare — ensuring that children do not ingest Mehndi, touch their eyes, or handle unwashed skin areas after application.</li>
            </ul>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              g. Code of Conduct
            </h2>
            <p style={{
              marginBottom: '1.5rem',
              color: '#2b2118'
            }}>
              All users must act with courtesy, integrity, and professionalism. Harassment, discrimination, or off-platform solicitation is strictly prohibited. Breaches may result in suspension or permanent removal from the platform.
            </p>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              h. Reporting Concerns
            </h2>
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              If you experience or witness any behaviour that makes you feel unsafe, report it to <strong>MehndiMe</strong> by emailing <a href="mailto:team.mehndime@gmail.com" style={{ color: '#8B5E34', textDecoration: 'underline' }}>team.mehndime@gmail.com</a>. Reports should include details such as booking ID, names, and supporting evidence. All reports are treated confidentially and investigated promptly.
            </p>

            {/* Section 15 */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '3rem',
              marginBottom: '1.5rem',
              lineHeight: '1.3'
            }}>
              15. Complaints and Dispute Resolution
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              a. Complaints and Dispute Resolution
            </h2>
            <p style={{
              marginBottom: '1rem',
              color: '#2b2118'
            }}>
              This section applies to all complaints and disputes arising from services booked via <strong>MehndiMe</strong>, including:
            </p>
            <ul style={{
              marginBottom: '0.5rem',
              color: '#2b2118',
              paddingLeft: '2rem',
              listStyleType: 'disc'
            }}>
              <li style={{ marginBottom: '0.75rem' }}>Service concerns (no-shows, lateness, unprofessional behaviour, or unsatisfactory quality).</li>
              <li style={{ marginBottom: '0.75rem' }}>Payment disputes or refund requests.</li>
              <li style={{ marginBottom: '0.75rem' }}>Platform-related issues such as technical errors or booking glitches.</li>
            </ul>
            <p style={{
              marginBottom: '1rem',
              color: '#2b2118'
            }}>
              Complaints must include the booking ID, a clear description of the issue, and supporting evidence such as photos, screenshots, or payment proof. Complaints lacking evidence may not be considered.
            </p>
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              <strong>Resolution Process:</strong>
            </p>
            <ol style={{
              marginBottom: '1.5rem',
              color: '#2b2118',
              paddingLeft: '2rem',
              listStyleType: 'decimal'
            }}>
              <li style={{ marginBottom: '0.75rem' }}><strong>Complaint Received</strong> – Details are submitted via email with booking ID, description, and supporting evidence.</li>
              <li style={{ marginBottom: '0.75rem' }}><strong>Review & Verification</strong> – The support team investigates by reviewing evidence and contacting both parties if required.</li>
              <li style={{ marginBottom: '0.75rem' }}><strong>Decision & Action</strong> – <strong>MehndiMe</strong> will issue a fair and final decision, which may include: 
              <ul style={{
                marginTop: '1rem',
                marginBottom: '0rem',
                color: '#2b2118',
                paddingLeft: '2rem',
                listStyleType: 'disc'
              }}>
                <li style={{ marginBottom: '0.75rem' }}>Refund or adjustment of booking fees (where applicable).</li>
                <li style={{ marginBottom: '0.75rem' }}>Cancellation without penalty (if justified).</li>
                <li style={{ marginBottom: '0.75rem' }}>Warning or suspension of user accounts in cases of misconduct.</li>
              </ul>
              </li>
              <li style={{ marginBottom: '0.75rem' }}><strong>Closure</strong> – Once a decision is made, both parties will be notified, and the case will be closed.</li>
            </ol>
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              <strong>Resolution Timeline:</strong> 
            </p>
            <ul style={{
              marginBottom: '1rem',
              color: '#2b2118',
              paddingLeft: '2rem',
              listStyleType: 'disc'
            }}>
              <li style={{ marginBottom: '0.75rem' }}><strong>Acknowledgement:</strong> Within 24 hours.</li>
              <li style={{ marginBottom: '0.75rem' }}><strong>Investigation:</strong> Within 3–5 working days.</li>
              <li style={{ marginBottom: '0.75rem' }}><strong>Final Resolution:</strong> Within 7 working days (depending on complexity).</li>
            </ul>
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              All parties must communicate respectfully, cooperate fully, and refrain from harassment or false claims. Failure to comply may result in disciplinary action.
            </p>
            <p style={{
              marginBottom: '0.5rem',
              color: '#2b2118'
            }}>
              <strong>MehndiMe</strong> reviews complaints and feedback regularly to improve processes and ensure fairness and accountability.
            </p>
            <p style={{
              marginBottom: '1.5rem',
              color: '#2b2118'
            }}>
              <strong>MehndiMe</strong>'s decision shall be considered final for all disputes managed within the platform.
            </p>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              b. Response Procedure
            </h2>
            <p style={{
              marginBottom: '1.5rem',
              color: '#2b2118'
            }}>
              Upon receiving a safeguarding or dispute-related report, <strong>MehndiMe</strong> will acknowledge receipt within 48 hours, take immediate action if required, and, where necessary, refer matters to law enforcement or child protection authorities.
            </p>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              c. Confidentiality and Data Protection
            </h2>
            <p style={{
              marginBottom: '1.5rem',
              color: '#2b2118'
            }}>
              All safeguarding and complaint-related data is handled under the UK GDPR and Data Protection Act 2018. Information is shared only with those necessary for investigation or compliance.
            </p>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              d. Review and Updates
            </h2>
            <p style={{
              marginBottom: '1.5rem',
              color: '#2b2118'
            }}>
              This policy will be reviewed annually or sooner if legal or operational updates are required. Changes will be published on the <strong>MehndiMe</strong> website and communicated to users.
            </p>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              e. Contact
            </h2>
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              For safeguarding or dispute-related queries, contact:
            </p>

            {/* Section 16 */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '3rem',
              marginBottom: '1.5rem',
              lineHeight: '1.3'
            }}>
              16. Platform Conduct & Off-Platform Policy – MehndiMe (UK)
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              a. Purpose and Platform Integrity
            </h2>
            <p style={{
              marginBottom: '1.5rem',
              color: '#2b2118'
            }}>
              <strong>MehndiMe</strong> provides a trusted and secure digital space where Clients and Artists can connect, communicate, and complete bookings safely. To protect both parties, all communication, proposals, and payments must take place exclusively within the <strong>MehndiMe</strong> platform. This ensures that users are covered by <strong>MehndiMe</strong>'s Terms and Conditions, Dispute Resolution Policy, and Payment Protection systems. Moving interactions or transactions outside the platform removes these safeguards and exposes both parties to risk, fraud, and loss of support. By using <strong>MehndiMe</strong>, all users agree to maintain the integrity of the platform and conduct their business transparently within it.
            </p>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              b. Off-Platform Contact and Transactions
            </h2>
            <p style={{
              marginBottom: '1rem',
              color: '#2b2118'
            }}>
              To protect community trust and ensure compliance with our safety and data-protection standards, users are strictly prohibited from requesting, sharing, or exchanging any personal or direct contact information for the purpose of arranging bookings, payments, or discussions outside the platform. This includes, but is not limited to:
            </p>
            <ul style={{
              marginBottom: '1rem',
              color: '#2b2118',
              paddingLeft: '2rem',
              listStyleType: 'disc'
            }}>
              <li style={{ marginBottom: '0.75rem' }}>Phone numbers or WhatsApp details</li>
              <li style={{ marginBottom: '0.75rem' }}>Email addresses</li>
              <li style={{ marginBottom: '0.75rem' }}>Social media handles or usernames</li>
              <li style={{ marginBottom: '0.75rem' }}>External website links or online portfolio links not hosted within <strong>MehndiMe</strong></li>
              <li style={{ marginBottom: '0.75rem' }}>QR codes, business cards, or other promotional materials</li>
              <li style={{ marginBottom: '0.75rem' }}>Payment platform details (PayPal, bank transfers, etc.)</li>
            </ul>
            <p style={{
              marginBottom: '1.5rem',
              color: '#2b2118'
            }}>
              Any attempt to shift communication or transactions outside <strong>MehndiMe</strong> is considered a serious breach of this policy and the <strong>MehndiMe</strong> Terms of Use.
            </p>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              c. Consequences of Violation
            </h2>
            <p style={{
              marginBottom: '1rem',
              color: '#2b2118'
            }}>
              If a user (Client or Artist) is found to be:
            </p>
            <ul style={{
              marginBottom: '1rem',
              color: '#2b2118',
              paddingLeft: '2rem',
              listStyleType: 'disc'
            }}>
              <li style={{ marginBottom: '0.75rem' }}>Soliciting or encouraging off-platform contact;</li>
              <li style={{ marginBottom: '0.75rem' }}>Sharing personal details or payment information for off-platform use; or</li>
              <li style={{ marginBottom: '0.75rem' }}>Attempting to complete or promote bookings outside <strong>MehndiMe</strong>;</li>
            </ul>
            <p style={{
              marginBottom: '1rem',
              color: '#2b2118'
            }}>
              <strong>MehndiMe</strong> reserves the right to take immediate corrective action. Depending on the severity and frequency, this may include:
            </p>
            <ul style={{
              marginBottom: '1rem',
              color: '#2b2118',
              paddingLeft: '2rem',
              listStyleType: 'disc'
            }}>
              <li style={{ marginBottom: '0.75rem' }}>Formal written warnings;</li>
              <li style={{ marginBottom: '0.75rem' }}>Temporary suspension of the account;</li>
              <li style={{ marginBottom: '0.75rem' }}>Permanent account termination; and/or</li>
              <li style={{ marginBottom: '0.75rem' }}>Forfeiture of pending bookings, proposals, or earnings associated with the account.</li>
            </ul>
            <p style={{
              marginBottom: '1.5rem',
              color: '#2b2118'
            }}>
              Repeated or deliberate attempts to bypass <strong>MehndiMe</strong> systems may also lead to legal action or referral to relevant authorities if fraud or harm is suspected.
            </p>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              d. Monitoring, Detection, and Reporting
            </h2>
            <p style={{
              marginBottom: '1rem',
              color: '#2b2118'
            }}>
              To uphold the integrity and safety of the <strong>MehndiMe</strong> community, the platform may:
            </p>
            <ul style={{
              marginBottom: '1rem',
              color: '#2b2118',
              paddingLeft: '2rem',
              listStyleType: 'disc'
            }}>
              <li style={{ marginBottom: '0.75rem' }}>Automatically monitor communications using technology designed to identify phrases or patterns suggesting off-platform contact or payment attempts;</li>
              <li style={{ marginBottom: '0.75rem' }}>Temporarily restrict certain features if suspicious activity is detected; and</li>
              <li style={{ marginBottom: '0.75rem' }}>Allow users to flag and report messages or profiles they believe violate this policy.</li>
            </ul>
            <p style={{
              marginBottom: '1.5rem',
              color: '#2b2118'
            }}>
              All reports are reviewed confidentially by <strong>MehndiMe</strong>'s Trust & Safety team. Where appropriate, <strong>MehndiMe</strong> may contact both parties for clarification before taking action.
            </p>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              e. Rationale for the Policy
            </h2>
            <p style={{
              marginBottom: '1rem',
              color: '#2b2118'
            }}>
              This policy exists to safeguard all users and maintain transparency and trust across the platform. It ensures that:
            </p>
            <ul style={{
              marginBottom: '1rem',
              color: '#2b2118',
              paddingLeft: '2rem',
              listStyleType: 'disc'
            }}>
              <li style={{ marginBottom: '0.75rem' }}>Clients are protected against scams, unverified payments, and unsafe practices;</li>
              <li style={{ marginBottom: '0.75rem' }}>Artists receive timely and guaranteed payments through <strong>MehndiMe</strong>'s secure system;</li>
              <li style={{ marginBottom: '0.75rem' }}>Reviews, ratings, and bookings remain verifiable and authentic;</li>
              <li style={{ marginBottom: '0.75rem' }}><strong>MehndiMe</strong> can provide dispute resolution, refunds, or mediation where needed; and</li>
              <li style={{ marginBottom: '0.75rem' }}>The platform complies with UK consumer protection and data-protection laws.</li>
            </ul>
            <p style={{
              marginBottom: '1.5rem',
              color: '#2b2118'
            }}>
              Attempting to bypass <strong>MehndiMe</strong>'s systems undermines community safety and fairness and will result in the permanent removal of the offending account.
            </p>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '2rem',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              f. Commitment to a Safe and Fair Marketplace
            </h2>
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              <strong>MehndiMe</strong> is committed to promoting professionalism, accountability, and fairness between Clients and Artists. We encourage all users to communicate openly within the platform, report inappropriate behaviour, and support a transparent and secure booking environment. By using <strong>MehndiMe</strong>, you agree to uphold these standards and understand that compliance with this policy is essential to maintaining a safe and trusted community for all.
            </p>

            {/* Section 17 */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '3rem',
              marginBottom: '1.5rem',
              lineHeight: '1.3'
            }}>
              17. Governing Law & Jurisdiction
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              These Terms are governed by and construed in accordance with the laws of England and Wales. All Users agree to submit to the exclusive jurisdiction of the courts of England.
            </p>

            {/* Section 18 */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '3rem',
              marginBottom: '1.5rem',
              lineHeight: '1.3'
            }}>
              18. Modifications
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              <strong>MehndiMe</strong> may update these Terms periodically. Where significant changes are made, Users will be notified via email or platform alerts. Continued use of the platform after such updates indicates acceptance of the revised Terms.
            </p>

            {/* Section 19 */}
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#8B5E34',
              marginTop: '3rem',
              marginBottom: '1.5rem',
              lineHeight: '1.3'
            }}>
              19. Contact Us
            </h1>
            <hr style={{ border: 'none', borderTop: '1px solid #ddd', marginBottom: '1.5rem' }} />
            <p style={{
              marginBottom: '3rem',
              color: '#2b2118'
            }}>
              If you have any questions or concerns about these Terms, please contact us at <a href="mailto:team.mehndime@gmail.com" style={{ color: '#8B5E34', textDecoration: 'underline' }}>team.mehndime@gmail.com</a> — we're happy to help.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default TermsAndConditions;
