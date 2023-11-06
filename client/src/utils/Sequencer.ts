type Timer = ReturnType<typeof setTimeout>

export interface StepContext {
  readonly sequencer: Sequencer
}

interface Step {
  readonly duration: number
  readonly callback: (stepContext: StepContext) => void
}

interface Options {
  readonly steps: readonly Step[]
}

// Deal: describe a sequence of steps, get an api to pause/resume/stop steps, insert new steps in between
export default class Sequencer {
  private timer: Timer | undefined
  private readonly steps: Step[]
  private currentStepIndex: number

  constructor({ steps }: Options) {
    this.steps = [...steps]
    this.currentStepIndex = 0
  }

  public play(): void {
    if (this.timer) {
      throw Error('Already playing')
    }

    this.executeCurrentStepAndScheduleNext()
  }

  public cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer)
    }
  }

  public insertNextStep(step: Step): void {
    this.steps.splice(this.currentStepIndex + 1, 0, step)
  }

  public insertNextSteps(steps: readonly Step[]): void {
    this.steps.splice(this.currentStepIndex + 1, 0, ...steps)
  }

  private executeCurrentStepAndScheduleNext(): void {
    const currentStep = this.steps[this.currentStepIndex]

    currentStep.callback({ sequencer: this })

    this.currentStepIndex += 1

    if (this.currentStepIndex < this.steps.length) {
      this.timer = setTimeout(() => this.executeCurrentStepAndScheduleNext(), currentStep.duration)
    }
  }
}
