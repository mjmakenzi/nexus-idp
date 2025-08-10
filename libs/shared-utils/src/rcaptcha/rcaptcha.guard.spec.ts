import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { RcaptchaGuard } from './rcaptcha.guard';

describe('RcaptchaGuard', () => {
  let guard: RcaptchaGuard;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RcaptchaGuard,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('mock-value'),
          },
        },
      ],
    }).compile();

    guard = module.get<RcaptchaGuard>(RcaptchaGuard);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
});
