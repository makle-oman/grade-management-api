import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', 'your-secret-key'),
    });
  }

  async validate(payload: any) {
    const user = await this.authService.findById(payload.sub);
    
    // 确保 classNames 是数组
    let classNames = payload.classNames;
    if (classNames && !Array.isArray(classNames)) {
      try {
        if (typeof classNames === 'string') {
          classNames = JSON.parse(classNames);
        }
      } catch (e) {
        classNames = classNames.split(',').filter(Boolean);
      }
    }
    
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
      gradeLevel: payload.gradeLevel,
      subject: payload.subject,
      classNames: classNames || [],
      id: payload.sub,  // 添加id字段以保持一致性
      user: user
    };
  }
}