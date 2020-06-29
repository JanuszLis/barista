import { DtDateAdapter } from '@dynatrace/barista-components/core';

/** Checks whether the provided object is a valid date an returns it; null otherwise. */
export function getValidDateOrNull<D>(
  dateAdapter: DtDateAdapter<D>,
  obj: any,
): D | null {
  return dateAdapter.isDateInstance(obj) && dateAdapter.isValid(obj)
    ? obj
    : null;
}
