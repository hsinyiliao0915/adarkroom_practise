import Phaser from 'phaser';

export const FONT_FAMILY = '"Segoe UI", "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", -apple-system, sans-serif';
export const MONO_FONT = '"Cascadia Code", "SFMono-Regular", Consolas, "Courier New", "Microsoft JhengHei", monospace';

export const TEXT_RESOLUTION = Math.max(window.devicePixelRatio || 1, 2);

export const createTextStyle = (
  fontSize: string = '13px',
  color: string = '#e2e8f0',
  isMono: boolean = false,
  extra?: Partial<Phaser.Types.GameObjects.Text.TextStyle>
): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: isMono ? MONO_FONT : FONT_FAMILY,
  fontSize,
  color,
  resolution: TEXT_RESOLUTION,
  ...extra
});
