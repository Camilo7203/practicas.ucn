import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

interface SaveLoopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; agent: string; objective: string }) => Promise<void>;
  agents: any[];
  editingLoopId: string | null;
}

export const SaveLoopModal: React.FC<SaveLoopModalProps> = ({
  isOpen,
  onClose,
  onSave,
  agents,
  editingLoopId
}) => {
  const [loopName, setLoopName] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedObjective, setSelectedObjective] = useState('engagement');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const objectives = [
    { value: 'engagement', label: 'Engagement - Increase user interaction' },
    { value: 'retention', label: 'Retention - Keep users coming back' },
    { value: 'conversion', label: 'Conversion - Drive sales/signups' },
    { value: 'education', label: 'Education - Onboard and educate users' },
    { value: 'feedback', label: 'Feedback - Collect user feedback' }
  ];

  const handleSave = async () => {
    // Validations
    if (!loopName.trim()) {
      setError('Loop name is required');
      return;
    }

    if (!selectedAgent && !editingLoopId) {
      setError('Please select an agent');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSave({
        name: loopName,
        agent: selectedAgent,
        objective: selectedObjective
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save loop');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {editingLoopId ? 'Update Loop' : 'Save Loop'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Loop Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Loop Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={loopName}
              onChange={(e) => setLoopName(e.target.value)}
              placeholder="Enter a descriptive name for your loop"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>

          {/* Agent Selection */}
          {!editingLoopId && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Select Agent <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              >
                <option value="">Choose an agent...</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.provider})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                The agent determines which channel this loop will use
              </p>
            </div>
          )}

          {/* Objective Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Loop Objective
            </label>
            <select
              value={selectedObjective}
              onChange={(e) => setSelectedObjective(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            >
              {objectives.map((obj) => (
                <option key={obj.value} value={obj.value}>
                  {obj.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              This helps categorize and track your loop's purpose
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* No Agents Warning */}
          {!editingLoopId && agents.length === 0 && (
            <div className="flex items-start space-x-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-500 font-medium">No agents available</p>
                <p className="text-xs text-amber-500/80 mt-1">
                  Please create an agent first before saving a loop
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-foreground"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (!editingLoopId && agents.length === 0)}
            className="flex items-center space-x-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : editingLoopId ? 'Update' : 'Save Loop'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
