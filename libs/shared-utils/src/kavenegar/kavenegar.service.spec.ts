import { Test, TestingModule } from '@nestjs/testing';
import { KavenegarService } from './kavenegar.service';

describe('KavenegarService', () => {
  let service: KavenegarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KavenegarService],
    }).compile();

    service = module.get<KavenegarService>(KavenegarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
