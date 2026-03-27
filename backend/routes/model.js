const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const express = require("express");

const { default: yahooFinance } = require("yahoo-finance2");
const { formatDate, getBeforeDate } = require("../lib/utils");
const { fetchHistorical } = require("../lib/yahooCache");

const app = express();
app.use(express.json());
const router = express.Router({ mergeParams: true });
require("dotenv").config();

const finnhub = require("finnhub");
const finnhubClient = new finnhub.DefaultApi(process.env.finnhubKey);
const tf = require("@tensorflow/tfjs-node");
const fs = require("fs-extra");
const B2 = require("backblaze-b2");
const b2 = new B2({
  applicationKeyId: process.env.B2_KEY_ID,
  applicationKey: process.env.B2_APP_KEY,
});

//constants
const bucketId = process.env.bucket_id; // buckedId for saving models
const NUM_FEATURES = 4; // number of features in the model, currently (high, volume, open, low)

const cleanRawData = (historicalData, tickerArr) => {
  // historicalData[tick] is a plain array from yf.historical
  const minLen = Math.min(...tickerArr.map((t) => historicalData[t]?.length ?? 0));
  if (minLen < 2) return null;

  let cleanData = [];
  let labels = [];
  let highArr = [], volArr = [], openArr = [], lowArr = [];

  for (let i = 0; i < minLen; i++) {
    let concatData = new Array(NUM_FEATURES).fill(0);
    let labelVal = 0;
    for (let tick of tickerArr) {
      const q = historicalData[tick][i];
      if (!q) continue;
      concatData[0] += q.high ?? 0;
      concatData[1] += q.volume ?? 0;
      concatData[2] += q.open ?? 0;
      concatData[3] += q.low ?? 0;
      labelVal += q.close ?? 0;
    }
    cleanData.push(concatData);
    highArr.push(concatData[0]);
    volArr.push(concatData[1]);
    openArr.push(concatData[2]);
    lowArr.push(concatData[3]);
    labels.push(labelVal);
  }
  normalize(
    cleanData,
    [Math.min(...highArr), Math.min(...volArr), Math.min(...openArr), Math.min(...lowArr)],
    [Math.max(...highArr), Math.max(...volArr), Math.max(...openArr), Math.max(...lowArr)],
    true
  );
  let maxLabel = [Math.max(...labels)];
  let lastPrice = labels[labels.length - 1];
  let minLabel = [Math.min(...labels)];
  normalize(labels, minLabel, maxLabel, false);
  return { cleanData, labels, lastPrice, minLabel, maxLabel };
};

const saveModel = async (model, portfolioId, portfolio) => {
  await b2.authorize(); // authorization last 24 hours!
  const uploadUrlResponse = await b2.getUploadUrl({
    bucketId: bucketId,
  });
  const tempDir = `./tmp/portfolio-${portfolioId}`;
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });
  await model.save(`file://${tempDir}`);
  const remoteFilePath = `models/portfolio-${portfolioId}`;
  const endValues = ["model.json", "weights.bin"];
  for (let ending of endValues) {
    let data = fs.readFileSync(`${tempDir}/${ending}`);
    // store model json file
    await b2.uploadFile({
      uploadUrl: uploadUrlResponse.data.uploadUrl,
      uploadAuthToken: uploadUrlResponse.data.authorizationToken,
      fileName: `${remoteFilePath}/${ending}`,
      data,
    });

    // remove old versions of the file from b2
    const response = await b2.listFileVersions({
      bucketId,
      prefix: `models/portfolio-${portfolioId}/${ending}`,
    });

    const fileVersions = response.data.files
      .filter((file) => file.fileName === `${remoteFilePath}/${ending}`)
      .sort((a, b) => a.uploadTimestamp - b.uploadTimestamp); // sort the files by time uploaded.

    for (const deleteFile of fileVersions.slice(0, -1)) {
      await b2.deleteFileVersion({
        fileId: deleteFile.fileId,
        fileName: deleteFile.fileName,
      });
    }
  }

  // saved model! so send notification to inbox.

  await prisma.notification.create({
    data: {
      url: `portfolios/${portfolioId}`,
      description: `${portfolio.name} has a new model ready. Click on the "Get Future Predictions" tab to see the results.`,
      userId: portfolio.userId,
    },
  });

  // now send websocket to get notifications!

  fs.rmSync(tempDir, { recursive: true, force: true });
};

const getModel = async (portfolioId) => {
  const downloadUrl = (await b2.authorize()).data.downloadUrl; // authorization last 24 hours!
  const remoteFilePath = `models/portfolio-${portfolioId}`;
  const response = await b2.getDownloadAuthorization({
    bucketId,
    fileNamePrefix: remoteFilePath,
    validDurationInSeconds: 3600,
  });
  const authorizationToken = response.data.authorizationToken;
  const url = `${downloadUrl}/file/${process.env.bucket_name}/${remoteFilePath}/model.json?Authorization=${authorizationToken}`;
  return tf.loadLayersModel(url);
};

const getCachedIfExists = async (portfolioId) => {
  try {
    const model = await getModel(portfolioId);
    return model;
  } catch (err) {
    return null;
  }
};

