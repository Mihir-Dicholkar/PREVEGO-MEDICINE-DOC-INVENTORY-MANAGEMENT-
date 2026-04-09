// src/hooks/useFileValidation.js
// ─────────────────────────────────────────────────────────────────────────────
//  Client-side file security validation hook.
//  Checks: magic bytes, MIME vs extension mismatch, embedded executable
//  headers, suspicious script patterns, filename injection, file size limits.
//  NOTE: This is a defence-in-depth layer. Server-side AV scanning should
//  always be the primary gate. This catches obvious malicious payloads early.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE    = MAX_FILE_SIZE_MB * 1024 * 1024;

// ── Known-safe magic byte signatures ─────────────────────────────────────────
const MAGIC = {
  pdf:  [0x25, 0x50, 0x44, 0x46],           // %PDF
  png:  [0x89, 0x50, 0x4e, 0x47],           // ‰PNG
  jpg:  [0xff, 0xd8, 0xff],                 // JFIF / EXIF SOI marker
};

// ── Executable / dangerous file headers we should NEVER see inside uploads ───
const DANGEROUS_HEADERS = [
  { sig: [0x4d, 0x5a],                   label: "Windows PE executable (MZ)" },
  { sig: [0x7f, 0x45, 0x4c, 0x46],       label: "Linux ELF executable"       },
  { sig: [0x50, 0x4b, 0x03, 0x04],       label: "ZIP archive"                },
  { sig: [0x52, 0x61, 0x72, 0x21],       label: "RAR archive"                },
  { sig: [0x1f, 0x8b],                   label: "GZIP archive"               },
  { sig: [0xca, 0xfe, 0xba, 0xbe],       label: "Java CLASS file"            },
  { sig: [0x23, 0x21],                   label: "Shell script shebang (#!)"  },
];

// ── Suspicious string patterns (checked in first 4 KB of file) ───────────────
const SUSPICIOUS_PATTERNS = [
  { re: /<script[\s>]/i,              label: "embedded <script> tag"         },
  { re: /javascript:/i,              label: "javascript: URI"                },
  { re: /vbscript:/i,                label: "vbscript: URI"                  },
  { re: /\/AA\s*<<|\/OpenAction/,    label: "PDF auto-action"                },
  { re: /\/JS\s*\(/,                 label: "PDF embedded JavaScript"        },
  { re: /\/Launch\s*<</,             label: "PDF launch action"              },
  { re: /eval\s*\(/,                 label: "eval() call"                    },
  { re: /base64_decode/i,            label: "base64_decode pattern"         },
  { re: /\x00{20,}/,                 label: "excessive null bytes"           },
];

// ── Allowed MIME ↔ extension map ─────────────────────────────────────────────
const ALLOWED = {
  "application/pdf": [".pdf"],
  "image/png":       [".png"],
  "image/jpeg":      [".jpg", ".jpeg"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const readBytes = (file, count) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(new Uint8Array(e.target.result));
    reader.onerror = () => reject(new Error("Could not read file bytes"));
    reader.readAsArrayBuffer(file.slice(0, count));
  });

const startsWith = (bytes, sig) => sig.every((b, i) => bytes[i] === b);

const uint8ToString = (bytes) =>
  Array.from(bytes).map((b) => String.fromCharCode(b)).join("");

// ─── Main hook ────────────────────────────────────────────────────────────────
export function useFileValidation() {
  /**
   * validate(file) → Promise<{ ok: boolean, error: string | null, warning: string | null }>
   */
  const validate = async (file) => {
    if (!file) return { ok: false, error: "No file selected.", warning: null };

    // ── 1. File size ──────────────────────────────────────────────────────────
    if (file.size === 0) {
      return { ok: false, error: "File is empty.", warning: null };
    }
    if (file.size > MAX_FILE_SIZE) {
      return {
        ok:      false,
        error:   `File exceeds the ${MAX_FILE_SIZE_MB} MB limit (got ${(file.size / 1024 / 1024).toFixed(1)} MB).`,
        warning: null,
      };
    }

    // ── 2. MIME type whitelist ────────────────────────────────────────────────
    const mimeAllowed = Object.keys(ALLOWED);
    if (!mimeAllowed.includes(file.type)) {
      return {
        ok:      false,
        error:   `File type "${file.type || "unknown"}" is not allowed. Use PDF, PNG, or JPG.`,
        warning: null,
      };
    }

    // ── 3. Extension ↔ MIME mismatch ─────────────────────────────────────────
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ALLOWED[file.type]?.includes(ext)) {
      return {
        ok:      false,
        error:   `Extension "${ext}" does not match file type "${file.type}". Possible file spoofing detected.`,
        warning: null,
      };
    }

    // ── 4. Filename sanitization ──────────────────────────────────────────────
    if (/[<>:"/\\|?*\x00-\x1f]/.test(file.name)) {
      return {
        ok:      false,
        error:   "Filename contains invalid or dangerous characters.",
        warning: null,
      };
    }
    if (file.name.length > 200) {
      return { ok: false, error: "Filename is too long (max 200 characters).", warning: null };
    }

    // ── 5. Read first 4 KB for deep inspection ────────────────────────────────
    let headerBytes;
    try {
      headerBytes = await readBytes(file, 4096);
    } catch {
      return { ok: false, error: "Could not read file for security check.", warning: null };
    }

    // ── 6. Magic bytes — verify real file type matches claimed MIME ───────────
    let magicOk = false;
    if (file.type === "application/pdf" && startsWith(headerBytes, MAGIC.pdf)) magicOk = true;
    if (file.type === "image/png"       && startsWith(headerBytes, MAGIC.png)) magicOk = true;
    if (file.type === "image/jpeg"      && startsWith(headerBytes, MAGIC.jpg)) magicOk = true;

    if (!magicOk) {
      return {
        ok:      false,
        error:   "File signature does not match its declared type. The file may be renamed or tampered with.",
        warning: null,
      };
    }

    // ── 7. Dangerous embedded executable headers ──────────────────────────────
    //  Scan the full 4 KB window, not just offset 0, to catch polyglot files
    for (const { sig, label } of DANGEROUS_HEADERS) {
      for (let offset = 0; offset <= headerBytes.length - sig.length; offset++) {
        if (sig.every((b, i) => headerBytes[offset + i] === b)) {
          // Give the first 4 bytes a pass if it matched the expected magic
          if (offset === 0) continue;
          return {
            ok:      false,
            error:   `Potentially dangerous content detected: ${label}. Upload rejected.`,
            warning: null,
          };
        }
      }
    }

    // ── 8. Suspicious string patterns ────────────────────────────────────────
    const headerStr = uint8ToString(headerBytes);
    for (const { re, label } of SUSPICIOUS_PATTERNS) {
      if (re.test(headerStr)) {
        return {
          ok:      false,
          error:   `Suspicious content detected (${label}). Upload rejected for security.`,
          warning: null,
        };
      }
    }

    // ── All checks passed ─────────────────────────────────────────────────────
    return { ok: true, error: null, warning: null };
  };

  return { validate };
}