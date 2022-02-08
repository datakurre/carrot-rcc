import {
  TZ,
  inferType,
  isBoolean,
  isDate,
  isDouble,
  isEqual,
  isInteger,
  isJson,
  isLong,
  isString,
  offsetToString,
  toCamundaDateString,
} from "./carrot_rcc_lib";

describe("isInteger", () => {
  it("should return false for boolean", () => {
    expect(isInteger(false)).toBe(false);
  });
  it("should return false for string", () => {
    expect(isInteger("0")).toBe(false);
  });
  it("should return true for 0", () => {
    expect(isInteger(0)).toBe(true);
  });
  it("should return true for 1", () => {
    expect(isInteger(1)).toBe(true);
  });
  it("should return false for double", () => {
    expect(isInteger(1.1)).toBe(false);
  });
  it("should return false for long", () => {
    expect(isInteger(Math.pow(2, 31))).toBe(false);
  });
});

describe("isLong", () => {
  it("should return false for 0", () => {
    expect(isLong(0)).toBe(false);
  });
  it("should return false for 1", () => {
    expect(isLong(1)).toBe(false);
  });
  it("should return false for double", () => {
    expect(isLong(1.1)).toBe(false);
  });
  it("should return true for long", () => {
    expect(isLong(Math.pow(2, 31))).toBe(true);
  });
});

describe("isDouble", () => {
  it("should return false for 0", () => {
    expect(isDouble(0)).toBe(false);
  });
  it("should return false for 1", () => {
    expect(isDouble(1)).toBe(false);
  });
  it("should return false for long", () => {
    expect(isDouble(Math.pow(2, 31))).toBe(false);
  });
  it("should return true for double", () => {
    expect(isDouble(1.1)).toBe(true);
  });
});

describe("isBoolean", () => {
  it("should return false for null", () => {
    expect(isBoolean(null)).toBe(false);
  });
  it("should return false for undefined", () => {
    expect(isBoolean(undefined)).toBe(false);
  });
  it("should return false for 0", () => {
    expect(isBoolean(0)).toBe(false);
  });
  it("should return false for 1", () => {
    expect(isBoolean(1)).toBe(false);
  });
  it("should return true for false", () => {
    expect(isBoolean(false)).toBe(true);
  });
  it("should return true for false", () => {
    expect(isBoolean(true)).toBe(true);
  });
});

describe("isString", () => {
  it("should return false for null", () => {
    expect(isString(null)).toBe(false);
  });
  it("should return false for undefined", () => {
    expect(isString(undefined)).toBe(false);
  });
  it("should return false for 0", () => {
    expect(isString(0)).toBe(false);
  });
  it("should return false for 1", () => {
    expect(isString(1)).toBe(false);
  });
  it("should return true for string", () => {
    expect(isString("")).toBe(true);
  });
});

describe("isJson", () => {
  it("should return false for undefined", () => {
    expect(isJson(undefined)).toBe(false);
  });
  it("should return false for string", () => {
    expect(isJson("")).toBe(false);
  });
  it("should return true for object", () => {
    expect(isJson({})).toBe(true);
  });
  it("should return true for null", () => {
    expect(isJson(null)).toBe(true);
  });
});

describe("isDate", () => {
  it("should return false for undefined", () => {
    expect(isDate(undefined)).toBe(false);
  });
  it("should return false for null", () => {
    expect(isDate(null)).toBe(false);
  });
  it("should return false for empty string", () => {
    expect(isDate("")).toBe(false);
  });
  it("should return true for date", () => {
    expect(isDate(new Date())).toBe(true);
  });
  it("should return true for ISO formatted date", () => {
    expect(isDate(new Date().toISOString())).toBe(true);
  });
  it("should return true for Camunda formaotted date", () => {
    expect(isDate(new Date().toISOString().replace(/Z$/, "+0000"))).toBe(true);
  });
  it("should return true for date string", () => {
    expect(isDate("2020-01-01")).toBe(true);
    expect(isDate("2020-01-01 12:00:00")).toBe(true);
    expect(isDate("2020-01-01 12:00:00.000")).toBe(true);
    expect(isDate("2020-01-01T12:00:00")).toBe(true);
    expect(isDate("2020-01-01T12:00:00.000")).toBe(true);
  });
});

describe("TZ", () => {
  it("should be +0200 or +0300 for Europe/Helsinki", () => {
    // TZ=Europe/Helsinki
    expect(["+0200", "+0300"]).toContain(TZ);
  });
});

