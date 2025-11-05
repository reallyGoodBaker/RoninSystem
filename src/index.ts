import { Application, Entry, IApplication } from "@ronin/core/architect/application"
import { EnchantmentTypes, ItemLockMode, ItemType, Player } from "@minecraft/server"
import { CustomCommand, Param } from './engine/utils/command'
import { ModBase } from "@ronin/core/architect/mod"
import { ItemHelper } from "@ronin/utils/helpers/itemHelper"
import { Pawn } from "@ronin/core/architect/pawn"
import { ticking } from "@ronin/core/ticking"
import { RoninPlugin } from "@ronin/plugins/ronin"

export class MyCommand {

    @CustomCommand('类型')
    types(
        @Param.Success success: Param.SuccessOutput,
    ) {
        success(EnchantmentTypes.getAll().map(e => e.id).join(', '))
    }

    @CustomCommand('物品')
    item(
        @Param.Required('player') players: Player[],
        @Param.Required('item', 'item') itemStack: ItemType,
    ) {
        const application = Application.getInst()
        for (const player of players) {
            const actor = application.getActor(player.id) as Pawn
            if (!actor) {
                continue
            }

            ticking.queue(() => {
                ItemHelper.giveItem(
                    application.getActor(player.id) as Pawn,
                    itemStack.id,
                    {
                        canDestroy: [ 'minecraft:stone' ],
                        canPlaceOn: [ 'minecraft:stone' ],
                        lockMode: ItemLockMode.slot,
                        keepOnDeath: true,
                        lore: [ '这是lore' ],
                    }, {
                        sharpness: 3,
                        onlyApply: true
                    }
                )
            })
        }
    }

}

@Entry
export class MyMod extends ModBase {
    start(app: IApplication) {
        app.loadPlugin(RoninPlugin)
    }
}