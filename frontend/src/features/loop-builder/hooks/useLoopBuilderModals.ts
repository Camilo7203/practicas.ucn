import { useState, useCallback } from 'react';
import type { ModalsState } from '../types';

export const useLoopBuilderModals = () => {
  const [modalsState, setModalsState] = useState<ModalsState>({
    showTriggerModal: false,
    showSurveyModal: false,
    showInfoModal: false,
    currentTriggerType: null
  });

  const openTriggerModal = useCallback((triggerType: string) => {
    setModalsState(prev => ({
      ...prev,
      showTriggerModal: true,
      currentTriggerType: triggerType
    }));
  }, []);

  const closeTriggerModal = useCallback(() => {
    setModalsState(prev => ({
      ...prev,
      showTriggerModal: false,
      currentTriggerType: null
    }));
  }, []);

  const openSurveyModal = useCallback(() => {
    setModalsState(prev => ({ ...prev, showSurveyModal: true }));
  }, []);

  const closeSurveyModal = useCallback(() => {
    setModalsState(prev => ({ ...prev, showSurveyModal: false }));
  }, []);

  const openInfoModal = useCallback(() => {
    setModalsState(prev => ({ ...prev, showInfoModal: true }));
  }, []);

  const closeInfoModal = useCallback(() => {
    setModalsState(prev => ({ ...prev, showInfoModal: false }));
  }, []);

  return {
    ...modalsState,
    openTriggerModal,
    closeTriggerModal,
    openSurveyModal,
    closeSurveyModal,
    openInfoModal,
    closeInfoModal
  };
};
