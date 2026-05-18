import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';

export interface OnArrivalConfigData {
  name: string;
  description?: string;
  checkpoint_name?: string;
  command: string;
  command_type: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex';
}

interface OnArrivalConfigModalProps {
  onClose: () => void;
  onSubmit: (data: OnArrivalConfigData) => void;
  initialData?: Partial<OnArrivalConfigData>;
}

const OnArrivalConfigModal: React.FC<OnArrivalConfigModalProps> = ({ 
  onClose, 
  onSubmit, 
  initialData 
}) => {
  console.log('OnArrivalConfigModal - initialData received:', initialData);
  
  const [form, setForm] = useState<OnArrivalConfigData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    checkpoint_name: initialData?.checkpoint_name || '',
    command: initialData?.command || '',
    command_type: initialData?.command_type || 'contains'
  });

  console.log('OnArrivalConfigModal - form state:', form);

  const commandTypeOptions = [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
    { value: 'regex', label: 'Regular Expression' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
    if (!form.command.trim()) {
      alert('Command is required');
      return;
    }
    
    onSubmit(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={(e) => {
      // Cerrar si se hace click en el backdrop
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">OnArrival Trigger Configuration</h3>
              <p className="text-muted-foreground text-sm">Configure when this trigger activates on user arrival</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs">
              <p><strong>Debug:</strong></p>
              <p>Name: {form.name || '(empty)'}</p>
              <p>Command: {form.command || '(empty)'}</p>
              <p>Command Type: {form.command_type}</p>
            </div>
          )}
          
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Trigger Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., Page Load Event"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Name for identifying this trigger in your loop
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
              placeholder="Describe what event triggers this..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground resize-none"
            />
          </div>

          {/* Checkpoint Name Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Checkpoint Name (Optional)
            </label>
            <input
              type="text"
              name="checkpoint_name"
              value={form.checkpoint_name}
              onChange={handleChange}
              placeholder="e.g., trigger_checkpoint, start_point"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Used to identify this checkpoint in the loop flow
            </p>
          </div>

          {/* Command Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Command/Event <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="command"
              value={form.command}
              onChange={handleChange}
              placeholder="e.g., user_login, page_visit, button_click"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              The event or command to match against
            </p>
          </div>

          {/* Command Type Field */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Match Type <span className="text-red-500">*</span>
            </label>
            <select
              name="command_type"
              value={form.command_type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground"
            >
              {commandTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              How to match the command string
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This trigger activates when a user arrives/joins with the specified command event.
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
              Save Trigger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnArrivalConfigModal;
