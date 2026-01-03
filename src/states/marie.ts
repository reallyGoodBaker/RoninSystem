import { MarieKSequence } from "@/generated/ss/marieK"
import { MariePSequence } from "@/generated/ss/marieP"
import { MariePpSequence } from "@/generated/ss/mariePp"
import { tags } from "@ronin/config/tags"
import { anim } from "@ronin/plugins/animSeq/animPlugin"
import { onEnter, StateDef, StateMachineTemplate } from "@ronin/plugins/fsm/setup"
import { StateTransition, TransitionTriggerType } from "@ronin/plugins/fsm/state"

@StateMachineTemplate('ronin:marie', 'resume')
export class MarieMoves {

    @StateDef(0)
    resume(): StateTransition[] {
        return [
            {
                trigger: TransitionTriggerType.OnEndOfState,
                nextState: 'idle',
            },
        ]
    }

    @StateDef()
    idle(): StateTransition[] {
        return [
            {
                // 玩家添加标签时触发状态转换
                trigger: TransitionTriggerType.OnTagAdd,
                // 转换到 attack1
                nextState: 'attack1',
                // 标签为 tags.skill.slot.attack
                tag: tags.skill.slot.attack
            },
            {
                trigger: TransitionTriggerType.OnTagAdd,
                nextState: 'kick1',
                tag: tags.skill.slot.special
            },
        ]
    }

    @StateDef(12)
    attack1(): StateTransition[] {
        onEnter(actor => anim.playSequence(actor, MariePSequence.animation))

        return [
            {
                trigger: TransitionTriggerType.OnTagAdd,
                nextState: 'attack2',
                tag: tags.skill.slot.attack
            },
            {
                trigger: TransitionTriggerType.OnEndOfState,
                nextState: 'idle',
            },
        ]
    }

    @StateDef(15)
    attack2(): StateTransition[] {
        onEnter(actor => anim.playSequence(actor, MariePpSequence.animation))

        return [
            {
                trigger: TransitionTriggerType.OnEndOfState,
                nextState: 'idle',
            },
        ]
    }

    @StateDef(14)
    kick1(): StateTransition[] {
        onEnter(actor => anim.playSequence(actor, MarieKSequence.animation))

        return [
            {
                trigger: TransitionTriggerType.OnEndOfState,
                nextState: 'idle',
            },
        ]
    }
}