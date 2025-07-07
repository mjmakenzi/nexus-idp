import { Test, TestingModule } from '@nestjs/testing';
import { RcaptchaService } from './rcaptcha.service';

describe('RcaptchaService', () => {
  let service: RcaptchaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RcaptchaService],
    }).compile();

    service = module.get<RcaptchaService>(RcaptchaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
