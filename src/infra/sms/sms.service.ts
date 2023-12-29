import { Injectable } from '@nestjs/common';
import * as twilio from 'twilio';

type SendSmsInput = {
  to: string;
  message: string;
};

@Injectable()
export class SmsService {
  private client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

  async sendSms({ to, message }: SendSmsInput) {
    const sms = await this.client.messages.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
      body: message,
    });

    return sms;
  }
}
