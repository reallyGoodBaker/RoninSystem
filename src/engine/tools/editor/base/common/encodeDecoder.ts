import { Replicables } from "../../config/replicables.config"

export interface EncodeDecoder<T> {
    encode(data: T): Uint8Array
    decode(data: Uint8Array): T
}

export const jsonEncodeDecoder: EncodeDecoder<any> = {
    encode: (data: any) => {
        return new TextEncoder().encode(JSON.stringify(data))
    },
    decode: (data: Uint8Array) => {
        return JSON.parse(new TextDecoder().decode(data))
    }
}

export const replicableEncodeDecoder: EncodeDecoder<{ uri: string, data: Uint8Array }> = {
    encode: ({ uri, data }) => {
        const index = Replicables.indexOf(uri)
        if (index === -1) {
            // 当 URI 不在 Replicables 中时，返回一个有效的 4 字节数组
            const buff = new ArrayBuffer(4)
            const dataView = new DataView(buff)
            dataView.setUint32(0, 0xFFFFFFFF) // 使用最大 uint32 值作为无效标记
            return new Uint8Array(buff)
        }

        const buff = new ArrayBuffer(data.byteLength + 4)
        const dataView = new DataView(buff)
        dataView.setUint32(0, index)
        const uint8View = new Uint8Array(buff)
        uint8View.set(new Uint8Array(data), 4)
        return uint8View
    },
    decode: (data: Uint8Array) => {
        if (data.byteLength < 4) {
            throw new Error('Invalid data format: data too short')
        }
        const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength)
        const index = dataView.getUint32(0)
        
        // 检查是否为无效标记
        if (index === 0xFFFFFFFF) {
            throw new Error('Invalid URI: URI not found in Replicables')
        }
        
        if (index >= Replicables.length) {
            throw new Error(`Invalid index: ${index}`)
        }
        const uri = Replicables[index]
        const uint8View = new Uint8Array(data.buffer, data.byteOffset + 4, data.byteLength - 4)
        return { uri, data: uint8View }
    }
}
