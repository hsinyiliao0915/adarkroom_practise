import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ThemeManager, DARK_THEME, LIGHT_THEME } from '../src/config/ThemeManager.ts';
import { EventBus, Events } from '../src/core/EventBus.ts';

describe('ThemeManager & Dark/Light Mode Switching', () => {
  let themeMgr: ThemeManager;

  beforeEach(() => {
    themeMgr = ThemeManager.getInstance();
  });

  test('should return dark theme colors by default or toggle correctly', () => {
    const initialMode = themeMgr.getMode();
    const initialTheme = themeMgr.getTheme();

    assert.ok(initialTheme.outerBgCss.length > 0);
    assert.ok(initialTheme.gameBgCss.length > 0);

    let emittedTheme: any = null;
    const unsub = EventBus.getInstance().on(Events.THEME_CHANGED, (theme) => {
      emittedTheme = theme;
    });

    // Toggle theme
    const nextMode = themeMgr.toggleTheme();
    assert.notStrictEqual(nextMode, initialMode);
    assert.strictEqual(themeMgr.getMode(), nextMode);
    assert.ok(emittedTheme);
    assert.strictEqual(emittedTheme.mode, nextMode);

    if (nextMode === 'light') {
      assert.strictEqual(themeMgr.getTheme().gameBgHex, LIGHT_THEME.gameBgHex);
      assert.strictEqual(themeMgr.getTheme().textPrimary, LIGHT_THEME.textPrimary);
    } else {
      assert.strictEqual(themeMgr.getTheme().gameBgHex, DARK_THEME.gameBgHex);
      assert.strictEqual(themeMgr.getTheme().textPrimary, DARK_THEME.textPrimary);
    }

    // Toggle back
    const backMode = themeMgr.toggleTheme();
    assert.strictEqual(backMode, initialMode);
    assert.strictEqual(themeMgr.getMode(), initialMode);

    unsub();
  });

  test('theme palettes must have distinct outerBg and gameBg colors for visual framing', () => {
    // Area 1 (outerBg) must be grey and contrast with Area 2 (gameBg)
    assert.notStrictEqual(DARK_THEME.outerBgCss, DARK_THEME.gameBgCss);
    assert.notStrictEqual(LIGHT_THEME.outerBgCss, LIGHT_THEME.gameBgCss);

    // Dark mode game canvas is pure black, text is pure white
    assert.strictEqual(DARK_THEME.gameBgHex, 0x000000);
    assert.strictEqual(DARK_THEME.textPrimary, '#ffffff');

    // Light mode game canvas is pure white, text is pure black
    assert.strictEqual(LIGHT_THEME.gameBgHex, 0xffffff);
    assert.strictEqual(LIGHT_THEME.textPrimary, '#000000');
  });
});
