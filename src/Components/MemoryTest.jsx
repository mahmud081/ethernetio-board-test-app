import { useEffect, useState } from "react";
import { ipcRenderer } from "electron";

function MemoryTest({ show, setTestResults, currentStep, setCurrentStep }) {
  const [enableTest, setEnableTest] = useState(false);
  const [memSatus, setMemStatus] = useState(null);

  const [results, setResults] = useState([
    { id: 1, label: "Memory Test", result: null },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const onTestStart = async () => {
    setIsLoading(true);
    const response = await ipcRenderer.invoke("start-mem-test");
    console.log(response);
    if (!response.success) {
      console.error("failed to start test");
      setResults((prevStates) => [{ ...prevStates[0], result: false }]);
      return;
    }
    setIsLoading(false);
    setTimeout(() => enableTheTest(), 2000);
  };
  const enableTheTest = () => {
    console.log("enable test runs");
    setEnableTest(true);
  };

  const onReadStatus = async () => {
    setIsLoading(true);
    try {
      const response = await ipcRenderer.invoke("read-mem-status");

      setMemStatus(response);

      if (response === 1) {
        setResults((prevStates) => [{ ...prevStates[0], result: true }]);
      } else if (response === 2) {
        setResults((prevStates) => [{ ...prevStates[0], result: false }]);
      }
    } catch (error) {
      setResults((prevStates) => [{ ...prevStates[0], result: false }]);
    } finally {
      setIsLoading(false);
    }
  };

  // enable next stage
  useEffect(() => {
    console.log(results.some((r) => r.result === null));
    if (!results.some((r) => r.result === null) && currentStep == 3) {
      console.log("enabling next step");
      setTestResults((prevStates) => {
        let newStates = { ...prevStates };
        return { ...newStates, "memory-test": [...results] };
      });
      setCurrentStep(4);
    }
  }, [results]);

  return (
    <>
      {show && (
        <div className="mt-4 relative w-full">
          {isLoading && (
            <div className="absolute inset-0 bg-gray-300 opacity-40"></div>
          )}
          <h1 className=" text-sm font-semibold text-gray-800 mb-2">
            Memory Test
          </h1>

          <button className="btn normal-case btn-sm" onClick={onTestStart}>
            Memory Test start
          </button>
          <div className="flex items-center space-x-5 mt-4">
            <button
              disabled={!enableTest}
              className="btn normal-case btn-sm"
              onClick={onReadStatus}
            >
              Read status
            </button>
            <input
              className="border border-gray-300 rounded-md px-4 py-1"
              type="text"
              readOnly
              value={memSatus}
            />
          </div>
          <div className=" flex items-center space-x-5 mt-2">
            <div className="flex items-center space-x-6">
              <span className=" label-text">Pass</span>
              <span className=" label-text">Fail</span>
            </div>
            <div className="flex space-x-8">
              <input
                type="checkbox"
                checked={results[0].result === null ? false : results[0].result}
                className="checkbox checkbox-success checkbox-sm"
                onChange={() => {}}
              />
              <input
                type="checkbox"
                checked={
                  results[0].result === null ? false : !results[0].result
                }
                className="checkbox checkbox-error checkbox-sm"
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default MemoryTest;
