import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  sanityCheck(): string {
    return "The True Impact server is live!"
  }
}
