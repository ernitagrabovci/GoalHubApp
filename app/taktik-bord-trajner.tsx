import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import type { ComponentType, Ref } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView, {
  type WebViewMessageEvent,
  type WebViewNavigation,
  type WebViewProps,
} from 'react-native-webview';

import { getDrillWebUrl } from '@/lib/api/drills';
import { ApiError } from '@/lib/api/errors';
import { useSession } from '@/lib/session';

// react-native-webview 14 declares `Component<WebViewProps & P>` with
// `P = undefined`, which collapses the props to `never`; widen it back.
const BoardWebView = WebView as unknown as ComponentType<
  WebViewProps & { ref?: Ref<WebView> }
>;

// The board editor exposes `window.goalhubBoard.back()`; older deployed
// editors only have the `#btn-back` anchor. Try the command channel first and
// keep the anchor click as the fallback.
const BACK_SCRIPT = `(function(){
  if (window.goalhubBoard && typeof window.goalhubBoard.back === 'function') {
    window.goalhubBoard.back();
  } else {
    var b = document.getElementById('btn-back');
    if (b) { b.click(); }
    else { window.ReactNativeWebView.postMessage('close'); }
  }
})();
true;`;

// ── WebView ↔ React Native protocol ─────────────────────────────────────────
// The editor posts strict JSON; anything that does not match is ignored, so a
// stray message can never trigger navigation or overwrite an error screen.
type BoardMessage =
  | { type: 'board:ready' }
  | { type: 'board:close' }
  | { type: 'board:dirty'; dirty: boolean }
  | { type: 'board:saved' }
  | { type: 'board:error'; message: string };

