import countries from "./countries.json";
import currencies from "./currencies.json";
import type { Country, Currency } from "@/types";

export const COUNTRIES: Country[] = countries as Country[];
export const CURRENCIES: Currency[] = currencies as Currency[];

export function countryByIso2(iso2: string): Country | undefined {
  return COUNTRIES.find((c) => c.iso2 === iso2.toUpperCase());
}
