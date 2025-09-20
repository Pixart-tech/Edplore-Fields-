import Toast from 'react-native-toast-message';

type ToastType = 'success' | 'error' | 'warning' | 'info';

const showToast = (type: ToastType, title: string, message?: string) => {
  Toast.show({
    type,
    text1: title,
    text2: message,
    position: 'bottom',
    visibilityTime: 4000,
  });
};

export const showSuccessToast = (title: string, message?: string) =>
  showToast('success', title, message);

export const showErrorToast = (title: string, message?: string) =>
  showToast('error', title, message);

export const showWarningToast = (title: string, message?: string) =>
  showToast('warning', title, message);

export const showInfoToast = (title: string, message?: string) =>
  showToast('info', title, message);

export default {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
};
