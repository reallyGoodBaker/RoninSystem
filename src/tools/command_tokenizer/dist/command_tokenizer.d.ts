import type * as MoonBit from "./moonbit.d.ts";

export function commandToken(template: string): (Enum | Required | Optional)[]
export interface Var {
    name: string
    vType: string
}
export class Enum {
    optional?: boolean
    type: 'enum'
    constructor(public _0: string[])
}
export class Required {
    type: 'required'
    constructor(public _0: Var)
}
export class Optional {
    type: 'optional'
    constructor(public _0: Var)
}