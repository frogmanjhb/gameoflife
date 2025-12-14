import React, { useState } from 'react';
import { X, Send, CheckCircle } from 'lucide-react';
import { ApplicationQuestion, QuestionType } from '../types';
import { jobsApi } from '../services/api';

interface JobApplicationFormProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: number;
  jobName: string;
  onSuccess: () => void;
}

// Standard application questions (global for all jobs)
const STANDARD_QUESTIONS: ApplicationQuestion[] = [
  {
    id: 'interest',
    type: 'long_answer',
    label: 'Why are you interested in this position?',
    required: true,
  },
  {
    id: 'experience',
    type: 'long_answer',
    label: 'What relevant experience do you have?',
    required: true,
  },
  {
    id: 'availability',
    type: 'yes_no',
    label: 'Are you available to work during school hours?',
    required: true,
  },
  {
    id: 'skills',
    type: 'short_answer',
    label: 'What skills make you a good fit?',
    required: true,
  },
  {
    id: 'hours',
    type: 'multiple_choice',
    label: 'How many hours per week can you commit?',
    required: true,
    options: ['1-5 hours', '6-10 hours', '11-15 hours', '16+ hours'],
  },
];

const JobApplicationForm: React.FC<JobApplicationFormProps> = ({
  isOpen,
  onClose,
  jobId,
  jobName,
  onSuccess,
}) => {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    STANDARD_QUESTIONS.forEach((question) => {
      if (question.required) {
        const answer = answers[question.id];
        if (!answer || (typeof answer === 'string' && answer.trim() === '')) {
          newErrors[question.id] = 'This field is required';
        } else if (question.type === 'short_answer' && typeof answer === 'string' && answer.length > 200) {
          newErrors[question.id] = 'Answer must be 200 characters or less';
        } else if (question.type === 'long_answer' && typeof answer === 'string' && answer.length > 1000) {
          newErrors[question.id] = 'Answer must be 1000 characters or less';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await jobsApi.applyToJob(jobId, answers);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (error: any) {
      console.error('Failed to submit application:', error);
      alert(error.response?.data?.error || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAnswers({});
    setErrors({});
    setIsSuccess(false);
    onClose();
  };

  const renderQuestion = (question: ApplicationQuestion) => {
    const value = answers[question.id] || '';
    const error = errors[question.id];

    switch (question.type) {
      case 'short_answer':
        return (
          <div>
            <input
              type="text"
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              maxLength={200}
              className={`input-field ${error ? 'border-red-500' : ''}`}
              placeholder="Enter your answer..."
            />
            <div className="flex justify-between mt-1">
              {error && <span className="text-sm text-red-600">{error}</span>}
              <span className="text-xs text-gray-500 ml-auto">
                {typeof value === 'string' ? value.length : 0}/200 characters
              </span>
            </div>
          </div>
        );

      case 'long_answer':
        return (
          <div>
            <textarea
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              maxLength={1000}
              rows={5}
              className={`input-field ${error ? 'border-red-500' : ''}`}
              placeholder="Enter your answer..."
            />
            <div className="flex justify-between mt-1">
              {error && <span className="text-sm text-red-600">{error}</span>}
              <span className="text-xs text-gray-500 ml-auto">
                {typeof value === 'string' ? value.length : 0}/1000 characters
              </span>
            </div>
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label
                key={option}
                className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        );

      case 'yes_no':
        return (
          <div className="space-y-2">
            {['Yes', 'No'].map((option) => (
              <label
                key={option}
                className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-t-2xl sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold">Job Application</h2>
            <p className="text-primary-100 text-sm mt-1">Applying for: {jobName}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white hover:bg-opacity-20 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h3>
              <p className="text-gray-600">
                Your application has been submitted successfully. A teacher will review it soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Please fill out all required fields. Your application will be reviewed by a teacher.
                </p>
              </div>

              {STANDARD_QUESTIONS.map((question) => (
                <div key={question.id}>
                  <label className="label">
                    {question.label}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderQuestion(question)}
                </div>
              ))}

              {/* Submit Button */}
              <div className="flex space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobApplicationForm;

