import { describe, it, expect } from 'bun:test';

import { KeybindFlags, parseKeybind } from './index.js';

const {
	INHIBIT_ANCHOR: ANCHOR,
	INHIBIT_BUTTON: BUTTON,
	INHIBIT_CHECKBOX: CHECKBOX,
	INHIBIT_RADIO: RADIO,
	INHIBIT_RANGE: RANGE,
	INHIBIT_SELECT: SELECT,
	INHIBIT_TEXT_ACCESSORY: TEXT_ACCESSORY,
	INHIBIT_TEXT: TEXT,
	// @ts-expect-error
} = KeybindFlags;

describe('parseKeybind', () => {
	describe('handles certain keybinds', () => {
		it.each([
			// text insertion
			['a', SELECT | TEXT],
			['z', SELECT | TEXT],
			['Space', ANCHOR | BUTTON | CHECKBOX | RADIO | SELECT | TEXT | TEXT_ACCESSORY],
			// uppercase text insertion
			['Shift+X', TEXT],
			['Shift+Y', TEXT],
			// text deletion
			['Backspace', TEXT],
			['$mod+Backspace', TEXT],
			// per-char cursor positioning
			['ArrowLeft', RADIO | RANGE | SELECT | TEXT],
			['ArrowRight', RADIO | RANGE | SELECT | TEXT],
			['ArrowUp', RADIO | RANGE | SELECT | TEXT],
			['ArrowDown', RADIO | RANGE | SELECT | TEXT],
			// per-char cursor selection
			['Shift+ArrowLeft', TEXT],
			['Shift+ArrowRight', TEXT],
			['Shift+ArrowUp', TEXT],
			['Shift+ArrowDown', TEXT],
			// per-word cursor positioning
			['$mod+ArrowLeft', TEXT],
			['$mod+ArrowRight', TEXT],
			['$mod+ArrowUp', TEXT],
			['$mod+ArrowDown', TEXT],
			// per-word cursor selection
			['$mod+Shift+ArrowLeft', TEXT],
			['$mod+Shift+ArrowRight', TEXT],
			['$mod+Shift+ArrowUp', TEXT],
			['$mod+Shift+ArrowDown', TEXT],
			// common text input shortcuts
			['$mod+a', TEXT],
			['$mod+c', TEXT],
			['$mod+v', TEXT],
			['$mod+x', TEXT],
			['$mod+y', TEXT],
			['$mod+z', TEXT],
			// enter action
			['Enter', ANCHOR | BUTTON | TEXT_ACCESSORY],
			['$mod+Enter', ANCHOR],
			['$mod+Shift+Enter', ANCHOR],
		])('%s', (keybind, expected) => {
			const [_mods, _key, flags] = parseKeybind(keybind);
			expect(flags).toBe(expected);
		});
	});
});
