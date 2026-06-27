export interface QRCodeData {
  type: 'team' | 'participant' | 'project';
  teamId?: string;
  participantEmail?: string;
  projectId?: string;
  token: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface QRCodeGenerationRequest {
  type: QRCodeData['type'];
  teamId?: string;
  participantEmail?: string;
  projectId?: string;
  expiresIn?: number;
  customData?: Record<string, unknown>;
}

export interface QRCodeResponse {
  qrToken: string;
  qrCodeUrl: string;
  qrCodeDataUrl: string;
  expiresAt?: string;
}

export interface QRScanResult {
  success: boolean;
  data?: QRCodeData;
  error?: string;
  team?: import('./team').Team;
  participant?: import('./auth').User;
}

export interface QRScannerConfig {
  facingMode: 'environment' | 'user';
  fps: number;
  qrbox: { width: number; height: number };
  formats: string[];
}

export interface AttendanceRecord {
  id: string;
  teamId: string;
  scannedBy: string;
  scannedByRole: string;
  scannedAt: string;
  method: 'qr' | 'manual';
  location?: string;
  verified: boolean;
}

export interface BulkQRGenerationRequest {
  teamIds: string[];
  type: 'team' | 'participant';
  format?: 'png' | 'svg' | 'pdf';
}