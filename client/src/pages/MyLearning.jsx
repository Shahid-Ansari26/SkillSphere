
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  Search,
  PlayCircle,
  CheckCircle2,
  Clock3,
  Award,
  ExternalLink,
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api/enrollments/my-courses';
const CERTIFICATE_API = 'http://localhost:5000/api/certificates/my';

function MyLearning() {
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [certificateLoading, setCertificateLoading] = useState(true);
  const [error, setError] = useState('');
  const [certificateError, setCertificateError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Read the logged-in user's information.
  let currentUser = null;

  try {
    const storedUser = sessionStorage.getItem('skillsphereUser');
    currentUser = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    currentUser = null;
  }

  // Calculate learning statistics.
  const totalEnrolled = enrollments.length;

  const completedCourses = enrollments.filter(
    (enrollment) => enrollment.status === 'completed'
  ).length;

  const inProgressCourses = totalEnrolled - completedCourses;

  const overallProgress =
    totalEnrolled === 0
      ? 0
      : Math.round(
          enrollments.reduce(
            (total, enrollment) =>
              total + (Number(enrollment.progress) || 0),
            0
          ) / totalEnrolled
        );

  // Fetch courses and certificates.
  useEffect(() => {
    const fetchMyLearning = async () => {
      const token = sessionStorage.getItem('skillsphereToken');

      if (!token) {
        setError('Please log in to view your courses.');
        setCertificateError('Please log in to view your certificates.');
        setLoading(false);
        setCertificateLoading(false);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Load enrolled courses.
      try {
        const response = await fetch(API_URL, { headers });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || 'Unable to load your courses.'
          );
        }

        setEnrollments(data.enrollments || []);
      } catch (err) {
        setError(err.message || 'Unable to load your courses.');
      } finally {
        setLoading(false);
      }

      // Load earned certificates.
      try {
        const response = await fetch(CERTIFICATE_API, { headers });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || 'Unable to load your certificates.'
          );
        }

        setCertificates(data.certificates || []);
      } catch (err) {
        setCertificateError(
          err.message || 'Unable to load your certificates.'
        );
      } finally {
        setCertificateLoading(false);
      }
    };

    fetchMyLearning();
  }, []);

  // Match a certificate to its course using the course ID.
  const getCertificateForCourse = (courseId) =>
    certificates.find(
      (certificate) =>
        String(certificate.courseId) === String(courseId)
    );

  // Search and filter enrolled courses.
  const filteredEnrollments = enrollments.filter((enrollment) => {
    const course = enrollment.course;

    if (!course) return false;

    const search = searchTerm.trim().toLowerCase();
    const title = String(course.title || '').toLowerCase();
    const instructor = String(course.instructor || '').toLowerCase();

    const matchesSearch =
      title.includes(search) || instructor.includes(search);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'completed' &&
        enrollment.status === 'completed') ||
      (statusFilter === 'in-progress' &&
        enrollment.status !== 'completed');

    return matchesSearch && matchesStatus;
  });

  const cardStyle = {
    padding: '22px',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    background: '#ffffff',
  };

  const primaryButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '11px 16px',
    borderRadius: '9px',
    background: '#2563eb',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '14px',
  };

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '40px 24px',
        color: '#0f172a',
      }}
    >
      {/* Back to homepage */}
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: '#2563eb',
          textDecoration: 'none',
          fontWeight: '600',
        }}
      >
        ← Back to Explore
      </Link>

      {/* Dashboard heading */}
      <div style={{ marginTop: '32px' }}>
        <GraduationCap size={42} color="#2563eb" />

        <h1 style={{ marginBottom: '8px', fontSize: '32px' }}>
          Welcome back
          {currentUser?.name ? `, ${currentUser.name}` : ''}! 👋
        </h1>

        <p
          style={{
            color: '#64748b',
            marginTop: 0,
            lineHeight: 1.7,
          }}
        >
          Continue your learning journey and achieve your goals
          with SkillSphere.
        </p>
      </div>

      {/* Course loading error */}
      {error && (
        <div
          role="alert"
          style={{
            color: '#b91c1c',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            padding: '14px',
            borderRadius: '10px',
            marginTop: '20px',
          }}
        >
          {error}
        </div>
      )}

      {/* Course loading state */}
      {loading ? (
        <div
          style={{
            padding: '40px 0',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          Loading your courses...
        </div>
      ) : error && enrollments.length === 0 ? (
        <div
          style={{
            marginTop: '24px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            background: '#ffffff',
          }}
        >
          <p style={{ color: '#64748b' }}>
            Please check your login and server connection, then
            refresh this page.
          </p>

          <Link to="/login" style={primaryButtonStyle}>
            Go to Login
          </Link>
        </div>
      ) : (
        <>
          {/* Learning summary cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginTop: '28px',
            }}
          >
            <div
              style={{
                ...cardStyle,
                borderColor: '#dbeafe',
                background: '#eff6ff',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#1d4ed8',
                }}
              >
                <BookOpen size={22} />
                <p style={{ margin: 0 }}>Total Enrolled</p>
              </div>
              <h2 style={{ fontSize: '32px', margin: '12px 0 0' }}>
                {totalEnrolled}
              </h2>
            </div>

            <div
              style={{
                ...cardStyle,
                borderColor: '#bbf7d0',
                background: '#f0fdf4',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#15803d',
                }}
              >
                <CheckCircle2 size={22} />
                <p style={{ margin: 0 }}>Completed</p>
              </div>
              <h2 style={{ fontSize: '32px', margin: '12px 0 0' }}>
                {completedCourses}
              </h2>
            </div>

            <div
              style={{
                ...cardStyle,
                background: '#f8fafc',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#475569',
                }}
              >
                <Clock3 size={22} />
                <p style={{ margin: 0 }}>In Progress</p>
              </div>
              <h2 style={{ fontSize: '32px', margin: '12px 0 0' }}>
                {inProgressCourses}
              </h2>
            </div>

            {/* Certificate summary */}
            <div
              style={{
                ...cardStyle,
                borderColor: '#fde68a',
                background: '#fffbeb',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#92400e',
                }}
              >
                <Award size={22} />
                <p style={{ margin: 0 }}>Certificates Earned</p>
              </div>
              <h2 style={{ fontSize: '32px', margin: '12px 0 0' }}>
                {certificateLoading ? '…' : certificates.length}
              </h2>
            </div>
          </div>

          {/* Overall learning progress */}
          <div
            style={{
              ...cardStyle,
              marginTop: '20px',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '14px',
                flexWrap: 'wrap',
              }}
            >
              <h3 style={{ margin: 0 }}>
                Overall Learning Progress
              </h3>
              <strong style={{ color: '#2563eb', fontSize: '22px' }}>
                {overallProgress}%
              </strong>
            </div>

            <div
              role="progressbar"
              aria-label="Overall learning progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={overallProgress}
              style={{
                height: '12px',
                background: '#e2e8f0',
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${overallProgress}%`,
                  background: '#2563eb',
                  borderRadius: '10px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>

            <p
              style={{
                color: '#64748b',
                marginBottom: 0,
                lineHeight: 1.6,
              }}
            >
              Keep learning and make progress toward your goals!
            </p>
          </div>

          {/* Certificates section */}
          <section
            aria-labelledby="certificates-heading"
            style={{ marginTop: '36px' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div>
                <h2
                  id="certificates-heading"
                  style={{ margin: 0, fontSize: '25px' }}
                >
                  My Certificates
                </h2>
                <p style={{ color: '#64748b', lineHeight: 1.6 }}>
                  Certificates are available after you complete a course.
                </p>
              </div>
              <Award size={34} color="#b45309" />
            </div>

            {certificateLoading ? (
              <div style={{ ...cardStyle, color: '#64748b' }}>
                Loading your certificates...
              </div>
            ) : certificateError ? (
              <div
                role="alert"
                style={{
                  ...cardStyle,
                  borderColor: '#fecaca',
                  background: '#fef2f2',
                  color: '#b91c1c',
                }}
              >
                {certificateError}
              </div>
            ) : certificates.length === 0 ? (
              <div
                style={{
                  ...cardStyle,
                  textAlign: 'center',
                  padding: '32px 20px',
                }}
              >
                <Award
                  size={44}
                  color="#94a3b8"
                  style={{ margin: '0 auto' }}
                />
                <h3>No certificates earned yet</h3>
                <p style={{ color: '#64748b', lineHeight: 1.7 }}>
                  Complete all lessons in an eligible course to earn
                  your certificate. It will appear here automatically.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '18px',
                }}
              >
                {certificates.map((certificate) => (
                  <div
                    key={certificate.certificateId}
                    style={{
                      ...cardStyle,
                      borderColor: '#fde68a',
                      background:
                        'linear-gradient(135deg, #fffbeb, #ffffff)',
                    }}
                  >
                    <Award size={38} color="#b45309" />

                    <h3 style={{ marginBottom: '8px' }}>
                      {certificate.courseTitle}
                    </h3>

                    <p style={{ color: '#64748b', fontSize: '14px' }}>
                      Awarded to {certificate.studentName}
                    </p>

                    <p style={{ color: '#64748b', fontSize: '14px' }}>
                      Completed:{' '}
                      {certificate.completionDate
                        ? new Date(
                            certificate.completionDate
                          ).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Date unavailable'}
                    </p>

                    <Link
                      to={`/certificates/${certificate.certificateId}`}
                      style={{
                        ...primaryButtonStyle,
                        marginTop: '8px',
                        background: '#92400e',
                      }}
                    >
                      <ExternalLink size={17} />
                      View Certificate
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Empty enrollment state */}
          {enrollments.length === 0 ? (
            <div
              style={{
                ...cardStyle,
                marginTop: '32px',
                padding: '48px 24px',
                textAlign: 'center',
              }}
            >
              <BookOpen size={48} color="#94a3b8" />
              <h2>No courses enrolled yet</h2>
              <p style={{ color: '#64748b', lineHeight: 1.6 }}>
                Explore our courses and start your learning journey.
              </p>
              <Link
                to="/"
                style={{ ...primaryButtonStyle, marginTop: '16px' }}
              >
                Explore Courses
              </Link>
            </div>
          ) : (
            <>
              {/* Search and status filters */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginTop: '36px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    flex: '1 1 280px',
                    maxWidth: '450px',
                    padding: '0 14px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    background: '#ffffff',
                  }}
                >
                  <Search size={20} color="#64748b" />
                  <input
                    type="text"
                    placeholder="Search courses or instructors..."
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }
                    aria-label="Search courses by title or instructor"
                    style={{
                      width: '100%',
                      minWidth: 0,
                      padding: '12px 0',
                      border: 'none',
                      outline: 'none',
                      fontSize: '15px',
                      background: 'transparent',
                    }}
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                  aria-label="Filter courses by progress status"
                  style={{
                    flex: '0 1 190px',
                    minWidth: '160px',
                    padding: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    background: '#ffffff',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">All Courses</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <p style={{ color: '#64748b', fontSize: '14px' }}>
                Showing {filteredEnrollments.length} of {totalEnrolled}{' '}
                enrolled courses
              </p>

              {/* No search results */}
              {filteredEnrollments.length === 0 ? (
                <div
                  style={{
                    ...cardStyle,
                    marginTop: '20px',
                    padding: '40px 24px',
                    textAlign: 'center',
                  }}
                >
                  <Search size={40} color="#94a3b8" />
                  <h2>No matching courses found</h2>
                  <p style={{ color: '#64748b' }}>
                    Try another search term or change the status filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    style={{
                      padding: '10px 16px',
                      border: 'none',
                      borderRadius: '8px',
                      background: '#2563eb',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontWeight: '600',
                    }}
                  >
                    Clear Search and Filter
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '24px',
                    marginTop: '20px',
                  }}
                >
                  {filteredEnrollments.map((enrollment) => {
                    const course = enrollment.course;

                    const progress = Math.min(
                      100,
                      Math.max(0, Number(enrollment.progress) || 0)
                    );

                    const isCompleted =
                      enrollment.status === 'completed';

                    const certificate = getCertificateForCourse(
                      course._id
                    );

                    return (
                      <div
                        key={enrollment._id}
                        style={{
                          ...cardStyle,
                          boxShadow:
                            '0 4px 12px rgba(15, 23, 42, 0.05)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        <div
                          style={{
                            width: '52px',
                            height: '52px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '12px',
                            background: '#eff6ff',
                          }}
                        >
                          <BookOpen size={28} color="#2563eb" />
                        </div>

                        <span
                          style={{
                            alignSelf: 'flex-start',
                            display: 'inline-block',
                            padding: '5px 10px',
                            marginTop: '12px',
                            borderRadius: '20px',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                        >
                          {course.category || 'General'}
                        </span>

                        <h2
                          style={{
                            margin: '8px 0 4px',
                            fontSize: '20px',
                            lineHeight: 1.4,
                          }}
                        >
                          {course.title}
                        </h2>

                        <p
                          style={{
                            color: '#64748b',
                            margin: 0,
                            fontSize: '14px',
                          }}
                        >
                          Instructor:{' '}
                          {course.instructor || 'SkillSphere Team'}
                        </p>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px',
                            marginTop: '20px',
                          }}
                        >
                          <strong style={{ fontSize: '14px' }}>
                            Course progress
                          </strong>
                          <strong
                            style={{
                              color: isCompleted ? '#15803d' : '#2563eb',
                              fontSize: '15px',
                            }}
                          >
                            {progress}%
                          </strong>
                        </div>

                        <div
                          role="progressbar"
                          aria-label={`${course.title} progress`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={progress}
                          style={{
                            height: '10px',
                            background: '#e2e8f0',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            marginTop: '4px',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${progress}%`,
                              background: isCompleted
                                ? '#16a34a'
                                : '#2563eb',
                              borderRadius: '10px',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>

                        <span
                          style={{
                            alignSelf: 'flex-start',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '12px',
                            padding: '7px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '700',
                            background: isCompleted
                              ? '#dcfce7'
                              : '#dbeafe',
                            color: isCompleted
                              ? '#166534'
                              : '#1d4ed8',
                          }}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 size={14} />
                              Completed
                            </>
                          ) : (
                            <>
                              <Clock3 size={14} />
                              In Progress
                            </>
                          )}
                        </span>

                        <Link
                          to={`/courses/${course._id}/learn`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '12px 16px',
                            marginTop: '16px',
                            borderRadius: '10px',
                            background: isCompleted
                              ? '#15803d'
                              : '#2563eb',
                            color: '#ffffff',
                            fontWeight: '600',
                            textDecoration: 'none',
                            textAlign: 'center',
                          }}
                        >
                          <PlayCircle size={18} />
                          {isCompleted
                            ? 'Review Course'
                            : progress > 0
                              ? 'Continue Learning'
                              : 'Start Learning'}
                          <span aria-hidden="true">→</span>
                        </Link>

                        {/* Show certificate button when available */}
                        {certificate && (
                          <Link
                            to={`/certificates/${certificate.certificateId}`}
                            style={{
                              ...primaryButtonStyle,
                              marginTop: '6px',
                              background: '#92400e',
                            }}
                          >
                            <Award size={17} />
                            View Certificate
                          </Link>
                        )}

                        <Link
                          to={`/courses/${course._id}`}
                          style={{
                            display: 'block',
                            marginTop: '6px',
                            padding: '8px',
                            color: '#475569',
                            fontSize: '14px',
                            fontWeight: '600',
                            textDecoration: 'none',
                            textAlign: 'center',
                          }}
                        >
                          View Course Details
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default MyLearning;
