
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  CheckCircle,
  ArrowLeft,
  RefreshCw,
  Megaphone,
  Bell,
  Trash2,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const API_URL = 'http://localhost:5000/api/admin';
const ANNOUNCEMENT_URL = 'http://localhost:5000/api/announcements';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    completedEnrollments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [courseError, setCourseError] = useState('');

  // Course search and filtering
  const [courseSearch, setCourseSearch] = useState('');
  const [courseCategoryFilter, setCourseCategoryFilter] = useState('All');
  const [courseLevelFilter, setCourseLevelFilter] = useState('All');

  // Course sorting
  const [courseSort, setCourseSort] = useState('newest');

  // Course pagination
  const [coursePage, setCoursePage] = useState(1);
  const [coursesPerPage, setCoursesPerPage] = useState(5);

  useEffect(() => {
    setCoursePage(1);
  }, [
    courseSearch,
    courseCategoryFilter,
    courseLevelFilter,
    courseSort,
    coursesPerPage,
  ]);

  const filteredCourses = courses.filter((course) => {
    const searchTerm = courseSearch.trim().toLowerCase();

    const matchesSearch =
      (course.title || '').toLowerCase().includes(searchTerm) ||
      (course.instructor || '').toLowerCase().includes(searchTerm);

    const matchesCategory =
      courseCategoryFilter === 'All' ||
      course.category === courseCategoryFilter;

    const matchesLevel =
      courseLevelFilter === 'All' ||
      (course.level || 'Beginner') === courseLevelFilter;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (courseSort) {
      case 'title-asc':
        return (a.title || '').localeCompare(b.title || '');

      case 'title-desc':
        return (b.title || '').localeCompare(a.title || '');

      case 'price-asc':
        return (Number(a.price) || 0) - (Number(b.price) || 0);

      case 'price-desc':
        return (Number(b.price) || 0) - (Number(a.price) || 0);

      case 'newest':
      default:
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
  });

  // Course pagination calculations
  const totalCoursePages = Math.ceil(
    sortedCourses.length / coursesPerPage
  );

  const startCourseIndex = (coursePage - 1) * coursesPerPage;

  const paginatedCourses = sortedCourses.slice(
    startCourseIndex,
    startCourseIndex + coursesPerPage
  );

  const courseCategories = [
    ...new Set(courses.map((course) => course.category).filter(Boolean)),
  ].sort();

  const courseLevels = [
    ...new Set(courses.map((course) => course.level || 'Beginner')),
  ].sort();

  // Student management state
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Filter students by name or email
  const filteredStudents = students.filter((student) => {
    const searchTerm = studentSearch.trim().toLowerCase();

    return (
      (student.name || '').toLowerCase().includes(searchTerm) ||
      (student.email || '').toLowerCase().includes(searchTerm)
    );
  });

  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);
  const [enrollmentsError, setEnrollmentsError] = useState('');

  const [analytics, setAnalytics] = useState({
    enrollmentTrends: [],
    popularCourses: [],
    progressOverview: [],
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState('');

  // Course form state
  const [successMessage, setSuccessMessage] = useState('');
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    instructor: '',
    category: 'Web Development',
    description: '',
    price: '',
    duration: '',
    level: 'Beginner',
  });

  // Announcement management state
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState('');
  const [announcementSuccess, setAnnouncementSuccess] = useState('');
  const [announcementError, setAnnouncementError] = useState('');
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    type: 'general',
    audience: 'all',
    published: true,
  });

  // Fetch dashboard statistics
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const token = sessionStorage.getItem('skillsphereToken');

      const response = await fetch(`${API_URL}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load statistics.');
      }

      setStats(data.stats);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch courses
  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      setCourseError('');
      const token = sessionStorage.getItem('skillsphereToken');

      const response = await fetch(`${API_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load courses.');
      }

      setCourses(data.courses || []);
    } catch (err) {
      setCourseError(err.message || 'Something went wrong.');
    } finally {
      setCoursesLoading(false);
    }
  };

  // Fetch students
  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      setStudentsError('');
      const token = sessionStorage.getItem('skillsphereToken');

      const response = await fetch(`${API_URL}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load students.');
      }

      setStudents(data.students || []);
    } catch (err) {
      setStudentsError(err.message || 'Unable to load students.');
    } finally {
      setStudentsLoading(false);
    }
  };

  // Fetch enrollments
  const fetchEnrollments = async () => {
    try {
      setEnrollmentsLoading(true);
      setEnrollmentsError('');
      const token = sessionStorage.getItem('skillsphereToken');

      const response = await fetch(`${API_URL}/enrollments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load enrollments.');
      }

      setEnrollments(data.enrollments || []);
    } catch (err) {
      setEnrollmentsError(
        err.message || 'Unable to load enrollment information.'
      );
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError('');
      const token = sessionStorage.getItem('skillsphereToken');

      const response = await fetch(`${API_URL}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load analytics.');
      }

      setAnalytics({
        enrollmentTrends: data.analytics?.enrollmentTrends || [],
        popularCourses: data.analytics?.popularCourses || [],
        progressOverview: data.analytics?.progressOverview || [],
      });
    } catch (err) {
      setAnalyticsError(err.message || 'Unable to load analytics.');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      setAnnouncementsLoading(true);
      setAnnouncementsError('');
      const token = sessionStorage.getItem('skillsphereToken');

      const response = await fetch(`${ANNOUNCEMENT_URL}/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load announcements.');
      }

      setAnnouncements(data.announcements || []);
    } catch (err) {
      setAnnouncementsError(err.message || 'Unable to load announcements.');
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCourses();
    fetchStudents();
    fetchEnrollments();
    fetchAnalytics();
    fetchAnnouncements();
  }, []);

  // Reset course form
  const resetCourseForm = () => {
    setFormData({
      title: '',
      instructor: '',
      category: 'Web Development',
      description: '',
      price: '',
      duration: '',
      level: 'Beginner',
    });

    setEditingCourseId(null);
    setShowCourseForm(false);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  // Load a course for editing
  const handleEditCourse = (course) => {
    setFormData({
      title: course.title || '',
      instructor: course.instructor || '',
      category: course.category || 'Web Development',
      description: course.description || '',
      price: String(course.price ?? ''),
      duration: course.duration || '',
      level: course.level || 'Beginner',
    });

    setEditingCourseId(course._id);
    setShowCourseForm(true);
    setCourseError('');
    setSuccessMessage('');
  };

  // Create or update a course
  const handleSaveCourse = async (event) => {
    event.preventDefault();

    try {
      setCourseError('');
      setSuccessMessage('');
      const token = sessionStorage.getItem('skillsphereToken');

      const courseData = {
        ...formData,
        price: Number(formData.price),
      };

      const isEditing = Boolean(editingCourseId);

      const response = await fetch(
        isEditing
          ? `${API_URL}/courses/${editingCourseId}`
          : `${API_URL}/courses`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(courseData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save course.');
      }

      if (isEditing) {
        setCourses((previous) =>
          previous.map((course) =>
            course._id === editingCourseId ? data.course : course
          )
        );
        setSuccessMessage('Course updated successfully.');
      } else {
        setCourses((previous) => [data.course, ...previous]);
        setSuccessMessage('Course created successfully.');
      }

      resetCourseForm();
      await fetchStats();
      await fetchAnalytics();
    } catch (err) {
      setCourseError(err.message || 'Something went wrong.');
    }
  };

  // Delete a course
  const handleDeleteCourse = async (courseId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this course? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setCourseError('');
      setSuccessMessage('');
      const token = sessionStorage.getItem('skillsphereToken');

      const response = await fetch(`${API_URL}/courses/${courseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete course.');
      }

      setCourses((previous) =>
        previous.filter((course) => course._id !== courseId)
      );

      setSuccessMessage('Course deleted successfully.');
      await fetchStats();
      await fetchEnrollments();
      await fetchAnalytics();
    } catch (err) {
      setCourseError(err.message || 'Something went wrong.');
    }
  };

  // Announcement form handlers
  const handleAnnouncementChange = (event) => {
    const { name, value, type, checked } = event.target;

    setAnnouncementForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetAnnouncementForm = () => {
    setAnnouncementForm({
      title: '',
      message: '',
      type: 'general',
      audience: 'all',
      published: true,
    });
  };

  
const handleEditAnnouncement = (announcement) => {
  setEditingAnnouncementId(announcement._id);

  setAnnouncementForm({
    title: announcement.title || '',
    message: announcement.message || '',
    type: announcement.type || 'general',
    audience: announcement.audience || 'all',
    published: announcement.published === true,
  });

  setAnnouncementsError('');
  setAnnouncementSuccess('');
};

const handleCancelAnnouncementEdit = () => {
  setEditingAnnouncementId(null);

  setAnnouncementForm({
    title: '',
    message: '',
    type: 'general',
    audience: 'all',
    published: true,
  });

  setAnnouncementsError('');
  setAnnouncementSuccess('');
};


  
const handleSaveAnnouncement = async (event) => {
  event.preventDefault();

  try {
    setAnnouncementSubmitting(true);
    setAnnouncementsError('');
    setAnnouncementSuccess('');

    const token = sessionStorage.getItem('skillsphereToken');
    const isEditing = Boolean(editingAnnouncementId);

    const response = await fetch(
      isEditing
        ? `${ANNOUNCEMENT_URL}/${editingAnnouncementId}`
        : ANNOUNCEMENT_URL,
      {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(announcementForm),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          (isEditing
            ? 'Failed to update announcement.'
            : 'Failed to create announcement.')
      );
    }

    setAnnouncementSuccess(
      isEditing
        ? 'Announcement updated successfully.'
        : announcementForm.published
          ? 'Announcement published successfully.'
          : 'Announcement saved as an unpublished draft.'
    );

    resetAnnouncementForm();
    setEditingAnnouncementId(null);
    setShowAnnouncementForm(false);

    await fetchAnnouncements();
  } catch (err) {
    setAnnouncementsError(
      err.message || 'Unable to save announcement.'
    );
  } finally {
    setAnnouncementSubmitting(false);
  }
};


  const handleDeleteAnnouncement = async (announcementId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this announcement? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setAnnouncementsError('');
      setAnnouncementSuccess('');
      const token = sessionStorage.getItem('skillsphereToken');

      const response = await fetch(
        `${ANNOUNCEMENT_URL}/${announcementId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete announcement.');
      }

      setAnnouncements((previous) =>
        previous.filter((item) => item._id !== announcementId)
      );

      setAnnouncementSuccess('Announcement deleted successfully.');
    } catch (err) {
      setAnnouncementsError(err.message || 'Unable to delete announcement.');
    }
  };

  const statCards = [
    { title: 'Total Courses', value: stats.totalCourses, icon: BookOpen },
    { title: 'Total Students', value: stats.totalStudents, icon: Users },
    {
      title: 'Total Enrollments',
      value: stats.totalEnrollments,
      icon: GraduationCap,
    },
    {
      title: 'Completed Enrollments',
      value: stats.completedEnrollments,
      icon: CheckCircle,
    },
  ];

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <Link to="/" style={styles.backLink}>
          <ArrowLeft size={18} />
          Back to SkillSphere
        </Link>
        <span style={styles.adminBadge}>ADMIN PANEL</span>
      </header>

      <main style={styles.container}>
        <section style={styles.heading}>
          <div style={styles.headingIcon}>
            <LayoutDashboard size={28} />
          </div>
          <div>
            <h1 style={styles.title}>Admin Dashboard</h1>
            <p style={styles.subtitle}>
              Manage courses, students, analytics, enrollments, and announcements.
            </p>
          </div>
        </section>

        {error && <div style={styles.error}>{error}</div>}

        {/* Dashboard statistics */}
        <section style={styles.statsGrid}>
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.title} style={styles.statCard}>
                <div style={styles.statIcon}>
                  <Icon size={24} />
                </div>
                <p style={styles.statTitle}>{card.title}</p>
                <h2 style={styles.statValue}>
                  {loading ? '...' : card.value}
                </h2>
              </article>
            );
          })}
        </section>

        {/* Admin Analytics */}
        <section style={styles.managementCard}>
          <div style={styles.managementHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Admin Analytics</h2>
              <p style={styles.sectionDescription}>
                Monitor enrollment activity, course popularity, and student progress.
              </p>
            </div>

            <button
              type="button"
              style={styles.refreshButton}
              onClick={fetchAnalytics}
              disabled={analyticsLoading}
            >
              <RefreshCw size={16} />
              {analyticsLoading ? 'Loading...' : 'Refresh Analytics'}
            </button>
          </div>

          {analyticsError && (
            <div style={styles.error}>
              {analyticsError}
              <button
                type="button"
                style={styles.retryButton}
                onClick={fetchAnalytics}
              >
                Try again
              </button>
            </div>
          )}

          {analyticsLoading ? (
            <p style={styles.comingSoon}>Loading analytics...</p>
          ) : (
            <div style={styles.analyticsGrid}>
              <article style={styles.chartCard}>
                <h3 style={styles.chartTitle}>Enrollment Trends</h3>
                <p style={styles.chartDescription}>
                  Track enrollment activity over time.
                </p>

                {analytics.enrollmentTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={analytics.enrollmentTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="enrollments"
                        name="Enrollments"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={styles.emptyChart}>
                    No enrollment trend data available yet.
                  </p>
                )}
              </article>

              <article style={styles.chartCard}>
                <h3 style={styles.chartTitle}>Popular Courses</h3>
                <p style={styles.chartDescription}>
                  Compare courses by their number of enrollments.
                </p>

                {analytics.popularCourses.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={analytics.popularCourses}
                      layout="vertical"
                      margin={{ top: 5, right: 15, bottom: 5, left: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="title"
                        width={125}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="enrollments"
                        name="Enrollments"
                        fill="#0d9488"
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={styles.emptyChart}>
                    No course enrollment data available yet.
                  </p>
                )}
              </article>

              <article style={styles.chartCard}>
                <h3 style={styles.chartTitle}>Student Progress</h3>
                <p style={styles.chartDescription}>
                  Compare active and completed enrollments.
                </p>

                {analytics.progressOverview.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={analytics.progressOverview}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {analytics.progressOverview.map((item, index) => (
                          <Cell
                            key={item.status}
                            fill={['#4f46e5', '#10b981', '#f59e0b'][index % 3]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={styles.emptyChart}>
                    No student progress data available yet.
                  </p>
                )}
              </article>
            </div>
          )}
        </section>

        {/* Course Management */}
        <section style={styles.managementCard}>
          <div style={styles.managementHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Course Management</h2>
              <p style={styles.sectionDescription}>
                Create, update, search, filter, sort, and manage SkillSphere courses.
              </p>
            </div>

            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => {
                setCourseError('');
                setSuccessMessage('');

                if (showCourseForm) {
                  resetCourseForm();
                } else {
                  resetCourseForm();
                  setShowCourseForm(true);
                }
              }}
            >
              {showCourseForm ? 'Cancel' : '+ Add Course'}
            </button>
          </div>

          {successMessage && (
            <p style={styles.successMessage}>{successMessage}</p>
          )}

          {courseError && <p style={styles.error}>{courseError}</p>}

          {showCourseForm && (
            <form style={styles.courseForm} onSubmit={handleSaveCourse}>
              <h3 style={styles.formTitle}>
                {editingCourseId ? 'Edit Course' : 'Add New Course'}
              </h3>

              <div style={styles.formGrid}>
                <label style={styles.fieldLabel}>
                  Course Title *
                  <input
                    style={styles.input}
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="e.g. Full Stack Web Development"
                    required
                  />
                </label>

                <label style={styles.fieldLabel}>
                  Instructor *
                  <input
                    style={styles.input}
                    name="instructor"
                    value={formData.instructor}
                    onChange={handleFormChange}
                    placeholder="Instructor name"
                    required
                  />
                </label>

                <label style={styles.fieldLabel}>
                  Category *
                  <select
                    style={styles.input}
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="Web Development">Web Development</option>
                    <option value="Programming">Programming</option>
                    <option value="Artificial Intelligence">
                      Artificial Intelligence
                    </option>
                    <option value="Data Science">Data Science</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label style={styles.fieldLabel}>
                  Price (₹) *
                  <input
                    style={styles.input}
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleFormChange}
                    placeholder="999"
                    min="0"
                    required
                  />
                </label>

                <label style={styles.fieldLabel}>
                  Duration *
                  <input
                    style={styles.input}
                    name="duration"
                    value={formData.duration}
                    onChange={handleFormChange}
                    placeholder="e.g. 12 weeks"
                    required
                  />
                </label>

                <label style={styles.fieldLabel}>
                  Level
                  <select
                    style={styles.input}
                    name="level"
                    value={formData.level}
                    onChange={handleFormChange}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </label>
              </div>

              <label style={styles.fieldLabel}>
                Course Description *
                <textarea
                  style={styles.textarea}
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Describe what students will learn..."
                  rows={4}
                  required
                />
              </label>

              <button type="submit" style={styles.primaryButton}>
                {editingCourseId ? 'Save Changes' : 'Create Course'}
              </button>
            </form>
          )}

          <div style={styles.courseListHeading}>
            <h3 style={styles.formTitle}>All Courses</h3>
            <span>{courses.length} total</span>
          </div>

          {/* Search, filters, and sorting */}
          <div style={styles.courseFilters}>
            <input
              type="search"
              aria-label="Search courses"
              placeholder="Search by course title or instructor..."
              value={courseSearch}
              onChange={(event) => setCourseSearch(event.target.value)}
              style={styles.filterInput}
            />

            <select
              aria-label="Filter courses by category"
              value={courseCategoryFilter}
              onChange={(event) => setCourseCategoryFilter(event.target.value)}
              style={styles.filterInput}
            >
              <option value="All">All Categories</option>
              {courseCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter courses by level"
              value={courseLevelFilter}
              onChange={(event) => setCourseLevelFilter(event.target.value)}
              style={styles.filterInput}
            >
              <option value="All">All Levels</option>
              {courseLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>

            <select
              aria-label="Sort courses"
              value={courseSort}
              onChange={(event) => setCourseSort(event.target.value)}
              style={styles.filterInput}
            >
              <option value="newest">Newest First</option>
              <option value="title-asc">Title: A–Z</option>
              <option value="title-desc">Title: Z–A</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => {
                setCourseSearch('');
                setCourseCategoryFilter('All');
                setCourseLevelFilter('All');
                setCourseSort('newest');
              }}
            >
              Clear Filters
            </button>
          </div>

          <p style={styles.courseMeta}>
            Showing{' '}
            {sortedCourses.length === 0 ? 0 : startCourseIndex + 1}
            {'–'}
            {Math.min(
              startCourseIndex + coursesPerPage,
              sortedCourses.length
            )}
            {' of '}
            {sortedCourses.length} matching courses
          </p>

          {/* Pagination controls */}
          {sortedCourses.length > 0 && (
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
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                }}
              >
                Courses per page:
                <select
                  aria-label="Courses per page"
                  value={coursesPerPage}
                  onChange={(event) =>
                    setCoursesPerPage(Number(event.target.value))
                  }
                  style={styles.filterInput}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </label>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  style={styles.secondaryButton}
                  disabled={coursePage <= 1}
                  onClick={() =>
                    setCoursePage((page) => Math.max(1, page - 1))
                  }
                >
                  Previous
                </button>

                <span style={styles.courseMeta}>
                  Page {Math.min(coursePage, totalCoursePages)} of{' '}
                  {totalCoursePages}
                </span>

                <button
                  type="button"
                  style={styles.secondaryButton}
                  disabled={coursePage >= totalCoursePages}
                  onClick={() =>
                    setCoursePage((page) =>
                      Math.min(totalCoursePages, page + 1)
                    )
                  }
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {coursesLoading ? (
            <p style={styles.comingSoon}>Loading courses...</p>
          ) : courses.length === 0 ? (
            <p style={styles.comingSoon}>
              No courses found. Click Add Course to create your first course.
            </p>
          ) : sortedCourses.length === 0 ? (
            <p style={styles.comingSoon}>
              No courses match your search or filters. Try changing your
              search or clearing the filters.
            </p>
          ) : (
            <div style={styles.courseList}>
              {paginatedCourses.map((course) => (
                <article key={course._id} style={styles.courseRow}>
                  <div style={styles.courseDetails}>
                    <h4 style={styles.courseTitle}>{course.title}</h4>

                    <p style={styles.courseMeta}>
                      {course.category} · {course.level || 'Beginner'} · ₹
                      {course.price}
                    </p>

                    <p style={styles.courseMeta}>
                      Instructor: {course.instructor} · {course.duration}
                    </p>
                  </div>

                  <div style={styles.courseActions}>
                    <button
                      type="button"
                      style={styles.editButton}
                      onClick={() => handleEditCourse(course)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      style={styles.deleteButton}
                      onClick={() => handleDeleteCourse(course._id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        
        {/* Announcement Management */}
        <section style={styles.managementCard}>
          <div style={styles.managementHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                <Megaphone size={22} style={styles.inlineIcon} />
                Announcement Management
              </h2>
              <p style={styles.sectionDescription}>
                Create announcements and manage messages for SkillSphere students.
              </p>
            </div>

            <button
              type="button"
              style={styles.refreshButton}
              onClick={fetchAnnouncements}
              disabled={announcementsLoading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {announcementsError && (
            <p style={styles.error}>{announcementsError}</p>
          )}

          {announcementSuccess && (
            <p style={styles.announcementSuccess}>
              {announcementSuccess}
            </p>
          )}

          <form onSubmit={handleSaveAnnouncement} style={styles.courseForm}>
            <h3 style={styles.formTitle}>
              {editingAnnouncementId ? 'Edit Announcement' : 'Create Announcement'}
            </h3>

            <div style={styles.formGrid}>
              <div>
                <label
                  style={styles.fieldLabel}
                  htmlFor="announcementTitle"
                >
                  Announcement Title
                </label>

                <input
                  id="announcementTitle"
                  name="title"
                  type="text"
                  value={announcementForm.title}
                  onChange={handleAnnouncementChange}
                  placeholder="Enter announcement title"
                  required
                  maxLength={120}
                  style={styles.input}
                />
              </div>

              <div>
                <label
                  style={styles.fieldLabel}
                  htmlFor="announcementType"
                >
                  Announcement Type
                </label>

                <select
                  id="announcementType"
                  name="type"
                  value={announcementForm.type}
                  onChange={handleAnnouncementChange}
                  style={styles.input}
                >
                  <option value="general">General</option>
                  <option value="course">Course</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="event">Event</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label
                style={styles.fieldLabel}
                htmlFor="announcementMessage"
              >
                Announcement Message
              </label>

              <textarea
                id="announcementMessage"
                name="message"
                value={announcementForm.message}
                onChange={handleAnnouncementChange}
                placeholder="Write your announcement here..."
                required
                maxLength={1000}
                rows={4}
                style={styles.textarea}
              />

              <div style={styles.characterCount}>
                {announcementForm.message.length}/1000 characters
              </div>
            </div>

            <div style={styles.formActions}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="published"
                  checked={announcementForm.published}
                  onChange={handleAnnouncementChange}
                />
                Publish announcement
              </label>

              <button
                type="submit"
                style={styles.primaryButton}
                disabled={announcementSubmitting}
              >
                {announcementSubmitting
                  ? 'Saving...'
                  : editingAnnouncementId
                    ? 'Update Announcement'
                    : 'Create Announcement'}
              </button>
              {editingAnnouncementId && (
              <button
                type="button"
                style={styles.refreshButton}
                onClick={handleCancelAnnouncementEdit}
                disabled={announcementSubmitting}
              >
                Cancel Edit
              </button>
            )}
            </div>

            <p style={styles.formHint}>
              Published announcements can appear in student notifications.
            </p>
          </form>

          <div style={styles.courseListHeading}>
            <h3 style={styles.formTitle}>Existing Announcements</h3>
            <span style={styles.courseMeta}>
              {announcements.length} total
            </span>
          </div>

          {announcementsLoading ? (
            <p style={styles.comingSoon}>Loading announcements...</p>
          ) : announcements.length === 0 ? (
            <div style={styles.emptyAnnouncements}>
              <Megaphone size={28} />
              <p>No announcements yet. Create your first announcement above.</p>
            </div>
          ) : (
            <div style={styles.announcementList}>
              {announcements.map((announcement) => (
                <div
                  key={announcement._id}
                  style={styles.announcementRow}
                >
                  <div style={styles.announcementContent}>
                    <div style={styles.announcementTitleRow}>
                      <h4 style={styles.announcementTitle}>
                        {announcement.title}
                      </h4>

                      <span
                        style={
                          announcement.published
                            ? styles.publishedBadge
                            : styles.draftBadge
                        }
                      >
                        {announcement.published ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    <p style={styles.announcementMessage}>
                      {announcement.message}
                    </p>

                    <p style={styles.announcementMeta}>
                      Type: {announcement.type || 'general'} ·{' '}
                      {announcement.createdAt
                        ? new Date(
                            announcement.createdAt
                          ).toLocaleDateString()
                        : 'Date unavailable'}
                    </p>
                  </div>

                  
                  <div style={styles.courseActions}>
                    <button
                      type="button"
                      style={styles.refreshButton}
                      onClick={() => handleEditAnnouncement(announcement)}
                      disabled={announcementSubmitting}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      style={styles.deleteButton}
                      onClick={() => handleDeleteAnnouncement(announcement._id)}
                      disabled={announcementSubmitting}
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>


        {/* Student Management */}
        <section style={styles.managementCard}>
          <div style={styles.managementHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                <Users size={22} style={styles.inlineIcon} />
                Student Management
              </h2>
              <p style={styles.sectionDescription}>
                View and search registered SkillSphere student accounts by name or email.
              </p>
            </div>

            <span style={styles.courseMeta}>
              {students.length} students
            </span>
          </div>

          {studentsError && (
            <p style={styles.error}>{studentsError}</p>
          )}

          {!studentsLoading && students.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <input
                type="search"
                aria-label="Search students by name or email"
                placeholder="Search by student name or email..."
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                style={styles.filterInput}
              />

              <p style={styles.courseMeta}>
                Showing {filteredStudents.length} of {students.length} students
              </p>
            </div>
          )}

          {studentsLoading ? (
            <p style={styles.comingSoon}>Loading students...</p>
          ) : students.length === 0 ? (
            <p style={styles.comingSoon}>
              No registered students found.
            </p>
          ) : filteredStudents.length === 0 ? (
            <div style={styles.emptyAnnouncements}>
              <Users size={28} />
              <p>No students match "{studentSearch}".</p>
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={() => setStudentSearch('')}
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.studentTable}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Name</th>
                    <th style={styles.tableHeader}>Email</th>
                    <th style={styles.tableHeader}>Registered</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student._id}>
                      <td style={styles.tableCell}>
                        {student.name || 'Name unavailable'}
                      </td>
                      <td style={styles.tableCell}>
                        {student.email || 'Email unavailable'}
                      </td>
                      <td style={styles.tableCell}>
                        {student.createdAt
                          ? new Date(student.createdAt).toLocaleDateString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Enrollment Management */}
        <section style={styles.managementCard}>
          <div style={styles.managementHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                <GraduationCap size={22} style={styles.inlineIcon} />
                Enrollment Management
              </h2>
              <p style={styles.sectionDescription}>
                Review course enrollments and student learning progress.
              </p>
            </div>

            <button
              type="button"
              style={styles.refreshButton}
              onClick={fetchEnrollments}
              disabled={enrollmentsLoading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {enrollmentsError && (
            <p style={styles.error}>{enrollmentsError}</p>
          )}

          <div style={styles.enrollmentSummary}>
            <div style={styles.enrollmentSummaryCard}>
              <span style={styles.summaryLabel}>Total Enrollments</span>
              <strong style={styles.summaryValue}>
                {enrollments.length}
              </strong>
            </div>

            <div style={styles.enrollmentSummaryCard}>
              <span style={styles.summaryLabel}>Completed</span>
              <strong style={styles.summaryValue}>
                {enrollments.filter(
                  (enrollment) =>
                    enrollment.status === 'completed' ||
                    enrollment.completed === true ||
                    enrollment.progress >= 100
                ).length}
              </strong>
            </div>

            <div style={styles.enrollmentSummaryCard}>
              <span style={styles.summaryLabel}>In Progress</span>
              <strong style={styles.summaryValue}>
                {enrollments.filter(
                  (enrollment) =>
                    enrollment.status !== 'completed' &&
                    enrollment.completed !== true &&
                    enrollment.progress < 100
                ).length}
              </strong>
            </div>
          </div>

          {enrollmentsLoading ? (
            <p style={styles.comingSoon}>Loading enrollments...</p>
          ) : enrollments.length === 0 ? (
            <p style={styles.comingSoon}>
              No enrollments found yet.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.studentTable}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Student</th>
                    <th style={styles.tableHeader}>Course</th>
                    <th style={styles.tableHeader}>Progress</th>
                    <th style={styles.tableHeader}>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {enrollments.map((enrollment) => {
                    const progress = Math.max(
                      0,
                      Math.min(100, Number(enrollment.progress) || 0)
                    );

                    const isCompleted =
                      enrollment.status === 'completed' ||
                      enrollment.completed === true ||
                      progress >= 100;

                    const student = enrollment.student;
                    const course = enrollment.course;

                    return (
                      <tr key={enrollment._id}>
                        <td style={styles.tableCell}>
                          <div style={styles.enrollmentStudentName}>
                            {student?.name || enrollment.studentName || 'Unknown student'}
                          </div>
                          <div style={styles.enrollmentEmail}>
                            {student?.email || enrollment.studentEmail || ''}
                          </div>
                        </td>

                        <td style={styles.tableCell}>
                          {course?.title || enrollment.courseTitle || 'Unknown course'}
                        </td>

                        <td style={styles.tableCell}>
                          <div style={styles.progressCell}>
                            <div style={styles.progressTrack}>
                              <div
                                style={{
                                  ...styles.progressFill,
                                  width: `${progress}%`,
                                }}
                              />
                            </div>
                            <span style={styles.progressText}>
                              {progress}%
                            </span>
                          </div>
                        </td>

                        <td style={styles.tableCell}>
                          <span
                            style={
                              isCompleted
                                ? styles.completedBadge
                                : styles.activeBadge
                            }
                          >
                            {isCompleted ? 'Completed' : 'In Progress'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f7fb',
    color: '#172033',
  },
  header: {
    background: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    padding: '18px 5%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#374151',
    textDecoration: 'none',
    fontWeight: 600,
  },
  adminBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: '#eef2ff',
    color: '#4338ca',
    padding: '8px 12px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: 700,
  },
  container: {
    maxWidth: '1240px',
    margin: '0 auto',
    padding: '32px 20px 60px',
  },
  heading: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '28px',
  },
  headingIcon: {
    width: '54px',
    height: '54px',
    borderRadius: '16px',
    background: '#e0e7ff',
    color: '#4338ca',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '30px',
    fontWeight: 800,
    margin: '0 0 6px',
  },
  subtitle: {
    color: '#6b7280',
    margin: 0,
    lineHeight: 1.6,
  },
  error: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    padding: '12px 14px',
    borderRadius: '10px',
    margin: '12px 0',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '18px',
    marginBottom: '28px',
  },
  statCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '22px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
  },
  statIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: '#eef2ff',
    color: '#4f46e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statTitle: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '0 0 7px',
  },
  statValue: {
    fontSize: '26px',
    fontWeight: 800,
    margin: 0,
  },
  managementCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
  },
  sectionTitle: {
    fontSize: '21px',
    fontWeight: 750,
    margin: '0 0 8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  inlineIcon: {
    verticalAlign: 'middle',
    flexShrink: 0,
  },
  sectionDescription: {
    color: '#6b7280',
    margin: 0,
    lineHeight: 1.6,
  },
  comingSoon: {
    color: '#6b7280',
    padding: '18px 0',
  },
  managementHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '22px',
  },
  primaryButton: {
    border: 'none',
    background: '#4f46e5',
    color: '#ffffff',
    padding: '11px 16px',
    borderRadius: '9px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
  },
  secondaryButton: {
    border: '1px solid #d1d5db',
    background: '#ffffff',
    color: '#374151',
    padding: '10px 14px',
    borderRadius: '9px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  successMessage: {
    background: '#ecfdf5',
    color: '#047857',
    border: '1px solid #a7f3d0',
    padding: '12px',
    borderRadius: '9px',
  },
  courseForm: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '26px',
  },
  formTitle: {
    fontSize: '17px',
    fontWeight: 750,
    margin: '0 0 16px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 700,
    color: '#374151',
    marginBottom: '7px',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #d1d5db',
    borderRadius: '9px',
    padding: '11px 12px',
    background: '#ffffff',
    fontSize: '14px',
    outlineColor: '#6366f1',
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #d1d5db',
    borderRadius: '9px',
    padding: '11px 12px',
    background: '#ffffff',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  courseListHeading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '14px',
  },
  courseFilters: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: '12px',
    marginBottom: '18px',
  },
  filterInput: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #d1d5db',
    borderRadius: '9px',
    padding: '11px 12px',
    background: '#ffffff',
    fontSize: '14px',
    outlineColor: '#6366f1',
  },
  courseList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  courseRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '18px',
    flexWrap: 'wrap',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
  },
  courseDetails: {
    flex: 1,
    minWidth: '220px',
  },
  courseTitle: {
    fontWeight: 750,
    margin: '0 0 7px',
    fontSize: '16px',
  },
  courseMeta: {
    color: '#6b7280',
    fontSize: '13px',
    margin: '6px 0 0',
    lineHeight: 1.6,
  },
  courseActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  editButton: {
    border: '1px solid #c7d2fe',
    background: '#eef2ff',
    color: '#4338ca',
    padding: '9px 12px',
    borderRadius: '8px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  deleteButton: {
    border: '1px solid #fecaca',
    background: '#fef2f2',
    color: '#b91c1c',
    padding: '9px 12px',
    borderRadius: '8px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  studentTable: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tableHeader: {
    padding: '13px 14px',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    color: '#4b5563',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
  },
  tableCell: {
    padding: '14px',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '14px',
    verticalAlign: 'middle',
  },
  refreshButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    border: '1px solid #d1d5db',
    background: '#ffffff',
    color: '#374151',
    padding: '9px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  analyticsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '18px',
    marginBottom: '24px',
  },
  chartCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '20px',
    minWidth: 0,
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: 750,
    margin: '0 0 7px',
  },
  chartDescription: {
    color: '#6b7280',
    fontSize: '13px',
    margin: '0 0 18px',
  },
  emptyChart: {
    minHeight: '180px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
    textAlign: 'center',
  },
  enrollmentSummary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },
  enrollmentSummaryCard: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
  },
  summaryLabel: {
    display: 'block',
    color: '#6b7280',
    fontSize: '13px',
    marginBottom: '8px',
  },
  summaryValue: {
    fontSize: '24px',
    fontWeight: 800,
  },
  enrollmentStudentName: {
    fontWeight: 700,
    marginBottom: '5px',
  },
  enrollmentEmail: {
    color: '#6b7280',
    fontSize: '12px',
    overflowWrap: 'anywhere',
  },
  progressCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: '130px',
  },
  progressTrack: {
    height: '8px',
    flex: 1,
    minWidth: '60px',
    background: '#e5e7eb',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#4f46e5',
    borderRadius: '999px',
    transition: 'width 0.2s ease',
  },
  progressText: {
    color: '#4b5563',
    fontSize: '12px',
    fontWeight: 700,
    minWidth: '34px',
  },
  activeBadge: {
    display: 'inline-block',
    padding: '6px 9px',
    borderRadius: '999px',
    background: '#fffbeb',
    color: '#92400e',
    fontSize: '12px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  completedBadge: {
    display: 'inline-block',
    padding: '6px 9px',
    borderRadius: '999px',
    background: '#ecfdf5',
    color: '#047857',
    fontSize: '12px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  retryButton: {
    border: '1px solid #d1d5db',
    background: '#ffffff',
    color: '#374151',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  announcementHeaderActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  announcementSuccess: {
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#047857',
    padding: '12px 14px',
    borderRadius: '9px',
    marginBottom: '14px',
  },
  checkboxLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#374151',
    fontSize: '14px',
    fontWeight: 600,
  },
  formHint: {
    color: '#6b7280',
    fontSize: '12px',
    margin: '12px 0 0',
  },
  characterCount: {
    color: '#6b7280',
    fontSize: '12px',
    textAlign: 'right',
    marginTop: '6px',
  },
  formActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '16px',
  },
  emptyAnnouncements: {
    border: '1px dashed #d1d5db',
    borderRadius: '12px',
    padding: '24px',
    color: '#6b7280',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    textAlign: 'center',
  },
  announcementList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  announcementRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
  },
  announcementContent: {
    flex: 1,
    minWidth: '220px',
  },
  announcementTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '8px',
  },
  announcementTitle: {
    fontSize: '16px',
    fontWeight: 750,
    margin: 0,
  },
  announcementMessage: {
    color: '#374151',
    fontSize: '14px',
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    margin: '0 0 10px',
  },
  announcementMeta: {
    color: '#6b7280',
    fontSize: '12px',
    margin: 0,
  },
  publishedBadge: {
    background: '#ecfdf5',
    color: '#047857',
    padding: '5px 8px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 700,
  },
  draftBadge: {
    background: '#f3f4f6',
    color: '#4b5563',
    padding: '5px 8px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 700,
  },
};

export default AdminDashboard;
