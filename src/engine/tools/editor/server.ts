import { createEffect } from "./base/common/responsive"
import { replicable } from "./base/server/replicator"

const [ ver, setVer ] = replicable(
    'editor.version',
    '0.0.1'
)
