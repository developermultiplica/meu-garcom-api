import { BillItem } from './bill-item.entity';
import { TableSessionParticipant } from './participant.entity';

export class ParticipantBill {
  participant: TableSessionParticipant;
  bill: BillItem[];
  totalPriceCents: number;
}
