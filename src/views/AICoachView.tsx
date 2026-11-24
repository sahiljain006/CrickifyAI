import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, Loader2, Mic, MicOff, Send, Video, Volume2, VolumeX } from 'lucide-react';
import { CoachMessage, LanguageChoice, NavSectionId, PitchIQState } from '../types';
import { CRICKET_LESSONS } from '../data/lessons';
import { CRICKET_EXERCISES } from '../data/exercises';
import { VERIFIED_TUTORIALS } from '../data/tutorials';
import { CRICKIFY_IMAGES } from '../utils/assets';
import { authFetch } from '../lib/firebase';
import { parseApiJsonResponse } from '../lib/apiResponse';

interface AICoachViewProps {
  mode: 'chat' | 'voice' | 'no-video' | 'history';
  state: PitchIQState;
  onAddMessages: (userMsg: CoachMessage, assistantMsg: CoachMessage) => void;
  onToggleSaveMessage: (id: string) => void;
  onOpenLesson: (id: string) => void;
  onOpenExercise: (id: string) => void;
  onNavigate: (section: NavSectionId) => void;
}

const QUICK_PROMPTS_BY_TOPIC: Record<'Batting' | 'Bowling' | 'Fielding' | 'Fitness & Tactics', string[]> = {
  Batting: [
    'I cannot play straight drives cleanly — where do I start?',
    'Why do I keep getting bowled through the gate?',
    'How should I play leg-spin without getting trapped LBW?',
  ],
  Bowling: [
    'How do I bowl an accurate yorker without bowling full tosses?',
    'How can I stop my front arm from falling away during delivery?',
    'What grip helps me land consistent outswing on the 4th stump?',
  ],
  Fielding: [
    'How can I improve my throwing accuracy and catching confidence?',
    'What is the proper split-step timing inside the 30-yard circle?',
  ],
  'Fitness & Tactics': [
    'Create a 30-minute batting timing and footwork routine.',
    'How should a team plan chasing 10 runs per over in the last 4 overs?',
  ],
};

