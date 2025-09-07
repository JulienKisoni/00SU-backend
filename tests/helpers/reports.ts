import { addReport, transformReport } from '../../src/business/reports';
import { IReportDocument } from '../../src/types/models';
import { ReportModel } from '../../src/models/report';

type AddReportBody = API_TYPES.Routes['body']['reports']['add'];
interface AddReportParams {
  userId: string;
  teamId: string;
  body: AddReportBody;
}
export const injectReport = async (payload: AddReportParams): Promise<Partial<IReportDocument> | null> => {
  const { data } = await addReport(payload);
  const reportId = data?.reportId?.toString() || '';
  const _report = await ReportModel.findById(reportId).populate(['orders', 'storeId', 'generatedBy']).lean().exec();
  const report = transformReport({ report: _report as IReportDocument, excludedFields: ['__v'] });
  return report;
};
