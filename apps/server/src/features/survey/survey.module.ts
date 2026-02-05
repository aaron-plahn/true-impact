import { Module } from '../../libs';
import { Survey } from './survey.aggregate-root';

const dataClasses = [Survey];

@Module({
  providers: [
    /**
     * Exporting
     */
    ...dataClasses.map((Ctor) => ({
      provide: Ctor,
      useValue: Ctor,
    })),
  ],
  // Exposing data classes allows us to drive them via repl
  exports: [...dataClasses],
})
export class SurveyModule {}
