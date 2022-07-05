import { TypedValue } from "camunda-external-task-client-js";

export const isInteger = (a: any): boolean =>
  Number.isInteger(a) && a >= -Math.pow(2, 31) && a <= Math.pow(2, 31) - 1;
export const isLong = (a: any): boolean => Number.isInteger(a) && !isInteger(a);
export const isDouble = (a: any): boolean =>
  typeof a === "number" && !Number.isInteger(a);
export const isBoolean = (a: any): boolean => typeof a === "boolean";
export const isString = (a: any): boolean => typeof a === "string";
export const isJson = (a: any): boolean => typeof a === "object";
export const isDate = (a: any): boolean =>
  a instanceof Date ||
  !!(typeof a === "string" && a.match(/^\d{4}-\d{2}-\d{2}[T\s]?[0-9:.Z\-+]*$/));

export const offsetToString = (offset: number): string => {
  const base =
    (Math.floor(Math.abs(offset) / 60) * 100 + (Math.abs(offset) % 60)) *
    (offset > 0 ? -1 : 1);
  if (base >= 1000) {
    return `+${base}`;
  } else if (base >= 100) {
    return `+0${base}`;
  } else if (base >= 10) {
    return `+00${base}`;
  } else if (base >= 1) {
    return `+000${base}`;
  } else if (base < 0 && base <= -1000) {
    return `-${Math.abs(base)}`;
  } else if (base < 0 && base <= -100) {
    return `-0${Math.abs(base)}`;
  } else if (base < 0 && base <= -10) {
    return `-00${Math.abs(base)}`;
  } else if (base < 0 && base <= -1) {
    return `-000${Math.abs(base)}`;
  } else {
    return "+0000";
  }
};

export const TZ: string = ((): string => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return offsetToString(offset);
})();

export const isEqual = (old: TypedValue | undefined, current: any): boolean => {
  if (old === undefined) {
    return false;
  }
  const oldType = inferType(old);
  const currType = inferType(current);
  if (oldType !== currType) {
    return false;
  }
  switch (currType) {
    case "File":
      return false;
    case "Date":
      return new Date(old.value).getTime() === new Date(current).getTime();
    default:
      return old.value === current;
  }
};

export const inferType = (current: any): string => {
  if (isBoolean(current)) {
    return "Boolean";
  } else if (isDate(current)) {
    return "Date";
  } else if (isString(current)) {
    return "String";
  } else if (isInteger(current)) {
    return "Integer";
  } else if (isDouble(current)) {
    return "Double";
  } else if (isLong(current)) {
    return "Long";
  }
  return "Json";
};

export const toCamundaDateString = (value: Date | string): string => {
  // Should be compatible with ISO strings and Robot Framework timestamps
  // https://robotframework.org/robotframework/latest/libraries/DateTime.html
  if (value instanceof Date) {
    return value.toISOString().replace(/Z$/, "+0000");
  } else {
    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Simple date string
      return `${value}T00:00:00.000${TZ}`;
    } else if (value.match(/^\d{4}-\d{2}-\d{2}[T\s]?\d{2}:\d{2}$/)) {
      // Naive datetime string without seconds and timezone
      return `${value.substring(0, 10)}T${value.substring(11)}:00.000${TZ}`;
    } else if (value.match(/^\d{4}-\d{2}-\d{2}[T\s]?\d{2}:\d{2}:\d{2}$/)) {
      // Naive datetime string without milliseconds and timezone
      return `${value.substring(0, 10)}T${value.substring(11)}.000${TZ}`;
    } else if (
      value.match(/^\d{4}-\d{2}-\d{2}[T\s]?\d{2}:\d{2}:\d{2}\.\d{3}$/)
    ) {
      // Naive datetime string without timezone
      return `${value.substring(0, 10)}T${value.substring(11)}${TZ}`;
    } else if (
      value.match(/^\d{4}-\d{2}-\d{2}[T\s]?\d{2}:\d{2}:\d{2}\.\d{3}[\-+]\d{4}$/)
    ) {
      // Datetime string with timezone
      return new Date(`${value.substring(0, 10)}T${value.substring(11)}`)
        .toISOString()
        .replace(/Z$/, "+0000");
    } else {
      // Datetime string in GMT
      return new Date(value).toISOString().replace(/Z$/, "+0000");
    }
  }
};
