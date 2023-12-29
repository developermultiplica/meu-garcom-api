import { MailerService } from '@nestjs-modules/mailer';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { MailTemplates } from './enums/templates';

type SendMailInput = {
  to: string;
  subject: string;
} & ContextOptions;

@Injectable()
export class MailService {
  private logger: Logger = new Logger('MailService');

  constructor(private readonly mailerService: MailerService) {}

  async sendEmail({ to, subject, template, context }: SendMailInput) {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });
    } catch (error) {
      this.logger.error(JSON.stringify(error));
      throw new InternalServerErrorException({
        error: 'Internal Server Error',
        statusCode: 500,
        message: 'Error while sending email',
      });
    }
  }
}

type RecoverPassword = {
  template: MailTemplates.RECOVER_PASSWORD;
  context: {
    name: string;
    password: string;
  };
};
type ContextOptions = RecoverPassword;
