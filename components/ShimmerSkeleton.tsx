import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export default function ShimmerSkeleton({
  width = '100%',
  height = 16,
  radius = 8,
  style,
}: Props) {
  const translateX = useSharedValue(-1);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(translateX.value, [-1, 1], [-200, 400]),
      },
      { rotate: '20deg' }, // Slight tilt for a nicer shimmer look
    ],
  }));

  return (
    <View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius: radius },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmerBox, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: 'rgba(128,128,128,0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  shimmerBox: {
    position: 'absolute',
    top: -50,
    bottom: -50,
    width: '40%',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
});
