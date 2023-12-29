import { MailerModule } from '@nestjs-modules/mailer';
import { InternalServerErrorException, Module } from '@nestjs/common';
import { ReactAdapter } from '@webtre/nestjs-mailer-react-adapter';

import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => {
        const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD } =
          process.env;

        if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASSWORD) {
          throw new InternalServerErrorException(
            'Mail configuration was not defined',
          );
        }

        return {
          transport: {
            host: EMAIL_HOST,
            ...(EMAIL_PORT && { port: Number(EMAIL_PORT) }),
            secure: false,
            auth: {
              user: EMAIL_USER,
              pass: EMAIL_PASSWORD,
            },
          },
          defaults: {
            from: '"Meu Garçom" <suporte@meugarcom.com>',
          },
          template: {
            dir: __dirname + '/templates',
            adapter: new ReactAdapter(),
          },
        };
      },
    }),
  ],
  controllers: [],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
