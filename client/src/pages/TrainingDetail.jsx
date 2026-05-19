import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getTraining,
  deleteTraining,
  updateTraining,
  addQuizQuestion,
  deleteQuizQuestion,
  submitQuizAttempt,
} from '../api/trainings';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const statusVariant = { published: 'success', draft: 'warning', archived: 'muted' };
const typeLabel      = { self_paced: 'Self-paced', instructor_led: 'Instructor-led' };
const matIcon = {
  video:        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  document:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  link:         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  presentation: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21l4-4 4 4M12 17v4"/></svg>,
};

export default function TrainingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [training, setTraining] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    prompt: '',
    options: ['', '', '', ''],
    correct_answer_index: 0,
  });

  useEffect(() => {
    getTraining(id).then(r => setTraining(r.data)).finally(() => setLoading(false));
  }, [id]);

  const toast = useToast();
  const canEdit = ['admin', 'instructor'].includes(user?.role);
  const quizQuestions = training?.quiz?.questions || [];
  const latestAttempt = training?.quiz?.latest_attempt;

  const refreshTraining = async () => {
    const refreshed = await getTraining(id);
    setTraining(refreshed.data);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this training? This cannot be undone.')) return;
    await deleteTraining(id);
    toast.success('Training deleted');
    navigate('/trainings');
  };

  const handlePublish = async () => {
    try {
      await updateTraining(id, { ...training, status: 'published' });
      await refreshTraining();
      toast.success('Training published successfully');
    } catch {
      toast.error('Failed to publish training');
    }
  };

  const handleAnswer = (questionId, answerIndex) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
    setQuizResult(null);
  };

  const handleSubmitQuiz = async () => {
    if (quizQuestions.some(q => answers[q.id] === undefined)) {
      toast.warning('Answer every question before submitting');
      return;
    }
    setSubmittingQuiz(true);
    try {
      const payload = quizQuestions.map(q => ({
        question_id: q.id,
        answer_index: answers[q.id],
      }));
      const res = await submitQuizAttempt(id, payload);
      setQuizResult(res.data);
      await refreshTraining();
      toast.success(`Quiz submitted - ${res.data.score_pct}%`);
    } catch {
      toast.error('Failed to submit quiz');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleQuestionOption = (index, value) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.map((option, i) => (i === index ? value : option)),
    }));
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    const options = newQuestion.options.map(option => option.trim()).filter(Boolean);
    if (!newQuestion.prompt.trim() || options.length < 2) {
      toast.warning('Add a prompt and at least two options');
      return;
    }
    if (newQuestion.correct_answer_index >= options.length) {
      toast.warning('Choose a valid correct answer');
      return;
    }
    try {
      await addQuizQuestion(id, {
        prompt: newQuestion.prompt.trim(),
        options,
        correct_answer_index: Number(newQuestion.correct_answer_index),
        order_index: quizQuestions.length,
      });
      setNewQuestion({ prompt: '', options: ['', '', '', ''], correct_answer_index: 0 });
      await refreshTraining();
      toast.success('Quiz question added');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add quiz question');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      await deleteQuizQuestion(id, questionId);
      await refreshTraining();
      toast.success('Quiz question removed');
    } catch {
      toast.error('Failed to remove quiz question');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full" style={{ animation: 'spin 0.7s linear infinite' }} />
    </div>
  );

  if (!training) return (
    <div className="py-24 text-center">
      <p className="text-muted">Training not found.</p>
      <Link to="/trainings" className="text-accent text-sm hover:underline mt-2 inline-block">← Back to library</Link>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Breadcrumb ── */}
      <Link to="/trainings" className="inline-flex items-center gap-1.5 text-muted text-xs hover:text-text transition-colors duration-150 animate-fade-up">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        Training Library
      </Link>

      {/* ── Title block ── */}
      <div className="flex items-start justify-between gap-4 animate-fade-up d-60">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap mb-2">
            <Badge variant={statusVariant[training.status] || 'muted'} dot>{training.status}</Badge>
            {training.is_mandatory && <Badge variant="danger" dot>Mandatory</Badge>}
          </div>
          <h1 className="font-display text-4xl font-bold text-text">{training.title}</h1>
          <p className="text-muted text-sm mt-2">
            {typeLabel[training.type]}
            {training.category && ` · ${training.category}`}
            {training.duration_hrs && ` · ${training.duration_hrs}h`}
            {training.created_by_name && ` · by ${training.created_by_name}`}
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2 flex-shrink-0">
            {training.status === 'draft' && (
              <Button size="sm" onClick={handlePublish}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12l5 5L20 7"/></svg>
                Publish
              </Button>
            )}
            <Link to={`/trainings/${id}/edit`}><Button variant="secondary" size="sm">Edit</Button></Link>
            {user?.role === 'admin' && <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>}
          </div>
        )}
      </div>

      {/* ── Description ── */}
      <Card className="p-6 animate-fade-up d-120">
        <p className="text-[11px] font-mono text-muted uppercase tracking-widest mb-3">Description</p>
        <p className="text-muted-2 text-sm leading-relaxed">{training.description || 'No description provided.'}</p>
      </Card>

      {/* ── Prerequisites ── */}
      {training.prerequisites?.length > 0 && (
        <div className="animate-fade-up d-150">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-mono text-muted uppercase tracking-widest">Prerequisites</p>
            <span className="text-muted text-xs font-mono">{training.prerequisites.length} required</span>
          </div>
          <Card className="p-5 space-y-2">
            <p className="text-xs text-muted mb-3">Complete these trainings before starting this one:</p>
            {training.prerequisites.map((p, i) => (
              <Link key={p.id} to={`/trainings/${p.id}`}
                className="flex items-center gap-3 rounded-xl border border-border hover:border-accent/30 bg-white/[0.02] hover:bg-accent/4 px-4 py-3 transition-all duration-150 group">
                <span className="w-6 h-6 rounded-md bg-accent/12 border border-accent/20 text-accent text-[11px] font-mono font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-text text-sm font-medium group-hover:text-accent transition-colors duration-150 truncate">{p.title}</p>
                  {p.category && <p className="text-muted text-xs font-mono mt-0.5">{p.category}</p>}
                </div>
                <svg className="text-muted group-hover:text-accent transition-colors duration-150 flex-shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </Link>
            ))}
          </Card>
        </div>
      )}

      {/* ── Materials ── */}
      <div className="animate-fade-up d-180">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-mono text-muted uppercase tracking-widest">Materials</p>
          <span className="text-muted text-xs font-mono">{(training.materials || []).length} item{(training.materials || []).length !== 1 ? 's' : ''}</span>
        </div>

        {(!training.materials || training.materials.length === 0) ? (
          <Card className="p-10 text-center">
            <p className="text-muted text-sm">No materials added yet.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {training.materials.map((m, i) => (
              <Card key={m.id} className="px-5 py-4 flex items-center gap-4 hover:border-border-2 transition-colors duration-150 animate-fade-up"
                style={{ animationDelay: `${200 + i * 50}ms` }}>
                <div className="w-8 h-8 rounded-lg bg-white/4 border border-border flex items-center justify-center text-muted flex-shrink-0">
                  {matIcon[m.type]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-text text-sm font-medium">{m.title}</p>
                  {m.url && (
                    <a href={m.url} target="_blank" rel="noreferrer"
                      className="text-accent text-xs truncate block hover:underline mt-0.5 font-mono">
                      {m.url}
                    </a>
                  )}
                </div>
                <Badge variant="muted">{m.type}</Badge>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Quiz ── */}
      <div className="animate-fade-up d-240">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-mono text-muted uppercase tracking-widest">Quiz</p>
          <span className="text-muted text-xs font-mono">{quizQuestions.length} question{quizQuestions.length !== 1 ? 's' : ''}</span>
        </div>

        <Card className="p-6 space-y-5">
          {latestAttempt && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white/[0.03] px-4 py-3">
              <div>
                <p className="text-text text-sm font-medium">Latest attempt</p>
                <p className="text-muted text-xs mt-1">
                  {latestAttempt.correct_count}/{latestAttempt.total_questions} correct · {latestAttempt.score_pct}% score
                </p>
              </div>
              <Badge variant={latestAttempt.passed ? 'success' : 'warning'} dot>
                {latestAttempt.passed ? 'Passed' : 'Needs review'}
              </Badge>
            </div>
          )}

          {quizQuestions.length === 0 ? (
            <p className="text-muted text-sm text-center py-6">No quiz questions added yet.</p>
          ) : (
            <div className="space-y-5">
              {quizQuestions.map((question, questionIndex) => (
                <div key={question.id} className="border-b border-border/70 pb-5 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-mono text-muted uppercase tracking-widest">Question {questionIndex + 1}</p>
                      <p className="text-text text-sm font-medium mt-1">{question.prompt}</p>
                    </div>
                    {canEdit && (
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(question.id)}>Remove</Button>
                    )}
                  </div>
                  <div className="grid gap-2 mt-3">
                    {question.options.map((option, optionIndex) => {
                      const selected = answers[question.id] === optionIndex;
                      const showCorrect = canEdit && question.correct_answer_index === optionIndex;
                      return (
                        <button
                          key={`${question.id}-${optionIndex}`}
                          type="button"
                          onClick={() => handleAnswer(question.id, optionIndex)}
                          className={`text-left rounded-xl border px-4 py-3 text-sm transition-all duration-200 ease-out ${
                            selected
                              ? 'border-accent bg-accent/10 text-text'
                              : 'border-border bg-white/[0.02] text-muted hover:border-border-2 hover:text-text'
                          }`}
                        >
                          <span className="font-mono text-xs mr-2 text-muted">{String.fromCharCode(65 + optionIndex)}</span>
                          {option}
                          {showCorrect && <span className="ml-2 text-[10px] font-mono text-success uppercase">Correct</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {quizResult ? (
                  <p className="text-sm text-muted">
                    Result: <span className="text-text font-semibold">{quizResult.score_pct}%</span> · {quizResult.correct_count}/{quizResult.total_questions} correct
                  </p>
                ) : (
                  <p className="text-xs text-muted">Passing score is 70%.</p>
                )}
                <Button onClick={handleSubmitQuiz} disabled={submittingQuiz}>
                  {submittingQuiz ? 'Submitting...' : 'Submit quiz'}
                </Button>
              </div>
            </div>
          )}

          {canEdit && (
            <form onSubmit={handleAddQuestion} className="border-t border-border pt-5 space-y-4">
              <p className="text-[11px] font-mono text-muted uppercase tracking-widest">Add Question</p>
              <textarea
                value={newQuestion.prompt}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, prompt: e.target.value }))}
                placeholder="Question prompt"
                className="w-full min-h-20 rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text outline-none transition-all duration-200 ease-out placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <div className="grid sm:grid-cols-2 gap-3">
                {newQuestion.options.map((option, index) => (
                  <label key={index} className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2">
                    <input
                      type="radio"
                      name="correct-answer"
                      checked={Number(newQuestion.correct_answer_index) === index}
                      onChange={() => setNewQuestion(prev => ({ ...prev, correct_answer_index: index }))}
                      className="accent-[--color-accent]"
                    />
                    <input
                      value={option}
                      onChange={(e) => handleQuestionOption(index, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted"
                    />
                  </label>
                ))}
              </div>
              <Button type="submit" size="sm">Add question</Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
