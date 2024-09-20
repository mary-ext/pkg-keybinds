const PLATFORM = typeof navigator == 'object' ? navigator.platform : '';
export const IS_APPLE_DEVICE = /iP[aho]|Mac/.test(PLATFORM);
export const IS_WINDOWS_DEVICE = PLATFORM == 'Win32';

// Alias for `$mod` modifier
export const MOD = IS_APPLE_DEVICE ? 'Meta' : 'Control';

// Aliases for AltGr modifier, here just in case we need them
export const ALT_GRAPH_ALIASES = IS_WINDOWS_DEVICE ? ['Alt', 'Control'] : IS_APPLE_DEVICE ? ['Alt'] : [];

// Array of "known" key modifiers
export const MODIFIERS = ['Alt', 'Control', 'Meta', 'Shift'];

// Input types that makes use of Enter key to do its action
const INPUT_ENTERABLE_TYPES = /f|ek|[^x]t|im|co/;

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
	INHIBIT_TEXT_INPUT = 1 << 0,
	INHIBIT_ENTER = 1 << 1,
	INHIBIT_SELECT = 1 << 2,
	INHIBIT_ANCHOR_ENTER = 1 << 3,
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
		flags |= KeybindFlags.INHIBIT_TEXT_INPUT;
	}

	if (standalone && !STANDALONE_SELECT_EXCLUSION.test(key)) {
		flags |= KeybindFlags.INHIBIT_SELECT;
	}

	if (key == 'Enter') {
		if (standalone) {
			flags |= KeybindFlags.INHIBIT_ENTER;
		}

		if (standalone || shiftModifierOnly || modModifierOnly || modShiftModifierOnly) {
			flags |= KeybindFlags.INHIBIT_ANCHOR_ENTER;
		}
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
		if (flags & KeybindFlags.INHIBIT_ENTER) {
			return !INPUT_ENTERABLE_TYPES.test(target.type);
		}

		return !(flags & KeybindFlags.INHIBIT_TEXT_INPUT);
	}

	if (target instanceof HTMLTextAreaElement) {
		return !(flags & KeybindFlags.INHIBIT_TEXT_INPUT);
	}

	if (target instanceof HTMLSelectElement) {
		return !(flags & KeybindFlags.INHIBIT_SELECT);
	}

	if (target instanceof HTMLButtonElement) {
		return !(flags & KeybindFlags.INHIBIT_ENTER);
	}

	if (target instanceof HTMLAnchorElement) {
		return !(flags & KeybindFlags.INHIBIT_ANCHOR_ENTER) && target.href != '';
	}

	if (target instanceof HTMLElement && target.isContentEditable) {
		return !(flags & KeybindFlags.INHIBIT_TEXT_INPUT);
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
