import { CLIENT, ClientCompositeIdentifier } from "../client.composite-identifier";

interface AggregateCompositeIdentifier<TType extends string = string, UId=string>{
    type: TType;
    id: UId;
}

interface CqrsCommand{
    aggregateComposteIdentifier: AggregateCompositeIdentifier
}

export class CreateClient implements CqrsCommand{
    aggregateComposteIdentifier: ClientCompositeIdentifier;

    firstName: string;

    lastName: string;

    dateOfBirth: string; // parse to Date

    isIndigenous: 'Yes' | 'No' | 'Unknown';

    community?: string;
}