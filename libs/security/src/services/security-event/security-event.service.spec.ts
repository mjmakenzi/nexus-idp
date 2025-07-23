import { Test, TestingModule } from '@nestjs/testing';
import { SecurityEventService } from './security-event.service';

describe('SecurityEventService', () => {
  let service: SecurityEventService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SecurityEventService],
    }).compile();

    service = module.get<SecurityEventService>(SecurityEventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
