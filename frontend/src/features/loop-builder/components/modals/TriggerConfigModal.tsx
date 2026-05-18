import React, { useState, useEffect } from 'react';
import { X, Clock, MessageSquare } from 'lucide-react';
import type { TriggerRegisterPayload, CronTriggerConfiguration, KeyWordTriggerConfiguration } from '../../../../interfaces/triggers/triggerInterface';
import { useAuthContext } from '../../../../contexts/AuthContext';

interface TriggerConfigModalProps {
  onClose: () => void;
  onSubmit: (data: TriggerRegisterPayload) => void;
  initialData?: Partial<TriggerRegisterPayload>;
  triggerType: 'cron' | 'keyword';
}

const TriggerConfigModal: React.FC<TriggerConfigModalProps> = ({ 
  onClose, 
  onSubmit, 
  initialData,
  triggerType 
}) => {
  const { user } = useAuthContext();
  
  const [form, setForm] = useState<TriggerRegisterPayload>({
    name: initialData?.name || '',
    type: triggerType,
    configuration: initialData?.configuration || (triggerType === 'cron' 
      ? {
          intervalType: '',
          intervalValue: 1,
          triggerAtHour: 0,
          triggerAtMinute: 0,
          triggerOnWeekDays: [],
          triggerOnMonthDays: []
        } as CronTriggerConfiguration
      : {
          keywords: [],
          softMatch: false
        } as KeyWordTriggerConfiguration
    ),
    organization: user?.organization || ''
  });

  // Update organization when user data changes
  useEffect(() => {
    if (user?.organization) {
      setForm(prev => ({
        ...prev,
        organization: user.organization!
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === 'name' || name === 'type') {
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      // Handle configuration properties
      const processedValue = type === 'number' ? Number(value) : value;
      setForm(prev => ({
        ...prev,
        configuration: {
          ...prev.configuration,
          [name]: processedValue
        }
      }));
    }
  };

  const handleArrayChange = (name: string, value: number) => {
    if (form.type === 'cron' && (name === 'triggerOnWeekDays' || name === 'triggerOnMonthDays')) {
      const config = form.configuration as CronTriggerConfiguration;
      const currentArray = config[name as keyof CronTriggerConfiguration] as number[] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      setForm(prev => ({
        ...prev,
        configuration: {
          ...prev.configuration,
          [name]: newArray
        }
      }));
    }
  };

  const handleKeywordsChange = (keywords: string[]) => {
    if (form.type === 'keyword') {
      setForm(prev => ({
        ...prev,
        configuration: {
          ...prev.configuration,
          keywords
        }
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure organization is always set from user session
    const finalData: TriggerRegisterPayload = {
      ...form,
      organization: user?.organization || form.organization
    };
    
    onSubmit(finalData);
  };

  const getTriggerIcon = () => {
    switch (triggerType) {
      case 'cron': return Clock;
      case 'keyword': return MessageSquare;
      default: return Clock;
    }
  };

  const getTriggerTitle = () => {
    switch (triggerType) {
      case 'cron': return 'Cron Trigger';
      case 'keyword': return 'Keyword Trigger';
      default: return 'Trigger Configuration';
    }
  };

  const TriggerIcon = getTriggerIcon();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <TriggerIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">{getTriggerTitle()}</h3>
              <p className="text-muted-foreground text-sm">Configure your trigger settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Trigger Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Enter trigger name"
              required
            />
          </div>

          {/* Cron Configuration */}
          {triggerType === 'cron' && (
            <>
              <div>
                <label className="block text-foreground text-sm font-medium mb-2">
                  Interval Type
                </label>
                <select
                  name="intervalType"
                  value={(form.configuration as CronTriggerConfiguration).intervalType || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                >
                  <option value="">Select interval type</option>
                  <option value="minute">Every Minute</option>
                  <option value="hour">Every Hour</option>
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                  <option value="custom">Custom Cron</option>
                </select>
              </div>

              {(form.configuration as CronTriggerConfiguration).intervalType === 'custom' && (
                <div>
                  <label className="block text-foreground text-sm font-medium mb-2">
                    Custom Cron Expression
                  </label>
                  <input
                    type="text"
                    name="customCron"
                    value={(form.configuration as CronTriggerConfiguration).customCron || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="* * * * *"
                  />
                  <p className="text-muted-foreground text-xs mt-1">
                    Format: minute hour day month day-of-week
                  </p>
                </div>
              )}

              {(form.configuration as CronTriggerConfiguration).intervalType && (form.configuration as CronTriggerConfiguration).intervalType !== 'custom' && (
                <div>
                  <label className="block text-foreground text-sm font-medium mb-2">
                    Interval Value
                  </label>
                  <input
                    type="number"
                    name="intervalValue"
                    value={(form.configuration as CronTriggerConfiguration).intervalValue || 1}
                    onChange={handleChange}
                    min={1}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-foreground text-sm font-medium mb-2">
                    Trigger Hour (24h format)
                  </label>
                  <input
                    type="number"
                    name="triggerAtHour"
                    value={(form.configuration as CronTriggerConfiguration).triggerAtHour || 0}
                    onChange={handleChange}
                    min={0}
                    max={23}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-foreground text-sm font-medium mb-2">
                    Trigger Minute
                  </label>
                  <input
                    type="number"
                    name="triggerAtMinute"
                    value={(form.configuration as CronTriggerConfiguration).triggerAtMinute || 0}
                    onChange={handleChange}
                    min={0}
                    max={59}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-foreground text-sm font-medium mb-2">
                  Trigger on Week Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <button
                      type="button"
                      key={index}
                      className={`px-3 py-1 rounded-lg text-sm border transition-colors ${
                        ((form.configuration as CronTriggerConfiguration).triggerOnWeekDays || []).includes(index)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-background text-foreground border-border hover:bg-muted'
                      }`}
                      onClick={() => handleArrayChange('triggerOnWeekDays', index)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-foreground text-sm font-medium mb-2">
                  Trigger on Month Days
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <button
                      type="button"
                      key={day}
                      className={`px-2 py-1 rounded text-xs border transition-colors ${
                        ((form.configuration as CronTriggerConfiguration).triggerOnMonthDays || []).includes(day)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-background text-foreground border-border hover:bg-muted'
                      }`}
                      onClick={() => handleArrayChange('triggerOnMonthDays', day)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Keyword Configuration */}
          {triggerType === 'keyword' && (
            <>
              <div>
                <label className="block text-foreground text-sm font-medium mb-2">
                  Keywords
                </label>
                <input
                  type="text"
                  name="keywords"
                  value={(form.configuration as KeyWordTriggerConfiguration).keywords?.join(', ') || ''}
                  onChange={(e) => {
                    const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k !== '');
                    handleKeywordsChange(keywords);
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Enter keywords separated by commas"
                  required
                />
                <p className="text-muted-foreground text-xs mt-1">
                  Separate multiple keywords with commas
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="softMatch"
                  checked={(form.configuration as KeyWordTriggerConfiguration).softMatch || false}
                  onChange={(e) => {
                    setForm(prev => ({
                      ...prev,
                      configuration: {
                        ...prev.configuration,
                        softMatch: e.target.checked
                      }
                    }));
                  }}
                  className="rounded border-border focus:ring-primary/50"
                />
                <label className="text-foreground text-sm">
                  Soft Match (partial matches allowed)
                </label>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-background border border-border text-foreground rounded-lg hover:bg-muted transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-200"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TriggerConfigModal;
