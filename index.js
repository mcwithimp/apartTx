const request = require("request");
const { xml2json } = require("xml-js");
const fs = require("fs");

const queryParams = {
  ServiceKey:
    "Q4D9iukSA4uVeseJVcVN2Q6J4jSu9y412d7Os8FufLXBLkwcZcOLxFqBFJoZkkLk4WYAL3ofQYRhby6RLVENtw==",
  numOfRows: 1500,
  LAWD_CD: 11740, // 서울시 강동구
  // 명일동 361	11740 101
  DEAL_YMD: "",
};

const year = ["2017", "2018", "2019", "2020"];
const month = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
];

const endPoint =
  "http://openapi.molit.go.kr/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcAptTradeDev";

const queryCommons = Object.keys(queryParams)
  .reduce((query, key) => {
    return `${query}${key}=${queryParams[key]}&`;
  }, "?")
  .slice(0, -1);

const handleResponse = (err, response, body) => {
  if (err) reject(err);
  console.log(`Status of ${ym}: ${response.statusCode}`);
  const data = JSON.parse(xml2json(body, { compact: true, spaces: 4 }));
  console.log(data.response.body.items.item.length);
  fs.writeFile(`./${ym}.json`, JSON.stringify(data, null, 2), (err, data) => {
    if (err) reject(err);
    resolve();
  });
};

const getData = (ym) => {
  return new Promise((resolve, reject) => {
    const query = queryCommons + ym;

    const url = endPoint + query;
    request(
      {
        url,
        method: "GET",
      },
      (err, response, body) => {
        if (err) reject(err);
        console.log("GOOD: ", ym);
        // console.log(`Status of ${ym}: ${response.statusCode}`);
        const data = JSON.parse(xml2json(body, { compact: true, spaces: 4 }));
        console.log(data.response.body.items.item.length);
        fs.writeFile(
          `./${ym}.json`,
          JSON.stringify(data, null, 2),
          (err, data) => {
            if (err) reject(err);
            resolve();
          }
        );
      }
    );
  });
};

const getYearData = (year) => {
  return month.map((m) => getData(year + m));
};

// Promise.all(getYearData(2018))
//   .then((res) => Promise.all(getYearData(2019)))
//   .then((res) => console.log("FINISHED!!!"))
//   .catch((err) => console.log(err));

const format = (m, d) => {
  return ("0" + m.trim()).slice(-2) + ("0" + d.trim()).slice(-2);
};

function chunkArray(myArray, chunk_size) {
  var index = 0;
  var arrayLength = myArray.length;
  var tempArray = [];

  for (index = 0; index < arrayLength; index += chunk_size) {
    myChunk = myArray.slice(index, index + chunk_size);
    // Do something if you want with the group
    tempArray.push(myChunk);
  }

  return tempArray;
}

// fs.readdir("./raw", (err, data) => {
//   const chunk = chunkArray(data, 6);

//   const jobs = chunk.reduce((p, paths) => {
//     return p.then((_) => {
//       const job = paths.map((path) => processRaw(path));
//       return Promise.all(job);
//     });
//   }, Promise.resolve());

//   jobs.then((_) => console.log("FINISHIED!!")).catch((err) => console.log(err));
// });

function processRaw(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(`./raw/${path}`, (err, data) => {
      if (err) reject(err);
      const target = JSON.parse(data)
        .response.body.items.item.filter((x) => {
          return (
            x["법정동"]["_text"].trim() == "명일동" ||
            x["법정동읍면동코드"]["_text"].trim() == "10100"
          );
        })
        .map((x) => {
          return {
            도로명건물본번호코드: x["도로명건물본번호코드"]["_text"].trim(),
            아파트: x["아파트"]["_text"].trim(),
            거래금액: x["거래금액"]["_text"].trim(),
            전용면적: x["전용면적"]["_text"].trim(),
            년: x["년"]["_text"].trim(),
            거래일시: format(x["월"]["_text"], x["일"]["_text"]),
            법정동: x["법정동"]["_text"].trim(),
            도로명: x["도로명"]["_text"].trim(),
            지번: x["지번"]["_text"].trim(),
            건축년도: x["건축년도"]["_text"].trim(),
          };
        });

      fs.writeFile(
        `./processed/${path}`,
        JSON.stringify(target, null, 2),
        (err, data) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  });
}

// fs.readdir("./byDate", (err, data) => {
//   const d = fs.readFileSync(`byDate/${data[0]}`);
//   const total = data.reduce((combined, path) => {
//     const d = JSON.parse(fs.readFileSync(`./byDate/${path}`));
//     return [...combined, ...d];
//   }, []);

//   const t = total.reduce((acc, item) => {
//     if (acc.hasOwnProperty(item["아파트"]) == false) {
//       return {
//         ...acc,
//         [item["아파트"]]: [item],
//       };
//     }

//     return {
//       ...acc,
//       [item["아파트"]]: [...acc[item["아파트"]], item],
//     };
//   }, {});

//   fs.writeFileSync("./byApt/data.json", JSON.stringify(t, null, 2));
// });

// let result = {};
// const apt = JSON.parse(fs.readFileSync("./byApt/data.json"));
// Object.keys(apt).forEach((k) => {
//   const txs = apt[k].map((tx) => tx["거래금액"].replace(",", ""));
//   result[k] = {};
//   result[k]["high"] = Math.max.apply(null, txs);
//   result[k]["low"] = Math.min.apply(null, txs);
//   result[k]["spread"] = Number(result[k]["high"]) - Number(result[k]["low"]);

//   const txsFilterd = apt[k]
//     .filter((tx) => tx["년"] + tx["거래일시"] >= "20170701")
//     .map((tx) => tx["거래금액"].replace(",", ""));
//   result[k]["high_20170701"] = Math.max.apply(null, txsFilterd);
//   result[k]["low_20170701"] = Math.min.apply(null, txsFilterd);
//   result[k]["spread_20170701"] =
//     Number(result[k]["high_20170701"]) - Number(result[k]["low_20170701"]);

//   const txsFilterd2 = apt[k]
//     .filter((tx) => tx["년"] + tx["거래일시"] >= "20171101")
//     .map((tx) => tx["거래금액"].replace(",", ""));
//   result[k]["high_20171101"] = Math.max.apply(null, txsFilterd2);
//   result[k]["low_20171101"] = Math.min.apply(null, txsFilterd2);
//   result[k]["spread_20171101"] =
//     Number(result[k]["high_20170701"]) - Number(result[k]["low_20170701"]);

//   result[k]["transactions"] = apt[k].sort((a, b) => {
//     return a["년"] + a["거래일시"] - (b["년"] + b["거래일시"]);
//   });
// });

// fs.writeFileSync("./byApt/dataMore.json", JSON.stringify(result, null, 2));

let result = [];
const data = JSON.parse(fs.readFileSync("./byApt/dataMore.json"));

Object.keys(data).forEach((k) => {
  if (data[k]["spread_20171101"] > 50000) {
    result.push({
      apt: k,
      //   spread: data[k].spread,
      //   high: data[k].high,
      //   low: data[k].low,
      spread: data[k].spread_20171101,
      high: data[k].high_20171101,
      low: data[k].low_20171101,
    });
  }
});
console.log(result);
