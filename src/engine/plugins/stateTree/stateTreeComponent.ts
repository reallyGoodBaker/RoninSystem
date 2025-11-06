import { Component } from "@ronin/core/architect/component"
import { StateTree } from "./stateTree"

export class StateTreeComponent extends Component {
    allowTicking: boolean = true

    protected _stateTree?: StateTree
}