describe("offsetToString", () => {
  it("should support all timezones", () => {
    expect(offsetToString(600)).toBe("-1000");
    expect(offsetToString(180)).toBe("-0300");
    expect(offsetToString(120)).toBe("-0200");
    expect(offsetToString(90)).toBe("-0130");
    expect(offsetToString(60)).toBe("-0100");
    expect(offsetToString(30)).toBe("-0030");
    expect(offsetToString(1)).toBe("-0001");
    expect(offsetToString(0)).toBe("+0000");
    expect(offsetToString(-1)).toBe("+0001");
    expect(offsetToString(-30)).toBe("+0030");
    expect(offsetToString(-60)).toBe("+0100");
    expect(offsetToString(-90)).toBe("+0130");
    expect(offsetToString(-120)).toBe("+0200");
    expect(offsetToString(-180)).toBe("+0300");
    expect(offsetToString(-600)).toBe("+1000");
  });
});

describe("isEqual", () => {
  it("should return false when values are not equal", () => {
    expect.assertions(1);
    return isEqual({ type: "string", value: "foo", valueInfo: {} }, "bar").then(
      (data) => expect(data).toBe(false)
    );
  });
  it("should return true values are equal", () => {
    expect.assertions(1);
    return isEqual({ type: "string", value: "foo", valueInfo: {} }, "foo").then(
      (data) => expect(data).toBe(true)
    );
  });
  it("should return false for new values", () => {
    expect.assertions(1);
    return isEqual(undefined, undefined).then((data) =>
      expect(data).toBe(false)
    );
  });
  it("should return false for files", () => {
    expect.assertions(1);
    return isEqual({ type: "file", value: null, valueInfo: {} }, null).then(
      (data) => expect(data).toBe(false)
    );
  });
  it("should return false when dates are not equal", () => {
    expect.assertions(1);
    const [a, b] = [new Date(), new Date("2020-01-01")];
    return isEqual({ type: "date", value: a, valueInfo: {} }, b).then((data) =>
      expect(data).toBe(false)
    );
  });
  it("should return true when dates are equal", () => {
    expect.assertions(1);
    const a = new Date();
    return isEqual({ type: "date", value: a, valueInfo: {} }, a).then((data) =>
      expect(data).toBe(true)
    );
  });
  it("should return true when date does not match ISO string", () => {
    expect.assertions(1);
    const [a, b] = [new Date(), new Date("2020-01-01")];
    return isEqual(
      { type: "date", value: a, valueInfo: {} },
      b.toISOString()
    ).then((data) => expect(data).toBe(false));
  });
  it("should return true when date matches ISO string", () => {
    expect.assertions(1);
    const a = new Date();
    return isEqual(
      { type: "date", value: a, valueInfo: {} },
      a.toISOString()
    ).then((data) => expect(data).toBe(true));
  });
  it('should return false when date does not match "YYYY-MM-DD" string', () => {
    expect.assertions(1);
    const [a, b] = [new Date("2020-01-01"), "2020-01-02"];
    return isEqual({ type: "date", value: a, valueInfo: {} }, b).then((data) =>
      expect(data).toBe(false)
    );
  });
  it('should return true when date matches "YYYY-MM-DD" string', () => {
    expect.assertions(1);
    const [a, b] = [new Date("2020-01-01"), "2020-01-01"];
    return isEqual({ type: "date", value: a, valueInfo: {} }, b).then((data) =>
      expect(data).toBe(true)
    );
  });
});

describe("inferType", () => {
  it('should infer "object" as JSON', () => {
    expect.assertions(1);
    return inferType({ type: "object", value: {}, valueInfo: {} }, {}).then(
      (data) => expect(data).toBe("Json")
    );
  });
  it("should default to existing variable type when available", () => {
    expect.assertions(1);
    return inferType({ type: "file", value: {}, valueInfo: {} }, {}).then(
      (data) => expect(data).toBe("File")
    );
  });
  it('should infer true values as "Boolean"', () => {
    expect.assertions(1);
    return inferType(undefined, true).then((data) =>
      expect(data).toBe("Boolean")
    );
  });
  it('should infer false values as "Boolean"', () => {
    expect.assertions(1);
    return inferType(undefined, false).then((data) =>
      expect(data).toBe("Boolean")
    );
  });
  it('should infer date strings as "Date"', () => {
    expect.assertions(1);
    return inferType(undefined, "2020-01-01").then((data) =>
      expect(data).toBe("Date")
    );
  });
  it('should infer ISO date strings as "Date"', () => {
    expect.assertions(1);
    return inferType(undefined, "2022-02-07T19:16:08.644Z").then((data) =>
      expect(data).toBe("Date")
    );
  });
  it('should infer other strings as "String"', () => {
    expect.assertions(1);
    return inferType(
      undefined,
      "This is not a date 2022-02-07T19:16:08.644Z"
    ).then((data) => expect(data).toBe("String"));
  });
  it('should infer date values as "Date"', () => {
    expect.assertions(1);
    return inferType(undefined, new Date()).then((data) =>
      expect(data).toBe("Date")
    );
  });
  it('should infer integer numbers values as "Integer"', () => {
    expect.assertions(1);
    return inferType(undefined, 1).then((data) => expect(data).toBe("Integer"));
  });
  it('should infer long numbers values as "Long"', () => {
    expect.assertions(1);
    return inferType(undefined, Math.pow(2, 31)).then((data) =>
      expect(data).toBe("Long")
    );
  });
  it('should infer other numbers values as "Double"', () => {
    expect.assertions(1);
    return inferType(undefined, 1.1).then((data) =>
      expect(data).toBe("Double")
    );
  });
  it("should infer other values as JSON", () => {
    expect.assertions(1);
    return inferType(undefined, null).then((data) => expect(data).toBe("Json"));
  });
});

