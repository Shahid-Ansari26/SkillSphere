import './StudentDashboard.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Award,
  Bell,
  ArrowRight,
  Clock,
  CheckCircle,
  RefreshCw,
  UserRound,
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

function StudentDashboard() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem('skillsphereUser') || 'null'
      );
    } catch {
      return null;
    }
  });

  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    const token = sessionStorage.getItem('skillsphereToken');

    if (!token) {
      setError('Please log in to view your dashboard.');
      setLoading(false);
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    setLoading(true);
    setError('');

    try {
      const [learningResponse, certificateResponse, notificationResponse, userResponse] =
        await Promise.all([
          fetch(`${API_URL}/enrollments/my-courses`, { headers }),
          fetch(`${API_URL}/certificates/my`, { headers }),
          fetch(`${API_URL}/notifications`, { headers }),
          fetch(`${API_URL}/auth/me`, { headers }),
        ]);

      if (
        !learningResponse.ok ||
        !certificateResponse.ok ||
        !notificationResponse.ok ||
        !userResponse.ok
      ) {
        throw new Error(
          'Unable to load all dashboard information. Please refresh and try again.'
        );
      }

      const [learningData, certificateData, notificationData, userData] =
        await Promise.all([
          learningResponse.json(),
          certificateResponse.json(),
          notificationResponse.json(),
          userResponse.json(),
        ]);

      const enrollmentItems = Array.isArray(learningData)
        ? learningData
        : learningData.enrollments || [];

      setEnrollments(enrollmentItems);

      setCertificates(
        Array.isArray(certificateData)
          ? certificateData
          : certificateData.certificates || []
      );

      setNotifications(
        (notificationData.notifications || []).slice(0, 5)
      );

      setUnreadCount(notificationData.unreadCount || 0);

      if (userData.user) {
        setUser(userData.user);
        sessionStorage.setItem(
          'skillsphereUser',
          JSON.stringify(userData.user)
        );
      }
    } catch (err) {
      setError(
        err.message || 'Something went wrong while loading your dashboard.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalCourses = enrollments.length;

  const completedCourses = enrollments.filter(
    (item) =>
      item.status === 'completed' ||
      item.progress >= 100
  ).length;

  const inProgressCourses = enrollments.filter(
    (item) =>
      item.status !== 'completed' &&
      item.progress < 100
  ).length;

  const overallProgress = totalCourses
    ? Math.round(
        enrollments.reduce(
          (total, item) => total + Math.min(Number(item.progress) || 0, 100),
          0
        ) / totalCourses
      )
    : 0;

  const getCourseTitle = (enrollment) => {
    const course = enrollment.course || enrollment.courseId;
    return typeof course === 'object'
      ? course.title || 'Untitled course'
      : 'Enrolled course';
  };

  const getCourseId = (enrollment) => {
    const course = enrollment.course || enrollment.courseId;
    return typeof course === 'object'
      ? course._id || course.id
      : course;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="student-dashboard">
        <p className="dashboard-status">
          <RefreshCw size={20} /> Loading your dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <header className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">
            <LayoutDashboard size={16} /> STUDENT WORKSPACE
          </span>

          <h1>
            Welcome back{user?.name ? `, ${user.name}` : ''}!
          </h1>

          <p>Track your progress and continue learning with SkillSphere.</p>
        </div>

        <button
          type="button"
          className="dashboard-refresh"
          onClick={fetchDashboardData}
        >
          <RefreshCw size={17} /> Refresh
        </button>
      </header>

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      <section className="dashboard-stats">
        <article className="dashboard-stat-card">
          <span className="dashboard-stat-icon blue">
            <BookOpen size={23} />
          </span>
          <div>
            <p>Enrolled Courses</p>
            <h2>{totalCourses}</h2>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <span className="dashboard-stat-icon green">
            <CheckCircle size={23} />
          </span>
          <div>
            <p>Completed Courses</p>
            <h2>{completedCourses}</h2>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <span className="dashboard-stat-icon orange">
            <Clock size={23} />
          </span>
          <div>
            <p>In Progress</p>
            <h2>{inProgressCourses}</h2>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <span className="dashboard-stat-icon purple">
            <Award size={23} />
          </span>
          <div>
            <p>Certificates</p>
            <h2>{certificates.length}</h2>
          </div>
        </article>
      </section>

      <section className="dashboard-panel overall-progress-panel">
        <div className="dashboard-section-heading">
          <div>
            <h2>Overall Learning Progress</h2>
            <p>Your average progress across enrolled courses.</p>
          </div>
          <strong>{overallProgress}%</strong>
        </div>

        <div
          className="dashboard-progress-track"
          role="progressbar"
          aria-label="Overall learning progress"
          aria-valuenow={overallProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="dashboard-progress-fill"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        <Link to="/my-learning" className="dashboard-text-link">
          View all my learning <ArrowRight size={17} />
        </Link>
      </section>

      <div className="dashboard-content-grid">
        <section className="dashboard-panel">
          <div className="dashboard-section-heading">
            <div>
              <h2>Continue Learning</h2>
              <p>Pick up where you left off.</p>
            </div>

            <BookOpen size={22} />
          </div>

          {enrollments.length === 0 ? (
            <div className="dashboard-empty">
              <BookOpen size={32} />
              <p>You haven't enrolled in any courses yet.</p>
              <Link to="/" className="dashboard-primary-link">
                Explore Courses <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="dashboard-course-list">
              {enrollments.slice(0, 4).map((enrollment) => {
                const courseId = getCourseId(enrollment);
                const progress = Math.min(
                  Number(enrollment.progress) || 0,
                  100
                );

                return (
                  <article
                    className="dashboard-course-item"
                    key={enrollment._id || courseId}
                  >
                    <div className="dashboard-course-icon">
                      <BookOpen size={21} />
                    </div>

                    <div className="dashboard-course-details">
                      <h3>{getCourseTitle(enrollment)}</h3>
                      <div className="dashboard-mini-progress">
                        <div style={{ width: `${progress}%` }} />
                      </div>
                      <span>{progress}% complete</span>
                    </div>

                    {courseId ? (
                      <Link
                        to={`/courses/${courseId}/learn`}
                        className="dashboard-icon-link"
                        aria-label={`Continue ${getCourseTitle(enrollment)}`}
                        title="Continue learning"
                      >
                        <ArrowRight size={19} />
                      </Link>
                    ) : (
                      <Link
                        to="/my-learning"
                        className="dashboard-icon-link"
                        aria-label="View my learning"
                      >
                        <ArrowRight size={19} />
                      </Link>
                    )}
                  </article>
                );
              })}

              <Link to="/my-learning" className="dashboard-text-link">
                View all courses <ArrowRight size={17} />
              </Link>
            </div>
          )}
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-section-heading">
            <div>
              <h2>Recent Notifications</h2>
              <p>Stay up to date with SkillSphere.</p>
            </div>

            <span className="dashboard-notification-count">
              <Bell size={17} /> {unreadCount} unread
            </span>
          </div>

          {notifications.length === 0 ? (
            <div className="dashboard-empty">
              <Bell size={30} />
              <p>You're all caught up. No notifications yet.</p>
            </div>
          ) : (
            <div className="dashboard-notification-list">
              {notifications.map((notification) => (
                <article
                  className={
                    notification.isRead
                      ? 'dashboard-notification'
                      : 'dashboard-notification unread'
                  }
                  key={notification._id}
                >
                  <span className="dashboard-notification-icon">
                    <Bell size={18} />
                  </span>

                  <div>
                    <h3>{notification.title}</h3>
                    <p>{notification.message}</p>
                    <span>{formatDate(notification.createdAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}

          <Link to="/notifications" className="dashboard-text-link">
            View all notifications <ArrowRight size={17} />
          </Link>
        </section>
      </div>

      <section className="dashboard-panel dashboard-shortcuts">
        <div className="dashboard-section-heading">
          <div>
            <h2>Quick Links</h2>
            <p>Jump straight to what you need.</p>
          </div>
        </div>

        <div className="dashboard-shortcut-grid">
          <Link to="/my-learning" className="dashboard-shortcut">
            <BookOpen size={23} />
            <span>My Learning</span>
            <ArrowRight size={17} />
          </Link>

          <Link to="/my-learning" className="dashboard-shortcut">
            <GraduationCap size={23} />
            <span>My Certificates</span>
            <ArrowRight size={17} />
          </Link>

          <Link to="/notifications" className="dashboard-shortcut">
            <Bell size={23} />
            <span>Notifications</span>
            <ArrowRight size={17} />
          </Link>

          <Link to="/profile" className="dashboard-shortcut">
            <UserRound size={23} />
            <span>My Profile</span>
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default StudentDashboard;
