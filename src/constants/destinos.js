export const LUGARES = [
  "Tortuguero", "El Salto", "El Capirote", "Miguel González",
  "La Antena", "La Escuelita", "La Subestación", "Walpapina", "Marrón", "Amán Pérez", "Wapi", "Rama", "Santos Pérez",
];

export const DESTINOS = LUGARES;

export const PRECIOS = {
  // Desde/hacia Tortuguero
  "El Salto|Tortuguero": 50,
  "El Capirote|Tortuguero": 70,
  "Miguel González|Tortuguero": 100,
  "La Antena|Tortuguero": 100,
  "Tortuguero|Walpapina": 100,
  "Marrón|Tortuguero": 150,
  "Amán Pérez|Tortuguero": 200,
  "Tortuguero|Wapi": 250,
  "Rama|Tortuguero": 350,

  // Entre pueblos (sin Tortuguero)
  "El Salto|La Antena": 50,
  "El Salto|Walpapina": 50,
  "El Salto|Marrón": 100,
  "Marrón|Walpapina": 50,

  // Hacia Wapi
  "El Salto|Wapi": 200,
  "La Antena|Wapi": 150,
  "Walpapina|Wapi": 150,
  "Marrón|Wapi": 100,
  "Amán Pérez|Wapi": 100,

  // Hacia Rama
  "El Salto|Rama": 300,
  "Miguel González|Rama": 300,
  "La Antena|Rama": 250,
  "Rama|Walpapina": 250,
  "Marrón|Rama": 200,
  "Amán Pérez|Rama": 150,
};

export function getPrecio(origen, destino) {
  if (!origen || !destino) return null;
  const key = [origen, destino].sort().join("|");
  return PRECIOS[key] ?? null;
}