const FUTURE_DAYS = 30;
const WINDOW = 40;

// Fetches historical data for all tickers and cleans it for the model
const prepareModelData = async (tickerArr) => {
  const todayString = new Date();
  const earlierString = getBeforeDate(""); // 1 year — need ≥70 trading days for WINDOW+FUTURE_DAYS
  const results = await Promise.all(
    tickerArr.map((tick) => fetchHistorical(tick, earlierString, todayString))
  );
  const historicalData = Object.fromEntries(tickerArr.map((tick, i) => [tick, results[i] ?? []]));
  const cleaned = cleanRawData(historicalData, tickerArr);
  if (!cleaned) return null;
  // Find the last traded date across all tickers so predictions start from there
  let lastDate = null;
  for (const result of results) {
    if (result?.length) {
      const d = result[result.length - 1].date;
      if (!lastDate || d > lastDate) lastDate = d;
    }
  }
  return { ...cleaned, lastDate };
};

// Runs predictions on a loaded model and returns { base, bull, bear }
const runPredictions = async (model, cleaned, tickerArr, currentCost) => {
  let { cleanData, minLabel, maxLabel, lastDate } = cleaned;
  const lastDays = cleanData.slice(-WINDOW);
  const input = tf.tensor3d([lastDays], [1, WINDOW, NUM_FEATURES]);
  const prediction = model.predict(input);
  const predictionArray = (await prediction.array())[0];
  tf.dispose([input, prediction]);

  // Start predictions from the last traded date, not today — avoids gaps on weekends/holidays
  let currentDate = lastDate ? new Date(lastDate) : new Date();
  const offset = currentCost - parseFloat(unNormalize(predictionArray[0], minLabel, maxLabel));
  const valuePredict = predictionArray.map((value) => {
    const price = unNormalize(value, minLabel, maxLabel);
    currentDate.setDate(currentDate.getDate() + 1);
    return { date: formatDate(new Date(currentDate)), price: parseFloat(price) + offset };
  });

  const finalValues = await additionalModelFactors(tickerArr, valuePredict);

  return { base: finalValues };
};

const TOTAL_EPOCHS = 10;

// Background training — called after response is already sent
const trainInBackground = async (portfolioId, userId, portfolio, tickerArr, io) => {
  await prisma.portfolio.update({ where: { id: portfolioId }, data: { isTraining: true } });
  if (io) io.emit("training:start", { portfolioId });

  try {
    const cleaned = await prepareModelData(tickerArr);
    if (!cleaned) throw new Error("Not enough historical data to train");
    const { cleanData, labels } = cleaned;

    const X = [];
    const Y = [];
    for (let i = 0; i + WINDOW + FUTURE_DAYS <= cleanData.length; i++) {
      X.push(cleanData.slice(i, i + WINDOW));
      Y.push(labels.slice(i + WINDOW, i + WINDOW + FUTURE_DAYS));
    }
    const X_values = tf.tensor3d(X, [X.length, WINDOW, NUM_FEATURES]);
    const Y_values = tf.tensor2d(Y, [Y.length, FUTURE_DAYS]);

    const model = tf.sequential();
    model.add(tf.layers.lstm({ units: 30, inputShape: [WINDOW, NUM_FEATURES], returnSequences: true }));
    model.add(tf.layers.lstm({ units: 16, returnSequences: false }));
    model.add(tf.layers.dense({ units: FUTURE_DAYS, activation: "tanh" }));
    model.compile({ optimizer: tf.train.adam(), loss: "meanSquaredError" });

    await model.fit(X_values, Y_values, {
      epochs: TOTAL_EPOCHS,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          const pct = Math.round(((epoch + 1) / TOTAL_EPOCHS) * 100);
          console.log(`Portfolio ${portfolioId} — Epoch ${epoch + 1}/${TOTAL_EPOCHS}  loss=${logs.loss?.toFixed(4)}  pct=${pct}%`);
          if (io) io.emit("training:progress", { portfolioId, epoch: epoch + 1, totalEpochs: TOTAL_EPOCHS, pct });
        },
      },
    });
    tf.dispose([X_values, Y_values]);

    await prisma.portfolio.update({ where: { id: portfolioId }, data: { model: true, isTraining: false } });
    const newUser = await prisma.user.update({
      where: { id: userId },
      data: { unreadNotifications: { increment: 1 } },
    });
    await saveModel(model, portfolioId, portfolio);
    if (io) {
      io.emit("training:done", { portfolioId });
      io.emit("notification", newUser.unreadNotifications);
    }
  } catch (err) {
    console.error("Training failed for portfolio", portfolioId, ":", err?.message ?? err);
    await prisma.portfolio.update({ where: { id: portfolioId }, data: { isTraining: false } }).catch(() => {});
    if (io) io.emit("training:error", { portfolioId, message: err?.message ?? "Training failed" });
  }
};

