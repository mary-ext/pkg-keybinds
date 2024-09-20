import { describe, it, expect } from 'bun:test';

import { KeybindFlags, parseKeybind } from './index.js';

describe('parseKeybind', () => {
	describe('reserves certain keybinds on <input>', () => {
		it.each([
			// text insertion
			['a'],
			['z'],
			// uppercase text insertion
			['Shift+X'],
			['Shift+Y'],
			// text deletion
			['Backspace'],
			['$mod+Backspace'],
			// per-char cursor positioning
			['ArrowLeft'],
			['ArrowRight'],
			['ArrowUp'],
			['ArrowDown'],
			// per-char cursor selection
			['Shift+ArrowLeft'],
			['Shift+ArrowRight'],
			['Shift+ArrowUp'],
			['Shift+ArrowDown'],
			// per-word cursor positioning
			['$mod+ArrowLeft'],
			['$mod+ArrowRight'],
			['$mod+ArrowUp'],
			['$mod+ArrowDown'],
			// per-word cursor selection
			['$mod+Shift+ArrowLeft'],
			['$mod+Shift+ArrowRight'],
			['$mod+Shift+ArrowUp'],
			['$mod+Shift+ArrowDown'],
			// common text input shortcuts
			['$mod+a'],
			['$mod+c'],
			['$mod+v'],
			['$mod+x'],
			['$mod+y'],
			['$mod+z'],
		])('%s', (keybind) => {
			expect.assertions(1);

			const [_mods, _key, flags] = parseKeybind(keybind);

			expect(flags & KeybindFlags.INHIBIT_TEXT_INPUT).toBeTruthy();
		});
	});
});

describe('input type regex', () => {
	const ALL_TYPES = [
		'button',
		'checkbox',
		'color',
		'date',
		'datetime-local',
		'email',
		'file',
		'hidden',
		'image',
		'month',
		'number',
		'password',
		'radio',
		'range',
		'reset',
		'search',
		'submit',
		'tel',
		'text',
		'time',
		'url',
		'week',
	];

	const ENTERABLE_TYPES = [
		'button',
		'color',
		'date',
		'datetime-local',
		'file',
		'image',
		'month',
		'reset',
		'submit',
		'time',
		'week',
	];

	const re = /f|ek|[^x]t|im|co/;
	for (const type of ALL_TYPES) {
		const pass = ENTERABLE_TYPES.includes(type);

		it(`${pass ? `passes` : `fails`} on ${type}`, () => {
			expect(re.test(type)).toBe(pass);
		});
	}
});
