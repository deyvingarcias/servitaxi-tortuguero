export const LUGARES = [
  "Tortuguero",
  "El Salto",
  "El Capirote",
  "Miguel González",
  "La Antena",
  "Walpapina",
  "Marrón",
  "Amán Pérez",
  "Wapi",
  "Rama",
  "Santos Pérez",
];

// Alias por compatibilidad con imports antiguos
export const DESTINOS = LUGARES;

// Precios en córdobas. La clave es "LugarA|LugarB" (siempre alfabético para que funcione en ambos sentidos)
export const PRECIOS = {
  "El Salto|Tortuguero": 50,
  "El Capirote|Tortuguero": 70,
  "Miguel González|Tortuguero": 100,
  "La Antena|Tortuguero": 100,
  "Tortuguero|Walpapina": 100,
  "Marrón|Tortuguero": 150,
  "Amán Pérez|Tortuguero": 200,
  "Tortuguero|Wapi": 250,
  "Rama|Tortuguero": 350,
};

export function getPrecio(origen, destino) {
  if (!origen || !destino) return null;
  const key = [origen, destino].sort().join("|");
  return PRECIOS[key] ?? null; // null = precio a negociar
}