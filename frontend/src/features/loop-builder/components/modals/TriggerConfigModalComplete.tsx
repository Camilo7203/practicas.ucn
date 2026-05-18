import React, { useState } from 'react';
import { X, Clock, MousePointer, Webhook, Monitor, Timer, Tag } from 'lucide-react';

export interface TriggerConfigData {
  name: string;
  type: 'onClick' | 'scheduled' | 'webhook' | 'onArrival' | 'idle' | 'onTag';
  configuration: {
    // onClick: no additional config needed
    // scheduled
    intervalType?: string;
    intervalValue?: number;
    customCron?: string;
    triggerAtHour?: number;
    triggerAtMinute?: number;
    triggerOnWeekDays?: number[];
    triggerOnMonthDays?: number[];
    // webhook
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    // onArrival
    page?: string;
    // idle
    timeout?: number;
    // onTag
    tag?: string;
  };
}

interface TriggerConfigModalProps {
  onClose: () => void;
  onSubmit: (data: TriggerConfigData) => void;
  initialData?: Partial<TriggerConfigData>;
  triggerType: 'onClick' | 'scheduled' | 'webhook' | 'onArrival' | 'idle' | 'onTag';
}

const TriggerConfigModal: React.FC<TriggerConfigModalProps> = ({ 
  onClose, 
  onSubmit, 
  initialData,
  triggerType 
}) => {
  const [form, setForm] = useState<TriggerConfigData>({
    name: initialData?.name || '',
    type: triggerType,
    configuration: initialData?.configuration || {},
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === 'name' || name === 'type') {
      setForm(prev => ({ ...prev, [name]: value }));
    } else {
      const processedValue = type === 'number' ? Number(value) : value;
      setForm(prev => ({
        ...prev,
        configuration: { ...prev.configuration, [name]: processedValue }
      }));
    }
  };

  const handleArrayChange = (name: string, value: number) => {
    setForm(prev => {
      const currentArray = (prev.configuration[name as keyof typeof prev.configuration] as number[]) || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        configuration: { ...prev.configuration, [name]: newArray }
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const getTriggerIcon = () => {
    const icons = {
      onClick: MousePointer,
      scheduled: Clock,
      webhook: Webhook,
      onArrival: Monitor,
      idle: Timer,
      onTag: Tag,
    };
    const Icon = icons[triggerType];
    return <Icon className="w-6 h-6" />;
  };

  const getTriggerTitle = () => {
    const titles = {
      onClick: 'Click Trigger',
      scheduled: 'Scheduled Trigger',
      webhook: 'Webhook Trigger',
      onArrival: 'Page Arrival Trigger',
      idle: 'Idle Trigger',
      onTag: 'Tag Trigger',
    };
    return titles[triggerType];
  };

  const renderTriggerSpecificFields = () => {
    switch (triggerType) {
      case 'onClick':
        return (
          <div className="space-y-4">
            <p className="text-white/70 text-sm">
              Este trigger se activará cuando el usuario haga clic en el elemento configurado.
            </p>
          </div>
        );

      case 'scheduled':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Tipo de Intervalo</label>
              <select
                name="intervalType"
                value={form.configuration.intervalType || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#1a0a2e] border border-[#f490f8]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f490f8]/50"
                required
              >
                <option value="">Seleccionar...</option>
                <option value="ever x seconds">Cada X segundos</option>
                <option value="ever x minutes">Cada X minutos</option>
                <option value="ever x hours">Cada X horas</option>
                <option value="ever x days">Cada X días</option>
                <option value="ever x weeks">Cada X semanas</option>
                <option value="ever x months">Cada X meses</option>
                <option value="custom">Personalizado (cron)</option>
              </select>
            </div>

            {form.configuration.intervalType && form.configuration.intervalType !== 'custom' && (
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Valor del Intervalo</label>
                <input
                  type="number"
                  name="intervalValue"
                  value={form.configuration.intervalValue || 1}
                  onChange={handleChange}
                  min={1}
                  className="w-full px-3 py-2 bg-[#1a0a2e] border border-[#f490f8]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f490f8]/50"
                  required
                />
              </div>
            )}

            {form.configuration.intervalType === 'custom' && (
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Expresión Cron</label>
                <input
                  type="text"
                  name="customCron"
                  value={form.configuration.customCron || ''}
                  onChange={handleChange}
                  placeholder="0 0 * * *"
                  className="w-full px-3 py-2 bg-[#1a0a2e] border border-[#f490f8]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f490f8]/50"
                  required
                />
              </div>
            )}

            {(form.configuration.intervalType === 'ever x hours' || 
              form.configuration.intervalType === 'ever x days' ||
              form.configuration.intervalType === 'ever x weeks' ||
              form.configuration.intervalType === 'ever x months') && (
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label className="block text-white/70 text-sm font-medium mb-2">Hora</label>
                  <input
                    type="number"
                    name="triggerAtHour"
                    value={form.configuration.triggerAtHour || 0}
                    onChange={handleChange}
                    min={0}
                    max={23}
                    className="w-full px-3 py-2 bg-[#1a0a2e] border border-[#f490f8]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f490f8]/50"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-white/70 text-sm font-medium mb-2">Minuto</label>
                  <input
                    type="number"
                    name="triggerAtMinute"
                    value={form.configuration.triggerAtMinute || 0}
                    onChange={handleChange}
                    min={0}
                    max={59}
                    className="w-full px-3 py-2 bg-[#1a0a2e] border border-[#f490f8]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f490f8]/50"
                  />
                </div>
              </div>
            )}

            {form.configuration.intervalType === 'ever x weeks' && (
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Días de la Semana</label>
                <div className="flex flex-wrap gap-2">
                  {[0,1,2,3,4,5,6].map((d) => (
                    <button
                      type="button"
                      key={d}
                      className={`px-3 py-2 rounded-lg border border-[#f490f8]/20 text-white transition-colors ${
                        (form.configuration.triggerOnWeekDays || []).includes(d) 
                          ? 'bg-[#f490f8]/30 border-[#f490f8]/50' 
                          : 'bg-[#1a0a2e] hover:bg-[#f490f8]/10'
                      }`}
                      onClick={() => handleArrayChange('triggerOnWeekDays', d)}
                    >
                      {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {form.configuration.intervalType === 'ever x months' && (
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Días del Mes</label>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <button
                      type="button"
                      key={d}
                      className={`px-2 py-1 rounded border border-[#f490f8]/20 text-white text-xs transition-colors ${
                        (form.configuration.triggerOnMonthDays || []).includes(d)
                          ? 'bg-[#f490f8]/30 border-[#f490f8]/50'
                          : 'bg-[#1a0a2e] hover:bg-[#f490f8]/10'
                      }`}
                      onClick={() => handleArrayChange('triggerOnMonthDays', d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'webhook':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">URL del Webhook</label>
              <input
                type="url"
                name="url"
                value={form.configuration.url || ''}
                onChange={handleChange}
                placeholder="https://ejemplo.com/webhook"
                className="w-full px-3 py-2 bg-[#1a0a2e] border border-[#f490f8]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f490f8]/50"
                required
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Método HTTP</label>
              <select
                name="method"
                value={form.configuration.method || 'POST'}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#1a0a2e] border border-[#f490f8]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f490f8]/50"
                required
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>
        );

      case 'onArrival':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Página</label>
              <input
                type="text"
                name="page"
                value={form.configuration.page || ''}
                onChange={handleChange}
                placeholder="/welcome"
                className="w-full px-3 py-2 bg-[#1a0a2e] border border-[#f490f8]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f490f8]/50"
                required
              />
            </div>
            <p className="text-white/50 text-sm">
              Especifica la ruta de la página donde se activará el trigger (ej: /welcome, /dashboard)
            </p>
          </div>
        );

      case 'idle':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Tiempo de Inactividad (segundos)</label>
              <input
                type="number"
                name="timeout"
                value={form.configuration.timeout || 300}
                onChange={handleChange}
                min={1}
                className="w-full px-3 py-2 bg-[#1a0a2e] border border-[#f490f8]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f490f8]/50"
                required
              />
            </div>
            <p className="text-white/50 text-sm">
              El trigger se activará después de que el usuario esté inactivo por este período de tiempo.
            </p>
          </div>
        );

      case 'onTag':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Etiqueta</label>
              <input
                type="text"
                name="tag"
                value={form.configuration.tag || ''}
                onChange={handleChange}
                placeholder="VIP"
                className="w-full px-3 py-2 bg-[#1a0a2e] border border-[#f490f8]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f490f8]/50"
                required
              />
            </div>
            <p className="text-white/50 text-sm">
              El trigger se activará cuando se asigne esta etiqueta a un usuario.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#340349] border border-[#f490f8]/20 rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="text-[#f490f8]">
              {getTriggerIcon()}
            </div>
            <h2 className="text-xl font-semibold text-white">
              {getTriggerTitle()}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/60 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">Nombre del Trigger</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Mi trigger personalizado"
              className="w-full px-3 py-2 bg-[#1a0a2e] border border-[#f490f8]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#f490f8]/50"
              required
            />
          </div>

          {/* Trigger-specific fields */}
          {renderTriggerSpecificFields()}

          {/* Submit buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#f490f8]/20 text-white/70 rounded-lg hover:bg-[#f490f8]/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-[#f490f8] to-[#a855f7] text-white rounded-lg font-medium hover:from-[#a855f7] hover:to-[#f490f8] transition-all duration-200"
            >
              Configurar Trigger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TriggerConfigModal;
