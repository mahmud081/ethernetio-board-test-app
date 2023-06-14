import { ipcRenderer } from "electron";
import { useEffect, useState } from "react";
import LoadingComp from "./LoadingComp";

const AnalogIo = ({
  configs,
  show,
  setTestResults,
  setCurrentStep,
  currentStep,
}) => {
  const [analogIo, setAnalogIo] = useState([
    {
      id: 1,
      inputValue: 0,
      labels: [4, 10, 15, 20],
      voltageLabels: [0, 3, 7, 10],
      referenceCurr: configs["analog_input"][1]["ref_currents"] || [
        400, 1000, 1500, 2000,
      ],
      referenceVolt: configs["analog_input"][1]["ref_voltages"] || [
        0, 3751, 6877, 10000,
      ],
      outputValues: configs["analog_input"][1]["outputValues"] || [
        0, 1536, 2816, 4095,
      ],
      outputValuesVolt: configs["analog_input"][1]["outputValuesVoltage"] || [
        0, 1250, 2816, 4095,
      ],
      tolerance: configs["analog_input"][1]["tolerance_current"] || [
        50, 50, 50, 50,
      ],
      tolerance_voltage: configs["analog_input"][1]["tolerance_voltage"] || [
        50, 50, 50, 50,
      ],
      pressed: [false, false, false, false],
      mode: "current",
      enableVoltage: false,
      showText: true,
    },
    {
      id: 2,
      inputValue: 0,
      labels: [4, 10, 15, 20],
      voltageLabels: [0, 3, 7, 10],
      referenceCurr: configs["analog_input"][2]["ref_currents"] || [
        400, 1000, 1500, 2000,
      ],
      referenceVolt: configs["analog_input"][2]["ref_voltages"] || [
        0, 3751, 6877, 10000,
      ],
      outputValues: configs["analog_input"][2]["outputValues"] || [
        0, 1536, 2816, 4095,
      ],
      outputValuesVolt: configs["analog_input"][2]["outputValuesVoltage"],
      tolerance: configs["analog_input"][2]["tolerance_current"] || [
        50, 50, 50, 50,
      ],
      tolerance_voltage: configs["analog_input"][2]["tolerance_voltage"] || [
        50, 50, 50, 50,
      ],
      pressed: [false, false, false, false],
      mode: "current",
      enableVoltage: false,
      showText: true,
    },
    {
      id: 3,
      inputValue: 0,
      labels: [4, 10, 15, 20],
      voltageLabels: [0, 3, 7, 10],
      referenceCurr: configs["analog_input"][3]["ref_currents"] || [
        400, 1000, 1500, 2000,
      ],
      referenceVolt: configs["analog_input"][3]["ref_voltages"] || [
        0, 3751, 6877, 10000,
      ],
      outputValues: configs["analog_input"][3]["outputValues"] || [
        0, 1536, 2816, 4095,
      ],
      outputValuesVolt: configs["analog_input"][3]["outputValuesVoltage"] || [
        0, 1536, 2816, 4095,
      ],
      tolerance: configs["analog_input"][3]["tolerance_current"] || [
        50, 50, 50, 50,
      ],
      tolerance_voltage: configs["analog_input"][3]["tolerance_voltage"] || [
        50, 50, 50, 50,
      ],
      pressed: [false, false, false, false],
      mode: "current",
      enableVoltage: false,
      showText: true,
    },
    {
      id: 4,
      inputValue: 0,
      labels: [4, 10, 15, 20],
      voltageLabels: [0, 3, 7, 10],
      referenceCurr: configs["analog_input"][4]["ref_currents"] || [
        400, 1000, 1500, 2000,
      ],
      referenceVolt: configs["analog_input"][4]["ref_voltages"] || [
        0, 3751, 6877, 10000,
      ],
      outputValues: configs["analog_input"][4]["outputValues"] || [
        0, 1536, 2816, 4095,
      ],
      outputValuesVolt: configs["analog_input"][4]["outputValuesVoltage"] || [
        0, 1536, 2816, 4095,
      ],
      tolerance: configs["analog_input"][4]["tolerance_current"] || [
        50, 50, 50, 50,
      ],
      tolerance_voltage: configs["analog_input"][4]["tolerance_voltage"] || [
        50, 50, 50, 50,
      ],
      pressed: [false, false, false, false],
      mode: "current",
      enableVoltage: false,
      showText: true,
    },
  ]);

  const [results, setResults] = useState([
    {
      id: 1,
      currentResults: [null, null, null, null],
      voltageResults: [null, null, null, null],
      failedReasonCurr: [],
      failedReasonVolt: [],
    },
    {
      id: 2,
      currentResults: [null, null, null, null],
      voltageResults: [null, null, null, null],
      failedReasonCurr: [],
      failedReasonVolt: [],
    },
    {
      id: 3,
      currentResults: [null, null, null, null],
      voltageResults: [null, null, null, null],
      failedReasonCurr: [],
      failedReasonVolt: [],
    },
    {
      id: 4,
      currentResults: [null, null, null, null],
      voltageResults: [null, null, null, null],
      failedReasonCurr: [],
      failedReasonVolt: [],
    },
  ]);

  const [enabled, setEnabled] = useState([false, false, false, false]);
  const [isLoading, setIsLoading] = useState(false);
  // enable volt or current mode
  const onEnableCurrent = async (rowId) => {
    try {
      setIsLoading(true);
      await ipcRenderer.invoke("enable-current", rowId);
      setEnabled((prevStates) => {
        let newStates = [...prevStates];
        newStates[rowId - 1] = true;
        return newStates;
      });
    } catch (error) {
      setIsLoading(false);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  const onEnableVoltage = async (rowId) => {
    try {
      setIsLoading(true);
      await ipcRenderer.invoke("enable-voltage", rowId);
      setEnabled((prevStates) => {
        let newStates = [...prevStates];
        newStates[rowId - 1] = true;
        return newStates;
      });
      let newAnalogIoStates = [...analogIo];
      let found = newAnalogIoStates.find((f) => f.id == rowId);
      found.mode = "voltage";
      found.inputValue = 0;
      found.showText = false;
      setAnalogIo(newAnalogIoStates);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  // onoutput change
  //v.id, outVal, idx, v.mode
  const onOutputChange = async (outputId, outValue, outputIdx, ioMode) => {
    console.log("value to out", outValue);
    try {
      setIsLoading(true);
      await ipcRenderer.invoke("write-analog-output", outputId, outValue);
      await new Promise((res) => setTimeout(() => res(), 450));
      const response = await ipcRenderer.invoke("read-analog-input", ioMode);
      const changedInput = response[outputId - 1];
      const refOutput = analogIo.find((f) => f.id === outputId);
      // console.log("changed", changedInput);
      // console.log("ref", refOutput);
      let newAnalogIoStates = [...analogIo];
      let found = newAnalogIoStates.find((f) => f.id == outputId);
      found.inputValue = changedInput;
      setAnalogIo(newAnalogIoStates);

      let newResults = [...results];
      let pasFail = null;
      if (refOutput.mode == "current") {
        // console.log("input ", changedInput);
        // console.log("ref ", refOutput.referenceCurr[outputIdx]);
        // console.log("tol ", refOutput.tolerance[outputIdx]);
        if (
          changedInput >=
            refOutput.referenceCurr[outputIdx] -
              refOutput.tolerance[outputIdx] &&
          changedInput <=
            refOutput.referenceCurr[outputIdx] + refOutput.tolerance[outputIdx]
        ) {
          pasFail = true;
        } else {
          pasFail = false;
        }

        let rFound = newResults.find((f) => f.id === outputId);
        rFound.currentResults[outputIdx] = pasFail;
        if (!pasFail) {
          if (
            rFound.failedReasonCurr.findIndex(
              (f) => f.label == refOutput.labels[outputIdx] + " mA"
            ) === -1
          ) {
            rFound.failedReasonCurr.push({
              label: refOutput.labels[outputIdx] + " mA",
              value: (changedInput / 100).toFixed(1),
            });
          }
        }
        setResults(newResults);
      } else {
        console.log("input ", changedInput);
        console.log("ref ", refOutput.referenceVolt[outputIdx]);
        console.log("tol ", refOutput.tolerance[outputIdx]);
        if (
          changedInput >=
            refOutput.referenceVolt[outputIdx] -
              refOutput.tolerance_voltage[outputIdx] &&
          changedInput <=
            refOutput.referenceVolt[outputIdx] +
              refOutput.tolerance_voltage[outputIdx]
        ) {
          pasFail = true;
        } else {
          pasFail = false;
        }
        // console.log(pasFail);
        let rFound = newResults.find((f) => f.id === outputId);
        rFound.voltageResults[outputIdx] = pasFail;
        if (!pasFail) {
          if (
            rFound.failedReasonVolt.findIndex(
              (f) => f.label == refOutput.voltageLabels[outputIdx] + "V"
            ) === -1
          ) {
            rFound.failedReasonVolt.push({
              label: refOutput.voltageLabels[outputIdx] + "V",
              value: (changedInput / 1000).toFixed(1),
            });
          }
        }
        console.log(newResults);
        setResults(newResults);
      }

      if (refOutput.mode === "current") {
        if (
          !newResults
            .find((f) => f.id == outputId)
            .currentResults.some((v) => v == null)
        ) {
          // found.mode = "voltage";
          // setAnalogIo(newAnalogIoStates);
          setTimeout(() => {
            enableVoltage(outputId);
          }, 1000);
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  function enableVoltage(outputId) {
    let newAnalogIoStates = [...analogIo];
    let found = newAnalogIoStates.find((f) => f.id == outputId);
    found.enableVoltage = true;
    found.showText = true;
    setAnalogIo(newAnalogIoStates);
    setEnabled((prevStates) => {
      let newStates = [...prevStates];
      newStates[outputId - 1] = false;
      return newStates;
    });
  }

  useEffect(() => {
    console.log(
      results
        .map((r) => ({ curr: r.currentResults, volt: r.voltageResults }))
        .map((r) => [...r.curr, ...r.volt])
        .flat(1)
    );
    if (
      !results
        .map((r) => ({ curr: r.currentResults, volt: r.voltageResults }))
        .map((r) => [...r.curr, ...r.volt])
        .flat(1)
        .some((r) => r == null)
    ) {
      console.log("a", results);
      setTestResults((prevStates) => {
        let newStates = { ...prevStates };
        return { ...newStates, "analog-io": [...results] };
      });
      setCurrentStep(7);
    }
  }, [results]);
  return (
    <>
      {/* {JSON.stringify(results)} */}
      {show && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-4 gap-y-6 relative">
          {isLoading && <LoadingComp />}

          {analogIo.map((v) => (
            <div
              className="col-span-1 border border-gray-100 rounded-md p-2 relative"
              key={v.id}
            >
              {/** notification for switching mode v.showText */}
              {v.showText && (
                <div className="absolute inset-0 bg-gray-100 bg-opacity-80 flex flex-col items-center justify-center space-x-3 z-30 text-xs text-gray-700 space-y-6">
                  {v.mode == "current" && !v.enableVoltage && (
                    <div>
                      Switch to current mode in the board for both Analog input
                      and output
                    </div>
                  )}
                  {v.enableVoltage && (
                    <div>
                      Switch to voltage mode in the board for both Analog input
                      and output
                    </div>
                  )}
                  <button
                    className="btn btn-xs btn-outline"
                    onClick={() =>
                      setAnalogIo((prevStates) => {
                        let newStates = [...prevStates];
                        let found = newStates.find((f) => f.id === v.id);
                        found.showText = false;
                        return newStates;
                      })
                    }
                  >
                    Ok
                  </button>
                </div>
              )}
              {/** end notification for switching mode */}
              {/** top row */}
              <div className="flex items-center space-x-6">
                <button
                  disabled={!(v.mode == "current")}
                  onClick={() => onEnableCurrent(v.id)}
                  className="btn btn-xs inline-block"
                >
                  Enable Current Mode
                </button>
                <div className="flex items-center space-x-4">
                  <label className="label-text text-xs font-semibold">
                    {"Analog Input-" + v.id}
                  </label>
                  <input
                    className="border border-gray-300 rounded-md px-4 py-1"
                    type="text"
                    readOnly
                    value={
                      v.mode == "current"
                        ? (v.inputValue / 100).toFixed(2)
                        : (v.inputValue / 1000).toFixed(2)
                    }
                  />
                  <span className="label-text">
                    {v.mode == "current" ? "mA" : "V"}
                  </span>
                </div>
                <button
                  disabled={!v.enableVoltage}
                  onClick={() => onEnableVoltage(v.id)}
                  className="btn btn-xs inline-block"
                >
                  Enable Voltage Mode
                </button>
              </div>
              {/** end top row */}

              {/** out[ut button] */}
              <div className=" relative flex items-center justify-between mt-2 ml-36">
                {!enabled[v.id - 1] && (
                  <div className=" absolute inset-0 bg-gray-100 opacity-40 z-20"></div>
                )}

                {v.outputValues.map((outVal, idx) => (
                  <button
                    key={idx}
                    className={`btn btn-xs normal-case ${
                      v.pressed[idx] ? "btn-neutral" : "btn-outline"
                    }`}
                    onClick={() =>
                      onOutputChange(
                        v.id,
                        v.mode == "current" ? outVal : v.outputValuesVolt[idx],
                        idx,
                        v.mode
                      )
                    }
                  >
                    {v.mode == "current"
                      ? v.labels[idx] + " mA"
                      : v.voltageLabels[idx] + " V"}
                  </button>
                ))}
              </div>
              {/** end out[ut button] */}

              {/** result row */}
              <div className="flex items-center space-x-4 mt-2">
                <label className=" label-text">Pass/Fail</label>
                <div className="w-full space-y-2">
                  <div className="flex w-full space-x-3">
                    <label className="label-text">Current</label>
                    <div className="flex-1 flex items-center justify-between">
                      {results[v.id - 1]["currentResults"].map((res, idx) => (
                        <div key={v.id + `${idx}`} className="flex space-x-2">
                          <input
                            type="checkbox"
                            checked={res === null ? false : res}
                            className="checkbox checkbox-success checkbox-sm"
                            onChange={() => {}}
                          />
                          <input
                            type="checkbox"
                            checked={res === null ? false : !res}
                            className="checkbox checkbox-error checkbox-sm"
                            onChange={() => {}}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex w-full space-x-3">
                    <label className="label-text">Voltage</label>
                    <div className="flex-1 flex items-center justify-between">
                      {v.mode === "voltage" &&
                        results[v.id - 1]["voltageResults"].map((res, idx) => (
                          <div key={v.id + `${idx}`} className="flex space-x-2">
                            <input
                              type="checkbox"
                              checked={res === null ? false : res}
                              className="checkbox checkbox-success checkbox-sm"
                              onChange={() => {}}
                            />
                            <input
                              type="checkbox"
                              checked={res === null ? false : !res}
                              className="checkbox checkbox-error checkbox-sm"
                              onChange={() => {}}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
export default AnalogIo;
