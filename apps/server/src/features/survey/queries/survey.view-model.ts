import { Survey } from '../survey.aggregate-root';

export class SurveyViewModel {
  id: string;

  name: string;

  size: number;

  constructor({ id, name, size }: { id: string; name: string; size: number }) {
    this.id = id;

    this.name = name;

    this.size = size;
  }

  // toClientDto

  /**
   * Currently, we project off the domain to build views. This is inefficient.
   * Eventually, we will want to build materialized views from an event history.
   */
  static fromDomainModel(domainModel: Survey) {
    return new SurveyViewModel({
      id: domainModel.getId(),
      name: domainModel.getName(),
      size: domainModel.size(),
    });
  }
}
