import Collapsable from './Collapsable'

export default function AboutSection() {
  return (
    <>
      <hr className='mx-2 my-4 border-t border-t-neutral-800' />

      <Collapsable
        title='Take 6! Game'
        content={
          <>
            <p className='mx-2 my-2 text-justify text-neutral-400'>
              The best way to learn how to play is to jump straight into action! Join an ongoing match, or create a
              room, invite friends and start playing!
            </p>

            <p className='mx-2 my-2 text-justify text-neutral-400'>
              The goal of the game is to{' '}
              <span className='font-bold text-neutral-300'>score as low penalty points as possible</span>. You get
              penalty points for every star on cards you take.
            </p>

            <p className='mx-2 my-2 text-justify text-neutral-400'>
              At the beginning of the game everyone is given 10 cards and there 4 cards already present on the board.
              Each turn, players select a card to play. Players reveal selected cards at the same time. Then, starting
              from lowest score card, players place cards on the board one by one.{' '}
              <span className='font-bold text-neutral-300'>
                Card MUST be placed on a row, where last card is the closest in value to the card that is about to be
                played.
              </span>{' '}
              For example, with rows last cards of 10, 20, 30 and 40, a card with the value of 25 must be placed on 2nd
              row, where the last card value is 20.
            </p>

            <p className='mx-2 my-2 text-justify text-neutral-400'>
              If a card is placed on the row on 6th position, player must take all cards in the row and place their card
              as first of the row. If there is no available row for the card (a card value is lower than every other row
              last cards' values), player has to choose a row, take all cards from selected row, and place their card as
              a first card of this row.{' '}
              <span className='font-bold text-neutral-300'>
                It is usually in your best interest to take cards from row which sums to lowest amount of penalty
                points.
              </span>{' '}
              Once all revealed cards are played, players continue selecting and playing cards by the same rules, until
              there are no cards to play.
            </p>

            <p className='mx-2 my-2 text-justify text-neutral-400'>
              There are cards from 1 to 104 and there are no duplicates. Cards can have penalty points of{' '}
              <span className='font-bold text-slate-400'>1</span>, <span className='font-bold text-sky-400'>2</span>,{' '}
              <span className='font-bold text-green-600'>3</span>, <span className='font-bold text-yellow-500'>5</span>{' '}
              or <span className='font-bold text-red-500'>7</span>.{' '}
              <span className='whitespace-nowrap font-bold text-red-500'>Expert mode</span> is a special mode where
              there are only first <span className='whitespace-nowrap italic'>10 * playerCount + 4</span> cards, e.g.
              when there are 3 players, card deck is from 1 to 34. Game in{' '}
              <span className='whitespace-nowrap font-bold text-red-500'>Expert mode</span> is more strategic, but might
              be less fun for new players.
            </p>
          </>
        }
      />

      <hr className='mx-2 my-4 border-t border-t-neutral-800' />

      <h2 className='mx-3 text-lg font-bold text-neutral-300'>About</h2>

      <p className='mx-2 my-2 text-justify text-neutral-400'>
        Check the{' '}
        <a href='https://en.wikipedia.org/wiki/6_nimmt!' className='t text-blue-400 underline hover:text-blue-300'>
          Wikipedia page
        </a>{' '}
        for more info on the <span className='whitespace-nowrap italic'>6 nimmt!</span> game.
      </p>

      {/* TODO: Icon */}
      <p className='mx-2 my-2 text-neutral-400'>
        GitHub: <span className='italic text-neutral-600'>coming</span>
      </p>

      {/* TODO: Icon */}
      <p className='mx-2 my-2 text-neutral-400'>
        Discord: <span className='italic text-neutral-600'>coming</span>
      </p>
    </>
  )
}
