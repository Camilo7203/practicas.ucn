import React, { useState } from 'react';
import { Send, FileText, Upload, Shield } from 'lucide-react';
import TemplatesTab from './TemplatesTab';
import SendTab from './SendTab';
import BlacklistTab from './BlacklistTab';
import { useTranslation } from '../../hooks/useTranslation';

const Shipments: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'templates' | 'send' | 'blacklist'>('templates');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="bg-accent/10 p-3 rounded-xl">
                <Send className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-textPrimary">{t('shipments.title')}</h1>
                <p className="text-textMuted">{t('shipments.subtitle')}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mt-6">
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'templates'
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-muted text-textSecondary hover:bg-muted/80'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="font-medium">{t('shipments.templatesTab')}</span>
            </button>
            <button
              onClick={() => setActiveTab('send')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'send'
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-muted text-textSecondary hover:bg-muted/80'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span className="font-medium">{t('shipments.sendCampaignTab')}</span>
            </button>
            <button
              onClick={() => setActiveTab('blacklist')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
                activeTab === 'blacklist'
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-muted text-textSecondary hover:bg-muted/80'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span className="font-medium">{t('shipments.blacklistTab')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {activeTab === 'templates' ? <TemplatesTab /> : activeTab === 'send' ? <SendTab /> : <BlacklistTab />}
      </div>
    </div>
  );
};

export default Shipments;
