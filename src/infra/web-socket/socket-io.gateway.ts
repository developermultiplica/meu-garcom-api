import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { Subject } from './enums/subjects';

type Message = {
  subject: Subject;
  tableSessionId: string;
  content: unknown;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketIoGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;
  private logger: Logger = new Logger('WebSocketGateway');

  emitMessage(message: Message) {
    const { subject, tableSessionId, content } = message;
    this.server.emit(subject, { tableSessionId, content });
    this.logger.log(JSON.stringify(message, null, 2));
  }

  afterInit() {
    this.logger.log('WebSocket Initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id} `);
  }
}
