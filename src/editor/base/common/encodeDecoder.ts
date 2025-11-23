import { Replicables } from "../../config/replicables.config"

export interface EncodeDecoder<T> {
    encode(data: T): ArrayBuffer
    decode(data: ArrayBuffer): T
}

export const jsonEncodeDecoder: EncodeDecoder<any> = {
    encode: (data: any) => {
        return new TextEncoder().encode(JSON.stringify(data)).buffer
    },
    decode: (data: ArrayBuffer) => {
        return JSON.parse(new TextDecoder().decode(data))
    }
}

export const replicableEncodeDecoder: EncodeDecoder<{ uri: string, data: ArrayBuffer }> = {
    encode: ({ uri, data }) => {
        const index = Replicables.indexOf(uri)
        if (index === -1) {
            // 当 URI 不在 Replicables 中时，返回一个有效的 4 字节数组
            const buff = new ArrayBuffer(4)
            const dataView = new DataView(buff)
            dataView.setUint32(0, 0xFFFFFFFF) // 使用最大 uint32 值作为无效标记
            return buff
        }

        const buff = new ArrayBuffer(data.byteLength + 4)
        const dataView = new DataView(buff)
        dataView.setUint32(0, index)
        const uint8View = new Uint8Array(buff)
        uint8View.set(new Uint8Array(data), 4)
        return uint8View.buffer
    },
    decode: (data: ArrayBuffer) => {
        if (data.byteLength < 4) {
            throw new Error('Invalid data format: data too short')
        }
        const dataView = new DataView(data)
        const index = dataView.getUint32(0)
        
        // 检查是否为无效标记
        if (index === 0xFFFFFFFF) {
            throw new Error('Invalid URI: URI not found in Replicables')
        }
        
        if (index >= Replicables.length) {
            throw new Error(`Invalid index: ${index}`)
        }
        const uri = Replicables[index]
        // 创建数据的独立副本，避免内存共享问题
        const dataBytes = new Uint8Array(data, 4, data.byteLength - 4)
        const dataCopy = new ArrayBuffer(dataBytes.length)
        new Uint8Array(dataCopy).set(dataBytes)
        return { uri, data: dataCopy }
    }
}
