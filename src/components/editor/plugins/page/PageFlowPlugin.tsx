import { usePageFlow, type PageFlowSettings } from './usePageFlow';

export function PageFlowPlugin({
  pageHeightMm,
  marginTopMm,
  marginBottomMm
}: PageFlowSettings): null {
  usePageFlow({ pageHeightMm, marginTopMm, marginBottomMm });
  return null;
}
