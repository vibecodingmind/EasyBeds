export interface ChannelCredentials {
  apiKey?: string;
  apiSecret?: string;
  accountIdentifier?: string;
  hotelIdOnChannel?: string;
  iCalImportUrl?: string;
  iCalExportUrl?: string;
}

export interface OutboundAvailabilityPayload {
  hotelId: string;
  roomTypeId: string;
  dateRange: { start: string; end: string };
  availableCount: number;
  stopSell?: boolean;
  minStay?: number;
  maxStay?: number;
  closedToArrival?: boolean;
  closedToDeparture?: boolean;
}

export interface OutboundRatePayload {
  hotelId: string;
  roomTypeId: string;
  ratePlanId: string;
  date: string;
  rate: number;
  currency: string;
}

export interface InboundReservationResult {
  externalReservationId: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  totalAmount: number;
  currency: string;
  roomTypeExternalId: string;
  status: 'confirmed' | 'cancelled' | 'modified';
}

export interface SyncResponse {
  success: boolean;
  statusCode: number;
  message: string;
  recordsProcessed: number;
  rawResponse?: any;
  error?: string;
}

export abstract class ChannelProvider {
  abstract channelId: string;
  abstract channelName: string;

  abstract authenticate(credentials: ChannelCredentials): Promise<{ valid: boolean; message: string }>;
  
  abstract pushAvailability(
    credentials: ChannelCredentials,
    payloads: OutboundAvailabilityPayload[]
  ): Promise<SyncResponse>;

  abstract pushRates(
    credentials: ChannelCredentials,
    payloads: OutboundRatePayload[]
  ): Promise<SyncResponse>;

  abstract pullReservations(
    credentials: ChannelCredentials,
    sinceTimestamp?: string
  ): Promise<{ success: boolean; reservations: InboundReservationResult[]; message: string }>;

  abstract cancelReservation(
    credentials: ChannelCredentials,
    externalReservationId: string,
    reason: string
  ): Promise<SyncResponse>;
}
