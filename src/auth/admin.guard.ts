import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request?.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('Unauthorized.');
    }

    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !user.isActive) {
      throw new ForbiddenException('Admin access required.');
    }
    if (!user.isAdmin) {
      throw new ForbiddenException('Admin access required.');
    }

    return true;
  }
}
