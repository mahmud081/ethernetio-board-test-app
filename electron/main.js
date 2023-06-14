const { BrowserWindow, app, screen, ipcMain } = require("electron");
const path = require("path");
const { SerialPort } = require("serialport");
const ModbusRTU = require("modbus-serial");
const ping = require("ping");
const net = require("net");
const fs = require("fs");
const XLSX = require("xlsx");
const os = require("os");
const util = require("util");

const url = process.env.VITE_DEV_SERVER_URL;
// config
let configPath;
if (url) {
  configPath = path.join(__dirname, "..", "public", "config.json");
} else {
  configPath = path.join(app.getAppPath(), "../../../../", "config.json");
  // configPath = path.join(app.getPath("exe"), "config.json");
}
// const configPath = path.join(app.getPath("public"), "config.json");
const configContent = fs.readFileSync(configPath, "utf-8");
const config = JSON.parse(configContent);

const mongoURI =
  "mongodb+srv://oven_controller_user:oven_controller_123@cluster0.iaf7g.mongodb.net/ethernet-io-db?retryWrites=true&w=majority";
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let mainWindow;
function createWindow(width = 1024, height = 600) {
  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 1014,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (url) {
    mainWindow.loadURL(url);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}
let client;

app.whenReady().then(() => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  createWindow(width, height);
  // createWindow(width, height);

  console.log(app.getPath("userData"));
  // mainWindow.webContents.send("message-from-main", appPath);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", async () => {
  console.log("closed func");
  if (client && client.isOpen) {
    await client.close();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("before-quit", async (event) => {
  console.log("closing func");
  if (client && client.isOpen) {
    await client.close();
  }

  // Handle the Ctrl+C close command
  // Perform necessary cleanup or prompt the user if needed

  // You can prevent the default behavior by uncommenting the following line
  // event.preventDefault();
});

let serialPath = "";

// fecth ports list

ipcMain.handle("fetch-ports", async (e) => {
  try {
    const ports = await SerialPort.list();
    return ports;
  } catch (error) {
    throw new Error(error.message);
  }
});

async function instantiateClient() {
  if (client && client.isOpen) {
    await client.close();
  }
  client = new ModbusRTU();
  try {
    await client.connectRTUBuffered(serialPath, {
      baudRate: 230400,
      parity: "even",
      // dataBits: 8,
      // stopBits: 1,
    });

    await client.setTimeout(2000);
    await client.setID(1);
    console.log(client.isOpen);
  } catch (error) {
    throw new Error(error.message);
  }
}

async function resetClient() {
  if (client && client.isOpen) {
    await client.close();
  } else {
    await instantiateClient();
  }
}
ipcMain.handle("reset-client", async (e) => {
  await instantiateClient();
});
// connect & get uid handler

ipcMain.handle("connect-board", async (e, path) => {
  serialPath = path;
  const respose = { success: true, uidArr: [], msg: "" };

  try {
    await instantiateClient();

    const uidArr = await client.readInputRegisters(102, 6);
    respose.uidArr = uidArr;
    return respose;
  } catch (error) {
    console.log(error);
    mainWindow.webContents.send("message-from-main", error.message);
    throw new Error(error.message);
  }
});

// get config
ipcMain.handle("get-config", async (e) => {
  await new Promise((res) => setTimeout(() => res(), 200));
  return config;
});

//read dig io

ipcMain.handle("read-dig-io", async (e) => {
  try {
    // await client.setTimeout(6000);
    const outputs = await client.readCoils(0, 8);
    await new Promise((res) => setTimeout(() => res(), 50));
    const inputs = await client.readDiscreteInputs(0, 8);
    // console.log(outputs, inputs);
    return { inputs: [...inputs.data], outputs: [...outputs.data] };
  } catch (error) {
    mainWindow.webContents.send("message-from-main", error.message);
    throw new Error(error.message);
  }
});

const digitalOutputs = {
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 6,
  8: 7,
};

// write digout
ipcMain.handle("write-dig-out", async (e, outputId, writeVal) => {
  try {
    // await new Promise((res) => setTimeout(() => res(), 200));
    await client.writeCoil(digitalOutputs[outputId], writeVal);
  } catch (error) {
    mainWindow.webContents.send("message-from-main", error.message);
    throw new Error(error.message);
  }
});

//analog output

//enable curr and volt mode
const analogEnableAddr = {
  1: 16,
  2: 17,
  3: 18,
  4: 19,
};
const enableOuputCurrAddr = {
  1: 145,
  2: 150,
  3: 155,
  4: 160,
};
const enableInputCurrModeAddr = {
  1: 137,
  2: 138,
  3: 139,
  4: 140,
};

ipcMain.handle("enable-current", async (e, rowId) => {
  try {
    //enable output
    await client.writeCoil(analogEnableAddr[rowId], 1);
    // enable output current mode
    await client.writeRegister(enableOuputCurrAddr[rowId], 0);
    // enable input current mode
    await client.writeRegister(enableInputCurrModeAddr[rowId], 0);
  } catch (error) {
    mainWindow.webContents.send("message-from-main", error.message);
    throw new Error(error.message);
  }
});
ipcMain.handle("enable-voltage", async (e, rowId) => {
  try {
    // enable output current mode
    await client.writeRegister(enableOuputCurrAddr[rowId], 1);
    // enable input current mode
    await client.writeRegister(enableInputCurrModeAddr[rowId], 1);
  } catch (error) {
    mainWindow.webContents.send("message-from-main", error.message);
    throw new Error(error.message);
  }
});

// read analog inputs
const analogInputAddr = {
  1: 1,
  2: 6,
  3: 11,
  4: 16,
};

ipcMain.handle("read-analog-input", async (e, ioMode) => {
  try {
    const inp1 = await client.readInputRegisters(
      ioMode === "current" ? analogInputAddr["1"] : analogInputAddr["1"] + 1,
      1
    );
    await new Promise((res) => setTimeout(() => res(), 100));

    const inp2 = await client.readInputRegisters(
      ioMode === "current" ? analogInputAddr["2"] : analogInputAddr["2"] + 1,
      1
    );
    await new Promise((res) => setTimeout(() => res(), 100));

    const inp3 = await client.readInputRegisters(
      ioMode === "current" ? analogInputAddr["3"] : analogInputAddr["3"] + 1,
      1
    );
    await new Promise((res) => setTimeout(() => res(), 100));

    const inp4 = await client.readInputRegisters(
      ioMode === "current" ? analogInputAddr["4"] : analogInputAddr["4"] + 1,
      1
    );
    await new Promise((res) => setTimeout(() => res(), 100));
    console.log(
      "inputs",
      inp1.data[0],
      inp2.data[0],
      inp3.data[0],
      inp4.data[0]
    );
    return [inp1.data[0], inp2.data[0], inp3.data[0], inp4.data[0]];
  } catch (error) {
    mainWindow.webContents.send("message-from-main", error.message);
    throw new Error(error.message);
  }
});

const analogOutput = {
  1: 146,
  2: 151,
  3: 156,
  4: 161,
};

ipcMain.handle("write-analog-output", async (e, outputId, outputVal) => {
  try {
    // await new Promise((res) => setTimeout(() => res(), 200));
    await client.writeRegister(analogOutput[outputId], outputVal);
  } catch (error) {
    mainWindow.webContents.send("message-from-main", error.message);
    throw new Error(error.message);
  }
});

// memory test
//start
ipcMain.handle("start-mem-test", async (e) => {
  try {
    await client.writeCoil(90, 1);
    return { success: true, msg: "" };
  } catch (error) {
    return { success: false, msg: "Failed to start test" };
  }
});

ipcMain.handle("read-mem-status", async (e) => {
  try {
    const resp = await client.readInputRegisters(90, 1);
    return resp.data[0];
  } catch (error) {
    console.log(error);
    mainWindow.webContents.send("message-from-main", error.message);
    throw new Error(error.message);
  }
});

// rtu test

ipcMain.handle("read-slave", async (e) => {
  console.log("invoked");
  try {
    // change slave id to 2
    console.log("cchanging to slave 2");
    await client.setID(2);
    await client.setTimeout(2000);

    // read from slave device
    console.log("reading slave");

    const resp = await client.readHoldingRegisters(260, 1);
    await client.setID(1);
    return resp.data[0];
  } catch (error) {
    console.log(error);
    await client.setID(1);
    mainWindow.webContents.send("message-from-main", error.message);
    return null;
  } finally {
    // change back to slave id 1
    console.log("change back to slave 1");
    await client.setID(1);
    await client.setTimeout(12000);
  }
});

//read ip address
ipcMain.handle("read-ip-address", async (e) => {
  try {
    const resArr = await client.readHoldingRegisters(176, 4);
    return resArr.data;
  } catch (error) {
    mainWindow.webContents.send("message-from-main", error.message);
    return [];
  }
});

// ping

ipcMain.handle("ping", async (e) => {
  const response = await ping.promise.probe("11.200.0.100");
  console.log(response);
  return response;
});

// send packet

async function sendPacket(msg) {
  const response = await new Promise((resolve, reject) => {
    const tcpClient = new net.Socket();

    tcpClient.setTimeout(4000, async function () {
      console.log("timeoout");
      // await client.writeRegister(280, 0);
      tcpClient.destroy();

      console.log("timeout closing socket");
      resolve(false);
    });
    // 502, "11.200.0.100"
    tcpClient.connect(502, "11.200.0.100", async function () {
      console.log("Connected");
      await new Promise((res) => setTimeout(() => res(), 500));
      tcpClient.write(msg);
    });

    tcpClient.on("data", async function (data) {
      console.log("Received: " + data);
      tcpClient.destroy(); // kill tcpClient after server's response
      resolve(data);
    });

    tcpClient.on("close", async function () {
      console.log("Connection closed");
      // await client.writeRegister(280, 0);
      resolve(false);
    });

    tcpClient.on("error", async function (err) {
      console.log("tcp error", err);
      // await client.writeRegister(280, 0);
      console.log("rejecting");
      resolve(false);
    });
  });
  console.log("resolve stat", response);
  return response;
}

ipcMain.handle("send-packet", async (e) => {
  let requestedPacket = [
      0x00, 0x01, 0x00, 0x00, 0x00, 0x0e, 0x00, 0x6d, 0x00, 0x00, 0x04, 0x00,
      0x08, 0x00, 0x0c, 0x00, 0x0f, 0xff, 0x00, 0x0f,
    ],
    hexVal = new Uint8Array(requestedPacket);

  try {
    await new Promise((res) => setTimeout(() => res(), 400));
    await client.setTimeout(12000);
    await client.writeRegister(280, 1);
    console.log("changed to master");
    const packetResp = await sendPacket(hexVal);
    await new Promise((res) => setTimeout(() => res(), 400));
    await client.writeRegister(280, 0);
    console.log("changed to slave");
    console.log("pac resp", packetResp);
    if (
      typeof packetResp === "object" &&
      Buffer.byteLength(packetResp) >= 20 &&
      packetResp[7] == 107
    ) {
      return { success: true, msg: "" };
    } else {
      return { success: false, msg: "" };
    }
  } catch (error) {
    console.log(error);
    await client.writeRegister(280, 0);
    mainWindow.webContents.send("message-from-main", error.message);
    return { success: false, msg: "" };
  } finally {
    await client.writeRegister(280, 0);
  }
});

const writeFileAsync = util.promisify(fs.writeFile);
const testResultSchema = new Schema(
  {
    uid: String,
    serialNo: String,
    testName: String,
    testResult: String,
    failedReason: String,
    flickerdValues: String,
  },
  { timestamps: true }
);
const TestResultModel = mongoose.model("TestResults", testResultSchema);

ipcMain.handle("save-to-excel", async (e, testData, serialNo, boardUid) => {
  let filePath = process.env.VITE_DEV_SERVER_URL
    ? path.join(__dirname, "../TestResults.xlsx")
    : path.join(os.homedir(), "TestResults.xlsx");

  let data = testData.map((m) => ({ uid: boardUid, sL: serialNo, ...m }));
  let workbook,
    dataforDb = data.map((d) => ({
      ...d,
      failedReason: JSON.stringify(d.failedReason),
    }));

  data = data.map((d) => {
    let row = [];
    row.push(d.uid);
    row.push(d.sL);
    row.push(d.testName);
    row.push(d.result);
    if (d.hasOwnProperty("failedReason")) {
      row.push(JSON.stringify(d.failedReason));
    }
    return row;
  });
  if (fs.existsSync(filePath)) {
    workbook = XLSX.readFile(filePath);
  } else {
    workbook = XLSX.utils.book_new();
    data.unshift([
      "UID",
      "SL No",
      "Test Name",
      "Result",
      "Failed Reason",
      "Flicekerd Values",
    ]);
  }

  const worksheet =
    workbook.SheetNames.length > 0
      ? workbook.Sheets[workbook.SheetNames[0]]
      : XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.aoa_to_sheet([]),
          "Results"
        );

  const existingData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const updatedData = existingData.concat(data);

  const updatedWorksheet = XLSX.utils.aoa_to_sheet(updatedData);

  workbook.Sheets[workbook.SheetNames[0]] = updatedWorksheet;
  const fileBuff = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  await writeFileAsync(filePath, fileBuff);

  let db;
  await mongoose
    .connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async (database) => {
      db = database;
      console.log("db connected");
      await TestResultModel.insertMany(dataforDb)
        .then(() => console.log("data saved"))
        .catch((err) => console.log("data saving err", err))
        .finally(async () => await database.disconnect());

      console.log("Data saved");
    })
    .catch((err) => console.log("Mongoose error", err));
  await db.disconnect();

  return { success: true };
});

ipcMain.handle("disconnect", async (e) => {
  if (client.isOpen) {
    await client.close();
  }
});

ipcMain.handle("view-results", async (e) => {
  let allData;
  await mongoose
    .connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async (db) => {
      const data = await TestResultModel.find({});
      allData = data;
      await db.disconnect();
    });
  return allData;
});

ipcMain.handle("find-prev-board", async (e, boardUid) => {
  console.log("board uid", boardUid);
  let prevData;
  await mongoose
    .connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async (db) => {
      const data = await TestResultModel.findOne({ uid: boardUid }).exec();
      prevData = data;
      await db.disconnect();
    });
  return prevData;
});

ipcMain.handle("factory-reset", async (e) => {
  try {
    await client.setTimeout(2000);
    await client.writeCoil(91, 1);
  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
});
