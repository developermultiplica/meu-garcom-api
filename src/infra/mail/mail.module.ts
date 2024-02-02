/* eslint-disable prettier/prettier */
import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';

import { MailService } from './mail.service';
@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'smtp.sendgrid.net',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_PASSWORD
        }
      }
    })
  ],
  controllers: [],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule { }