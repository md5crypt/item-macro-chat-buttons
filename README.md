# item-macro-chat-buttons

This tiny module makes it easy to add custom buttons to item chat cards via item macros.

It's meant to be used as an "plugin" for the [Item Macro](https://foundryvtt.com/packages/itemacro) module.

## Example usage

Two example macros that demonstrate how this module works can be found below:

### Token swap macro

```javascript
async function setToken(src) {
	let tokens = actor.getActiveTokens()
	for (let token of tokens) {
		await token.document.update({texture: {src}})
	}
	await actor.prototypeToken.update({texture: {src}})
}

item.useWithButtons(args, [
	{
		label: "Create Illusion",
		icon: "fa-cat",
		callback: () => setToken("some/path/token_1.png")
	},
	{
		label: "Dispel Illusion",
		icon: "fa-snake",
		callback: () => setToken("some/path/token_2.png")
	}
])
```

Using an item with this macro will create the following chat message:

![screenshot](https://github.com/md5crypt/item-macro-chat-buttons/assets/6748075/2efb8a22-79d2-47cc-8dbb-9037cd5387ca)

The buttons, when pressed, will call one of the two callbacks defined in config (and in this case change the image of the item owner's token).

### Roll table macro

```javascript
item.useWithButtons(args, [
	{
		label: "Draw From Roll Table",
		icon: "fa-dice",
		callback: async () => {
			let table = await game.packs.get("world.roll-tables").getDocument("TgjUynKRArpImDkn");
			let roll = await new Roll(table.formula, actor.getRollData()).roll()
			await game.dice3d?.showForRoll(roll, game.user, true)
			table.toMessage(
				table.getResultsForRoll(roll.total),
				{roll, messageData:{speaker}}
			)
		}
	}
])
```

Using an item with this macro will create the following chat message:

![screenshot](https://github.com/md5crypt/item-macro-chat-buttons/assets/6748075/82b472b0-0ed9-4541-bdfd-4810424542ce)

The first button is an unchanged standard dnd5e button ("don't consume usage" was checked when the item was used to create this screenshot), the second button is the added custom button.

When clicked, the custom button will call the callback set in config (in this case roll from the target roll table).

## How does it work?

This module adds two things:

1. `Item.prototype.useWithButtons` function that:
    - if `args[0].macroButton` is not set calls `item.use` and amends the resulting `cardData` before calling `ChatMessage.create`.
    - otherwise calls one of the callbacks from the button config
2. a pre-render chat message hook that registers a event listener on the custom buttons, this listener decodes the chat card data and re-executes the item's macro passing a custom args value.

Basically the macro gets execute **two** (or more) times. The first time when used and then each time the chat button is pressed. `args` value is used to detect which one is currently happening.

Buttons get added directly to the chat message html before `ChatMessage.create` is called. `data-action` is set to `"macro-button"` and one additional data attribute gets added: `data-macro-button`, which holds the button index to later find the correct callback.

## Compatibility

I tested it only on dnd5e as thats what I use. It may or may not work on other systems.

## Api

```typescript
/** Button configuration */
interface ButtonConfig {
  /** label to render in the button */
  label: string

  /**
   * when set an icon will be added to the button,
   * this should be a font awesome icon class (like fa-dice)
   * see https://fontawesome.com/icons for a full list
   */
  icon?: string

  /** callback to execute when the button is pressed */
  callback: () => void | Promise<void>
}

interface Item {
  /**
   * @param args: args parameter as passed to the item macro
   * @param config: array of buttons to create
   * @returns true if callback was called (executed from chat)
   * false if the chat message was created (executed from item use)
   */
  useWithButtons(args: any[], config: ButtonConfig[]): Promise<boolean>
}
```
