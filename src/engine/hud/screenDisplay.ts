import { Player } from "@minecraft/server"
import { MessageBlock } from "./messageBlock"
import { Component } from "@ronin/core/architect/component"
import { Pawn } from "@ronin/core/architect/pawn"

export class ActionBarComponent extends Component<Pawn> {
    readonly message: MessageBlock = new MessageBlock('ActionBar.Root')
    allowTicking = true

    update(): void {
        const player = <Player> this.actor.entity
        if (player && player.onScreenDisplay.isValid) {
            player.onScreenDisplay.setActionBar(this.message.toString())
        }
    }
}

export class TitleComponent extends Component<Pawn> {
    readonly title: MessageBlock = new MessageBlock('Title.Root')
    readonly subtitle: MessageBlock = new MessageBlock('Subtitle.Root')

    update(): void {
        const player = <Player> this.actor.entity
        if (player?.onScreenDisplay.isValid) {
            player.onScreenDisplay.setTitle(this.title.toString())
            player.onScreenDisplay.updateSubtitle(this.subtitle.toString())
        }
    }
}