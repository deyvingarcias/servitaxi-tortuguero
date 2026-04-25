import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const emptyForm = {
  titulo: "",
  descripcion: "",
  imagen_url: "",
  contacto: "",
  activo: true,
};

function Publicidad() {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  const fetchPublicidad = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("publicidad")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setAnuncios(data ?? []);
    } catch (err) {
      setError(err?.message || "No se pudo cargar la publicidad.");
      setAnuncios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicidad();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormVisible(false);
  };

  const handleNew = () => {
    setError("");
    setEditingId(null);
    setForm(emptyForm);
    setFormVisible(true);
  };

  const handleEdit = (anuncio) => {
    setError("");
    setEditingId(anuncio.id);
    setFormVisible(true);
    setForm({
      titulo: anuncio.titulo || "",
      descripcion: anuncio.descripcion || "",
      imagen_url: anuncio.imagen_url || "",
      contacto: anuncio.contacto || "",
      activo: Boolean(anuncio.activo),
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        imagen_url: form.imagen_url.trim(),
        contacto: form.contacto.trim(),
        activo: Boolean(form.activo),
      };

      if (!payload.titulo) {
        throw new Error("El título es obligatorio.");
      }

      if (isEditing) {
        const { error: updateError } = await supabase
          .from("publicidad")
          .update(payload)
          .eq("id", editingId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("publicidad")
          .insert([payload]);

        if (insertError) throw insertError;
      }

      await fetchPublicidad();
      resetForm();
    } catch (err) {
      setError(err?.message || "No se pudo guardar el anuncio.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (anuncio) => {
    const ok = window.confirm(
      `¿Seguro que quieres eliminar el anuncio "${anuncio.titulo || "sin título"}"?`
    );

    if (!ok) return;

    try {
      setActionLoadingId(anuncio.id);
      setError("");

      const { error: deleteError } = await supabase
        .from("publicidad")
        .delete()
        .eq("id", anuncio.id);

      if (deleteError) throw deleteError;

      setAnuncios((prev) => prev.filter((item) => item.id !== anuncio.id));
      if (editingId === anuncio.id) {
        resetForm();
      }
    } catch (err) {
      setError(err?.message || "No se pudo eliminar el anuncio.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleActivo = async (anuncio) => {
    try {
      setActionLoadingId(anuncio.id);
      setError("");

      const nextActivo = !anuncio.activo;

      const { error: updateError } = await supabase
        .from("publicidad")
        .update({ activo: nextActivo })
        .eq("id", anuncio.id);

      if (updateError) throw updateError;

      setAnuncios((prev) =>
        prev.map((item) =>
          item.id === anuncio.id ? { ...item, activo: nextActivo } : item
        )
      );
    } catch (err) {
      setError(err?.message || "No se pudo cambiar el estado del anuncio.");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-6">
        <div className="mx-auto w-full max-w-6xl rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-6">
          <div className="h-8 w-56 animate-pulse rounded bg-zinc-200" />
          <div className="mt-3 h-4 w-80 animate-pulse rounded bg-zinc-200" />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-3xl bg-zinc-50 p-5 ring-1 ring-zinc-200"
              >
                <div className="h-40 animate-pulse rounded-2xl bg-zinc-200" />
                <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-zinc-200" />
                <div className="mt-3 h-4 w-full animate-pulse rounded bg-zinc-200" />
                <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-zinc-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-6">
      <div className="mx-auto w-full max-w-6xl rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-6">
        <div className="border-b border-zinc-200 pb-4">
          <div className="flex flex-col gap-3">
            <div>
              <Link
                to="/admin/reservas"
                className="inline-flex items-center gap-1 rounded-xl bg-zinc-100 px-3 py-1.5 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 transition hover:bg-zinc-200"
              >
                ← Volver a reservas
              </Link>

              <h1 className="mt-4 text-2xl font-bold text-zinc-900">
                Publicidad
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Gestiona anuncios de repuestos y publicidad en el panel.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/admin/reservas"
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100"
              >
                📋 Ver reservas
              </Link>

              <button
                type="button"
                onClick={handleNew}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                + Nuevo anuncio
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-600 ring-1 ring-red-200">
            {error}
          </div>
        ) : null}

        {formVisible ? (
          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-3xl bg-zinc-50 p-5 ring-1 ring-zinc-200 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  {isEditing ? "Editar anuncio" : "Nuevo anuncio"}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Completa los datos del anuncio y guarda los cambios.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-600 ring-1 ring-zinc-200 transition hover:bg-zinc-100"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-zinc-700">
                  Título
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={form.titulo}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  placeholder="Ej. Baterías para moto"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-zinc-700">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  placeholder="Describe el producto o anuncio"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-zinc-700">
                    Imagen URL
                  </label>
                  <input
                    type="url"
                    name="imagen_url"
                    value={form.imagen_url}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-zinc-700">
                    Contacto
                  </label>
                  <input
                    type="text"
                    name="contacto"
                    value={form.contacto}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                    placeholder="WhatsApp, teléfono, Instagram..."
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-3 text-sm font-semibold text-zinc-700">
                <input
                  type="checkbox"
                  name="activo"
                  checked={form.activo}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                Activo
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving
                  ? "Guardando..."
                  : isEditing
                    ? "Guardar cambios"
                    : "Crear anuncio"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 transition hover:bg-zinc-100"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}

        {!error && anuncios.length === 0 ? (
          <div className="mt-6 rounded-3xl bg-zinc-50 p-8 text-center ring-1 ring-zinc-200">
            <p className="text-base font-semibold text-zinc-900">
              No hay anuncios todavía
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Pulsa “Nuevo anuncio” para crear el primero.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {anuncios.map((anuncio) => (
              <article
                key={anuncio.id}
                className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-zinc-200 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-[16/9] w-full bg-zinc-100">
                  {anuncio.imagen_url ? (
                    <img
                      src={anuncio.imagen_url}
                      alt={anuncio.titulo || "Anuncio"}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-medium text-zinc-400">
                      Sin imagen
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-zinc-900">
                        {anuncio.titulo || "Sin título"}
                      </h2>
                      <p className="mt-1 text-sm text-zinc-500">
                        {anuncio.contacto || "Sin contacto"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleActivo(anuncio)}
                      disabled={actionLoadingId === anuncio.id}
                      className={[
                        "inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 transition",
                        anuncio.activo
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100"
                          : "bg-zinc-100 text-zinc-600 ring-zinc-200 hover:bg-zinc-200",
                      ].join(" ")}
                    >
                      {actionLoadingId === anuncio.id
                        ? "..."
                        : anuncio.activo
                          ? "Activo"
                          : "Inactivo"}
                    </button>
                  </div>

                  <p className="mt-4 line-clamp-4 text-sm leading-6 text-zinc-600">
                    {anuncio.descripcion || "Sin descripción"}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-zinc-200 pt-4">
                    <button
                      type="button"
                      onClick={() => handleEdit(anuncio)}
                      className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(anuncio)}
                      disabled={actionLoadingId === anuncio.id}
                      className="inline-flex items-center justify-center rounded-2xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-200 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Publicidad;