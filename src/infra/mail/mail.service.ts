/* eslint-disable prettier/prettier */
import { MailerService } from '@nestjs-modules/mailer';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
@Injectable()
export class MailService {
  private logger: Logger = new Logger('MailService');

  constructor(private readonly mailerService: MailerService) { }

  async sendEmail({ to, subject, context }: any) {

    const html = `
    <Html>
    <Head />
    <Preview>Meu garçom: Sua nova senha</Preview>
    <Section
      style={{
        backgroundColor: '#ffffff',
        margin: '0 auto',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      <Container
        style={{
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        <Section
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            marginTop: '32px',
          }}
        >
          <Img src="https://i.imgur.com/l3UspRl.jpg" alt="Meu Garçom Logo" />
        </Section>
        <Text
          style={{
            fontSize: '20px',
            lineHeight: '28px',
            marginBottom: '30px',
          }}
        >
          Olá ${context.name}! Recebemos sua solicitação de recuperação de senha e
          alteramos sua senha para esta abaixo:
        </Text>

        <Section
          style={{
            background: 'rgb(245, 244, 245)',
            borderRadius: '4px',
            marginRight: '50px',
            marginBottom: '30px',
            padding: '43px 23px',
          }}
        >
          <Text
            style={{
              fontSize: '30px',
              textAlign: 'center' as const,
              verticalAlign: 'middle',
            }}
          >
            ${context.password}
          </Text>
        </Section>
      </Container>
    </Section>
  </Html>
    `
    try {
      const from = process.env.SENDGRID_EMAIL;
      await this.mailerService.sendMail({
        to,
        from,
        subject,
        html
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