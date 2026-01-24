/**
 * CBU (Clave Bancaria Uniforme) utilities for Argentina.
 *
 * A CBU is a 22-digit banking code used in Argentina to identify bank accounts.
 * Format: BBBSSSSXAAAAAAAAAAAAARD
 *   - BBB: Bank code (3 digits)
 *   - SSSS: Branch code (4 digits)
 *   - X: First check digit
 *   - AAAAAAAAAAAAA: Account number (13 digits)
 *   - D: Second check digit
 */

/** Weights for first check digit calculation (bank + branch) */
const WEIGHTS_1 = [7, 1, 3, 9, 7, 1, 3] as const;

/** Weights for second check digit calculation (account number) */
const WEIGHTS_2 = [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3] as const;

/** Bank code to name mapping */
const BANKS: Record<string, string> = {
  "007": "Banco de Galicia y Buenos Aires",
  "011": "Banco de la Nación Argentina",
  "014": "Banco de la Provincia de Buenos Aires",
  "015": "Industrial and Commercial Bank of China",
  "016": "Citibank",
  "017": "BBVA Argentina",
  "020": "Banco de la Provincia de Córdoba",
  "027": "Banco Supervielle",
  "029": "Banco de la Ciudad de Buenos Aires",
  "034": "Banco Patagonia",
  "044": "Banco Hipotecario",
  "045": "Banco de San Juan",
  "060": "Banco del Tucumán",
  "072": "Banco Santander Argentina",
  "083": "Banco del Chubut",
  "086": "Banco de Santa Cruz",
  "093": "Banco de La Pampa",
  "094": "Banco de Corrientes",
  "097": "Banco Provincia del Neuquén",
  "143": "Brubank",
  "150": "HSBC Argentina",
  "191": "Banco Credicoop",
  "198": "Banco de Valores",
  "247": "Banco Roela",
  "254": "Banco Mariva",
  "259": "Banco Itaú Argentina",
  "266": "BNP Paribas",
  "268": "Banco de Tierra del Fuego",
  "277": "Banco Saenz",
  "281": "Banco Meridian",
  "285": "Banco Macro",
  "299": "Banco Comafi",
  "300": "Banco de Inversión y Comercio Exterior",
  "301": "Banco Piano",
  "305": "Banco Julio",
  "309": "Banco Rioja",
  "310": "Banco del Sol",
  "311": "Nuevo Banco del Chaco",
  "312": "Banco Voii",
  "315": "Banco de Formosa",
  "319": "Banco CMF",
  "321": "Banco de Santiago del Estero",
  "322": "Banco Industrial",
  "330": "Nuevo Banco de Santa Fe",
  "336": "Banco Bradesco Argentina",
  "338": "Banco de Servicios y Transacciones",
  "341": "Banco Masventas",
  "384": "Wilobank",
  "386": "Nuevo Banco de Entre Ríos",
  "389": "Banco Columbia",
  "426": "Banco Bica",
  "431": "Banco Coinag",
  "432": "Banco de Comercio",
};

/**
 * Parsed CBU with extracted components.
 */
export interface CBU {
  /** The raw 22-digit CBU string */
  raw: string;
  /** Bank code (digits 1-3) */
  bankCode: string;
  /** Bank name, or null if unknown */
  bankName: string | null;
  /** Branch code (digits 4-7) */
  branchCode: string;
  /** Account number (digits 9-21) */
  accountNumber: string;
}

/**
 * Removes all non-digit characters from the input.
 */
function normalize(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * Normalizes and pads input to exactly `length` digits.
 */
function pad(input: string, length: number): string {
  return normalize(input).padStart(length, "0").slice(0, length);
}

/**
 * Computes a check digit using the given weights.
 * Formula: (10 - (sum % 10)) % 10
 */
function computeCheckDigit(
  digits: string,
  weights: readonly number[],
): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += parseInt(digits[i]!, 10) * weights[i]!;
  }
  return (10 - (sum % 10)) % 10;
}

/**
 * Validates whether a CBU is valid.
 *
 * @example
 * ```ts
 * isValid("0110000200000000000102") // true
 * isValid("01100002000000000001")   // false (wrong length)
 * isValid("0110000200000000000199") // false (wrong check digit)
 * ```
 */
