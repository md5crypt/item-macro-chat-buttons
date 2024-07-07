function cardAddButtons(cardData, buttons) {
	if (!buttons || !buttons.length) {
		return cardData
	}
	const parser = new DOMParser()
	const doc = parser.parseFromString(cardData.content, "text/html")

	let buttonSection = doc.querySelector(".card-buttons")
	if (!buttonSection) {
		buttonSection = doc.createElement("div")
		buttonSection.className = "card-buttons"
		doc.querySelector("div.chat-card").insertBefore(buttonSection, doc.querySelector("section.card-header").nextSibling)
	}
	for (let i = 0; i < buttons.length; i += 1) {
		const config = buttons[i]
		const button = doc.createElement("button")
		button.type = "button"
		button.dataset.action = "macro-button"
		button.dataset.macroButton = i
		if (config.icon) {
			const icon = doc.createElement("i")
			icon.className = "fas " + config.icon
			button.appendChild(icon)
		}
		const span = doc.createElement("span")
		span.innerText = config.label
		button.appendChild(span)
		buttonSection.appendChild(button)
	}
	cardData.content = doc.documentElement.innerHTML
	return cardData
}

async function useWithButtons(args, buttons) {
	if (args[0] && args[0].macroButton !== undefined) {
		await buttons[args[0].macroButton].callback()
		return true
	} else {
		const cardData = await this.use(args[0].config, {...args[0].options, skipItemMacro: true, createMessage: false})
		await ChatMessage.create(cardAddButtons(cardData, buttons))
		return false
	}
}

async function macroButtonListener(event) {
	event.preventDefault()
	const button = event.currentTarget
	button.disabled = true
	const card = button.closest(".chat-card")
	const actor = card.dataset.tokenId ?
		(await fromUuid(card.dataset.tokenId)).actor :
		game.actors.get(card.dataset.actorId)
	const item = actor.items.get(card.dataset.itemId)
	await item.executeMacro({macroButton: parseInt(button.dataset.macroButton)})
	button.disabled = false
}

Hooks.once("setup", () => {
	Hooks.on("renderChatMessage", (message, [html]) => {
		html.querySelectorAll("[data-action^='macro-button']").forEach(button => {
			button.addEventListener("click", macroButtonListener)
		})
	})
	Item.prototype.useWithButtons = useWithButtons
})
