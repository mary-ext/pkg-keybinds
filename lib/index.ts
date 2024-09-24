const PLATFORM = typeof navigator == 'object' ? navigator.platform : '';
export const IS_APPLE_DEVICE = /iP[aho]|Mac/.test(PLATFORM);
export const IS_WINDOWS_DEVICE = PLATFORM == 'Win32';

// Alias for `$mod` modifier
export const MOD = IS_APPLE_DEVICE ? 'Meta' : 'Control';

// Aliases for AltGr modifier, here just in case we need them
export const ALT_GRAPH_ALIASES = IS_WINDOWS_DEVICE ? ['Alt', 'Control'] : IS_APPLE_DEVICE ? ['Alt'] : [];

// Array of "known" key modifiers
export const MODIFIERS = ['Alt', 'Control', 'Meta', 'Shift'];

export type KeybindListener = (ev: KeyboardEvent) => void;
export type KeybindMapping = Record<string, KeybindListener>;

export type Keybind = [mods: string[], key: string, flags: number];

/** @internal */
export const enum InhibitFlags {
	// Disabled on <input type=text>
	TEXT = 1 << 0,
	// Disabled on <select>
	SELECT = 1 << 1,

	// Specific keys in particular
	ARROW = 1 << 2,
	ENTER = 1 << 3,
	ENTER_EXTRA = 1 << 4,
	SPACE = 1 << 5,
}

const types: Record<string, number | undefined> = {
	email: InhibitFlags.TEXT,
	number: InhibitFlags.TEXT,
	password: InhibitFlags.TEXT,
	search: InhibitFlags.TEXT,
	tel: InhibitFlags.TEXT,
	text: InhibitFlags.TEXT,
	url: InhibitFlags.TEXT,

	date: InhibitFlags.TEXT | InhibitFlags.ENTER,
	datetime: InhibitFlags.TEXT | InhibitFlags.ENTER,
	month: InhibitFlags.TEXT | InhibitFlags.ENTER,
	time: InhibitFlags.TEXT | InhibitFlags.ENTER,
	week: InhibitFlags.TEXT | InhibitFlags.ENTER,

	button: InhibitFlags.ENTER | InhibitFlags.SPACE,
	color: InhibitFlags.ENTER | InhibitFlags.SPACE,
	file: InhibitFlags.ENTER | InhibitFlags.SPACE,
	image: InhibitFlags.ENTER | InhibitFlags.SPACE,
	reset: InhibitFlags.ENTER | InhibitFlags.SPACE,
	submit: InhibitFlags.ENTER | InhibitFlags.SPACE,

	checkbox: InhibitFlags.SPACE,

	radio: InhibitFlags.ARROW | InhibitFlags.SPACE,
	range: InhibitFlags.ARROW,
};

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
		// Alt | Control | Escape | Meta | Tab | Enter | ScrollLock
		(standalone && !/Al|Co|Es|F\d|Me|Ta|En|Sc/.test(key)) ||
		// Alt | Control | Escape | Meta | Tab | Enter | Backspace | *Lock | Delete
		(shiftModifierOnly && !/Al|Co|Es|F\d|Me|Ta|En|Ba|Lo|De/.test(key)) ||
		// Arrow* | Back
		(modModifierOnly && /^[acvxyz]|Ar|Ba/.test(key)) ||
		// Arrow
		(modShiftModifierOnly && /V$|Ar/.test(key))
	) {
		flags |= InhibitFlags.TEXT;
	}

	// Alt | Control | Escape | Meta | Tab | Enter | Backspace | *Lock | Delete
	if (standalone && !/Al|Co|Es|F\d|Me|Ta|En|Ba|Lo|De/.test(key)) {
		flags |= InhibitFlags.SELECT;
	}

	if (standalone && /Ar/.test(key)) {
		flags |= InhibitFlags.ARROW;
	}

	if (standalone && /Sp/.test(key)) {
		flags |= InhibitFlags.SPACE;
	}

	if (standalone && /En/.test(key)) {
		flags |= InhibitFlags.ENTER;
	}

	if ((shiftModifierOnly || modModifierOnly || modShiftModifierOnly) && /En/.test(key)) {
		flags |= InhibitFlags.ENTER_EXTRA;
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
		return !((types[type] || 0) & flags);
	}

	if (target instanceof HTMLTextAreaElement) {
		const f = InhibitFlags.ENTER | InhibitFlags.TEXT;
		return !(flags & f);
	}

	if (target instanceof HTMLSelectElement) {
		return !(flags & InhibitFlags.SELECT);
	}

	if (target instanceof HTMLButtonElement) {
		const f = InhibitFlags.ENTER | InhibitFlags.SPACE;
		return !(flags & f);
	}

	if (target instanceof HTMLAnchorElement) {
		const f = InhibitFlags.ENTER | InhibitFlags.ENTER_EXTRA;
		return !(flags & f) && target.href != '';
	}

	if (target instanceof HTMLElement && target.isContentEditable) {
		const f = InhibitFlags.ENTER | InhibitFlags.TEXT;
		return !(flags & f);
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
	preventDefault: boolean = true,
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
