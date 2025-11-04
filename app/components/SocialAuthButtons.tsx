import { Ionicons } from '@expo/vector-icons';
// import * as AppleAuthentication from 'expo-apple-authentication';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

export interface SocialAuthButtonsProps {
  onGoogle: () => void | Promise<void>;
  onApple?: () => void | Promise<void>;
  showDivider?: boolean;
  containerStyle?: ViewStyle;
  text?: string; // i18n override for divider text
}

const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  onGoogle,
  onApple,
  showDivider = true,
  containerStyle,
  text = 'o continuar con',
}) => {
  return (
    <View style={containerStyle}>
      {showDivider && (
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>{text}</Text>
          <View style={styles.divider} />
        </View>
      )}

      <View style={{ gap: 10 }}>
        <TouchableOpacity style={styles.googleButton} onPress={onGoogle}>
          <Ionicons name="logo-google" size={18} color="#032B3C" style={{ marginRight: 8 }} />
          <Text style={styles.googleButtonText}>Continuar con Google</Text>
        </TouchableOpacity>

        {/* Apple Sign-In deshabilitado temporalmente (requiere Apple Developer Program $99/año) */}
        {/* {Platform.OS === 'ios' && !!onApple && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={14}
            style={{ width: '100%', height: 50 }}
            onPress={onApple}
          />
        )} */}
      </View>
    </View>
  );
};

export default SocialAuthButtons;

const styles = StyleSheet.create({
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 16 },
  divider: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { color: '#9CA3AF', fontWeight: '600' },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  googleButtonText: { color: '#032B3C', fontSize: 16, fontWeight: '700' },
});
