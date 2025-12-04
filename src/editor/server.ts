import { replicable } from "./base/server/replicator"

const [ ver, setVer ] = replicable(
    'editor.version',
    '0.0.1'
)


import './base/server/explorer'
import './base/server/content'