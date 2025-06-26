

export interface ZoneData {
  id: string;
  name: string;
  locationId?: string;
  locationName?: string;
}

export interface LocationData {
  id: string;
  name: string;
}

export interface LocationWithZones {
  locationId: string;
  locationName: string;
  zones: ZoneData[];
}

export interface LocationDetails {
  data: {
    Zone: ZoneData[];
    // Add other location details properties as needed
  };
}
