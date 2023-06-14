import { useEffect, useState } from "react";
import { ipcRenderer } from "electron";
import LoadingComp from "./LoadingComp";

const RtuTest = ({ show, setTestResults, currentStep, setCurrentStep }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([
    { id: 1, label: "RTU Network Test", result: null },
  ]);

  const onTestClick = async () => {
    try {
      setIsLoading(true);
      const response = await ipcRenderer.invoke("read-slave");
      console.log(response);
      if (response != null && response == 2) {
        setResults((prevStates) => [{ ...prevStates[0], result: true }]);
      } else {
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
    if (!results.some((r) => r.result == null) && currentStep == 4) {
      setTestResults((prevStates) => {
        let newStates = { ...prevStates };
        return { ...newStates, "rtu-test": [...results] };
      });
      setCurrentStep(5);
    }
  }, [results]);

  return (
    <>
      {show && (
        <div className="flex items-center space-x-10 relative w-full">
          {isLoading && <LoadingComp />}
          <div>
            <h3>&nbsp;</h3>
            <button className="btn normal-case" onClick={onTestClick}>
              Test RTU Network
            </button>
          </div>
          <div className="">
            <div className="flex items-center space-x-6">
              <span className="text-lg font-medium text-gray-600">Pass</span>
              <span className="text-lg font-medium text-gray-600">Fail</span>
            </div>
            <div className="flex space-x-8">
              <input
                type="checkbox"
                checked={results[0].result === null ? false : results[0].result}
                className="checkbox checkbox-success"
                onChange={() => {}}
              />
              <input
                type="checkbox"
                checked={
                  results[0].result === null ? false : !results[0].result
                }
                className="checkbox checkbox-error"
                onChange={() => {}}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default RtuTest;
