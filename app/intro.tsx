import { useVideoPlayer, VideoView } from 'expo-video';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Spacing, type ThemeColors } from '@/constants/theme';
import { useLanguage } from '@/lib/i18n';
import { useThemedStyles } from '@/lib/theme';

const PLAY_OFFSET_S = 3;
const DISMISS_AFTER_PLAY_MS = 3500;
const MAX_WAIT_MS = 7000;

export default function IntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const styles = useThemedStyles(createStyles);
  const [videoReady, setVideoReady] = useState(false);

  const fade1 = useRef(new Animated.Value(0)).current;
  const fade2 = useRef(new Animated.Value(0)).current;
  const fade3 = useRef(new Animated.Value(0)).current;
  const slide1 = useRef(new Animated.Value(-40)).current;
  const slide2 = useRef(new Animated.Value(-40)).current;
  const slide3 = useRef(new Animated.Value(-40)).current;

  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const played = useRef(false);

  const player = useVideoPlayer(require('@/assets/videos/intro.mp4'), (p) => {
    p.loop = false;
    p.muted = true;
    p.currentTime = PLAY_OFFSET_S;
  });

  const goToLogin = useCallback(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    router.replace('/login');
  }, [router]);

  useEffect(() => {
    const statusSub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') setVideoReady(true);
    });
    const playingSub = player.addListener('playingChange', ({ isPlaying }) => {
      if (isPlaying && !played.current) {
        played.current = true;
        dismissTimer.current = setTimeout(goToLogin, DISMISS_AFTER_PLAY_MS);
      }
    });
    const maxTimer = setTimeout(goToLogin, MAX_WAIT_MS);

    player.play();

    return () => {
      statusSub.remove();
      playingSub.remove();
      clearTimeout(maxTimer);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [player, goToLogin]);

  useEffect(() => {
    if (!videoReady) return;
    const ease = Easing.bezier(0.22, 1, 0.36, 1);
    Animated.stagger(
      150,
      [
        Animated.parallel([
          Animated.timing(fade1, { toValue: 1, duration: 800, easing: ease, useNativeDriver: true }),
          Animated.timing(slide1, { toValue: 0, duration: 800, easing: ease, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(fade2, { toValue: 1, duration: 800, easing: ease, useNativeDriver: true }),
          Animated.timing(slide2, { toValue: 0, duration: 800, easing: ease, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(fade3, { toValue: 1, duration: 800, easing: ease, useNativeDriver: true }),
          Animated.timing(slide3, { toValue: 0, duration: 800, easing: ease, useNativeDriver: true }),
        ]),
      ]
    ).start();
  }, [videoReady, fade1, fade2, fade3, slide1, slide2, slide3]);

  return (
    <View style={styles.root}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
      />
      <View style={styles.dim} pointerEvents="none" />

      {!videoReady && (
        <View style={styles.brandWrap}>
          <Image
            source={require('@/assets/images/goalhub-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      )}

      <View style={[styles.overlay, { top: insets.top + 96 }]} pointerEvents="none">
        <Animated.View style={[styles.line, { opacity: fade1, transform: [{ translateX: slide1 }] }]}>
          <Text style={styles.kicker}>{t('intro.welcomeTo')}</Text>
        </Animated.View>
        <Animated.View style={[styles.line, styles.titleLine, { opacity: fade2, transform: [{ translateX: slide2 }] }]}>
          <Text style={styles.title}>goalhub</Text>
        </Animated.View>
        <Animated.View style={[styles.line, { opacity: fade3, transform: [{ translateX: slide3 }] }]}>
          <Text style={styles.tagline}>{t('intro.tagline')}</Text>
        </Animated.View>
      </View>

      <View style={[styles.bottomRight, { bottom: insets.bottom + 24 }]} pointerEvents="none">
        <Text style={styles.footerText}>{t('intro.footer')}</Text>
      </View>

      <Pressable
        onPress={goToLogin}
        hitSlop={12}
        style={[styles.skip, { top: insets.top + 12 }]}
      >
        <Text style={styles.skipText}>{t('intro.skip')}</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  brandWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 96,
    height: 96,
  },
  overlay: {
    position: 'absolute',
    left: '7%',
    maxWidth: 320,
  },
  line: {
    overflow: 'hidden',
  },
  titleLine: {
    marginTop: Spacing.xs,
  },
  kicker: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontFamily: Fonts.bodyMedium,
  },
  title: {
    color: colors.white,
    fontSize: 46,
    fontFamily: Fonts.heading,
    letterSpacing: -1,
    textTransform: 'lowercase',
  },
  tagline: {
    marginTop: Spacing.md,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.body,
    maxWidth: 260,
  },
  bottomRight: {
    position: 'absolute',
    right: '7%',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: Fonts.bodyMedium,
  },
  skip: {
    position: 'absolute',
    right: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  skipText: {
    color: 'rgba(176, 228, 204, 0.8)',
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: Fonts.bodyMedium,
  },
});
