import { RequestStatus } from "./enum";

export interface StatusMenuOption {
  status: RequestStatus;
  label: string;
  icon: string;
  color: string;
}