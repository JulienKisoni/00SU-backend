import omit from 'lodash.omit';
import isEmpty from 'lodash.isempty';
import { UpdateQuery } from 'mongoose';

import { ITeamDocument, IUserDocument, RetrieveOneFilters } from '../types/models';
import { ITeamMethods, TeamModel } from 'src/models/team';
import { createError, GenericError } from '../middlewares/errors';
import { HTTP_STATUS_CODES } from '../types/enums';

const retrieveTeam = async (filters: RetrieveOneFilters<ITeamDocument>): Promise<ITeamDocument | null> => {
  const team = (await TeamModel.findOne(filters).populate({ path: 'owner' }).lean().exec()) as ITeamDocument;
  if (!team || team === null) {
    return null;
  }
  const userDetails = team.owner as unknown as IUserDocument;
  team.userDetails = userDetails;

  return team;
};

type TransformKeys = keyof ITeamDocument;
interface ITransformTeam {
  excludedFields: TransformKeys[];
  team: ITeamDocument;
}
export const transformTeam = ({ team, excludedFields }: ITransformTeam): Partial<ITeamDocument> => {
  return omit(team, excludedFields);
};

interface AddTeamPayload {
  name: string;
  description: string;
  owner?: string;
}
type AddTeamReturn = {
  error?: GenericError;
  teamId?: string;
};

export const addTeam = async ({ name, description, owner }: AddTeamPayload): Promise<AddTeamReturn> => {
  let team: ITeamDocument | null = null;
  if (owner) {
    team = await TeamModel.findOne({ owner }).exec();
  }
  if (team && team._id) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.DUPLICATED_RESOURCE,
      publicMessage: 'Team with this owner already exist',
      message: 'Cannot create team with existing team owner ',
    });
    return { error };
  }
  const payload = {
    name,
    description,
    owner,
  };
  const result = await TeamModel.create(payload);
  const teamId = result._id;
  return { teamId: teamId.toString() };
};

export const getTeams = async (): Promise<Partial<ITeamMethods>[]> => {
  const teams = await TeamModel.find<ITeamMethods>({}).lean().exec();
  return (
    teams.map((team) => {
      const transformed = transformTeam({ team, excludedFields: ['__v'] });
      return transformed;
    }) || []
  );
};

export const deleteOne = async ({ teamId }: { teamId: string }) => {
  return TeamModel.deleteOne({ _id: teamId }).exec();
};

type EditTeamPayload = Pick<ITeamDocument, 'name' | 'description'>;
interface EditTeamParams {
  payload: Partial<EditTeamPayload>;
  teamId: string;
}
export const updateOne = async ({ payload, teamId }: EditTeamParams): Promise<{ error?: GenericError }> => {
  const update: UpdateQuery<EditTeamPayload> = {};
  const { name, description } = payload;
  if (!payload || isEmpty(payload)) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
      message: `No body associated with the request`,
      publicMessage: 'Please provide valid fields to update',
    });
    return { error };
  }
  if (name) {
    update['name'] = name;
  }
  if (description) {
    update['description'] = description;
  }
  if (update && !isEmpty(update)) {
    const team = await TeamModel.findById<ITeamMethods>(teamId).exec();
    if (team && team.updateSelf) {
      await team?.updateSelf(update);
    }
  }
  return { error: undefined };
};

type GetOneTeamPayload = API_TYPES.Routes['business']['teams']['getOne'];
interface GetOneTeamResponse {
  error?: GenericError;
  team?: Partial<ITeamDocument>;
}
export const getOne = async ({ teamId }: GetOneTeamPayload): Promise<GetOneTeamResponse> => {
  const team = await retrieveTeam({ _id: teamId });
  if (!team?._id) {
    const error = createError({
      statusCode: HTTP_STATUS_CODES.NOT_FOUND,
      message: `Team with id ${teamId} does not exist `,
      publicMessage: 'No user found',
    });
    return { error };
  }
  const transformed = transformTeam({ team, excludedFields: ['__v'] });
  return { team: transformed };
};
