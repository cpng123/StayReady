// Helper to import with a specific OS
function freshImportWithOS(os = "android") {
  jest.resetModules();
  jest.doMock(
    "react-native",
    () => ({ Platform: { OS: os, select: (o) => o[os] } }),
    { virtual: true }
  );
  let mod;
  jest.isolateModules(() => {
    mod = require("../../utils/phone");
  });
  return mod;
}

describe("isValidSGMobileDigits()", () => {
  const { isValidSGMobileDigits } = freshImportWithOS("android");

  test("accepts 8-digit numbers starting with 8 or 9", () => {
    expect(isValidSGMobileDigits("81234567")).toBe(true);
    expect(isValidSGMobileDigits("91234567")).toBe(true);
  });

  test("rejects wrong length, leading zeros, or non 8/9 prefix", () => {
    expect(isValidSGMobileDigits("71234567")).toBe(false);
    expect(isValidSGMobileDigits("01234567")).toBe(false);
    expect(isValidSGMobileDigits("8123456")).toBe(false);
    expect(isValidSGMobileDigits("812345678")).toBe(false);
    expect(isValidSGMobileDigits("abcdefgh")).toBe(false);
  });
});

describe("normalizeSGToE164()", () => {
  const { normalizeSGToE164 } = freshImportWithOS("android");

  test("converts local 8-digit mobile to +65E164", () => {
    expect(normalizeSGToE164("8123 4567")).toBe("+6581234567");
    expect(normalizeSGToE164("91234567")).toBe("+6591234567");
  });

  test("passes through an already valid +65XXXXXXXX string", () => {
    expect(normalizeSGToE164("+6581234567")).toBe("+6581234567");
  });

  test("returns null for invalid inputs", () => {
    expect(normalizeSGToE164("71234567")).toBeNull();
    expect(normalizeSGToE164("65 8123 4567")).toBeNull(); // no leading '+'
    expect(normalizeSGToE164("+651234567")).toBeNull(); // 7 digits after +65
    expect(normalizeSGToE164("not a number")).toBeNull();
    expect(normalizeSGToE164("")).toBeNull();
    expect(normalizeSGToE164(null)).toBeNull();
  });
});

describe("makeSmsUrl()", () => {
  test("android uses ?body=", () => {
    const { makeSmsUrl } = freshImportWithOS("android");
    const url = makeSmsUrl("+6581234567", "hello world!");
    expect(url).toBe("sms:+6581234567?body=hello%20world!");
  });

  test("ios uses &body=", () => {
    const { makeSmsUrl } = freshImportWithOS("ios");
    const url = makeSmsUrl("+6581234567", "hey & bye");
    expect(url).toBe("sms:+6581234567&body=hey%20%26%20bye");
  });
});

describe("makeWhatsAppUrl()", () => {
  const { makeWhatsAppUrl } = freshImportWithOS("android");

  test("strips + from phone and encodes text", () => {
    const url = makeWhatsAppUrl("+6581234567", "Hi there: 100% ready?");
    expect(url).toBe(
      "whatsapp://send?phone=6581234567&text=Hi%20there%3A%20100%25%20ready%3F"
    );
  });

  test("handles empty text", () => {
    const url = makeWhatsAppUrl("+6581234567", "");
    expect(url).toBe("whatsapp://send?phone=6581234567&text=");
  });
});
