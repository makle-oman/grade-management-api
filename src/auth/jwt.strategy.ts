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
    
    if (!user) {
      return null;
    }
    
    // 确保 classNames 是数组
    let classNames = user.classNames || payload.classNames;
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
      userId: user.id,
      username: user.username,
      role: user.role,
      gradeLevel: user.gradeLevel,
      subject: user.subject,
      classNames: classNames || [],
      id: user.id,
      name: user.name,
      user: user
    };
  }
}