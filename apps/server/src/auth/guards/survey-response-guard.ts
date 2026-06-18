import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { isDeepStrictEqual } from 'util';
import { SURVEY_RESPONSE_AGGREGATE_TYPE } from '../../features/survey/constants';
import { SurveyResponseCompositeIdentifier } from '../../features/survey/survey-completion';

interface SurveyParticipantUser {
  type: 'SURVEY_PARTICIPANT';
  subject: SurveyResponseCompositeIdentifier;
}

interface AuthenticatedUser {
  type: 'AUTHENTICATED_USER';
  id: string;
  roles: string[];
  // name, etc.
}

type RequestUser = SurveyParticipantUser | AuthenticatedUser;

interface RequestBody {
  type?: string;
  payload?: {
    aggregateCompositeIdentifier: {
      type: string;
      id: string;
    };
  };
}

interface TiRequest {
  body: RequestBody;
  user?: RequestUser;
}

/**
 * TODO Let's consider using a separate controller for survey response commands.
 *
 * TODO Remove this?
 */
@Injectable()
export class SurveyResponseGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const { body, user } = context.switchToHttp().getRequest<TiRequest>();

    if (!body.payload) {
      return false;
    }

    if (!user) {
      return false;
    }

    if (user.type !== 'SURVEY_PARTICIPANT') {
      /**
       * TODO Support completing surveys as an authenticated (registered) system user, e.g., as an employee.
       */
      return false;
    }

    /**
     * Can't it be the controller's responsibility to validate the payload types?
     */
    if (
      body.payload.aggregateCompositeIdentifier.type !==
      SURVEY_RESPONSE_AGGREGATE_TYPE
    ) {
      return false;
    }

    if (
      typeof body.payload.aggregateCompositeIdentifier.id !== 'string' ||
      body.payload.aggregateCompositeIdentifier.id.length == 0
    ) {
      return false;
    }

    return isDeepStrictEqual(
      user.subject,
      body.payload.aggregateCompositeIdentifier,
    );
  }
}
