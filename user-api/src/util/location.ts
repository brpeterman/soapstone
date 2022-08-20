export interface Location {
  readonly latitude: number;
  readonly longitude: number;
}

export function parseLocation(input: string): Location {
  const parts = input.split(',', 2);
  return {
    latitude: parseFloat(parts[0]),
    longitude: parseFloat(parts[1])
  };
}