function parseBoardMessage(data: string): BoardMessage | null {
  let raw: unknown;
  try {
    raw = JSON.parse(data);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object') return null;
  const { type } = raw as { type?: unknown };
  if (typeof type !== 'string') return null;

  switch (type) {
    case 'board:ready':
      return { type };
    case 'board:close':
      return { type };
    case 'board:saved':
      return { type };
    case 'board:dirty': {
      const { dirty } = raw as { dirty?: unknown };
      return typeof dirty === 'boolean' ? { type, dirty } : null;
    }
    case 'board:error': {
      const { message } = raw as { message?: unknown };
      return typeof message === 'string' && message.length
        ? { type, message }
        : null;
    }
    default:
      return null;
  }
}

/**
 * Tavola Taktike — the web app's own Fabric editor inside a WebView, in create
 * mode (`/taktik-bord-trajner`) or opened on a drill (`?id=`). A signed URL
 * from the API signs the trainer in, so the board stays the single source of
 * truth used by the web app. The screen is locked to landscape while open.
 */
export default function TacticalBoardScreen() {
  const router = useRouter();
  const { token, signOut, status } = useSession();
  const params = useLocalSearchParams<{ id?: string }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const drillId = rawId && Number.isFinite(Number(rawId)) ? Number(rawId) : null;

  const webRef = useRef<WebView>(null);
  const closingRef = useRef(false);
  const dirtyRef = useRef(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [boardReady, setBoardReady] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const leave = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (router.canGoBack()) router.back();
    else router.replace('/ushtrimet-trajner');
  }, [router]);

  // Landscape only while the board is open. `app.json` is "default" so this
  // lock is permitted; the root layout pins portrait and we restore it here.
  useEffect(() => {
    let cancelled = false;
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE,
    ).catch(() => {
      // The native view may not be attached yet on the first frame.
      if (cancelled) return;
      setTimeout(() => {
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE,
        ).catch(() => {});
      }, 250);
    });

    return () => {
      cancelled = true;
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      ).catch(() => {});
    };
  }, []);

  // The web session is minted with the mobile bearer token, so a signed-out
  // session can never open the board — send it back to login instead of
  // spinning on "Po hapet tavola…" forever.
  useEffect(() => {
    if (status === 'signedOut') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    getDrillWebUrl(token, drillId, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) setUrl(res.url);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        if (e instanceof ApiError && (e.status === 404 || e.status === 405)) {
          setError(
            'Serveri nuk e mbështet ende hapjen e tavolinës në web. Përditëso serverin dhe provo përsëri.',
          );
          return;
        }
        setError(
          e instanceof ApiError && e.status !== 0 && e.message
            ? e.message
            : 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.',
        );
      });

    return () => controller.abort();
  }, [token, drillId, attempt, signOut, router]);

  // Fallback if the editor's ready event never arrives (old deployed editor or
  // a script error): show the board anyway instead of leaving the overlay up.
  useEffect(() => {
    if (!url) return;
    const timer = setTimeout(() => setBoardReady(true), 8000);
    return () => clearTimeout(timer);
  }, [url, attempt]);

  // Hardware back runs the editor's own back button, so its unsaved-changes
  // guard stays in charge; if the page has no such button we close the screen.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      webRef.current?.injectJavaScript(BACK_SCRIPT);
      return true;
    });
    return () => sub.remove();
  }, []);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const data = event.nativeEvent.data;
      // Legacy plain-text close from the pre-bridge editor.
      if (data === 'close') {
        leave();
        return;
      }
      const msg = parseBoardMessage(data);
      if (!msg) return;

      switch (msg.type) {
        case 'board:ready':
          setBoardReady(true);
          setNotice(null);
          break;
        case 'board:close':
          leave();
          break;
        case 'board:dirty':
          dirtyRef.current = msg.dirty;
          break;
        case 'board:saved':
          dirtyRef.current = false;
          break;
        case 'board:error':
          // Non-destructive banner: replacing the WebView would throw away the
          // drill the trainer is editing.
          setNotice(msg.message);
          break;
      }
    },
    [leave],
  );

  // Leaving the editor with the web ← lands on the drills list — the mobile
  // list should come back into view (and refresh) instead of showing that page.
  const handleNavigation = useCallback(
    (state: WebViewNavigation) => {
      const path = state.url
        .split('#')[0]
        .split('?')[0]
        .replace(/^https?:\/\/[^/]+/, '')
        .replace(/\/+$/, '');
      if (path === '/trainer/drills') leave();
    },
    [leave],
  );

  const retry = useCallback(() => {
    setUrl(null);
    setError(null);
    setNotice(null);
    setBoardReady(false);
    setAttempt((n) => n + 1);
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar hidden={!!url && !error} style="dark" />

      {error ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="web-off" size={44} color="#4A6078" />
          <Text style={styles.title}>Tavola nuk u hap</Text>
          <Text style={styles.body}>{error}</Text>
          <View style={styles.actions}>
            <Pressable
              onPress={leave}
              accessibilityRole="button"
              style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryText}>Kthehu</Text>
            </Pressable>
            <Pressable
              onPress={retry}
              accessibilityRole="button"
              style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
            >
              <Text style={styles.primaryText}>Provo përsëri</Text>
            </Pressable>
          </View>
        </View>
      ) : url ? (
        <View style={styles.webArea}>
          <BoardWebView
            ref={webRef}
            source={{ uri: url }}
            style={styles.web}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            thirdPartyCookiesEnabled
            sharedCookiesEnabled
            allowsBackForwardNavigationGestures={false}
            onNavigationStateChange={handleNavigation}
            onMessage={handleMessage}
            onError={() =>
              setError('Nuk mund të ngarkohet tavola. Kontrollo lidhjen me internetin.')
            }
            startInLoadingState
            // Fabric drives every player/ball drag through touch events; page
            // zoom, overscroll and pull-to-refresh would steal those gestures.
            bounces={false}
            overScrollMode="never"
            nestedScrollEnabled={false}
            setBuiltInZoomControls={false}
            setDisplayZoomControls={false}
            scalesPageToFit={false}
            textZoom={100}
            renderLoading={() => (
              <View style={styles.center}>
                <ActivityIndicator color="#12664D" />
                <Text style={styles.loading}>Po hapet tavola…</Text>
              </View>
            )}
          />

          {!boardReady ? (
            <View style={styles.overlay} pointerEvents="none">
              <ActivityIndicator color="#12664D" />
              <Text style={styles.loading}>Po përgatitet tavola…</Text>
            </View>
          ) : null}

          {notice ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>{notice}</Text>
              <Pressable
                onPress={() => setNotice(null)}
                accessibilityRole="button"
                accessibilityLabel="Mbylle njoftimin"
                hitSlop={6}
                style={({ pressed }) => [styles.noticeClose, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="close" size={16} color="#16261F" />
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.center}>
          <ActivityIndicator color="#12664D" />
          <Text style={styles.loading}>Po hapet tavola…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // Matches the editor's dark chrome, so the safe-area strips in landscape
    // read as part of the board instead of light letterboxing.
    backgroundColor: '#16213e',
  },
  webArea: {
    flex: 1,
  },
  web: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
    backgroundColor: '#F5F7F4',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#F5F7F4',
  },
  loading: {
    color: '#4A6078',
    fontSize: 14,
  },
  title: {
    color: '#16261F',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  body: {
    color: '#4A6078',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  primary: {
    backgroundColor: '#12664D',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
    minHeight: 44,
    justifyContent: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondary: {
    borderWidth: 1.5,
    borderColor: '#C6D2CB',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
    minHeight: 44,
    justifyContent: 'center',
  },
  secondaryText: {
    color: '#33463D',
    fontSize: 14,
    fontWeight: '600',
  },
  notice: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDE8E8',
    borderWidth: 1,
    borderColor: '#F3B4B4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noticeText: {
    flex: 1,
    color: '#7A1F1F',
    fontSize: 13,
    lineHeight: 18,
  },
  noticeClose: {
    padding: 4,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
