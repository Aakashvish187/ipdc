'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

const TIMER_SECS = 30;
const XP_PER_CORRECT = 10;
const XP_TIMED_BONUS = 5;
const XP_PERFECT = 200;
const XP_FIRST_OF_DAY = 50;
const LEVELS = [
  { min:0, icon:'♟', name:'Pawn' },
  { min:200, icon:'♞', name:'Knight' },
  { min:500, icon:'♝', name:'Bishop' },
  { min:1000, icon:'♜', name:'Rook' },
  { min:2000, icon:'♛', name:'Queen' },
  { min:3500, icon:'♚', name:'King' },
];
const ALL_BADGES = [
  { id:'perfect', icon:'🎯', name:'Perfect Game', desc:'Score 100/100' },
  { id:'speed', icon:'⚡', name:'Speed Demon', desc:'Finish timed quiz under 4 min' },
  { id:'fire', icon:'🔥', name:'On Fire', desc:'10 correct in a row' },
  { id:'scholar', icon:'📚', name:'Scholar', desc:'10 total attempts' },
  { id:'warrior', icon:'⚔', name:'Warrior', desc:'Complete a battle mode game' },
  { id:'early', icon:'🌅', name:'Early Bird', desc:'Play before 8am' },
  { id:'king', icon:'👑', name:'Grandmaster', desc:'Reach King level' },
  { id:'comeback', icon:'💪', name:'Comeback Kid', desc:'Score 100% on retry' },
  { id:'dedicated', icon:'🎓', name:'Dedicated', desc:'7-day streak' },
];
function getLevel(xp: number) { return [...LEVELS].reverse().find(l => xp >= l.min) || LEVELS[0]; }

const LBL = ['A', 'B', 'C', 'D'];
const PIECES = ['♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛', '♜', '♝', '♞', '♟'];

const QS = [
  {q:"Self-awareness means:",o:["Knowing others","Understanding one's own thoughts and emotions","Avoiding problems","Following others"],a:1},
  {q:"Goal setting helps a person to:",o:["Waste time","Stay focused and motivated","Avoid responsibility","Depend on others"],a:1},
  {q:"SMART goals stand for:",o:["Simple, Measurable, Accurate, Realistic, Timely","Specific, Measurable, Achievable, Relevant, Time-bound","Small, Modern, Active, Real, True","Strong, Motivated, Active, Responsible, Tough"],a:1},
  {q:"Habit formation requires:",o:["Consistency","Laziness","Fear","Luck"],a:0},
  {q:"Positive mindset helps in:",o:["Creating stress","Facing challenges confidently","Ignoring reality","Avoiding work"],a:1},
  {q:"Stress management includes:",o:["Overthinking","Exercise and relaxation","Anger","Isolation"],a:1},
  {q:"Discipline means:",o:["Punishment","Self-control and responsibility","Freedom without rules","Fear of authority"],a:1},
  {q:"Personal development mainly focuses on:",o:["External appearance","Holistic growth","Competition only","Wealth only"],a:1},
  {q:"Emotional stability helps a person to:",o:["React impulsively","Maintain balance during difficulties","Avoid emotions","Become aggressive"],a:1},
  {q:"Self-transformation begins with:",o:["Changing others","Self-reflection","Complaining","Comparison"],a:1},
  {q:"Time management helps to:",o:["Increase confusion","Improve productivity","Waste energy","Reduce learning"],a:1},
  {q:"A positive attitude leads to:",o:["Success and happiness","Fear","Laziness","Failure"],a:0},
  {q:"Healthy lifestyle includes:",o:["Junk food only","Regular exercise and proper sleep","Overworking","Stress"],a:1},
  {q:"Self-confidence grows through:",o:["Practice and achievements","Avoiding challenges","Fear","Isolation"],a:0},
  {q:"Personal goals should be:",o:["Unrealistic","Clear and achievable","Random","Forced"],a:1},
  {q:"Meditation helps in:",o:["Increasing stress","Mental peace","Anger","Distraction"],a:1},
  {q:"Growth mindset means:",o:["Fixed abilities","Learning through effort","Avoiding failure","Fear of change"],a:1},
  {q:"Failure should be seen as:",o:["End of success","Learning opportunity","Shame","Weakness"],a:1},
  {q:"Self-discipline develops through:",o:["Regular practice","Complaints","Excuses","Pressure"],a:0},
  {q:"Motivation is:",o:["Internal drive to achieve goals","Fear","Punishment","Luck"],a:0},
  {q:"Personal health affects:",o:["Only physical body","Mental and emotional well-being","Social life only","Nothing"],a:1},
  {q:"Self-reflection helps to:",o:["Understand strengths and weaknesses","Judge others","Escape problems","Avoid learning"],a:0},
  {q:"Positive thinking encourages:",o:["Confidence","Negativity","Fear","Stress"],a:0},
  {q:"Managing emotions requires:",o:["Awareness and control","Suppression","Anger","Ignorance"],a:0},
  {q:"The main aim of personality development is:",o:["External success only","Balanced personal growth","Competition","Fame"],a:1},
  {q:"Moral values guide:",o:["Ethical behaviour","Competition","Wealth","Power"],a:0},
  {q:"Soft skills include:",o:["Programming","Communication and teamwork","Mathematics","Technical tools"],a:1},
  {q:"Effective communication requires:",o:["Listening skills","Interrupting others","Loud speaking","Ignoring feedback"],a:0},
  {q:"Teamwork means:",o:["Working alone","Working together toward a common goal","Competing internally","Avoiding responsibility"],a:1},
  {q:"Leadership involves:",o:["Dominating others","Inspiring and guiding people","Giving orders only","Avoiding decisions"],a:1},
  {q:"Family harmony depends on:",o:["Conflict","Respect and understanding","Silence","Authority"],a:1},
  {q:"Financial planning helps to:",o:["Overspend","Manage income and expenses","Create debt","Avoid savings"],a:1},
  {q:"Citizenship means:",o:["Ignoring society","Rights and responsibilities toward nation","Personal gain","Isolation"],a:1},
  {q:"Social responsibility includes:",o:["Helping community","Selfish behaviour","Ignoring problems","Competition"],a:0},
  {q:"National pride encourages:",o:["Social unity","Conflict","Negativity","Isolation"],a:0},
  {q:"Empathy means:",o:["Judging others","Understanding others' feelings","Ignoring emotions","Criticizing"],a:1},
  {q:"Decision-making skill requires:",o:["Careful thinking","Impulsiveness","Fear","Confusion"],a:0},
  {q:"Conflict resolution needs:",o:["Communication and compromise","Aggression","Silence","Blame"],a:0},
  {q:"Good leadership qualities include:",o:["Responsibility and vision","Ego","Fear","Anger"],a:0},
  {q:"Active listening means:",o:["Hearing without attention","Listening with understanding","Ignoring speaker","Interrupting"],a:1},
  {q:"Ethical citizenship promotes:",o:["Corruption","Responsible social behaviour","Self-interest","Conflict"],a:1},
  {q:"Financial literacy teaches:",o:["Saving and budgeting","Overspending","Borrowing always","Ignoring money"],a:0},
  {q:"Cooperation helps in:",o:["Group success","Individual conflict","Failure","Isolation"],a:0},
  {q:"Respecting diversity means:",o:["Accepting differences","Rejecting others","Creating conflict","Ignoring society"],a:0},
  {q:"The movie The Pursuit of Happyness teaches:",o:["Giving up easily","Perseverance and hard work","Luck matters most","Avoiding struggle"],a:1},
  {q:"Chris Gardner's character shows:",o:["Determination","Laziness","Fear","Negativity"],a:0},
  {q:"Success in life depends on:",o:["Continuous effort","Luck only","Wealth only","Comfort zone"],a:0},
  {q:"Soft skills improve:",o:["Academic and professional relationships","Isolation","Competition only","Fear"],a:0},
  {q:"Social contribution builds:",o:["Strong society","Conflict","Isolation","Selfishness"],a:0},
  {q:"Integrated personality development aims at:",o:["Academic marks only","Holistic development of individual and society","Competition only","Personal fame"],a:1},
  {q:"Self-motivation refers to:",o:["Motivation from others","Inner drive to act","External pressure","Competition"],a:1},
  {q:"Personal values influence:",o:["Behaviour and decisions","Weather","Technology","Fashion"],a:0},
  {q:"Self-esteem is:",o:["Respect for oneself","Fear of failure","Pride only","Social status"],a:0},
  {q:"A person improves personality by:",o:["Continuous learning","Avoiding feedback","Comparing constantly","Ignoring mistakes"],a:0},
  {q:"Procrastination means:",o:["Completing work early","Delaying tasks unnecessarily","Planning carefully","Working efficiently"],a:1},
  {q:"Emotional intelligence includes:",o:["Logical reasoning only","Understanding emotions","Physical strength","Memory power"],a:1},
  {q:"Confidence develops through:",o:["Practice and preparation","Overconfidence","Fear","Luck"],a:0},
  {q:"Self-control helps in:",o:["Managing impulses","Increasing stress","Avoiding work","Ignoring goals"],a:0},
  {q:"Personal growth requires:",o:["Comfort zone","Willingness to change","Isolation","Dependence"],a:1},
  {q:"A daily routine promotes:",o:["Discipline","Confusion","Laziness","Stress"],a:0},
  {q:"Constructive feedback helps in:",o:["Improvement","Criticism only","Failure","Conflict"],a:0},
  {q:"Positive affirmation means:",o:["Negative thinking","Encouraging self-statements","Complaining","Judging others"],a:1},
  {q:"Managing failure teaches:",o:["Resilience","Fear","Weakness","Escape"],a:0},
  {q:"Stress can be reduced through:",o:["Time planning","Overthinking","Avoidance","Anger"],a:0},
  {q:"Personal responsibility means:",o:["Blaming others","Owning one's actions","Ignoring duties","Avoiding decisions"],a:1},
  {q:"Adaptability means:",o:["Resistance to change","Ability to adjust","Fear of learning","Laziness"],a:1},
  {q:"Self-improvement begins with:",o:["Awareness","Competition","Comparison","Pressure"],a:0},
  {q:"Optimism means:",o:["Expecting positive outcomes","Ignoring problems","Unrealistic thinking","Fear"],a:0},
  {q:"Work-life balance helps maintain:",o:["Health and happiness","Stress","Confusion","Isolation"],a:0},
  {q:"Personal integrity means:",o:["Honesty and strong principles","Success only","Power","Popularity"],a:0},
  {q:"Decision-making improves through:",o:["Analysis of options","Guessing","Avoidance","Delay"],a:0},
  {q:"Self-management includes:",o:["Controlling time and behaviour","Controlling others","Competition","Authority"],a:0},
  {q:"Learning from mistakes leads to:",o:["Growth","Failure","Fear","Regret"],a:0},
  {q:"Gratitude practice promotes:",o:["Positivity","Negativity","Ego","Stress"],a:0},
  {q:"Personal vision refers to:",o:["Long-term life direction","Random thinking","Social pressure","Temporary goals"],a:0},
  {q:"Courtesy in communication means:",o:["Respectful interaction","Loud speaking","Interrupting","Ignoring"],a:0},
  {q:"Team collaboration requires:",o:["Trust and cooperation","Competition","Ego","Isolation"],a:0},
  {q:"Ethical behaviour is guided by:",o:["Moral principles","Fear","Power","Authority"],a:0},
  {q:"Assertive communication means:",o:["Expressing ideas confidently and respectfully","Aggression","Silence","Dominance"],a:0},
  {q:"Public speaking skill improves through:",o:["Practice","Avoidance","Fear","Silence"],a:0},
  {q:"Social awareness helps in:",o:["Understanding society","Isolation","Selfishness","Conflict"],a:0},
  {q:"Leadership through example means:",o:["Practicing what you preach","Giving orders","Criticizing others","Avoiding work"],a:0},
  {q:"Responsible citizenship includes:",o:["Following laws","Ignoring duties","Self-interest","Conflict"],a:0},
  {q:"Respect in relationships builds:",o:["Trust","Conflict","Fear","Distance"],a:0},
  {q:"Volunteer work promotes:",o:["Social contribution","Personal fame","Isolation","Competition"],a:0},
  {q:"Effective teamwork needs:",o:["Shared responsibility","Individual ego","Silence","Authority"],a:0},
  {q:"Conflict management aims at:",o:["Peaceful solutions","Winning arguments","Dominance","Avoidance"],a:0},
  {q:"Financial discipline includes:",o:["Saving regularly","Overspending","Debt creation","Impulse buying"],a:0},
  {q:"National values promote:",o:["Unity and respect","Division","Conflict","Negativity"],a:0},
  {q:"Emotional empathy strengthens:",o:["Relationships","Conflict","Isolation","Fear"],a:0},
  {q:"Professional ethics involve:",o:["Honesty at workplace","Cheating","Laziness","Irresponsibility"],a:0},
  {q:"Listening is important because it:",o:["Improves understanding","Shows weakness","Creates confusion","Ends communication"],a:0},
  {q:"Leadership decision-making should be:",o:["Fair and informed","Emotional only","Random","Biased"],a:0},
  {q:"Positive social behaviour includes:",o:["Helping others","Ignoring society","Competition only","Anger"],a:0},
  {q:"In The Pursuit of Happyness, perseverance means:",o:["Continuous effort despite hardship","Giving up","Waiting for luck","Avoiding struggle"],a:0},
  {q:"Chris Gardner's success shows importance of:",o:["Determination and resilience","Comfort zone","Wealth only","Support only"],a:0},
  {q:"Parenting responsibility shown in the movie reflects:",o:["Commitment and care","Negligence","Escape","Fear"],a:0},
  {q:"Social responsibility begins with:",o:["Individual actions","Government only","Society only","Luck"],a:0},
  {q:"Good interpersonal skills help in:",o:["Building networks","Isolation","Conflict","Competition"],a:0},
  {q:"Integrated personality development ultimately creates:",o:["Responsible and confident individuals","Competitive individuals only","Wealthy people only","Isolated individuals"],a:0},
];

