# Gastos — Registro de gastos desde resúmenes de tarjeta

Aplicación web para registrar gastos importando el **PDF del resumen de tus
tarjetas**. Extrae automáticamente las transacciones (fecha, descripción y
monto) y las **categoriza** mediante reglas locales (sin costo ni dependencia
de servicios externos).

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** para la UI
- **Prisma** + **SQLite** para persistencia
- **pdf-parse** para extraer texto del PDF
- **Vitest** para tests unitarios

## Cómo funciona

1. Subís el PDF del resumen desde la interfaz.
2. `lib/pdf.ts` extrae el texto del PDF.
3. `lib/parser.ts` detecta las líneas de transacciones (fecha al inicio,
   monto al final) y arma cada movimiento.
4. `lib/categorizer.ts` asigna una categoría según palabras clave del comercio.
5. Las transacciones se guardan en SQLite y se muestran en una tabla donde
   podés corregir la categoría manualmente y ver el resumen por categoría.

La categorización usa reglas locales. La arquitectura queda preparada para
enchufar un LLM opcional en el futuro reemplazando `categorize()`.

## Puesta en marcha

```bash
npm install
cp .env.example .env          # define DATABASE_URL (SQLite por defecto)
npx prisma migrate dev        # crea la base de datos local
npm run dev                   # http://localhost:3000
```

## Scripts

| Comando            | Descripción                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Servidor de desarrollo               |
| `npm run build`    | Build de producción                  |
| `npm run lint`     | ESLint                               |
| `npm test`         | Tests unitarios (Vitest)             |
| `npm run test:watch` | Tests en modo watch                |

## Tests

Los tests cubren la lógica pura (la parte más importante y propensa a errores):

- `tests/parser.test.ts` — parseo de montos (formatos `1.234,56` y `1,234.56`,
  negativos, paréntesis) y extracción de transacciones desde texto.
- `tests/categorizer.test.ts` — detección de categorías por palabras clave.
- `tests/summary.test.ts` — agregación de totales por categoría.

## Notas

- App pensada para **un solo usuario** por ahora (sin login). La estructura
  permite agregar autenticación y multiusuario más adelante.
- Los formatos de resumen varían entre bancos; si un PDF no se detecta bien,
  se pueden ampliar las heurísticas en `lib/parser.ts` y las reglas en
  `lib/categorizer.ts`.
