type Listener = (...args: any[]) => void | Promise<void>;

interface LinkedListNode {
    prev: LinkedListNode | null;
    next: LinkedListNode | null;
    listener?: Listener;
    rawListener?: Listener;
}

export class EventLinked implements Iterable<LinkedListNode> {
    static map = new Map<Listener, LinkedListNode>()

    readonly HEAD: LinkedListNode = {
        prev: null,
        next: null
    }

    private END: LinkedListNode = this.HEAD;
    count = 0

    append(listener: Listener, rawListener?: Listener) {
        const prev = this.END
        const cur = {
            prev, listener, rawListener, next: null,
        }
        
        cur.prev = prev
        cur.listener = listener
        cur.rawListener = rawListener
        cur.next = null

        prev.next = cur
        this.END = cur

        EventLinked.map.set(rawListener || listener, cur)

        this.count++

        return this
    }

    prepend(listener: Listener, rawListener?: Listener) {
        const prev = this.HEAD
        const next = prev.next

        const cur = {
            prev, listener, rawListener, next
        }

        prev.next = cur

        if (next) {
            next.prev = cur
        }

        EventLinked.map.set(rawListener || listener, cur)

        this.count++

        return this
    }

    delete(rawListener: Listener) {
        let map = EventLinked.map,
            cur = map.get(rawListener)

        if (!cur || !cur.prev) {
            return
        }

        let pre = cur.prev
        pre.next = cur.next
        if (cur.next) {
            cur.next.prev = pre
        }

        map.delete(rawListener)

        this.count--

        requestIdleCallback(() => {
            cur.prev = null
            cur.next = null
        })

        return this
    }

    deleteAll() {
        let node = this.HEAD
        while (node = node.next as LinkedListNode) {
            node.prev = null
            node.next = null
            EventLinked.map.delete(node.rawListener || node.listener as any)
        }

        this.HEAD.next = null
        this.count = 0

        return this
    }
    

    [Symbol.iterator]() {
        let ptr: LinkedListNode = this.HEAD

        return {
            next(): IteratorResult<LinkedListNode> {           
                if (ptr.next) {
                    ptr = ptr.next
                } else {
                    return {
                        value: ptr,
                        done: true,
                    }
                }

                return {
                    value: ptr,
                    done: false
                }
            }
        }
    }

}
