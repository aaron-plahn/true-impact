import { CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { RbacAuthGuard } from '../../../../auth/guards';
import { SURVEY_RESPONSE_AGGREGATE_TYPE } from '../../../../features/survey/constants';
import { BeginSurvey } from '../../../../features/survey/survey-completion';
import { USER_COMMAND_REPOSITORY_INJECTION_TOKEN } from '../../../../features/users/constants';
import type { IUserCommandRepository } from '../../../../features/users/repositories';
import { User } from '../../../../features/users/user.aggregate-root';
import { ICommandFsa } from '../../../../libs/cqrs-es';

/**
 * TODO We should have a separate endpoint for survey completion.
 * This would make the following logic much simpler.
 */
export class SurveyCommandAuthGuard implements CanActivate {
  constructor(
    @Inject(USER_COMMAND_REPOSITORY_INJECTION_TOKEN)
    private readonly userCommandRepository: IUserCommandRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      session?: { userId: string };
      user?: User;
      subject?: { id: string };
      body?: unknown;
    }>();

    // Any survey command must have a survey command FSA as the body
    if (!req.body) {
      return false;
    }

    /**
     * An `accessCode` is required to execute BEGIN_SURVEY.
     * This code is validated when executing the command.
     */
    const test = req.body as ICommandFsa;

    if (!test.payload) {
      // every command FSA must have a payload
      return false;
    }

    if (test.type === 'BEGIN_PUBLIC_SURVEY') {
      /**
       * It's the handler's responsibility to return not found
       * or unauthorized if the survey is not available for public completion.
       */
      return true;
    }

    if (test.type === 'BEGIN_SURVEY') {
      const payload = test.payload as BeginSurvey;

      if (!payload.accessCode) {
        // It's impossible for this command to succeed without
        return false;
      }

      // defer permission to the command handler
      return true;
    }

    // we know that this is not a begin survey command
    const testSurveyResponseCommand = test.payload as {
      aggregateCompositeIdentifier?: { type: string };
    };

    if (
      testSurveyResponseCommand?.aggregateCompositeIdentifier?.type ===
      SURVEY_RESPONSE_AGGREGATE_TYPE
    ) {
      /**
       * Currently, SurveyController.executeCommand validates survey response scoped sessions directly.
       */
      return true;
    }

    if (!req.session?.userId) {
      return false;
    }

    const searchResult = await this.userCommandRepository.fetchById(
      req.session.userId,
    );

    if (!searchResult) {
      return false;
    }

    req.user = searchResult;

    /**
     * Nest's abstraction makes composability tough. Note that our use case is
     * highly unique here.
     */
    return new RbacAuthGuard().canActivate(context);
  }
}
