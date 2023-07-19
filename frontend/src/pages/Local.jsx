import {
  createEffect,
  createResource,
  createSignal,
  Show,
  Switch,
  Match,
  For,
  createComputed
} from "solid-js";
import { createStore, unwrap, reconcile, produce } from "solid-js/store";
import { ReactiveMap } from "@solid-primitives/map";
import { usePasteContext } from "../context/PasteContext";
import { useNavigate } from "@solidjs/router";
import { Portal } from "solid-js/web";
import "flowbite";
import { initFlowbite } from "flowbite";
import { useParams } from "@solidjs/router";
import _, { findIndex } from "lodash";
import axios from "axios";
import { sort } from 'fast-sort';
import { submitReport, fetchReport, fetchZkill, fetchShips, fetchTraits} from '../query/utils';
import ShipInfo from "../components/ShipInfo"
import { useShipsContext } from '../context/ShipsContext';

const ships = useShipsContext();

var sortDir = {
  security: "A",
  name: "A",
  corp_name: "A",
  alliance_name: "A",
  faction_name: "A",
  kills: "D",
  losses: "D",
  solo: "D",
  danger: "D",
  gang: "D"
}
var ulock = false;

function openNav(id) {
  console.log(
    "GET",
    document.getElementById("mySidenav" + id),
    "mySidenav" + id
  );
  const sideNav = document.getElementById("mySidenav" + id);
  if (sideNav) {
    sideNav.style.width = "250px";
    sideNav.style.paddingLeft = "10px";
    sideNav.hidden = false;
    // document.getElementById("main").style.paddingRight = "270px";
  }
}

/* Set the width of the side navigation to 0 and the left margin of the page content to 0 */
function closeNav(id) {
  console.log(
    "GET",
    document.getElementById("mySidenav" + id),
    "mySidenav" + id
  );
  const sideNav = document.getElementById("mySidenav" + id);
  if (sideNav) {
    sideNav.style.width = "0px";
    sideNav.style.paddingLeft = "0px";
    sideNav.hidden = true;
    // document.getElementById("main").style.paddingRight = "270px";
  }
}
/* set all sidenav elements to closed. for use with clicking the window instead of a button to close */
function closeAll() {
  const matches = document.querySelectorAll("div.sidenav");
  console.log("closeall", matches);
  for (const m of matches) {
    m.style.width = "0px";
    m.style.paddingLeft = "0px";
    m.hidden = true;
  }
    //    document.getElementById("main").style.paddingRight = "20px";
}

