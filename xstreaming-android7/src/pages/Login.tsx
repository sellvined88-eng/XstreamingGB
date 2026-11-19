import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  NativeModules,
  StyleSheet,
  View,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {Button, Text, useTheme} from 'react-native-paper';
import {debugFactory} from '../utils/debug';
import {useGamepadNavigation} from '../utils/useGamepadNavigation';

const {GamepadManager} = NativeModules;
const log = debugFactory('LoginScreen');

const INJECTED_JAVASCRIPT = `
(function() {
  function tryAutoFocus() {
    try {
      var active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        return;
      }
      var input = document.querySelector('input[type="email"], input[name="loginfmt"], input[type="password"], input[name="passwd"], input[type="text"]');
      if (input) {
        input.focus();
      }
    } catch(e) {}
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(tryAutoFocus, 300);
  } else {
    window.addEventListener('DOMContentLoaded', function() {
      setTimeout(tryAutoFocus, 300);
    });
  }

  var observer = new MutationObserver(function() {
    tryAutoFocus();
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
true;
`;

const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36';

function DetailScreen({navigation, route}: any) {
  const theme = useTheme();
  const [authUrl, setAuthUrl] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const webViewRef = useRef<any>(null);

  useEffect(() => {
    GamepadManager?.setCurrentScreen?.('login');
    return () => {
      GamepadManager?.setCurrentScreen?.('');
    };
  }, []);

  const handleBack = useCallback(() => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    } else {
      navigation.goBack();
    }
  }, [canGoBack, navigation]);

  useGamepadNavigation({
    onBack: handleBack,
  });

  useEffect(() => {
    if (route.params?.authUrl) {
      log.info('Receive authUrl:', route.params?.authUrl);
      setLoadError(null);
      setAuthUrl(route.params?.authUrl);
    }
  }, [route.params?.authUrl]);

  const handleRetry = useCallback(() => {
    setLoadError(null);
    setReloadNonce(prev => prev + 1);
  }, []);

  const renderLoading = useCallback(
    () => (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    ),
    [theme.colors.primary],
  );

  if (loadError) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="titleMedium" style={styles.errorTitle}>
          WebView authentication interrupted
        </Text>
        <Text variant="bodyMedium" style={styles.errorDetail}>
          {loadError}
        </Text>
        <View style={styles.errorActions}>
          <Button mode="contained" onPress={handleRetry} style={styles.errorBtn}>
            Retry
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.errorBtn}>
            Back
          </Button>
        </View>
      </View>
    );
  }

  if (authUrl !== '') {
    return (
      <View style={styles.container}>
        <WebView
          key={`login-webview-${reloadNonce}`}
          ref={webViewRef}
          source={{uri: authUrl}}
          originWhitelist={['*']}
          startInLoadingState={true}
          renderLoading={renderLoading}
          style={styles.webView}
          containerStyle={styles.container}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          keyboardDisplayRequiresUserAction={false}
          setSupportMultipleWindows={false}
          allowFileAccess={true}
          scalesPageToFit={true}
          mixedContentMode="always"
          cacheEnabled={true}
          injectedJavaScript={INJECTED_JAVASCRIPT}
          userAgent={USER_AGENT}
          onLoadEnd={() => {
            webViewRef.current?.requestFocus?.();
          }}
          onError={syntheticEvent => {
            const {nativeEvent} = syntheticEvent;
            const desc =
              nativeEvent?.description || 'Failed to load Microsoft login page.';
            log.warn('Login WebView onError:', desc);
            setLoadError(desc);
          }}
          onHttpError={syntheticEvent => {
            const {nativeEvent} = syntheticEvent;
            if (nativeEvent?.statusCode >= 500) {
              log.warn('Login WebView HTTP error:', nativeEvent.statusCode);
              setLoadError(`HTTP ${nativeEvent.statusCode}: ${nativeEvent.url || ''}`);
            }
          }}
          onRenderProcessGone={syntheticEvent => {
            log.warn('Login WebView render process gone:', syntheticEvent?.nativeEvent);
            setLoadError('WebView renderer process terminated. Tap Retry to reload.');
          }}
          onShouldStartLoadWithRequest={request => {
            if (request.url.startsWith('ms-xal-000000004c20a908:')) {
              navigation.navigate({
                name: 'Home',
                params: {xalUrl: request.url},
                merge: true,
              });
              return false;
            }
            return true;
          }}
          onNavigationStateChange={navState => {
            setCanGoBack(navState.canGoBack);
            const {url} = navState;
            if (url.startsWith('ms-xal-000000004c20a908:')) {
              navigation.navigate({
                name: 'Home',
                params: {xalUrl: url},
                merge: true,
              });
            }
          }}
        />
      </View>
    );
  } else {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#121212',
  },
  errorTitle: {
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDetail: {
    color: '#BBBBBB',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  errorBtn: {
    minWidth: 100,
  },
});

export default DetailScreen;