describe("toCamundaDateString", () => {
  it("should convert date to Camunda date string", () => {
    const a = new Date();
    expect(toCamundaDateString(a)).toBe(a.toISOString().replace(/Z$/, "+0000"));
  });
  it("should return ISO string as Camunda date string", () => {
    const a = new Date();
    expect(toCamundaDateString("2022-02-07 22:04:58.297+0200")).toBe(
      "2022-02-07T20:04:58.297+0000"
    );
    expect(toCamundaDateString("2022-02-07T22:04:58.297+0200")).toBe(
      "2022-02-07T20:04:58.297+0000"
    );
    expect(toCamundaDateString(a.toISOString())).toBe(
      a.toISOString().replace(/Z$/, "+0000")
    );
  });
  it("should return 'YYYY-MM-DD' to ISO string with local TZ", () => {
    // TODO: How to test with different locales
    expect([
      "2020-01-01T00:00:00.000+0200",
      "2020-01-01T00:00:00.000+0300",
    ]).toContain(toCamundaDateString("2020-01-01"));
  });
  it("should return 'YYYY-MM-DD{T| }HH:MM:SS[.s]' to ISO string with local TZ", () => {
    // TZ=Europe/Helsinki
    expect([
      "2020-01-01T00:00:00.000+0200",
      "2020-01-01T00:00:00.000+0300",
    ]).toContain(toCamundaDateString("2020-01-01"));
    expect([
      "2020-01-01T00:00:00.000+0200",
      "2020-01-01T00:00:00.000+0300",
    ]).toContain(toCamundaDateString("2020-01-01 00:00"));
    expect([
      "2020-01-01T00:00:00.000+0200",
      "2020-01-01T00:00:00.000+0300",
    ]).toContain(toCamundaDateString("2020-01-01T00:00"));
    expect([
      "2020-01-01T00:00:00.000+0200",
      "2020-01-01T00:00:00.000+0300",
    ]).toContain(toCamundaDateString("2020-01-01 00:00:00"));
    expect([
      "2020-01-01T00:00:00.000+0200",
      "2020-01-01T00:00:00.000+0300",
    ]).toContain(toCamundaDateString("2020-01-01T00:00:00"));
    expect([
      "2020-01-01T00:00:00.000+0200",
      "2020-01-01T00:00:00.000+0300",
    ]).toContain(toCamundaDateString("2020-01-01 00:00:00.000"));
    expect([
      "2020-01-01T00:00:00.000+0200",
      "2020-01-01T00:00:00.000+0300",
    ]).toContain(toCamundaDateString("2020-01-01T00:00:00.000"));
    expect([
      "2020-01-01T12:00:00.000+0200",
      "2020-01-01T12:00:00.000+0300",
    ]).toContain(toCamundaDateString("2020-01-01 12:00:00"));
    expect([
      "2020-01-01T12:00:00.000+0200",
      "2020-01-01T12:00:00.000+0300",
    ]).toContain(toCamundaDateString("2020-01-01T12:00:00"));
    expect([
      "2020-01-01T12:00:00.000+0200",
      "2020-01-01T12:00:00.000+0300",
    ]).toContain(toCamundaDateString("2020-01-01 12:00:00.000"));
    expect([
      "2020-01-01T12:00:00.000+0200",
      "2020-01-01T12:00:00.000+0300",
    ]).toContain(toCamundaDateString("2020-01-01T12:00:00.000"));
  });
});