export default function Local() {
  const navigate = useNavigate();
  const [alert1, setAlert1] = createSignal(false);
  const [sortCol, setSortCol] = createSignal("kills");
  const [names, setNames] = createSignal(null);
  const [rid, setRid] = createSignal(null);
  // const [shipx] = createResource(fetchShips)
  
  // const [traitx] = createResource(fetchTraits)
  const [report_id] = createResource(names, submitReport);
  const [report, { mutate: reportMutate, refetch: reportRefetch }] = createResource(rid, fetchReport);
  const params = useParams();
  const { paste, setPaste } = usePasteContext();

  console.log("Entry->", paste(), params.id, rid(), names(), report_id(), report())
  if (paste().length > 0 && typeof params.id == "undefined") {
    // console.log("LOCAL TRUE->",paste())
    setNames(paste());
    setPaste([]);
  } else if (paste().length === 0 && typeof params.id !== "undefined") {
    setRid(params.id);
    // rid = params.id;
    console.log("params.id", params.id, rid())
    navigate("/local/" + params.id, { replace: true });
    // [chars,{ mutate, refetch }] = createResource(fetchReport(params.id))
  } else {
    navigate("/", { replace: true });
  }

  createEffect(() => {
    if (report_id() != null) {
        console.log("submitReport2==>", report_id())
        if (report_id.latest === "NONE") {
          setAlert1(true);
          return;
        }
        setRid(report_id());
        // rid = report_id()
        console.log("submitReport3==>", rid())
        navigate("/local/" + report_id(), { replace: true });
      }
    });
  createEffect(() => {
    console.log("params.id2", params.id, rid())
  })

  createEffect(() => {
    console.log("R_REPORT", report(), report.latest,report.length, report.loading);
    if (report.latest === "NONE") {
      setAlert1(true);
      return;
    }
    initFlowbite();
  });

  async function getZkill() {
    if (report() === 'NONE'){
      return;
    }
    try {
      console.log("GETZKILL:", report(), report.latest.length);
      var tmpReport = report();
      var tmpids = [];
      for (let i = 0; i < report.latest?.length; i++) {
        tmpids.push(tmpReport[i].id);
      }
      for (var id of tmpids) {
        tmpReport = report();
        var idx = tmpReport.findIndex((obj) => obj.id === id);
        var char = tmpReport[idx];
        console.log("FOR LOOP:",idx, id, tmpids, char, tmpReport);
        const result = await fetchZkill(id);
        console.log("BEFORE", report(),tmpReport, result);
        reportMutate((tmpReport) => {
          const updatedReport =
            idx !== -1
              ? [
                  ...tmpReport.slice(0, idx),
                  result,
                  ...tmpReport.slice(idx + 1),
                ]
              : tmpReport;

          let sorted = updatedReport; // Initialize sorted variable with updatedReport
          console.log("SORTED:", sorted)
          if (sortDir[sortCol()] === "D") {
            sorted = sort(updatedReport).desc((col) => col[sortCol()]);
          } else if (sortDir[sortCol()] ===  "A") {
            sorted = sort(updatedReport).asc((col) => col[sortCol()]);
          }
          console.log("AFTER-SORT", sorted)
          return sorted;
        });
        console.log("AFTER", report());
      }
      console.log("FINAL SORTED", report());
      // reportMutate(sorted);
      initFlowbite();
      console.log("LATEST", report(), sortDir, sortCol());
    } catch (error) {
      console.error("An error occurred in getZkill:", error);
    }
  };

  async function sortHandler(col, e) {
    console.log("SORTHANDLER", col, sortCol(), sortDir);
    setSortCol(col)

    try {
      console.log("SORTING:", report(), report.latest.length);
      var tmpReport = report();
        console.log("BEFORE", report(),tmpReport);
        reportMutate((tmpReport) => {
          let sorted = tmpReport; // Initialize sorted variable with updatedReport
          console.log("SORTED:", sorted)
          if (sortDir[sortCol()] === "D") {
            sorted = sort(tmpReport).desc((col) => col[sortCol()]);
          } else if (sortDir[sortCol()]  === "A") {
            sorted = sort(tmpReport).asc((col) => col[sortCol()]);
          }
          console.log("AFTER-SORT", sorted)
          sortDir[sortCol()] = (sortDir[sortCol()]  === "A") ? "D" : "A";
          return sorted;
        });
        console.log("AFTER", report());
      initFlowbite();
      console.log("LATEST", report(), sortDir, sortCol());
    } catch (error) {
      console.error("An error occurred in getZkill:", error);
    }
    initFlowbite();
    e.stopPropagation();
  }

  createEffect(async () => {
    var sndiv = document.getElementById("sidenavDiv")
    console.log("READY?", report.state, ulock, report.latest);
    if (
      report.state === "ready" &&
      ulock === false &&
      report.latest.length != undefined &&
      sndiv !== null
    ) {
      ulock = true;
      await getZkill();
    }
    console.log("LATEST2", report());
    initFlowbite();
  });

  function getAll(id) {
    var tmpReport = report();
    var idx = tmpReport.findIndex((obj) => obj.id === id);
    var char = tmpReport[idx];
    var outHtml = "";
    if (char.ships_all.length > 0) {
      outHtml +=
        '<div class="grid grid-cols-3 gap-0 rounded-t-lg text-xs text-gray-100 uppercase bg-gray-700">';
      outHtml +=
        '<div class="px-2">Kills</div><div class="col-span-2">Ship</div></div>';
      for (let shp of char.ships_all) {
        console.log(shp, shp.shipTypeID);
        var tName = shp.typeName;
        console.log(tName);
        outHtml +=
          '<div class="grid grid-cols-3 gap-0 bg-gray-800 border-b border-gray-700 text-gray-100">';
        outHtml += '<div class="px-2 text-gray-100">' + shp.kills + "</div>";
        outHtml +=
          '<div><img src="https://images.evetech.net/types/' +
          shp.shipTypeID +
          '/icon" title="' +
          tName +
          '" class="rounded w-8 h-8 border-0"></img></div>';
        outHtml += "<div>" + tName + "</div></div>";
      }
      return outHtml;
    } else {
      return (
        <div class="px-3 py-2">
          <p>
            <b>None</b>
          </p>
        </div>
      );
    }
  }

  function drawerHandler(id, e) {
    console.log("CLICK->", id);
    // closeAll();
    var wd = document.getElementById("mySidenav" + id).style.width;
    // var result = getAll(id);
    if (wd === "250px") {
      // document.getElementById("sidenavBody").innerHTML = "";
      closeNav(id);
    } else {
      // console.log("SHALL", result)
      // document.getElementById("sidenavBody").innerHTML = result;
      openNav(id);
    }
    e.stopPropagation();
    console.log(document.getElementById("mySidenav" + id).style.width);
  }

  function dismissHandler(e) {
    var a = document.getElementById("alert-1");
    a.style.opacity = 0;
    setTimeout(() => {
      a.hidden = true;
    }, 1000);
    e.stopPropagation();
    setAlert1(false);
    navigate("/", { replace: true });
  }
  var barWidth = 0;

  createEffect(() => {
    if (alert1() === true) {
      let checkInterval = setInterval(() => {
        if (document.getElementById("alert-1") !== null) {
          clearInterval(checkInterval);
          alertTimer();
        }
      });
      return;
    }
  });

  function alertTimer() {
    var bar = document.getElementById("alert-1-bar");
    console.log("BAR:", bar.offsetWidth);
    var fill = document.getElementById("alert-1-fill");
    setTimeout(() => {
      let intervalID = setInterval(() => {
        if (barWidth === 100) {
          clearInterval(intervalID);
          setAlert1(false);
          if (document.getElementById("alert-1") !== null) {
            dismissHandler();
          }
          setAlert1(false);
          navigate("/", { replace: true });
          return;
        } else {
          alertAnimate(bar, fill);
        }
      }, 100); //this sets the speed of the animation
    }, 1000);
  }

  const alertAnimate = (bar, fill) => {
    barWidth++;
    fill.style.width = `${barWidth}%`;
  };

  function clickHandler(e) {
    closeAll();
  }
  var idx;
  var ships_all;
  return (
    <div
      style="display: grid; grid-template-columns:1fr repeat(100, auto);"
      onClick={[clickHandler]}
    >
      
      <div style="width: 100%; margin-right: 10px;  height: 100%;">
        <header class="bg-verdigris z-0 rounded-t-md width: 100%;">
          <h3 class="text-xl rounded-md">Local</h3>
        </header>
        <span>{console.log("ALERT1:", alert1())}</span>
        <Show when={alert1() == true}>
          <div
            id="alert-1"
            onload={(e) => console.log("TARGET:", e.currentTarget)}
            class="flex flex-wrap items-center p-4 mb-4 mt-4 border-t-4 text-red-400 bg-gray-800 border-red-800"
            role="alert"
          >
            <svg
              class="flex-shrink-0 w-4 h-4"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
            </svg>
            <div class="ml-3 text-sm font-medium">
              This report does not exist! Paste a new list or submit a new
              report ID.
            </div>
            <button
              type="button"
              id="alert-1-btn"
              onClick={[dismissHandler]}
              class="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 focus:ring-red-400 p-1.5 inline-flex items-center justify-center h-8 w-8 bg-gray-800 text-red-400 hover:bg-gray-700"
              data-dismiss-target="#alert-1"
              aria-label="Close"
            >
              <span class="sr-only">Dismiss</span>
              <svg
                class="w-3 h-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
            </button>
            <div
              id="alert-1-bar"
              class="basis-full w-full bg-gray-200 rounded-full h-1.5 mb-2 mt-4 dark:bg-gray-700"
            >
              <div
                id="alert-1-fill"
                class="bg-blue-600 h-1.5 rounded-full dark:bg-blue-500"
                style=""
              ></div>
            </div>
          </div>
        </Show>
        {console.log("SHOW?", report.state, alert1())}
        <Show
          when={report.state === "ready" && alert1() === false}
          fallback={<p>Loading...</p>}
        >
          <div
            class="text-gray-400"
            style=" height: calc(100vh - 120px); overflow-y: auto;"
          >
            <table
              scope="table"
              class="text-sm text-left text-gray-400 border border-gray-700"
              style="table-layout: fixed; width: 100%; white-space: nowrap;"
            >
              <thead style="position: sticky; top: 0px;">
                <tr
                  scope="header row"
                  class="text-xs text-gray-400 uppercase font-bold bg-gray-700"
                  style=""
                >
                  <th scope="col" class="ml-1.5 px-2 py-2" style="width: 40px;">
                    <div
                      class="cursor-pointer inline-block items-center space-x-1"
                      style="width: 40px;"
                      onClick={[sortHandler, "security"]}
                    >
                      <span> Sec </span>
                      <i
                        class="fa-solid fa-sort fa-sm"
                        style="color: #9ca3af;"
                      ></i>
                    </div>
                  </th>
                  <th scope="col" class="ml-1.5 px-2 py-2 truncate">
                    <div
                      class="cursor-pointer inline-block items-center space-x-1"
                      onClick={[sortHandler, "name"]}
                    >
                      <span class="pe-2">Name </span>
                      <i
                        class="fa-solid fa-sort fa-sm"
                        style="color: #9ca3af;"
                      ></i>
                    </div>
                  </th>
                  <th scope="col" class="ml-1.5 px-2 py-2 truncate">
                    <div
                      class="cursor-pointer inline-block items-center space-x-1"
                      onClick={[sortHandler, "corp_name"]}
                    >
                      <span class="pe-2">Corp </span>
                      <i
                        class="fa-solid fa-sort fa-sm"
                        style="color: #9ca3af;"
                      ></i>
                    </div>
                  </th>
                  <th scope="col" class="ml-1.5 px-2 py-2 truncate">
                    <div
                      class="cursor-pointer inline-block items-center space-x-1"
                      onClick={[sortHandler, "alliance_name"]}
                    >
                      <span class="pe-2">Alliance </span>
                      <i
                        class="fa-solid fa-sort fa-sm"
                        style="color: #9ca3af;"
                      ></i>
                    </div>
                  </th>
                  <th scope="col" class="ml-1.5 px-2 py-2" style="width: 50px;">
                    <div
                      class="cursor-pointer inline-block items-center space-x-1"
                      onClick={[sortHandler, "faction_name"]}
                    >
                      <span class="pe-2">FW </span>
                      <i
                        class="fa-solid fa-sort fa-sm"
                        style="color: #9ca3af;"
                      ></i>
                    </div>
                  </th>
                  <th scope="col" class="ml-1.5 px-2 py-2" style="width: 4rem;">
                    <div
                      class="cursor-pointer inline-block items-center space-x-1"
                      onClick={[sortHandler, "kills"]}
                    >
                      <span class="pe-2 text-align: end;">Kills</span>
                      <i
                        class="fa-solid fa-sort fa-sm"
                        style="color: #9ca3af;"
                      ></i>
                    </div>
                  </th>
                  <th scope="col" class="ml-1.5 px-2 py-2" style="width: 4rem;">
                    <div
                      class="cursor-pointer inline-block items-center space-x-1"
                      onClick={[sortHandler, "losses"]}
                    >
                      <span class="pe-2 text-align: start;">Loss</span>
                      <i
                        class="fa-solid fa-sort fa-sm"
                        style="color: #9ca3af;"
                      ></i>
                    </div>
                  </th>
                  <th scope="col" class="ml-1.5 px-2 py-2" style="width: 4rem;">
                    <div
                      class="cursor-pointer inline-block items-center space-x-1"
                      onClick={[sortHandler, "solo"]}
                    >
                      <span class="pe-2">Solo </span>
                      <i
                        class="fa-solid fa-sort fa-sm"
                        style="color: #9ca3af;"
                      ></i>
                    </div>
                  </th>
                  <th scope="col" class="ml-1.5 px-2 py-2" style="width: 4rem;">
                    <div
                      class="cursor-pointer inline-block items-center space-x-1"
                      onClick={[sortHandler, "danger"]}
                    >
                      <span class="pe-2">Danger </span>
                      <i
                        class="fa-solid fa-sort fa-sm"
                        style="color: #9ca3af;"
                      ></i>
                    </div>
                  </th>
                  <th scope="col" class="ml-1.5 px-2 py-2" style="width: 4rem;">
                    <div
                      class="cursor-pointer inline-block items-center space-x-1"
                      onClick={[sortHandler, "gang"]}
                    >
                      <span class="pe-2">Gang </span>
                      <i
                        class="fa-solid fa-sort fa-sm"
                        style="color: #9ca3af;"
                      ></i>
                    </div>
                  </th>
                  <th scope="col" class="ml-1.5 px-2 py-2" style="">
                    <div
                      class="relative inline-block items-center"
                      style="width: 100%; height: 100%; white-space: nowrap; overflow-x: clip;"
                    >
                      <span style="white-space: nowrap; overflow-x: hidden; overflow-y: visible;">
                        Ships (last 7 days)
                      </span>
                      <div
                        style=""
                        class="absolute inline-flex items-center justify-center w-7 h-3.5 text-xs font-normal text-white bg-red-500 border-1 border-white rounded opacity-50 -top-2 -left-0 dark:border-gray-900"
                      >
                        Kills
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody style="overflow: auto;">
                <For each={report()}>
                  {(char, i) => (
                    <>
                      <tr
                        scope="row"
                        class="bg-gray-800 border-b border-gray-700"
                      >
                        <td scope="cell" class="ml-1.5 px-2 py-0" style="">
                          <Switch>
                            <Match when={char.security >= 0}>
                              <div
                                data-tooltip-target={"sec-" + char.id}
                                class="inline-flex items-center justify-center text-xs w-6 h-6 px-2 py-2 rounded-full bg-green-400 text-black"
                              >
                                <p>
                                  {(
                                    Math.round(
                                      (Number(char.security) + Number.EPSILON) *
                                        10
                                    ) / 10
                                  ).toFixed(1)}
                                </p>
                                {/* {char.security} */}
                                <div
                                  id={"sec-" + char.id}
                                  role="tooltip"
                                  class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
                                >
                                  {"Security Status: " +
                                    (
                                      Math.round(
                                        (Number(char.security) +
                                          Number.EPSILON) *
                                          1000
                                      ) / 1000
                                    ).toFixed(3)}
                                  <div
                                    class="tooltip-arrow"
                                    data-popper-arrow
                                  ></div>
                                </div>
                              </div>
                            </Match>
                            <Match
                              when={
                                char.security <= -0.0 && char.security > -2.0
                              }
                            >
                              <div
                                data-tooltip-target={"sec-" + char.id}
                                class="inline-flex items-center justify-center text-xs w-6 h-6 px-2 py-2 rounded-full bg-orange-400 text-black"
                              >
                                <p>
                                  {(
                                    Math.round(
                                      (Number(char.security) + Number.EPSILON) *
                                        10
                                    ) / 10
                                  ).toFixed(1)}
                                </p>
                                {/* {char.security} */}
                                <div
                                  id={"sec-" + char.id}
                                  role="tooltip"
                                  class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
                                >
                                  {"Security Status: " +
                                    (
                                      Math.round(
                                        (Number(char.security) +
                                          Number.EPSILON) *
                                          1000
                                      ) / 1000
                                    ).toFixed(3)}
                                  <div
                                    class="tooltip-arrow"
                                    data-popper-arrow
                                  ></div>
                                </div>
                              </div>
                            </Match>
                            <Match when={char.security <= -2.0}>
                              <div
                                data-tooltip-target={"sec-" + char.id}
                                class="inline-flex items-center justify-center text-xs w-6 h-6 px-2 py-2 rounded-full bg-red-600 text-black"
                              >
                                <p>
                                  {(
                                    Math.round(
                                      (Number(char.security) + Number.EPSILON) *
                                        10
                                    ) / 10
                                  ).toFixed(1)}
                                </p>
                                {/* {char.security} */}
                                <div
                                  id={"sec-" + char.id}
                                  role="tooltip"
                                  class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
                                >
                                  {"Security Status: " +
                                    (
                                      Math.round(
                                        (Number(char.security) +
                                          Number.EPSILON) *
                                          1000
                                      ) / 1000
                                    ).toFixed(3)}
                                  <div
                                    class="tooltip-arrow"
                                    data-popper-arrow
                                  ></div>
                                </div>
                              </div>
                            </Match>
                          </Switch>
                        </td>
                        <td
                          scope="cell"
                          class="ml-1.5 px-2 py-0 font-bold"
                          style=""
                        >
                          <a
                            class=""
                            style="display: flex; align-items: center; max-width: 100%;"
                            target="_blank"
                            href={`https://zkillboard.com/character/${char.id}/`}
                          >
                            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                              {char.name}
                            </span>
                          </a>
                        </td>
                        <td scope="cell" class="ml-1.5 px-2 py-0" style="">
                          <a
                            class=""
                            style="display: flex; flex-wrap: wrap; align-items: center; max-width: 100%;"
                            target="_blank"
                            href={`https://zkillboard.com/corporation/${char.corp_id}/`}
                          >
                            <img
                              src={
                                "https://images.evetech.net/corporations/" +
                                char.corp_id +
                                "/logo"
                              }
                              title={"" + char.corp_name + ""}
                              class="w-8 h-8 border-0 object-fit: contain;"
                            ></img>
                            <div style="flex-basis: 100%; height: 0;"></div>
                            <span
                              class="text-xs"
                              style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                            >
                              {char.corp_name}
                            </span>
                          </a>
                        </td>
                        <td scope="cell" class="ml-1.5 px-2 py-0" style="">
                          <Switch>
                            <Match when={char.alliance_id != 0}>
                              <a
                                class=""
                                style="display: flex; flex-wrap: wrap; align-items: center; max-width: 100%;"
                                target="_blank"
                                href={`https://zkillboard.com/alliance/${char.alliance_id}/`}
                              >
                                <img
                                  src={
                                    "https://images.evetech.net/alliances/" +
                                    char.alliance_id +
                                    "/logo"
                                  }
                                  title={"" + char.alliance_name + ""}
                                  class="w-8 h-8 border-0 object-fit: contain;"
                                ></img>
                                <div style="flex-basis: 100%; height: 0;"></div>
                                <span
                                  class="text-xs"
                                  style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                                >
                                  {char.alliance_name}
                                </span>
                              </a>
                            </Match>
                            <Match when={char.alliance_id === 0}></Match>
                          </Switch>
                        </td>
                        <td scope="cell" class="ml-1.5 px-2 py-0">
                          <Switch>
                            <Match when={char.faction_corp != 0}>
                              <a
                                class=""
                                style="display: flex; flex-wrap: wrap; align-items: center; max-width: 50px;"
                                target="_blank"
                                href={`https://zkillboard.com/corporation/${char.faction_corp}/`}
                              >
                                <img
                                  src={
                                    "https://images.evetech.net/corporations/" +
                                    char.faction_corp +
                                    "/logo"
                                  }
                                  title={"" + char.faction_name + ""}
                                  class="w-10 h-10 border-0 object-fit: contain;"
                                  style=""
                                ></img>
                              </a>
                            </Match>
                            <Match when={char.faction_corp === 0}></Match>
                          </Switch>
                        </td>
                        <td
                          scope="cell"
                          class="ml-1.5 px-2 py-0"
                          style="text-align: end;"
                        >
                          {char.kills}
                        </td>
                        <td
                          scope="cell"
                          class="ml-1.5 px-2 py-0"
                          style="text-align: start;"
                        >
                          {char.losses}
                        </td>
                        <td scope="cell" class="ml-1.5 px-2 py-0" style="">
                          {char.solo}
                        </td>
                        <td scope="cell" class="ml-1.5 px-2 py-0" style="">
                          {char.danger}
                        </td>
                        <td scope="cell" class="ml-1.5 px-2 py-0" style="">
                          {char.gang}
                        </td>
                        <td
                          scope="cell"
                          class="ml-1.5 px-2 py-0 relative"
                          style=""
                        >
                          <div class="flex space-x-1">
                            <div
                              style="right: 0px; top: 0px; height: 100%;"
                              class="absolute inline-flex items-center justify-right text-xs font-normal text-white bg-gray-700 border-1 border-white rounded dark:border-gray-900"
                            >
                              <div class="" style="height: 100%;">
                                <button
                                  type="button"
                                  onClick={[drawerHandler, char.id]}
                                  style="height: 100%;"
                                  class="align-middle text-gray-400 bg-gray-700 hover:bg-gray-200 hover:text-gray-900 rounded-l-lg text-sm px-0.5 py-6 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                                >
                                  <i
                                    class="cursor-pointer fa-solid fa-angle-left fa-sm"
                                    style="color: #31c48d; height: 100%;"
                                    title="Top Ships All Time."
                                    type="button"
                                  ></i>
                                  <span class="sr-only">
                                    Top Ships All Time.
                                  </span>
                                </button>
                              </div>
                            </div>
                            {/* {console.log("SHIP LENGTH", char.ships.length)} */}
                            {console.log("SHIP LIST", char.ships)}
                            <Switch>
                              <Match when={char.ships?.length != 0}>
                                <div
                                  class=""
                                  style="display: flex; overflow-x: clip;"
                                >
                                  <div style="width: 8px; white-space: pre;"></div>
                                  <For each={char.ships}>
                                    {(ship, z) => (
                                      <div
                                        class="relative pl-1.5"
                                        style="display: flex; flex: 0 0 auto;"
                                      >
                                        <div style="display: flex; flex: 0 0 auto; align-items: center; max-width: 100%;">
                                          <img
                                            data-popover-target={
                                              "sec-" +
                                              char.id +
                                              "-" +
                                              ship.shipTypeID
                                            }
                                            data-popover-placement="left"
                                            src={
                                              "https://images.evetech.net/types/" +
                                              ship.shipTypeID +
                                              "/icon"
                                            }
                                            title={"" + ship.shipName + ""}
                                            class="rounded border-0"
                                            style="display: block; max-width: 100%; width: 32px; height: 32px;"
                                          ></img>
                                          {/* <p>{console.log("SHIP=>",ship)}</p> */}
                                          {/* <p>{console.log("SHIPCACHE-", shipCache.get(ship.shipTypeID))}</p> */}
                                        </div>
                                        <div class="absolute inline-flex items-center justify-center w-3.5 h-3.5 text-xs font-normal text-white bg-red-500 border-1 border-white rounded opacity-60 -top-2 -left-0.5 dark:border-gray-900">
                                          {ship.kills}
                                        </div>
                                        <Portal>
                                          <div
                                            data-popover
                                            id={
                                              "sec-" +
                                              char.id +
                                              "-" +
                                              ship.shipTypeID
                                            }
                                            role="tooltip"
                                            class="absolute z-50 invisible inline-block w-96 text-sm text-gray-500 transition-opacity duration-300 delay-500 bg-white border border-gray-200 rounded-lg shadow-sm opacity-0 dark:text-gray-400 dark:border-gray-600 dark:bg-gray-800"
                                          >
                                            <div class="px-3 py-2 bg-gray-500 border-b border-gray-200 rounded-t-lg dark:border-gray-600 dark:bg-gray-700">
                                              <h3 class="font-semibold text-xs text-gray-200 dark:text-white">
                                                {ship.shipName}
                                              </h3>
                                            </div>
                                            <ShipInfo typeID={ship.shipTypeID} />
                                            {/* {shipInfo(ship.shipTypeID)} */}
                                            {/* <div class="px-3 py-2">
                                                    <p><b>Class:</b>{v = ships.get(ship.shipTypeID)}{v.groupName} </p>
                                                    <p><b>Group:</b>{v.parentGroupName +">" +v.marketGroupName} </p>
                                                </div> */}
                                            <div data-popper-arrow></div>
                                          </div>
                                        </Portal>
                                      </div>
                                    )}
                                  </For>
                                </div>
                              </Match>
                              <Match when={char.ships?.length === 0 || char.ships?.length == undefined}></Match>
                            </Switch>
                          </div>
                        </td>
                      </tr>
                    </>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </div>
      {/* <Show when={zkill.state === "ready" && alert1() === false}> */}
      <div id="sidenavDiv">
        {/* https://www.w3schools.com/howto/howto_js_sidenav.asp */}
        <For each={report()}>
          {(char, i) => (
            
            <div id={"mySidenav" + char.id} class="sidenav" hidden>
              <div id="sidenavBody" style="">
                    <div class="">
                      <div
                        class="bg-verdigris z-0 rounded-t-md"
                        style="position: relative;"
                      >
                        <a
                          href="javascript:void(0)"
                          class="closebtn"
                          onClick={[drawerHandler, char.id]}
                        >
                          <i
                            class="fa-solid fa-circle-xmark fa-sm"
                            style="color: #ea0611;"
                          ></i>
                        </a>
                        <p class="text-center font-bold">{char.name}</p>
                        <p class="text-center">Top all time</p>
                      </div>
                      <div class="grid grid-cols-3 gap-0 text-xs text-gray-100 uppercase bg-gray-700">
                        <div class="px-2">Kills</div>
                        <div class="col-span-2">Ship</div>
                      </div>
                    </div>
                    {/* {console.log("RPT:", ships, char.ships_all, shipx.latest[0]['653'])} */}
                     <For each={char.ships_all}>
                      {(shp, s) => (
                        <>
                        {/* {console.log("SHP:",shp,shp.shipTypeID, char, char.ships_all, ships)} */}
                          <div class="grid grid-cols-3 gap-0 bg-gray-800 border-b border-gray-700 text-gray-100">
                            <div class="px-2 text-gray-100">{shp.kills}</div>
                            <div>
                              <img
                                data-popover-target={
                                  "all-" + char.id + "-" + shp.shipTypeID
                                }
                                data-popover-placement="left"
                                src={
                                  "https://images.evetech.net/types/" +
                                  shp.shipTypeID +
                                  "/icon"
                                }
                                title={shp.shipName}
                                class="rounded w-8 h-8 border-0"
                              ></img>
                            </div>
                            <div class="pr-2">{shp.shipName}</div>
                          </div>
                          <Portal>
                            <div
                              data-popover
                              id={"all-" + char.id + "-" + shp.shipTypeID}
                              role="tooltip"
                              class="absolute z-50 invisible inline-block w-96 text-sm text-gray-500 transition-opacity duration-300 delay-300 bg-white border border-gray-200 rounded-lg shadow-sm opacity-0 dark:text-gray-400 dark:border-gray-600 dark:bg-gray-800"
                            >
                              <div class="px-3 py-2 bg-gray-500 border-b border-gray-200 rounded-t-lg dark:border-gray-600 dark:bg-gray-700">
                                <h3 class="font-semibold text-xs text-gray-200 dark:text-white">
                                {shp.shipName}
                                </h3>
                              </div>
                              <ShipInfo typeID={shp.shipTypeID}/>
                              {/* {shipInfo(shp.shipTypeID)} */}
                              <div data-popper-arrow></div>
                            </div>
                          </Portal>
                        </>
                      )}
                    </For>
              </div>
            </div>
          )}
        </For>
        {initFlowbite()}
      </div>
      {/* </Show> */}
    </div>
  );
}
