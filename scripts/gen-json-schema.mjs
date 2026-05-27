// Generador JSON Schema desde schemas Zod.
//
// Itera todos los *Schema exportados por dist/index.js (Zod v4),
// corre z.toJSONSchema con target openapi-3.0 y escribe:
//   - dist/json-schema/<name>.json   (un archivo por schema)
//   - dist/json-schema/index.json    (bundle único con todos los $defs)
//
// Pipeline para D42 (spec subset autoritativo): el spec
// hub-edge-contract.yaml referencia estos JSON Schemas via $ref.
// Zod sigue siendo single source of truth.
//
// Pre-requisito: dist/ ya compilado (npm run build). El prepare hook
// del paquete encadena tsc + gen:json-schema en ese orden.
//
// Uso:
//   npm run gen:json-schema                         # genera todos
//   npm run gen:json-schema -- --only=Acceso,Permiso --verbose

import { z } from "zod";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import * as Modelos from "../dist/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const OUT_DIR = join(REPO_ROOT, "dist", "json-schema");

function parseArgs(argv) {
  const only = [];
  let verbose = false;
  for (const arg of argv.slice(2)) {
    if (arg === "--verbose" || arg === "-v") verbose = true;
    else if (arg.startsWith("--only=")) {
      only.push(...arg.slice("--only=".length).split(",").filter(Boolean));
    }
  }
  return { only: only.length ? only : null, verbose };
}

function isZodSchema(value) {
  return (
    !!value &&
    typeof value === "object" &&
    "_zod" in value
  );
}

function main() {
  const args = parseArgs(process.argv);

  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true });
  }

  const entries = Object.entries(Modelos)
    .filter(([name]) => name.endsWith("Schema"))
    .filter(([name]) =>
      args.only ? args.only.some((needle) => name.includes(needle)) : true,
    );

  const results = [];
  const defs = {};

  for (const [name, value] of entries) {
    if (!isZodSchema(value)) {
      results.push({ name, status: "skipped", error: "not a Zod schema" });
      continue;
    }

    try {
      const jsonSchema = z.toJSONSchema(value, { target: "openapi-3.0" });
      const payload = JSON.stringify(jsonSchema, null, 2);
      writeFileSync(join(OUT_DIR, `${name}.json`), payload + "\n", "utf-8");
      defs[name] = jsonSchema;
      results.push({ name, status: "ok", bytes: payload.length });
      if (args.verbose) {
        console.log(`  ok  ${name}  (${payload.length} bytes)`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ name, status: "error", error: msg });
      console.error(`  ERR ${name}: ${msg}`);
    }
  }

  const bundle = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    "x-source": "acceso-modelos",
    "x-generator": "z.toJSONSchema({target:'openapi-3.0'})",
    "x-generated-at": new Date().toISOString(),
    $defs: defs,
  };
  const bundlePath = join(OUT_DIR, "index.json");
  writeFileSync(bundlePath, JSON.stringify(bundle, null, 2) + "\n", "utf-8");

  const ok = results.filter((r) => r.status === "ok").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const errored = results.filter((r) => r.status === "error").length;

  console.log("");
  console.log(`Resumen: ok=${ok} skipped=${skipped} error=${errored}`);
  console.log(`Bundle: ${bundlePath}`);

  if (errored > 0) {
    process.exit(1);
  }
}

main();
