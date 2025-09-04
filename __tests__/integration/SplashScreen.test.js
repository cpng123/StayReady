/**
 * __tests__/integration/SplashScreen.test.js
 * Integration test for SplashScreen using direct Animated stubs (no RN internals).
 */

import React from 'react';
import { act, render } from '@testing-library/react-native';

// Keep timers predictable for setTimeout used in SplashScreen
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);

// 1) Stub Animated methods directly (MUST happen before importing the screen)
const RN = require('react-native');
const Animated = RN.Animated;

const immediate = (value, toValue) => ({
  start: (cb) => {
    try {
      if (value && typeof value.setValue === 'function') {
        value.setValue(toValue);
      }
    } catch {}
    if (typeof cb === 'function') cb();
  },
});
const wrap = (arr) => ({
  start: (cb) => {
    arr?.forEach((a) => a?.start?.());
    if (typeof cb === 'function') cb();
  },
});

// Spy on Animated APIs to make them synchronous/no-op timers
jest.spyOn(Animated, 'timing').mockImplementation((value, cfg = {}) => immediate(value, cfg.toValue));
jest.spyOn(Animated, 'spring').mockImplementation((value, cfg = {}) => immediate(value, cfg.toValue));
jest.spyOn(Animated, 'sequence').mockImplementation((arr = []) => wrap(arr));
jest.spyOn(Animated, 'parallel').mockImplementation((arr = []) => wrap(arr));

// 2) Mock ThemeProvider to avoid @react-navigation/native ESM during this test
jest.mock('../../theme/ThemeProvider', () => {
  const React = require('react');
  const ctxValue = {
    themeKey: 'light',
    setThemeKey: jest.fn(),
    theme: { colors: { appBg: '#ffffff' } },
  };
  return {
    ThemeProvider: ({ children }) => <>{children}</>,
    useThemeContext: () => ctxValue,
  };
});

// 3) AsyncStorage mock
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key) => (key === 'pref:sfxEnabled' ? '1' : null)),
}));

// 4) expo-av mock (functions defined inside the factory)
jest.mock('expo-av', () => {
  const mockPlayAsync = jest.fn(async () => {});
  const mockSetPositionAsync = jest.fn(async () => {});
  const mockUnloadAsync = jest.fn(async () => {});
  let onStatusCb = null;

  return {
    Audio: {
      setAudioModeAsync: jest.fn(async () => {}),
      Sound: {
        createAsync: jest.fn(async () => ({
          sound: {
            setOnPlaybackStatusUpdate: (cb) => { onStatusCb = cb; },
            setPositionAsync: mockSetPositionAsync,
            playAsync: mockPlayAsync,
            unloadAsync: mockUnloadAsync,
          },
        })),
      },
    },
    __mocked: {
      playAsync: mockPlayAsync,
      setPositionAsync: mockSetPositionAsync,
      unloadAsync: mockUnloadAsync,
      getStatusCb: () => onStatusCb,
    },
  };
});

// 5) Static asset mocks
jest.mock('../../assets/logo.png', () => 1);
jest.mock('../../assets/Sound/intro.mp3', () => 1);

// Import AFTER mocks/spies are set up
import SplashScreen from '../../screens/SplashScreen';

const renderBare = (ui) => render(ui);

describe('SplashScreen (integration)', () => {
  let expoAv, storage;

  beforeEach(() => {
    jest.useFakeTimers();
    expoAv = require('expo-av').__mocked;
    storage = require('@react-native-async-storage/async-storage');
    expoAv.playAsync.mockClear();
    expoAv.setPositionAsync.mockClear();
    expoAv.unloadAsync.mockClear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders logo/title and applies theme background', () => {
    const navigation = { replace: jest.fn() };
    const { getByTestId, getByText, unmount } = renderBare(
      <SplashScreen navigation={navigation} />
    );

    getByText('StayReady');

    const root = getByTestId('splash-root');
    const rootStyle = Array.isArray(root.props.style)
      ? Object.assign({}, ...root.props.style)
      : root.props.style;
    expect(rootStyle.backgroundColor).toBe('#ffffff');

    getByTestId('splash-logo');

    unmount();
  });

  test('plays intro SFX when pref enabled ("1") and navigates to Main', async () => {
    const navigation = { replace: jest.fn() };
    storage.getItem.mockResolvedValueOnce('1'); // enabled

    const { unmount } = renderBare(<SplashScreen navigation={navigation} />);

   // Let the async preload chain complete so the 800ms timeout gets scheduled
   await act(async () => { await Promise.resolve(); });
   await act(async () => { await Promise.resolve(); }); // sometimes one more tick helps
   // Now fast-forward past the kickoff delay
   await act(async () => { jest.advanceTimersByTime(801); });    expect(expoAv.setPositionAsync).toHaveBeenCalledTimes(1);
    expect(expoAv.playAsync).toHaveBeenCalledTimes(1);

    // Then ~5000ms to navigate
    await act(async () => { jest.advanceTimersByTime(5000); });
    expect(navigation.replace).toHaveBeenCalledWith('Main');

    unmount();
  });

  test('does NOT play SFX when pref disabled ("0"), still navigates', async () => {
    const navigation = { replace: jest.fn() };
    storage.getItem.mockResolvedValueOnce('0'); // disabled

    const { unmount } = renderBare(<SplashScreen navigation={navigation} />);

    await act(async () => { jest.advanceTimersByTime(800); });
    expect(expoAv.playAsync).not.toHaveBeenCalled();

    await act(async () => { jest.advanceTimersByTime(5000); });
    expect(navigation.replace).toHaveBeenCalledWith('Main');

    unmount();
  });

  test('unloads sound on unmount (cleanup)', async () => {
    const navigation = { replace: jest.fn() };
    const { unmount } = renderBare(<SplashScreen navigation={navigation} />);

    await act(async () => { jest.advanceTimersByTime(800); });
    unmount();
    expect(expoAv.unloadAsync).toHaveBeenCalled();
  });
});
