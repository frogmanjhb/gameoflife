import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { wordleGameApi } from '../services/api';

interface WordleGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameComplete: () => void;
}

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

type FeedbackState = 0 | 1 | 2; // 0 = absent, 1 = wrong place, 2 = correct

const WordleGameModal: React.FC<WordleGameModalProps> = ({
  isOpen,
  onClose,
  onGameComplete
}) => {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentGuess, setCurrentGuess] = useState('');
  const [rows, setRows] = useState<{ word: string; feedback: FeedbackState[] }[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [earnings, setEarnings] = useState(0);
  const [experiencePoints, setExperiencePoints] = useState(0);
  const [newLevel, setNewLevel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);

  const resetModal = useCallback(() => {
    setSessionId(null);
    setCurrentGuess('');
    setRows([]);
    setGameOver(false);
    setWon(false);
    setEarnings(0);
    setExperiencePoints(0);
    setNewLevel(null);
    setError(null);
    setLoading(false);
    setStarting(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetModal();
      return;
    }
    let cancelled = false;
    setStarting(true);
    setError(null);
    wordleGameApi.startGame()
      .then((res) => {
        if (cancelled) return;
        setSessionId(res.data.session_id);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(err.response?.data?.error || 'Failed to start game');
      })
      .finally(() => {
        if (!cancelled) setStarting(false);
      });
    return () => { cancelled = true; };
  }, [isOpen, resetModal]);

  const submitGuess = useCallback(async () => {
    if (!sessionId || currentGuess.length !== WORD_LENGTH || loading || gameOver) return;
    const guess = currentGuess.toLowerCase().trim();
    setLoading(true);
    setError(null);
    try {
      const res = await wordleGameApi.guess(sessionId, guess);
      setRows(prev => [...prev, { word: guess, feedback: res.data.feedback as FeedbackState[] }]);
      setCurrentGuess('');
      if (res.data.game_over) {
        setGameOver(true);
        setWon(res.data.won);
        const completeRes = await wordleGameApi.complete(sessionId);
        setEarnings(completeRes.data.earnings);
        setExperiencePoints(completeRes.data.experience_points);
        setNewLevel(completeRes.data.new_level);
        onGameComplete();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid guess');
    } finally {
      setLoading(false);
    }
  }, [sessionId, currentGuess, loading, gameOver, onGameComplete]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameOver || starting || !sessionId) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        if (currentGuess.length === WORD_LENGTH) submitGuess();
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        setCurrentGuess(prev => prev.slice(0, -1));
        return;
      }
      if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        if (currentGuess.length < WORD_LENGTH) {
          setCurrentGuess(prev => (prev + e.key).toLowerCase().slice(0, WORD_LENGTH));
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, gameOver, starting, sessionId, currentGuess, submitGuess]);

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  const getCellBg = (f: FeedbackState) => {
    if (f === 2) return 'bg-green-600';
    if (f === 1) return 'bg-amber-500';
    return 'bg-gray-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Wordle Chores</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {starting && (
            <div className="text-center py-8 text-gray-400">Starting game...</div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {sessionId && !starting && (
            <>
              <div className="mb-4 p-4 bg-gray-800 rounded-lg text-gray-300 text-sm">
                <p className="font-semibold text-white mb-2">How to play</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Guess the 5-letter word. Type your guess and press <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">Enter</kbd>.</li>
                  <li><span className="inline-block w-3 h-3 rounded bg-green-600 mr-1.5 align-middle" /> Green = correct letter, right spot.</li>
                  <li><span className="inline-block w-3 h-3 rounded bg-amber-500 mr-1.5 align-middle" /> Yellow = letter in the word, wrong spot.</li>
                  <li><span className="inline-block w-3 h-3 rounded bg-gray-600 mr-1.5 align-middle" /> Gray = letter not in the word.</li>
                  <li>You have 6 guesses. Win to earn money (and job XP if you have a job).</li>
                </ul>
              </div>
              <div className="flex flex-col gap-2 mb-6">
                {Array.from({ length: MAX_GUESSES }).map((_, rowIdx) => {
                  const row = rows[rowIdx];
                  const isCurrent = rowIdx === rows.length && !gameOver;
                  const letters = row ? row.word.split('') : (isCurrent ? currentGuess.split('') : []);
                  const feedback = row ? row.feedback : [];
                  return (
                    <div key={rowIdx} className="flex justify-center gap-2">
                      {Array.from({ length: WORD_LENGTH }).map((_, colIdx) => {
                        const letter = letters[colIdx] || '';
                        const fb = feedback[colIdx] ?? null;
                        const bg = fb !== null ? getCellBg(fb) : (isCurrent ? 'bg-gray-700' : 'bg-gray-800');
                        return (
                          <div
                            key={colIdx}
                            className={`w-12 h-12 flex items-center justify-center rounded border-2 border-gray-600 font-bold text-white text-xl ${bg}`}
                          >
                            {letter.toUpperCase()}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {gameOver ? (
                <div className="text-center space-y-3">
                  <p className={`text-xl font-bold ${won ? 'text-green-400' : 'text-gray-400'}`}>
                    {won ? 'You won!' : 'Out of guesses'}
                  </p>
                  {earnings > 0 && (
                    <p className="text-green-400 font-semibold">+R{earnings.toFixed(2)}</p>
                  )}
                  {experiencePoints > 0 && (
                    <p className="text-amber-400">+{experiencePoints} job XP</p>
                  )}
                  {newLevel != null && (
                    <p className="text-amber-400">Level up! New level: {newLevel}</p>
                  )}
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <p className="text-center text-gray-500 text-sm mb-4">
                  Type a 5-letter word and press Enter. {currentGuess.length}/5
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordleGameModal;
