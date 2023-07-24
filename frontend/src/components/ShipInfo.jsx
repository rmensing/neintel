import { createSignal, createEffect } from 'solid-js';
import { groupBy } from "lodash";
import "flowbite";
import { useShipsContext } from '../context/ShipsContext';


const ShipInfo = (props) => { 
  const [ships, setShips] = useShipsContext();
    // console.log("SHIPS--->:", ships)
  

    const [typeID, setTypeID] = createSignal(props.typeID);
    const [result, setResult] = createSignal(null);
    async function shipInfo(typeID) {
        // console.log("SHIPS", ships)
        let tid = typeID.toString();
        let v = ships[tid]
        // console.log("SHPINFO:",typeID,tid, v)
        // let t = traits.get(typeID)
        let tt = v?.traits;
        var g = groupBy(tt, "skilltypeID");
        // console.log("TRAITS:", traits)
        // console.log("GROUPS:", g, tt);
        const jsx = [];
        if (v) {
          jsx.push(
            <div class="">
              <p>
                <b>Faction:&nbsp;</b>
                {v.factionName}{" "}
              </p>
              <p>
                <b>Group:&nbsp;</b>
                {v.parentGroupName}{" "}
              </p>
              <p>
                <b>Class:&nbsp;</b>
                {v.groupName}{" "}
              </p>
              <br />
              <hr />
              <br />
            </div>
          );
        } else {
          return (
            <div class="px-3 py-2">
              <p>
                <b>Faction:&nbsp;</b>
              </p>
              <p>
                <b>Group:&nbsp;</b>
              </p>
              <p>
                <b>Class:&nbsp;</b>
              </p>
            </div>
          );
        }
        for (var lines in g) {
          // console.log("LINES:", lines);
          if (lines == "-1") {
            jsx.push(
              <p>
                <b>Role Bonus: </b>
              </p>
            );
            for (var item of g[lines]) {
              // console.log("ITEMS:", item)
              var tmp = item.bonusText;
              var bText = tmp.replace(/<[^>]+>/g, "");
              jsx.push(
                <p>
                  &#9679;&nbsp;{item.hasOwnProperty("unitID") ? item.bonus : ""}
                  {item.hasOwnProperty("unitID") && item.unitID === 1
                    ? "m "
                    : item.hasOwnProperty("unitID") && item.unitID === 104
                    ? "x "
                    : item.hasOwnProperty("unitID") && item.unitID === 105
                    ? "% "
                    : item.hasOwnProperty("unitID") && item.unitID === 139
                    ? "+ "
                    : " "}
                  {bText}
                </p>
              );
            }
          } else {
            var first = true;
            for (item of g[lines]) {
              first
                ? jsx.push(
                    <p>
                      <b>{item.skillName + " bonuses (per skill level):"}</b>
                    </p>
                  )
                : "";
              first = false;
              var tmp = item.bonusText;
              var bText = tmp.replace(/<[^>]+>/g, "");
              jsx.push(
                <p>
                  &#9679;&nbsp;{item.hasOwnProperty("unitID") ? item.bonus : ""}
                  {item.hasOwnProperty("unitID") && item.unitID === 1
                    ? "m "
                    : item.hasOwnProperty("unitID") && item.unitID === 104
                    ? "x "
                    : item.hasOwnProperty("unitID") && item.unitID === 105
                    ? "% "
                    : item.hasOwnProperty("unitID") && item.unitID === 139
                    ? "+ "
                    : " "}
                  {bText}
                </p>
              );
            }
          }
        }
        // console.log("JSX:", jsx);
        // return <div class="text-xs px-3 py-2">{jsx}</div>;
        return jsx;
      };

    createEffect(async () => {
        const jsx = await shipInfo(typeID());
        setResult(jsx); // Update the result signal with the shipData
        
        // console.log("SHIPINFO-INSIDE:",result);
    });
    // console.log("SHIPINFO-OUT:",result());
    return <div class="text-xs px-3 py-2">{result()}</div>;
}

export default ShipInfo;