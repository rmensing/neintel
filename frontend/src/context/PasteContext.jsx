import { createContext, useContext, createSignal } from "solid-js";


export const PasteContext = createContext([])

export function PasteProvider(props) {
  const [paste, setPaste] = createSignal([])

  return (
    <PasteContext.Provider value={{ paste, setPaste }}>
      {props.children}
    </PasteContext.Provider>
  )
}

export function usePasteContext() {
  return useContext(PasteContext)
}