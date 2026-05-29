import React, { createContext, useContext, useState, useCallback } from 'react';
import MessageBox from '../components/MessageBox';

const MessageBoxContext = createContext(null);

export const useMessageBox = () => {
  const context = useContext(MessageBoxContext);
  if (!context) {
    throw new Error('useMessageBox must be used within a MessageBoxProvider');
  }
  return context;
};

export const MessageBoxProvider = ({ children }) => {
  const [modalState, setModalState] = useState(null);

  const showModal = useCallback((options) => {
    return new Promise((resolve) => {
      setModalState({
        ...options,
        resolve: (value) => {
          setModalState(null);
          resolve(value);
        }
      });
    });
  }, []);

  const showAlert = useCallback((message, title = "Information") => {
    return showModal({
      type: 'alert',
      title,
      message,
      buttons: [{ label: 'OK', value: true, variant: 'primary' }]
    });
  }, [showModal]);

  const showConfirm = useCallback((message, title = "Confirmation") => {
    return showModal({
      type: 'confirm',
      title,
      message,
      buttons: [
        { label: 'Annuler', value: false, variant: 'secondary' },
        { label: 'OK', value: true, variant: 'primary' }
      ]
    });
  }, [showModal]);

  const showPrompt = useCallback((message, defaultValue = "", title = "Saisie requise") => {
    return showModal({
      type: 'prompt',
      title,
      message,
      inputs: [{ id: 'promptValue', type: 'text', defaultValue }],
      buttons: [
        { label: 'Annuler', value: null, variant: 'secondary' },
        { label: 'OK', value: 'submit', variant: 'primary' } // Le composant gérera le retour de l'input
      ]
    });
  }, [showModal]);

  const showCustom = useCallback((options) => {
    return showModal(options);
  }, [showModal]);

  return (
    <MessageBoxContext.Provider value={{ showAlert, showConfirm, showPrompt, showCustom }}>
      {children}
      {modalState && (
        <MessageBox 
          {...modalState} 
          onClose={(value) => modalState.resolve(value)} 
        />
      )}
    </MessageBoxContext.Provider>
  );
};
