import {createEffect, createResource, createSignal, createMemo, Show, on, Switch, Match, onCleanup, onMount, createDeferred} from "solid-js";
import { createStore, unwrap, reconcile, produce } from "solid-js/store";
import { usePasteContext } from "../context/PasteContext";
import { useNavigate } from "@solidjs/router";
import { Portal } from "solid-js/web";
import 'flowbite';
import { Drawer } from "flowbite";
import { initFlowbite } from 'flowbite'
import { useParams } from "@solidjs/router";
import _ from "lodash";

const [zkillSig, setZkillSig] = createSignal(false);
const [shall, setShall] = createSignal([]);
const ships = new Map();
const traits = new Map();
const zkill = new Map();
const [sortCol, setSortCol] = createSignal("kills");
var sortDir = "D";
var ulock = false;

/* Set the width of the side navigation to 250px and the left margin of the page content to 250px */
function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
    document.getElementById("main").style.paddingRight = "270px";
  }
  
  /* Set the width of the side navigation to 0 and the left margin of the page content to 0 */
function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("main").style.paddingRight = "20px";
  }

//submit data to create report and get a report ID
const submitReport = async (data) => {
    // console.log("test", JSON.stringify(data))
    // const res = await fetch('http://192.168.1.5:5000/report', {
        const res = await fetch(import.meta.env.VITE_API_URL +'/report', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json;charset=utf-8'
    },
    body: JSON.stringify(data)
    })
return res.json()
}

const fetchReport = async (id) => {
    const res = await fetch(import.meta.env.VITE_API_URL +'/report/'+ id, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        }
    })
    return res.json()
}

const fetchZkill = async (id) => {
    const res = await fetch(import.meta.env.VITE_API_URL +'/zkill/'+ id, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        }
    })
    return res.json()
}

const fetchShips = async () => {
    const res = await fetch(import.meta.env.VITE_API_URL +'/ships', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        }
    })
    var result = res.json()
    // console.log(import.meta.env.API_URL)
    // console.log("RES=>", result)
    return result
}

const fetchTraits = async () => {
    const res = await fetch(import.meta.env.VITE_API_URL +'/traits', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        }
    })
    var result = res.json()
    console.log("TRAITS=>", result)
    return result
}

function shipInfo(typeID){
    let v = ships.get(typeID)
    console.log("SHIPINFO:",typeID, v)
    let t = traits.get(typeID)
    let tt = t.traits
    var g = _.groupBy(tt, 'skilltypeID')
    console.log("GROUPS:", g)
    const jsx = [];
    if (v){
    jsx.push( <div class="">
    <p><b>Faction:&nbsp;</b>{v.factionName} </p>    
    <p><b>Group:&nbsp;</b>{v.parentGroupName} </p>
    <p><b>Class:&nbsp;</b>{v.groupName} </p>
    <br/><hr/><br/>
    </div>)
    } else {
        return <div class="px-3 py-2">
        <p><b>Faction:&nbsp;</b></p>    
        <p><b>Group:&nbsp;</b></p>
        <p><b>Class:&nbsp;</b></p>
        </div>
    }
    for (var lines in g){
        console.log("LINES:", lines)
        if(lines == '-1'){
            jsx.push(<p><b>Role Bonus: </b></p>)
            for (var item of g[lines]){
                var tmp = item.bonusText;
                var bText = tmp.replace(/<[^>]+>/g, '');
                jsx.push(
                    <p>&#9679;&nbsp;{item.hasOwnProperty('unitID')? item.bonus : ''}
                    {item.hasOwnProperty('unitID') && item.unitID === 1? 'm '
                    :item.hasOwnProperty('unitID') && item.unitID === 104 ? 'x ' 
                    :item.hasOwnProperty('unitID') && item.unitID === 105 ? '% '
                    :item.hasOwnProperty('unitID') && item.unitID === 139 ? '+ '
                    : ' '}
                    {bText}</p>
                )
            }
        } else {
            var first = true;
            for (item of g[lines]){
                first ? jsx.push(<p><b>{item.skillName + ' bonuses (per skill level):'}</b></p>)  : '';
                first = false;
                var tmp = item.bonusText;
                var bText = tmp.replace(/<[^>]+>/g, '');
                jsx.push(
                    <p>&#9679;&nbsp;{item.hasOwnProperty('unitID')? item.bonus : ''}
                    {item.hasOwnProperty('unitID') && item.unitID === 1? 'm '
                    :item.hasOwnProperty('unitID') && item.unitID === 104 ? 'x ' 
                    :item.hasOwnProperty('unitID') && item.unitID === 105 ? '% '
                    :item.hasOwnProperty('unitID') && item.unitID === 139 ? '+ '
                    : ' '}
                    {bText}</p>
                )
            }
        }
    }
    console.log("JSX:", jsx)
    return (<div class="text-xs px-3 py-2">{jsx}</div>);
}

