import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./lib/supabase";

function App() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main>
        {/* HERO */}
        <section className="bg-gradient-to-br from-emerald-600 to-red-600 px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
              <span>🚖</span>
              <span>Servicio de transporte bajo demanda</span>
            </div>

            <div className="max-w-2xl">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                ServiTaxi Tortuguero
              </h1>
              <p className="mt-5 max-w-xl text-lg text-white/90 sm:text-xl">
                Taxis rápidos y camión de carga para moverte y transportar mercancía
                en Tortuguero, Nicaragua.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/reservar"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-base font-bold text-emerald-700 shadow-lg transition hover:scale-[1.01] hover:bg-zinc-100"
              >
                Reservar ahora
              </Link>
              <a
                href="#servicios"
                className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 py-4 text-base font-semibold text-white backdrop-blur transition hover:bg-white/15"
              >
                Ver servicios
              </a>
            </div>

            <div className="grid w-full gap-4 pt-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
                <p className="text-sm text-white/80">Atención</p>
                <p className="mt-1 text-lg font-semibold">Rápida y directa</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
                <p className="text-sm text-white/80">Cobertura</p>
                <p className="mt-1 text-lg font-semibold">Tortuguero y alrededores</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
                <p className="text-sm text-white/80">Servicio</p>
                <p className="mt-1 text-lg font-semibold">Taxi y carga</p>
              </div>
            </div>
          </div>
        </section>

        {/* SERVICIOS */}
        <section id="servicios" className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                Servicios
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Elige el servicio que necesitas
              </h2>
              <p className="mt-4 text-zinc-600">
                Dos opciones pensadas para resolver tus traslados y envíos de forma
                simple, rápida y sin complicaciones.
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">
                    🚕
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Taxi</h3>
                    <p className="mt-1 text-zinc-600">
                      Viajes rápidos, cómodos y prácticos para moverte dentro y fuera
                      de Tortuguero.
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-3xl">
                    🚚
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Camión de carga</h3>
                    <p className="mt-1 text-zinc-600">
                      Transporte de mercancía, bultos y carga para negocios o
                      necesidades personales.
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 sm:p-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
                Cómo funciona
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Reservar es muy fácil
              </h2>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <StepCard
                number="1"
                title="Escanea el QR o entra a la web"
                description="Accede desde tu móvil o computadora en segundos."
              />
              <StepCard
                number="2"
                title="Rellena el formulario"
                description="Indica origen, destino, fecha y el tipo de servicio."
              />
              <StepCard
                number="3"
                title="Nos ponemos en contacto"
                description="Confirmamos tu solicitud y coordinamos el servicio."
              />
            </div>
          </div>
        </section>

        <PublicidadSection />

        {/* CTA FINAL */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl rounded-3xl bg-zinc-950 px-6 py-12 text-white sm:px-8 sm:py-14">
            <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
                  Reserva hoy
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  Muévete con tranquilidad en Tortuguero.
                </h2>
                <p className="mt-4 max-w-2xl text-zinc-300">
                  Ya sea un viaje corto, un traslado especial o carga para tu negocio,
                  estamos listos para ayudarte.
                </p>
              </div>

              <div className="flex lg:justify-end">
                <Link
                  to="/reservar"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-red-600 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:opacity-95 sm:w-auto"
                >
                  Reservar ahora
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 border-t border-zinc-200 pt-6 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-zinc-900">ServiTaxi Tortuguero</p>
            <p>Tortuguero, Nicaragua</p>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin/reservas" className="text-xs text-zinc-300">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PublicidadSection() {
  const [anuncios, setAnuncios] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadPublicidad = async () => {
      const { data, error } = await supabase
        .from("publicidad")
        .select("id, titulo, descripcion, imagen_url, contacto, activo, created_at")
        .eq("activo", true)
        .order("created_at", { ascending: false });

      if (error) {
        return;
      }

      if (!mounted) return;
      setAnuncios(data ?? []);
    };

    loadPublicidad();

    return () => {
      mounted = false;
    };
  }, []);

  if (anuncios.length === 0) return null;

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
            Publicidad
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Repuestos y servicios
          </h2>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {anuncios.map((anuncio) => (
            <article
              key={anuncio.id}
              className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200"
            >
              {anuncio.imagen_url ? (
                <img
                  src={anuncio.imagen_url}
                  alt={anuncio.titulo || "Publicidad"}
                  className="mb-4 h-48 w-full rounded-2xl object-cover"
                />
              ) : null}

              <h3 className="text-xl font-bold text-zinc-900">
                {anuncio.titulo || "Sin título"}
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {anuncio.descripcion || "Sin descripción"}
              </p>

              <p className="mt-4 text-sm font-semibold text-zinc-700">
                📞 {anuncio.contacto || "Sin contacto"}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ number, title, description }) {
  return (
    <div className="rounded-3xl bg-zinc-50 p-5 ring-1 ring-zinc-200">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-bold text-white">
          {number}
        </div>
        <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-600">{description}</p>
    </div>
  );
}

export default App;