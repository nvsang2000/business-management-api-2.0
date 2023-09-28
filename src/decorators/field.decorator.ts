import { applyDecorators } from '@nestjs/common';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsInt,
  IsNumber,
  Min,
  Max,
  IsPositive,
  IsEnum,
  IsBoolean,
  IsDate,
  IsUrl,
  IsEmail,
  Matches,
  Equals,
  MinDate,
  MaxDate,
  IsObject,
  ValidateNested,
  ValidationArguments,
  IsNumberString,
  IsBooleanString,
  IsJSON,
  ValidateIf,
  ArrayMinSize,
  ArrayMaxSize,
  IsIn,
  IsNotIn,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import {
  ToBoolean,
  ToLowerCase,
  ToUpperCase,
  Trim,
} from './transform.decorator';
import { Type } from 'class-transformer';
import { isNumber } from 'lodash';
import { ToArray } from './transform.decorator';
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';

const validation = {
  IsString: ({ property }) => `${property} needs to be a string`,
  IsJSON: ({ property }) => `${property} needs to be a valid JSON`,
  IsNotEmpty: ({ property }) => `${property} cannot be empty`,
  MinLength: ({ property, constraints }) =>
    `${property} needs to be at least ${constraints?.[0]}`,
  MaxLength: ({ property, constraints }) =>
    `${property} needs to be less than ${constraints?.[0]}`,
  IsIn: ({ property, constraints }) =>
    `${property} needs to be one of these values:  ${constraints?.[0]}`,
  IsNotIn: ({ property, constraints }) =>
    `${property} needs to not be one of these values: ${constraints?.[0]}`,
  IsUrl: ({ property }) => `${property} needs to be a valid url`,
  IsEmail: ({ property }) => `${property} needs to be a valid email`,
  Regex: ({ property }) => `${property} is not valid`,
  IsInt: ({ property }) => `${property} needs to be integer`,
  IsNumber: ({ property }) => `${property} needs to be number`,
  Min: ({ property, constraints }) =>
    `${property} needs to be at least ${constraints?.[0]}`,
  Max: ({ property, constraints }) =>
    `${property} needs to be less than ${constraints?.[0]}`,
  IsPositive: ({ property }) => `${property} needs to be positive`,
  Equals: ({ property }) => `${property} needs to be equal with "{value}"`,
  IsEnum: ({ property }) => `${property} needs to be one of these values: `,
  IsBoolean: ({ property }) => `${property} needs to be boolean`,
  IsDate: ({ property }) => `${property} must be a Date instance`,
  MinDate: ({ property, constraints }) =>
    `${property} needs to be at least ${constraints?.[0]}`,
  MaxDate: ({ property, constraints }) =>
    `${property} needs to be less than ${constraints?.[0]}`,
  PhoneNumber: ({ property }) => `${property} needs to be valid phone number`,
  ArrayMaxSize: ({ property, constraints }) =>
    `${property} number of items cannot exceed ${constraints?.[0]}`,
  ArrayMinSize: ({ property, constraints }) =>
    `${property} number of items at least ${constraints?.[0]}`,
  IsEqualTo: ({ property, constraints }) =>
    `${property} is not equal with ${constraints?.[0]} field`,
  IsArray: ({ property }) => `${property} needs to be an array`,
  IsObject: ({ property }) => `${property} needs to be an object`,
  IsType: ({ property }) => `${property} type is invalid`,
};

interface IStringFieldOptions {
  each?: boolean;
  in?: any[];
  length?: number;
  minLength?: number;
  maxLength?: number;
  minSize?: number;
  maxSize?: number;
  toLowerCase?: boolean;
  toUpperCase?: boolean;
  allowEmpty?: boolean;
  email?: boolean;
  url?: boolean;
  number?: boolean;
  json?: boolean;
  bool?: boolean;
  regex?: { pattern: string; message?: string };
  equalTo?: string;
  password?: boolean;
  swaggerOptions?: ApiPropertyOptions;
}

