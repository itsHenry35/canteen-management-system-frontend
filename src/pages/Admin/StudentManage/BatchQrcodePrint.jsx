import React, { forwardRef } from 'react';
import { Typography, QRCode } from 'antd';
import './printStyles.css';

const { Text } = Typography;

const BatchQrcodePrint = forwardRef(({ qrcodeDataList }, ref) => {
  const chunk = (arr, size) => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size)
    );
  };

  const rows = chunk(qrcodeDataList, 2);

  return (
    <div className="print-container" ref={ref}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="qrcode-row">
          {row.map((student, colIndex) => (
            <div key={student.id} className="qrcode-item">
              <div className="qrcode-content">
                <div className="student-info">
                  <Text strong>{student.name}</Text>
                  <Text type="secondary">{student.class}</Text>
                </div>
                <div className="qrcode-wrapper">
                  <QRCode
                    value={student.qrData}
                    size={160}
                    errorLevel="H"
                  />
                </div>
              </div>
              {colIndex < row.length - 1 && (
                <div className="vertical-cut-line">
                  <div className="dashed-line"></div>
                  <div className="scissors">✂</div>
                </div>
              )}
            </div>
          ))}
          {rowIndex < rows.length - 1 && (
            <div className="horizontal-cut-line">
              <div className="dashed-line"></div>
              <div className="scissors">✂</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

export default BatchQrcodePrint;
