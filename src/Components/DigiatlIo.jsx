import { ipcRenderer } from "electron";
import { useCallback, useEffect, useState } from "react";

const DigiatlIo = ({ show, setTestResults, currentStep, setCurrentStep }) => {
  const [digIo, setDigIo] = useState([
    { id: 1, inputVal: "", outputVal: "" },
    { id: 2, inputVal: "", outputVal: "" },
    { id: 3, inputVal: "", outputVal: "" },
    { id: 4, inputVal: "", outputVal: "" },
    { id: 5, inputVal: "", outputVal: "" },
    { id: 6, inputVal: "", outputVal: "" },
    { id: 7, inputVal: "", outputVal: "" },
    { id: 8, inputVal: "", outputVal: "" },
  ]);

  const [results, setResults] = useState([
    { id: 1, result: null },
    { id: 2, result: null },
    { id: 3, result: null },
    { id: 4, result: null },
    { id: 5, result: null },
    { id: 6, result: null },
    { id: 7, result: null },
    { id: 8, result: null },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const readValues = useCallback(async () => {
    try {
      setIsLoading(true);
      const results = await ipcRenderer.invoke("read-dig-io");
      console.log(results);
      const newStates = [...digIo].map((statVal) => ({
        ...statVal,
        inputVal: results["inputs"][statVal.id - 1],
        outputVal: results["outputs"][statVal.id - 1],
      }));
      setDigIo(newStates);
      setIsLoading(false);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log("show", show);
    if (show) {
      readValues();
    }
  }, [readValues]);

  // for updating local results
  useEffect(() => {
    let newResults = [...results];
    digIo.forEach((stateVal) => {
      if (stateVal.inputVal == 1 && stateVal.outputVal == 1) {
        newResults[stateVal.id - 1]["result"] = true;
      } else if (stateVal.inputVal != stateVal.outputVal) {
        newResults[stateVal.id - 1]["result"] = false;
      }
    });
    setResults(newResults);
  }, [digIo]);

  useEffect(() => {
    console.log(results);
    console.log(results.some((r) => r.result === null));
    if (!results.some((r) => r.result == null) && currentStep == 2) {
      setTestResults((prevStates) => {
        let newStates = { ...prevStates };
        return { ...newStates, "dig-io": [...results] };
      });
      setCurrentStep(3);
    }
  }, [results]);

  const onOutputChange = async (outId, wrVal) => {
    console.log(outId, wrVal);
    await ipcRenderer.invoke("write-dig-out", outId, wrVal);
    await readValues();
  };

  return (
    <>
      {show && (
        <div className="w-full mt-4">
          {/* <HeaderComp title={"Digital I/O"} /> */}
          <div className="grid grid-cols-3 gap-x-2 relative">
            {isLoading && (
              <div className="absolute inset-0 bg-gray-400 opacity-40"></div>
            )}
            <div className="col-span-1">
              <h3 className="text-sm font-medium text-gray-600">
                Digital Output
              </h3>
              <div className="flex flex-col">
                {digIo
                  .map((v) => v.outputVal)
                  .map((v, idx) => (
                    <label
                      key={"dig-out-" + idx}
                      className="cursor-pointer inline-flex items-center space-x-4 mb-[6px] mt-2"
                    >
                      <span className="label-text text-sm">
                        {"Dig Output-" + (idx + 1)}
                      </span>
                      <input
                        type="checkbox"
                        className="toggle toggle-accent toggle-sm"
                        checked={v === "" ? false : v}
                        onChange={({ target: { checked } }) =>
                          onOutputChange(idx + 1, checked)
                        }
                      />
                    </label>
                  ))}
              </div>
            </div>
            <div className="col-span-1">
              <h3 className="text-sm font-medium text-gray-600">
                Digital Inputs
              </h3>
              {digIo
                .map((v) => v.inputVal)
                .map((v, idx) => (
                  <label
                    key={"dig-inp-" + idx}
                    className="cursor-pointer flex items-center space-x-4 mb-[14px] mt-2"
                  >
                    <span className="label-text text-sm">
                      {"Dig Input-" + (idx + 1)}
                    </span>
                    <div
                      className={`w-4 h-4 rounded-full ${
                        v == true ? "bg-green-600" : "bg-rose-500"
                      } `}
                    ></div>
                  </label>
                ))}
            </div>
            <div className="col-span-1">
              <h3 className="text-sm font-medium text-gray-600 flex items-center space-x-6">
                <span>Pass</span>
                <span>Fail</span>
              </h3>
              {results.map((v) => {
                return (
                  <div key={v.id} className="space-x-10 mt-2 mb-[8px]">
                    <input
                      type="checkbox"
                      checked={v.result === null ? false : v.result}
                      className="checkbox checkbox-sm checkbox-success"
                      onChange={() => updateResult("digIOR", v.id, true)}
                    />
                    <input
                      type="checkbox"
                      checked={v.result == null ? false : !v.result}
                      className="checkbox checkbox-sm checkbox-error"
                      onChange={() => updateResult("digIOR", v.id, false)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default DigiatlIo;