interface INumberFieldOptions {
  each?: boolean;
  minimum?: number;
  maximum?: number;
  minSize?: number;
  maxSize?: number;
  int?: boolean;
  isPositive?: boolean;
  equal?: boolean;
  swaggerOptions?: ApiPropertyOptions;
}

interface IEnumFieldOptions {
  each?: boolean;
  minSize?: number;
  maxSize?: number;
  swaggerOptions?: ApiPropertyOptions;
  exclude?: any[];
}
interface IDateFieldOptions {
  each?: boolean;
  minSize?: number;
  maxSize?: number;
  minDate?: Date;
  maxDate?: Date;
  swaggerOptions?: ApiPropertyOptions;
}

interface IBooleanFieldOptions {
  each?: boolean;
  minSize?: number;
  maxSize?: number;
  swaggerOptions?: ApiPropertyOptions;
}

interface IObjectFieldOptions {
  each?: boolean;
  minSize?: number;
  maxSize?: number;
  swaggerOptions?: ApiPropertyOptions;
}

export function StringField(
  options: IStringFieldOptions = {},
): PropertyDecorator {
  const { each, minSize, maxSize, swaggerOptions } = options;

  const decorators = [
    ApiProperty({ ...swaggerOptions }),
    IsString({ each, message: validation.IsString }),
    Trim(),
  ];

  if (each && isNumber(minSize)) {
    decorators.push(
      ArrayMinSize(minSize, {
        message: validation.ArrayMinSize,
      }),
    );
  }

  if (each && isNumber(maxSize)) {
    decorators.push(
      ArrayMaxSize(maxSize, {
        message: validation.ArrayMaxSize,
      }),
    );
  }

  if (options?.allowEmpty === false) {
    decorators.push(IsNotEmpty({ each, message: validation.IsNotEmpty }));
  }

  if (options?.bool) {
    decorators.push(IsBooleanString({ each, message: validation.IsBoolean }));
  }

  if (options?.number) {
    decorators.push(IsNumberString({}, { each, message: validation.IsNumber }));
  }

  if (options?.json) {
    decorators.push(IsJSON({ each, message: validation.IsJSON }));
  }

  if (options?.length) {
    decorators.push(
      MinLength(options.length, {
        each,
        message: validation.MinLength,
      }),
    );
    decorators.push(
      MaxLength(options.length, {
        each,
        message: validation.MaxLength,
      }),
    );
  }

  if (options?.minLength) {
    decorators.push(
      MinLength(options.minLength, {
        each: true,
        message: validation.MinLength,
      }),
    );
  }

  if (options?.maxLength) {
    decorators.push(
      MaxLength(options.maxLength, {
        each: true,
        message: validation.MaxLength,
      }),
    );
  }

  if (options.url) {
    decorators.push(IsUrl({}, { each, message: validation.IsUrl }));
  }

  if (options.email) {
    decorators.push(IsEmail({}, { each, message: validation.IsEmail }));
  }

  if (options?.regex) {
    decorators.push(
      Matches(new RegExp(options?.regex.pattern), {
        each,
        message: options.regex.message || validation.Regex,
      }),
    );
  }

  if (options?.in?.length > 0) {
    decorators.push(
      IsIn(options.in, {
        each,
        message: (args: ValidationArguments) =>
          `${validation.IsIn(args)} ${options.in.join(', ')}`,
      }),
    );
  }

  if (options.equalTo) {
    decorators.push(
      IsEqualTo(options.equalTo, {
        each,
        message: validation.IsEqualTo,
      }),
    );
  }

  if (options?.toLowerCase) {
    decorators.push(ToLowerCase());
  }

  if (options?.toUpperCase) {
    decorators.push(ToUpperCase());
  }

  return applyDecorators(...decorators);
}

