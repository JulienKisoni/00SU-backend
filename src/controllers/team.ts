import { NextFunction, Response } from 'express';
import Joi, { type LanguageMessages } from 'joi';

import { ExtendedRequest, ITeamDocument, ParamsDictionary } from '../types/models';
import * as teamBusiness from '../business/team';
import { createError, handleError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';
import { regex } from '../helpers/constants';
interface AddTeamPayload {
  name: string;
  description?: string;
  owner?: string;
}

export const addTeamCtrl = async (req: ExtendedRequest<AddTeamPayload, ParamsDictionary>, res: Response, next: NextFunction) => {
  const { name, description, owner } = req.body || {};

  const nameMessages: LanguageMessages = {
    'any.required': 'The field name is required',
    'string.min': 'The field name must have 3 characters minimum',
    'string.max': 'The field name must have 100 characters maximum',
  };
  const descriptionMessages: LanguageMessages = {
    'string.min': 'The field description must have 6 characters minimum',
    'string.max': 'The field description must have 500 characters maximum',
  };
  const session = req.currentSession;

  const schema = Joi.object<AddTeamPayload>({
    name: Joi.string().min(3).max(100).required().messages(nameMessages),
    description: Joi.string().min(6).max(500).messages(descriptionMessages),
    owner: Joi.string().regex(regex.mongoId),
  });
  const { error, value } = schema.validate({ name, description, owner });
  if (error) {
    return handleError({ error, next, currentSession: session });
  } else if (value) {
    const { error, teamId } = await teamBusiness.addTeam(value);
    if (error && !teamId) {
      return handleError({ error, next, currentSession: session });
    }
    if (session) {
      await session.endSession();
    }
    res.status(HTTP_STATUS_CODES.CREATED).json({ teamId });
  }
};
export const getTeams = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
  const { user } = req;
  const session = req.currentSession;
  if (!user) {
    const err = createError({ statusCode: HTTP_STATUS_CODES.FORBIDDEN, message: 'No user associated with the request found' });
    return handleError({ error: err, next, currentSession: session });
  }
  const teams = await teamBusiness.getTeams();
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({ teams });
};

export const deleteTeam = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
  const messages: LanguageMessages = {
    'any.required': 'Please provide a team id',
    'string.pattern.base': 'Please provide a valid team id',
  };
  const schema = Joi.object<{ teamId: string }>({
    teamId: Joi.string().regex(regex.mongoId).required().messages(messages),
  });
  const session = req.currentSession;
  const { error, value } = schema.validate(req.params, { stripUnknown: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  await teamBusiness.deleteOne({ teamId: value.teamId });
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({});
};

type EditTeamPayload = Pick<ITeamDocument, 'name' | 'description'>;
interface JoiSchema {
  params: {
    teamId: string;
  };
  body: EditTeamPayload;
}
export const editTeam = async (req: ExtendedRequest<EditTeamPayload, ParamsDictionary>, res: Response, next: NextFunction) => {
  const body = req.body;
  const teamIdMessages: LanguageMessages = {
    'any.required': 'Please provide a team id',
    'string.pattern.base': 'Please provide a valid team id',
  };
  const nameMessages: LanguageMessages = {
    'string.min': 'The field name must have 3 characters minimum',
    'string.max': 'The field name must have 100 characters maximum',
  };
  const descriptionMessages: LanguageMessages = {
    'string.min': 'The field description must have 6 characters minimum',
    'string.max': 'The field description must have 500 characters maximum',
  };

  const params = req.params as { teamId: string };
  const session = req.currentSession;

  if (!body) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: 'No body',
      publicMessage: 'Please provide body with your request',
    });
    return handleError({ error, next, currentSession: session });
  }

  const payload: JoiSchema = {
    params,
    body,
  };
  const schema = Joi.object<JoiSchema>({
    params: {
      teamId: Joi.string().regex(regex.mongoId).required().messages(teamIdMessages),
    },
    body: {
      name: Joi.string().min(3).max(100).messages(nameMessages),
      description: Joi.string().min(6).max(500).messages(descriptionMessages),
    },
  });
  const { error, value } = schema.validate(payload, { stripUnknown: true, abortEarly: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  const { error: err } = await teamBusiness.updateOne({ payload: value.body, teamId: value.params.teamId });
  if (err) {
    return handleError({ error: err, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({});
};

type GetOneTeamPayload = API_TYPES.Routes['business']['teams']['getOne'];
export const getOneTeam = async (req: ExtendedRequest<undefined, ParamsDictionary>, res: Response, next: NextFunction) => {
  const params = req.params as unknown as GetOneTeamPayload;
  const teamIdMessages: LanguageMessages = {
    'any.required': 'Please provide a team id',
    'string.pattern.base': 'Please provide a valid team id',
  };
  const schema = Joi.object<GetOneTeamPayload>({
    teamId: Joi.string().regex(regex.mongoId).required().messages(teamIdMessages),
  });
  const session = req.currentSession;

  const { error, value } = schema.validate(params, { stripUnknown: true, abortEarly: true });
  if (error) {
    return handleError({ error, next, currentSession: session });
  }
  const { error: _error, team } = await teamBusiness.getOne({ teamId: value.teamId });
  if (_error) {
    return handleError({ error: _error, next, currentSession: session });
  }
  if (session) {
    await session.endSession();
  }
  res.status(HTTP_STATUS_CODES.OK).json({ team });
};
