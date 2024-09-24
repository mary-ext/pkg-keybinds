const PLATFORM = typeof navigator == 'object' ? navigator.platform : '';
export const IS_APPLE_DEVICE = /iP[aho]|Mac/.test(PLATFORM);
export const IS_WINDOWS_DEVICE = PLATFORM == 'Win32';

// Alias for `$mod` modifier
export const MOD = IS_APPLE_DEVICE ? 'Meta' : 'Control';

// Aliases for AltGr modifier, here just in case we need them
export const ALT_GRAPH_ALIASES = IS_WINDOWS_DEVICE ? ['Alt', 'Control'] : IS_APPLE_DEVICE ? ['Alt'] : [];

// Array of "known" key modifiers
export const MODIFIERS = ['Alt', 'Control', 'Meta', 'Shift'];

// <input> that accepts text inputs
const INPUT_TEXT = /^[demnptuw]|ea/;
// <input> that accepts text inputs and use Enter/Space key
const INPUT_TEXT_ACCESSORY = /mo|ti|da|we/;
// <input> that makes use of Enter/Space
const INPUT_BUTTON = /^[bfi]|co|re|su/;
// <input> that makes use of Space
const INPUT_CHECKBOX = /x$/;
// <input> that makes use of Arrow keys/Space
const INPUT_RADIO = /di/;
// <input> that makes use of Arrow keys
const INPUT_RANGE = /ng/;

// Arrow | Back
const COMMON_MOD_SHORTCUTS = /^[acvxyz]|Ar|Ba/;
// Arrow
const COMMON_MODSHIFT_SHORTCUTS = /V$|Ar/;
// Alt | Control | Escape | Meta | Tab | Enter | ScrollLock
const STANDALONE_INPUT_EXCLUSION = /Al|Co|Es|F\d|Me|Ta|En|Sc/;
// Alt | Control | Escape | Meta | Tab | Enter | Backspace | *Lock | Delete
const SHIFT_KEYS_INPUT_EXCLUSION = /Al|Co|Es|F\d|Me|Ta|En|Ba|Lo|De/;

// Alt | Control | Escape | Meta | Tab | Enter | Backspace | *Lock | Delete
const STANDALONE_SELECT_EXCLUSION = /Al|Co|Es|F\d|Me|Ta|En|Ba|Lo|De/;

export type KeybindListener = (ev: KeyboardEvent) => void;
export type KeybindMapping = Record<string, KeybindListener>;

export type Keybind = [mods: string[], key: string, flags: number];

/** @internal */
export const enum KeybindFlags {
	// Disabled on <input type=text>
	INHIBIT_TEXT = 1 << 0,
	// Disabled on <input type=date>
	INHIBIT_TEXT_ACCESSORY = 1 << 1,
	// Disabled on <input type=submit> and <button>
	INHIBIT_BUTTON = 1 << 2,
	// Disabled on <input type=checkbox>
	INHIBIT_CHECKBOX = 1 << 3,
	// Disabled on <input type=radio>
	INHIBIT_RADIO = 1 << 4,
	// Disabled on <input type=range> and <input type=radio>
	INHIBIT_RANGE = 1 << 5,

	// Disabled on <select>
	INHIBIT_SELECT = 1 << 6,

	// Disabled on <a href>
	INHIBIT_ANCHOR = 1 << 7,
}

export const parseKeybind = (keybind: string): Keybind => {
	const mods = keybind
		.replace(/\s/g, '')
		.split(/\b\+/)
		.map((mod) => (mod == '$mod' ? MOD : mod));

	const key = mods.pop()!;

	const len = mods.length;
	const standalone = len == 0;
	const shiftModifierOnly = len == 1 && mods[0] == 'Shift';
	const modModifierOnly = len == 1 && mods[0] == MOD;
	const modShiftModifierOnly = len == 2 && mods.includes(MOD) && mods.includes('Shift');

	let flags = 0;

	if (
		(standalone && !STANDALONE_INPUT_EXCLUSION.test(key)) ||
		(shiftModifierOnly && !SHIFT_KEYS_INPUT_EXCLUSION.test(key)) ||
		(modModifierOnly && COMMON_MOD_SHORTCUTS.test(key)) ||
		(modShiftModifierOnly && COMMON_MODSHIFT_SHORTCUTS.test(key))
	) {
		flags |= KeybindFlags.INHIBIT_TEXT;
	}

	if (standalone && !STANDALONE_SELECT_EXCLUSION.test(key)) {
		flags |= KeybindFlags.INHIBIT_SELECT;
	}

	if (standalone && /Ar/.test(key)) {
		flags |= KeybindFlags.INHIBIT_RADIO | KeybindFlags.INHIBIT_RANGE;
	}

	if (standalone && /Sp/.test(key)) {
		flags |=
			KeybindFlags.INHIBIT_ANCHOR |
			KeybindFlags.INHIBIT_BUTTON |
			KeybindFlags.INHIBIT_CHECKBOX |
			KeybindFlags.INHIBIT_RADIO |
			KeybindFlags.INHIBIT_TEXT_ACCESSORY;
	}

	if (standalone && /En/.test(key)) {
		flags |= KeybindFlags.INHIBIT_ANCHOR | KeybindFlags.INHIBIT_BUTTON | KeybindFlags.INHIBIT_TEXT_ACCESSORY;
	}

	if ((shiftModifierOnly || modModifierOnly || modShiftModifierOnly) && /En/.test(key)) {
		flags |= KeybindFlags.INHIBIT_ANCHOR;
	}

	return [mods, key, flags];
};

