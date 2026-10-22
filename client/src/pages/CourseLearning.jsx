import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  CheckCircle,
  Trophy,
  RotateCcw,
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

function CourseLearning() {
  const { id } = useParams();

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLesson, setSelectedLesson] = useState(null);

  const [enrollmentId, setEnrollmentId] = useState('');
  const [completedLessons, setCompletedLessons] = useState([]);
  const [progress, setProgress] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    const fetchLearningData = async () => {
      try {
        setLoading(true);
        setError('');

        const token = sessionStorage.getItem('skillsphereToken');

        if (!token) {
          throw new Error('Please log in to access this course.');
        }

        const [lessonsResponse, enrollmentResponse] = await Promise.all([
          fetch(`${API_URL}/lessons/course/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_URL}/enrollments/check/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const lessonsData = await lessonsResponse.json();
        const enrollmentData = await enrollmentResponse.json();

        if (!lessonsResponse.ok) {
          throw new Error(
            lessonsData.message || 'Unable to load lessons.'
          );
        }

        if (!enrollmentResponse.ok) {
          throw new Error(
            enrollmentData.message || 'Unable to load enrollment.'
          );
        }

        if (!enrollmentData.isEnrolled || !enrollmentData.enrollment) {
          throw new Error('You must enroll in this course first.');
        }

        const lessonList = lessonsData.lessons || [];
        const enrollment = enrollmentData.enrollment;

        const completedIds = (enrollment.completedLessons || []).map(
          (lesson) =>
            typeof lesson === 'string' ? lesson : lesson._id
        );

        setLessons(lessonList);
        setCompletedLessons(completedIds);
        setSelectedLesson(
          lessonList.find((lesson) => !completedIds.includes(lesson._id)) ||
            lessonList[0] ||
            null
        );
        setEnrollmentId(enrollment._id);
        setProgress(enrollment.progress || 0);
      } catch (err) {
        setError(err.message || 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    };

    fetchLearningData();
  }, [id]);

  const handleCompleteLesson = async () => {
    if (!selectedLesson || !enrollmentId || completing) {
      return;
    }

    if (completedLessons.includes(selectedLesson._id)) {
      return;
    }

    try {
      setCompleting(true);
      setActionMessage('');

      const token = sessionStorage.getItem('skillsphereToken');

      const response = await fetch(
        `${API_URL}/enrollments/${enrollmentId}/lessons/${selectedLesson._id}/complete`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to complete this lesson.');
      }

      const updatedCompletedIds = (data.completedLessons || []).map(
        (lesson) =>
          typeof lesson === 'string' ? lesson : lesson._id
      );

      setCompletedLessons(updatedCompletedIds);
      setProgress(data.progress ?? 0);
      setActionMessage(
        data.progress >= 100
          ? 'Congratulations! You have completed this course.'
          : 'Lesson completed successfully!'
      );
    } catch (err) {
      setActionMessage(err.message || 'Something went wrong.');
    } finally {
      setCompleting(false);
    }
  };

  const isSelectedLessonCompleted =
    selectedLesson &&
    completedLessons.includes(selectedLesson._id);

  const completedCount = completedLessons.filter((lessonId) =>
    lessons.some((lesson) => lesson._id === lessonId)
  ).length;

  const courseCompleted =
    lessons.length > 0 && completedCount === lessons.length;

  const nextUncompletedLesson = lessons.find(
    (lesson) => !completedLessons.includes(lesson._id)
  );

  const goToNextLesson = () => {
    if (nextUncompletedLesson) {
      setSelectedLesson(nextUncompletedLesson);
      setActionMessage('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const resetLessonSelection = () => {
    if (lessons.length > 0) {
      setSelectedLesson(lessons[0]);
      setActionMessage('');
    }
  };

  return (
    <main
      style={{
        maxWidth: '1100px',
        margin: '40px auto',
        padding: '20px',
      }}
    >
      <Link
        to={`/courses/${id}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          textDecoration: 'none',
        }}
      >
        <ArrowLeft size={18} />
        Back to course
      </Link>

      <h1 style={{ marginTop: '24px' }}>Course Learning</h1>
      <p>Choose a lesson and learn at your own pace.</p>

      {!loading && !error && lessons.length > 0 && (
        <section
          style={{
            marginTop: '24px',
            padding: '20px',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            background: '#fff',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '12px',
            }}
          >
            <strong>Your Course Progress</strong>
            <strong>{progress}%</strong>
          </div>

          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Course progress"
            style={{
              width: '100%',
              height: '12px',
              background: '#e5e7eb',
              borderRadius: '20px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, Math.max(0, progress))}%`,
                height: '100%',
                background: courseCompleted ? '#16a34a' : '#4f46e5',
                borderRadius: '20px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <p style={{ marginBottom: 0, color: '#64748b' }}>
            {completedCount} of {lessons.length} lessons completed
            {' · '}
            {Math.max(0, lessons.length - completedCount)} remaining
          </p>
        </section>
      )}

      {loading ? (
        <p>Loading lessons...</p>
      ) : error ? (
        <p role="alert" style={{ color: '#dc2626' }}>
          {error}
        </p>
      ) : lessons.length === 0 ? (
        <p>No lessons are available for this course yet.</p>
      ) : (
        <>
          {courseCompleted && (
            <section
              style={{
                marginTop: '24px',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #bbf7d0',
                background: '#f0fdf4',
                textAlign: 'center',
              }}
            >
              <Trophy
                size={42}
                color="#16a34a"
                style={{ margin: '0 auto' }}
              />
              <h2 style={{ color: '#166534' }}>
                Congratulations! Course Completed!
              </h2>
              <p>
                You have completed all {lessons.length} lessons in this
                course. Great work!
              </p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginTop: '16px',
                }}
              >
                <Link
                  to={`/certificates/${enrollmentId}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    background: '#16a34a',
                    color: '#fff',
                    textDecoration: 'none',
                  }}
                >
                  <Trophy size={18} />
                  View Certificate
                </Link>

                <Link
                  to="/my-learning"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    color: '#166534',
                    textDecoration: 'none',
                  }}
                >
                  My Learning
                </Link>
              </div>
            </section>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: '24px',
              marginTop: '32px',
              alignItems: 'start',
            }}
          >
            <section>
              <h2>Course Lessons</h2>

              {lessons.map((lesson, index) => {
                const isCompleted = completedLessons.includes(lesson._id);
                const isSelected = selectedLesson?._id === lesson._id;

                return (
                  <button
                    key={lesson._id}
                    type="button"
                    onClick={() => {
                      setSelectedLesson(lesson);
                      setActionMessage('');
                    }}
                    aria-current={isSelected ? 'step' : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      width: '100%',
                      textAlign: 'left',
                      gap: '12px',
                      padding: '16px',
                      marginBottom: '10px',
                      border: isSelected
                        ? '2px solid #4f46e5'
                        : '1px solid #ddd',
                      borderRadius: '10px',
                      background: isSelected ? '#eef2ff' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircle
                        size={20}
                        color="#16a34a"
                        style={{ flexShrink: 0 }}
                      />
                    ) : (
                      <BookOpen
                        size={20}
                        style={{ flexShrink: 0 }}
                      />
                    )}

                    <span>
                      <strong>
                        {lesson.order || index + 1}. {lesson.title}
                      </strong>
                      <br />
                      <small>
                        <Clock size={12} style={{ display: 'inline' }} />{' '}
                        {lesson.duration || 'Duration not specified'}
                      </small>
                      {isCompleted && (
                        <>
                          <br />
                          <small style={{ color: '#16a34a' }}>
                            Completed
                          </small>
                        </>
                      )}
                    </span>
                  </button>
                );
              })}
            </section>

            <section
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                minWidth: 0,
                background: '#fff',
              }}
            >
              {selectedLesson && (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#64748b',
                      fontSize: '14px',
                    }}
                  >
                    <BookOpen size={16} />
                    Lesson {lessons.findIndex(
                      (lesson) => lesson._id === selectedLesson._id
                    ) + 1} of {lessons.length}
                  </div>

                  <h2>{selectedLesson.title}</h2>
                  <p>{selectedLesson.description}</p>

                  <div
                    style={{
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.8,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {selectedLesson.content}
                  </div>

                  {selectedLesson.videoUrl && (
                    <p style={{ marginTop: '20px' }}>
                      <a
                        href={selectedLesson.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open lesson video
                      </a>
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleCompleteLesson}
                    disabled={completing || isSelectedLessonCompleted}
                    style={{
                      marginTop: '24px',
                      padding: '12px 18px',
                      border: 'none',
                      borderRadius: '8px',
                      background: isSelectedLessonCompleted
                        ? '#dcfce7'
                        : '#4f46e5',
                      color: isSelectedLessonCompleted
                        ? '#166534'
                        : '#fff',
                      cursor:
                        completing || isSelectedLessonCompleted
                          ? 'not-allowed'
                          : 'pointer',
                      opacity: completing ? 0.7 : 1,
                    }}
                  >
                    {completing
                      ? 'Saving...'
                      : isSelectedLessonCompleted
                        ? '✓ Lesson Completed'
                        : 'Mark as Completed'}
                  </button>

                  {isSelectedLessonCompleted && !courseCompleted && (
                    <button
                      type="button"
                      onClick={goToNextLesson}
                      style={{
                        marginTop: '12px',
                        marginLeft: '8px',
                        padding: '12px 18px',
                        border: 'none',
                        borderRadius: '8px',
                        background: '#4f46e5',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      Next Lesson
                      <ArrowRight size={18} />
                    </button>
                  )}

                  {actionMessage && (
                    <p
                      role="status"
                      style={{
                        marginTop: '12px',
                        color: actionMessage.toLowerCase().includes('unable') ||
                          actionMessage.toLowerCase().includes('error')
                          ? '#dc2626'
                          : '#166534',
                      }}
                    >
                      {actionMessage}
                    </p>
                  )}

                  {courseCompleted && (
                    <button
                      type="button"
                      onClick={resetLessonSelection}
                      style={{
                        marginTop: '16px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        background: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <RotateCcw size={16} />
                      Review Lessons
                    </button>
                  )}
                </>
              )}
            </section>
          </div>
        </>
      )}
    </main>
  );
}

export default CourseLearning;