import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthConfigService } from './auth-config.service';
import { SettingsService } from '../settings/settings.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly authConfigService: AuthConfigService,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request) => {
          const token = request?.query?.token ?? request?.query?.accessToken;
          return typeof token === 'string' ? token : null;
        },
        (request) => {
          const raw = request?.headers?.cookie;
          if (!raw) return null;
          const token = raw
            .split(';')
            .map((part) => part.trim())
            .find((part) => part.startsWith('bmsAccessToken='));
          if (!token) return null;
          return decodeURIComponent(token.slice('bmsAccessToken='.length));
        },
      ]),
      ignoreExpiration: false,
      secretOrKeyProvider: async (request, rawJwtToken, done) => {
        const auth = settingsService.getSettings().auth;
        const secrets = await authConfigService.getSecrets();
        const secret = secrets.accessSecret ?? auth.accessSecret;
        if (!secret) {
          return done(new UnauthorizedException('JWT secret is not configured.'));
        }
        return done(null, secret);
      },
    });
  }

  async validate(payload: { sub: string; username?: string; email?: string }) {
    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid token.');
    }

    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
    };
  }
}
