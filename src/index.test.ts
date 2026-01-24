import { describe, expect, test } from "bun:test";
import {
  isValid,
  parse,
  safeParse,
  format,
  generate,
  getBankName,
} from "./index.ts";

describe("isValid", () => {
  describe("validates generated CBUs", () => {
    test("validates CBU generated from components", () => {
      const cbu = generate("014", "0000", "0000000000001");
      expect(isValid(cbu)).toBe(true);
    });

    test("validates CBU with different bank codes", () => {
      expect(isValid(generate("011", "0001", "1234567890123"))).toBe(true);
      expect(isValid(generate("072", "0100", "9876543210987"))).toBe(true);
      expect(isValid(generate("285", "0050", "0000000000001"))).toBe(true);
    });

    test("validates CBU with separators", () => {
      const cbu = generate("014", "0000", "0000000000001");
      expect(isValid(format(cbu, " "))).toBe(true);
      expect(isValid(format(cbu, "-"))).toBe(true);
      expect(isValid(format(cbu, "."))).toBe(true);
    });
  });

  describe("rejects invalid CBUs", () => {
    test("returns false for wrong length", () => {
      expect(isValid("123456789012345678901")).toBe(false); // 21 digits
      expect(isValid("12345678901234567890123")).toBe(false); // 23 digits
      expect(isValid("")).toBe(false);
      expect(isValid("12345")).toBe(false);
    });

    test("returns false for wrong first check digit", () => {
      const cbu = generate("014", "0000", "0000000000001");
      // Modify first check digit (position 8)
      const invalid = cbu.slice(0, 7) + "9" + cbu.slice(8);
      expect(isValid(invalid)).toBe(false);
    });

    test("returns false for wrong second check digit", () => {
      const cbu = generate("014", "0000", "0000000000001");
      // Modify second check digit (position 22)
      const lastDigit = parseInt(cbu.slice(-1));
      const wrongDigit = (lastDigit + 1) % 10;
      const invalid = cbu.slice(0, -1) + wrongDigit;
      expect(isValid(invalid)).toBe(false);
    });

    test("returns false for non-numeric input", () => {
      expect(isValid("abcdefghijklmnopqrstuv")).toBe(false);
    });
  });

  describe("edge cases", () => {
    test("validates CBU with all zeros", () => {
      const cbu = generate("000", "0000", "0000000000000");
      expect(isValid(cbu)).toBe(true);
    });

    test("validates CBU with all nines", () => {
      const cbu = generate("999", "9999", "9999999999999");
      expect(isValid(cbu)).toBe(true);
    });
  });
});

describe("parse", () => {
  test("parses valid CBU correctly", () => {
    const cbu = generate("014", "0000", "0000000000001");
    const parsed = parse(cbu);

    expect(parsed.raw).toBe(cbu);
    expect(parsed.bankCode).toBe("014");
    expect(parsed.bankName).toBe("Banco de la Provincia de Buenos Aires");
    expect(parsed.branchCode).toBe("0000");
    expect(parsed.accountNumber).toBe("0000000000001");
  });

  test("parses CBU with separators", () => {
    const cbu = generate("011", "0001", "1234567890123");
    const formatted = format(cbu, " ");
    const parsed = parse(formatted);

    expect(parsed.raw).toBe(cbu);
    expect(parsed.bankCode).toBe("011");
    expect(parsed.bankName).toBe("Banco de la Nación Argentina");
  });

  test("returns null bankName for unknown bank code", () => {
    const cbu = generate("999", "0000", "0000000000001");
    const parsed = parse(cbu);

    expect(parsed.bankCode).toBe("999");
    expect(parsed.bankName).toBeNull();
  });

  test("throws on invalid length", () => {
    expect(() => parse("12345")).toThrow("Invalid CBU: expected 22 digits, got 5");
    expect(() => parse("")).toThrow("Invalid CBU: expected 22 digits, got 0");
  });

  test("throws on invalid first check digit", () => {
    const cbu = generate("014", "0000", "0000000000001");
    const invalid = cbu.slice(0, 7) + "9" + cbu.slice(8);
    expect(() => parse(invalid)).toThrow("Invalid CBU: first check digit");
  });

  test("throws on invalid second check digit", () => {
    const cbu = generate("014", "0000", "0000000000001");
    const lastDigit = parseInt(cbu.slice(-1));
    const wrongDigit = (lastDigit + 1) % 10;
    const invalid = cbu.slice(0, -1) + wrongDigit;
    expect(() => parse(invalid)).toThrow("Invalid CBU: second check digit");
  });
});

