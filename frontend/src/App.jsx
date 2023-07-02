import Welcome from './pages/Welcome';
import Local from './pages/Local';
import Dscan from './pages/Dscan';
import Probe from './pages/Probe';
import Cargo from './pages/Cargo';
import { createSignal, createEffect } from "solid-js";
import { Routes, Route, useNavigate, A } from "@solidjs/router";
import { usePasteContext } from "./context/PasteContext";
import 'flowbite';

function App() {
  const {paste, setPaste} = usePasteContext()
  const navigate = useNavigate()


  function handleClipboard(event){
    var str = (event.clipboardData || window.clipboardData).getData("text")
    if (str.length > 0){
      var result = []
      result = str.split(/[\r\n]+/)
      setPaste(result)
      let reslen = result[0].split('\t').length
      // console.log("length=>", reslen)
      switch (reslen){
        case 1:
          navigate('/local', { replace: true })
          break;
        case 4:
          navigate('/dscan', { replace: true })
          break;
        case 6:
          navigate('/probe', { replace: true })
          break;
        case 8:
          navigate('/cargo', { replace: true })
          break;
      }
    } else {
      alert("Clipboard must contain valid data!")
    }
  }

  createEffect(() => {
    console.log("APP->", paste())
  })

  return (
    <div id="main" class="w-full z-0 m-auto bg-midnight font-sans" style="height: 100%;" onPaste={handleClipboard}>
      <header class="bg-verdigris z-0 rounded-t-md">
        <h3 class="text-2xl rounded-md">New Eden Intel</h3>
        <a class="font-bold" href="/">Home</a>
      </header>
        <Routes>
          <Route path="/" component={Welcome} />
          <Route path="/local" component={Local}/>
          <Route path="/local/:id" component={Local}/>
          <Route path="/dscan" component={Dscan}/>
          <Route path="/probe" component={Probe}/>
          <Route path="/cargo" component={Cargo}/>
        </Routes>
    </div>
  );
}

export default App;