import React, { useState, useEffect, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { getStudentScores, getScoresCourse, socket } from "../services";
import { HiChevronRight } from "react-icons/hi";
import { VscGraph } from "react-icons/vsc";
import { ImParagraphLeft } from "react-icons/im";
import { Text, Progress } from "@mantine/core";
import { Chart } from "chart.js/auto";
import annotationPlugin from "chartjs-plugin-annotation";
import { Line } from "react-chartjs-2";
import { CurrentContext } from "../context";

Chart.register(annotationPlugin);

export default function StudentDashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { current } = useContext(CurrentContext);
  const [message, setMessage] = useState();
  const [courseList, setCourseList] = useState([]);
  const [section, setSection] = useState();
  const [scoreList, setScoreList] = useState([]);
  const [scores, setScores] = useState();
  const [searchParams, setSearchParams] = useSearchParams({});
  const [params, setParams] = useState({});
  const [isShowGraph, setIsShowGraph] = useState(false);
  const title = [
    "YOUR SCORE",
    "Mean",
    "Max",
    "Median",
    "Lower Quartile",
    "Upper Quartile",
  ];
  const colorProgress = [
    "#0014c7",
    "red",
    "#429195",
    "brown",
    "green",
    "purple",
  ];
  let mean = 0,
    max = 0,
    median = 0,
    q1 = 0,
    q3 = 0,
    num = 0;
  const [stat, setStat] = useState([]);
  const [SD, setSD] = useState(0);
  const [fullScore, setFullScore] = useState();
  const [xValues, setXValues] = useState([]);
  const [yValues, setYValues] = useState([]);

  const fetchData = async () => {
    const year = current[0]?.year;
    const semester = current[0]?.semester;
    const data = await getStudentScores(year, semester);
    if (data) {
      if (data.ok) {
        setCourseList(data.scores.courseGrades);
      } else {
        setMessage(data.message);
      }
    }
  };

  useEffect(() => {
    socket.on("courseUpdate", (course) => {
      console.log(course);
      setMessage();
      setCourseList([]);
      setScoreList([]);
      setStat([]);
      fetchData();
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    if (!courseList.length && !message) fetchData();
    if (params.courseNo && courseList.length) {
      setCourse(params.courseNo);
    }
    if (params.scoreName) {
      calStat(params.scoreName);
    }

    // Clear the interval when the component unmounts
    return () => clearInterval(interval);
  }, [courseList, section, scores]);

  useEffect(() => {
    setParams({
      courseNo: searchParams.get("courseNo"),
      scoreName: searchParams.get("scoreName"),
    });
    if (!params.scoreName) {
      setScores(null);
    }
  }, [searchParams]);

  useEffect(() => {
    const densityNormal = (value, mean, sd) => {
      const SQRT2PI = Math.sqrt(2 * Math.PI);
      sd = sd == null ? 1 : sd;
      const z = (value - (mean || 0)) / sd;
      return Math.exp(-0.5 * z * z) / (sd * SQRT2PI);
    };

    let YValues = xValues.map((item) => {
      if (stat[1] === null || SD === undefined) {
        return null;
      } else {
        const pdfValue = densityNormal(item, stat[1], SD);
        return pdfValue === Infinity ? null : pdfValue;
      }
    });
    setYValues(YValues); // array for Y values
  }, [xValues]);

  // Function to format the date as "XX Aug, 20XX"

  // Format the date with the Buddhist year and "BE" format.
  const formatDateBE = (date) => {
    const buddhistYear = date.getFullYear() + 543;
    const options = { day: "numeric", month: "short", year: "numeric" };
    const formattedDate = date
      .toLocaleDateString("en-US", options)
      .replace(/\d{4}/, `${buddhistYear}`);

    return formattedDate;
  };

  const setCourse = (data) => {
    const course = courseList.filter((c) => c.courseNo === data)[0];
    setSection(course.section);
    setScoreList(course.scores);
  };

  const backToDashboard = () => {
    setCourseList([]);
    setScoreList([]);
    setStat([]);
    searchParams.delete("courseNo");
    searchParams.delete("scoreName");
    setSearchParams(searchParams);
  };

  const onClickCourse = (e) => {
    setCourse(e);
    searchParams.set("courseNo", e);
    setSearchParams(searchParams);
  };

  const backToCourse = () => {
    setCourseList([]);
    setScoreList([]);
    setStat([]);
    searchParams.delete("scoreName");
    setSearchParams(searchParams);
  };

  const onClickScore = async (e) => {
    calStat(e);
    searchParams.set("scoreName", e);
    setSearchParams(searchParams);
  };

  const changeView = () => {
    isShowGraph ? setIsShowGraph(false) : setIsShowGraph(true);
  };

  const calStat = async (data) => {
    const scorePS = scoreList?.filter((s) => s.scoreName === data)[0]?.point;
    if (section && data && !scores) {
      const resp = await getScoresCourse({
        section: section,
        courseNo: params.courseNo,
        scoreName: data,
      });
      if (resp) {
        setScores(resp.results);
        setFullScore(resp.fullScore);
      }
    }
    if (scores) {
      let dataSort = [];
      num = scores.length;
      scores.sort((a, b) => a.point - b.point);
      scores.map((e) => dataSort.push(e.point));
      setXValues(dataSort);
      scores.map((e) => (mean += e.point));
      mean = (mean / num).toFixed(2);
      max = scores[num - 1].point;
      median =
        num % 2 === 0
          ? (
              (scores[parseInt(num / 2) - 1].point +
                scores[parseInt(num / 2)].point) /
              2
            ).toFixed(2)
          : scores[parseInt(num / 2)].point.toFixed(2);
      const posQ1 = (num + 1) * (1 / 4) - 1;
      const posQ3 = (num + 1) * (3 / 4) - 1;
      const baseQ1 = Math.floor(posQ1);
      const baseQ3 = Math.floor(posQ3);
      q1 = (
        scores[baseQ1].point +
        (posQ1 - baseQ1) * (scores[baseQ1 + 1].point - scores[baseQ1].point)
      ).toFixed(2);
      q3 = Number(scores[baseQ3].point.toFixed(2));
      if (baseQ3 + 1 < scores.length) {
        q3 = (
          q3 +
          (posQ3 - baseQ3) * (scores[baseQ3 + 1].point - scores[baseQ3].point)
        ).toFixed(2);
      }
      let x = 0;
      scores.map((e) => (x += Math.pow(e.point - mean, 2)));
      setSD(Math.sqrt(x / num).toFixed(2));
    }

    setStat([scorePS, mean, max, median, q1, q3]);
  };

  const data = {
    labels: [...xValues],
    datasets: [
      {
        data: [...yValues],
        lineTension: 0.5,
        yAxisID: "y",
      },
    ],
  };

  const statLine = [];
  for (let i = 0; i < title.length; i++) {
    if (i !== 2) {
      statLine.push({
        type: "line",
        label: {
          content: `${title[i]} ${stat[i]}`,
          display: true,
          position: "start",
          yAdjust: i === 3 ? 20 : i === 0 ? -20 : 0,
          xAdjust: 8,
          // rotation: i === 0 ? 90 : 0,
          color: colorProgress[i],
          backgroundColor: "rgb(0,0,0,0)",
          font: {
            // size: 15,
            // fontFamily: "SF PRo, sans-serif",
          },
        },
        value: stat[i],
        borderColor: colorProgress[i],
        borderDash: [6, 6],
        borderWidth: 2,
        scaleID: "x",
      });
    }
  }

  return (
    <div className="mt-20 lg:mt-24 lg:px-20">
      {params.courseNo && (
        <div className="mx-[2%] lg:mt-24 mt-20 max-h-screen">
          <div className=" pb-2 lg:-mt-5 md:-mt-4 -mt-3 ">
            <p className="flex flex-row items-center justify-content font-semibold text-primary gap-3 ">
              <label
                onClick={backToDashboard}
                className="text-[19px] md:text-[22px] lg:text-[25px] cursor-pointer"
              >
                Dashboard
              </label>
              <HiChevronRight className="text-2xl" />
              <label
                onClick={backToCourse}
                style={{ cursor: params.scoreName ? "pointer" : null }}
                className="text-[17px] md:text-[20px] lg:text-[23px]"
              >
                {params.courseNo}
              </label>
              {params.scoreName && (
                <>
                  <HiChevronRight className="text-2xl" />
                  <label className="text-[17px] md:text-[20px] lg:text-[23px]">
                    {params.scoreName}
                  </label>
                </>
              )}
            </p>
            <div className=" border-b-[3px] border-primary shadow-inset-md opacity-25"></div>
          </div>
        </div>
      )}
      {/* MENU */}
      <div className="mx-[2%] max-h-fit">
        <div className="py-4 text-maintext font-semibold">
          <div className="flex items-end">
            <div
              className="flex-col flex w-full"
              style={{
                fontFamily: "'SF PRo', sans-serif",
              }}
            >
              <span //big text topic
                className="text-3xl md:text-4xl lg:text-5xl"
              >
                {!params.courseNo && "Dashboard"}
                {params.courseNo && !params.scoreName && params.courseNo}
                {params.scoreName && params.scoreName}
              </span>
              <span className="text-xl lg:text-2xl">
                {formatDateBE(currentDate)}
              </span>
            </div>

            {params.scoreName && (
              <div className="flex justify-end items-center w-full">
                <div
                  className="text-primary flex lg:text-xl text-md border-primary border-2 px-3 py-2 rounded-xl hover:text-white hover:bg-primary duration-150 group cursor-pointer"
                  onClick={changeView}
                >
                  {isShowGraph ? (
                    <ImParagraphLeft className="lg:text-3xl text-xl mr-2" />
                  ) : (
                    <VscGraph className="lg:text-3xl text-xl mr-2" />
                  )}
                  {isShowGraph ? "Show Detail" : "Show Graph"}
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className={
            "p-5 flex flex-col gap-3 border-[3px] border-primary rounded-2xl shadow-xl lg:h-[65vh] md:h-[65vh] h-[66vh] overflow-x-auto"
          }
        >
          {message && (
            <Text
              className="flex w-full justify-center items-center text-maintext text-3xl lg:text-4xl border-b-[1px] pb-2 border-primary/50"
              style={{
                fontFamily: "'SF PRo', sans-serif",
              }}
            >
              {message}
            </Text>
          )}
          {!params.courseNo &&
            courseList.map((item, key) => {
              return (
                <div
                  key={key}
                  className="bg-primary py-3 rounded-xl group active:bg-maintext hover:bg-secondary"
                  onClick={() => onClickCourse(item.courseNo)}
                >
                  {/* <div className={Student.courseName}> */}
                  <div className=" px-5 py-1 font-semibold group-hover:cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div className="text-white lg:text-2xl text-lg">
                        {item.courseNo} - {item.courseName}
                        <div
                          className=" text-[#F7C878] lg:text-[20px] text-[16px] font-normal"
                          style={{
                            fontFamily: "'SF PRo', sans-serif",
                          }}
                        >
                          Section {item.section}
                        </div>
                      </div>

                      <HiChevronRight className="text-4xl text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          {params.courseNo &&
            !params.scoreName &&
            scoreList.map((item, key) => {
              return (
                <div
                  key={key}
                  className="bg-primary py-3 rounded-xl group active:bg-maintext hover:bg-secondary"
                  onClick={() => onClickScore(item.scoreName)}
                >
                  {/* <div className={Student.courseName}> */}
                  <div className=" px-5 py-1 font-semibold group-hover:cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div
                        className="text-white lg:text-2xl text-lg"
                        style={{
                          fontFamily: "'SF PRo', sans-serif",
                        }} //not global font**
                      >
                        {item.scoreName}
                      </div>
                      <HiChevronRight className="text-4xl text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          {params.scoreName && (
            <>
              {!isShowGraph && (
                <div className="py-3">
                  <div className="flex w-full justify-end text-maintext lg:text-3xl text-2xl font-bold">
                    Full Score: {fullScore}
                  </div>
                  {stat.map((e, i) => (
                    <div key={i} className="py-2">
                      <div
                        className={`${
                          i === 0 ? "lg:text-3xl text-2xl" : "text-xl"
                        } py-2 font-semibold`}
                        style={{ color: colorProgress[i] }}
                      >
                        {title[i]} : <span className="font-normal">{e}</span>
                      </div>
                      <Progress
                        value={(e * 100) / fullScore}
                        radius={10}
                        color={colorProgress[i]}
                        bg="#D9D9D9"
                      />
                    </div>
                  ))}
                  <div className="text-black text-xl pt-4 font-semibold">
                    SD : <span className="font-normal">{SD}</span>
                  </div>
                </div>
              )}
              {isShowGraph && (
                <div className="lg:h-full md:h-full">
                  <Line
                    data={data}
                    options={{
                      scales: {
                        x: {
                          type: "linear",
                          position: "bottom",
                        },
                        y: {
                          type: "linear",
                          position: "left",
                        },
                      },
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        annotation: {
                          clip: false,
                          annotations: statLine,
                        },
                      },
                      animation: false,
                      elements: {
                        point: {
                          radius: 0,
                        },
                        line: {
                          borderColor: "black",
                          borderWidth: 1,
                        },
                      },
                      events: [],
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
