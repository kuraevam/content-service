import { ApiProperty } from '@nestjs/swagger';

export class ErrorDto {
  @ApiProperty({
    description: 'HTTP статус ошибки',
  })
  status?: number;

  @ApiProperty({
    description: 'Системный код ошибки, например E_VALIDATION_FAILED',
  })
  code?: string;

  @ApiProperty({
    description: 'Отображаемое пользователю user-friendly сообщение об ошибке',
  })
  title?: string;

  @ApiProperty({
    description: 'Подробности, отображаемые пользователю',
  })
  detail?: string;

  @ApiProperty({
    description: 'Стек-трейс ошибки в DEV режиме',
  })
  stack?: [];

  @ApiProperty({
    description: 'источник ошибки (в основном это будет полезно для форм)',
  })
  source: any;
}

export class ErrorResponseDto {
  @ApiProperty({ type: [ErrorDto] })
  errors?: ErrorDto[];
}