/* create and run model! */
router.post("/:id", async (req, res) => {
  try {
    const portfolioId = parseInt(req.params.id);
    const currentCost = parseInt(req.body.currentPrice);
    const isNewModel = JSON.parse(req.body.newModel);
    const userId = req.session.userId;

    const portfolio = await prisma.portfolio.findUnique({ where: { id: portfolioId } });
    const companyArrays = await prisma.company.findMany({ where: { id: { in: portfolio.companiesIds } } });
    const tickerArr = companyArrays.map((val) => val.ticker);

    if (isNewModel) {
      // Respond immediately — training runs in background
      res.status(202).json({ training: true });
      trainInBackground(portfolioId, userId, portfolio, tickerArr, req.app.get("io"));
      return;
    }

    // Load cached model and run predictions synchronously
    const model = await getCachedIfExists(portfolioId);
    if (!model) {
      return res.status(404).json({ error: "No trained model found. Train a new model first." });
    }

    const cleaned = await prepareModelData(tickerArr);
    if (!cleaned) {
      return res.status(500).json({ error: "Not enough historical data. Try again in a moment." });
    }

    const result = await runPredictions(model, cleaned, tickerArr, currentCost);
    res.json(result);
  } catch (err) {
    console.error("Model route error:", err?.message ?? err);
    if (!res.headersSent) {
      res.status(500).json({ error: err?.message ?? "Internal Server Error" });
    }
  }
});

// now we look at P/E, earnings expectations, etc:

// to do this, we look at average analyst rating and give higher weight to those
const additionalModelFactors = async (tickers, valuePredict) => {
  try {
    const rawData = await yahooFinance.quote(tickers, {}, { validateResult: false });
    const data = Array.isArray(rawData) ? rawData : [rawData];
    let analystsum = 0;
    for (const companydata of data) {
      if (!companydata || companydata.averageAnalystRating == null) {
        analystsum += 2.5;
      } else {
        const newFloat = parseFloat(companydata.averageAnalystRating.split(" ")[0]);
        analystsum += isNaN(newFloat) ? 2.5 : newFloat;
      }
    }
    const averageAnalystRating = analystsum / data.length;
    const factorChange = determineFactor(averageAnalystRating);
    return valuePredict.map((value, ind) => ({
      date: value.date,
      price: value.price * Math.pow(factorChange, ind),
    }));
  } catch {
    return valuePredict;
  }
};

const determineFactor = (averageAnalystRating) => {
  const factorRange = 0.002;
  const dilution = 3 - (averageAnalystRating + 0.5); // subtracting .5 factor as the analyst ratings are always skewed towards buy.
  return 1 + factorRange * dilution;
};

// normalize data using xi - min(x) / (max(x) - min(x)) to get data with mean=0 and std 1,
// normalizes along columns
const normalize = (arrToNormalize, minvalues, maxvalues, double) => {
  if (double) {
    for (let i = 0; i < arrToNormalize.length; i++) {
      for (let k = 0; k < 4; k++) {
        arrToNormalize[i][k] =
          (arrToNormalize[i][k] - minvalues[k]) / (maxvalues[k] - minvalues[k]);
      }
    }
    return arrToNormalize;
  }
  for (let i = 0; i < arrToNormalize.length; i++) {
    arrToNormalize[i] =
      (arrToNormalize[i] - minvalues[0]) / (maxvalues[0] - minvalues[0]);
  }
  return arrToNormalize;
};

const unNormalize = (value, min, max) => {
  const minVal = Array.isArray(min) ? min[0] : min;
  const maxVal = Array.isArray(max) ? max[0] : max;
  return value * (maxVal - minVal) + minVal;
};

/* Stretch Feature / TC iteration, Risk Analysis. 

This endpoint gets ALL earnings releases in the next month, and puts them in the db so that we have 
quick access for model. This is when we will see big shifts. 
*/

router.get("/earnings", async (req, res) => {
  const today = new Date();
  let nextDate = new Date(today);
  nextDate.setMonth(nextDate.getMonth() + 1);
  const begin = formatDate(today);
  const end = formatDate(nextDate);
  await finnhubClient.earningsCalendar(
    { from: begin, to: end },
    async (error, data, response) => {
      res.json(data);
      for (let nextEarnings of data.earningsCalendar) {
        // check that symbol exists in db:
        const exists = await prisma.company.findUnique({
          where: {
            ticker: nextEarnings.symbol,
          },
        });
        if (exists == null) {
          continue;
        }
        await prisma.company.update({
          where: {
            ticker: nextEarnings.symbol,
          },
          data: {
            UpcomingEarnings: [
              nextEarnings.date,
              String(nextEarnings.epsActual),
              String(nextEarnings.epsEstimate),
              String(nextEarnings.revenueActual),
              String(nextEarnings.revenueEstimate),
              nextEarnings.symbol,
            ],
          },
        });
      }
    }
  );
});

router.get("/earningsdata/:id", async (req, res) => {
  const portfolioId = parseInt(req.params.id);
  const portfolio = await prisma.portfolio.findUnique({
    where: {
      id: portfolioId,
    },
  });

  const companyList = await prisma.company.findMany({
    where: {
      id: { in: portfolio.companiesIds },
    },
  });
  const earningsList = companyList.filter(
    (value) =>
      value.UpcomingEarnings != null && value.UpcomingEarnings.length != 0
  );
  res.json(earningsList);
});

module.exports = router;
