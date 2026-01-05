import { MarieKSequence } from "@/generated/ss/marieK"
import { MarieKkSequence } from "@/generated/ss/marieKk"
import { MarieKkkSequence } from "@/generated/ss/marieKkk"
import { MariePSequence } from "@/generated/ss/marieP"
import { MariePpSequence } from "@/generated/ss/mariePp"
import { MariePpkSequence } from "@/generated/ss/mariePpk"
import { tags } from "@ronin/config/tags"
import { profiler } from "@ronin/core/profiler"
import { Tag } from "@ronin/core/tag"
import { anim } from "@ronin/plugins/animSeq/animPlugin"
import { onEnter, onExit, StateDef, StateMachineTemplate } from "@ronin/plugins/fsm/setup"
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
        onEnter(actor => {
            Tag.addTag(actor, tags.perm.input.attack.normal)
            Tag.addTag(actor, tags.perm.input.attack.special)
            Tag.removeTag(actor, tags.skill.slot.attack)
            Tag.removeTag(actor, tags.skill.slot.special)
        })

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

    @StateDef(14)
    attack1(): StateTransition[] {
        onEnter(actor => {
            anim.play(actor, MariePSequence.animation)
            Tag.removeTag(actor, tags.perm.input.attack.normal)
            Tag.removeTag(actor, tags.skill.slot.attack)
        })

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
        onEnter(actor => {
            anim.play(actor, MariePpSequence.animation)
            Tag.removeTag(actor, tags.perm.input.attack.normal)
            Tag.removeTag(actor, tags.perm.input.attack.special)
            Tag.removeTag(actor, tags.skill.slot.attack)
            Tag.removeTag(actor, tags.skill.slot.special)
        })

        return [
            {
                trigger: TransitionTriggerType.OnTagAdd,
                nextState: 'ppk',
                tag: tags.skill.slot.special
            },
            {
                trigger: TransitionTriggerType.OnEndOfState,
                nextState: 'idle',
            },
        ]
    }

    @StateDef(16)
    ppk(): StateTransition[] {
        onEnter(actor => {
            anim.play(actor, MariePpkSequence.animation)
        })

        return [
            {
                trigger: TransitionTriggerType.OnEndOfState,
                nextState: 'idle',
            },
        ]
    }

    @StateDef(14)
    kick1(): StateTransition[] {
        onEnter(actor => {
            anim.play(actor, MarieKSequence.animation)
            Tag.removeTag(actor, tags.perm.input.attack.special)
            Tag.removeTag(actor, tags.skill.slot.special)
        })

        return [
            {
                trigger: TransitionTriggerType.OnTagAdd,
                nextState: 'kk',
                tag: tags.skill.slot.special
            },
            {
                trigger: TransitionTriggerType.OnEndOfState,
                nextState: 'idle',
            },
        ]
    }

    @StateDef(16)
    kk(): StateTransition[] {
        onEnter(actor => {
            anim.play(actor, MarieKkSequence.animation)
            Tag.removeTag(actor, tags.perm.input.attack.special)
            Tag.removeTag(actor, tags.skill.slot.special)
        })

        return [
            {
                trigger: TransitionTriggerType.OnTagAdd,
                nextState: 'kkk',
                tag: tags.skill.slot.special
            },
            {
                trigger: TransitionTriggerType.OnEndOfState,
                nextState: 'idle',
            },
        ]
    }

    @StateDef(18)
    kkk(): StateTransition[] {
        onEnter(actor => anim.play(actor, MarieKkkSequence.animation))

        return [
            {
                trigger: TransitionTriggerType.OnEndOfState,
                nextState: 'idle',
            },
        ]
    }
}