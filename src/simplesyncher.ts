import debug from 'debug'

const log = debug("util:syncher")

interface queuedFunction {
    fn:Function
    res:Function
    rej:Function
}

interface syncherOpts {
    onlyOne:boolean
}

/**
 * SimpleActor is used to serialize function calls, it is a single threaded
 * actor that does one function after the next. Every send returns a promise
 * that is executed after the serialization
 */
export class SimpleSyncher {
    private queue:queuedFunction[]
    private started:boolean
    private name?:string
    private onlyOne:boolean

    constructor(name?:string, opts?:syncherOpts) {
        this.started = false
        this.queue = []
        this.name = name
        this.onlyOne = false

        if (opts) {
            this.onlyOne = opts.onlyOne
        }
    }

    private async run() {
        const queuedFn = this.queue.pop()
        if (queuedFn === undefined) {
            log(this.name, ' stopping syncher')
            this.started = false
            return
        }
        try {
            log(this.name, ' run fn', queuedFn.fn.toString())
            const resp = await queuedFn.fn()
            log(this.name, ' finish fn')
            queuedFn.res(resp)
        } catch(err) {
            log(this.name, ' rejecting: ', err)
            queuedFn.rej(err)
        }
        if (this.queue.length > 0) {
            log(this.name, "syncher queueing another")
            this.run()
        } else {
            this.started = false
        }
    }

    send(fn:Function) {
        const p = new Promise((resolve,reject) => {
            const queueFn = {
                fn:fn,
                res: resolve,
                rej:reject,
            }

            if (this.onlyOne) {
                this.queue = [queueFn]
            } else {
                this.queue.push(queueFn)
            }
          
            if (!this.started) {
                log(this.name, " not started, starting")
                this.started = true
                this.run()
                return
            }
            log(this.name, ' run already started')
        })
       
        return p
    }


}