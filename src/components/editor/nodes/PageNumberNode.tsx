import * as React from 'react';

export interface PageNumberNodeProps {
  pageNumber: number;
}

export const PAGE_NUMBER_NODE_TYPE = 'page-number';

const PageNumberNode: React.FC<PageNumberNodeProps> = ({ pageNumber }: PageNumberNodeProps) => {
  return (
    <div className='page-number-node' style={{ textAlign: 'center', color: '#888', fontSize: 12, margin: '8px 0' }}>
      {pageNumber}
    </div>
  );
};

export default PageNumberNode;
