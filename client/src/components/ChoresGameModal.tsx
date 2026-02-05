import React, { useState, useEffect, useCallback } from 'react';
import { X, Play, Trophy, Clock, Zap, CheckCircle, XCircle } from 'lucide-react';
import { mathGameApi } from '../services/api';
import { MathProblem, MathGameStatus } from '../types';

interface ChoresGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameComplete: () => void;
  gameStatus: MathGameStatus | null;
}

type GameState = 'difficulty' | 'playing' | 'results';
type Difficulty = 'easy' | 'medium' | 'hard';

// Chore metaphor: each correct answer = 1 unit of chore (tied to difficulty)
const CHORE_MAP: Record<Difficulty, { label: string; unit: string; formatScore: (n: number) => string }> = {
  easy: {
    label: 'Dishwasher',
    unit: 'items unpacked',
    formatScore: (n) => `${n} item${n !== 1 ? 's' : ''} unpacked`
  },
  medium: {
    label: 'Dog poo',
    unit: 'poos picked up',
    formatScore: (n) => `${n} poo${n !== 1 ? 's' : ''} picked up`
  },
  hard: {
    label: 'Lawn mower',
    unit: 'meters mowed',
    formatScore: (n) => `${n}m mowed`
  }
};

const ChoresGameModal: React.FC<ChoresGameModalProps> = ({
  isOpen,
  onClose,
  onGameComplete,
  gameStatus
}) => {
  const [gameState, setGameState] = useState<GameState>('difficulty');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [answerSequence, setAnswerSequence] = useState<boolean[]>([]);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [gameResults, setGameResults] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spamMessage, setSpamMessage] = useState<string | null>(null);

  const spamMessages = [
    "Nice try, cheater!",
    "Nope! One answer per question!",
    "Did you really think that would work?",
    "NO! Wait for the next question!",
    "Spam detected!",
    "Slow down there, speedster!",
    "Patience, young grasshopper",
    "BONK! No cheating!",
  ];

  const generateProblem = useCallback((diff: Difficulty): MathProblem => {
    const config = {
      easy: {
        addition: { max: 20, min: 1 },
        subtraction: { max: 20, min: 1 },
        multiplication: { max: 12, min: 1 },
        division: { max: 12, min: 2 }
      },
      medium: {
        addition: { max: 50, min: 1 },
        subtraction: { max: 50, min: 1 },
        multiplication: { max: 15, min: 1 },
        division: { max: 15, min: 2 }
      },
      hard: {
        addition: { max: 100, min: 1 },
        subtraction: { max: 100, min: 1 },
        multiplication: { max: 20, min: 1 },
        division: { max: 20, min: 2 }
      }
    };

    const ranges = config[diff];
    const operations = ['+', '-', '×', '÷'] as const;
    const operation = operations[Math.floor(Math.random() * operations.length)];

    let num1: number, num2: number, answer: number;

    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * (ranges.addition.max - ranges.addition.min + 1)) + ranges.addition.min;
        num2 = Math.floor(Math.random() * (ranges.addition.max - ranges.addition.min + 1)) + ranges.addition.min;
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * (ranges.subtraction.max - ranges.subtraction.min + 1)) + ranges.subtraction.min;
        num2 = Math.floor(Math.random() * (ranges.subtraction.max - ranges.subtraction.min + 1)) + ranges.subtraction.min;
        if (num1 < num2) [num1, num2] = [num2, num1];
        answer = num1 - num2;
        break;
      case '×':
        num1 = Math.floor(Math.random() * (ranges.multiplication.max - ranges.multiplication.min + 1)) + ranges.multiplication.min;
        num2 = Math.floor(Math.random() * (ranges.multiplication.max - ranges.multiplication.min + 1)) + ranges.multiplication.min;
        answer = num1 * num2;
        break;
      case '÷':
        answer = Math.floor(Math.random() * (ranges.division.max - ranges.division.min + 1)) + ranges.division.min;
        num2 = Math.floor(Math.random() * (ranges.division.max - ranges.division.min + 1)) + ranges.division.min;
        num1 = num2 * answer;
        break;
    }

    return {
      num1,
      num2,
      operation,
      answer,
      display: `${num1} ${operation} ${num2} =`
    };
  }, []);

  const startGame = async (diff: Difficulty) => {
    try {
      setDifficulty(diff);
      const response = await mathGameApi.startGame({ difficulty: diff });
      setSessionId(response.data.session.id);
      setGameState('playing');
      setTimeLeft(60);
      setScore(0);
      setAnswerSequence([]);
      setStreak(0);
      setMaxStreak(0);
      setUserAnswer('');
      setCurrentProblem(generateProblem(diff));
    } catch (error) {
      console.error('Failed to start game:', error);
      alert('Failed to start game. Please try again.');
    }
  };

  const handleAnswerSubmit = () => {
    if (showFeedback) {
      const randomMessage = spamMessages[Math.floor(Math.random() * spamMessages.length)];
      setSpamMessage(randomMessage);
      setTimeout(() => setSpamMessage(null), 1500);
      return;
    }

    if (!currentProblem || !userAnswer.trim()) return;

    const userAnswerNum = parseInt(userAnswer);
    const correct = userAnswerNum === currentProblem.answer;

    setIsCorrect(correct);
    setShowFeedback(true);
    setAnswerSequence(prev => [...prev, correct]);

    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak(prev => Math.max(prev, newStreak));
      setScore(prev => prev + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      setUserAnswer('');
      setCurrentProblem(generateProblem(difficulty));
      setIsCorrect(null);
      setShowFeedback(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnswerSubmit();
    }
  };

  const handleNumberInput = (value: string) => {
    if (value === 'backspace') {
      setUserAnswer(prev => prev.slice(0, -1));
    } else if (value === 'clear') {
      setUserAnswer('');
    } else {
      setUserAnswer(prev => prev + value);
    }
  };

  const endGame = useCallback(async () => {
    if (!sessionId) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    setGameState('results');

    try {
      const response = await mathGameApi.submitGame({
        session_id: sessionId,
        score,
        correct_answers: score,
        total_problems: answerSequence.length,
        answer_sequence: answerSequence
      });

      setGameResults({
        score,
        correctAnswers: score,
        totalProblems: answerSequence.length,
        earnings: response.data.earnings,
        isNewHighScore: response.data.isNewHighScore,
        accuracy: answerSequence.length > 0 ? (score / answerSequence.length) * 100 : 0
      });

      onGameComplete();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to submit game results';
      setGameResults({
        score,
        correctAnswers: score,
        totalProblems: answerSequence.length,
        earnings: 0,
        isNewHighScore: false,
        accuracy: answerSequence.length > 0 ? (score / answerSequence.length) * 100 : 0,
        error: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, score, answerSequence, isSubmitting, onGameComplete]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'playing' && timeLeft === 0) {
      endGame();
    }
  }, [gameState, timeLeft, endGame]);

  const resetModal = () => {
    setGameState('difficulty');
    setSessionId(null);
    setTimeLeft(60);
    setScore(0);
    setCurrentProblem(null);
    setUserAnswer('');
    setAnswerSequence([]);
    setStreak(0);
    setMaxStreak(0);
    setIsCorrect(null);
    setShowFeedback(false);
    setGameResults(null);
    setIsSubmitting(false);
    setSpamMessage(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  const choreInfo = CHORE_MAP[difficulty];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Chores Game</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Difficulty Selection */}
          {gameState === 'difficulty' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Choose Difficulty</h3>
                <p className="text-gray-400">Each correct sum = 1 chore done! Earn money for your bank account.</p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    level: 'easy' as Difficulty,
                    label: 'Easy',
                    chore: CHORE_MAP.easy.label,
                    multiplier: '1.0x',
                    range: '1-20, ×÷ up to 12',
                    color: 'bg-green-600'
                  },
                  {
                    level: 'medium' as Difficulty,
                    label: 'Medium',
                    chore: CHORE_MAP.medium.label,
                    multiplier: '1.2x',
                    range: '1-50, ×÷ up to 15',
                    color: 'bg-yellow-600'
                  },
                  {
                    level: 'hard' as Difficulty,
                    label: 'Hard',
                    chore: CHORE_MAP.hard.label,
                    multiplier: '1.5x',
                    range: '1-100, ×÷ up to 20',
                    color: 'bg-red-600'
                  }
                ].map(({ level, label, chore, multiplier, range, color }) => (
                  <button
                    key={level}
                    onClick={() => startGame(level)}
                    className={`w-full p-4 rounded-xl ${color} text-white hover:opacity-90 transition-opacity`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <div className="font-semibold">{label} – {chore}</div>
                        <div className="text-sm opacity-90">Numbers {range}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{multiplier}</div>
                        <div className="text-sm opacity-90">Multiplier</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {gameStatus && (
                <div className="text-center text-sm text-gray-400">
                  {gameStatus.remaining_plays} plays remaining today
                </div>
              )}
            </div>
          )}

          {/* Game Active */}
          {gameState === 'playing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-pink-600 text-white px-4 py-2 rounded-lg font-bold text-lg">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-white">
                    <div className="text-2xl font-bold">{choreInfo.formatScore(score)}</div>
                    <div className="text-sm text-gray-400">{choreInfo.label}</div>
                  </div>
                </div>
                <div className="text-right text-white">
                  <div className="flex items-center space-x-1">
                    <Zap className="h-4 w-4" />
                    <span className="font-bold">{streak}</span>
                  </div>
                  <div className="text-sm text-gray-400">Streak</div>
                </div>
              </div>

              {spamMessage && (
                <div className="bg-red-500 text-white px-4 py-3 rounded-lg text-center font-bold animate-pulse mb-4">
                  {spamMessage}
                </div>
              )}

              <div className="bg-gray-800 rounded-xl p-8 text-center">
                <div className="text-4xl font-bold text-white mb-6">
                  {currentProblem?.display}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="?"
                    disabled={showFeedback}
                    className="w-32 text-3xl font-bold text-center bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-pink-500 disabled:opacity-50"
                    autoFocus
                  />
                  {showFeedback && (
                    <div className="absolute -right-12 top-1/2 transform -translate-y-1/2">
                      {isCorrect ? (
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      ) : (
                        <XCircle className="h-8 w-8 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  ['1', '2', '3'],
                  ['4', '5', '6'],
                  ['7', '8', '9'],
                  ['clear', '0', 'backspace']
                ].map((row, rowIndex) => (
                  <div key={rowIndex} className="contents">
                    {row.map((value) => (
                      <button
                        key={value}
                        onClick={() => handleNumberInput(value)}
                        disabled={showFeedback}
                        className={`py-4 px-6 rounded-lg font-semibold text-white transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                          value === 'clear' || value === 'backspace'
                            ? 'bg-gray-600 hover:bg-gray-500'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        {value === 'backspace' ? '⌫' : value === 'clear' ? 'C' : value}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              <button
                onClick={handleAnswerSubmit}
                disabled={!userAnswer.trim() || showFeedback}
                className="w-full bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Submit Answer
              </button>
            </div>
          )}

          {/* Results */}
          {gameState === 'results' && gameResults && (
            <div className="space-y-6 text-center">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Chore Complete!</h3>
                <p className="text-gray-400">Here&apos;s how you did:</p>
              </div>

              {gameResults.error && (
                <div className="bg-red-600 text-white p-4 rounded-lg">
                  <p className="font-semibold">Error saving results</p>
                  <p className="text-sm mt-1">{gameResults.error}</p>
                  <p className="text-xs mt-2 opacity-75">Your earnings may not have been recorded. Please contact your teacher.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-3xl font-bold text-white">{choreInfo.formatScore(gameResults.score)}</div>
                  <div className="text-sm text-gray-400">{choreInfo.label}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className={`text-3xl font-bold ${gameResults.error ? 'text-gray-500' : 'text-green-500'}`}>
                    R{Number(gameResults.earnings || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400">Earned</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-3xl font-bold text-blue-500">{gameResults.accuracy.toFixed(0)}%</div>
                  <div className="text-sm text-gray-400">Accuracy</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-3xl font-bold text-purple-500">{maxStreak}</div>
                  <div className="text-sm text-gray-400">Best Streak</div>
                </div>
              </div>

              {gameResults.isNewHighScore && !gameResults.error && (
                <div className="bg-yellow-600 text-white p-4 rounded-lg flex items-center justify-center space-x-2">
                  <Trophy className="h-5 w-5" />
                  <span className="font-semibold">New High Score!</span>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (gameStatus && gameStatus.remaining_plays > 0) {
                      resetModal();
                      setGameState('difficulty');
                    } else {
                      handleClose();
                    }
                  }}
                  className="w-full bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
                >
                  {gameStatus && gameStatus.remaining_plays > 0 ? 'Play Again' : 'Close'}
                </button>
                <button
                  onClick={handleClose}
                  className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {isSubmitting && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
              <p className="text-gray-400">Submitting results...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChoresGameModal;
