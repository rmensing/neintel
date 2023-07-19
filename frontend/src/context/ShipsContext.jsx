import { createContext, useContext, createComputed } from "solid-js";
import { fetchShips } from '../query/utils';
import { createStore } from "solid-js/store";

export const ShipsContext = createContext();
let ships;
function getShips(){
  return new Promise((resolve, reject) => {
    resolve(fetchShips());
  })
}
var shipx;
export function ShipsProvider(props) {
  const [ships, setShips] = createStore();

  createComputed(async () => {
    try {
      const result = await getShips();
      // console.log("RESULT:", result);
      setShips(result);
      // console.log("SHIPX2:", ships);
    } catch (error) {
      console.error(error);
    }
  });
  const shipx = [ships, setShips];
  return (
    <ShipsContext.Provider value={shipx}>
      {props.children}
    </ShipsContext.Provider>
  )
}

export function useShipsContext() {
  return useContext(ShipsContext);
}