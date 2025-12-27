export class Dance {
    constructor(name) {
        this.name = name
    }

    async do(danceMaster) {
        throw new Error("Must be implemented by subclass")
    }
}

export class FigureDance extends Dance {
    constructor(name) {
        super(name)
        this.figures = {}
        this.bodies = {}
        this.steps = (figureDance) => {
            console.log("No steps defined")
            return []
        }
    }

    withBody(name, body) {
        this.bodies[name] = body
        return this
    }

    withFigure(name, moveSet) {
        this.figures[name] = moveSet
        return this
    }

    withSteps(steps) {
        this.steps = steps
        return this
    }

    async do(danceMaster) {
        const steps = this.steps(this);
        for (const step of steps) {
            await step.do(danceMaster)
            danceMaster.normalizeDancerRotations();
        }
    }
}

export class CeiliDance extends Dance {
    constructor(name) {
        super(name)
        this.moves = null
    }

    withMoves(moveSet) {
        this.moveSet = moveSet
        return this
    }

    async do(danceMaster) {
        await this.moveSet.do(danceMaster)
    }
}