/**
 * Check if keybind is allowed to match with specified keyboard event based on
 * its parsed state.
 * @param ev Keyboard event to check
 * @param flags Parsed flags
 * @returns Whether keybind can proceed to be matched
 */
export const isKeybindAllowed = (ev: KeyboardEvent, flags: number): boolean => {
	const target = ev.target;

	if (target instanceof HTMLInputElement) {
		const type = target.type;

		if (flags & KeybindFlags.INHIBIT_TEXT && INPUT_TEXT.test(type)) {
			return false;
		}

		if (flags & KeybindFlags.INHIBIT_TEXT_ACCESSORY && INPUT_TEXT_ACCESSORY.test(type)) {
			return false;
		}

		if (flags & KeybindFlags.INHIBIT_BUTTON && INPUT_BUTTON.test(type)) {
			return false;
		}

		if (flags & KeybindFlags.INHIBIT_CHECKBOX && INPUT_CHECKBOX.test(type)) {
			return false;
		}

		if (flags & KeybindFlags.INHIBIT_RADIO && INPUT_RADIO.test(type)) {
			return false;
		}

		if (flags & KeybindFlags.INHIBIT_RANGE && INPUT_RANGE.test(type)) {
			return false;
		}

		return true;
	}

	if (target instanceof HTMLTextAreaElement) {
		return !(flags & KeybindFlags.INHIBIT_TEXT);
	}

	if (target instanceof HTMLSelectElement) {
		return !(flags & KeybindFlags.INHIBIT_SELECT);
	}

	if (target instanceof HTMLButtonElement) {
		return !(flags & KeybindFlags.INHIBIT_BUTTON);
	}

	if (target instanceof HTMLAnchorElement) {
		return !(flags & KeybindFlags.INHIBIT_ANCHOR) && target.href != '';
	}

	if (target instanceof HTMLElement && target.isContentEditable) {
		return !(flags & KeybindFlags.INHIBIT_TEXT);
	}

	return true;
};

/**
 * Check if a specific modifier is pressed, with special handling for AltGraph
 * modifier.
 * @param ev Keyboard event to check
 * @param mod Modifier to check
 * @returns Whether the modifier is pressed
 */
export const matchModifier = (ev: KeyboardEvent, mod: string): boolean => {
	return ev.getModifierState(mod) || (ev.getModifierState('AltGraph') && ALT_GRAPH_ALIASES.includes(mod));
};

/**
 * Check if specified keybind can match with the specified keyboard event
 * @param ev Keyboard event to test
 * @param keybind Keybind to test
 * @returns Whether the keybind matches
 */
export const matchKeybind = (ev: KeyboardEvent, [mods, key, flags]: Keybind): boolean => {
	return (
		// Check if we can do matching with target element
		isKeybindAllowed(ev, flags) &&
		// Check if key matches either `event.key` or `event.code`
		(ev.key == key || ev.code == key) &&
		// Check if all modifiers passes.
		mods.every((mod) => matchModifier(ev, mod)) &&
		// Don't match on extraneous modifiers
		MODIFIERS.every((mod) => mods.includes(mod) || !matchModifier(ev, mod))
	);
};

export const createKeybindHandler = (
	mapping: KeybindMapping,
	preventDefault: boolean = false,
): ((ev: KeyboardEvent) => void) => {
	const bindings = Object.entries(mapping).map(([raw, listener]): [Keybind, KeybindListener] => {
		return [parseKeybind(raw), listener];
	});

	const listener = (ev: KeyboardEvent) => {
		if (preventDefault && ev.defaultPrevented) {
			return;
		}

		// loop go fast, don't want this listener to take up much time especially
		// when the user is interacting with a WYSIWYG editor.
		for (let idx = 0, len = bindings.length; idx < len; idx++) {
			const [keybind, callback] = bindings[idx];

			if (matchKeybind(ev, keybind)) {
				if (preventDefault) {
					ev.preventDefault();
				}

				callback(ev);

				break;
			}
		}
	};

	return listener;
};
