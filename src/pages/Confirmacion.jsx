import { useNavigate } from 'react-router-dom'

function Confirmacion() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl p-8 shadow-sm ring-1 ring-zinc-200 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">¡Reserva confirmada!</h1>
        <p className="text-zinc-500 text-sm mb-6">
          Hemos recibido tu solicitud. Lenin se pondrá en contacto contigo pronto para confirmar el viaje.
        </p>
        <button
          onClick={() => navigate('/reservar')}
          className="w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition"
        >
          Hacer otra reserva
        </button>
      </div>
    </div>
  )
}

export default Confirmacion