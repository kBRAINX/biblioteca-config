
import { useNotifications } from '@/contexts/notificationContext';

export function useNotificationHelpers() {
  const { addNotification } = useNotifications();

  const notifySuccess = (title: string, message?: string) => {
    addNotification({
      type: 'success',
      title,
      message,
    });
  };

  const notifyError = (title: string, message?: string) => {
    addNotification({
      type: 'error',
      title,
      message,
      duration: 7000, // Plus long pour les erreurs
    });
  };

  const notifyWarning = (title: string, message?: string) => {
    addNotification({
      type: 'warning',
      title,
      message,
    });
  };

  const notifyInfo = (title: string, message?: string) => {
    addNotification({
      type: 'info',
      title,
      message,
    });
  };

  return {
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
  };
}