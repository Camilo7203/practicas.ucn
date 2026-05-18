import React, { useState } from 'react';
import { X, MessageSquare } from 'lucide-react';

export interface InfoConfigData {
  name: string;
  description?: string;
  definition_of_done?: string;
  info_text: string;
}

interface InfoConfigModalProps {
  onClose: () => void;
  onSubmit: (data: InfoConfigData) => void;
  initialData?: Partial<InfoConfigData>;
}

const InfoConfigModal: React.FC<InfoConfigModalProps> = ({ 
  onClose, 
  onSubmit, 
  initialData 
}) => {
  const [form, setForm] = useState<InfoConfigData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    definition_of_done: initialData?.definition_of_done || '',
    info_text: initialData?.info_text || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      alert('Name is required');
      return;
    }
    if (!form.info_text.trim()) {
      alert('Information text is required');
      return;
    }
    
    onSubmit(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Info Task Configuration</h3>
              <p className="text-muted-foreground text-sm">Create an informational message for users</p>
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
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Task Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., Welcome Message"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Name for identifying this task in your loop
            </p>
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Brief description of this task..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground resize-none"
            />
          </div>

          {/* Information Text Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Information Text <span className="text-red-500">*</span>
            </label>
            <textarea
              name="info_text"
              value={form.info_text}
              onChange={handleChange}
              placeholder="Enter the information message to display to users..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground resize-none"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              This message will be sent to users when they reach this step
            </p>
          </div>

          {/* Definition of Done Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Definition of Done (Optional)
            </label>
            <input
              type="text"
              name="definition_of_done"
              value={form.definition_of_done}
              onChange={handleChange}
              placeholder="e.g., Message viewed by user"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Criteria for completing this task
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This task displays an informational message to users without requiring a response.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors duration-200"
            >
              Save Info Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InfoConfigModal;
