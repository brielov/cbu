# cbu

[![npm version](https://img.shields.io/npm/v/cbu.svg)](https://www.npmjs.com/package/cbu)
[![npm downloads](https://img.shields.io/npm/dm/cbu.svg)](https://www.npmjs.com/package/cbu)
[![CI](https://github.com/brielov/cbu/actions/workflows/ci.yml/badge.svg)](https://github.com/brielov/cbu/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Lightweight utilities for validating, parsing, and generating Argentine CBU numbers.

## What is a CBU?

CBU (Clave Bancaria Uniforme) is Argentina's standardized banking code used to identify bank accounts. It's a 22-digit number with the following structure:

```
Position:  1-3    4-7     8       9-21           22
           ───    ────    ─       ─────────────  ─
           014    0000    0       0000000000001  2
           │      │       │       │              │
           │      │       │       │              └─ Second check digit
           │      │       │       └─ Account number (13 digits)
           │      │       └─ First check digit
           │      └─ Branch code (4 digits)
           └─ Bank code (3 digits)
```

## Installation

```bash
npm install cbu
```

```bash
pnpm add cbu
```

```bash
bun add cbu
```

## Usage

```typescript
import { isValid, parse, safeParse, format, generate, getBankName } from "cbu";

// Validate a CBU
isValid("0720285088000001603240"); // true
isValid("0720285088000001603299"); // false (wrong check digit)

// Parse a CBU (throws on invalid)
const cbu = parse("0720285088000001603240");
cbu.bankCode;      // "072"
cbu.bankName;      // "Banco Santander Argentina"
cbu.branchCode;    // "0285"
cbu.accountNumber; // "8800000160324"

// Safe parse (returns null on invalid)
safeParse("invalid"); // null
safeParse("0720285088000001603240"); // { bankCode: "072", ... }

// Format a CBU
format("0720285088000001603240", " ");  // "07202850 88000001603240"
format("0720285088000001603240", "-");  // "07202850-88000001603240"

// Generate a CBU from components
generate("072", "0285", "8800000160324"); // "0720285088000001603240"

// Look up bank name
getBankName("072"); // "Banco Santander Argentina"
getBankName("011"); // "Banco de la Nación Argentina"
getBankName("999"); // null (unknown)
```

## API

### `isValid(input: string): boolean`

Validates whether a CBU is valid by checking length and both check digits.

```typescript
isValid("0720285088000001603240"); // true
isValid("invalid");                // false
isValid("072028508800000160324");  // false (wrong length)
```

### `parse(input: string): CBU`

Parses a CBU string and returns its components. Throws an `Error` if the CBU is invalid.

```typescript
const cbu = parse("0720285088000001603240");
// {
//   raw: "0720285088000001603240",
//   bankCode: "072",
//   bankName: "Banco Santander Argentina",
//   branchCode: "0285",
//   accountNumber: "8800000160324"
// }

parse("invalid"); // throws Error
```

### `safeParse(input: string): CBU | null`

Same as `parse`, but returns `null` instead of throwing on invalid input.

```typescript
safeParse("0720285088000001603240"); // { bankCode: "072", ... }
safeParse("invalid");                // null
```

### `format(input: string, separator: string): string`

Formats a CBU with the specified separator between the two blocks (8 + 14 digits).

```typescript
format("0720285088000001603240", " ");  // "07202850 88000001603240"
format("0720285088000001603240", "-");  // "07202850-88000001603240"
format("0720285088000001603240", "");   // "0720285088000001603240"
```

### `generate(bankCode: string, branchCode: string, accountNumber: string): string`

Generates a valid CBU from its components, computing both check digits automatically.

```typescript
generate("072", "0285", "8800000160324"); // "0720285088000001603240"
generate("14", "1", "123");               // "0140001000000000001232" (padded)
```

### `getBankName(bankCode: string): string | null`

Returns the bank name for a given 3-digit bank code, or `null` if unknown.

```typescript
getBankName("072"); // "Banco Santander Argentina"
getBankName("011"); // "Banco de la Nación Argentina"
getBankName("143"); // "Brubank"
getBankName("999"); // null
```

## Types

```typescript
interface CBU {
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
```

## Supported Banks

The library includes names for 50+ Argentine banks, including:

- Banco de la Nación Argentina (011)
- Banco de la Provincia de Buenos Aires (014)
- Banco Santander Argentina (072)
- Banco Macro (285)
- Banco Galicia (007)
- BBVA Argentina (017)
- HSBC Argentina (150)
- Brubank (143)
- And many more...

## Features

- Zero dependencies
- Full TypeScript support
- Works in Node.js, browsers, and edge runtimes
- ESM and CommonJS support
- Tree-shakeable
- Tiny bundle size (~1.2 KB gzipped)

## License

[MIT](LICENSE)