export const AICoachView: React.FC<AICoachViewProps> = ({
  mode,
  state,
  onAddMessages,
  onToggleSaveMessage,
  onOpenLesson,
  onOpenExercise,
  onNavigate,
}) => {
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<LanguageChoice>(state.profile.language || 'English');
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [speakReplies, setSpeakReplies] = useState<boolean>(mode === 'voice');
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'saved'>('all');
  const [promptTopic, setPromptTopic] = useState<'Batting' | 'Bowling' | 'Fielding' | 'Fitness & Tactics'>('Batting');

  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [state.coachMessages.length, loading]);

  const selectedReport = useMemo(
    () => (mode === 'no-video' ? undefined : state.reports.find((r) => r.id === selectedReportId)),
    [mode, state.reports, selectedReportId]
  );

  const speakText = (text: string, lang: LanguageChoice) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'Tamil' ? 'ta-IN' : lang === 'Hindi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.98;
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceToggle = () => {
    setVoiceError(null);
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (!SpeechRec) {
      setVoiceError('Speech recognition is not supported in this browser. Please type your cricket question below.');
      return;
    }

    try {
      const recognition = new SpeechRec() as {
        lang: string;
        interimResults: boolean;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: (e: { error: string }) => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      };
      recognition.lang = language === 'Tamil' ? 'ta-IN' : language === 'Hindi' ? 'hi-IN' : 'en-US';
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript || '';
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.onerror = (e) => {
        setVoiceError(`Microphone recognition error (${e.error}). Please allow microphone access or type your question.`);
        setListening(false);
      };
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
      setListening(true);
      recognition.start();
    } catch {
      setVoiceError('Unable to start voice recognition. Please type your question.');
      setListening(false);
    }
  };

  const sendMessage = async (questionText?: string) => {
    const trimmed = (questionText ?? input).trim();
    if (!trimmed || loading) return;

    setApiError(null);
    setLastFailedQuestion(null);
    setLoading(true);
    if (!questionText) setInput('');

    const userMsg: CoachMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
      language,
      linkedReportId: selectedReport?.id,
    };

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 60000);

    try {
      const res = await authFetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: trimmed,
          history: state.coachMessages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
          profile: state.profile,
          language,
          linkedReport: selectedReport
            ? {
                skillCategory: selectedReport.skillCategory,
                technique: selectedReport.technique,
                summary: selectedReport.summary,
                observedStrengths: selectedReport.observedStrengths,
                areasToImprove: selectedReport.areasToImprove,
                observations: selectedReport.observations,
              }
            : undefined,
          availableLessons: CRICKET_LESSONS.map((l) => ({ id: l.id, title: l.title, category: l.category })),
          availableExercises: CRICKET_EXERCISES.map((e) => ({ id: e.id, name: e.name, category: e.category })),
          availableTutorials: VERIFIED_TUTORIALS.map((t) => ({ id: t.id, title: t.title, category: t.category })),
        }),
      });

      const data = await parseApiJsonResponse<{
        error?: string;
        reply?: string;
        recommendedExerciseIds?: string[];
        recommendedLessonIds?: string[];
        recommendedTutorialIds?: string[];
      }>(res, '/api/coach/chat', 'Coach service error');

      if (!res.ok || !data.reply) {
        throw new Error(data.error || 'Failed to get AI coaching response.');
      }

      const assistantMsg: CoachMessage = {
        id: `msg-${Date.now()}-a`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
        language,
        linkedReportId: selectedReport?.id,
        recommendedExerciseIds: data.recommendedExerciseIds || [],
        recommendedLessonIds: data.recommendedLessonIds || [],
        recommendedTutorialIds: data.recommendedTutorialIds || [],
      };

      onAddMessages(userMsg, assistantMsg);
      if (speakReplies) {
        speakText(data.reply, language);
      }
    } catch (err) {
      setLastFailedQuestion(trimmed);
      if (err instanceof DOMException && err.name === 'AbortError') {
        setApiError('The AI Coach request timed out while waiting for a response. Please tap Retry.');
      } else {
        setApiError(err instanceof Error ? err.message : 'Unable to reach AI Coach.');
      }
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  if (mode === 'history') {
    const msgs = state.coachMessages.filter((m) => (historyFilter === 'saved' ? m.saved : true));
    return (
      <div className="space-y-6">
        <div className="coach-dark-panel text-white rounded-3xl p-7 flex flex-wrap items-center justify-between gap-4 shadow-lg">
          <div>
            <div className="text-xs font-bold text-[#A8D94E] mb-1 uppercase tracking-wider">Coaching Archive</div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">Coaching History &amp; Saved Advice</h1>
          </div>
          <div className="flex gap-2 bg-black/30 p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setHistoryFilter('all')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                historyFilter === 'all' ? 'bg-[#A8D94E] text-[#09180F]' : 'text-white/85 hover:text-white'
              }`}
            >
              All Messages ({state.coachMessages.length})
            </button>
            <button
              onClick={() => setHistoryFilter('saved')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                historyFilter === 'saved' ? 'bg-[#A8D94E] text-[#09180F]' : 'text-white/85 hover:text-white'
              }`}
            >
              Saved Advice ({state.coachMessages.filter((m) => m.saved).length})
            </button>
          </div>
        </div>

        {msgs.length === 0 ? (
          <div className="athletic-card rounded-2xl p-8 text-center space-y-3">
            <p className="text-sm text-[#68766A]">No saved coaching conversations yet.</p>
            <button
              onClick={() => onNavigate('coach-chat')}
              className="px-5 py-2.5 rounded-xl bg-[#397B32] text-white text-xs font-bold hover:bg-[#153D25]"
            >
              Start a Coaching Conversation
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {msgs.map((m) => (
              <div key={m.id} className="athletic-card rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#68766A]">
                  <span>
                    <strong className="text-[#17251A]">{m.role === 'user' ? state.profile.name : 'CRICKIFY AI Coach'}</strong> · {m.language} ·{' '}
                    {new Date(m.timestamp).toLocaleString()}
                  </span>
                  {m.role === 'assistant' && (
                    <button
                      onClick={() => onToggleSaveMessage(m.id)}
                      className={`inline-flex items-center gap-1 text-xs font-semibold ${
                        m.saved ? 'text-[#397B32]' : 'text-[#68766A] hover:text-[#17251A]'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${m.saved ? 'fill-current' : ''}`} />
                      {m.saved ? 'Saved' : 'Save Advice'}
                    </button>
                  )}
                </div>
                <p className="text-sm text-[#17251A] whitespace-pre-wrap leading-relaxed">{m.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sleek Charcoal & Emerald AI Suite Header */}
      <div className="relative rounded-3xl overflow-hidden coach-dark-panel text-white p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <img
          src={CRICKIFY_IMAGES.aiCoachRobot}
          alt="AI cricket coach robot speaking and chatting messages"
          className="absolute inset-0 w-full h-full object-cover opacity-55"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(108deg, rgba(6, 22, 15, 0.94) 0%, rgba(12, 36, 25, 0.80) 55%, rgba(16, 185, 129, 0.25) 100%)',
          }}
        />

        <div className="relative z-10">
          <div className="text-xs font-bold text-[#B7F34A] uppercase tracking-wider mb-1">
            {mode === 'voice'
              ? 'Voice Cricket Coach'
              : mode === 'no-video'
                ? 'Ask Without Video · General & Profile-Tailored Coaching'
                : 'Personal AI Cricket Coach'}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white">
            CRICKIFY AI Cricket Coach
          </h1>
          <p className="text-sm text-white/90 mt-1">
            Adapted for {state.profile.skillLevel} {state.profile.role} ({state.profile.battingHand}). Ask in English, Tamil, or Hindi.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageChoice)}
            aria-label="Coaching language"
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#DCF2E2] text-[#102419] text-xs font-bold shadow-xs border border-[#B7F34A]/40"
          >
            <option value="English">English</option>
            <option value="Tamil">Tamil (தமிழ்)</option>
            <option value="Hindi">Hindi (हिन्दी)</option>
          </select>

          <button
            onClick={() => {
              if (speakReplies && 'speechSynthesis' in window) window.speechSynthesis.cancel();
              setSpeakReplies((s) => !s);
            }}
            className={`min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              speakReplies
                ? 'bg-[#A8D94E] text-[#17251A]'
                : 'bg-[#103B2A]/80 text-white border border-[#B7F34A]/35 hover:bg-[#165039]'
            }`}
          >
            {speakReplies ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {speakReplies ? 'Voice Reply On' : 'Voice Reply Off'}
          </button>

          {mode !== 'no-video' && state.reports.length > 0 && (
            <select
              value={selectedReportId}
              onChange={(e) => setSelectedReportId(e.target.value)}
              aria-label="Attach video analysis report"
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#DCF2E2] text-[#102419] text-xs font-bold max-w-[230px] border border-[#B7F34A]/40"
            >
              <option value="">No Video Attached</option>
              {state.reports.map((r) => (
                <option key={r.id} value={r.id}>
                  Report: {r.technique} ({new Date(r.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {selectedReport && (
        <div className="bg-[#EDF3E8] border border-[#397B32]/30 text-[#24552E] rounded-2xl px-4 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-[#397B32]" />
            <span>
              Video Report Attached: <strong>{selectedReport.skillCategory} — {selectedReport.technique}</strong> ({selectedReport.observations.length} observations)
            </span>
          </div>
          <button onClick={() => setSelectedReportId('')} className="text-[#397B32] font-bold underline">
            Detach
          </button>
        </div>
      )}

      {/* Conversation Container (Very Light White-Green Panel & Composer) */}
      <div className="rounded-3xl overflow-hidden flex flex-col border border-[#087F55]/25 bg-[#F6FCF5] shadow-lg">
        <div
          className="p-4 sm:p-6 space-y-5 min-h-[320px] max-h-[58vh] sm:max-h-[540px] overflow-y-auto"
          style={{
            backgroundColor: '#F6FCF5',
            backgroundImage:
              'radial-gradient(circle at 90% 10%, rgba(183, 243, 74, 0.14) 0%, transparent 45%), repeating-linear-gradient(90deg, rgba(8, 127, 85, 0.018) 0px, rgba(8, 127, 85, 0.018) 32px, transparent 32px, transparent 64px)',
          }}
        >
          {state.coachMessages.length === 0 ? (
            <div className="space-y-5 py-1">
              <div className="bg-[#FFFFFF]/90 rounded-2xl border border-[#087F55]/20 p-4 sm:p-5 max-w-2xl shadow-xs">
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#087F55] mb-1">
                  CRICKIFY AI Coach Ready
                </div>
                <p className="text-sm text-[#244030] leading-relaxed">
                  Ask any batting, bowling, fielding, fitness, or match-tactics question below. If you do not attach a video report, I will never pretend to see your mechanics—I will ask clarifying questions, explain the technique clearly, and link exact drills.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[#102419]">
                    Suggested Cricket Coaching Prompts
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(QUICK_PROMPTS_BY_TOPIC) as Array<keyof typeof QUICK_PROMPTS_BY_TOPIC>).map((topic) => (
                      <button
                        key={topic}
                        onClick={() => setPromptTopic(topic)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          promptTopic === topic
                            ? 'bg-[#103B2A] text-white shadow-xs'
                            : 'bg-[#FFFFFF] border border-[#087F55]/20 text-[#264232] hover:bg-[#E7F5E6] hover:text-[#102419]'
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {QUICK_PROMPTS_BY_TOPIC[promptTopic].map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-left p-4 rounded-xl bg-[#FAFDFA] border border-[#087F55]/20 text-xs font-semibold text-[#102419] hover:border-[#087F55] hover:bg-[#E8F6E7] transition-colors shadow-2xs"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            state.coachMessages.map((msg) => {
              const isUser = msg.role === 'user';
              const matchedExercises = (msg.recommendedExerciseIds || [])
                .map((id) => CRICKET_EXERCISES.find((e) => e.id === id))
                .filter(Boolean);
              const matchedLessons = (msg.recommendedLessonIds || [])
                .map((id) => CRICKET_LESSONS.find((l) => l.id === id))
                .filter(Boolean);

              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-3xl rounded-2xl p-4 md:p-5 space-y-3 ${
                      isUser
                        ? 'bg-[#087F55] text-white shadow-sm'
                        : 'bg-[#FFFFFF] border border-[#087F55]/22 text-[#102419] shadow-xs'
                    }`}
                  >
                    <div className={`flex items-center justify-between gap-4 text-[11px] ${isUser ? 'text-white/85' : 'text-[#4B6856]'}`}>
                      <span>{isUser ? state.profile.name : 'CRICKIFY AI Coach'} · {msg.language}</span>
                      {!isUser && (
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => speakText(msg.content, msg.language)}
                            aria-label="Listen to coaching advice"
                            className="hover:text-[#087F55] transition-colors"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleSaveMessage(msg.id)}
                            aria-label="Save coaching advice"
                            className={msg.saved ? 'text-[#087F55]' : 'hover:text-[#087F55]'}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${msg.saved ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                    {(matchedExercises.length > 0 || matchedLessons.length > 0) && (
                      <div className="pt-3 border-t border-[#17251A]/10 flex flex-wrap gap-2">
                        {matchedLessons.map(
                          (l) =>
                            l && (
                              <button
                                key={l.id}
                                onClick={() => onOpenLesson(l.id)}
                                className="px-3 py-1.5 rounded-lg bg-[#EDF6EC] border border-[#087F55]/20 text-xs font-semibold text-[#103B2A] hover:bg-[#DFF0DE]"
                              >
                                Lesson: {l.title}
                              </button>
                            )
                        )}
                        {matchedExercises.map(
                          (ex) =>
                            ex && (
                              <button
                                key={ex.id}
                                onClick={() => onOpenExercise(ex.id)}
                                className="px-3 py-1.5 rounded-lg bg-[#E4F7C7] border border-[#4D7C0F]/25 text-xs font-semibold text-[#103B2A] hover:bg-[#D5F0AD]"
                              >
                                Drill: {ex.name}
                              </button>
                            )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#087F55] font-semibold">
              <Loader2 className="w-4 h-4 animate-spin" /> Coach is preparing tailored cricket guidance...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {(apiError || voiceError) && (
          <div className="px-5 py-3 bg-red-50 border-t border-red-200 text-xs text-red-800 flex items-center justify-between gap-3">
            <span>{apiError || voiceError}</span>
            {apiError && lastFailedQuestion && (
              <button
                type="button"
                onClick={() => sendMessage(lastFailedQuestion)}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-red-700 text-white font-semibold hover:bg-red-800 disabled:opacity-50 shrink-0"
              >
                Retry
              </button>
            )}
          </div>
        )}

        {/* Light White-Green Message Input Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="p-3 sm:p-4 bg-[#EAF6E8] border-t border-[#087F55]/20 flex items-center gap-2"
        >
          <button
            type="button"
            onClick={handleVoiceToggle}
            aria-label={listening ? 'Stop voice recording' : 'Start voice input'}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition-colors shrink-0 ${
              listening
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-[#FFFFFF] text-[#087F55] border-[#087F55]/25 hover:bg-[#DFF0DE]'
            }`}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              language === 'Tamil'
                ? 'உங்கள் கிரிக்கெட் கேள்வியை கேளுங்கள்...'
                : language === 'Hindi'
                  ? 'अपना क्रिकेट प्रश्न पूछें...'
                  : 'Ask your AI cricket coach...'
            }
            className="flex-1 min-w-0 min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#087F55]/25 bg-[#FAFDFA] text-sm text-[#102419] placeholder:text-[#5B7564] focus:outline-none focus:ring-2 focus:ring-[#087F55] shadow-2xs"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-[#087F55] text-white text-xs font-extrabold hover:bg-[#103B2A] transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 shadow-xs"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask Coach</span>
          </button>
        </form>
      </div>
    </div>
  );
};
