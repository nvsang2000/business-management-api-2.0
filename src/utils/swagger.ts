import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const setupSwagger = (app: NestExpressApplication) => {
  const config = new DocumentBuilder()
    .setTitle('Business API')
    .setDescription('Business API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
        description: `Bearer Token`,
        name: 'Authorization',
        bearerFormat: 'Bearer',
        scheme: 'Bearer',
        type: 'http',
        in: 'Header',
      },
      'access-token',
    )
    .setExternalDoc('Postman Collection', '/json_doc')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('/', app, document, {
    swaggerOptions: {
      docExpansion: 'none',
      persistAuthorization: true,
    },
    customSiteTitle: 'Business API Docs',
  });

  app.use('/json_doc', (req, res) => {
    res.send(document);
  });
};
