import { GroupProgramObservation } from './group-program-observation.entity';

export class GroupProgramObservationViewModel {
  interactionType?: string;

  // TODO make this a MultilingualTextViewModel
  note?: string;

  constructor({
    interactionType,
    note,
  }: {
    interactionType?: string;
    note?: string;
  }) {
    this.interactionType = interactionType;

    this.note = note;
  }

  static fromDomainModel(
    domainModel: GroupProgramObservation,
  ): GroupProgramObservationViewModel {
    const { interactionType, note } = domainModel;

    return new GroupProgramObservationViewModel({
      interactionType,
      note: note?.getOriginalTextItem()?.text,
    });
  }
}
