import { replicable } from "./replicator"

const [ contentPath, setContentPath ] = replicable('content.path', '')
const [ contentType, setContentType ] = replicable('content.type', '')
const [ textContent, setTextContent ] = replicable('content.text', '')
const [ bufferContent, setBufferContent ] = replicable('content.buffer', new ArrayBuffer())

