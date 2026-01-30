import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SettingsService } from '../settings/settings.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly settingsService: SettingsService,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        const secret = settingsService.getSettings().auth.accessSecret;
        if (!secret) {
          return done(new UnauthorizedException('JWT secret is not configured.'));
        }
        return done(null, secret);
      },
    });
  }

  async validate(payload: { sub: string; email?: string }) {
    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid token.');
    }

    return { userId: user.id, email: user.email };
  }
}
