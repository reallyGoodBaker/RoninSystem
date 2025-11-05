import { Tag } from '@ronin/core/tag'

export const namespace = 'sstag:'
export const tags = Tag.fromObject({
    skill: {
        slot: {
            attack: null,
            special: null,
            tian: null,
            di: null,
            ren: null,
            draw: null,
            sheathe: null,
            sneak: null,
            jump: null,
            passive0: null,
            passive1: null,
            passive2: null,
        }
    },
    damage: {
        determination: null,
        health: null,
    }
})