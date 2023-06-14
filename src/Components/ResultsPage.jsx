import { ipcRenderer } from "electron";
import { useEffect, useState } from "react";

//
// [
//   { testName: "dig-io-1", result: "Passed" },
//   { testName: "dig-io-2", result: "Passed" },
//   { testName: "dig-io-3", result: "Passed" },
//   { testName: "dig-io-4", result: "Failed" },
//   { testName: "dig-io-5", result: "Passed" },
//   { testName: "dig-io-6", result: "Passed" },
//   { testName: "dig-io-7", result: "Passed" },
//   { testName: "dig-io-8", result: "Passed" },
//   { testName: "memory-test-1", result: "Passed" },
//   { testName: "rtu-test-1", result: "Failed" },
//   { testName: "rtu-test-2", result: "Passed" },
//   { testName: "rtu-test-3", result: "Failed" },
//   {
//     testName: "analog-io-1",
//     result: "Failed",
//     failedReason: [
//       { label: 3, value: 3792 },
//       { label: 7, value: 6906 },
//       { label: 10, value: 10019 },
//     ],
//   },
//   {
//     testName: "analog-io-2",
//     result: "Failed",
//     failedReason: [
//       { label: 0, value: 32 },
//       { label: 7, value: 6919 },
//       { label: 10, value: 10019 },
//     ],
//   },
//   {
//     testName: "analog-io-3",
//     result: "Failed",
//     failedReason: [
//       { label: 0, value: 26 },
//       { label: 3, value: 3739 },
//       { label: 7, value: 6844 },
//     ],
//   },
//   {
//     testName: "analog-io-4",
//     result: "Failed",
//     failedReason: [
//       { label: 0, value: 29 },
//       { label: 3, value: 3763 },
//       { label: 7, value: 6884 },
//       { label: 10, value: 9992 },
//     ],
//   },
// ]

const ResultsPage = ({
  show,
  testResults,
  boardUid,
  serialNo,
  setTestResults,
  setCurrentStep,
  isConnected,
  setIsConnected,
  setBoardUid,
  setSerialNo,
}) => {
  const [resultArr, setResultArr] = useState([]);

  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    let data = [];
    Object.entries(testResults).map(([key, testVal]) => {
      console.log("testval", testVal);
      let resultStr = "";
      testVal.forEach((test) => {
        let row = {
          testName: "",
          result: "",
          failedReason: { current: [], voltage: [] },
        };
        if (test.hasOwnProperty("currentResults")) {
          if (test.currentResults.some((f) => f === false)) {
            resultStr = "Failed";
          } else {
            resultStr = "Passed";
          }
        }
        if (test.hasOwnProperty("voltageResults")) {
          if (test.voltageResults.some((f) => f === false)) {
            resultStr = "Failed";
          } else {
            resultStr = "Passed";
          }
        }
        if (test.hasOwnProperty("result")) {
          if (test.result == true) {
            resultStr = "Passed";
          } else {
            resultStr = "Failed";
          }
        }
        if (test.hasOwnProperty("failedReasonCurr")) {
          row.failedReason.current = test.failedReasonCurr;
        }
        if (test.hasOwnProperty("failedReasonVolt")) {
          row.failedReason.voltage = test.failedReasonVolt;
        }
        row.testName = key + "-" + test.id;
        row.result = resultStr;
        data.push(row);
      });
    });
    data = data.map((d) => {
      if (
        d.failedReason.current.length > 0 ||
        d.failedReason.voltage.length > 0
      ) {
        return { ...d };
      } else {
        return { testName: d.testName, result: d.result };
      }
    });

    setResultArr(data);
  }, []);

  const onSave = async () => {
    try {
      setLoading(true);

      await ipcRenderer.invoke("save-to-excel", resultArr, boardUid, serialNo);
      // await new Promise((res) => setTimeout(() => res(), 2500));
      if (!resultArr.map((r) => r.result).some((r) => r == "Failed")) {
        console.log("all passed");
        await new Promise((res) => setTimeout(() => res(), 100));
        await ipcRenderer.invoke("factory-reset");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setIsSaved(true);
    }
  };
  const onFinish = async () => {
    setLoading(true);
    await ipcRenderer.invoke("disconnect");
    setIsConnected(false);
    setBoardUid("");
    setSerialNo("");
    setTestResults({});
    setCurrentStep(1);
    setLoading(false);
  };
  return (
    <>
      {show && (
        <div>
          {/* {JSON.stringify(resultArr)} */}
          <h1 className=" text-base font-semibold mb-2">Test Results</h1>
          <table className="table w-full text-sm table-compact table-zebra">
            <thead>
              <tr>
                <th></th>
                <th>Test Name</th>
                <th>Result</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {resultArr &&
                resultArr.map((row) => (
                  <tr>
                    <td></td>
                    <td>{row.testName}</td>
                    <td>{row.result}</td>
                    <td>{JSON.stringify(row.failedReason)}</td>
                  </tr>
                ))}
            </tbody>
          </table>

          <div className="flex justify-end space-x-6 mt-2">
            <button
              className={`btn ${loading ? "loading" : ""} btn-sm`}
              onClick={onSave}
            >
              Save
            </button>
            <button
              disabled={!isSaved}
              className={`btn ${loading ? "loading" : ""} btn-sm`}
              onClick={onFinish}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
};
export default ResultsPage;
