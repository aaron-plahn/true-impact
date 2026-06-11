import { Controller, Get } from './libs/framework';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  sanityCheck(): string {
    return 'The True Impact server is live!';
  }
}
