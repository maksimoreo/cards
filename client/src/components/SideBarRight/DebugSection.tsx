import { faChampagneGlasses, faPen } from '@fortawesome/free-solid-svg-icons'
import { LOCAL_STORAGE_KEY__SERVER_URL } from '../../const'
import useParty from '../../hooks/useParty'
import Button from '../Button'

export default function DebugSection() {
  const { party } = useParty()

  return (
    <>
      <hr className='mx-2 my-4 border-t border-t-neutral-800' />

      <h2 className='mx-3 text-lg font-bold text-neutral-300'>Debug</h2>

      <Button
        iconProps={{ icon: faPen }}
        onClick={() => {
          localStorage.setItem(LOCAL_STORAGE_KEY__SERVER_URL, 'http://localhost:5000')
        }}
      >
        Set server IP to "http://localhost:5000"
      </Button>

      {import.meta.env.VITE_SET_SERVER_ADDRESS_BUTTON ? (
        <Button
          iconProps={{ icon: faPen }}
          onClick={() => {
            localStorage.setItem(LOCAL_STORAGE_KEY__SERVER_URL, import.meta.env.VITE_SET_SERVER_ADDRESS_BUTTON)
          }}
        >
          Set server IP to "{import.meta.env.VITE_SET_SERVER_ADDRESS_BUTTON}"
        </Button>
      ) : (
        <p className='text-center text-sm italic text-neutral-400'>
          Server address is not set - please set VITE_SET_SERVER_ADDRESS_BUTTON env variable
        </p>
      )}

      <Button iconProps={{ icon: faChampagneGlasses }} onClick={party} color='success'>
        Party
      </Button>

      <hr className='mx-2 my-4 border-t border-t-neutral-800' />

      <h2 className='mx-3 text-lg font-bold text-neutral-300'>localStorage</h2>

      <ul>
        <li className='mx-4 text-neutral-400'>
          {LOCAL_STORAGE_KEY__SERVER_URL}: {localStorage.getItem(LOCAL_STORAGE_KEY__SERVER_URL)}
        </li>
      </ul>
    </>
  )
}
