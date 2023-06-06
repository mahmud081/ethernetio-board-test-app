import { useEffect, useState } from "react";
import SelectPortConnect from "./Components/SelectPortConnect";
import DigiatlIo from "./Components/DigiatlIo";
import AnalogIo from "./Components/AnalogIo";
import MemoryTest from "./Components/MemoryTest";
import RtuTest from "./Components/RtuTest";
import EthernetPortTest from "./Components/EthernetPortTest";
import { ipcRenderer } from "electron";
import ResultsPage from "./Components/ResultsPage";
import Modal from "./Components/Modal";

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPort, setSelectedPort] = useState("");
  const [boardUid, setBoardUid] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [testResults, setTestResults] = useState({});
  const [configs, setConfigs] = useState({});
  const [globLoading, setGlobLoading] = useState(false);
  const [isShowModal, setIsShowModal] = useState(false);

  const onPortSelect = (path) => {
    setSelectedPort(path);
  };

  useEffect(() => {
    async function getConfigs() {
      setGlobLoading(true);
      const res = await ipcRenderer.invoke("get-config");
      setConfigs(res);
      setGlobLoading(false);
    }
    getConfigs();
  }, []);

  return (
    <div className="px-4 relative">
      {isShowModal && (
        <Modal show={isShowModal} setIsShowModal={setIsShowModal} />
      )}
      {globLoading && (
        <div className="absolute inset-0 bg-gray-300 opacity-40 z-50"></div>
      )}
      {/* {JSON.stringify(currentStep)} */}
      <SelectPortConnect
        selectedPort={selectedPort}
        onSelect={onPortSelect}
        boardUid={boardUid}
        onSetUid={setBoardUid}
        serialNo={serialNo}
        onSetSerial={(val) => setSerialNo(val)}
        nextStep={setCurrentStep}
        setIsShowModal={setIsShowModal}
      />
      <div className=" flex items-start space-x-6 w-full">
        {currentStep >= 2 && (
          <DigiatlIo
            currentStep={currentStep}
            show={currentStep >= 2}
            testResults={testResults}
            setTestResults={setTestResults}
            setCurrentStep={setCurrentStep}
          />
        )}
        <div className="w-full">
          <div className=" flex items-start space-x-2">
            {currentStep >= 2 && (
              <MemoryTest
                currentStep={currentStep}
                show={currentStep >= 2}
                setTestResults={setTestResults}
                setCurrentStep={setCurrentStep}
              />
            )}
            {currentStep >= 2 && (
              <RtuTest
                currentStep={currentStep}
                show={currentStep >= 2}
                setTestResults={setTestResults}
                setCurrentStep={setCurrentStep}
              />
            )}
          </div>
          {currentStep >= 2 && (
            <EthernetPortTest
              currentStep={currentStep}
              show={currentStep >= 2}
              setTestResults={setTestResults}
              setCurrentStep={setCurrentStep}
            />
          )}
        </div>
      </div>
      {currentStep >= 2 && (
        <AnalogIo
          configs={configs}
          currentStep={currentStep}
          show={currentStep >= 2}
          setTestResults={setTestResults}
          setCurrentStep={setCurrentStep}
        />
      )}
      {currentStep >= 7 && (
        <ResultsPage
          show={currentStep >= 7}
          testResults={testResults}
          boardUid={boardUid}
          serialNo={serialNo}
          setTestResults={setTestResults}
          setCurrentStep={setCurrentStep}
        />
      )}
    </div>
  );
}

export default App;
