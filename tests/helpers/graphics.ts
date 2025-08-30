import { addGraphic, transformGraphic } from '../../src/business/graphic';
import { writeHistory } from '../../src/business/history';
import { IGraphicDocument, IProductDocument } from '../../src/types/models';
import { GraphicModel } from '../../src/models/graphic';

type AddGraphicBody = API_TYPES.Routes['body']['graphics']['add'];
interface AddGraphicParams {
  userId: string;
  storeId: string;
  teamId: string;
  body: AddGraphicBody;
  product: IProductDocument;
}

export const injectGraphic = async (payload: AddGraphicParams): Promise<Partial<IGraphicDocument> | null> => {
  const { userId, storeId, teamId, body, product } = payload;
  const { data: history } = await writeHistory({ userId, storeId, teamId, product, quantity: 4 });
  if (history) {
    const { data } = await addGraphic({ userId, storeId, teamId, body });
    const graphicId = data?.graphicId;
    const _graphic = await GraphicModel.findById(graphicId).populate(['histories', 'storeId', 'generatedBy']).lean().exec();
    const graphic = transformGraphic({ graphic: _graphic as IGraphicDocument, excludedFields: ['__v'] });
    return graphic;
  }
  return null;
};
