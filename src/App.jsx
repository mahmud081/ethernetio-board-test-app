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
import AlertComp from "./Components/AlertComp";
import LoadingComp from "./Components/LoadingComp";

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPort, setSelectedPort] = useState("");
  const [boardUid, setBoardUid] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [testResults, setTestResults] = useState({});
  const [configs, setConfigs] = useState({});
  const [globLoading, setGlobLoading] = useState(false);
  const [isShowModal, setIsShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

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

  useEffect(() => {
    let messageEventHandler = async (event, args) => {
      console.log("message", args);
      if (args == "Timed out") {
        setGlobLoading(true);

        await ipcRenderer.invoke("reset-client");
        console.log("client reset done");
        setGlobLoading(false);
      }
      setShowAlert(true);
      setMessage(args);
    };
    ipcRenderer.on("message-from-main", messageEventHandler);
    return () => {
      ipcRenderer.removeListener("message-from-main", messageEventHandler);
    };
  }, []);

  return (
    <div className="px-4 relative">
      {showAlert && (
        <AlertComp
          msg={message}
          setMessage={setMessage}
          setShowAlert={setShowAlert}
        />
      )}
      {isShowModal && (
        <Modal show={isShowModal} setIsShowModal={setIsShowModal} />
      )}
      {globLoading && <LoadingComp />}
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
        isConnected={isConnected}
        setIsConnected={setIsConnected}
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
            {currentStep >= 3 && (
              <MemoryTest
                currentStep={currentStep}
                show={currentStep >= 3}
                setTestResults={setTestResults}
                setCurrentStep={setCurrentStep}
              />
            )}
            {currentStep >= 4 && (
              <RtuTest
                currentStep={currentStep}
                show={currentStep >= 4}
                setTestResults={setTestResults}
                setCurrentStep={setCurrentStep}
              />
            )}
          </div>
          {currentStep >= 5 && (
            <EthernetPortTest
              currentStep={currentStep}
              show={currentStep >= 5}
              setTestResults={setTestResults}
              setCurrentStep={setCurrentStep}
            />
          )}
        </div>
      </div>
      {currentStep >= 6 && Object.keys(configs).length && (
        <AnalogIo
          configs={configs}
          currentStep={currentStep}
          show={currentStep >= 6}
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
          isConnected={isConnected}
          setIsConnected={setIsConnected}
          setBoardUid={setBoardUid}
          setSerialNo={setSerialNo}
        />
      )}
    </div>
  );
}

export default App;
