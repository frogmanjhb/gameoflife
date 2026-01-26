import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Play, Trophy, Clock, Target, Zap, CheckCircle, XCircle, Shield } from 'lucide-react';
import { mathGameApi } from '../services/api';
import { MathProblem, MathGameStatus, MathGameAnswer } from '../types';

interface MathGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameComplete: () => void;
  gameStatus: MathGameStatus | null;
}

type GameState = 'difficulty' | 'playing' | 'results';
type Difficulty = 'easy' | 'medium' | 'hard';

const MathGameModal: React.FC<MathGameModalProps> = ({ 
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
  const [userAnswer, setUserAnswer] = useState('');
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [gameResults, setGameResults] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spamMessage, setSpamMessage] = useState<string | null>(null);
  
  // SERVER-SIDE SECURITY: Problems are now provided by the server
  const [serverProblems, setServerProblems] = useState<MathProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [submittedAnswers, setSubmittedAnswers] = useState<MathGameAnswer[]>([]);
  
  // Use ref to track answers for the endGame callback
  const submittedAnswersRef = useRef<MathGameAnswer[]>([]);

  // Funny messages for spam attempts
  const spamMessages = [
    "Nice try, cheater! 🙅",
    "Nope! One answer per question!",
    "Did you really think that would work? 😏",
    "NO! Wait for the next question!",
    "Spam detected! -0 points for effort 😂",
    "Slow down there, speedster!",
    "Patience, young grasshopper 🦗",
    "Your keyboard is not a money printer!",
    "Error 418: I'm a teapot, not a fool ☕",
    "BONK! No cheating! 🔨",
  ];

  // Get current problem from server-provided list
  const currentProblem = serverProblems[currentProblemIndex] || null;

  // Start game - now receives server-generated problems
  const startGame = async (diff: Difficulty) => {
    try {
      setDifficulty(diff);
      const response = await mathGameApi.startGame({ difficulty: diff });
      
      // Store session and SERVER-GENERATED problems (without answers!)
      setSessionId(response.data.session.id);
      setServerProblems(response.data.problems);
      setCurrentProblemIndex(0);
      setSubmittedAnswers([]);
      submittedAnswersRef.current = [];
      
      setGameState('playing');
      setTimeLeft(60);
      setScore(0);
      setStreak(0);
      setMaxStreak(0);
      setUserAnswer('');
      
      console.log(`🔒 Started secure game with ${response.data.problems.length} server-generated problems`);
    } catch (error) {
      console.error('Failed to start game:', error);
      alert('Failed to start game. Please try again.');
    }
  };

  // Handle answer submission - now validates with server
  const handleAnswerSubmit = async () => {
    // Detect and shame spam attempts during feedback delay
    if (showFeedback) {
      const randomMessage = spamMessages[Math.floor(Math.random() * spamMessages.length)];
      setSpamMessage(randomMessage);
      setTimeout(() => setSpamMessage(null), 1500);
      return;
    }
    
    // Prevent submissions without valid data
    if (!currentProblem || !userAnswer.trim() || !sessionId) return;

    const userAnswerNum = parseInt(userAnswer);
    
    // Record the answer for final submission
    const newAnswer: MathGameAnswer = {
      problem_index: currentProblemIndex,
      answer: userAnswerNum
    };
    
    // Update both state and ref
    setSubmittedAnswers(prev => {
      const updated = [...prev, newAnswer];
      submittedAnswersRef.current = updated;
      return updated;
    });
    
    setShowFeedback(true);
    
    try {
      // SERVER-SIDE VALIDATION: Send answer to server for verification
      const response = await mathGameApi.submitAnswer({
        session_id: sessionId,
        problem_index: currentProblemIndex,
        answer: userAnswerNum
      });
      
      const correct = response.data.correct;
      setIsCorrect(correct);

      if (correct) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        setMaxStreak(prev => Math.max(prev, newStreak));
        setScore(prev => prev + 1);
      } else {
        setStreak(0);
      }
    } catch (error) {
      console.error('Failed to validate answer:', error);
      // On network error, assume incorrect to prevent cheating
      setIsCorrect(false);
      setStreak(0);
    }

    // Move to next problem after brief delay
    setTimeout(() => {
      setUserAnswer('');
      setCurrentProblemIndex(prev => prev + 1);
      setIsCorrect(null);
      setShowFeedback(false);
    }, 800); // Slightly shorter delay for better UX
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnswerSubmit();
    }
  };

  // Handle number pad input
  const handleNumberInput = (value: string) => {
    if (value === 'backspace') {
      setUserAnswer(prev => prev.slice(0, -1));
    } else if (value === 'clear') {
      setUserAnswer('');
    } else {
      setUserAnswer(prev => prev + value);
    }
  };

  // End game and submit results - MUST be defined before the timer useEffect that uses it
  const endGame = useCallback(async () => {
    if (!sessionId) {
      console.error('No session ID available');
      return;
    }

    // Prevent multiple submissions
    if (isSubmitting) {
      console.log('Already submitting, skipping...');
      return;
    }

    setIsSubmitting(true);
    setGameState('results'); // Immediately show results state to prevent re-triggering
    
    // Use ref to get current answers (state may be stale in callback)
    const currentAnswers = submittedAnswersRef.current;
    
    try {
      console.log('Submitting game for SERVER-SIDE validation:', { 
        sessionId, 
        answersCount: currentAnswers.length 
      });
      
      // SERVER-SIDE VALIDATION: Send all answers for final verification
      const response = await mathGameApi.submitGame({
        session_id: sessionId,
        answers: currentAnswers
      });

      console.log('Game submission successful:', response.data);

      // Use SERVER-VALIDATED score, not client score
      const serverScore = response.data.score;
      
      setGameResults({
        score: serverScore,
        correctAnswers: serverScore,
        totalProblems: currentAnswers.length,
        earnings: response.data.earnings,
        isNewHighScore: response.data.isNewHighScore,
        accuracy: currentAnswers.length > 0 ? (serverScore / currentAnswers.length) * 100 : 0
      });

      onGameComplete();
    } catch (error: any) {
      console.error('Failed to submit game:', error);
      const errorMessage = error.response?.data?.error || 'Failed to submit game results';
      console.error('Error details:', errorMessage);
      
      // Still show results even if submission failed
      setGameResults({
        score: 0,
        correctAnswers: 0,
        totalProblems: currentAnswers.length,
        earnings: 0,
        isNewHighScore: false,
        accuracy: 0,
        error: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, isSubmitting, onGameComplete]);

  // Timer effect - uses endGame which must be defined above
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'playing' && timeLeft === 0) {
      // Game over - call endGame
      console.log('Timer reached 0, ending game...');
      endGame();
    }
  }, [gameState, timeLeft, endGame]);

  // Reset modal
  const resetModal = () => {
    setGameState('difficulty');
    setSessionId(null);
    setTimeLeft(60);
    setScore(0);
    setUserAnswer('');
    setStreak(0);
    setMaxStreak(0);
    setIsCorrect(null);
    setShowFeedback(false);
    setGameResults(null);
    setIsSubmitting(false);
    setSpamMessage(null);
    // Reset server-side problem tracking
    setServerProblems([]);
    setCurrentProblemIndex(0);
    setSubmittedAnswers([]);
    submittedAnswersRef.current = [];
  };

  // Close modal
  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white">Math Game</h2>
            {gameState === 'playing' && (
              <div className="flex items-center text-green-400 text-xs" title="Answers validated by server">
                <Shield className="h-4 w-4 mr-1" />
                <span>Secure</span>
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Difficulty Selection */}
          {gameState === 'difficulty' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Choose Difficulty</h3>
                <p className="text-gray-400">Earn more money with harder problems!</p>
              </div>

              <div className="space-y-4">
                {[
                  { 
                    level: 'easy' as Difficulty, 
                    label: 'Easy', 
                    multiplier: '1.0x', 
                    range: '1-20, ×÷ up to 12',
                    color: 'bg-green-600'
                  },
                  { 
                    level: 'medium' as Difficulty, 
                    label: 'Medium', 
                    multiplier: '1.2x', 
                    range: '1-50, ×÷ up to 15',
                    color: 'bg-yellow-600'
                  },
                  { 
                    level: 'hard' as Difficulty, 
                    label: 'Hard', 
                    multiplier: '1.5x', 
                    range: '1-100, ×÷ up to 20',
                    color: 'bg-red-600'
                  }
                ].map(({ level, label, multiplier, range, color }) => (
                  <button
                    key={level}
                    onClick={() => startGame(level)}
                    className={`w-full p-4 rounded-xl ${color} text-white hover:opacity-90 transition-opacity`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <div className="font-semibold">{label}</div>
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
              {/* Timer and Score */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-pink-600 text-white px-4 py-2 rounded-lg font-bold text-lg">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-white">
                    <div className="text-2xl font-bold">{score}</div>
                    <div className="text-sm text-gray-400">Score</div>
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

              {/* Spam Warning Message */}
              {spamMessage && (
                <div className="bg-red-500 text-white px-4 py-3 rounded-lg text-center font-bold animate-pulse mb-4">
                  {spamMessage}
                </div>
              )}

              {/* Problem */}
              <div className="bg-gray-800 rounded-xl p-8 text-center">
                <div className="text-4xl font-bold text-white mb-6">
                  {currentProblem?.display || (
                    <span className="text-gray-500">Waiting for next problem...</span>
                  )}
                </div>
                
                {/* Input Field */}
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

              {/* Number Pad */}
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

              {/* Submit Button */}
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
                <h3 className="text-2xl font-bold text-white mb-2">Game Complete!</h3>
                <p className="text-gray-400">Here's how you did:</p>
              </div>

              {gameResults.error && (
                <div className="bg-red-600 text-white p-4 rounded-lg">
                  <p className="font-semibold">⚠️ Error saving results</p>
                  <p className="text-sm mt-1">{gameResults.error}</p>
                  <p className="text-xs mt-2 opacity-75">Your earnings may not have been recorded. Please contact your teacher.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-3xl font-bold text-white">{gameResults.score}</div>
                  <div className="text-sm text-gray-400">Score</div>
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

          {/* Loading State */}
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

export default MathGameModal;
