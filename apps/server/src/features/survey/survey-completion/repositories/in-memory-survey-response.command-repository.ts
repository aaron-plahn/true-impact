// TODO implement this using an `in-memory` event repository
// export class InMemorySurveyResponseCommandRepository implements ISurveyResponseCommandRepository {
//   private readonly base = new InMemoryCommandRepository(SurveyResponseRecord);

//   exists(id: string): Promise<boolean> {
//     return this.base.exists(id);
//   }

//   fetchById(id: string): Promise<SurveyResponseRecord | null> {
//     return this.base.fetchById(id);
//   }

//   fetchMany(): Promise<SurveyResponseRecord[]> {
//     return this.base.fetchMany();
//   }

//   create(
//     instance: SurveyResponseRecord,
//   ): Promise<PersistenceAcknowledgement | TrueImpactError> {
//     return this.base.create(instance);
//   }

//   createMany(instances: SurveyResponseRecord[]): Promise<void> {
//     return this.base.createMany(instances);
//   }

//   update(
//     instance: SurveyResponseRecord,
//   ): Promise<PersistenceAcknowledgement | TrueImpactError> {
//     return this.base.update(instance);
//   }

//   clear() {
//     return this.base.clear();
//   }
// }
