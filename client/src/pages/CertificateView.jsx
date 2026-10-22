import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Award, ArrowLeft, Printer, LoaderCircle } from 'lucide-react';
import './CertificateView.css';

const API_URL = 'http://localhost:5000/api/certificates';

function CertificateView() {
  const { certificateId } = useParams();

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        setError('');

        const token = sessionStorage.getItem('skillsphereToken');

        if (!token) {
          throw new Error('Please log in to view your certificate.');
        }

        const response = await fetch(
          `${API_URL}/${certificateId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || 'Unable to load this certificate.'
          );
        }

        setCertificate(data.certificate);
      } catch (err) {
        setError(err.message || 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId]);

  const formatDate = (date) => {
    if (!date) return 'Date unavailable';

    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="certificate-message">
        <LoaderCircle className="certificate-spinner" size={32} />
        <p>Preparing your certificate...</p>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="certificate-message">
        <Award size={48} />
        <h2>Certificate unavailable</h2>
        <p>{error || 'We could not find this certificate.'}</p>
        <Link to="/my-learning" className="certificate-back-link">
          <ArrowLeft size={18} />
          Back to My Learning
        </Link>
      </div>
    );
  }

  return (
    <div className="certificate-page-wrapper">
      <div className="certificate-toolbar no-print">
        <Link to="/my-learning" className="certificate-back-link">
          <ArrowLeft size={18} />
          Back to My Learning
        </Link>

        <button
          type="button"
          className="certificate-print-button"
          onClick={handlePrint}
        >
          <Printer size={18} />
          Print / Save as PDF
        </button>
      </div>

      <article className="certificate-paper">
        <div className="certificate-inner-border">
          <div className="certificate-top-decoration">
            <span className="certificate-star">✦</span>
            <span className="certificate-star">✦</span>
            <span className="certificate-star">✦</span>
          </div>

          <div className="certificate-brand">
            <span className="certificate-brand-icon">S</span>
            <span>SkillSphere</span>
          </div>

          <div className="certificate-award-icon">
            <Award size={54} strokeWidth={1.4} />
          </div>

          <p className="certificate-eyebrow">
            CERTIFICATE OF COMPLETION
          </p>

          <h1 className="certificate-heading">
            Certificate
          </h1>

          <p className="certificate-intro">
            This certificate is proudly presented to
          </p>

          <h2 className="certificate-student-name">
            {certificate.studentName}
          </h2>

          <div className="certificate-name-line"></div>

          <p className="certificate-description">
            for successfully completing the course
          </p>

          <h3 className="certificate-course-title">
            {certificate.courseTitle}
          </h3>

          {certificate.courseDescription && (
            <p className="certificate-course-description">
              {certificate.courseDescription}
            </p>
          )}

          <p className="certificate-congratulations">
            Demonstrating dedication and commitment to learning.
          </p>

          <div className="certificate-details">
            <div className="certificate-detail">
              <span className="certificate-detail-label">
                DATE OF COMPLETION
              </span>
              <strong>
                {formatDate(certificate.completionDate)}
              </strong>
            </div>

            <div className="certificate-seal">
              <Award size={38} strokeWidth={1.3} />
              <span>VERIFIED</span>
            </div>

            <div className="certificate-detail">
              <span className="certificate-detail-label">
                COURSE DURATION
              </span>
              <strong>
                {certificate.courseDuration || 'Self-paced'}
              </strong>
            </div>
          </div>

          <div className="certificate-footer">
            <div className="certificate-signature">
              <span className="certificate-signature-line"></span>
              <strong>SkillSphere</strong>
              <small>Learning Platform</small>
            </div>

            <div className="certificate-id">
              <span>Certificate ID</span>
              <strong>{certificate.certificateId}</strong>
            </div>
          </div>

          <p className="certificate-footer-note">
            Learn today. Lead tomorrow.
          </p>
        </div>
      </article>
    </div>
  );
}

export default CertificateView;