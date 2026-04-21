import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

function Reservas() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservas = async () => {
      const { data, error } = await supabase
        .from("reservas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setReservas(data);
      }

      setLoading(false);
    };

    fetchReservas();
  }, []);

  if (loading) {
    return <p className="p-4">Cargando reservas...</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reservas</h1>

      <div className="space-y-4">
        {reservas.map((reserva) => (
          <div key={reserva.id} className="p-4 bg-white rounded-xl shadow">
            <p><strong>Cliente:</strong> {reserva.cliente_nombre}</p>
            <p><strong>Teléfono:</strong> {reserva.cliente_telefono}</p>
            <p><strong>Ruta:</strong> {reserva.origen} → {reserva.destino}</p>
            <p><strong>Fecha:</strong> {reserva.fecha_hora}</p>
            <p><strong>Estado:</strong> {reserva.estado}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Reservas;