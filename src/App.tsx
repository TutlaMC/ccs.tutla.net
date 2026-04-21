import { useState } from 'react'
import './App.css'
import CCSFlowWrapper from './components/Sections/editor/flow/CCSFlowWrapper'

function App() {
  const [code, setCode] = useState("");

  return (
    <div className="h-screen overflow-hidden">
      <CCSFlowWrapper code={code} onCodeChange={setCode} />
    </div>
  );
}

export default App
