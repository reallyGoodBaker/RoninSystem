import { RoninPlayerController } from "@ronin/plugins/ronin/roninController"
import { RoninModPlayer } from "@ronin/plugins/ronin/player"
import { tags } from "@ronin/config/tags"
import { Tag } from "@ronin/core/tag"
import { FinateStateMachineComponent } from "@ronin/plugins/fsm/plugin"
import { AttributesComponent } from "@ronin/gameplay/attribute"

export class MyController extends RoninPlayerController {
    setupInput(): void {
        super.setupInput()

        const player = <RoninModPlayer> this.getPawn()
        const stateMachineComp = player.getComponent(FinateStateMachineComponent)

        // 初始允许玩家进行攻击输入
        Tag.addTag(player, tags.perm.input.attack.normal)
        Tag.addTag(player, tags.perm.input.attack.special)

        // 用来判断玩家是否可以进行攻击输入
        // 这里并没有使用 normal / special, 是因为 Tag 的模糊匹配可以匹配父级标签
        const attackPermTag = Tag.of('perm.input.attack')

        this.OnAttack.on(async press => {
            if (!press) {
                return
            }

            // 玩家被允许进行普通攻击输入时，添加普通攻击标签
            if (Tag.hasTag(player, attackPermTag) && stateMachineComp?.stateMachine) {
                Tag.addTag(player, tags.skill.slot.attack)
            }
        })

        this.OnInteract.on(async press => {
            if (!press) {
                return
            }

            // 玩家被允许进行特殊攻击输入时，添加特殊攻击标签
            if (Tag.hasTag(player, attackPermTag) && stateMachineComp?.stateMachine) {
                Tag.addTag(player, tags.skill.slot.special)
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