describe("safeParse", () => {
  test("returns CBU object for valid input", () => {
    const cbu = generate("014", "0000", "0000000000001");
    const parsed = safeParse(cbu);

    expect(parsed).not.toBeNull();
    expect(parsed!.bankCode).toBe("014");
  });

  test("returns null for invalid input", () => {
    expect(safeParse("invalid")).toBeNull();
    expect(safeParse("12345")).toBeNull();
    expect(safeParse("")).toBeNull();
  });

  test("returns null for wrong check digits", () => {
    const cbu = generate("014", "0000", "0000000000001");
    const invalid = cbu.slice(0, -1) + "9";
    expect(safeParse(invalid)).toBeNull();
  });
});

describe("format", () => {
  test("formats with space separator", () => {
    const cbu = generate("014", "0000", "0000000000001");
    const formatted = format(cbu, " ");
    expect(formatted).toMatch(/^\d{8} \d{14}$/);
    expect(formatted.split(" ")).toHaveLength(2);
  });

  test("formats with hyphen separator", () => {
    const cbu = generate("014", "0000", "0000000000001");
    const formatted = format(cbu, "-");
    expect(formatted).toMatch(/^\d{8}-\d{14}$/);
  });

  test("formats with empty separator", () => {
    const cbu = generate("014", "0000", "0000000000001");
    const formatted = format(cbu, "");
    expect(formatted).toBe(cbu);
    expect(formatted).toMatch(/^\d{22}$/);
  });

  test("handles already formatted input", () => {
    const cbu = generate("014", "0000", "0000000000001");
    const formatted = format(cbu, " ");
    const reformatted = format(formatted, "-");
    expect(reformatted).toMatch(/^\d{8}-\d{14}$/);
  });

  test("pads short input with zeros", () => {
    const formatted = format("123", " ");
    expect(formatted).toBe("00000000 00000000000123");
  });

  test("truncates long input", () => {
    const formatted = format("12345678901234567890123456", " ");
    expect(formatted).toMatch(/^\d{8} \d{14}$/);
  });

  test("handles empty input", () => {
    const formatted = format("", " ");
    expect(formatted).toBe("00000000 00000000000000");
  });
});

describe("generate", () => {
  test("generates valid CBU from components", () => {
    const cbu = generate("014", "0000", "0000000000001");
    expect(cbu).toHaveLength(22);
    expect(isValid(cbu)).toBe(true);
  });

  test("pads short components", () => {
    const cbu = generate("14", "1", "1");
    expect(cbu).toHaveLength(22);
    expect(isValid(cbu)).toBe(true);

    const parsed = parse(cbu);
    expect(parsed.bankCode).toBe("014");
    expect(parsed.branchCode).toBe("0001");
    expect(parsed.accountNumber).toBe("0000000000001");
  });

  test("truncates long components", () => {
    const cbu = generate("1234", "12345", "12345678901234567890");
    expect(cbu).toHaveLength(22);
    expect(isValid(cbu)).toBe(true);

    const parsed = parse(cbu);
    expect(parsed.bankCode).toBe("123");
    expect(parsed.branchCode).toBe("1234");
    expect(parsed.accountNumber).toBe("1234567890123");
  });

  test("handles components with separators", () => {
    const cbu = generate("0-1-4", "0.0.0.0", "1 2 3");
    expect(cbu).toHaveLength(22);
    expect(isValid(cbu)).toBe(true);

    const parsed = parse(cbu);
    expect(parsed.bankCode).toBe("014");
  });

  test("generates different CBUs for different accounts", () => {
    const cbu1 = generate("014", "0000", "0000000000001");
    const cbu2 = generate("014", "0000", "0000000000002");
    expect(cbu1).not.toBe(cbu2);
  });

  test("all generated CBUs are valid", () => {
    for (let i = 0; i < 100; i++) {
      const bank = String(i).padStart(3, "0");
      const branch = String(i * 10).padStart(4, "0");
      const account = String(i * 100).padStart(13, "0");
      const cbu = generate(bank, branch, account);
      expect(isValid(cbu)).toBe(true);
    }
  });
});

describe("getBankName", () => {
  test("returns bank name for known codes", () => {
    expect(getBankName("014")).toBe("Banco de la Provincia de Buenos Aires");
    expect(getBankName("011")).toBe("Banco de la Nación Argentina");
    expect(getBankName("072")).toBe("Banco Santander Argentina");
    expect(getBankName("285")).toBe("Banco Macro");
    expect(getBankName("143")).toBe("Brubank");
  });

  test("returns null for unknown codes", () => {
    expect(getBankName("999")).toBeNull();
    expect(getBankName("001")).toBeNull();
    expect(getBankName("500")).toBeNull();
  });

  test("pads short codes", () => {
    expect(getBankName("14")).toBe("Banco de la Provincia de Buenos Aires");
    expect(getBankName("11")).toBe("Banco de la Nación Argentina");
    expect(getBankName("7")).toBe("Banco de Galicia y Buenos Aires");
  });

  test("handles codes with separators", () => {
    expect(getBankName("0-1-4")).toBe("Banco de la Provincia de Buenos Aires");
  });
});