type LeaderboardRow = { username: string; best_score: number; best_percentage: number; rating_icon: string; attempts: number; batch?: string; xp?: number; level?: string; };
type StatsRow = { score: number; total: number; percentage: number; created_at: string; };
type BattleState = 'idle'|'creating'|'joining'|'waiting_start'|'in_progress'|'waiting_result'|'complete';
type BattleRow = { battle_code:string; creator_username:string; challenger_username?:string|null; question_indices:string; status:string; creator_score?:number|null; challenger_score?:number|null; };

export default function ChessQuiz() {
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [batch, setBatch] = useState<string | null>(null);
  const [userXp, setUserXp] = useState(0);
  const [userBadges, setUserBadges] = useState<string[]>([]);
  const [cur, setCur] = useState(0);
  const [chosen, setChosen] = useState<number[]>(new Array(QS.length).fill(-1));
  const [mode, setMode] = useState<'quiz' | 'study' | 'timed'>('quiz');
  const [scoreSaved, setScoreSaved] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [lbTab, setLbTab] = useState<'all'|'batch'>('all');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardRow[]>([]);
  const [loadingLB, setLoadingLB] = useState(false);
  const [lbError, setLbError] = useState<string | null>(null);
  const [regInput, setRegInput] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  // Timer
  const [timeLeft, setTimeLeft] = useState(TIMER_SECS);
  const [totalTime, setTotalTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const totalTimerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const battleTimerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const battleCodeRef = useRef('');
  const iAmCreatorRef = useRef(false);
  // Retry mode
  const [retryIndices, setRetryIndices] = useState<number[]|null>(null);
  const [retryChosen, setRetryChosen] = useState<number[]>([]);
  const [firstScore, setFirstScore] = useState<number|null>(null);
  // Live rank
  const [liveRank, setLiveRank] = useState<string|null>(null);
  // Battle state machine
  const [battleState, setBattleState] = useState<BattleState>('idle');
  const [showBattle, setShowBattle] = useState(false);
  const [battleCode, setBattleCode] = useState('');
  const [battleData, setBattleData] = useState<BattleRow|null>(null);
  const [battleQuestions, setBattleQuestions] = useState<Array<{q:string;o:string[];a:number}>>([]);
  const [battleChosen, setBattleChosen] = useState<number[]>([]);
  const [battleCur, setBattleCur] = useState(0);
  const [myBattleScore, setMyBattleScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState<number|null>(null);
  const [iAmCreator, setIAmCreator] = useState(false);
  const [battleLoading, setBattleLoading] = useState(false);
  const [battleMsg, setBattleMsg] = useState('');
  const [battleTimeLeft, setBattleTimeLeft] = useState(20);
  // Stats
  const [showStats, setShowStats] = useState(false);
  const [statsData, setStatsData] = useState<StatsRow[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  // XP animation
  const [xpEarned, setXpEarned] = useState(0);
  // Toast
  const [toast, setToast] = useState('');
  // Rating modal
  const [showRating, setShowRating] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sb = createClient();


  useEffect(() => {
    const storedId = localStorage.getItem('chess_quiz_user_id');
    const storedName = localStorage.getItem('chess_quiz_username');
    const storedBatch = localStorage.getItem('chess_quiz_batch');
    const storedXp = localStorage.getItem('chess_quiz_xp');
    const storedBadges = localStorage.getItem('chess_quiz_badges');
    if (storedId && storedName) { setUserId(storedId); setUsername(storedName); }
    if (storedBatch) setBatch(storedBatch);
    if (storedXp) setUserXp(parseInt(storedXp));
    if (storedBadges) setUserBadges(JSON.parse(storedBadges));
    // Battle URL detection — store in sessionStorage so it survives registration
    const params = new URLSearchParams(window.location.search);
    const bc = params.get('battle');
    if (bc) {
      sessionStorage.setItem('pending_battle', bc);
      setBattleCode(bc); setBattleMsg('');
      setBattleState('joining'); setShowBattle(true);
    } else {
      const pending = sessionStorage.getItem('pending_battle');
      if (pending && storedName) { setBattleCode(pending); setBattleState('joining'); setShowBattle(true); }
    }
  }, []);

  // Timer effect for timed mode
  useEffect(() => {
    if (mode !== 'timed' || !username) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(TIMER_SECS);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          // Auto-skip: mark as wrong (-2)
          setChosen(prev => { const n=[...prev]; if(n[cur]===-1) n[cur]=-2; return n; });
          setCur(c => Math.min(c+1, QS.length-1));
          return TIMER_SECS;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if(timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, mode, username]);

  // Total time tracker
  useEffect(() => {
    if (mode !== 'timed' || !username) return;
    if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    totalTimerRef.current = setInterval(() => setTotalTime(t => t+1), 1000);
    return () => { if(totalTimerRef.current) clearInterval(totalTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, username]);

  // After registration, resume any pending battle
  useEffect(() => {
    if (!username) return;
    const pending = sessionStorage.getItem('pending_battle');
    if (pending) { sessionStorage.removeItem('pending_battle'); setBattleCode(pending); setBattleState('joining'); setShowBattle(true); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  // Sync refs for stable poll closures
  useEffect(() => { battleCodeRef.current = battleCode; }, [battleCode]);
  useEffect(() => { iAmCreatorRef.current = iAmCreator; }, [iAmCreator]);

  // Cleanup all intervals on unmount
  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (battleTimerRef.current) clearInterval(battleTimerRef.current);
  }, []);

  // finishBattle: save score then poll for opponent
  const finishBattle = useCallback(async (score: number) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setMyBattleScore(score);
    setBattleState('waiting_result');
    const field = iAmCreatorRef.current ? 'creator_score' : 'challenger_score';
    try { await sb.from('battles').update({ [field]: score, status: 'complete' }).eq('battle_code', battleCodeRef.current); } catch (_) {}
    const oppField = iAmCreatorRef.current ? 'challenger_score' : 'creator_score';
    pollRef.current = setInterval(async () => {
      const { data } = await sb.from('battles').select('creator_score,challenger_score').eq('battle_code', battleCodeRef.current).single();
      if (data?.[oppField] !== null && data?.[oppField] !== undefined) {
        clearInterval(pollRef.current!);
        setOpponentScore(data[oppField]);
        setBattleState('complete');
      }
    }, 3000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sb]);

  // Battle per-question 20s timer
  useEffect(() => {
    if (battleState !== 'in_progress') { if (battleTimerRef.current) clearInterval(battleTimerRef.current); return; }
    if (battleTimerRef.current) clearInterval(battleTimerRef.current);
    setBattleTimeLeft(20);
    battleTimerRef.current = setInterval(() => {
      setBattleTimeLeft(t => {
        if (t <= 1) {
          setBattleChosen(prev => { const n=[...prev]; if(n[battleCur]===-1) n[battleCur]=-2; return n; });
          setBattleCur(c => c+1);
          return 20;
        }
        return t-1;
      });
    }, 1000);
    return () => { if (battleTimerRef.current) clearInterval(battleTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleCur, battleState]);

  // Battle completion detection
  useEffect(() => {
    if (battleState !== 'in_progress' || battleQuestions.length === 0) return;
    if (battleCur >= battleQuestions.length) {
      if (battleTimerRef.current) clearInterval(battleTimerRef.current);
      const score = battleChosen.reduce((acc,v,i) => acc+(v===battleQuestions[i]?.a?1:0), 0);
      finishBattle(score);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleCur]);

  const getRating = (s: number, t: number) => {
    const p = s / t;
    if (s === t) return { icon: '♔', title: 'World Champion', desc: 'Perfection achieved — a historic feat.' };
    if (p >= 0.9) return { icon: '♔', title: 'Grandmaster', desc: 'A truly masterful performance.' };
    if (p >= 0.75) return { icon: '♕', title: 'International Master', desc: 'Commanding control across all positions.' };
    if (p >= 0.6) return { icon: '♖', title: 'Candidate Master', desc: 'Strong foundations, keep sharpening your game.' };
    if (p >= 0.4) return { icon: '♗', title: 'Club Player', desc: 'A solid start — the board rewards persistence.' };
    return { icon: '♟', title: 'Beginner', desc: 'Every grandmaster once stood where you stand.' };
  };

  const registerUser = async () => {
    const name = regInput.trim();
    if (!name) return alert('Please enter a username.');
    if (name.length < 2) return alert('Username must be at least 2 characters.');
    setRegLoading(true);
    try {
      // Check if user exists
      const { data: existing } = await sb
        .from('users')
        .select('id, username')
        .eq('username', name)
        .maybeSingle();

      if (existing) {
        setUserId(existing.id); setUsername(existing.username);
        localStorage.setItem('chess_quiz_user_id', existing.id);
        localStorage.setItem('chess_quiz_username', existing.username);
        if (batchInput.trim()) {
          setBatch(batchInput.trim());
          localStorage.setItem('chess_quiz_batch', batchInput.trim());
          await sb.from('users').update({ batch: batchInput.trim() }).eq('id', existing.id);
        }
      } else {
        const bv = batchInput.trim() || null;
        const { data: newUser, error } = await sb
          .from('users')
          .insert([{ username: name, batch: bv }])
          .select('id, username')
          .single();
        if (error) throw error;
        setUserId(newUser.id); setUsername(newUser.username);
        localStorage.setItem('chess_quiz_user_id', newUser.id);
        localStorage.setItem('chess_quiz_username', newUser.username);
        if (bv) { setBatch(bv); localStorage.setItem('chess_quiz_batch', bv); }
      }
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Something went wrong'));
    } finally {
      setRegLoading(false);
    }
  };

  const changeUsername = () => {
    if (!confirm('Change username? Your scores will stay saved.')) return;
    localStorage.removeItem('chess_quiz_user_id');
    localStorage.removeItem('chess_quiz_username');
    setUserId(null);
    setUsername(null);
    setRegInput('');
    setScoreSaved(false);
    setCur(0);
    setChosen(new Array(QS.length).fill(-1));
    setMode('quiz');
  };

  const saveScore = useCallback(async (score: number, total: number, pct: number, ratingTitle: string, timeTaken?: number) => {
    if (!userId || !username) return;
    // XP calculation
    const isTimed = mode === 'timed';
    let xp = score * (isTimed ? XP_PER_CORRECT + XP_TIMED_BONUS : XP_PER_CORRECT);
    if (score === total) xp += XP_PERFECT;
    const lastPlay = localStorage.getItem('chess_quiz_last_play');
    const today = new Date().toDateString();
    if (lastPlay !== today) { xp += XP_FIRST_OF_DAY; localStorage.setItem('chess_quiz_last_play', today); }
    const newXp = userXp + xp;
    setUserXp(newXp); setXpEarned(xp);
    localStorage.setItem('chess_quiz_xp', String(newXp));
    try {
      await sb.from('scores').insert([{ user_id: userId, username, score, total, percentage: pct, rating: ratingTitle, time_taken: timeTaken || null }]);
      // Fetch current user stats then update best_score, total_attempts, avg_score
      const { data: currentUser } = await sb
        .from('users')
        .select('best_score, total_attempts, avg_score')
        .eq('id', userId)
        .single();
      const newBest = Math.max(currentUser?.best_score || 0, score);
      const newAttempts = (currentUser?.total_attempts || 0) + 1;
      const newAvg = Math.round(
        ((currentUser?.avg_score || 0) * (newAttempts - 1) + score) / newAttempts
      );
      await sb
        .from('users')
        .update({
          best_score: newBest,
          total_attempts: newAttempts,
          avg_score: newAvg,
          last_played: new Date().toISOString().split('T')[0],
          xp: newXp,
          level: getLevel(newXp).name,
        })
        .eq('id', userId);
    } catch (err) { console.error('Score save exception:', err); }
    // Check achievements
    const newBadges = [...userBadges];
    const earnBadge = (id: string) => { if (!newBadges.includes(id)) { newBadges.push(id); showToast(ALL_BADGES.find(b=>b.id===id)?.icon+' '+ALL_BADGES.find(b=>b.id===id)?.name+' badge earned!'); } };
    if (score === total) earnBadge('perfect');
    if (isTimed && timeTaken && timeTaken < 240) earnBadge('speed');
    if (new Date().getHours() < 8) earnBadge('early');
    if (getLevel(newXp).name === 'King') earnBadge('king');
    // Check fire (10 in a row)
    let streak=0, maxS=0; chosen.forEach((v,i)=>{ if(v===QS[i].a){streak++;maxS=Math.max(maxS,streak);}else{streak=0;} });
    if (maxS >= 10) earnBadge('fire');
    setUserBadges(newBadges);
    localStorage.setItem('chess_quiz_badges', JSON.stringify(newBadges));
    try { await sb.from('users').update({ badges: newBadges }).eq('id', userId); } catch(_){}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, username, userXp, userBadges, mode, chosen, sb]);

  const fetchLeaderboard = async () => {
    setLoadingLB(true); setLbError(null);
    try {
      let query = sb.from('leaderboard').select('username, best_score, best_percentage, rating_icon, attempts, batch, xp, level').order('best_score', { ascending: false }).order('best_percentage', { ascending: false }).limit(20);
      if (lbTab === 'batch' && batch) query = (sb.from('leaderboard') as any).select('username, best_score, best_percentage, rating_icon, attempts, batch, xp, level').eq('batch', batch).order('best_score', { ascending: false }).order('best_percentage', { ascending: false }).limit(20);
      const { data, error } = await query;
      if (error) throw error;
      const sorted = (data || []).sort((a: LeaderboardRow, b: LeaderboardRow) =>
        b.best_score - a.best_score || b.best_percentage - a.best_percentage
      );
      setLeaderboardData(sorted);
    } catch (err: any) {
      setLbError('Could not load leaderboard. Check Supabase connection.');
      setLeaderboardData([]);
    } finally { setLoadingLB(false); }
  };

  const openLeaderboard = () => {
    setShowLeaderboard(true);
    fetchLeaderboard();
  };

  const shareResults = async (score: number, ratingTitle: string) => {
    const text = `♔ Chess Royal IPDC MCQ\nI scored ${score}/100 — Rating: ${ratingTitle}!\nCan you beat me? 🎯`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Chess Royal IPDC', text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(text + '\n' + window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // user cancelled share
    }
  };

  const pick = (i: number) => {
    if (mode === 'study' || chosen[cur] !== -1) return;
    const next = [...chosen];
    next[cur] = i;
    setChosen(next);
  };

  const finish = () => {
    setChosen(prev => prev.map(v => v === -1 ? -2 : v));
  };

  const restart = () => {
    setCur(0); setChosen(new Array(QS.length).fill(-1));
    setMode('quiz'); setScoreSaved(false); setRetryIndices(null);
    setRetryChosen([]); setFirstScore(null); setTotalTime(0); setLiveRank(null);
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(''), 3500); };

  const fetchLiveRank = async (currentScore: number) => {
    try {
      const { count } = await sb.from('leaderboard').select('*', { count: 'exact', head: true }).gt('best_score', currentScore);
      const { count: total } = await sb.from('leaderboard').select('*', { count: 'exact', head: true });
      if (count !== null && total !== null) setLiveRank(`#${count + 1} of ${total + 1}`);
    } catch(_) {}
  };

  const startRetry = () => {
    const wrong = chosen.reduce((a:number[], v, i) => v !== QS[i].a ? [...a, i] : a, []);
    if (!wrong.length) return;
    setFirstScore(correct);
    setRetryIndices(wrong);
    setRetryChosen(new Array(wrong.length).fill(-1));
    setCur(0);
  };

  const openStats = async () => {
    setShowStats(true); setStatsLoading(true);
    try {
      const { data } = await sb.from('scores').select('score, total, percentage, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(10);
      setStatsData(data || []);
    } catch(_) {} finally { setStatsLoading(false); }
  };

  const createBattle = async () => {
    if (!username) return alert('Please register first');
    setBattleLoading(true); setBattleMsg('');
    try {
      const code = Math.random().toString(36).substring(2,8).toUpperCase();
      const qIndices = Array.from({length:10}, () => Math.floor(Math.random()*QS.length));
      const { data: inserted, error } = await sb.from('battles').insert([{
        battle_code: code, question_indices: JSON.stringify(qIndices),
        creator_username: username, status: 'waiting',
      }]).select().single();
      if (error) throw error;
      setBattleCode(code); setBattleData(inserted); setIAmCreator(true);
      setBattleQuestions(qIndices.map((i:number) => QS[i]));
      setBattleState('creating');
      // Poll every 3s for challenger joining
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        const { data } = await sb.from('battles').select('*').eq('battle_code', code).single();
        if (data?.status === 'active' && data?.challenger_username) {
          clearInterval(pollRef.current!);
          setBattleData(data);
          setBattleMsg(`🎯 ${data.challenger_username} joined! Starting...`);
          setTimeout(() => {
            setBattleChosen(new Array(10).fill(-1));
            setBattleCur(0); setBattleTimeLeft(20);
            setBattleState('in_progress'); setShowBattle(false);
          }, 2000);
        }
      }, 3000);
    } catch (e:any) { setBattleMsg('Error: '+(e.message||'Something went wrong')); }
    setBattleLoading(false);
  };

  const joinBattle = async (code: string) => {
    if (!username) return;
    setBattleLoading(true); setBattleMsg('');
    try {
      const { data: row, error } = await sb.from('battles').select('*').eq('battle_code', code.toUpperCase()).single();
      if (error || !row) throw new Error('Battle not found.');
      if (row.status === 'complete') { setBattleMsg('This battle has already finished.'); setBattleLoading(false); return; }
      if (row.status === 'active') { setBattleMsg('Battle already in progress — too late!'); setBattleLoading(false); return; }
      const { error: upErr } = await sb.from('battles')
        .update({ challenger_username: username, status: 'active' })
        .eq('battle_code', code.toUpperCase()).eq('status', 'waiting');
      if (upErr) throw upErr;
      const indices = JSON.parse(row.question_indices) as number[];
      setBattleData({ ...row, challenger_username: username, status: 'active' });
      setBattleQuestions(indices.map((i:number) => QS[i]));
      setIAmCreator(false);
      sessionStorage.removeItem('pending_battle');
      setBattleMsg('✅ Joined! Starting in 2 seconds...');
      setTimeout(() => {
        setBattleChosen(new Array(10).fill(-1));
        setBattleCur(0); setBattleTimeLeft(20);
        setBattleState('in_progress'); setShowBattle(false);
      }, 2000);
    } catch (e:any) { setBattleMsg('Error joining: '+(e.message||'Something went wrong')); }
    setBattleLoading(false);
  };


  const downloadScoreCard = (score: number, pct: number, ratingTitle: string, ratingIcon: string) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    canvas.width = 600; canvas.height = 400;
    ctx.fillStyle = '#1a1209'; ctx.fillRect(0,0,600,400);
    ctx.strokeStyle = '#c9982a'; ctx.lineWidth = 6; ctx.strokeRect(12,12,576,376);
    ctx.strokeStyle = '#a07820'; ctx.lineWidth = 1; ctx.strokeRect(20,20,560,360);
    ctx.fillStyle = '#c9982a'; ctx.font = 'bold 90px serif'; ctx.textAlign = 'center';
    ctx.fillText(ratingIcon, 300, 130);
    ctx.fillStyle = '#e8c97a'; ctx.font = 'bold 28px serif'; ctx.fillText('Chess Royal · IPDC MCQ', 300, 175);
    ctx.fillStyle = '#faf6ed'; ctx.font = 'bold 22px serif'; ctx.fillText(username || '', 300, 215);
    if (batch) { ctx.fillStyle = '#9a7f58'; ctx.font = '16px serif'; ctx.fillText('Batch: ' + batch, 300, 240); }
    ctx.fillStyle = '#c9982a'; ctx.font = 'bold 48px serif'; ctx.fillText(`${score}/100`, 300, 300);
    ctx.fillStyle = '#e8c97a'; ctx.font = '22px serif'; ctx.fillText(`${pct}% · ${ratingTitle}`, 300, 335);
    ctx.fillStyle = '#9a7f58'; ctx.font = '14px serif'; ctx.fillText(new Date().toLocaleDateString(), 300, 368);
    const a = document.createElement('a'); a.download = `chess-royal-${username}-score.png`; a.href = canvas.toDataURL(); a.click();
  };

  const shareWhatsApp = (score: number, pct: number, ratingTitle: string, ratingIcon: string) => {
    const msg = `♔ Chess Royal IPDC MCQ\nPlayer: ${username}${batch ? ` (${batch})` : ''}\nScore: ${score}/100 | ${pct}%\nRating: ${ratingIcon} ${ratingTitle}\n${window.location.href}\nCan you beat my score? 🎯`;
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
  };

  // ── Stats Overlay ────────────────────────────────────
  const StatsOverlay = () => {
    const best = statsData.length ? Math.max(...statsData.map(s=>s.score)) : 0;
    const avg = statsData.length ? Math.round(statsData.reduce((a,s)=>a+s.score,0)/statsData.length) : 0;
    const last5 = [...statsData].reverse().slice(-5);
    return (
      <div className="leaderboard-overlay" onClick={(e)=>{ if(e.target===e.currentTarget) setShowStats(false); }}>
        <div className="leaderboard-content">
          <div className="leaderboard-header">
            <div className="leaderboard-title">📊 My Performance</div>
            <button className="close-lb" onClick={()=>setShowStats(false)}>Close</button>
          </div>
          <div style={{ padding:'16px' }}>
            {statsLoading ? <div className="loader" /> : (<>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px' }}>
                {[['Attempts',statsData.length],['Best',`${best}/100`],['Average',`${avg}%`],['XP',userXp]].map(([l,v])=>(
                  <div key={l as string} className="r-card"><div className="rv" style={{fontSize:'22px'}}>{v}</div><div className="rl">{l}</div></div>
                ))}
              </div>
              {last5.length > 0 && (<>
                <div style={{ fontFamily:'var(--font-cinzel)', fontSize:'11px', letterSpacing:'1.5px', color:'var(--faint)', textTransform:'uppercase', marginBottom:'8px' }}>Last {last5.length} Attempts</div>
                <svg width="100%" height="80" style={{ display:'block' }}>
                  {last5.map((s,i)=>{ const h=Math.max(4,Math.round((s.score/100)*70)); const x=i*(100/last5.length)+'%'; return (<g key={i}><rect x={x} y={80-h} width="14%" height={h} fill="var(--gold)" rx="2"/><text x={`${parseFloat(x)+7}%`} y={78} textAnchor="middle" fontSize="10" fill="var(--faint)">{i+1}</text></g>); })}
                </svg>
              </>)}
              <div style={{ fontFamily:'var(--font-cinzel)', fontSize:'11px', letterSpacing:'1.5px', color:'var(--faint)', textTransform:'uppercase', margin:'16px 0 8px' }}>Achievements</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                {ALL_BADGES.map(b=>{
                  const earned = userBadges.includes(b.id);
                  return (<div key={b.id} style={{ background: earned ? 'var(--correct-bg)' : 'var(--parch)', border:`1px solid ${earned ? 'var(--correct-fg)' : 'var(--border-col)'}`, borderRadius:'4px', padding:'8px 10px', minWidth:'120px', opacity: earned ? 1 : 0.5 }}>
                    <div style={{ fontSize:'22px' }}>{earned ? b.icon : '🔒'}</div>
                    <div style={{ fontFamily:'var(--font-cinzel)', fontSize:'10px', fontWeight:700, color: earned ? 'var(--correct-fg)' : 'var(--faint)' }}>{b.name}</div>
                    <div style={{ fontSize:'10px', color:'var(--faint)' }}>{b.desc}</div>
                  </div>);
                })}
              </div>
            </>)}
          </div>
        </div>
      </div>
    );
  };

  // ── Battle Overlay (idle / creating / joining / waiting_start) ──
  const BattleOverlay = () => (
    <div className="leaderboard-overlay" onClick={(e)=>{ if(e.target===e.currentTarget){ setShowBattle(false); if(battleState==='idle') setBattleState('idle'); } }}>
      <div className="leaderboard-content">
        <div className="leaderboard-header">
          <div className="leaderboard-title">⚔ Battle Mode</div>
          <button className="close-lb" onClick={()=>setShowBattle(false)}>Close</button>
        </div>
        <div style={{padding:'24px',textAlign:'center'}}>

          {/* IDLE — create or join */}
          {(battleState==='idle') && (<>
            <div style={{fontSize:'48px',marginBottom:'12px'}}>⚔</div>
            <p style={{color:'var(--faint)',fontStyle:'italic',marginBottom:'20px'}}>Challenge a friend to a 10-question battle!</p>
            <button className="reg-btn" style={{marginBottom:'16px'}} onClick={createBattle} disabled={battleLoading}>
              {battleLoading?'⏳ Creating...':'⚔ Create New Battle'}
            </button>
          </>)}

          {/* CREATING — show code, wait for opponent */}
          {battleState==='creating' && (<>
            <div style={{fontSize:'36px',marginBottom:'8px'}}>⚔</div>
            <div style={{fontFamily:'var(--font-cinzel)',fontSize:'13px',color:'var(--faint)',marginBottom:'4px'}}>YOUR BATTLE CODE</div>
            <div style={{fontFamily:'var(--font-cinzel)',fontSize:'36px',color:'var(--gold)',letterSpacing:'6px',marginBottom:'12px'}}>{battleCode}</div>
            <div style={{fontSize:'12px',color:'var(--faint)',wordBreak:'break-all',marginBottom:'8px'}}>{typeof window!=='undefined'?window.location.origin:''}?battle={battleCode}</div>
            <div style={{display:'flex',gap:'8px',justifyContent:'center',flexWrap:'wrap',marginBottom:'16px'}}>
              <button className="nbtn" onClick={()=>{ navigator.clipboard.writeText(`${window.location.origin}?battle=${battleCode}`); showToast('Link copied!'); }}>Copy Link</button>
              <button className="nbtn btn-whatsapp" onClick={()=>{
                const msg=`⚔ Chess Royal Battle Challenge!\nI challenge you to an IPDC MCQ battle!\nBattle Code: ${battleCode}\nJoin here: ${window.location.origin}?battle=${battleCode}\n10 Questions · 20 seconds each · Who wins? 🏆`;
                window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');
              }}>💬 WhatsApp</button>
            </div>
            <div style={{color:'var(--faint)',fontStyle:'italic',fontSize:'13px',animation:'pulse-icon 1.5s ease-in-out infinite'}}>⏳ Waiting for opponent{battleMsg.includes('joined')?'':' ...'}</div>
            {battleMsg && <div style={{color:'var(--gold)',fontFamily:'var(--font-cinzel)',marginTop:'10px',fontSize:'14px'}}>{battleMsg}</div>}
          </>)}

          {/* JOINING — challenger accepts */}
          {battleState==='joining' && (<>
            <div style={{fontSize:'48px',marginBottom:'8px'}}>⚔</div>
            <div style={{fontFamily:'var(--font-cinzel)',fontSize:'18px',color:'var(--gold)',marginBottom:'4px'}}>Battle Challenge!</div>
            <p style={{color:'var(--faint)',marginBottom:'6px'}}>Battle code: <strong style={{color:'var(--gold)'}}>{battleCode}</strong></p>
            <p style={{color:'var(--faint)',fontStyle:'italic',marginBottom:'20px',fontSize:'14px'}}>10 Questions · 20 seconds each</p>
            <button className="reg-btn" onClick={()=>joinBattle(battleCode)} disabled={battleLoading}>
              {battleLoading?'⏳ Joining...':'⚔ Accept & Join Battle'}
            </button>
            {battleMsg && <div style={{color:'var(--faint)',fontSize:'13px',marginTop:'12px',whiteSpace:'pre-line'}}>{battleMsg}</div>}
          </>)}

          {/* WAITING_START — after join, countdown */}
          {battleState==='waiting_start' && (
            <div style={{color:'var(--gold)',fontFamily:'var(--font-cinzel)',fontSize:'16px',padding:'20px 0'}}>
              {battleMsg || '✅ Joined! Starting...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Rating Modal ─────────────────────────────────────
  const ratingFeedback: Record<number, string> = {
    1: "We'll do better! 💪",
    2: 'Thanks for the feedback 🙏',
    3: 'Glad you liked it! 😊',
    4: 'Awesome! Keep practicing! 🎯',
    5: "You're a Grandmaster fan! ♔👑",
  };

  const submitRating = async () => {
    if (userRating === 0) return;
    try {
      await sb.from('app_ratings').insert([{ username: username || 'anonymous', rating: userRating }]);
    } catch (_) {}
    setRatingSubmitted(true);
    setTimeout(() => { setShowRating(false); setRatingSubmitted(false); setUserRating(0); }, 2000);
  };

  const RatingModal = () => (
    <div style={{ position:'fixed', inset:0, background:'rgba(26,18,9,0.92)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ background:'var(--ivory,#faf6ed)', border:'2px solid var(--gold)', borderRadius:'8px', padding:'32px 24px', maxWidth:'320px', width:'100%', position:'relative', textAlign:'center' }}>
        <button onClick={() => { setShowRating(false); setUserRating(0); }} style={{ position:'absolute', top:'10px', right:'14px', background:'none', border:'none', fontSize:'20px', color:'var(--faint)', cursor:'pointer', lineHeight:1 }}>✕</button>
        <div style={{ fontSize:'36px', color:'var(--gold)', marginBottom:'8px' }}>♔</div>
        <div style={{ fontFamily:'var(--font-cinzel)', fontSize:'20px', color:'var(--rim)', fontWeight:700, marginBottom:'6px' }}>Rate Chess Royal</div>
        <div style={{ fontStyle:'italic', color:'var(--faint)', fontSize:'14px', marginBottom:'20px' }}>How was your experience?</div>
        {ratingSubmitted ? (
          <div style={{ fontFamily:'var(--font-cinzel)', color:'var(--gold)', fontSize:'16px', padding:'20px 0' }}>♔ Thank you for rating!</div>
        ) : (<>
          <div style={{ display:'flex', justifyContent:'center', gap:'8px', marginBottom:'12px' }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setUserRating(n)}
                style={{ background:'none', border:'none', fontSize:'36px', cursor:'pointer', color: n <= userRating ? 'var(--gold)' : '#ccc', transition:'transform 0.15s', padding:'0 2px' }}
                onMouseEnter={e => (e.currentTarget.style.transform='scale(1.2)')}
                onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')}>
                ★
              </button>
            ))}
          </div>
          {userRating > 0 && <div style={{ color:'var(--faint)', fontSize:'13px', marginBottom:'16px', minHeight:'18px' }}>{ratingFeedback[userRating]}</div>}
          <button onClick={submitRating} disabled={userRating === 0}
            style={{ width:'100%', height:'44px', background:'var(--gold)', color:'var(--rim)', border:'none', borderRadius:'4px', fontFamily:'var(--font-cinzel)', fontWeight:700, fontSize:'15px', cursor: userRating > 0 ? 'pointer' : 'not-allowed', opacity: userRating > 0 ? 1 : 0.5, marginBottom:'12px' }}>
            Submit Rating
          </button>
          <button onClick={() => { setShowRating(false); setUserRating(0); }}
            style={{ background:'none', border:'none', color:'var(--faint)', fontSize:'13px', cursor:'pointer' }}>
            Maybe Later
          </button>
        </>)}
      </div>
    </div>
  );

  // ── Developer Footer ──────────────────────────────────
  const DeveloperFooter = () => (
    <div style={{ background:'var(--rim)', borderTop:'1px solid var(--gold)', padding:'12px 16px', textAlign:'center', fontFamily:'"EB Garamond", serif', marginTop:'auto' }}>
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'center', gap:'8px', fontSize:'13px', color:'var(--faint)' }}>
        <span>♟ Developed with ♥ by</span>
        <a href="https://www.instagram.com/__aakashvishwakarma__/" target="_blank" rel="noopener noreferrer"
          style={{ color:'var(--gold)', fontWeight:700, textDecoration:'none' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration='underline'; (e.currentTarget as HTMLAnchorElement).style.color='var(--sq-light,#e8c97a)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.textDecoration='none'; (e.currentTarget as HTMLAnchorElement).style.color='var(--gold)'; }}>
          📸 Aakash Vishwakarma
        </a>
        <span style={{ color:'var(--border-col)' }}>·</span>
        <button onClick={() => { setUserRating(0); setRatingSubmitted(false); setShowRating(true); }}
          style={{ color:'var(--gold)', background:'transparent', border:'1px solid var(--gold)', padding:'3px 10px', borderRadius:'20px', fontSize:'12px', cursor:'pointer', fontFamily:'inherit' }}>
          ★ Rate this App
        </button>
      </div>
    </div>
  );

  // ── Leaderboard Overlay ──────────────────────────────
  const LeaderboardOverlay = () => (
    <div className="leaderboard-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowLeaderboard(false); }}>
      <div className="leaderboard-content">
        <div className="leaderboard-header">
          <div className="leaderboard-title">♛ Leaderboard</div>
          <button className="close-lb" onClick={() => setShowLeaderboard(false)}>Close</button>
        </div>
        <div style={{ display:'flex', gap:'8px', padding:'12px 16px 0', background:'var(--parch)', borderBottom:'1px solid var(--border-col)' }}>
          {(['all','batch'] as const).map(t => (
            <button key={t} onClick={() => { setLbTab(t); fetchLeaderboard(); }}
              style={{ fontFamily:'var(--font-cinzel)', fontSize:'12px', padding:'6px 14px', background: lbTab===t ? 'var(--gold)' : 'transparent', color: lbTab===t ? 'var(--rim)' : 'var(--faint)', border:'1px solid var(--border-col)', borderRadius:'3px', cursor:'pointer' }}>
              {t === 'all' ? '🌍 All Players' : '🎓 My Batch'}
            </button>
          ))}
        </div>
        <div style={{ padding: '8px 0', overflowX: 'auto' }}>
          {loadingLB ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="loader" />
              <p style={{ color: 'var(--faint)', marginTop: '10px', fontStyle: 'italic' }}>Loading scores...</p>
            </div>
          ) : lbError ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--wrong-fg)' }}>
              <p>{lbError}</p>
              <button className="nbtn" style={{ marginTop: '16px' }} onClick={fetchLeaderboard}>Try Again</button>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--faint)', fontStyle: 'italic' }}>
              <p style={{ fontSize: '48px', marginBottom: '12px' }}>♟</p>
              <p>No scores yet. Be the first Grandmaster!</p>
            </div>
          ) : (
            <table className="lb-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Best Score</th>
                  <th>%</th>
                  <th>Rating</th>
                  <th>Attempts</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((row, idx) => (
                  <tr key={idx} className={row.username === username ? 'current-user' : ''}>
                    <td style={{ fontFamily: 'var(--font-cinzel)', fontWeight: 700 }}>
                      {idx === 0 ? '♔' : idx === 1 ? '♕' : idx === 2 ? '♖' : ''} {idx + 1}
                    </td>
                    <td style={{ fontWeight: row.username === username ? 700 : 400 }}>
                      {row.username} {row.username === username ? '← You' : ''}
                    </td>
                    <td style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--gold2)', fontWeight: 700 }}>
                      {row.best_score}/100
                    </td>
                    <td>{row.best_percentage}%</td>
                    <td>{row.rating_icon}</td>
                    <td>{row.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );

  // ── Registration Screen ──────────────────────────────
  if (!username) {
    return (
      <div className="shell">
        <div className="crown-bar" style={{ position: 'relative' }}>
          <button className="lb-btn-header" onClick={openLeaderboard}>♛ Leaderboard</button>
          <span className="crown-pieces">♔ ♕ ♖ ♗ ♘</span>
          <div className="crown-title">Chess Royal · IPDC</div>
          <div className="crown-sub">100 Questions · Multiple Choice</div>
        </div>
        <div className="reg-screen">
          <div className="reg-card">
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>♟</div>
            <div className="reg-title">Enter the Arena</div>
            <p style={{ color: 'var(--faint)', marginBottom: '20px', fontSize: '15px', fontStyle: 'italic' }}>
              Enter your name to track scores & appear on the leaderboard
            </p>
            <input type="text" className="reg-input" placeholder="Your username..." value={regInput}
              onChange={(e) => setRegInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && registerUser()} maxLength={20} autoFocus />
            <button className="reg-btn" onClick={registerUser} disabled={regLoading}>
              {regLoading ? '⏳ Entering...' : '♔ Enter the Board'}
            </button>
          </div>
        </div>
        {showLeaderboard && <LeaderboardOverlay />}
        <DeveloperFooter />
        {showRating && <RatingModal />}
      </div>
    );
  }

  // ── Score Calculations ───────────────────────────────
  const done = chosen.filter(x => x !== -1).length;
  const correct = chosen.reduce((a, v, i) => a + (v === QS[i].a ? 1 : 0), 0);
  const wrong = chosen.reduce((a, v, i) => a + (v !== -1 && v !== -2 && v !== QS[i].a ? 1 : 0), 0);
  const pct = Math.round((done / QS.length) * 100);
  const q = QS[cur];
  const ans = chosen[cur];

  // ── Result Screen ────────────────────────────────────
  if ((mode === 'quiz' || mode === 'timed') && done === QS.length) {
    const r = getRating(correct, QS.length);
    const finalPct = Math.round((correct / QS.length) * 100);
    const wrongList = chosen.reduce((a:number[],v,i)=>v!==QS[i].a?[...a,i]:a,[]);

    if (!scoreSaved) {
      saveScore(correct, QS.length, finalPct, r.title, mode === 'timed' ? totalTime : undefined);
      setScoreSaved(true);
    }

    return (
      <div className="shell">
        <canvas ref={canvasRef} style={{ display:'none' }} />
        {toast && <div style={{ position:'fixed', bottom:'20px', left:'50%', transform:'translateX(-50%)', background:'var(--rim)', color:'var(--gold)', padding:'10px 20px', borderRadius:'6px', fontFamily:'var(--font-cinzel)', fontSize:'13px', zIndex:2000, boxShadow:'0 4px 20px rgba(0,0,0,0.4)' }}>{toast}</div>}
        <div className="crown-bar">
          <span className="crown-pieces">♔ ♕ ♖ ♗ ♘</span>
          <div className="crown-title">Match Complete</div>
          <div className="crown-sub">Well played, {username}!</div>
          <div className="header-btn-row">
            <button className="header-action-btn" onClick={openLeaderboard}>♛ Leaderboard</button>
          </div>
        </div>
        <div className="result-wrap">
          <div className="r-icon">{r.icon}</div>
          <div className="r-title">{r.title}</div>
          <div className="r-sub">{r.desc}</div>
          {xpEarned > 0 && <div style={{ fontFamily:'var(--font-cinzel)', color:'var(--gold)', fontSize:'18px', marginBottom:'12px', animation:'pulse-icon 1s ease-in-out 3' }}>+{xpEarned} XP earned! {getLevel(userXp).icon} {getLevel(userXp).name}</div>}
          {mode === 'timed' && <div style={{ color:'var(--faint)', fontStyle:'italic', marginBottom:'8px' }}>⏱ Time: {Math.floor(totalTime/60)}m {totalTime%60}s · Avg {Math.round(totalTime/QS.length)}s/q</div>}
          <div className="r-grid">
            <div className="r-card"><div className="rv">{correct}</div><div className="rl">Correct</div></div>
            <div className="r-card"><div className="rv">{wrong}</div><div className="rl">Wrong</div></div>
            <div className="r-card"><div className="rv">{finalPct}%</div><div className="rl">Score</div></div>
            <div className="r-card"><div className="rv">{QS.length}</div><div className="rl">Total</div></div>
          </div>
          <div className="rating">{r.icon} &nbsp; {r.title} &nbsp; {r.icon}<small>{r.desc}</small></div>
          <div className="answer-map-label">Answer Map</div>
          <div className="answer-map">
            {chosen.map((v, i) => (<div key={i} className={`amdot ${v === QS[i].a ? 'c' : 'w'}`} title={`Q${i+1}`}>{i+1}</div>))}
          </div>
          <div className="result-btn-stack">
            <button className="play-again" onClick={restart}>♟ &nbsp; Play Again</button>
            <button className="nbtn" onClick={openLeaderboard}>♛ View Leaderboard</button>
            <button className="nbtn" style={{ background: copied ? 'var(--correct-bg)' : undefined, color: copied ? 'var(--correct-fg)' : undefined }} onClick={() => shareResults(correct, r.title)}>
              {copied ? '✓ Copied!' : '📤 Share Results'}
            </button>
            <button className="nbtn btn-whatsapp" onClick={() => shareWhatsApp(correct, finalPct, r.title, r.icon)}>💬 WhatsApp Share</button>
            <button className="nbtn" onClick={() => downloadScoreCard(correct, finalPct, r.title, r.icon)}>🖼 Download Score Card</button>
            {wrongList.length > 0 && <button className="nbtn btn-retry" onClick={startRetry}>♟ Retry Wrong ({wrongList.length})</button>}
            <button className="nbtn" onClick={openStats}>📊 My Stats</button>
          </div>
        </div>
        {showLeaderboard && <LeaderboardOverlay />}
        {showStats && <StatsOverlay />}
        <DeveloperFooter />
        {showRating && <RatingModal />}
      </div>
    );
  }

  // ── Battle Quiz / Waiting / Result Screen ────────────────
  if (battleState === 'in_progress' || battleState === 'waiting_result' || battleState === 'complete') {
    const bq = battleQuestions[battleCur] || battleQuestions[0];
    const bAns = battleChosen[battleCur];
    const myName = username || 'You';
    const oppName = iAmCreator ? (battleData?.challenger_username||'Opponent') : battleData?.creator_username || 'Opponent';

    if (battleState === 'in_progress' && bq) return (
      <div className="shell">
        {toast && <div style={{position:'fixed',bottom:'20px',left:'50%',transform:'translateX(-50%)',background:'var(--rim)',color:'var(--gold)',padding:'10px 20px',borderRadius:'6px',fontFamily:'var(--font-cinzel)',fontSize:'13px',zIndex:2000,boxShadow:'0 4px 20px rgba(0,0,0,0.4)'}}>{toast}</div>}
        <div className="crown-bar">
          <span className="crown-pieces">⚔ ♟ ♔ ♟ ⚔</span>
          <div className="crown-title">Battle Mode</div>
          <div className="crown-sub">Question {battleCur+1} of {battleQuestions.length} · {username} vs {oppName}</div>
        </div>
        <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:'16px',padding:'12px 16px',background:'var(--parch)',borderBottom:'1px solid var(--border-col)'}}>
          <span style={{fontFamily:'var(--font-cinzel)',fontSize:'13px',color:'var(--gold)'}}>{battleCur+1}/{battleQuestions.length}</span>
          <div style={{flex:1,height:'6px',background:'var(--border-col)',borderRadius:'3px'}}>
            <div style={{height:'6px',background:'var(--gold)',borderRadius:'3px',width:`${((battleCur+1)/battleQuestions.length)*100}%`,transition:'width 0.3s'}} />
          </div>
        </div>
        <div className="qbody">
          <div className="qcard">
            <div className="piece-bg">{PIECES[battleCur%12]}</div>
            <div className="q-meta">
              <div className="q-badge">{battleCur+1}</div>
              <div className="q-text">{bq.q}</div>
            </div>
            <div style={{textAlign:'center',margin:'12px 0 4px'}}>
              <svg width="70" height="70" viewBox="0 0 70 70">
                <circle cx="35" cy="35" r="30" fill="none" stroke="var(--parch)" strokeWidth="6"/>
                <circle cx="35" cy="35" r="30" fill="none" stroke={battleTimeLeft<=6?'var(--wrong-fg)':'var(--gold)'} strokeWidth="6"
                  strokeDasharray={`${2*Math.PI*30}`} strokeDashoffset={`${2*Math.PI*30*(1-battleTimeLeft/20)}`}
                  strokeLinecap="round" transform="rotate(-90 35 35)" style={{transition:'stroke-dashoffset 1s linear,stroke 0.3s'}}/>
                <text x="35" y="40" textAnchor="middle" fill={battleTimeLeft<=6?'var(--wrong-fg)':'var(--gold)'} fontFamily="var(--font-cinzel)" fontWeight="700" fontSize="18">{battleTimeLeft}</text>
              </svg>
            </div>
            <div className="opts">
              {bq.o.map((opt,i) => {
                let cl='opt';
                if (bAns!==-1 && bAns!==undefined) { if(i===bq.a) cl+=' correct'; else if(i===bAns) cl+=' wrong'; }
                return (
                  <button key={i} className={cl} disabled={bAns!==-1 && bAns!==undefined}
                    onClick={()=>{ if(bAns===-1||bAns===undefined){ setBattleChosen(prev=>{const n=[...prev];n[battleCur]=i;return n;}); setBattleCur(c=>c+1); } }}>
                    <span className="opt-lbl">{LBL[i]}</span><span>{opt}</span>
                  </button>
                );
              })}
            </div>
            {bAns!==-1 && bAns!==undefined && (
              bAns===bq.a
                ? <div className="chip ok">♔ &nbsp; Correct — well played!</div>
                : <div className="chip err">♟ &nbsp; Incorrect — right answer: {bq.o[bq.a]}</div>
            )}
          </div>
        </div>
        <DeveloperFooter />
        {showRating && <RatingModal />}
      </div>
    );

    if (battleState === 'waiting_result') return (
      <div className="shell">
        <div className="crown-bar"><span className="crown-pieces">⚔ ♟ ♔</span><div className="crown-title">Battle Complete</div><div className="crown-sub">Your score: {myBattleScore}/10</div></div>
        <div style={{textAlign:'center',padding:'60px 24px'}}>
          <div style={{fontSize:'64px',marginBottom:'16px'}}>⏳</div>
          <div style={{fontFamily:'var(--font-cinzel)',fontSize:'20px',color:'var(--gold)',marginBottom:'8px'}}>Waiting for {oppName}...</div>
          <div style={{color:'var(--faint)',fontStyle:'italic',fontSize:'14px'}}>Your score: {myBattleScore}/10 saved. Polling every 3s.</div>
        </div>
        <DeveloperFooter />
        {showRating && <RatingModal />}
      </div>
    );

    if (battleState === 'complete') {
      const myS = myBattleScore;
      const oppS = opponentScore ?? 0;
      const winner = myS > oppS ? 'win' : myS < oppS ? 'loss' : 'draw';
      return (
        <div className="shell">
          <div className="crown-bar"><span className="crown-pieces">⚔ ♟ ♔</span><div className="crown-title">Battle Result</div></div>
          <div style={{padding:'24px',textAlign:'center'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:'16px',alignItems:'center',marginBottom:'24px'}}>
              <div style={{background:'var(--parch)',border:'2px solid var(--gold)',borderRadius:'8px',padding:'20px 12px'}}>
                <div style={{fontFamily:'var(--font-cinzel)',fontSize:'13px',color:'var(--faint)',marginBottom:'4px'}}>YOU</div>
                <div style={{fontFamily:'var(--font-cinzel)',fontSize:'20px',fontWeight:700,color:'var(--gold)'}}>{myName}</div>
                <div style={{fontSize:'36px',fontWeight:700,color:'var(--gold)',margin:'8px 0'}}>{myS}/10</div>
                <div style={{color:'var(--faint)',fontSize:'13px'}}>{Math.round(myS/10*100)}%</div>
              </div>
              <div style={{fontFamily:'var(--font-cinzel)',fontSize:'20px',color:'var(--faint)'}}>vs</div>
              <div style={{background:'var(--parch)',border:'1px solid var(--border-col)',borderRadius:'8px',padding:'20px 12px'}}>
                <div style={{fontFamily:'var(--font-cinzel)',fontSize:'13px',color:'var(--faint)',marginBottom:'4px'}}>OPPONENT</div>
                <div style={{fontFamily:'var(--font-cinzel)',fontSize:'20px',fontWeight:700,color:'var(--ivory)'}}>{oppName}</div>
                <div style={{fontSize:'36px',fontWeight:700,color:'var(--ivory)',margin:'8px 0'}}>{oppS}/10</div>
                <div style={{color:'var(--faint)',fontSize:'13px'}}>{Math.round(oppS/10*100)}%</div>
              </div>
            </div>
            <div style={{fontFamily:'var(--font-cinzel)',fontSize:'28px',marginBottom:'20px',color: winner==='win'?'var(--gold)': winner==='draw'?'var(--faint)':'var(--wrong-fg)'}}>
              {winner==='win'?'🏆 YOU WIN!': winner==='draw'?'🤝 Draw!':'😔 You Lost'}
            </div>
            <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
              <button className="play-again" onClick={()=>{ if(pollRef.current)clearInterval(pollRef.current); setBattleState('idle'); restart(); }}>♟ Play Again</button>
              <button className="nbtn" onClick={()=>{ if(pollRef.current)clearInterval(pollRef.current); setBattleState('idle'); setShowBattle(true); setBattleMsg(''); setBattleCode(''); }}>⚔ New Battle</button>
            </div>
          </div>
          <DeveloperFooter />
          {showRating && <RatingModal />}
        </div>
      );
    }
  }

  // ── Quiz / Study / Timed Screen ──────────────────────
  return (
    <div className="shell">
      <canvas ref={canvasRef} style={{ display:'none' }} />
      {toast && <div style={{ position:'fixed', bottom:'20px', left:'50%', transform:'translateX(-50%)', background:'var(--rim)', color:'var(--gold)', padding:'10px 20px', borderRadius:'6px', fontFamily:'var(--font-cinzel)', fontSize:'13px', zIndex:2000, boxShadow:'0 4px 20px rgba(0,0,0,0.4)' }}>{toast}</div>}
      <div className="crown-bar">
        <span className="crown-pieces">♔ ♕ ♖ ♗ ♘ ♙</span>
        <div className="crown-title">Integrated Personality Development</div>
        <div className="crown-sub">
          {getLevel(userXp).icon} {getLevel(userXp).name} · {userXp} XP &nbsp;·&nbsp; {username} &nbsp;
          <span style={{ cursor:'pointer', textDecoration:'underline' }} onClick={changeUsername}>Change</span>
          &nbsp;·&nbsp; {QS.length} Qs
        </div>
        <div className="header-btn-row">
          <button className="header-action-btn" onClick={openLeaderboard}>♛ Leaderboard</button>
          <button className="header-action-btn" onClick={openStats}>📊 My Stats</button>
          <button className="header-action-btn" onClick={()=>{ if(pollRef.current)clearInterval(pollRef.current); setBattleState('idle'); setBattleCode(''); setBattleMsg(''); setShowBattle(true); }}>⚔ Battle</button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-cell"><div className="stat-val">{cur + 1}</div><div className="stat-lbl">Question</div></div>
        <div className="stat-cell"><div className="stat-val">{correct}</div><div className="stat-lbl">Correct</div></div>
        <div className="stat-cell"><div className="stat-val">{wrong}</div><div className="stat-lbl">Wrong</div></div>
        <div className="stat-cell"><div className="stat-val">{pct}%</div><div className="stat-lbl">Progress</div></div>
      </div>

      <div className="prog-track">
        <div className="prog-rail">
          <div className="prog-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="modes">
        <button className={`mode-btn ${mode === 'quiz' ? 'on' : ''}`} onClick={() => { setMode('quiz'); setChosen(new Array(QS.length).fill(-1)); setScoreSaved(false); setCur(0); }}>♟ Quiz</button>
        <button className={`mode-btn ${mode === 'study' ? 'on' : ''}`} onClick={() => { setMode('study'); setChosen(new Array(QS.length).fill(-1)); setCur(0); }}>♔ Study</button>
        <button className={`mode-btn ${mode === 'timed' ? 'on' : ''}`} onClick={() => { setMode('timed'); setChosen(new Array(QS.length).fill(-1)); setScoreSaved(false); setCur(0); setTotalTime(0); }}>⏱ Timed</button>
      </div>

      <div className="mini-nav">
        {QS.map((_, i) => {
          let cl = 'dot';
          if (i === cur) cl += ' cur';
          else if (chosen[i] === QS[i].a) cl += ' c';
          else if (chosen[i] !== -1) cl += ' w';
          return (
            <div key={i} className={cl} onClick={() => setCur(i)} title={`Question ${i + 1}`}>
              {i + 1}
            </div>
          );
        })}
      </div>

      <div className="qbody">
        <div className="qcard">
          <div className="piece-bg">{PIECES[cur % 12]}</div>
          <div className="q-meta">
            <div className="q-badge">{cur + 1}</div>
            <div className="q-text">{q.q}</div>
          </div>
          {mode === 'timed' && (
            <div style={{ textAlign:'center', margin:'12px 0 4px' }}>
              <svg width="70" height="70" viewBox="0 0 70 70">
                <circle cx="35" cy="35" r="30" fill="none" stroke="var(--parch)" strokeWidth="6"/>
                <circle cx="35" cy="35" r="30" fill="none" stroke={timeLeft <= 10 ? 'var(--wrong-fg)' : 'var(--gold)'} strokeWidth="6"
                  strokeDasharray={`${2*Math.PI*30}`} strokeDashoffset={`${2*Math.PI*30*(1-timeLeft/TIMER_SECS)}`}
                  strokeLinecap="round" transform="rotate(-90 35 35)" style={{ transition:'stroke-dashoffset 1s linear, stroke 0.3s' }}/>
                <text x="35" y="40" textAnchor="middle" fill={timeLeft <= 10 ? 'var(--wrong-fg)' : 'var(--gold)'} fontFamily="var(--font-cinzel)" fontWeight="700" fontSize="18">{timeLeft}</text>
              </svg>
            </div>
          )}
          <div className="opts">
            {q.o.map((opt, i) => {
              let cl = 'opt';
              if (mode === 'study') cl += i === q.a ? ' show-ans' : '';
              else if (ans !== -1) {
                if (i === q.a) cl += ' correct';
                else if (i === ans) cl += ' wrong';
              }
              return (
                <button key={i} className={cl} onClick={() => { pick(i); if (i !== -1) fetchLiveRank(correct + (i === q.a ? 1 : 0)); }} disabled={ans !== -1 || mode === 'study'}>
                  <span className="opt-lbl">{LBL[i]}</span><span>{opt}</span>
                </button>
              );
            })}
          </div>
          {mode === 'study' && <div className="chip hint">♔ &nbsp; Correct answer: {q.o[q.a]}</div>}
          {(mode === 'quiz' || mode === 'timed') && ans !== -1 && (
            ans === q.a
              ? <div className="chip ok">♔ &nbsp; Correct — well played!</div>
              : <div className="chip err">♟ &nbsp; Incorrect — the right move was: {q.o[q.a]}</div>
          )}
          {liveRank && ans !== -1 && <div style={{ marginTop:'8px', fontSize:'13px', fontFamily:'var(--font-cinzel)', color:'var(--gold2)' }}>♛ Current Rank: {liveRank}</div>}
        </div>
      </div>

      <div className="nav-bar">
        <button className="nbtn" onClick={() => setCur(Math.max(0, cur - 1))} disabled={cur === 0}>← Prev</button>
        <div className="q-pos">{cur + 1} / {QS.length}</div>
        {cur < QS.length - 1
          ? <button className="nbtn primary" onClick={() => setCur(cur + 1)}>Next →</button>
          : <button className="nbtn primary" onClick={finish}>Finish ✓</button>
        }
      </div>

      {showLeaderboard && <LeaderboardOverlay />}
      {showStats && <StatsOverlay />}
      {showBattle && <BattleOverlay />}
      <DeveloperFooter />
      {showRating && <RatingModal />}
    </div>
  );
}
