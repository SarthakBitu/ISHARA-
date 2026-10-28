export interface GeoLocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: number | null;
  address: string;
  error: string | null;
  loading: boolean;
}

export class LocationService {
  // Request current device GPS coordinates
  public static getCurrentLocation(): Promise<GeoLocationState> {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        return resolve({
          latitude: null,
          longitude: null,
          accuracy: null,
          timestamp: null,
          address: 'Geolocation is not supported by your browser',
          error: 'Geolocation not supported',
          loading: false,
        });
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const timestamp = position.timestamp;

          let address = `Coordinates: ${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E`;

          try {
            // Optional OpenStreetMap reverse geocode
            const resp = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' } }
            );
            if (resp.ok) {
              const data = await resp.json();
              if (data.display_name) {
                address = data.display_name;
              }
            }
          } catch (_) {
            // Keep coordinates string if reverse geocode fails offline
          }

          resolve({
            latitude,
            longitude,
            accuracy: Math.round(accuracy),
            timestamp,
            address,
            error: null,
            loading: false,
          });
        },
        (err) => {
          let errorMsg = 'Could not retrieve device location.';
          if (err.code === err.PERMISSION_DENIED) {
            errorMsg = 'Location permission was denied. Please enable GPS in device settings.';
          } else if (err.code === err.TIMEOUT) {
            errorMsg = 'Location request timed out. Please retry.';
          }
          resolve({
            latitude: null,
            longitude: null,
            accuracy: null,
            timestamp: null,
            address: 'GPS Unavailable',
            error: errorMsg,
            loading: false,
          });
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 }
      );
    });
  }

  // Format emergency message for India's 112 emergency services and trusted contacts
  public static formatEmergencyMessage(
    type: 'medical' | 'fire' | 'police' | 'general',
    location: GeoLocationState,
    patientNote?: string
  ): {
    title: string;
    body: string;
    smsUri: string;
    whatsappUri: string;
    mapUrl: string;
  } {
    const typeLabels = {
      medical: 'MEDICAL EMERGENCY (AMBULANCE)',
      fire: 'FIRE EMERGENCY ASSISTANCE',
      police: 'POLICE EMERGENCY ASSISTANCE',
      general: 'GENERAL EMERGENCY ASSISTANCE',
    };

    const typeLabel = typeLabels[type];
    const coordsStr =
      location.latitude && location.longitude
        ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} (±${location.accuracy || 10}m)`
        : 'GPS Location Pending';

    const mapUrl =
      location.latitude && location.longitude
        ? `https://maps.google.com/?q=${location.latitude},${location.longitude}`
        : 'https://maps.google.com/';

    const body = `EMERGENCY ASSISTANCE REQUIRED - ISHARA AI
CALLER: Deaf / Hard of Hearing Individual
TYPE: ${typeLabel}
LOCATION: ${coordsStr}
ADDRESS: ${location.address}
MAP: ${mapUrl}
${patientNote ? `NOTE: ${patientNote}\n` : ''}DISPATCH NOTE: Caller communicates via Indian Sign Language / text only. Please dispatch responder and send SMS confirmation.`;

    const smsUri = `sms:112?body=${encodeURIComponent(body)}`;
    const whatsappUri = `https://wa.me/?text=${encodeURIComponent(body)}`;

    return {
      title: typeLabel,
      body,
      smsUri,
      whatsappUri,
      mapUrl,
    };
  }
}