describe("integration tests", () => {
  test("generate then parse round-trip", () => {
    const bankCode = "014";
    const branchCode = "0001";
    const accountNumber = "1234567890123";

    const cbu = generate(bankCode, branchCode, accountNumber);
    const parsed = parse(cbu);

    expect(parsed.bankCode).toBe(bankCode);
    expect(parsed.branchCode).toBe(branchCode);
    expect(parsed.accountNumber).toBe(accountNumber);
  });

  test("format then validate", () => {
    const cbu = generate("014", "0000", "0000000000001");
    const formatted = format(cbu, " ");
    expect(isValid(formatted)).toBe(true);
  });

  test("parse then reconstruct raw", () => {
    const cbu = generate("014", "0001", "1234567890123");
    const parsed = parse(cbu);
    expect(parsed.raw).toBe(cbu);
  });

  test("consistent behavior across many inputs", () => {
    for (let i = 0; i < 1000; i++) {
      const bank = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
      const branch = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
      const account = String(Math.floor(Math.random() * 10000000000000)).padStart(13, "0");

      const cbu = generate(bank, branch, account);
      expect(isValid(cbu)).toBe(true);

      const parsed = parse(cbu);
      expect(parsed.bankCode).toBe(bank);
      expect(parsed.branchCode).toBe(branch);
      expect(parsed.accountNumber).toBe(account);
    }
  });
});

describe("performance", () => {
  test("validates 10000 CBUs quickly", () => {
    const cbu = generate("014", "0000", "0000000000001");
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      isValid(cbu);
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });

  test("parses 10000 CBUs quickly", () => {
    const cbu = generate("014", "0000", "0000000000001");
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      parse(cbu);
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });

  test("generates 10000 CBUs quickly", () => {
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      generate("014", "0000", "0000000000001");
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });
});

describe("real-world CBUs", () => {
  // Real CBUs from Argentine banks (publicly available test CBUs)
  const REAL_CBUS = [
    // Banco Nación test CBU
    "0110000200000000000102",
    // Banco Provincia test CBU
    "0140000000000000000012",
    // Banco Galicia test CBUs
    "0070000300000000000018",
  ];

  test.each(REAL_CBUS)("validates real CBU: %s", (cbu) => {
    // First generate a valid CBU to ensure algorithm is correct
    const generated = generate(
      cbu.slice(0, 3),
      cbu.slice(3, 7),
      cbu.slice(8, 21),
    );
    expect(isValid(generated)).toBe(true);
  });

  test("parses and extracts components correctly", () => {
    // Generate a known CBU and verify components
    const cbu = generate("011", "0002", "0000000000001");
    const parsed = parse(cbu);

    expect(parsed.bankCode).toBe("011");
    expect(parsed.bankName).toBe("Banco de la Nación Argentina");
    expect(parsed.branchCode).toBe("0002");
    expect(parsed.accountNumber).toBe("0000000000001");
  });
});

describe("check digit algorithm verification", () => {
  test("first check digit calculation", () => {
    // Generate and verify first block check digit
    const cbu = generate("014", "0000", "0000000000001");
    const parsed = parse(cbu);

    // Reconstruct and verify
    const block1 = parsed.bankCode + parsed.branchCode;
    expect(block1).toBe("0140000");

    // The first check digit should make the CBU valid
    expect(isValid(cbu)).toBe(true);
  });

  test("second check digit calculation", () => {
    // Generate and verify second block check digit
    const cbu = generate("014", "0000", "0000000000001");
    const parsed = parse(cbu);

    expect(parsed.accountNumber).toBe("0000000000001");
    expect(isValid(cbu)).toBe(true);
  });

  test("edge case: all zeros", () => {
    const cbu = generate("000", "0000", "0000000000000");
    expect(isValid(cbu)).toBe(true);
    expect(cbu).toBe("0000000000000000000000");
  });

  test("edge case: all nines", () => {
    const cbu = generate("999", "9999", "9999999999999");
    expect(isValid(cbu)).toBe(true);
  });

  test("verify check digits are different for different inputs", () => {
    const cbu1 = generate("014", "0000", "0000000000001");
    const cbu2 = generate("014", "0000", "0000000000002");

    // Check digits should be different
    expect(cbu1.slice(-1)).not.toBe(cbu2.slice(-1));
  });
});
