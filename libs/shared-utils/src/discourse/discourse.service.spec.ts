import { Test, TestingModule } from '@nestjs/testing';
import { DiscourseService } from './discourse.service';

describe('DiscourseService', () => {
  let service: DiscourseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiscourseService],
    }).compile();

    service = module.get<DiscourseService>(DiscourseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
