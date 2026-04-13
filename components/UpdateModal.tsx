import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

interface UpdateModalProps {
  isVisible: boolean;
  isDownloading: boolean;
  onUpdate: () => void;
  onClose: () => void;
  updateMessage?: string;
}

export default function UpdateModal({
  isVisible,
  isDownloading,
  onUpdate,
  onClose,
  updateMessage,
}: UpdateModalProps) {
  const scale = useSharedValue(1);

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handleUpdatePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpdate();
  };

  const handleClosePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={StyleSheet.absoluteFill}
        >
          <Pressable style={styles.backdrop} onPress={onClose} />
        </Animated.View>

        {/* Modal Container */}
        <Animated.View
          entering={FadeInDown.springify().damping(15)}
          style={styles.modalContainer}
        >
          <View style={styles.content}>
            {/* Header Icon */}
            <Animated.View 
              entering={FadeInDown.delay(100).duration(500)}
              style={styles.iconContainer}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="sparkles" size={32} color="#007AFF" />
              </View>
            </Animated.View>

            {/* Title */}
            <Animated.Text 
              entering={FadeInDown.delay(200).duration(500)}
              style={styles.title}
            >
              A Fresh Update is Here!
            </Animated.Text>

            {/* Description */}
            <Animated.Text 
              entering={FadeInDown.delay(300).duration(500)}
              style={styles.description}
            >
              {updateMessage ? "A new version is available with the following changes:" : "We've polished things up and added new features to make your experience even better."}
            </Animated.Text>

            {/* Update Message Box */}
            {updateMessage && (
              <Animated.View 
                entering={FadeInDown.delay(350).duration(500)}
                style={styles.messageBox}
              >
                <Text style={styles.messageTitle}>WHAT'S NEW</Text>
                <Text style={styles.messageText}>{updateMessage}</Text>
              </Animated.View>
            )}

            {/* Progress / Info Area */}
            {isDownloading && (
              <Animated.View 
                entering={FadeIn.duration(300)}
                style={styles.downloadingContainer}
              >
                <ActivityIndicator color="#007AFF" size="small" />
                <Text style={styles.downloadingText}>Downloading update...</Text>
              </Animated.View>
            )}

            {/* Action Buttons */}
            <Animated.View 
              entering={FadeInDown.delay(400).duration(500)}
              style={styles.buttonContainer}
            >
              <Pressable
                style={styles.laterButton}
                onPress={handleClosePress}
                disabled={isDownloading}
              >
                <Text style={styles.laterText}>Later</Text>
              </Pressable>

              <Animated.View style={[styles.updateButtonWrapper, buttonAnimatedStyle]}>
                <Pressable
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={handleUpdatePress}
                  disabled={isDownloading}
                  style={({ pressed }) => [
                    styles.updateButton,
                    { opacity: isDownloading ? 0.7 : 1 }
                  ]}
                >
                  <Text style={styles.updateText}>
                    {isDownloading ? 'Applying...' : 'Update Now'}
                  </Text>
                  {!isDownloading && (
                    <Ionicons name="arrow-forward" size={18} color="#fff" style={styles.btnIcon} />
                  )}
                </Pressable>
              </Animated.View>
            </Animated.View>

            <Text style={styles.footerText}>
              The app will restart automatically after update
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 24,
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1F0FF',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1C1E',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#60646C',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  messageBox: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  messageTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
    letterSpacing: 1,
  },
  messageText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '500',
  },
  downloadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    gap: 10,
  },
  downloadingText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  laterButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  laterText: {
    color: '#60646C',
    fontSize: 16,
    fontWeight: '600',
  },
  updateButtonWrapper: {
    flex: 1,
  },
  updateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  updateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  btnIcon: {
    marginLeft: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 24,
    textAlign: 'center',
  },
});