import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as process from 'process';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtauthGuard implements CanActivate {
  constructor(@Inject(JwtService) private jwtService: JwtService) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    let isSocket: boolean;
    const req = context.switchToWs().getClient();
    if (req.handshake) {
      isSocket = true;
      //console.log(req.handshake.headers.authorization);
    } else {
      isSocket = false;
      //console.log(req.headers.authorization);
    }
    let token, decoded;
    switch (isSocket) {
      case false:
        const res = context.switchToHttp().getResponse();
        try {
          token = req.headers.authorization;
          if (!token) {
            res.status(400).json({ message: 'JWT가 존재하지 않습니다.' });
            return false;
          }
          decoded = this.jwtService.verify(token.toString(), {
            secret: process.env.SECRET,
          });
          if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
            req.body.jwtid = decoded.id;
            return true;
          }
          throw Error('알 수 없는 오류 발생');
        } catch (e) {}

      case true:
        const client = context.switchToWs().getClient();
        const body = context.switchToWs().getData();
        try {
          token = req.handshake.headers.authorization;
          if (!token) {
            client.emit('jwt', {
              statusCode: 400,
              message: '토큰이 존재하지 않습니다.',
            });
            return false;
          }
          decoded = this.jwtService.verify(token.toString(), {
            secret: process.env.SECRET,
          });
          if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
            body.jwtid = decoded.id;
            return true;
          }
          throw Error('알 수 없는 오류 발생');
        } catch (e) {
          client.emit('jwt', {
            statusCode: 400,
            message: '토큰이 존재하지 않습니다.',
          });
        }
    }
  }
}
