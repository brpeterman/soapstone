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

export function validateLocation(input: any): Location {
  if (!input) {
    throw invalidLocationError();
  }

  try {
    const validating = {
      latitude: input.latitude,
      longitude: input.longitude
    };
    if (!validating.latitude || !validating.longitude) {
      throw invalidLocationError();
    }

    if (validating.latitude < -90 || validating.latitude > 90) {
      throw invalidLocationError();
    }
    if (validating.longitude < -180 || validating.longitude > 180) {
      throw invalidLocationError();
    }

    return <Location> validating;
  } catch {
    throw invalidLocationError();
  }
}

function invalidLocationError(): Error {
  return new Error("Invalid location");
}
