import { validateLocation } from "../../src/util/location";

describe('validateLocation', () => {
  it('accepts a valid location', () => {
    const location = validateLocation({
      latitude: 20.04,
      longitude: -43.66
    });
    expect(location.latitude).toBe(20.04);
    expect(location.longitude).toBe(-43.66);
  });

  it('rejects a null location', () => {
    try {
      validateLocation(undefined);
    } catch (e: any) {
      expect(e.message).toBe("Invalid location");
    }
  });

  it('rejects a blank location', () => {
    try {
      validateLocation({});
      fail();
    } catch (e: any) {
      expect(e.message).toBe("Invalid location");
    }
  });

  it ('rejects missing values', () => {
    try {
      validateLocation({
        latitude: 20
      });
      fail();
    } catch (e: any) {
      expect(e.message).toBe("Invalid location");
    }

    try {
      validateLocation({
        longitude: 20
      });
      fail();
    } catch (e: any) {
      expect(e.message).toBe("Invalid location");
    }
  });

  it('rejects non-numeric values', () => {
    try {
      validateLocation({
        latitude: "a"
      });
      fail();
    } catch (e: any) {
      expect(e.message).toBe("Invalid location");
    }

    try {
      validateLocation({
        longitude: "a"
      });
      fail();
    } catch (e: any) {
      expect(e.message).toBe("Invalid location");
    }
  });

  it('rejects invalid latitudes', () => {
    try {
      validateLocation({
        latitude: 100
      });
      fail();
    } catch (e: any) {
      expect(e.message).toBe("Invalid location");
    }

    try {
      validateLocation({
        latitude: -100
      });
      fail();
    } catch (e: any) {
      expect(e.message).toBe("Invalid location");
    }
  });

  it('rejects invalid longitudes', () => {
    try {
      validateLocation({
        latitude: 200
      });
      fail();
    } catch (e: any) {
      expect(e.message).toBe("Invalid location");
    }

    try {
      validateLocation({
        latitude: -200
      });
      fail();
    } catch (e: any) {
      expect(e.message).toBe("Invalid location");
    }
  });
});
