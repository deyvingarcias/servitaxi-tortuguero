import { Link } from "react-router-dom";

function App() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold text-emerald-600">
        ServiTaxi Tortuguero 🚕
      </h1>

      <p className="text-zinc-600 text-center max-w-md">
        Servicio de transporte bajo demanda en Tortuguero, Nicaragua.
      </p>

      <div className="flex gap-4">
        <Link
          to="/reservar"
          className="px-5 py-3 bg-emerald-600 text-white rounded-2xl font-semibold"
        >
          Reservar taxi
        </Link>

        <Link
          to="/admin/reservas"
          className="px-5 py-3 bg-zinc-900 text-white rounded-2xl font-semibold"
        >
          Admin
        </Link>
      </div>
    </div>
  );
}

export default App;