export function isValid(input: string): boolean {
  const cbu = normalize(input);
  if (cbu.length !== 22) return false;

  const block1 = cbu.slice(0, 7);
  const checkDigit1 = parseInt(cbu[7]!, 10);
  const expectedCheck1 = computeCheckDigit(block1, WEIGHTS_1);
  if (checkDigit1 !== expectedCheck1) return false;

  const block2 = cbu.slice(8, 21);
  const checkDigit2 = parseInt(cbu[21]!, 10);
  const expectedCheck2 = computeCheckDigit(block2, WEIGHTS_2);
  if (checkDigit2 !== expectedCheck2) return false;

  return true;
}

/**
 * Parses a CBU string and returns its components.
 * Throws an Error if the CBU is invalid.
 *
 * @example
 * ```ts
 * const cbu = parse("0140000000000000000012")
 * cbu.bankCode      // "014"
 * cbu.bankName      // "Banco de la Provincia de Buenos Aires"
 * cbu.branchCode    // "0000"
 * cbu.accountNumber // "0000000000001"
 * ```
 */
export function parse(input: string): CBU {
  const cbu = normalize(input);

  if (cbu.length !== 22) {
    throw new Error(`Invalid CBU: expected 22 digits, got ${cbu.length}`);
  }

  const block1 = cbu.slice(0, 7);
  const checkDigit1 = parseInt(cbu[7]!, 10);
  const expectedCheck1 = computeCheckDigit(block1, WEIGHTS_1);
  if (checkDigit1 !== expectedCheck1) {
    throw new Error(
      `Invalid CBU: first check digit is ${checkDigit1}, expected ${expectedCheck1}`,
    );
  }

  const block2 = cbu.slice(8, 21);
  const checkDigit2 = parseInt(cbu[21]!, 10);
  const expectedCheck2 = computeCheckDigit(block2, WEIGHTS_2);
  if (checkDigit2 !== expectedCheck2) {
    throw new Error(
      `Invalid CBU: second check digit is ${checkDigit2}, expected ${expectedCheck2}`,
    );
  }

  const bankCode = cbu.slice(0, 3);

  return {
    raw: cbu,
    bankCode,
    bankName: BANKS[bankCode] ?? null,
    branchCode: cbu.slice(3, 7),
    accountNumber: cbu.slice(8, 21),
  };
}

/**
 * Parses a CBU string and returns its components, or null if invalid.
 *
 * @example
 * ```ts
 * const cbu = safeParse("invalid")
 * if (cbu) {
 *   console.log(cbu.bankName)
 * }
 * ```
 */
export function safeParse(input: string): CBU | null {
  try {
    return parse(input);
  } catch {
    return null;
  }
}

/**
 * Formats a CBU with the specified separator between the two blocks.
 *
 * @example
 * ```ts
 * format("0140000000000000000012", " ")  // "01400000 00000000000012"
 * format("0140000000000000000012", "-")  // "01400000-00000000000012"
 * format("0140000000000000000012", "")   // "0140000000000000000012"
 * ```
 */
export function format(input: string, separator: string): string {
  const cbu = pad(input, 22);
  return `${cbu.slice(0, 8)}${separator}${cbu.slice(8)}`;
}

/**
 * Generates a valid CBU from its components.
 *
 * @example
 * ```ts
 * generate("014", "0000", "0000000000001") // "0140000000000000000012"
 * generate("72", "1", "123")               // "0720001300000000001232"
 * ```
 */
export function generate(
  bankCode: string,
  branchCode: string,
  accountNumber: string,
): string {
  const bank = pad(bankCode, 3);
  const branch = pad(branchCode, 4);
  const account = pad(accountNumber, 13);

  const block1 = bank + branch;
  const checkDigit1 = computeCheckDigit(block1, WEIGHTS_1);

  const checkDigit2 = computeCheckDigit(account, WEIGHTS_2);

  return `${block1}${checkDigit1}${account}${checkDigit2}`;
}

/**
 * Returns the bank name for a given bank code.
 *
 * @example
 * ```ts
 * getBankName("014") // "Banco de la Provincia de Buenos Aires"
 * getBankName("999") // null
 * ```
 */
export function getBankName(bankCode: string): string | null {
  const code = pad(bankCode, 3);
  return BANKS[code] ?? null;
}
