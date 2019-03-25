const w : number = window.innerWidth
const h : number = window.innerHeight
const scGap : number = 0.05
const scDiv : number = 0.51
const strokeFactor : number = 90
const sizeFactor : number = 2.9
const nodes : number = 5
const lines : number = 2
const backColor : string = "#bdbdbd"
const foreColor : string = "#673AB7"
const angle : number = Math.PI / 3
const offFactor : number = 5

const scaleFactor : Function = (scale : number) : number => Math.floor(scale / scDiv)
const maxScale : Function = (scale : number, i : number, n : number) : number => {
    return Math.max(0, scale - i / n)
}
const divideScale : Function = (scale : number, i : number, n : number) : number => {
    return Math.min(1 / n, maxScale(scale, i, n)) * n
}
const mirrorValue : Function = (scale : number, a : number, b : number) : number => {
    const k : number = scaleFactor(scale)
    return (1 - k) / a + k / b
}
const updateValue : Function = (scale : number, dir : number, a : number, b : number) : number => {
    return mirrorValue(scale, a, b) * dir * scGap
}

const drawUASNode : Function = (context : CanvasRenderingContext2D, i : number, scale : number) => {
    const gap : number = w / (nodes + 1)
    const size : number = gap / sizeFactor
    const hoff : number = size / offFactor
    const sc1 : number = divideScale(scale, 0, 2)
    const sc2 : number = divideScale(scale, 1, 2)
    context.lineCap = 'round'
    context.lineWidth = Math.min(w, h) / strokeFactor
    context.strokeStyle = foreColor
    context.save()
    context.translate(gap * (i + 1), h / 2 - (h - hoff / 2) * sc2)
    context.rotate((i % 2) * Math.PI)
    context.beginPath()
    context.moveTo(0, size)
    context.lineTo(0, -(size - hoff))
    context.stroke()
    for (var j = 0; j < lines; j++) {
        context.save()
        context.translate(0, -(size - hoff))
        context.rotate((1 - 2 * j) * Math.PI / 3)
        context.beginPath()
        context.moveTo(0, 0)
        context.lineTo(0, -hoff)
        context.stroke()
        context.restore()
    }
    context.restore()
}

class UpStickingArrowStage {
      canvas : HTMLCanvasElement = document.createElement('canvas')
      context : CanvasRenderingContext2D

      initCanvas() {
          this.canvas.width = w
          this.canvas.height = h
          this.context = this.canvas.getContext('2d')
          document.body.appendChild(this.canvas)
      }

      render() {
          this.context.fillStyle = backColor
          this.context.fillRect(0, 0, w, h)
      }

      handleTap() {
          this.canvas.onmousedown = () => {

          }
      }

      static init() {
          const stage : UpStickingArrowStage = new UpStickingArrowStage()
          stage.initCanvas()
          stage.render()
          stage.handleTap()
      }
}

class State {
    scale : number = 0
    prevScale : number = 0
    dir : number = 0

    update(cb : Function) {
        this.scale += updateValue(this.scale, this.dir, lines, 1)
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {

    animated : boolean = false
    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, 50)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class UASNode {
    prev : UASNode
    next : UASNode
    state : State = new State()

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new UASNode(this.i + 1)
            this.next.prev = this
        }
    }

    draw(context : CanvasRenderingContext2D) {
        drawUASNode(context, this.i, this.state.scale)
        if (this.next) {
            this.next.draw(context)
        }
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : UASNode {
        var curr : UASNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class UpStickingArrow {

    root : UASNode = new UASNode(0)
    curr : UASNode = this.root
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        this.root.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}
