import QRCode from "qrcode";
import { JSX, useEffect, useRef } from "react";

export const QrCodeForLink = ({ link }: { link: string }): JSX.Element => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef?.current, link);
    }
  }, [canvasRef, link]);

  return <canvas ref={canvasRef} />;
};
