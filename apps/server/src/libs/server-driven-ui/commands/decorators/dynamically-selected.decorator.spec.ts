import {
  DynamicallySelected,
  getDynamicSelectionMetadata,
} from './dynamically-selected.decorator';

describe(`@DynamicallySelected`, () => {
  describe(`when some fields have been decorated`, () => {
    class WithMeta {
      @DynamicallySelected({
        path: 'widgets/select',
      })
      widgetId: string;
    }

    it(`should set the expected metadata`, () => {
      const result = getDynamicSelectionMetadata(WithMeta);

      expect(result).toEqual({
        widgetId: { path: 'widgets/select' },
      });
    });
  });

  describe(`when no fields have been decorated`, () => {
    class WithoutMeta {
      myField: number;
    }

    it(`should return empty metadata`, () => {
      const result = getDynamicSelectionMetadata(WithoutMeta);

      expect(result).toEqual({});
    });
  });
});
