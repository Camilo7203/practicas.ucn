import React, { useState } from 'react';
import { X, BarChart3, Plus, Trash2 } from 'lucide-react';

export interface PossibleAnswer {
  text: string;
  type: 'single_choice' | 'multiple_choice' | 'checkbox' | 'radiobutton' | 'chipSelect';
  isRight?: boolean;
}

export interface Question {
  question: string;
  type: 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'checkbox' | 'radiobutton' | 'chipSelect' | 'number' | 'boolean' | 'date' | 'time' | 'datetime' | 'email' | 'phone' | 'url' | 'image' | 'audio' | 'video' | 'document';
  required: boolean;
  possible_answers?: PossibleAnswer[];
  related_field?: string;
}

export interface SurveyConfigData {
  name: string;
  description?: string;
  checkpoint_name?: string;
  definition_of_done?: string;
  questions: Question[];
}

interface SurveyConfigModalProps {
  onClose: () => void;
  onSubmit: (data: SurveyConfigData) => void;
  initialData?: Partial<SurveyConfigData>;
}

const QUESTION_TYPES = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radiobutton', label: 'Radio Button' },
  { value: 'chipSelect', label: 'Chip Select' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'url', label: 'URL' },
  { value: 'image', label: 'Image' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
  { value: 'document', label: 'Document' }
];

const CHOICE_TYPES = ['single_choice', 'multiple_choice', 'checkbox', 'radiobutton', 'chipSelect'];

const SurveyConfigModal: React.FC<SurveyConfigModalProps> = ({ 
  onClose, 
  onSubmit, 
  initialData 
}) => {
  const [form, setForm] = useState<SurveyConfigData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    checkpoint_name: initialData?.checkpoint_name || '',
    definition_of_done: initialData?.definition_of_done || '',
    questions: initialData?.questions || []
  });

  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addQuestion = () => {
    setForm(prev => ({
      ...prev,
      questions: [...prev.questions, {
        question: '',
        type: 'short_text',
        required: true,
        possible_answers: []
      }]
    }));
  };

  const removeQuestion = (index: number) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const addPossibleAnswer = (questionIndex: number) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? {
              ...q,
              possible_answers: [...(q.possible_answers || []), {
                text: '',
                type: q.type as 'single_choice' | 'multiple_choice' | 'checkbox' | 'radiobutton' | 'chipSelect',
                isRight: false
              }]
            }
          : q
      )
    }));
  };

  const removePossibleAnswer = (questionIndex: number, answerIndex: number) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? {
              ...q,
              possible_answers: (q.possible_answers || []).filter((_, j) => j !== answerIndex)
            }
          : q
      )
    }));
  };

  const updatePossibleAnswer = (questionIndex: number, answerIndex: number, field: keyof PossibleAnswer, value: any) => {
    setForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? {
              ...q,
              possible_answers: (q.possible_answers || []).map((a, j) =>
                j === answerIndex ? { ...a, [field]: value } : a
              )
            }
          : q
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      alert('Survey name is required');
      return;
    }
    
    if (form.questions.length === 0) {
      alert('At least one question is required');
      return;
    }

    for (let i = 0; i < form.questions.length; i++) {
      if (!form.questions[i].question.trim()) {
        alert(`Question ${i + 1} text is required`);
        return;
      }

      if (CHOICE_TYPES.includes(form.questions[i].type as string)) {
        if (!form.questions[i].possible_answers || form.questions[i].possible_answers!.length === 0) {
          alert(`Question ${i + 1} requires at least one answer option`);
          return;
        }
      }
    }

    onSubmit(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Survey Configuration</h3>
              <p className="text-muted-foreground text-sm">Create survey with questions and answers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Survey Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleBasicChange}
                placeholder="e.g., Customer Feedback Survey"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleBasicChange}
                placeholder="Describe the purpose of this survey..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Definition of Done (Optional)
              </label>
              <input
                type="text"
                name="definition_of_done"
                value={form.definition_of_done}
                onChange={handleBasicChange}
                placeholder="e.g., Survey completed by user"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-foreground">Questions</h4>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="space-y-6">
              {form.questions.map((question, qIndex) => (
                <div key={qIndex} className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <div className="flex items-start justify-between">
                    <h5 className="text-sm font-semibold text-foreground">Question {qIndex + 1}</h5>
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Question Text */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Question Text <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={question.question}
                      onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                      placeholder="Enter question..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground resize-none"
                      required
                    />
                  </div>

                  {/* Question Type and Required */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Question Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={question.type}
                        onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground"
                      >
                        {QUESTION_TYPES.map(qt => (
                          <option key={qt.value} value={qt.value}>{qt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) => updateQuestion(qIndex, 'required', e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-xs font-medium text-gray-600">Required</span>
                      </label>
                    </div>
                  </div>

                  {/* Related Field */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Related Field (Optional)
                    </label>
                    <input
                      type="text"
                      value={question.related_field || ''}
                      onChange={(e) => updateQuestion(qIndex, 'related_field', e.target.value)}
                      placeholder="e.g., user_email"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground text-sm"
                    />
                  </div>

                  {/* Possible Answers (for choice questions) */}
                  {CHOICE_TYPES.includes(question.type as string) && (
                    <div className="pt-4 border-t border-gray-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-medium text-gray-600">
                          Answer Options <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => addPossibleAnswer(qIndex)}
                          className="text-xs text-blue-500 hover:text-blue-600"
                        >
                          + Add Option
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(question.possible_answers || []).map((answer, aIndex) => (
                          <div key={aIndex} className="flex items-end gap-2 bg-gray-50 p-3 rounded">
                            <div className="flex-1">
                              <input
                                type="text"
                                value={answer.text}
                                onChange={(e) => updatePossibleAnswer(qIndex, aIndex, 'text', e.target.value)}
                                placeholder="Answer option"
                                className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                required
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removePossibleAnswer(qIndex, aIndex)}
                              className="p-1 text-red-500 hover:bg-red-100 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {form.questions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No questions yet. Click "Add Question" to get started.</p>
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Save Survey
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurveyConfigModal;
