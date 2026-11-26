import { DeepPartial } from '@nestjs/swagger';
import { TISduiFormField } from '../forms';

export interface TISduiCommand<T = unknown> {
  type: 'COMMAND';
  commandType: string;
  label: string;
  tooltip: string;
  context: DeepPartial<T>;
  fields: TISduiFormField[];
  method: 'POST';
  /**
   * Note that we aren't currently using this in the client. That's because
   * we need to execute the command using a RTK mutation in order to invalidate
   * the Redux cache. What we really need is some way to align the request with the
   * corresponding cache entry. For now, we treat this as out-of-band knowledge. It stays
   * fairly isolated in the client codebase. In the long run, we will stream deltas in a
   * write hook on the query DB anyway.
   */
  path: string; // relative to base
}
