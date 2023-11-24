import { Ability, AbilityBuilder, AbilityClass } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { ACTION, ROLE_ADMIN, TABLES } from 'src/constants';
import { PrismaService } from 'nestjs-prisma';

type Subjects = keyof typeof TABLES | 'all';

export type AppAbility = Ability<[ACTION, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  constructor(private readonly prismaService: PrismaService) {}

  async createForUser(id: string) {
    const { can, build } = new AbilityBuilder<Ability<[ACTION, Subjects]>>(
      Ability as AbilityClass<AppAbility>,
    );

    const user = await this.prismaService.user.findFirst({
      where: { id },
      include: {
        policy: true,
      },
    });

    if (ROLE_ADMIN.includes(user?.role)) {
      can(ACTION.Manage, 'all');

      return build({});
    }

    const permissions = user?.policy?.isActive ? user?.policy?.permissions : [];

    (permissions as any).map((permission: any) =>
      can(permission.action as ACTION, permission.subject as TABLES),
    );

    return build({});
  }
}