function convertProxyObjectToPojo(proxyObj) {
    return _.cloneDeep(proxyObj);
  }

const [shipx] = createResource(fetchShips)
const [traitx] = createResource(fetchTraits)
const [reportStore, setReportStore] = createStore([]);

export default function Local() {

    const params = useParams()
    const {paste, setPaste} = usePasteContext()
    const navigate = useNavigate()
    const [rid, setRid] = createSignal(null)

    if(paste().length > 0 && typeof params.id == "undefined"){
        // console.log("LOCAL TRUE->",paste())
        var names = paste()
        setPaste([])
        var [report_id] = createResource(names, submitReport) 
        // console.log("submitReport==>", report_id)
        createEffect(on(report_id, (report_id) => {
            // console.log("submitReport2==>", report_id)
            setRid(report_id)
            // console.log("submitReport3==>", rid())
            navigate('/local/'+ report_id, { replace: true })
        }, { defer: true }))
        
    } else if (paste().length === 0 && typeof params.id !== "undefined"){
        setRid(params.id)
        navigate('/local/'+ params.id, { replace: true })
        // [chars,{ mutate, refetch }] = createResource(fetchReport(params.id))  
    } else {
        navigate('/', { replace: true })
    }

    const [report, {mutate, refetch}] = createResource(rid, fetchReport);

    createEffect(() => {
        console.log("R_REPORT", report.latest, report.loading)
        if (report.latest != undefined && reportStore.length == 0){
        setReportStore(convertProxyObjectToPojo(report()));
        }
        console.log("SETSTORE:", reportStore)
        initFlowbite();
    })

    async function sortReport(rptTmp){
        // const rptTmp = reportStore || [];
        console.log("rpttmp", rptTmp, sortCol(), sortDir,  rptTmp[0][sortCol()])
        if (rptTmp.length <= 1){
            sortedReport = rptTmp;
            console.log("SORTED", sortedReport)
            return sortedReport;
        }
        if (sortCol() === "name" || sortCol() === "alliance_name" || sortCol() === "corp_name" || sortCol() === "faction_name") {
            switch (sortDir) {
                case "D":
                    var sortedReport =  await rptTmp.slice().sort((a,b)=> {
                        console.log(b[sortCol()], a[sortCol()])
                        const nameA = a[sortCol()].toUpperCase();
                        const nameB = b[sortCol()].toUpperCase();
                        if (nameA < nameB) {
                            return -1;
                        }
                        if (nameA > nameB) {
                            return 1;
                        }
                        return 0;
                    });
                    break;
                case "A":
                    var sortedReport =  await rptTmp.slice().sort((a,b)=> {
                        console.log(b[sortCol()], a[sortCol()])
                        const nameA = a[sortCol()].toUpperCase();
                        const nameB = b[sortCol()].toUpperCase();
                        if (nameA > nameB) {
                            return -1;
                        }
                        if (nameA < nameB) {
                            return 1;
                        }
                        return 0;
                    });
                    break;
            }
        } else {
            switch (sortDir) {
                case "D":
                    var sortedReport =  await rptTmp.slice().sort((a,b)=> {
                        console.log(b[sortCol()], a[sortCol()])
                        return b[sortCol()] - a[sortCol()];
                    });
                    break;
                case "A":
                    var sortedReport =  await rptTmp.slice().sort((a,b)=> {
                        console.log(a[sortCol()], b[sortCol()])
                        return a[sortCol()] - b[sortCol()];
                    });
                    break;
            }
        }
        console.log("SORTED", sortedReport)
        return sortedReport;
    };

    createEffect(() => {
        if (shipx.state === 'ready'){
            for (let s of shipx()){
                ships.set(s.typeID, s);
            }
            // ships.set(670, {
            //     "typeID": 670,
            //     "typeName": "Capsule",
            //     "groupName": "Capsule",
            //     "marketGroupName": "",
            //     "parentGroupName": "",
            //     "raceName": ""
            // })
        }
    })

    createEffect(() => {
        if (traitx.state === 'ready'){
            console.log("TRAITX:", traitx())
            for (let t of traitx()){
                traits.set(t.typeID, t);
            }
            console.log("TRAITX2:", traits.entries())
        }
    })

async function getZkill(){
    try {
        console.log("GETZKILL:", reportStore, reportStore.length);
        var tmpReport = reportStore;
        var tmpids = [];
        for (let i = 0; i < reportStore.length; i++){
            tmpids.push(tmpReport[i].id);
        }
        for (var id of tmpids){
            var idx = tmpReport.findIndex(obj => obj.id === id)
            var char = tmpReport[idx];
            console.log("FOR LOOP:", char, tmpReport, reportStore)
            const result = await fetchZkill(id);
            console.log("zkill", result)
            var shipsSeven = [];
            var ships_all = [];
            if(result.topLists[3].values.length > 0){
                shipsSeven =  result.topLists[3].values
            }
            if (result.hasOwnProperty("topAllTime") && result.topAllTime != null) {
                if(result.topAllTime[4].data.length > 0){
                    ships_all =  result.topAllTime[4].data
                }
            }

            setReportStore(
                idx,
                produce((rs) => {
                    rs.kills = result.shipsDestroyed ?? 0
                    rs.losses = result.shipsLost ?? 0
                    rs.solo = result.soloKills ?? 0
                    rs.gang = result.gangRatio ?? 0
                    rs.danger = result.dangerRatio ?? 0
                    rs.ships = shipsSeven
                    rs.ships_all = ships_all
                    rs.zkill_stats = result
                    rs.z_dt = new Date()
                })
            );
            sortDir = "D";
            const sorted = await sortReport(reportStore);
            console.log("FINAL SORTED", sorted);
            setReportStore(reconcile(sorted));
        }
        console.log("LATEST", reportStore)
        initFlowbite();
    } catch (error){
        console.error("An error occurred in getZkill:", error);
    }
}

async function sortHandler(col, e) {
    console.log("SORTHANDLER", col, sortCol(), sortDir)
    if (sortCol() != col) {
        sortDir = "D";        
    } else if (sortCol() === col && sortDir === "A"){
        sortDir = "D";
    } else if (sortCol() === col && sortDir === "D"){
        sortDir = "A";
    }
    setSortCol(col);
    const sorted = await sortReport(reportStore);
    console.log("FINAL SORTED", sorted);
    setReportStore(reconcile(sorted));
    initFlowbite();
}

    createEffect(async () => {
        console.log("READY?", report.state, ulock, report.latest)
        if(report.state === "ready" && ulock === false && report.latest.length != undefined){
            ulock = true;
            await getZkill();
        }
        console.log("LATEST2", reportStore)
        initFlowbite();
    })

    function getAll(id) {
        var tmpReport = reportStore;
        var idx = tmpReport.findIndex(obj => obj.id === id)
        var char = tmpReport[idx];
        var outHtml = "";
        if (char.ships_all.length > 0) {
            outHtml += '<div class="grid grid-cols-3 gap-0 rounded-t-lg text-xs text-gray-100 uppercase bg-gray-700">'
            outHtml += '<div class="px-2">Kills</div><div class="col-span-2">Ship</div></div>'
            for (let shp of char.ships_all){
                console.log(shp, shp.shipTypeID)
                var tName = ships.get(shp.shipTypeID).typeName
                console.log(tName)
                outHtml += '<div class="grid grid-cols-3 gap-0 bg-gray-800 border-b border-gray-700 text-gray-100">'
                outHtml += '<div class="px-2 text-gray-100">'+ shp.kills +'</div>'
                outHtml += '<div><img src="https://images.evetech.net/types/'+ shp.shipTypeID +'/icon" title="'+ tName +'" class="rounded w-8 h-8 border-0"></img></div>'
                outHtml += '<div>'+ tName +'</div></div>'
            }
            return outHtml
        } else {
            return (
            <div class="px-3 py-2">
            <p><b>None</b></p>
            </div>
            )
        }
    }

    function drawerHandler(id, e) {
        console.log("CLICK->", id)
        var wd = document.getElementById("mySidenav").style.width
        var result = getAll(id);
        if (wd === "250px"){
            document.getElementById("sidenavBody").innerHTML = "";
            closeNav()
        } else {
            console.log("SHALL", result)
            document.getElementById("sidenavBody").innerHTML = result;
            openNav()
        }
        
        console.log(document.getElementById("mySidenav").style.width)
    }

    return (
        <div>
            <Show when={reportStore.length > 0} fallback={<p>Loading...</p>}>
                    <div class="bg-gunmetal text-gray-400" style="">
                        <table scope="table" class="text-sm text-left text-gray-400 border border-gray-700" style="table-layout: fixed; width: 100%; white-space: nowrap;">
                            <thead>
                                <tr scope="header row" class="text-xs text-gray-400 uppercase font-bold bg-gray-700">
                                    <th scope="col" class="ml-1.5 px-2 py-2" style="width: 40px;">
                                        <div class="cursor-pointer inline-block items-center space-x-1"  style="width: 40px;" onClick={[sortHandler, 'security']}><span> Sec </span><i class="fa-solid fa-sort fa-sm" style="color: #9ca3af;"></i></div>
                                    </th>
                                    <th scope="col" class="ml-1.5 px-2 py-2 truncate" >
                                        <div class="cursor-pointer inline-block items-center space-x-1"  onClick={[sortHandler, 'name']}><span class="pe-2">Name </span><i class="fa-solid fa-sort fa-sm" style="color: #9ca3af;"></i></div>
                                    </th>
                                    <th scope="col" class="ml-1.5 px-2 py-2 truncate" >
                                        <div class="cursor-pointer inline-block items-center space-x-1" onClick={[sortHandler, 'corp_name']}><span class="pe-2">Corp </span><i class="fa-solid fa-sort fa-sm" style="color: #9ca3af;"></i></div>
                                    </th>
                                    <th scope="col" class="ml-1.5 px-2 py-2 truncate" >
                                        <div class="cursor-pointer inline-block items-center space-x-1" onClick={[sortHandler, 'alliance_name']}><span class="pe-2">Alliance </span><i class="fa-solid fa-sort fa-sm" style="color: #9ca3af;"></i></div>
                                    </th>
                                    <th scope="col" class="ml-1.5 px-2 py-2" style="width: 50px;">
                                        <div class="cursor-pointer inline-block items-center space-x-1"  onClick={[sortHandler, 'faction_name']}><span class="pe-2">FW </span><i class="fa-solid fa-sort fa-sm" style="color: #9ca3af;"></i></div>
                                    </th>
                                    <th scope="col" class="ml-1.5 px-2 py-2" style="width: 4rem;">
                                        <div class="cursor-pointer inline-block items-center space-x-1" onClick={[sortHandler, 'kills']}><span class="pe-2 text-align: end;">Kills</span><i class="fa-solid fa-sort fa-sm" style="color: #9ca3af;"></i></div>
                                    </th>
                                    <th scope="col" class="ml-1.5 px-2 py-2" style="width: 4rem;">
                                        <div class="cursor-pointer inline-block items-center space-x-1" onClick={[sortHandler, 'losses']}><span class="pe-2 text-align: start;">Loss</span><i class="fa-solid fa-sort fa-sm" style="color: #9ca3af;"></i></div>
                                    </th>
                                    <th scope="col" class="ml-1.5 px-2 py-2" style="width: 4rem;">
                                        <div class="cursor-pointer inline-block items-center space-x-1" onClick={[sortHandler, 'solo']}><span class="pe-2">Solo </span><i class="fa-solid fa-sort fa-sm" style="color: #9ca3af;"></i></div>
                                    </th>
                                    <th scope="col" class="ml-1.5 px-2 py-2" style="width: 4rem;">
                                        <div class="cursor-pointer inline-block items-center space-x-1" onClick={[sortHandler, 'danger']}><span class="pe-2">Danger </span><i class="fa-solid fa-sort fa-sm" style="color: #9ca3af;"></i></div>
                                    </th>
                                    <th scope="col" class="ml-1.5 px-2 py-2" style="width: 4rem;">
                                        <div class="cursor-pointer inline-block items-center space-x-1" onClick={[sortHandler, 'gang']}><span class="pe-2">Gang </span><i class="fa-solid fa-sort fa-sm" style="color: #9ca3af;"></i></div>
                                    </th>
                                    <th scope="col" class="ml-1.5 px-2 py-2" style="">
                                        <div class="relative inline-block items-center" style="width: 100%; height: 100%; white-space: nowrap; overflow-x: clip;">
                                        <span style="white-space: nowrap; overflow-x: hidden; overflow-y: visible;">Ships (last 7 days)</span>
                                        <div style="" class="absolute inline-flex items-center justify-center w-7 h-3.5 text-xs font-normal text-white bg-red-500 border-1 border-white rounded opacity-50 -top-2 -left-0 dark:border-gray-900">
                                            Kills
                                        </div>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                                <tbody>
                            <For each={reportStore}>
                                {(char,i) => (
                                <>
                                    <tr scope="row" class="bg-gray-800 border-b border-gray-700">
                                        <td scope="cell" class="ml-1.5 px-2 py-0" style="">
                                            <Switch>
                                                <Match when={char.security >= 0}>
                                                    <div data-tooltip-target={"sec-"+ char.id} class="inline-flex items-center justify-center text-xs w-6 h-6 px-2 py-2 rounded-full bg-green-400 text-black">
                                                    <p>{(Math.round((Number(char.security) + Number.EPSILON)*10)/10).toFixed(1)}</p>
                                                    {/* {char.security} */}
                                                    <div id={"sec-"+ char.id} role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                                                            {"Security Status: "+(Math.round((Number(char.security) + Number.EPSILON)*1000)/1000).toFixed(3)}
                                                        <div class="tooltip-arrow" data-popper-arrow></div>
                                                    </div>
                                                    </div>
                                                </Match>
                                                <Match when={char.security <= -0.0 && char.security > -2.0}>
                                                    <div data-tooltip-target={"sec-"+ char.id} class="inline-flex items-center justify-center text-xs w-6 h-6 px-2 py-2 rounded-full bg-orange-400 text-black">
                                                    <p>{(Math.round((Number(char.security) + Number.EPSILON)*10)/10).toFixed(1)}</p>
                                                    {/* {char.security} */}
                                                    <div id={"sec-"+ char.id} role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                                                            {"Security Status: "+(Math.round((Number(char.security) + Number.EPSILON)*1000)/1000).toFixed(3)}
                                                        <div class="tooltip-arrow" data-popper-arrow></div>
                                                    </div>
                                                    </div>
                                                </Match>
                                                <Match when={char.security <= -2.0}>
                                                    <div data-tooltip-target={"sec-"+ char.id} class="inline-flex items-center justify-center text-xs w-6 h-6 px-2 py-2 rounded-full bg-red-600 text-black">
                                                    <p>{(Math.round((Number(char.security) + Number.EPSILON)*10)/10).toFixed(1)}</p>
                                                    {/* {char.security} */}
                                                    <div id={"sec-"+ char.id} role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                                                            {"Security Status: "+(Math.round((Number(char.security) + Number.EPSILON)*1000)/1000).toFixed(3)}
                                                        <div class="tooltip-arrow" data-popper-arrow></div>
                                                    </div>
                                                    </div>
                                                </Match>
                                            </Switch>                                    
                                        </td>
                                        <td scope="cell" class="ml-1.5 px-2 py-0 font-bold" style="">
                                            <a class="" style="display: flex; align-items: center; max-width: 100%;" target="_blank" href={`https://zkillboard.com/character/${char.id}/`}>
                                                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{char.name}</span>
                                            </a>
                                        </td>
                                        <td scope="cell" class="ml-1.5 px-2 py-0" style="">
                                            <a class="" style="display: flex; flex-wrap: wrap; align-items: center; max-width: 100%;" target="_blank" href={`https://zkillboard.com/corporation/${char.corp_id}/`}>
                                            <img src={"https://images.evetech.net/corporations/"+ char.corp_id +"/logo"}
                                                        title={""+ char.corp_name +""} class="w-8 h-8 border-0 object-fit: contain;"></img>
                                                        <div style="flex-basis: 100%; height: 0;"></div>
                                                        <span class="text-xs" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{char.corp_name}</span>
                                            </a>
                                        </td>
                                        <td scope="cell" class="ml-1.5 px-2 py-0" style="">
                                            <Switch>
                                                <Match when={char.alliance_id != 0}>
                                                    <a class="" style="display: flex; flex-wrap: wrap; align-items: center; max-width: 100%;" target="_blank" href={`https://zkillboard.com/alliance/${char.alliance_id}/`}>
                                                    <img src={"https://images.evetech.net/alliances/"+ char.alliance_id +"/logo"}
                                                    title={""+ char.alliance_name +""} class="w-8 h-8 border-0 object-fit: contain;"></img>
                                                    <div style="flex-basis: 100%; height: 0;"></div>
                                                    <span class="text-xs" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{char.alliance_name}</span>
                                                    </a>
                                                </Match>
                                                <Match when={char.alliance_id === 0}>

                                                </Match>
                                            </Switch>
                                        </td>
                                        <td scope="cell" class="ml-1.5 px-2 py-0">
                                            <Switch>
                                                <Match when={char.faction_corp != 0}>
                                                <a class="" style="display: flex; flex-wrap: wrap; align-items: center; max-width: 50px;" target="_blank" href={`https://zkillboard.com/corporation/${char.faction_corp}/`}>
                                                    <img src={"https://images.evetech.net/corporations/"+ char.faction_corp +"/logo"}
                                                    title={""+ char.faction_name +""} class="w-10 h-10 border-0 object-fit: contain;" style=""></img>
                                                </a>
                                                </Match>
                                                <Match when={char.faction_corp === 0}>

                                                </Match>
                                            </Switch>
                                        </td>
                                        <td scope="cell" class="ml-1.5 px-2 py-0" style="text-align: end;">
                                        {char.kills}
                                        </td>
                                        <td scope="cell" class="ml-1.5 px-2 py-0" style="text-align: start;">
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
                                        <td scope="cell" class="ml-1.5 px-2 py-0 relative" style="">
                                            <div class="flex space-x-1">
                                            <div style="right: 0px; top: 0px; height: 100%;" class="absolute inline-flex items-center justify-right text-xs font-normal text-white bg-gray-700 border-1 border-white rounded dark:border-gray-900">
                                                <div class="" style="height: 100%;">
                                                    <button type="button" onClick={[drawerHandler,char.id]} style="height: 100%;" class="align-middle text-gray-400 bg-gray-700 hover:bg-gray-200 hover:text-gray-900 rounded-l-lg text-sm px-0.5 py-6 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white">
                                                        <i class="cursor-pointer fa-solid fa-angle-left fa-sm" style="color: #31c48d; height: 100%;" title="Top Ships All Time." type="button"></i>
                                                        <span class="sr-only">Top Ships All Time.</span>
                                                    </button>
                                                </div>
                                            </div>
                                                {console.log("SHIP LENGTH",char.ships.length)}
                                                {console.log("SHIP LIST",char.ships)}
                                                <Switch>
                                                    <Match when={char.ships.length != 0}>
                                                    <div class="" style="display: flex; overflow-x: clip;">
                                                        <div style="width: 8px; white-space: pre;"></div>
                                                        <For each={char.ships}>
                                                            {(ship,z) => (
                                                                <div class="relative" style="display: flex; flex: 0 0 auto;">
                                                                    <div style="display: flex; flex: 0 0 auto; align-items: center; max-width: 100%;">
                                                                        <img data-popover-target={"sec-"+ char.id +"-"+ ship.shipTypeID} data-popover-placement="left" src={"https://images.evetech.net/types/"+ ship.shipTypeID +"/icon"}
                                                                        title={""+ ship.shipName +""} class="rounded border-0" style="display: block; max-width: 100%; width: 32px; height: 32px;"></img>
                                                                        {/* <p>{console.log("SHIP=>",ship)}</p> */}
                                                                        {/* <p>{console.log("SHIPCACHE-", shipCache.get(ship.shipTypeID))}</p> */}
                                                                    </div>
                                                                    <div class="absolute inline-flex items-center justify-center w-3.5 h-3.5 text-xs font-normal text-white bg-red-500 border-1 border-white rounded opacity-60 -top-2 -left-2 dark:border-gray-900">
                                                                        {ship.kills}
                                                                    </div>
                                                                    <Portal>
                                                                        <div data-popover id={"sec-"+ char.id +"-"+ ship.shipTypeID} role="tooltip" class="absolute z-50 invisible inline-block w-96 text-sm text-gray-500 transition-opacity duration-300 bg-white border border-gray-200 rounded-lg shadow-sm opacity-0 dark:text-gray-400 dark:border-gray-600 dark:bg-gray-800">
                                                                            <div class="px-3 py-2 bg-gray-500 border-b border-gray-200 rounded-t-lg dark:border-gray-600 dark:bg-gray-700">
                                                                                <h3 class="font-semibold text-xs text-gray-200 dark:text-white">{ship.shipName}</h3>
                                                                            </div>
                                                                            {shipInfo(ship.shipTypeID)}
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
                                                    <Match when={char.ships.length === 0}>

                                                    </Match>
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
            <div>
            {/* <Portal> */}
            {/* https://www.w3schools.com/howto/howto_js_sidenav.asp */}
                <div id="mySidenav" class="sidenav">
                <a href="javascript:void(0)" class="closebtn" onClick={[closeNav]}>&times;</a>
                <div id="sidenavBody">

                </div>
                </div>
            {/* </Portal> */}
            </div>
        </div>
    )
}