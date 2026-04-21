import { ReactFlowProvider } from 'reactflow';
import CCSFlowView from './CCSFlowView';

interface Props {
  code: string;
  onCodeChange?: (code: string) => void;
}

export default function CCSFlowWrapper({ code, onCodeChange }: Props) {
  return (
    <ReactFlowProvider>
      <CCSFlowView code={code} onCodeChange={onCodeChange} />
    </ReactFlowProvider>
  );
}