export function IsEqualTo<T>(
  property: keyof T,
  validationOptions?: ValidationOptions,
) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      name: 'IsEqualTo',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return value === relatedValue;
        },

        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${propertyName} must match ${relatedPropertyName} exactly`;
        },
      },
    });
  };
}

export function StringFieldOptional(
  options: IStringFieldOptions = {},
): PropertyDecorator {
  const { swaggerOptions } = options;

  return applyDecorators(
    ApiProperty({ required: false, ...swaggerOptions }),
    IsOptional(),
    ValidateIf((_, value) =>
      Array.isArray(value) ? Boolean(value?.length > 0) : Boolean(value),
    ),
    StringField({ ...options }),
  );
}

export function NumberField(
  options: INumberFieldOptions = {},
): PropertyDecorator {
  const {
    each,
    int,
    minSize,
    maxSize,
    minimum,
    maximum,
    isPositive,
    equal,
    swaggerOptions,
  } = options;

  const decorators = [ApiProperty({ ...swaggerOptions }), Type(() => Number)];

  if (int) {
    decorators.push(IsInt({ each, message: validation.IsInt }));
  } else {
    decorators.push(IsNumber({}, { each, message: validation.IsNumber }));
  }

  if (each && isNumber(minSize)) {
    decorators.push(
      ArrayMinSize(minSize, {
        message: validation.ArrayMinSize,
      }),
    );
  }

  if (each && isNumber(maxSize)) {
    decorators.push(
      ArrayMaxSize(maxSize, {
        message: validation.ArrayMaxSize,
      }),
    );
  }

  if (isNumber(minimum)) {
    decorators.push(Min(minimum, { each, message: validation.Min }));
  }

  if (isNumber(maximum)) {
    decorators.push(Max(maximum, { each, message: validation.Max }));
  }

  if (isPositive) {
    decorators.push(
      IsPositive({
        each,
        message: validation.IsPositive,
      }),
    );
  }

  if (equal) {
    decorators.push(
      Equals(equal, {
        each,
        message: validation.Equals,
      }),
    );
  }

  return applyDecorators(...decorators);
}

export function NumberFieldOptional(
  options: INumberFieldOptions = {},
): PropertyDecorator {
  const { swaggerOptions } = options;
  return applyDecorators(
    ApiProperty({ required: false, ...swaggerOptions }),
    IsOptional(),
    ValidateIf((_, value) =>
      Array.isArray(value) ? Boolean(value?.length > 0) : Boolean(value),
    ),
    NumberField({ ...options }),
  );
}

export function EnumField<TEnum>(
  getEnum: () => TEnum,
  options: IEnumFieldOptions = {},
): PropertyDecorator {
  const enumValue = getEnum() as unknown;
  const { each, minSize, maxSize, exclude, swaggerOptions } = options;

  const decorators = [
    ApiProperty({ ...swaggerOptions, enum: enumValue }),
    IsEnum(enumValue as object, {
      each: options?.each,
      message: (validationArgs: ValidationArguments) =>
        validation.IsEnum(validationArgs) + Object.values(enumValue),
    }),
  ];

  if (exclude?.length > 0) {
    decorators.push(IsNotIn(exclude, { each, message: validation.IsNotIn }));
  }

  if (each) {
    decorators.push(ToArray());
  }

  if (each && isNumber(minSize)) {
    decorators.push(
      ArrayMinSize(minSize, {
        message: validation.ArrayMinSize,
      }),
    );
  }

  if (each && isNumber(maxSize)) {
    decorators.push(
      ArrayMaxSize(maxSize, {
        message: validation.ArrayMaxSize,
      }),
    );
  }

  return applyDecorators(...decorators);
}

export function EnumFieldOptional<TEnum>(
  getEnum: () => TEnum,
  options: IEnumFieldOptions = {},
): PropertyDecorator {
  const { swaggerOptions } = options;
  return applyDecorators(
    ApiProperty({ required: false, ...swaggerOptions }),
    IsOptional(),
    ValidateIf((_, value) =>
      Array.isArray(value) ? Boolean(value?.length > 0) : Boolean(value),
    ),
    EnumField(getEnum, { ...options }),
  );
}

export function BooleanField(
  options: IBooleanFieldOptions = {},
): PropertyDecorator {
  const { each, minSize, maxSize, swaggerOptions } = options;

  const decorators = [
    ApiProperty({ ...swaggerOptions }),
    IsBoolean({ each, message: validation.IsBoolean }),
    ToBoolean(),
  ];

  if (each && isNumber(minSize)) {
    decorators.push(
      ArrayMinSize(minSize, {
        message: validation.ArrayMinSize,
      }),
    );
  }

  if (each && isNumber(maxSize)) {
    decorators.push(
      ArrayMaxSize(maxSize, {
        message: validation.ArrayMaxSize,
      }),
    );
  }

  return applyDecorators(...decorators);
}

export function BooleanFieldOptional(
  options: Partial<{ each: boolean; swaggerOptions?: ApiPropertyOptions }> = {},
): PropertyDecorator {
  const { swaggerOptions } = options;
  return applyDecorators(
    ApiProperty({ required: false, ...swaggerOptions }),
    IsOptional(),
    ValidateIf((_, value) =>
      Array.isArray(value) ? Boolean(value?.length > 0) : Boolean(value),
    ),
    BooleanField({ ...options }),
  );
}

export function DateField(options: IDateFieldOptions): PropertyDecorator {
  const { each, minSize, maxSize, minDate, maxDate, swaggerOptions } = options;

  const decorators = [
    ApiProperty({ ...swaggerOptions }),
    Type(() => Date),
    IsDate({ each, message: validation.IsDate }),
  ];

  if (each && isNumber(minSize)) {
    decorators.push(
      ArrayMinSize(minSize, {
        message: validation.ArrayMinSize,
      }),
    );
  }

  if (each && isNumber(maxSize)) {
    decorators.push(
      ArrayMaxSize(maxSize, {
        message: validation.ArrayMaxSize,
      }),
    );
  }

  if (minDate) {
    decorators.push(
      MinDate(minDate, {
        each,
        message: validation.MinDate,
      }),
    );
  }

  if (maxDate) {
    decorators.push(
      MaxDate(maxDate, {
        each,
        message: validation.MaxDate,
      }),
    );
  }

  return applyDecorators(...decorators);
}

export function DateFieldOptional(
  options: IDateFieldOptions = {},
): PropertyDecorator {
  const { swaggerOptions } = options;
  return applyDecorators(
    ApiProperty({ required: false, ...swaggerOptions }),
    IsOptional(),
    ValidateIf((_, value) =>
      Array.isArray(value) ? Boolean(value?.length > 0) : Boolean(value),
    ),
    DateField({ ...options }),
  );
}

export function ObjectField(
  type?: any,
  options: IObjectFieldOptions = {},
): PropertyDecorator {
  const { each, minSize, maxSize, swaggerOptions } = options;

  const decorators = [IsObject({ each, message: validation.IsObject })];

  if (type) {
    decorators.push(
      ApiProperty({
        type: each ? [type] : type,
        ...swaggerOptions,
      }),
      ValidateIf((_, value) => Boolean(value)),
      Type(() => type),
      ValidateNested({ each, message: validation.IsType }),
    );
  }

  if (each && isNumber(minSize)) {
    decorators.push(
      ArrayMinSize(minSize, {
        message: validation.ArrayMinSize,
      }),
    );
  }

  if (each && isNumber(maxSize)) {
    decorators.push(
      ArrayMaxSize(maxSize, {
        message: validation.ArrayMaxSize,
      }),
    );
  }

  return applyDecorators(...decorators);
}

export function ObjectFieldOptional(
  type?: any,
  options: IObjectFieldOptions = {},
): PropertyDecorator {
  const { each, swaggerOptions } = options;

  const decorators = [
    ApiProperty({
      required: false,
      type: each ? [type] : type,
      ...swaggerOptions,
    }),
    IsOptional(),
    ObjectField(type, options),
  ];

  return applyDecorators(...decorators);
}

export function ArrayField(type?: any): PropertyDecorator {
  const decorators = [ValidateNested({ each: true }), Type(() => type)];

  return applyDecorators(...decorators);
}

export function ArrayFieldOptional(type?: any): PropertyDecorator {
  return applyDecorators(IsOptional(), ArrayField(type));
}
