import { User } from '../../src/types/User'; // Ganti path dan tipe User sesuai project Anda

declare global {
  namespace Express {
    interface Request {
      user?: User;
      isAuthenticated?: () => boolean;
      logout?: (callback: (err: any) => void) => void;
      session?: any;
    }
  }
}
export {};
