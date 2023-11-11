import Row, { CardsFieldRow } from './Row'

interface Props {
  readonly rows: readonly CardsFieldRow[]
  readonly allowSelectRow: boolean
  readonly onRowSelected: (rowIndex: number) => void
}

export default function CardsField({ rows, allowSelectRow, onRowSelected }: Props): JSX.Element {
  return (
    <ul className='px-2 py-1'>
      {rows.map((row, rowIndex) => (
        <li key={rowIndex}>
          <Row cardsFieldRow={row} allowClick={allowSelectRow} onClick={(): void => onRowSelected(rowIndex)} />
        </li>
      ))}
    </ul>
  )
}
