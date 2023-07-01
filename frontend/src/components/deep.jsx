import { createStore, reconcile, unwrap } from "solid-js/store"
export function createDeepSignal(value) {
  const [store, setStore] = createStore({
    value
  })
  return [
    () => store.value,
    v => {
      const unwrapped = unwrap(store.value)
      typeof v === "function" && (v = v(unwrapped))
      setStore("value", reconcile(v))
      return store.value
    }
  ]
}