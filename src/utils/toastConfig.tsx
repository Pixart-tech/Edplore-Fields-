import React from 'react';
import { BaseToast, ErrorToast, BaseToastProps } from 'react-native-toast-message';

const successColor = '#2E7D32';
const errorColor = '#C62828';
const warningColor = '#ED6C02';
const infoColor = '#1565C0';

const toastTextStyles = {
  text1Style: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  text2Style: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
};

const createBaseToast = (
  props: BaseToastProps,
  backgroundColor: string,
  textColor: string,
) => (
  <BaseToast
    {...props}
    style={{
      borderLeftColor: backgroundColor,
      borderRadius: 12,
      borderLeftWidth: 6,
      backgroundColor: '#fff',
      shadowColor: 'rgba(0, 0, 0, 0.15)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    }}
    contentContainerStyle={{ paddingHorizontal: 16 }}
    text1Style={{ ...toastTextStyles.text1Style, color: textColor }}
    text2Style={{ ...toastTextStyles.text2Style, color: '#616161' }}
  />
);

const toastConfig = {
  success: (props: BaseToastProps) => createBaseToast(props, successColor, successColor),
  error: (props: BaseToastProps) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: errorColor,
        borderRadius: 12,
        borderLeftWidth: 6,
        backgroundColor: '#fff',
        shadowColor: 'rgba(0, 0, 0, 0.15)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      }}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      text1Style={{ ...toastTextStyles.text1Style, color: errorColor }}
      text2Style={{ ...toastTextStyles.text2Style, color: '#616161' }}
    />
  ),
  warning: (props: BaseToastProps) => createBaseToast(props, warningColor, warningColor),
  info: (props: BaseToastProps) => createBaseToast(props, infoColor, infoColor),
};

export default toastConfig;
