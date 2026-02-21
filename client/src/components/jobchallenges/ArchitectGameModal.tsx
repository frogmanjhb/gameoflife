import React, { useState, useEffect, useCallback } from 'react';
import { X, Play, Trophy, Clock, Target, Zap, CheckCircle, XCircle, Award, Building2 } from 'lucide-react';
import { architectGameApi } from '../../services/api';
import { ArchitectQuestion, ArchitectGameStatus } from '../../types';
import { getArchitectQuestion } from '../../utils/jobchallenges/architectQuestions';

interface ArchitectGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameComplete: () => void;
  gameStatus: ArchitectGameStatus | null;
}

type GameState = 'difficulty' | 'playing' | 'results';
type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme';

const ArchitectGameModal: React.FC<ArchitectGameModalProps> = ({ 
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
  const [currentProblem, setCurrentProblem] = useState<ArchitectQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [answerSequence, setAnswerSequence] = useState<boolean[]>([]);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [gameResults, setGameResults] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spamMessage, setSpamMessage] = useState<string | null>(null);
  const [problemsCompleted, setProblemsCompleted] = useState(0);
  const MAX_PROBLEMS = 5; // 5 design problems per review

  // Funny messages for spam attempts
  const spamMessages = [
    "Nice try, cheater! 🙅",
    "Nope! One answer per question!",
    "Did you really think that would work? 😏",
    "NO! Wait for the next question!",
    "Spam detected! -0 points for effort 😂",
    "Slow down there, speedster!",
    "Patience, young architect 🏗️",
    "Your keyboard is not a design approval machine!",
    "Error 418: I'm a teapot, not a fool ☕",
    "BONK! No cheating! 🔨",
  ];

  // Start game
  const startGame = async (diff: Difficulty) => {
    try {
      setDifficulty(diff);
      const response = await architectGameApi.startGame({ difficulty: diff });
      setSessionId(response.data.session.id);
      setGameState('playing');
      setTimeLeft(60);
      setScore(0);
      setAnswerSequence([]);
      setStreak(0);
      setMaxStreak(0);
      setUserAnswer('');
      setProblemsCompleted(0);
      setCurrentProblem(getArchitectQuestion(diff));
    } catch (error: any) {
      console.error('Failed to start game:', error);
      alert(error.response?.data?.error || 'Failed to start game. Please try again.');
    }
  };

  // Handle answer submission
  const handleAnswerSubmit = () => {
    // Detect and shame spam attempts during feedback delay
    if (showFeedback) {
      const randomMessage = spamMessages[Math.floor(Math.random() * spamMessages.length)];
      setSpamMessage(randomMessage);
      setTimeout(() => setSpamMessage(null), 1500);
      return;
    }
    
    // Prevent submissions without valid data
    if (!currentProblem || !userAnswer.trim()) return;

    const userAnswerNum = parseFloat(userAnswer);
    const correct = Math.abs(userAnswerNum - currentProblem.answer) < 0.01; // Allow small floating point differences
    
    setIsCorrect(correct);
    setShowFeedback(true);
    setAnswerSequence(prev => [...prev, correct]);
    setProblemsCompleted(prev => prev + 1);

    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak(prev => Math.max(prev, newStreak));
      setScore(prev => prev + 1);
    } else {
      setStreak(0);
    }

    // Check if we've completed 5 problems
    if (problemsCompleted + 1 >= MAX_PROBLEMS) {
      // End game after showing feedback
      setTimeout(() => {
        endGame();
      }, 1000);
      return;
    }

    // Clear input and generate new problem after brief delay
    setTimeout(() => {
      setUserAnswer('');
      setCurrentProblem(getArchitectQuestion(difficulty));
      setIsCorrect(null);
      setShowFeedback(false);
    }, 1000);
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

  // End game and submit results
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
    setGameState('results');
    
    try {
      const response = await architectGameApi.submitGame({
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
        experience_points: response.data.experience_points,
        new_level: response.data.new_level,
        isNewHighScore: response.data.isNewHighScore,
        accuracy: answerSequence.length > 0 ? (score / answerSequence.length) * 100 : 0
      });

      onGameComplete();
    } catch (error: any) {
      console.error('Failed to submit game:', error);
      const errorMessage = error.response?.data?.error || 'Failed to submit game results';
      
      setGameResults({
        score,
        correctAnswers: score,
        totalProblems: answerSequence.length,
        earnings: 0,
        experience_points: 0,
        new_level: null,
        isNewHighScore: false,
        accuracy: answerSequence.length > 0 ? (score / answerSequence.length) * 100 : 0,
        error: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, score, answerSequence, isSubmitting, onGameComplete]);

  // Timer effect - end game when time runs out OR when 5 problems completed
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0 && problemsCompleted < MAX_PROBLEMS) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'playing' && (timeLeft === 0 || problemsCompleted >= MAX_PROBLEMS)) {
      endGame();
    }
  }, [gameState, timeLeft, problemsCompleted, endGame]);

  // Reset modal
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
    setProblemsCompleted(0);
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
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 text-white" />
            <h2 className="text-xl font-bold text-white">Design Approval Challenges</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Difficulty Selection */}
        {gameState === 'difficulty' && (
          <div className="p-6 space-y-4">
            <div className="text-center mb-6">
              <p className="text-gray-300 mb-2">Review building designs and solve calculations</p>
              <p className="text-sm text-gray-400">
                {gameStatus?.remaining_plays ?? 0} / {gameStatus?.daily_limit ?? 3} reviews remaining today
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(['easy', 'medium', 'hard', 'extreme'] as Difficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => startGame(diff)}
                  disabled={!gameStatus || (gameStatus.remaining_plays ?? 0) <= 0}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    !gameStatus || (gameStatus.remaining_plays ?? 0) <= 0
                      ? 'border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'border-amber-500 bg-gray-800 text-white hover:bg-amber-600 hover:border-amber-400'
                  }`}
                >
                  <div className="text-lg font-semibold capitalize mb-1">{diff}</div>
                  <div className="text-xs text-gray-400">
                    {diff === 'easy' && 'Room Planning'}
                    {diff === 'medium' && 'Scale & Costing'}
                    {diff === 'hard' && 'Budget Constraints'}
                    {diff === 'extreme' && 'Optimization'}
                  </div>
                  <div className="text-xs mt-1">
                    High: {gameStatus?.high_scores?.[diff] ?? 0}
                  </div>
                </button>
              ))}
            </div>

            {gameStatus && (gameStatus.remaining_plays ?? 0) <= 0 && (
              <div className="text-center text-gray-400 text-sm mt-4">
                No reviews remaining today. Try again tomorrow!
              </div>
            )}
          </div>
        )}

        {/* Playing State */}
        {gameState === 'playing' && (
          <div className="p-6 space-y-4">
            {/* Header Stats */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-amber-400" />
                  <span className="text-lg font-bold">{timeLeft}s</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-400" />
                  <span className="text-lg font-bold">{score}</span>
                </div>
                {streak > 0 && (
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    <span className="text-lg font-bold">{streak}</span>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-400">
                Problem {problemsCompleted + 1} / {MAX_PROBLEMS}
              </div>
            </div>

            {/* Problem Display */}
            {currentProblem && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-white text-lg mb-4 leading-relaxed">
                  {currentProblem.question}
                </div>
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Your answer"
                    className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-amber-500 text-lg"
                    autoFocus
                    disabled={showFeedback}
                  />
                </div>

                {/* Feedback */}
                {showFeedback && (
                  <div className={`p-4 rounded-lg flex items-center space-x-3 ${
                    isCorrect ? 'bg-green-900 border border-green-700' : 'bg-red-900 border border-red-700'
                  }`}>
                    {isCorrect ? (
                      <>
                        <CheckCircle className="h-6 w-6 text-green-400" />
                        <div className="text-green-300">
                          <div className="font-semibold">Correct! ✓</div>
                          {currentProblem.explanation && (
                            <div className="text-sm mt-1">{currentProblem.explanation}</div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-6 w-6 text-red-400" />
                        <div className="text-red-300">
                          <div className="font-semibold">Incorrect</div>
                          <div className="text-sm mt-1">Correct answer: {currentProblem.answer}</div>
                          {currentProblem.explanation && (
                            <div className="text-sm mt-1">{currentProblem.explanation}</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Spam Message */}
                {spamMessage && (
                  <div className="mt-2 text-center text-yellow-400 text-sm animate-pulse">
                    {spamMessage}
                  </div>
                )}

                {/* Submit Button */}
                {!showFeedback && (
                  <button
                    onClick={handleAnswerSubmit}
                    disabled={!userAnswer.trim()}
                    className="w-full mt-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:bg-gray-700 disabled:text-gray-500"
                  >
                    Submit Answer
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Results State */}
        {gameState === 'results' && gameResults && (
          <div className="p-6 space-y-4">
            <div className="text-center">
              <Trophy className="h-16 w-16 text-amber-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Review Complete!</h3>
              {gameResults.error && (
                <div className="bg-red-900 border border-red-700 text-red-300 p-3 rounded-lg mb-4">
                  {gameResults.error}
                </div>
              )}
            </div>

            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-gray-400 text-sm">Score</div>
                  <div className="text-2xl font-bold text-white">{gameResults.score}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400 text-sm">Accuracy</div>
                  <div className="text-2xl font-bold text-white">{Math.round(gameResults.accuracy)}%</div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Experience Points Earned</span>
                  <span className="text-xl font-bold text-blue-400 flex items-center space-x-1">
                    <Award className="h-5 w-5" />
                    <span>+{gameResults.experience_points}</span>
                  </span>
                </div>
                {gameResults.new_level && (
                  <div className="bg-green-900 border border-green-700 p-3 rounded-lg text-center">
                    <div className="text-green-300 font-semibold text-lg">
                      🎉 Level Up! You're now Level {gameResults.new_level}!
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Earnings</span>
                  <span className="text-xl font-bold text-green-400">
                    R{gameResults.earnings.toFixed(2)}
                  </span>
                </div>
                {gameResults.isNewHighScore && (
                  <div className="text-center text-amber-400 font-semibold mt-2">
                    🏆 New High Score!
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchitectGameModal;
