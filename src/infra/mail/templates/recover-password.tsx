import { Container } from '@react-email/container';
import { Head } from '@react-email/head';
import { Html } from '@react-email/html';
import { Img } from '@react-email/img';
import { Preview } from '@react-email/preview';
import { Section } from '@react-email/section';
import { Text } from '@react-email/text';

interface RecoverPasswordProps {
  password: string;
  name: string;
}

export default function RecoverPassword({
  name,
  password,
}: RecoverPasswordProps) {
  return (
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
            Olá {name}! Recebemos sua solicitação de recuperação de senha e
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
              {password}
            </Text>
          </Section>
        </Container>
      </Section>
    </Html>
  );
}
