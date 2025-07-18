import { TeamModel } from '../../src/models/team';
import { UserModel } from '../../src/models/user';
import { ITeamDocument } from '../../src/types/models';

interface AddTeamPayload {
  name: string;
  description?: string;
  userId: string;
}
export const createTeam = async ({ name, description, userId }: AddTeamPayload): Promise<ITeamDocument> => {
  const payload = {
    name,
    description,
    owner: userId,
  };
  const team = await TeamModel.create(payload);
  const teamId = team._id;
  await UserModel.findByIdAndUpdate(userId, { teamId }).exec();
  return team;
};
