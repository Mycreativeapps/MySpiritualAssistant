import { Notifier,  NotifierComponents } from 'react-native-notifier';

export const onAlert = (message : string) => {
  Notifier.showNotification({
    title: message,
    Component: NotifierComponents.Alert,
    duration : 2000,
    componentProps: {
      alertType: 'error',
    },
  });
};

export const onWarning = (message : string) => {
  Notifier.showNotification({
    title: message,
    Component: NotifierComponents.Alert,
    duration: 2000,
    componentProps: {
      alertType: 'warn',
    },
  });
};

export const onSuccess = (message: string) => {
  Notifier.showNotification({
    title: message,
    Component: NotifierComponents.Alert,
    duration: 2000,
    componentProps: {
      alertType: 'success',
    },
  });
};
