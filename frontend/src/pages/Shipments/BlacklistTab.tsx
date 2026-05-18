import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { agentsService, type AgentData } from '@/services/agentsService';
import { createBlackList, deleteBlackList, listBlackLists } from '@/services/whatsappTemplates';
import { IBlackList } from '@/interfaces/whatsappTemplates';
import { useTranslation } from 'react-i18next';

const BlacklistTab: React.FC = () => {
  const { t } = useTranslation();
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');

  const [items, setItems] = useState<IBlackList[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [numbersRaw, setNumbersRaw] = useState('');

  const totalNumbers = useMemo(
    () => items.reduce((acc, item) => acc + item.numbers.length, 0),
    [items]
  );

  const loadAgents = async () => {
    setLoadingAgents(true);
    try {
      const response = await agentsService.getAgents();
      const agentList = response.data?.agents || [];
      setAgents(agentList);

      if (!selectedAgentId && agentList.length > 0) {
        const firstAgentId = agentList[0].id || agentList[0]._id;
        setSelectedAgentId(firstAgentId);
      }
    } catch (error) {
      console.error('Error cargando agentes para blacklist:', error);
    } finally {
      setLoadingAgents(false);
    }
  };

  const loadBlacklists = async (agentId: string) => {
    if (!agentId) {
      setItems([]);
      return;
    }

    setLoadingItems(true);
    try {
      const response = await listBlackLists(agentId, true);
      if (response.success && Array.isArray(response.data)) {
        setItems(response.data);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error cargando blacklist:', error);
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    if (selectedAgentId) {
      loadBlacklists(selectedAgentId);
    }
  }, [selectedAgentId]);

  const parseNumbers = (raw: string): string[] => {
    const candidates = raw
      .split(/[\n,;]+/)
      .map((value) => value.trim())
      .filter(Boolean);

    return Array.from(new Set(candidates));
  };

  const handleCreate = async () => {
    if (!selectedAgentId) {
      alert(`⚠️ ${t('shipments.mustSelectAgentFirst')}`);
      return;
    }

    const numbers = parseNumbers(numbersRaw);
    if (!name.trim()) {
      alert(`⚠️ ${t('shipments.blacklistNameRequired')}`);
      return;
    }

    if (numbers.length === 0) {
      alert(`⚠️ ${t('shipments.blacklistNumbersRequired')}`);
      return;
    }

    setSaving(true);
    try {
      const response = await createBlackList({
        name: name.trim(),
        agent_id: selectedAgentId,
        numbers,
        reason: reason.trim(),
        provider: 'whatsapp',
        active: true,
      });

      if (!response.success) {
        throw new Error(response.error || t('shipments.blacklistCreateError'));
      }

      setName('');
      setReason('');
      setNumbersRaw('');
      await loadBlacklists(selectedAgentId);
    } catch (error) {
      alert(`❌ ${error instanceof Error ? error.message : t('shipments.blacklistCreateError')}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (blacklistId: string) => {
    const confirmed = window.confirm(t('shipments.blacklistDeleteConfirm'));
    if (!confirmed) {
      return;
    }

    try {
      const response = await deleteBlackList(blacklistId);
      if (!response.success) {
        throw new Error(response.error || t('shipments.blacklistDeleteError'));
      }
      await loadBlacklists(selectedAgentId);
    } catch (error) {
      alert(`❌ ${error instanceof Error ? error.message : t('shipments.blacklistDeleteError')}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-textPrimary mb-4">{t('shipments.blacklistTitle')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">{t('shipments.selectAgent')}</label>
            <select
              value={selectedAgentId}
              onChange={(event) => setSelectedAgentId(event.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-textPrimary"
              disabled={loadingAgents}
            >
              <option value="">{t('shipments.selectAgentPlaceholder')}</option>
              {agents.map((agent) => {
                const agentId = agent.id || agent._id;
                return (
                  <option key={agentId} value={agentId}>
                    {agent.name}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">{t('shipments.blacklistName')}</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('shipments.blacklistNamePlaceholder')}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-textPrimary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">{t('shipments.blacklistReason')}</label>
            <input
              type="text"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t('shipments.blacklistReasonPlaceholder')}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-textPrimary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">{t('shipments.blacklistNumbers')}</label>
            <textarea
              value={numbersRaw}
              onChange={(event) => setNumbersRaw(event.target.value)}
              placeholder={t('shipments.blacklistNumbersPlaceholder')}
              rows={4}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-textPrimary"
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={saving || !selectedAgentId}
          className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-highlight transition-colors disabled:opacity-50 inline-flex items-center space-x-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span>{t('shipments.blacklistCreate')}</span>
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-textPrimary">{t('shipments.blacklistExisting')}</h3>
          <span className="text-sm text-textMuted">{t('shipments.blacklistTotalNumbers')}: {totalNumbers}</span>
        </div>

        {loadingItems ? (
          <div className="text-textMuted text-sm">{t('shipments.loading')}</div>
        ) : items.length === 0 ? (
          <div className="text-textMuted text-sm">{t('shipments.blacklistEmpty')}</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="border border-border rounded-lg p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-textPrimary">{item.name}</div>
                  {item.reason && <div className="text-sm text-textMuted mt-1">{item.reason}</div>}
                  <div className="text-xs text-textMuted mt-2">
                    {t('shipments.blacklistNumbersCount')}: {item.numbers.length}
                  </div>
                  <div className="text-xs text-textMuted mt-1 break-all">
                    {item.numbers.join(', ')}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600 hover:text-red-700 p-2"
                  title={t('shipments.blacklistDelete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlacklistTab;
