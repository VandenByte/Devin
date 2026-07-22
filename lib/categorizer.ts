import { Category } from "./types";

/**
 * Ordered keyword rules. The first category whose keywords match the
 * (normalized) description wins. More specific categories are listed before
 * broad ones so that, e.g., "YPF FULL" maps to Combustible rather than a
 * generic match.
 */
const RULES: { category: Category; keywords: string[] }[] = [
  {
    category: "Combustible",
    keywords: ["ypf", "shell", "axion", "puma energy", "estacion", "estación", "gnc", "petrobras", "combustible", "nafta"],
  },
  {
    category: "Supermercado",
    keywords: [
      "coto", "carrefour", "jumbo", "dia %", "supermercado", "super ", "walmart",
      "chango", "vea", "disco", "la anonima", "la anónima", "mayorista", "makro", "vital",
    ],
  },
  {
    category: "Restaurantes",
    keywords: [
      "restaurant", "resto", "mcdonald", "burger", "starbucks", "cafe", "café", "bar ",
      "pizzeria", "pizzería", "parrilla", "rappi", "pedidosya", "pedidos ya", "uber eats",
      "mostaza", "kfc", "subway", "havanna", "confiteria", "confitería", "cerveceria", "cervecería",
    ],
  },
  {
    category: "Transporte",
    keywords: [
      "uber", "cabify", "didi", "sube", "taxi", "remis", "peaje", "autopista", "subte",
      "estacionamiento", "parking", "aparcamiento",
    ],
  },
  {
    category: "Viajes",
    keywords: [
      "aerolineas", "aerolíneas", "latam", "flybondi", "jetsmart", "despegar", "booking",
      "airbnb", "hotel", "hostel", "expedia", "avianca", "american airlines", "iberia", "aeropuerto",
    ],
  },
  {
    category: "Servicios",
    keywords: [
      "edenor", "edesur", "metrogas", "aysa", "telecom", "movistar", "claro", "personal",
      "netflix", "spotify", "disney", "hbo", "amazon prime", "youtube premium", "google storage",
      "icloud", "internet", "fibertel", "telecentro", "luz", "gas ", "agua ", "seguro", "prepaga",
    ],
  },
  {
    category: "Salud",
    keywords: [
      "farmacia", "farmacity", "hospital", "clinica", "clínica", "sanatorio", "medico", "médico",
      "laboratorio", "odontolog", "optica", "óptica", "osde", "swiss medical", "galeno",
    ],
  },
  {
    category: "Entretenimiento",
    keywords: [
      "cine", "cinemark", "hoyts", "showcase", "teatro", "steam", "playstation", "xbox", "nintendo",
      "twitch", "concierto", "entrada", "ticketek", "ticketportal",
    ],
  },
  {
    category: "Ropa",
    keywords: [
      "zara", "h&m", "nike", "adidas", "levis", "levi's", "indumentaria", "shopping", "outlet",
      "ropa", "calzado", "zapateria", "zapatería", "topper", "puma ",
    ],
  },
  {
    category: "Tecnología",
    keywords: [
      "apple", "samsung", "mercadolibre", "mercado libre", "fravega", "frávega", "garbarino",
      "musimundo", "compumundo", "tienda tech", "notebook", "celular", "electronico", "electrónico",
    ],
  },
  {
    category: "Educación",
    keywords: [
      "universidad", "colegio", "escuela", "instituto", "curso", "udemy", "coursera", "platzi",
      "libreria", "librería", "educacion", "educación",
    ],
  },
  {
    category: "Hogar",
    keywords: [
      "sodimac", "easy", "ferreteria", "ferretería", "mueble", "hogar", "deco", "bazar",
      "electrodomestico", "electrodoméstico",
    ],
  },
];

/**
 * Normalizes text for keyword matching: lowercases and collapses whitespace.
 * Accents are preserved so rules can match either accented or unaccented
 * variants explicitly.
 */
export function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Detects a spending category from a transaction description using an ordered
 * set of keyword rules. Returns "Otros" when nothing matches.
 */
export function categorize(description: string): Category {
  const normalized = normalize(description);
  if (!normalized) return "Otros";

  for (const rule of RULES) {
    for (const keyword of rule.keywords) {
      if (normalized.includes(keyword)) {
        return rule.category;
      }
    }
  }
  return "Otros";
}
