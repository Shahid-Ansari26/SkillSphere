
import { useState, useEffect, useCallback } from 'react';
import './App.css';
import {
  Monitor,
  Code2,
  BrainCircuit,
  BookOpen,
  Bell,
} from 'lucide-react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import CourseDetails from './pages/CourseDetails';
import Signup from './pages/Signup';
import Login from './pages/Login';
import MyLearning from './pages/MyLearning';
import CourseLearning from './pages/CourseLearning';
import AdminDashboard from './pages/AdminDashboard';
import Notifications from './pages/Notifications';
import CertificateView from './pages/CertificateView';
import Profile from './pages/Profile';
import StudentDashboard from './pages/StudentDashboard';

const API_URL = 'http://localhost:5000/api/courses';
const NOTIFICATION_API_URL =
  'http://localhost:5000/api/notifications/unread-count';

function HomePage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('Explore');

  const [loggedInUser, setLoggedInUser] = useState(() => {
    const savedUser = sessionStorage.getItem('skillsphereUser');

    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    const token = sessionStorage.getItem('skillsphereToken');

    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(NOTIFICATION_API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Unable to fetch unread notifications:', error);
    }
  }, []);

  const handleLogout = () => {
  sessionStorage.removeItem('skillsphereToken');
  sessionStorage.removeItem('skillsphereUser');

  setLoggedInUser(null);
  setUnreadCount(0);
  setActiveTab('Explore');

  navigate('/');
};

  useEffect(() => {
    const token = sessionStorage.getItem('skillsphereToken');

    if (!token) {
      return;
    }

    const verifySession = async () => {
      try {
        const response = await fetch(
          'http://localhost:5000/api/auth/me',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          sessionStorage.removeItem('skillsphereToken');
          sessionStorage.removeItem('skillsphereUser');
          setLoggedInUser(null);
          setUnreadCount(0);
          return;
        }

        const data = await response.json();

        sessionStorage.setItem(
          'skillsphereUser',
          JSON.stringify(data.user)
        );

        setLoggedInUser(data.user);
      } catch (error) {
        console.error('Unable to verify login session:', error);
      }
    };

    verifySession();
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount, loggedInUser]);

  const categories = [
    'All',
    'Web Development',
    'Programming',
    'Artificial Intelligence',
  ];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(API_URL);

        if (!response.ok) {
          if (response.status === 401) {
            sessionStorage.removeItem('skillsphereToken');
            sessionStorage.removeItem('skillsphereUser');
            setUser(null);
          }

          throw new Error(data.message || 'Unable to load profile.');
        }

        const data = await response.json();
        setCourses(data);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      course.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getCourseIcon = (category) => {
    if (
      category === 'Web Development' ||
      category === 'Development'
    ) {
      return <Monitor size={48} strokeWidth={1.7} />;
    }

    if (category === 'Programming') {
      return <Code2 size={48} strokeWidth={1.7} />;
    }

    if (category === 'Artificial Intelligence') {
      return <BrainCircuit size={48} strokeWidth={1.7} />;
    }

    return <BookOpen size={48} strokeWidth={1.7} />;
  };

  return (
    <div className="app">
      <header className="navbar">
        <Link className="brand" to="/">
          <span className="brand-icon">S</span>
          SkillSphere
        </Link>

        <nav className="nav-links">
            {loggedInUser && (
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
          )}
          {['Explore', 'My Learning', 'Career'].map((tab) => (
            <button
              key={tab}
              className={
                activeTab === tab ? 'nav-link active' : 'nav-link'
              }
              onClick={() => {
                setActiveTab(tab);

                if (tab === 'Career') {
                  document.getElementById('career')?.scrollIntoView({
                    behavior: 'smooth',
                  });
                } else if (tab === 'Explore') {
                  document.getElementById('courses')?.scrollIntoView({
                    behavior: 'smooth',
                  });
                } else {
                  navigate('/my-learning');
                }
              }}
            >
              {tab}
            </button>
          ))}
          <Link
            to="/notifications"
            className="nav-link"
            onClick={fetchUnreadCount}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
            }}
          >
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              <Bell size={19} />

              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-9px',
                    minWidth: '17px',
                    height: '17px',
                    padding: '0 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '999px',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontSize: '10px',
                    lineHeight: 1,
                    fontWeight: '700',
                    boxSizing: 'border-box',
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </span>

            Notifications
          </Link>
        </nav>

        <div className="auth-nav-links">
          {loggedInUser ? (
            <>
              <span className="welcome-user">
                Hi, {loggedInUser.name}
              </span>

        <Link to="/profile" className="nav-login">
          My Profile
        </Link>

              {loggedInUser.role === 'admin' && (
                <Link to="/admin" className="nav-login">
                  Admin Dashboard
                </Link>
              )}

              <button
                type="button"
                className="nav-login"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-login">
                Log In
              </Link>

              <Link to="/signup" className="nav-signup">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      <main>
        <section className="hero-section" id="home">
          <div className="hero-content">
            <span className="eyebrow">YOUR FUTURE STARTS HERE</span>

            <h1>
              Learn new skills.
              <br />
              <span>Build your future.</span>
            </h1>

            <p>
              Discover courses, improve your skills, and take the next step
              towards your dream career with SkillSphere.
            </p>

            <a className="primary-button" href="#courses">
              Explore Courses <span>→</span>
            </a>

            <div className="hero-stats">
              <div>
                <strong>Learn</strong>
                <small>At your own pace</small>
              </div>
              <div>
                <strong>Practice</strong>
                <small>Build real skills</small>
              </div>
              <div>
                <strong>Grow</strong>
                <small>Reach your goals</small>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-orbit orbit-one"></div>
            <div className="visual-orbit orbit-two"></div>

            <div className="learning-card">
              <span className="learning-emoji">🎯</span>
              <h3>Your next big goal</h3>
              <p>Small steps. Big achievements.</p>

              <div className="progress-label">
                <span>Learning journey</span>
                <strong>Start today</strong>
              </div>

              <div className="progress-track">
                <div className="progress-fill"></div>
              </div>

              <div className="floating-badge badge-top">
                🚀 Keep growing
              </div>

              <div className="floating-badge badge-bottom">
                ✨ Learn something new
              </div>
            </div>
          </div>
        </section>

        <section className="courses-section" id="courses">
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOUR LEARNING JOURNEY</span>

              <h2>
                {activeTab === 'Explore'
                  ? 'Explore popular courses'
                  : activeTab === 'My Learning'
                    ? 'My learning space'
                    : 'Build your career'}
              </h2>

              <p>Find the right skills to move forward.</p>
            </div>
          </div>

          <div className="search-box">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search for a course..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="category-list">
            {categories.map((category) => (
              <button
                key={category}
                className={
                  selectedCategory === category
                    ? 'category-chip selected'
                    : 'category-chip'
                }
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="course-grid">
            {loading ? (
              <p className="empty-message">Loading courses...</p>
            ) : error ? (
              <p className="empty-message">
                {error}. Please check that the backend is running.
              </p>
            ) : filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <article className="course-card" key={course._id}>
                  <div className="course-art blue">
                    <span>{getCourseIcon(course.category)}</span>

                    <span className="course-tag">
                      {course.level || 'Beginner'}
                    </span>
                  </div>

                  <div className="course-info">
                    <span className="course-category">
                      {course.category}
                    </span>

                    <h3>{course.title}</h3>

                    <p>
                      {course.description ||
                        'Learn practical concepts through a structured learning path.'}
                    </p>

                    <div className="course-footer">
                      <span>⏱️ {course.duration}</span>
                      <span>₹{course.price}</span>

                      <Link
                        className="enroll-button"
                        to={`/courses/${course._id}`}
                      >
                        View course →
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className="empty-message">
                No courses found. Try another search or category.
              </p>
            )}
          </div>
        </section>

        <section className="career-banner" id="career">
          <div>
            <span className="eyebrow">GROW WITH PURPOSE</span>
            <h2>Your skills can take you places.</h2>
            <p>
              Keep learning, practice consistently, and work towards your goals.
            </p>
          </div>

          <a href="#courses" className="banner-button">
            Start Learning →
          </a>
        </section>
      </main>

      <footer className="footer">
        <Link className="brand" to="/">
          <span className="brand-icon">S</span>
          SkillSphere
        </Link>

        <p>Learn today. Lead tomorrow.</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/courses/:id" element={<CourseDetails />} />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/courses/:id/learn"
          element={<CourseLearning />}
        />

        <Route
          path="/my-learning"
          element={<MyLearning />}
        />

        <Route
          path="/notifications"
          element={<Notifications />}
        />

        <Route
          path="/certificates/:certificateId"
          element={<CertificateView />}
        />
      </Route>

      <Route path="/signup" element={<Signup />} />

      <Route path="/login" element={<Login />} />

      <Route element={<AdminRoute />}>
        <Route
          path="/admin"
          element={<AdminDashboard />}
        />
      </Route>
      <Route element={<ProtectedRoute />}>
  <Route path="/profile" element={<Profile />} />
  <Route path="/dashboard" element={<StudentDashboard />} />
</Route>
    </Routes>
  );
}

export default App;
