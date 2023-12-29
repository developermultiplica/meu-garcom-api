import { Module } from '@nestjs/common';

import { SocketIoGateway } from './socket-io.gateway';

@Module({
  providers: [SocketIoGateway],
  exports: [SocketIoGateway],
})
export class WebSocketModule {}
