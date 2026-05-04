/**
 * PDF Ingestion Pipeline for Mental Wellness Coach RAG
 *
 * Parses PDFs from data/ folder using LlamaParse,
 * chunks text, generates OpenAI embeddings,
 * and stores in Supabase knowledge_documents table.
 *
 * Usage: npx tsx scripts/ingest-pdfs.ts
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Configuration ─────────────────────────────────────────────
const LLAMAPARSE_API_KEY = process.env.LLAMAPARSE_API_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const CHUNK_SIZE = 1024;       // tokens (~4 chars per token → ~4096 chars)
const CHUNK_OVERLAP = 100;     // overlap tokens
const CHAR_CHUNK_SIZE = CHUNK_SIZE * 4;
const CHAR_OVERLAP = CHUNK_OVERLAP * 4;
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_BATCH_SIZE = 20; // embed 20 chunks at a time
const DATA_DIR = path.resolve(__dirname, "../data");

// ── Validate environment ──────────────────────────────────────
function validateEnv() {
  const missing: string[] = [];
  if (!LLAMAPARSE_API_KEY) missing.push("LLAMAPARSE_API_KEY");
  if (!OPENAI_API_KEY) missing.push("OPENAI_API_KEY");
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_SERVICE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length) {
    console.error(`❌ Missing env vars: ${missing.join(", ")}`);
    console.error("   Add them to .env file in the project root.");
    process.exit(1);
  }
}

// ── LlamaParse: Upload & Parse PDF ────────────────────────────
async function parsePdfWithLlamaParse(filePath: string): Promise<string> {
  const fileName = path.basename(filePath);
  console.log(`  📤 Uploading ${fileName} to LlamaParse...`);

  // Step 1: Upload the file
  const formData = new FormData();
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: "application/pdf" });
  formData.append("file", blob, fileName);
  formData.append("parsing_instruction",
    "Extract all text content from this mental health / psychology textbook. " +
    "Preserve chapter titles, section headings, and paragraph structure. " +
    "Ignore page numbers, headers, footers, and table of contents page references."
  );
  formData.append("result_type", "markdown");

  const uploadResp = await fetch("https://api.cloud.llamaindex.ai/api/parsing/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${LLAMAPARSE_API_KEY}` },
    body: formData,
  });

  if (!uploadResp.ok) {
    const err = await uploadResp.text();
    throw new Error(`LlamaParse upload failed (${uploadResp.status}): ${err}`);
  }

  const { id: jobId } = await uploadResp.json();
  console.log(`  ⏳ Parsing job ${jobId}...`);

  // Step 2: Poll for completion
  let status = "PENDING";
  let attempts = 0;
  const maxAttempts = 300; // 5 minutes max per PDF

  while (status !== "SUCCESS" && attempts < maxAttempts) {
    await sleep(2000);
    const statusResp = await fetch(
      `https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}`,
      { headers: { Authorization: `Bearer ${LLAMAPARSE_API_KEY}` } }
    );
    const statusJson = await statusResp.json();
    status = statusJson.status;

    if (status === "ERROR") {
      throw new Error(`LlamaParse failed for ${fileName}: ${JSON.stringify(statusJson)}`);
    }
    attempts++;
    if (attempts % 15 === 0) {
      console.log(`  ⏳ Still parsing... (${attempts * 2}s elapsed)`);
    }
  }

  if (status !== "SUCCESS") {
    throw new Error(`LlamaParse timed out for ${fileName}`);
  }

  // Step 3: Get the result
  const resultResp = await fetch(
    `https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`,
    { headers: { Authorization: `Bearer ${LLAMAPARSE_API_KEY}` } }
  );

  if (!resultResp.ok) {
    throw new Error(`Failed to get result: ${resultResp.status}`);
  }

  const resultJson = await resultResp.json();
  const text = resultJson.markdown || resultJson.text || "";
  console.log(`  ✅ Parsed: ${text.length.toLocaleString()} characters`);
  return text;
}

// ── Text Chunking ─────────────────────────────────────────────
interface Chunk {
  text: string;
  index: number;
  section: string;
}

function chunkText(text: string, sourceFile: string): Chunk[] {
  const chunks: Chunk[] = [];

  // Try to split by sections/chapters first
  const sections = text.split(/\n#{1,3}\s+/);
  let currentSection = "Introduction";
  let globalIndex = 0;

  for (const section of sections) {
    const lines = section.split("\n");
    // First line after a heading split is the heading itself
    if (lines[0] && lines[0].trim().length > 0 && lines[0].trim().length < 200) {
      currentSection = lines[0].trim().replace(/[#*]/g, "").trim();
    }

    const sectionText = section.trim();
    if (!sectionText || sectionText.length < 50) continue;

    // Chunk this section
    let start = 0;
    while (start < sectionText.length) {
      const end = Math.min(start + CHAR_CHUNK_SIZE, sectionText.length);

      // Try to break at a sentence boundary
      let breakPoint = end;
      if (end < sectionText.length) {
        const lastPeriod = sectionText.lastIndexOf(". ", end);
        const lastNewline = sectionText.lastIndexOf("\n", end);
        const bestBreak = Math.max(lastPeriod, lastNewline);
        if (bestBreak > start + CHAR_CHUNK_SIZE * 0.5) {
          breakPoint = bestBreak + 1;
        }
      }

      const chunkText = sectionText.slice(start, breakPoint).trim();
      if (chunkText.length >= 100) { // Skip tiny fragments
        chunks.push({
          text: chunkText,
          index: globalIndex++,
          section: currentSection.slice(0, 200),
        });
      }

      start = breakPoint - CHAR_OVERLAP;
      if (start <= 0 && breakPoint >= sectionText.length) break;
      if (breakPoint >= sectionText.length) break;
    }
  }

  console.log(`  📦 Created ${chunks.length} chunks from ${sourceFile}`);
  return chunks;
}

// ── OpenAI Embeddings (batched) ───────────────────────────────
async function embedBatch(texts: string[]): Promise<number[][]> {
  const resp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI embedding error (${resp.status}): ${err}`);
  }

  const json = await resp.json();
  return json.data.map((d: any) => d.embedding);
}

// ── Book name shortener ───────────────────────────────────────
function getBookCategory(fileName: string): string {
  const nameMap: Record<string, string> = {
    "Bessel": "The Body Keeps the Score",
    "Burns": "Feeling Good (CBT)",
    "DSM-II": "DSM-II Diagnostic Manual",
    "Sapolsky": "Behave (Neuroscience)",
    "Ramachandran": "Phantoms in the Brain",
    "Blows": "Biological Basis of Mental Health",
    "Stahl": "Lithium Handbook (Psychopharmacology)",
    "Dryden": "Single-Session CBT",
  };

  for (const [key, value] of Object.entries(nameMap)) {
    if (fileName.includes(key)) return value;
  }
  return fileName.slice(0, 60);
}

// ── Main Pipeline ─────────────────────────────────────────────
async function main() {
  validateEnv();

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Find all PDFs
  const pdfFiles = fs.readdirSync(DATA_DIR)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .map((f) => path.join(DATA_DIR, f));

  console.log(`\n📚 Found ${pdfFiles.length} PDF files in data/\n`);

  if (pdfFiles.length === 0) {
    console.error("No PDFs found in data/ folder.");
    process.exit(1);
  }

  let totalChunks = 0;
  let totalEmbedded = 0;

  for (const pdfPath of pdfFiles) {
    const fileName = path.basename(pdfPath);
    const category = getBookCategory(fileName);

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📖 Processing: ${category}`);
    console.log(`   File: ${fileName}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Check if already ingested
    const { count } = await supabase
      .from("knowledge_documents")
      .select("id", { count: "exact", head: true })
      .eq("source_file", fileName);

    if (count && count > 0) {
      console.log(`  ⏭️  Already ingested (${count} chunks). Skipping.`);
      continue;
    }

    try {
      // 1. Parse PDF
      const text = await parsePdfWithLlamaParse(pdfPath);

      if (text.length < 500) {
        console.log(`  ⚠️  Very little text extracted (${text.length} chars). Skipping.`);
        continue;
      }

      // 2. Chunk
      const chunks = chunkText(text, fileName);
      totalChunks += chunks.length;

      // 3. Embed & store in batches
      for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
        const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
        const texts = batch.map((c) =>
          `${category}: ${c.section}\n${c.text}`
        );

        console.log(
          `  🔢 Embedding batch ${Math.floor(i / EMBEDDING_BATCH_SIZE) + 1}/${Math.ceil(chunks.length / EMBEDDING_BATCH_SIZE)} ` +
          `(chunks ${i + 1}-${Math.min(i + EMBEDDING_BATCH_SIZE, chunks.length)})`
        );

        const embeddings = await embedBatch(texts);

        // 4. Insert into Supabase
        const rows = batch.map((chunk, idx) => ({
          category,
          title: `${chunk.section} [chunk ${chunk.index}]`,
          content: chunk.text,
          embedding: embeddings[idx],
          source_file: fileName,
          chunk_index: chunk.index,
        }));

        const { error } = await supabase
          .from("knowledge_documents")
          .insert(rows);

        if (error) {
          console.error(`  ❌ Supabase insert error:`, error.message);
        } else {
          totalEmbedded += batch.length;
        }

        // Rate limit protection
        await sleep(500);
      }

      console.log(`  ✅ Done: ${chunks.length} chunks embedded and stored.`);
    } catch (err: any) {
      console.error(`  ❌ Failed to process ${fileName}:`, err.message);
    }
  }

  console.log(`\n${"═".repeat(50)}`);
  console.log(`✅ Pipeline complete!`);
  console.log(`   Total chunks created: ${totalChunks}`);
  console.log(`   Total chunks stored:  ${totalEmbedded}`);
  console.log(`${"═".repeat(50)}\n`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
