import { Param } from './param.decorator';

export function IdParam(): ParameterDecorator {
  return Param('id');
}
