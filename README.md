# @externdefs/keybinds

Library for handling keyboard shortcuts (keybinds).

- **Sensible**, tries to achieve a default that makes "sense"  
  Keybinds can't interfere with common user expectations
- **Lightweight**, much smaller than `hotkeys-js` library.

Use this [web page](https://mary.my.id/tools/keydown-visualizer) to get the
right keybinds for use here.

```ts
const handler = createKeybindHandler({
	'$mod+K'() {
		// Open search modal...
	},

	s() {
		// Save...
	},
});

window.addEventListener('keydown', handler);
```

## "Sensible" keyboard handling

The library reserves certain keybinds for the following scenarios:

- `<input type=text>`, `<textarea>` and `<div contenteditable>`
  - Text insertion (`a`, `s`, ...)
  - Uppercase text insertion (`Shift+A`, `Shift+S`, ...)
  - Text deletion (`Backspace`, `$mod+Backspace`)
  - Cursor per-char positioning (`ArrowLeft`, `ArrowRight`, ...)
  - Cursor per-char selection (`Shift+ArrowLeft`, `Shift+ArrowRight`, ...)
  - Cursor per-word positioning (`$mod+ArrowLeft`, `$mod+ArrowRight`, ...)
  - Cursor per-word selection (`$mod+Shift+ArrowLeft`, `$mod+Shift+ArrowRight`, ...)
  - Common text manipulation shortcuts (`$mod+a`, `$mod+v`, ...)
  - Multiline only: New line insertion (`Enter`)
  - Date/time inputs only: Open picker UI (`Enter`)
- `<input type=checkbox>`
  - Tick/unticking check (`Space`)
- `<input type=radio>` and `<input type=range>`
  - Selection (`ArrowLeft`, `ArrowRight`)
- `<button>` and `<input type=file>`
  - Action trigger (`Space`, `Enter`)
- `<a href>`
  - Link navigation (`Enter`, `$mod+Enter`, ...)
- `<select>`
  - Jump to value (`a`, `s`, ...)

`createKeybindHandler` will also call `.preventDefault()` on matching events by
default, you can disable this by passing `false` as the second parameter. It's
recommended to just write your own handler however if you need flexibility, all
the relevant functions are exported.

## License

BSD-3-Clause © Mary
