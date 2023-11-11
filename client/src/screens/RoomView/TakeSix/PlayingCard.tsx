import { faStar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Card } from './types'

interface ColorTheme {
  readonly backgroundColor: string
  readonly borderColor: string
  readonly textColor: string
  readonly starColor: string
}

const colorThemes: Record<number, ColorTheme> = {
  1: {
    backgroundColor: 'bg-slate-500 lg:bg-slate-800',
    borderColor: 'bg-slate-500',
    textColor: 'text-slate-300',
    starColor: 'text-slate-800',
  },
  2: {
    backgroundColor: 'bg-sky-700 lg:bg-slate-800',
    borderColor: 'bg-sky-700',
    textColor: 'text-sky-300',
    starColor: 'text-slate-800',
  },
  3: {
    backgroundColor: 'bg-green-600 lg:bg-green-900',
    borderColor: 'bg-green-600',
    textColor: 'text-green-200',
    starColor: 'text-green-900',
  },
  5: {
    backgroundColor: 'bg-yellow-600 lg:bg-yellow-900',
    borderColor: 'bg-yellow-600',
    textColor: 'text-yellow-200',
    starColor: 'text-yellow-300',
  },
  7: {
    backgroundColor: 'bg-red-600 lg:bg-red-900',
    borderColor: 'bg-red-600',
    textColor: 'text-red-100',
    starColor: 'text-red-100',
  },
}

function renderStars(count: number): JSX.Element {
  return (
    <div className='flex flex-row justify-center'>
      {[...Array(count)].map((_item, index) => (
        <FontAwesomeIcon key={index} icon={faStar} className='t h-2 w-2 lg:h-3 lg:w-3' />
      ))}
    </div>
  )
}

type Props =
  | {
      readonly value: number
      readonly penaltyPoints: number
    }
  | {
      readonly card: Card
    }

export default function PlayingCard(props: Props): JSX.Element {
  const { value, penaltyPoints } = 'card' in props ? props.card : props

  const colorTheme = colorThemes[penaltyPoints] ?? colorThemes[1]

  const { starColor } = colorTheme

  return (
    <div
      className={`h-14 w-10 lg:h-28 lg:w-20 ${colorTheme.borderColor} flex flex-col rounded p-1 drop-shadow-lg lg:rounded-lg`}
    >
      <div
        className={`rounded-sm lg:rounded ${colorTheme.backgroundColor} mb-1 flex grow flex-col justify-center text-center`}
      >
        <div className={`text-xl lg:text-4xl ${colorTheme.textColor} font-bold`}>{value}</div>
      </div>
      <div className={`flex h-3 flex-col justify-center lg:h-6 ${starColor}`}>
        {penaltyPoints === 7 ? (
          <>
            {renderStars(3)}
            {renderStars(4)}
          </>
        ) : penaltyPoints === 5 ? (
          <>
            {renderStars(2)}
            {renderStars(3)}
          </>
        ) : (
          renderStars(penaltyPoints)
        )}
      </div>
    </div>
  )
}
