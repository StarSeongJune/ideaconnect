import { Injectable } from '@nestjs/common';
import { AuthJoinDto } from './model/dto/request/auth.join.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './model/User.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { NormalResponseDto } from './model/dto/response/normal.response.dto';
import { ErrorResponseDto } from './model/dto/response/error.response.dto';
import { AuthCheckDto } from './model/dto/request/auth.check.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private ResponseDto: NormalResponseDto,
    private ErrorResponseDto: ErrorResponseDto,
  ) {
    this.userRepository = userRepository;
  }

  async join(body: AuthJoinDto) {
    try {
      const found = await this.userRepository.findOneBy({ id: body.id });
      if (found) {
        return this.ResponseDto.set(401, '이미 등록된 ID입니다.');
      }
      body.pw = await bcrypt.hash(body.pw, 12);
      body._id = 'test2'; //랜덤 값 생성 후 기존에 있는지 검증해야함.
      await this.userRepository.save(body);
      return this.ResponseDto.set(201, '정상적으로 등록되었습니다');
    } catch (e) {
      return this.ErrorResponseDto.set(500, '서버측 오류가 발생했습니다', e);
    }
  }

  async check(auth, body: AuthCheckDto) {
    try {
      const found = await this.userRepository.findOneBy({ id: auth });
      if (!found) {
        return this.ResponseDto.set(401, '일치하지 않습니다.');
      }
      const result = await bcrypt.compare(body.pw, found.pw);
      if (result) {
        return this.ResponseDto.set(201, '일치합니다.');
      }
      return this.ResponseDto.set(401, '일치하지 않습니다.');
    } catch (e) {
      return this.ErrorResponseDto.set(500, '서버측 오류가 발생했습니다', e);
    }
  }
}
