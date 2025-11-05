import { RoninModPlayer } from "@ronin/plugins/ronin/player"
import { clampNumber } from "@minecraft/math"
import { Styles } from "@ronin/utils/styles"
import { Component } from "@ronin/core/architect/component"
import { MessageBlock } from "@ronin/hud/messageBlock"
import { ActionBarComponent } from "@ronin/hud/screenDisplay"

export class DeterminationHudComponent extends Component {
    allowTicking: boolean = true

    static readonly maxWidth = 40

    static readonly StyleRed = [ Styles.Red ]
    static readonly StyleWhite = [ Styles.White ]
    static readonly StyleSaneTrack = [ Styles.DarkAqua ]
    static readonly StyleNetrualTrack = [ Styles.Gold ]
    static readonly StyleInsaneTrack = [ Styles.DarkRed ]

    readonly message = new MessageBlock('ActionBar.Det')
    readonly value = this.message.createInline('ActionBar.Det.Value', '')
    readonly bar = this.message.createInline('ActionBar.Det.Bar', '')
    readonly text = this.message.createInline('ActionBar.Det.Text', '')
    readonly insaneTrack = this.bar.createInline('ActionBar.Det.InsaneTrack', '', DeterminationHudComponent.StyleInsaneTrack)
    readonly neutralTrack = this.bar.createInline('ActionBar.Det.NeutralTrack', '', DeterminationHudComponent.StyleNetrualTrack)
    readonly saneTrack = this.bar.createInline('ActionBar.Det.SaneTrack', '', DeterminationHudComponent.StyleSaneTrack)

    fillText = '▎'
    emptyText = '▎'

    start(): void {
        const actionBar = this.getComponent(ActionBarComponent)
        actionBar.messege.addContent(this.message)
        this.text.styles = [ Styles.White ]

        if (!(this.actor instanceof RoninModPlayer)) {
            this.removeComponent(this)
        }
    }

    update(): void {
        const player = <RoninModPlayer> this.actor
        const progress = 0.5 + player.determination / (player.determLevel * 2)
        const blockSize = clampNumber(Math.round(progress * DeterminationHudComponent.maxWidth), 0, DeterminationHudComponent.maxWidth)
        const insaneProgress = 0.5 - player.mental / 20
        const HalfWidth = DeterminationHudComponent.maxWidth / 2

        this.value.text = this.fillText.repeat(blockSize)
        this.text.text = String(player.determination).padStart(4, ' ')
            + '/' + String(player.determLevel)

        this.value.styles = progress < insaneProgress
            ? DeterminationHudComponent.StyleRed
            : DeterminationHudComponent.StyleWhite

        this.saneTrack.text = ''
        this.neutralTrack.text = ''

        let spaceLeft = DeterminationHudComponent.maxWidth - blockSize
        const insanePadSize = Math.round(insaneProgress * DeterminationHudComponent.maxWidth)
        if (progress >= insaneProgress) {
            this.insaneTrack.text = ''
        } else {
            const fillSize = insanePadSize - blockSize
            this.insaneTrack.text = this.emptyText.repeat(fillSize)
            spaceLeft -= fillSize
        }

        if (progress >= 0.5) {
            this.neutralTrack.text = ''
        } else if (progress < insaneProgress) {
            const fillSize = HalfWidth - insanePadSize
            this.neutralTrack.text = this.emptyText.repeat(fillSize)
            spaceLeft -= fillSize
        } else {
            const fillSize = HalfWidth - blockSize
            this.neutralTrack.text = this.emptyText.repeat(fillSize)
            spaceLeft -= fillSize
        }

        this.saneTrack.text = this.emptyText.repeat(spaceLeft)
    }
}