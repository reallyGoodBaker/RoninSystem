import { RoninPlayerController } from "@ronin/plugins/ronin/roninController"
import { RoninModPlayer } from "@ronin/plugins/ronin/player"
import { tags } from "@ronin/config/tags"
import { Tag } from "@ronin/core/tag"
import { AttributesComponent } from "@ronin/gameplay/attribute"
import { input } from "@ronin/input/inputComponent"

export class MyController extends RoninPlayerController {
    setupInput(): void {
        super.setupInput()

        const player = <RoninModPlayer> this.getPawn()

        // 初始允许玩家进行攻击输入
        Tag.addTag(player, tags.perm.input.attack.normal)
        Tag.addTag(player, tags.perm.input.attack.special)

        this.OnAttack.on(async press => {
            if (!press) {
                return
            }

            // 玩家被允许进行普通攻击输入时，添加普通攻击标签
            if (Tag.hasTag(player, tags.perm.input.attack.normal)) {
                Tag.addTag(player, tags.skill.slot.attack)
            } else {
                // 无法进行普通攻击输入时，添加攻击输入缓冲
                input.inputBuffer(player, 'Attack')
            }
        })

        this.OnInteract.on(async press => {
            if (!press) {
                return
            }

            // 玩家被允许进行特殊攻击输入时，添加特殊攻击标签
            if (Tag.hasTag(player, tags.perm.input.attack.special)) {
                Tag.addTag(player, tags.skill.slot.special)
            } else {
                input.inputBuffer(player, 'Interact')
            }
        })
    }
}

export class BattleAttributes extends AttributesComponent<{blocking: boolean}> {
    constructor() {
        super({
            blocking: false,
        })
    }
}