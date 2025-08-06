import { Controller } from '@nestjs/common';

const PATH = 'accounts';

@Controller({ path: PATH })
export class ApiController {
  constructor() {}
}
