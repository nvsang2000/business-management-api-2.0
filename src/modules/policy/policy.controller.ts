import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBasicAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PERMISSION_SUBJECTS, ROLE } from 'src/constants';
import { PolicyEntity } from 'src/entities';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { PolicyService } from './policy.service';
import { FetchPolicyDto } from './dto/fetch-policy.dto';
import { Roles } from 'src/decorators';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { Public } from 'src/decorators';

@ApiTags('Policies')
@ApiBasicAuth('access-token')
@Controller('policies')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Get('/subjects')
  @ApiOkResponse({
    type: [String],
    description: 'All available permission subjects',
  })
  @Public()
  getAllSubject() {
    return PERMISSION_SUBJECTS;
  }

  @Post()
  @ApiOkResponse({ type: PolicyEntity, description: 'Policy Entity' })
  @Roles([ROLE.admin])
  create(@Body() createPolicyDto: CreatePolicyDto) {
    return this.policyService.create(createPolicyDto);
  }

  @Get()
  @ApiOkResponse({
    type: [PolicyEntity],
    description: 'List of policies by paginate',
  })
  @Roles([ROLE.admin])
  paginate(
    @Query() fetchPolicyDto: FetchPolicyDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PolicyEntity[]> {
    return this.policyService.paginate(fetchPolicyDto, res);
  }

  @Get('/list')
  @ApiOkResponse({
    type: [PolicyEntity],
    description: 'List of policies',
  })
  @Roles([ROLE.admin])
  list(@Query() fetchPolicyDto: FetchPolicyDto): Promise<PolicyEntity[]> {
    return this.policyService.list(fetchPolicyDto);
  }

  @Get('/:id')
  @ApiOkResponse({ type: PolicyEntity, description: 'Policy Entity' })
  @Roles([ROLE.admin])
  findOne(@Param('id') id: string): Promise<PolicyEntity> {
    return this.policyService.findOne(id);
  }

  @Put('/:id')
  @ApiOkResponse({ type: PolicyEntity, description: 'Policy Entity' })
  @HttpCode(200)
  @Roles([ROLE.admin])
  update(@Param('id') id: string, @Body() updatePolicyDto: UpdatePolicyDto) {
    return this.policyService.update(id, updatePolicyDto);
  }

  @Delete('/:id')
  @ApiOkResponse({ type: PolicyEntity, description: '' })
  @HttpCode(204)
  @Roles([ROLE.admin])
  delete(@Param('id') id: string) {
    return this.policyService.remove(id);
  }
}
