import { ipcRenderer } from "electron";
import { useCallback, useEffect, useState } from "react";
import LoadingComp from "./LoadingComp";

const EthernetPortTest = ({
  show,
  setTestResults,
  currentStep,
  setCurrentStep,
}) => {
  const [ipAddr, setIpAddr] = useState("");
  const [pingLoading, setPingLoading] = useState(false);
  const [pingStatus, setPingStatus] = useState("");
  const [packetStatus, setPacketStatus] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([
    { id: 1, label: "Ping test", result: null },
    { id: 2, label: "Read IP address", result: null },
    { id: 3, label: "Packet sending test", result: null },
  ]);

  const [noOfTries, setNoOfTries] = useState(0);

  const readIp = async () => {
    try {
      setIsLoading(true);
      const response = await ipcRenderer.invoke("read-ip-address");
      console.log(response);
      setIpAddr(response);
      setResults((prevStates) => {
        let newStates = [...prevStates];
        let found = newStates.find((f) => f.id == 2);
        found.result = true;
        return newStates;
      });
    } catch (error) {
      setResults((prevStates) => {
        let newStates = [...prevStates];
        let found = newStates.find((f) => f.id == 2);
        found.result = true;
        return newStates;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testPing = async () => {
    try {
      setIsLoading(true);
      setPingLoading(true);
      const response = await ipcRenderer.invoke("ping");
      console.log(response.alive);
      if (response.alive == true) {
        setPingStatus("ping successful");
        // updateResult("tcpPort", 1, true);
        setResults((prevStates) => {
          let newStates = [...prevStates];
          let found = newStates.find((f) => f.id == 1);
          found.result = true;
          return newStates;
        });
      } else {
        setPingStatus("ping failed");
        // updateResult("tcpPort", 1, false);
        setResults((prevStates) => {
          let newStates = [...prevStates];
          let found = newStates.find((f) => f.id == 1);
          found.result = false;
          return newStates;
        });
      }
    } catch (error) {
      //   updateResult("tcpPort", 1, false);
      setResults((prevStates) => {
        let newStates = [...prevStates];
        let found = newStates.find((f) => f.id == 1);
        found.result = false;
        return newStates;
      });
    } finally {
      setIsLoading(false);
      setPingLoading(false);
    }
  };

  const onPacketSend = async () => {
    try {
      setIsLoading(true);
      setNoOfTries((prev) => prev + 1);
      const response = await ipcRenderer.invoke("send-packet");
      console.log(response);
      if (response.success) {
        setPacketStatus(true);
        setResults((prevStates) => {
          let newStates = [...prevStates];
          let found = newStates.find((f) => f.id == 3);
          found.result = true;
          return newStates;
        });
      } else {
        setPacketStatus(false);
        setResults((prevStates) => {
          let newStates = [...prevStates];
          let found = newStates.find((f) => f.id == 3);
          found.result = false;
          return newStates;
        });
      }
      //   console.log(Buffer.from(response.buffer).toString());
    } catch (error) {
      setPacketStatus(false);
      setIsLoading(false);
      setResults((prevStates) => {
        let newStates = [...prevStates];
        let found = newStates.find((f) => f.id == 3);
        found.result = true;
        return newStates;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // enable next stage
  useEffect(() => {
    if (!results.some((r) => r.result == null) && currentStep == 5) {
      setTestResults((prevStates) => {
        let newStates = { ...prevStates };
        return { ...newStates, "rtu-test": [...results] };
      });
      setCurrentStep(6);
    }
  }, [results]);

  return (
    <>
      {show && (
        <div className="relative border-t border-gray-200 mt-4 py-3">
          {isLoading && <LoadingComp />}
          <div className="space-x-6 mb-6">
            <button
              className={`btn ${pingLoading && "loading"}`}
              onClick={testPing}
            >
              Ping Test
            </button>
            {pingStatus === "ping successful" && (
              <span className=" bg-emerald-50 text-emerald-500 text-sm font-semibold px-2 py-1 rounded-lg">
                Ping successful
              </span>
            )}
            {pingStatus === "ping failed" && (
              <span className=" bg-rose-50 text-rose-500 text-sm font-semibold px-2 py-1 rounded-lg">
                Ping failed
              </span>
            )}
          </div>
          <div className="flex items-center space-x-6">
            <button className="btn" onClick={readIp}>
              Read IP
            </button>
            <input
              className="border border-gray-300 rounded-md px-4 py-2"
              type="text"
              readOnly
              value={ipAddr}
            />
          </div>
          <div className="space-x-4">
            <button
              disabled={noOfTries >= 4}
              className={`btn mt-6 `}
              onClick={onPacketSend}
            >
              send Packet
            </button>
            {packetStatus === true && (
              <span className=" bg-emerald-50 text-emerald-500 text-sm font-semibold px-2 py-1 rounded-lg">
                Packet sending successful
              </span>
            )}
            {packetStatus === false && (
              <span className=" bg-rose-50 text-rose-500 text-sm font-semibold px-2 py-1 rounded-lg">
                Packet sending failed {noOfTries < 4 && " try again"}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
};
export default EthernetPortTest;
