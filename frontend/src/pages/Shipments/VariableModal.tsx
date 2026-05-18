import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (variableName: string) => void;
}

const VariableModal: React.FC<VariableModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const [variableName, setVariableName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (variableName.trim()) {
      onConfirm(variableName.trim());
      setVariableName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-textPrimary">{t('shipments.addVariable')}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-textMuted" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              {t('shipments.variableNameLabel')}
            </label>
            <input
              type="text"
              value={variableName}
              onChange={(e) => setVariableName(e.target.value)}
              placeholder={t('shipments.variableNamePlaceholder')}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 bg-background text-textPrimary"
              autoFocus
            />
            <p className="text-xs text-textMuted mt-2">
              {t('shipments.variableNameHint')}
            </p>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg border border-border">
            <p className="text-xs text-textSecondary">
              {t('shipments.variableExample', { variable: `{{nombre}}` })}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              type="submit"
              disabled={!variableName.trim()}
              className="flex-1 bg-accent text-white px-4 py-2 rounded-lg hover:bg-highlight transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {t('shipments.insertVariableButton')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg text-textSecondary hover:bg-muted transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VariableModal;
