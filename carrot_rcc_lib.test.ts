import { TZ, inferType, isEqual, offsetToString } from "./carrot_rcc_lib";

describe("TZ", () => {
  it("should be +0000 (GMT), +0200 or +0300 (in a test setup)", () => {
    expect(["+0000", "+0200", "+0300"]).toContain(TZ);
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
