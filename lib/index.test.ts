import { describe, it, expect } from 'bun:test';

import { InhibitFlags, parseKeybind } from './index.js';

// @ts-expect-error
const { ARROW, ENTER, ENTER_EXTRA, SELECT, SPACE, TEXT } = InhibitFlags;

describe('parseKeybind', () => {
	describe('handles certain keybinds', () => {
		it.each([
			// text insertion
			['a', SELECT | TEXT],
			['z', SELECT | TEXT],
			['Space', SPACE | SELECT | TEXT],
			// uppercase text insertion
			['Shift+X', TEXT],
			['Shift+Y', TEXT],
			// text deletion
			['Backspace', TEXT],
			['$mod+Backspace', TEXT],
			// per-char cursor positioning
			['ArrowLeft', ARROW | SELECT | TEXT],
			['ArrowRight', ARROW | SELECT | TEXT],
			['ArrowUp', ARROW | SELECT | TEXT],
			['ArrowDown', ARROW | SELECT | TEXT],
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
			['Enter', ENTER],
			['$mod+Enter', ENTER_EXTRA],
			['$mod+Shift+Enter', ENTER_EXTRA],
		])('%s', (keybind, expected) => {
			const [_mods, _key, flags] = parseKeybind(keybind);
			expect(flags).toBe(expected);
		});
	});
});
